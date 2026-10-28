(()=>{
'use strict';

const FIREBASE_VERSION='12.17.1';
const STAFF_EMAIL='zoolung09@zoolungzoolung.com';
const BOOKING_KEY='zr_bookings';
const FULL_COLLECTION='reservations';
const AVAIL_COLLECTION='reservationAvailability';
const BRIDGE_VERSION=1;

const firebaseConfig={
  apiKey:'AIzaSyCAjvuTrFVGTyciwAgsbnBonkWCDSt47g0',
  authDomain:'zoolung-dongtan-schedule.firebaseapp.com',
  projectId:'zoolung-dongtan-schedule',
  storageBucket:'zoolung-dongtan-schedule.firebasestorage.app',
  messagingSenderId:'1031198289899',
  appId:'1:1031198289899:web:00f4facaf47fc8c1f5b3ae',
  measurementId:'G-GZ4BPNB5KP'
};

let auth=null,db=null,F=null;
let currentUser=null;
let stopFull=null,stopAvail=null;
let listenerGeneration=0,listeningUid=null;
let ownFull=new Map(),availability=new Map();
let applyingRemote=false;
let writeChain=Promise.resolve();
let bridgeStarted=false;
let legacyLocal=new Map();

const isStaff=u=>!!u&&String(u.email||'').toLowerCase()===STAFF_EMAIL.toLowerCase();
const readLocal=()=>{try{const rows=JSON.parse(localStorage.getItem(BOOKING_KEY)||'[]');return Array.isArray(rows)?rows.filter(row=>row&&typeof row==='object'&&!Array.isArray(row)):[]}catch{return []}};
const directWriteLocal=v=>{applyingRemote=true;try{localStorage.setItem(BOOKING_KEY,JSON.stringify(v))}finally{applyingRemote=false}};
const clone=v=>JSON.parse(JSON.stringify(v));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const toastSafe=msg=>{try{if(typeof window.toast==='function')window.toast(msg)}catch{}};

function clean(value){return window.ZRReservationRecords.clean(value)}
function byId(list){return window.ZRReservationRecords.byId(list)}
function changedTop(prev,next){return window.ZRReservationRecords.changedTop(prev,next)}
function availabilityPatch(b,ownerUid){return window.ZRReservationRecords.availabilityPatch(b,ownerUid,BRIDGE_VERSION,window.ZRBookingRules.groupProgram(b.groupType,b.date,b.entryTime))}
function availabilityPlaceholder(a){return window.ZRReservationRecords.availabilityPlaceholder(a)}
function refreshUi(){
  try{if(typeof window.renderVisitDays==='function')window.renderVisitDays()}catch(e){console.debug('renderVisitDays',e)}
  try{if(typeof window.refreshPlayStarts==='function')window.refreshPlayStarts()}catch(e){console.debug('refreshPlayStarts',e)}
  const av=document.getElementById('adminView');
  const adminVisible=av&&getComputedStyle(av).display!=='none'&&!av.classList.contains('hidden');
  if(adminVisible){
    for(const [fn,selector] of [['renderAdmin','#adminCalendar'],['renderActivity','#activityList'],['renderMealStatus','#tab-meals'],['renderOutsourcingPayments','#outsourceList']]){
      const root=document.querySelector(selector);if(!root||!root.getClientRects().length)continue;
      try{if(typeof window[fn]==='function')window[fn]()}catch(e){console.debug(fn,e)}
    }
  }
}
function applyAnonymousCache(){
  const full=[...ownFull.values()].map(x=>clone(x));
  const ids=new Set(full.map(x=>String(x.id)));
  const legacy=[...legacyLocal.values()].filter(x=>!ids.has(String(x.id))).map(x=>({...clone(x),__legacyLocal:true}));
  legacy.forEach(x=>ids.add(String(x.id)));
  const shadows=[...availability.values()].filter(x=>!ids.has(String(x.id))).map(availabilityPlaceholder);
  directWriteLocal([...full,...legacy,...shadows]);
  refreshUi();
}
function applyStaffCache(){
  const serialized=JSON.stringify([...ownFull.values()]);if(localStorage.getItem(BOOKING_KEY)===serialized)return;
  applyingRemote=true;try{localStorage.setItem(BOOKING_KEY,serialized)}finally{applyingRemote=false}
  refreshUi();
}
function stopListeners(){
  listenerGeneration++;listeningUid=null;
  if(stopFull){stopFull();stopFull=null}
  if(stopAvail){stopAvail();stopAvail=null}
  ownFull.clear();availability.clear();
}

async function migrateStaffLocal(user){
  const merged=new Map(legacyLocal);
  for(const x of readLocal())if(x&&x.id&&!x.__availabilityOnly)merged.set(String(x.id),x);
  const list=[...merged.values()];
  if(!list.length)return;
  for(const b of list){
    try{
      const ref=F.doc(db,FULL_COLLECTION,String(b.id));
      const snap=await F.getDoc(ref);
      // Restore a known customer owner instead of transferring the booking to staff.
      let ownerUid=b.ownerUid||user.uid;
      if(!snap.exists()){
        await F.setDoc(ref,{...clean(b),id:String(b.id),ownerUid,bridgeVersion:BRIDGE_VERSION,updatedAt:F.serverTimestamp()});
      }else{
        ownerUid=snap.data().ownerUid||user.uid;
      }
      const aref=F.doc(db,AVAIL_COLLECTION,String(b.id));
      const asnap=await F.getDoc(aref);
      if(!asnap.exists())await F.setDoc(aref,{...availabilityPatch(b,ownerUid),updatedAt:F.serverTimestamp()});
    }catch(e){console.warn('legacy booking migration skipped',b?.id,e)}
  }
}

async function startListeners(user){
  if(listeningUid===user.uid)return;
  stopListeners();listeningUid=user.uid;
  const generation=listenerGeneration;
  const current=()=>generation===listenerGeneration&&auth.currentUser?.uid===user.uid;
  if(isStaff(user)){
    // Firestore is authoritative; never recreate deleted records from browser caches.
    if(!current())return;
    stopFull=F.onSnapshot(F.collection(db,FULL_COLLECTION),snap=>{
    if(!current())return;
      for(const change of snap.docChanges()){const d=change.doc;if(change.type==='removed')ownFull.delete(d.id);else ownFull.set(d.id,{id:d.id,...d.data()})}
      applyStaffCache();
    },e=>{if(!current())return;console.error('reservation staff listener',e);toastSafe('공용 예약 DB 연결을 확인해주세요.')});
  }else{
    const q=F.query(F.collection(db,FULL_COLLECTION),F.where('ownerUid','==',user.uid));
    stopFull=F.onSnapshot(q,snap=>{
    if(!current())return;
      ownFull=new Map(snap.docs.map(d=>[d.id,{id:d.id,...d.data()}]));
      applyAnonymousCache();
    },e=>{if(current())console.error('reservation owner listener',e)});
    stopAvail=F.onSnapshot(F.collection(db,AVAIL_COLLECTION),snap=>{
    if(!current())return;
      availability=new Map(snap.docs.map(d=>[d.id,{id:d.id,...d.data()}]));
      applyAnonymousCache();
    },e=>{if(current())console.error('reservation availability listener',e)});
  }
}

async function ensureUser(){
  if(auth.currentUser)return auth.currentUser;
  await F.setPersistence(auth,F.browserLocalPersistence);
  const cred=await F.signInAnonymously(auth);
  return cred.user;
}

function bookingWritePatch(id,old,booking,ownerUid){
  return window.ZRReservationRecords.bookingWritePatch(id,old,booking,ownerUid,BRIDGE_VERSION);
}
async function commitBookingPair(id,old,b,ownerUid,schedulePatch=null){
  const writes=[],batch={set:(ref,data)=>writes.push({ref,data})},rules=window.ZRBookingRules;
  const noProgram=!!(old&&rules&&rules.requiresProgramSchedule(old)&&!rules.requiresProgramSchedule(b));
  const locationChanged=!!old&&String(old.mealLoc||'')!==String(b.mealLoc||'');
  const mealRemoved=!!old&&old.mealType!=='none'&&b.mealType==='none';
  const agesChanged=!!old&&(old.participantAgeMin!==b.participantAgeMin||old.participantAgeMax!==b.participantAgeMax);
  if(schedulePatch){
    batch.set(F.doc(db,'scheduleGroups',id),{...schedulePatch,updatedAt:F.serverTimestamp()},{merge:true});
  }else if(noProgram||locationChanged||mealRemoved||agesChanged){
    const ref=F.doc(db,'scheduleGroups',id),snap=await F.getDoc(ref);
    if(snap.exists()){
      const schedulePatch={updatedAt:F.serverTimestamp(),adminLastModifiedBy:b.adminLastModifiedBy||'',adminLastModifiedAt:b.adminLastModifiedAt||new Date().toISOString()};
      if(noProgram)schedulePatch.programNotRequired=true;
      if(locationChanged||noProgram||mealRemoved)schedulePatch.mealLoc=noProgram?'자리배정 없음':locationChanged?String(b.mealLoc||''):mealRemoved?'':String(b.mealLoc||'');
      if(agesChanged){schedulePatch.participantAgeMin=b.participantAgeMin??null;schedulePatch.participantAgeMax=b.participantAgeMax??null;}
      batch.set(ref,schedulePatch,{merge:true});
    }
  }
  const patch=bookingWritePatch(id,old,b,ownerUid);patch.updatedAt=F.serverTimestamp();
  batch.set(F.doc(db,FULL_COLLECTION,id),patch,{merge:true});
  batch.set(F.doc(db,AVAIL_COLLECTION,id),{...availabilityPatch(b,ownerUid),updatedAt:F.serverTimestamp()},{merge:true});
  const schedule=writes.find(w=>w.ref.path==='scheduleGroups/'+id);
  if(schedule)await window.ZRMealSeatAllocation.save(F,db,id,schedule.data,writes.filter(w=>w!==schedule));
  else await window.ZRBookingAllocations.save(F,db,writes);
}
async function writeBookingPair(id,old,b,ownerUid){
  const patch=bookingWritePatch(id,old,b,ownerUid);patch.updatedAt=F.serverTimestamp();
  await window.ZRBookingAllocations.save(F,db,[
    {ref:F.doc(db,FULL_COLLECTION,id),data:patch},
    {ref:F.doc(db,AVAIL_COLLECTION,id),data:{...availabilityPatch(b,ownerUid),updatedAt:F.serverTimestamp()}}
  ]);
}
// Explicit administrator saves commit remotely before replacing the local record.
async function saveBooking(value,options={}){
  if(!value?.id||!F||!db||!isStaff(currentUser)){toastSafe('관리자 DB 연결을 확인해주세요.');return false}
  const uid=currentUser.uid,schedulePatch=options.schedulePatch?clone(options.schedulePatch):null;
  const b=clone(value),id=String(b.id),old=readLocal().find(x=>String(x.id)===id);
  const name=String(localStorage.getItem('zr_admin_display_name_v1')||'').trim();
  if(name){b.adminLastModifiedBy=name;b.adminLastModifiedAt=new Date().toISOString()}
  const task=async()=>{
    const user=await ensureUser();if(!isStaff(user)||user.uid!==uid)throw Error('staff session required');
    const ownerUid=ownFull.get(id)?.ownerUid||old?.ownerUid||b.ownerUid||user.uid;
    await commitBookingPair(id,old,b,ownerUid,schedulePatch);
    if(currentUser?.uid!==uid||!isStaff(currentUser))return false;
    const rows=readLocal(),index=rows.findIndex(x=>String(x.id)===id);if(index<0)rows.push(b);else rows[index]={...rows[index],...changedTop(old,b)};
    applyingRemote=true;try{window.setStore(BOOKING_KEY,rows)}finally{applyingRemote=false}
    Object.assign(value,b);return true;
  };
  const operation=writeChain.then(task,task);writeChain=operation.catch(()=>{});
  try{return await operation}catch(e){console.error('administrator booking save',e);toastSafe(e.code==='meal-seat-conflict'?e.message:'공용 DB에 저장하지 못했습니다. 입력한 내용을 유지합니다. 다시 저장해주세요.');return false}
}

function queueBookingSync(before,after){
  if(applyingRemote)return;
  const prev=byId(before),next=byId(after);
  const changed=[];
  for(const [id,b] of next){
    const old=prev.get(id);
    if(!old||!same(clean(old),clean(b)))changed.push({id,old:old?clone(old):old,b:clone(b)});
  }
  if(!changed.length)return;
  const queuedUid=auth?.currentUser?.uid;
  writeChain=writeChain.then(async()=>{
    if(queuedUid&&auth?.currentUser?.uid!==queuedUid)throw Error('booking session changed');
    const user=await ensureUser();
    if(queuedUid&&user.uid!==queuedUid)throw Error('booking session changed');
    for(const item of changed){
      if(auth?.currentUser?.uid!==user.uid)throw Error('booking session changed');
      const {id,old,b}=item;
      if(b.__availabilityOnly||b.__legacyLocal)continue;
      const remoteOwner=ownFull.get(id)?.ownerUid||old?.ownerUid||b.ownerUid||'';
      if(!isStaff(user)&&remoteOwner&&remoteOwner!==user.uid){
        console.warn('skip write: booking is not owned by this browser',id);continue;
      }
      const ownerUid=remoteOwner||user.uid;
      await writeBookingPair(id,old,b,ownerUid);
    }
  }).catch(e=>{
    console.error('reservation firebase write',e);
    toastSafe('예약은 이 기기에 저장됐지만 공용 DB 저장에 실패했습니다.');
  });
}

function patchSetStore(){
  const wrapped=window.ZRStoreDispatch.register(window.setStore,{
    id:'reservation',key:BOOKING_KEY,marker:'__zrFirebaseBridge',
    handle:function(base,args){
      const [k,v]=args;
    const before=k===BOOKING_KEY?readLocal():null;
    if(k===BOOKING_KEY&&!applyingRemote&&isStaff(currentUser)&&Array.isArray(v)){
      const previous=byId(before),name=String(localStorage.getItem('zr_admin_display_name_v1')||'').trim().slice(0,80);
      const fields=['status','date','entryTime','exitTime','groupType','orgName','managerName','contact','paidCount','chaperoneCount','mealType','mealStart','mealEnd','playUse','playStart','playEnd','cafe','feedOrder','notes','settlement','customerSchedule','schedulePublished'];
      if(name)for(const b of v){const old=previous.get(String(b.id));if(old&&!b.__availabilityOnly&&fields.some(key=>JSON.stringify(old[key])!==JSON.stringify(b[key]))){b.adminLastModifiedBy=name;b.adminLastModifiedAt=new Date().toISOString()}}
    }
    const r=base.apply(this,args);
    if(k===BOOKING_KEY&&!applyingRemote)queueBookingSync(before,v);
    return r;
    }
  });
  if(!wrapped)return false;
  window.setStore=wrapped;
  return true;
}

function hookAdminLogin(){
  const btn=document.getElementById('adminLoginSubmit');
  if(!btn||btn.dataset.zrFirebaseHook==='1'||typeof btn.onclick!=='function')return;
  btn.dataset.zrFirebaseHook='1';
  const original=btn.onclick;
  btn.onclick=async function(ev){
    const pw=document.getElementById('adminPassword')?.value||'';
    await original.call(this,ev);
    const adminView=document.getElementById('adminView');
    const opened=adminView&&getComputedStyle(adminView).display!=='none'&&!adminView.classList.contains('hidden');
    if(!opened||!pw)return;
    if(isStaff(auth.currentUser))return;
    try{
      await F.setPersistence(auth,F.browserLocalPersistence);
      await F.signInWithEmailAndPassword(auth,STAFF_EMAIL,pw);
      toastSafe('공용 예약 DB 연결 완료');
    }catch(e){
      console.error('firebase staff login failed',e);
      toastSafe('관리자 화면은 열렸지만 공용 DB 로그인에 실패했습니다.');
    }
  };
}
function hookAdminLogout(){
  const btn=document.getElementById('adminLogout');
  if(!btn||btn.dataset.zrFirebaseHook==='1'||typeof btn.onclick!=='function')return;
  btn.dataset.zrFirebaseHook='1';
  const original=btn.onclick;
  btn.onclick=async function(ev){
    const r=original.call(this,ev);
    try{
      if(isStaff(auth.currentUser)){
        directWriteLocal([]);stopListeners();
        await F.signOut(auth);
        await F.signInAnonymously(auth);
      }
    }catch(e){console.warn('firebase logout switch',e)}
    return r;
  };
}
function hookUi(){patchSetStore();hookAdminLogin();hookAdminLogout()}

async function boot(){
  if(bridgeStarted)return;bridgeStarted=true;
  legacyLocal=new Map(readLocal().filter(x=>x&&x.id&&!x.__availabilityOnly).map(x=>[String(x.id),x]));
  try{
    const [appMod,authMod,fsMod]=await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`)
    ]);
    const app=appMod.getApps().length?appMod.getApp():appMod.initializeApp(firebaseConfig);
    auth=authMod.getAuth(app);db=fsMod.getFirestore(app);
    F={...authMod,...fsMod};
    hookUi();
    const hookTimer=setInterval(hookUi,800);setTimeout(()=>clearInterval(hookTimer),15000);
    await F.setPersistence(auth,F.browserLocalPersistence);
    F.onAuthStateChanged(auth,async user=>{
      try{
        if(!user){currentUser=null;stopListeners();await F.signInAnonymously(auth);return}
        currentUser=user;await startListeners(user);
      }catch(e){console.error('reservation auth state',e)}
    });
    if(!auth.currentUser)await F.signInAnonymously(auth);
    window.zrReservationFirebase={version:BRIDGE_VERSION,auth,db,saveBooking,get user(){return currentUser},isStaff:()=>isStaff(currentUser)};
    document.dispatchEvent(new CustomEvent('zr:reservation-firebase-ready'));
  }catch(e){
    console.error('reservation firebase bridge boot failed',e);
    toastSafe('공용 예약 DB 연결 실패 · 기존 로컬 저장으로 동작합니다.');
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
