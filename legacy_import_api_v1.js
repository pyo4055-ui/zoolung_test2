// Authenticated parent bridge + browser-local draft store. No credentials are embedded.
(()=>{'use strict';
const M=window.ZRLegacyModel;let dbPromise;
function host(){const p=window.parent;if(p===window||!p.zrReservationFirebase?.isStaff())throw Error('관리자 사이트에서 로그인 후 이용해주세요.');return p}
function key(){return host().zrReservationFirebase.user.uid}
function database(){return dbPromise||(dbPromise=new Promise((resolve,reject)=>{const q=indexedDB.open('zr-legacy-drafts-v1',1);q.onupgradeneeded=()=>q.result.createObjectStore('drafts');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)}))}
async function localState(){const db=await database(),id=key();return new Promise((resolve,reject)=>{const q=db.transaction('drafts').objectStore('drafts').get(id);q.onsuccess=()=>resolve(q.result||{rows:[]});q.onerror=()=>reject(q.error)})}
async function sharedState(){
 const p=host(),z=p.zrReservationFirebase,F=await p.ZRLegacyFirebase(),uid=z.user.uid;
 const local=await localState(),db=await database();
 const migrated=await new Promise((resolve,reject)=>{const q=db.transaction('drafts').objectStore('drafts').get(uid+':shared-v1');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
 if(!migrated){
  let migratedCount=0;for(const row of local.rows||[]){window.dispatchEvent(new CustomEvent('legacy-progress',{detail:`기존 업로드 목록을 공용 저장소로 옮기는 중 ${++migratedCount} / ${local.rows.length}건`}));const ref=F.doc(z.db,'legacyImportDrafts',String(row.id));await F.runTransaction(z.db,async tx=>{if(!(await tx.get(ref)).exists())tx.set(ref,p.JSON.parse(JSON.stringify({row:JSON.stringify(row),deleted:false})))})}
  await new Promise((resolve,reject)=>{const t=db.transaction('drafts','readwrite');t.objectStore('drafts').put(true,uid+':shared-v1');t.oncomplete=resolve;t.onerror=()=>reject(t.error)});
 }
 const snap=await F.getDocs(F.collection(z.db,'legacyImportDrafts'));sharedBaseline=new Map(snap.docs.map(d=>[d.id,d.data()]));
 const rows=[...sharedBaseline.values()].filter(d=>!d.deleted&&d.row).map(d=>JSON.parse(d.row));
 // Recover registered import history even when opening a new browser before the original drafts sync.
 const bookings=await F.getDocs(F.collection(z.db,'reservations'));
 for(const doc of bookings.docs){const b=doc.data(),x=b.legacyImport;if(!x||rows.some(r=>r.bookingId===doc.id||r.source===x.source))continue;rows.push({id:doc.id,bookingId:doc.id,source:x.source,year:x.year,month:x.month,data:x.edited||x.original,originalData:x.original,cafe:b.cafe?.items||[],saved:true,registered:true,errors:{}})}
 if(z.user?.uid!==uid)throw Error('로그인 정보가 변경되었습니다. 다시 열어주세요.');return {rows};
}
let sharedBaseline=new Map();
async function persist(s){
 const p=host(),z=p.zrReservationFirebase,F=await p.ZRLegacyFirebase(),next=new Map(s.rows.map(r=>[String(r.id),{row:JSON.stringify(r),deleted:false}]));
 const changes=[];for(const[id,value]of next)if(JSON.stringify(sharedBaseline.get(id))!==JSON.stringify(value))changes.push([id,value]);for(const[id,value]of sharedBaseline)if(!next.has(id)&&!value.deleted)changes.push([id,{deleted:true}]);
 for(let i=0;i<changes.length;i+=100){const chunk=changes.slice(i,i+100);await F.runTransaction(z.db,async tx=>{const docs=[];for(const[id,value]of chunk){const ref=F.doc(z.db,'legacyImportDrafts',id),snap=await tx.get(ref),before=sharedBaseline.get(id);if(JSON.stringify(snap.exists()?snap.data():undefined)!==JSON.stringify(before))throw Error('다른 브라우저에서 목록을 수정했습니다. 새로고침 후 다시 저장해주세요.');docs.push([ref,value])}for(const[ref,value]of docs)tx.set(ref,p.JSON.parse(JSON.stringify(value)))});for(const[id,value]of chunk)sharedBaseline.set(id,value)}
}
async function state(){return sharedState()}

async function register(row){const p=host(),z=p.zrReservationFirebase,F=await p.ZRLegacyFirebase(),settings=await F.getDoc(F.doc(z.db,'customerGuides','main')),vendors=[{id:'self',name:'자체',groupPrice:15000,ticketFeeType:'percent',ticketFeeValue:0,cafeFeeType:'percent',cafeFeeValue:0},...(settings.data()?.reservationSettings?.outsourcingVendors||[])],match=vendors.filter(v=>String(v.name||'').trim()===row.data['예약업체'].trim());if(match.length!==1)throw Error('아웃소싱 업체 설정에 같은 이름의 업체와 수수료를 먼저 저장해주세요: '+row.data['예약업체']);const errors=M.validate(row);if(Object.keys(errors).length)throw Error('입력값을 확인한 뒤 저장해주세요.');const id='LEGACY'+(await M.hash(M.identity(row))).slice(0,28),b=M.booking(row,match[0],z.user.uid,z.user.email||z.user.uid,id),ref=F.doc(z.db,'reservations',id);
const existing=await F.getDocs(F.query(F.collection(z.db,'reservations'),F.where('date','==',b.date),F.where('orgName','==',b.orgName)));if(existing.docs.some(d=>String(d.data().contact||'').replace(/\D/g,'')===b.contact.replace(/\D/g,'')))throw Error('동일 단체명·방문일·연락처의 예약이 이미 등록되어 있습니다.');
await F.runTransaction(z.db,async tx=>{if((await tx.get(ref)).exists())throw Error('이미 등록된 예약입니다.');const apply=await p.ZRBookingAllocations.prepare(F,z.db,tx,id,null,b);apply();const stored=p.JSON.parse(JSON.stringify(b));stored.updatedAt=F.serverTimestamp();tx.set(ref,stored);const a=p.ZRReservationRecords.availabilityPatch(b,z.user.uid,'legacy-import-v1',false);const available=p.JSON.parse(JSON.stringify(a));available.updatedAt=F.serverTimestamp();tx.set(F.doc(z.db,'reservationAvailability',id),available)});return id}
let queue=Promise.resolve();async function run(path,body){host();const s=await state();if(path==='state')return s;if(path.startsWith('upload?')){const year=Number(new URLSearchParams(path.split('?')[1]).get('year')),parsed=await M.parse(await window.ZRLegacyXlsx.read(body),year),seen=new Set(s.rows.map(r=>r.source));let added=0;for(const r of parsed.rows)if(!seen.has(r.source)){seen.add(r.source);s.rows.push(r);added++}await persist(s);return {state:s,added,skipped:parsed.skipped}}if(path==='save'){const errors={};for(const incoming of body.rows){const i=s.rows.findIndex(r=>r.id===incoming.id);if(s.rows[i]?.registered)continue;const r=structuredClone(incoming);r.errors=M.validate(r);r.saved=!Object.keys(r.errors).length;if(!r.saved)errors[r.id]=r.errors;if(i<0)s.rows.push(r);else s.rows[i]=r}await persist(s);return {state:s,errors}}if(path==='delete'){const ids=new Set(body.ids),before=s.rows.length;s.rows=s.rows.filter(r=>!ids.has(r.id)||r.registered);await persist(s);return {deleted:before-s.rows.length}}if(path==='register'){const ids=new Set(body.ids),successes=[],failures={},targets=s.rows.filter(r=>ids.has(r.id)&&!r.registered);for(const [i,r] of targets.entries()){window.dispatchEvent(new CustomEvent('legacy-progress',{detail:`등록 중 ${i+1} / ${targets.length}건`}));try{if(!r.saved)throw Error('먼저 수정 내용을 저장해주세요.');r.bookingId=await register(r);r.registered=true;successes.push(r.id);await persist(s)}catch(e){failures[r.id]=e.message||'등록 실패'}}return {state:s,successes,failures}}throw Error('지원하지 않는 작업입니다.')}
window.ZRLegacyAPI=(path,body)=>{const next=queue.then(()=>navigator.locks?navigator.locks.request('zr-legacy-import',()=>run(path,body)):run(path,body));queue=next.catch(()=>{});return next};
})();
