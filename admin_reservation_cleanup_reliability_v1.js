(()=>{
'use strict';
if(window.__ZR_ADMIN_RESERVATION_CLEANUP_RELIABILITY_V1)return;
window.__ZR_ADMIN_RESERVATION_CLEANUP_RELIABILITY_V1=true;

const FV='12.17.1';
const STAFF_EMAIL='zoolung09@zoolungzoolung.com';
const KEY='zr_bookings';
const BUSY=new Set();
let F=null,db=null,auth=null;

const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
function toast(msg){try{if(typeof window.toast==='function')return window.toast(msg)}catch{}alert(msg)}
function today(){const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function monthsAgo(dateStr,months){const d=new Date(String(dateStr)+'T12:00:00');if(Number.isNaN(d.getTime()))return'';const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()-months);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function settlementDone(b){return !!String(b?.settlement?.savedAt||b?.settlementCompletedAt||'').trim()}
function settlementAt(b){return String(b?.settlement?.savedAt||b?.settlementCompletedAt||'')}
function eligible(b){return String(b?.status||'')==='confirmed'&&!!String(b?.date||'')&&String(b.date)<=monthsAgo(today(),6)&&settlementDone(b)}
function bookings(){try{const list=typeof window.bookings==='function'?window.bookings():JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(list)?list.filter(b=>b&&!b.__availabilityOnly&&!b.__legacyLocal):[]}catch{return[]}}
function filteredRows(){const start=$('zrCleanupStart')?.value||'',end=$('zrCleanupEnd')?.value||'';return bookings().filter(eligible).filter(b=>!(start&&b.date<start)&&!(end&&b.date>end))}
function bridge(){return window.zrReservationFirebase||null}
function isStaff(){const z=bridge();return !!z?.isStaff?.()&&String(z.auth?.currentUser?.email||'').toLowerCase()===STAFF_EMAIL.toLowerCase()}
async function ensureFirebase(){if(F&&db&&auth)return true;const z=bridge();if(!z?.db||!z?.auth)return false;F=await import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`);db=z.db;auth=z.auth;return true}
function confirmCleanup(count){if(!confirm(`${count}건의 과거 예약을 영구 정리합니다.\n엑셀 백업 여부를 먼저 확인해주세요.\n\n계속하시겠습니까?`))return false;return confirm(`마지막 확인입니다.\n예약 본문과 예약 가능 데이터는 삭제되며 되돌릴 수 없습니다.\n정리 내역에는 최소 정보만 남습니다.\n\n${count}건을 정리할까요?`)}
function localRemove(ids){const set=new Set(ids.map(String)),next=bookings().filter(b=>!set.has(String(b.id)));try{if(typeof window.setStore==='function')window.setStore(KEY,next)}catch(e){console.debug('cleanup local sync',e)}}
function setButtonBusy(el,busy){if(!el)return;if(busy){el.dataset.zrCleanupBusyText=el.textContent||'';el.disabled=true;el.textContent='정리 중…'}else{el.disabled=false;if(el.dataset.zrCleanupBusyText)el.textContent=el.dataset.zrCleanupBusyText;delete el.dataset.zrCleanupBusyText}}
function errorLabel(e){const code=String(e?.code||'').replace(/^firestore\//,'');const msg=String(e?.message||'').replace(/\s+/g,' ').trim();return code?`${code}${msg?` · ${msg.slice(0,90)}`:''}`:(msg||'unknown-error')}
async function refreshConnection(){
  if(!await ensureFirebase())throw Object.assign(new Error('Firebase bridge not ready'),{code:'bridge-not-ready'});
  if(!isStaff())throw Object.assign(new Error('관리자 Firebase 로그인이 아닙니다.'),{code:'staff-auth-required'});
  try{await auth.currentUser?.getIdToken?.(true)}catch(e){console.debug('cleanup token refresh',e)}
  try{await F.enableNetwork(db)}catch(e){console.debug('cleanup enable network',e)}
}
function buildBatch(chunk,cleanupMode){
  const batch=F.writeBatch(db),iso=new Date().toISOString(),date=iso.slice(0,10),cleanedBy=String(auth.currentUser?.email||STAFF_EMAIL);
  for(const b of chunk){const id=String(b.id),history={archived:true,archiveType:'reservationCleanup',reservationId:id,orgName:String(b.orgName||''),visitDate:String(b.date||''),paidCount:Number(b.paidCount||0),chaperoneCount:Number(b.chaperoneCount||0),settlementSavedAt:settlementAt(b),cleanupMode:String(cleanupMode||'정리'),cleanupDate:date,cleanupIso:iso,cleanupAt:F.serverTimestamp(),cleanedBy};batch.set(F.doc(db,'scheduleGroups',id),history);batch.delete(F.doc(db,'reservations',id));batch.delete(F.doc(db,'reservationAvailability',id))}
  return batch;
}
async function execute(items,cleanupMode,actionButton){
  const valid=items.filter(eligible).filter(b=>!BUSY.has(String(b.id)));if(!valid.length)return toast('정리 가능한 예약이 없습니다.');
  if(!confirmCleanup(valid.length))return;
  const ids=valid.map(b=>String(b.id));ids.forEach(id=>BUSY.add(id));setButtonBusy(actionButton,true);
  try{
    await refreshConnection();
    const chunks=[];for(let i=0;i<valid.length;i+=100)chunks.push(valid.slice(i,i+100));
    for(const chunk of chunks)await buildBatch(chunk,cleanupMode).commit();
    localRemove(ids);
    toast(`${valid.length}건의 과거 예약을 정리했습니다.`);
    setTimeout(()=>{$('zrCleanupApply')?.click?.()},0);
  }catch(e){
    console.error('reservation cleanup reliability',e);
    toast(`예약 정리에 실패했습니다.\n오류: ${errorLabel(e)}\n데이터는 화면에서 임의로 삭제하지 않았습니다.`);
  }finally{
    ids.forEach(id=>BUSY.delete(id));setButtonBusy(actionButton,false);
  }
}
function selectedRows(){const ids=new Set([...document.querySelectorAll('#zrCleanupList [data-zr-cleanup-select]:checked')].map(x=>String(x.dataset.zrCleanupSelect||'')));return filteredRows().filter(b=>ids.has(String(b.id)))}
function intercept(e){
  if(!$('tab-cleanup')||$('tab-cleanup').classList.contains('hidden'))return;
  const one=e.target?.closest?.('[data-zr-cleanup-one]');
  const selected=e.target?.closest?.('#zrCleanupSelected');
  const all=e.target?.closest?.('#zrCleanupAllResult');
  if(!one&&!selected&&!all)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  if(one){const id=String(one.dataset.zrCleanupOne||'');const b=filteredRows().find(x=>String(x.id)===id);if(b)execute([b],'개별 정리',one);return}
  if(selected){execute(selectedRows(),'선택 정리',selected);return}
  if(all)execute(filteredRows(),'조회 결과 전체 정리',all);
}

document.addEventListener('click',intercept,true);
})();