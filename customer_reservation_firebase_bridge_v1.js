(()=>{
'use strict';
if(window.__ZR_CUSTOMER_RESERVATION_FIREBASE_BRIDGE_V1)return;
window.__ZR_CUSTOMER_RESERVATION_FIREBASE_BRIDGE_V1=true;

const FIREBASE_VERSION='12.17.1';
const CUSTOMER_APP_NAME='zrCustomerReservation';
const BOOKING_KEY='zr_bookings';
const FULL_COLLECTION='reservations';
const AVAIL_COLLECTION='reservationAvailability';
const INQUIRY_COLLECTION='customerInquiries';
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

let auth=null,db=null,F=null,currentUser=null;
let stopFull=null,stopAvail=null;
let listenerGeneration=0,listeningUid=null;
let ownFull=new Map(),availability=new Map(),legacyLocal=new Map();
let applyingRemote=false,writeChain=Promise.resolve(),lastWriteError=null,bridgeStarted=false;

const readLocal=()=>{try{const rows=JSON.parse(localStorage.getItem(BOOKING_KEY)||'[]');return Array.isArray(rows)?rows.filter(row=>row&&typeof row==='object'&&!Array.isArray(row)):[]}catch{return []}};
const directWriteLocal=v=>{applyingRemote=true;try{localStorage.setItem(BOOKING_KEY,JSON.stringify(v))}finally{applyingRemote=false}};
const clone=v=>JSON.parse(JSON.stringify(v));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const toastSafe=msg=>{try{if(typeof window.toast==='function')window.toast(msg)}catch{}};

function clean(value){return window.ZRReservationRecords.clean(value)}
function byId(list){return window.ZRReservationRecords.byId(list)}
function changedTop(prev,next){return window.ZRReservationRecords.changedTop(prev,next)}
function timeToMin(v){const m=/^(\d{2}):(\d{2})$/.exec(String(v||''));return m?Number(m[1])*60+Number(m[2]):NaN}
function minToTime(n){if(!Number.isFinite(n)||n<0||n>=1440)return'';return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
function changePlayHold(b){
  if(['cancelled','rejected'].includes(String(b?.status||'')))return {active:false};
  const r=b?.reservationChangeRequest;
  if(!r||typeof r!=='object'||String(r.status||'pending')!=='pending')return {active:false};
  const date=String(r.requestedDate||b.date||'');
  const changed=r.changePlay===true;
  const use=changed?String(r.playUse||'no'):String(b.playUse||'no');
  if(use!=='yes'||!date)return {active:false};
  const start=String(changed?r.playStart||'':b.playStart||'');
  let end=String(changed?r.playEnd||'':b.playEnd||'');
  const duration=Number(changed?r.playDuration||0:b.playDuration||0);
  const sm=timeToMin(start);
  if(!end&&Number.isFinite(sm)&&[30,60].includes(duration))end=minToTime(sm+duration);
  const em=timeToMin(end);
  if(!Number.isFinite(sm)||!Number.isFinite(em)||em<=sm)return {active:false};
  return {active:true,requestId:String(r.id||''),date,start,end,duration:em-sm};
}
function availabilityPatch(b,ownerUid){
  const hold=changePlayHold(b);
  return clean({...window.ZRReservationRecords.availabilityPatch(b,ownerUid,BRIDGE_VERSION,window.ZRBookingRules.groupProgram(b.groupType,b.date,b.entryTime)),
    changePlayHoldActive:hold.active===true,
    changePlayHoldRequestId:hold.active?hold.requestId:'',
    changePlayHoldDate:hold.active?hold.date:'',
    changePlayHoldStart:hold.active?hold.start:'',
    changePlayHoldEnd:hold.active?hold.end:'',
    changePlayHoldDuration:hold.active?hold.duration:0});
}
function availabilityPlaceholder(a){
  return {...window.ZRReservationRecords.availabilityPlaceholder(a),
    sourceBookingId:String(a.sourceBookingId||a.changePlayHoldSourceBookingId||''),
    playDuration:Number(a.playDuration||0),__changePlayHold:a.changePlayHoldDedicated===true};
}
function changePlayHoldPlaceholder(a){
  if(a?.changePlayHoldActive!==true)return null;
  const sourceId=String(a.changePlayHoldSourceBookingId||a.sourceBookingId||a.id||''),requestId=String(a.changePlayHoldRequestId||'');
  const date=String(a.changePlayHoldDate||a.date||''),start=String(a.changePlayHoldStart||a.playStart||''),end=String(a.changePlayHoldEnd||a.playEnd||'');
  if(!sourceId||!date||!start||!end)return null;
  return {
    id:String(a.id||`${sourceId}__change_play_hold__${requestId||'pending'}`),sourceBookingId:sourceId,
    date,status:'pending',playUse:'yes',playStart:start,playEnd:end,playDuration:Number(a.changePlayHoldDuration||a.playDuration||0),
    paidCount:0,chaperoneCount:0,freeChaperone:0,paidChaperone:0,
    entryTime:'',exitTime:'',mealType:'none',mealStart:'',mealEnd:'',
    orgName:'',managerName:'',contact:'',email:'',notes:'',__availabilityOnly:true,__changePlayHold:true
  };
}
function refreshUi(){
  try{if(typeof window.renderVisitDays==='function')window.renderVisitDays()}catch(e){console.debug('renderVisitDays',e)}
  try{if(typeof window.refreshPlayStarts==='function')window.refreshPlayStarts()}catch(e){console.debug('refreshPlayStarts',e)}
  try{document.dispatchEvent(new CustomEvent('zr:reservation-availability-updated'))}catch{}
}
function applyCustomerCache(){
  const full=[...ownFull.values()].map(x=>clone(x));
  const ids=new Set(full.map(x=>String(x.id)));
  const legacy=[...legacyLocal.values()].filter(x=>!ids.has(String(x.id))).map(x=>({...clone(x),__legacyLocal:true}));
  legacy.forEach(x=>ids.add(String(x.id)));
  const allAvailability=[...availability.values()];
  const shadows=allAvailability.filter(x=>!ids.has(String(x.id))&&x.changePlayHoldDedicated!==true).map(availabilityPlaceholder);
  const holds=allAvailability.map(changePlayHoldPlaceholder).filter(Boolean);
  const next=[...full,...legacy,...shadows,...holds];if(same(readLocal(),next))return;
  directWriteLocal(next);
  refreshUi();
}
function stopListeners(){
  listenerGeneration++;listeningUid=null;
  if(stopFull){stopFull();stopFull=null}
  if(stopAvail){stopAvail();stopAvail=null}
  ownFull.clear();availability.clear();
}
async function startListeners(user){
  if(listeningUid===user.uid)return;
  stopListeners();listeningUid=user.uid;
  const generation=listenerGeneration;
  const current=()=>generation===listenerGeneration&&auth.currentUser?.uid===user.uid;
  const q=F.query(F.collection(db,FULL_COLLECTION),F.where('ownerUid','==',user.uid));
  stopFull=F.onSnapshot(q,snap=>{
    if(!current())return;
    ownFull=new Map(snap.docs.map(d=>[d.id,{id:d.id,...d.data()}]));
    applyCustomerCache();
  },e=>{if(current())console.error('reservation owner listener',e)});
  stopAvail=F.onSnapshot(F.collection(db,AVAIL_COLLECTION),snap=>{
    if(!current())return;
    availability=new Map(snap.docs.map(d=>[d.id,{id:d.id,...d.data()}]));
    applyCustomerCache();
  },e=>{if(current())console.error('reservation availability listener',e)});
}
async function ensureUser(){
  if(auth.currentUser)return auth.currentUser;
  await F.setPersistence(auth,F.browserLocalPersistence);
  const cred=await F.signInAnonymously(auth);
  return cred.user;
}
function queueBookingSync(before,after){
  if(applyingRemote)return writeChain;
  const changed=bookingChanges(before,after).map(({id,old,b})=>({id,old:old?clone(old):old,b:clone(b)}));
  if(!changed.length)return writeChain;
  lastWriteError=null;
  const queuedUid=auth?.currentUser?.uid;
  writeChain=writeChain.then(async()=>{
    if(queuedUid&&auth?.currentUser?.uid!==queuedUid)throw Error('booking session changed');
    const user=await ensureUser();
    if(queuedUid&&user.uid!==queuedUid)throw Error('booking session changed');
    for(const {id,old,b} of changed){
      if(auth?.currentUser?.uid!==user.uid)throw Error('booking session changed');
      if(b.__availabilityOnly)continue;
      const remoteOwner=ownFull.get(id)?.ownerUid||'';
      if(remoteOwner&&remoteOwner!==user.uid){
        console.warn('skip write: booking is not owned by this customer session',id);continue;
      }
      const ownerUid=remoteOwner||user.uid;
      await writeBookingPair(id,old,b,ownerUid);
    }
  }).catch(e=>{
    lastWriteError=e;
    console.error('customer reservation firebase write',e);
    toastSafe('예약은 이 기기에 저장됐지만 공용 DB 저장에 실패했습니다.');
  });
  return writeChain;
}
// Select changes without storage or network access. Preserve record references.
function bookingChanges(before,after){
  const prev=byId(before),next=byId(after),changed=[];
  for(const [id,b] of next){
    const old=prev.get(id);
    if(!old||!same(clean(old),clean(b)))changed.push({id,old,b});
  }
  return changed;
}
function bookingWritePatch(id,old,booking,ownerUid){
  return window.ZRReservationRecords.bookingWritePatch(id,old,booking,ownerUid,BRIDGE_VERSION);
}
// The original reservation and public availability must succeed or fail together.
async function writeBookingPair(id,old,booking,ownerUid){
  const patch=bookingWritePatch(id,old,booking,ownerUid);
  patch.updatedAt=F.serverTimestamp();
  await window.ZRBookingAllocations.save(F,db,[
    {ref:F.doc(db,FULL_COLLECTION,id),data:patch},
    {ref:F.doc(db,AVAIL_COLLECTION,id),data:{...availabilityPatch(booking,ownerUid),updatedAt:F.serverTimestamp()}}
  ]);
}
async function updatePendingBooking(id,booking){
  await writeChain;
  const user=await ensureUser(),ref=F.doc(db,FULL_COLLECTION,String(id));
  let saved;
  await F.runTransaction(db,async tx=>{
    const snap=await tx.get(ref);
    if(auth.currentUser?.uid!==user.uid)throw Error('booking session changed');
    if(!snap.exists())throw Error('예약 정보를 찾을 수 없습니다.');
    const old=snap.data();
    if(old.ownerUid!==user.uid)throw Error('예약 소유자를 확인해주세요.');
    if(!window.ZRBookingRules.canDirectEdit(old)||!window.ZRBookingRules.canDirectEdit({...booking,status:old.status}))throw Error('방문 7일 이내 예약은 예약 조회에서 변경 요청으로 접수해주세요.');
    if(old.reservationChangeRequest?.status==='pending')throw Error('처리 중인 변경 요청이 있습니다. 관리자에게 문의해주세요.');
    saved={...old,...booking,id:String(id),ownerUid:user.uid,createdAt:old.createdAt,statusUpdatedAt:old.statusUpdatedAt,status:old.status,schedulePublished:false,customerSchedule:null,mealLoc:''};
    const patch=bookingWritePatch(String(id),old,saved,user.uid);
    const allocate=await window.ZRBookingAllocations.prepare(F,db,tx,String(id),old,saved);
    allocate();
    tx.set(ref,{...patch,updatedAt:F.serverTimestamp()},{merge:true});
    tx.set(F.doc(db,AVAIL_COLLECTION,String(id)),{...availabilityPatch(saved,user.uid),updatedAt:F.serverTimestamp()},{merge:true});
    if(Object.keys(patch).some(key=>['date','groupType','groupBookingMode','paidCount','chaperoneCount','entryTime','exitTime','mealType','mealLoc','mealStart','mealEnd','cafe','playUse','playStart','playEnd','feedOrder','notes','orgName','managerName','contact','email','participantAgeMin','participantAgeMax','schedulePublished','customerSchedule'].includes(key))){
      tx.set(F.doc(db,'scheduleGroups',String(id)),{customerInvalidated:true,customerInvalidatedAt:F.serverTimestamp()},{merge:true});
    }
  });
  if(auth.currentUser?.uid!==user.uid)throw Error('booking session changed');
  ownFull.set(String(id),saved);legacyLocal.delete(String(id));applyCustomerCache();
  return saved;
}
async function cancelBooking(id,reason){
 await writeChain;const user=await ensureUser(),ref=F.doc(db,FULL_COLLECTION,String(id)),snap=await F.getDoc(ref);
 if(auth.currentUser?.uid!==user.uid)throw Error('booking session changed');
 if(!snap.exists())throw Error('booking-not-found');const b={id:String(id),...snap.data()};if(b.ownerUid!==user.uid)throw Error('owner-mismatch');
 if(b.status!=='cancelled'){const now=new Date().toISOString();Object.assign(b,{status:'cancelled',cancelledAt:now,statusUpdatedAt:now,cancelledBy:'customer',cancelReason:reason,cancelReviewed:false});await window.ZRBookingAllocations.save(F,db,[{ref,data:{status:b.status,cancelledAt:now,statusUpdatedAt:now,cancelledBy:'customer',cancelReason:reason,cancelReviewed:false,updatedAt:F.serverTimestamp()}},{ref:F.doc(db,AVAIL_COLLECTION,String(id)),data:{...availabilityPatch(b,user.uid),updatedAt:F.serverTimestamp()}}]);}
 if(auth.currentUser?.uid!==user.uid)throw Error('booking session changed');
 const requestId=String(b.reservationChangeRequest?.id||b.reservationChangeRequest?.requestId||'');
 if(requestId){try{await clearOwnChangePlayHold(requestId)}catch{}}
 if(auth.currentUser?.uid!==user.uid)throw Error('booking session changed');
 ownFull.set(String(id),b);legacyLocal.delete(String(id));applyCustomerCache();return b;
}
async function waitForWrites(){
  const pending=writeChain;
  await pending;
  if(lastWriteError)throw lastWriteError;
  return true;
}
function changeHoldDocId(requestId){return `changePlayHold_${String(requestId||'')}`}
async function clearOwnChangePlayHold(requestId){
  if(!requestId)return true;
  const user=await ensureUser(),ref=F.doc(db,AVAIL_COLLECTION,changeHoldDocId(requestId));
  try{
    await window.ZRBookingAllocations.save(F,db,[{ref,data:{ownerUid:user.uid,date:'',status:'done',playUse:'no',playStart:'',playEnd:'',playDuration:0,changePlayHoldDedicated:true,changePlayHoldActive:false,changePlayHoldRequestId:String(requestId),changePlayHoldDate:'',changePlayHoldStart:'',changePlayHoldEnd:'',changePlayHoldDuration:0,updatedAt:F.serverTimestamp()}}]);
    return true;
  }catch(e){console.warn('customer change hold clear',e);return false}
}
async function submitSharedChangeRequest(payload){
  const user=await ensureUser(),p=clean(payload&&typeof payload==='object'?payload:{});
  const requestId=String(p.changeRequestId||p.requestId||''),bookingId=String(p.changeBookingId||p.bookingId||'');
  if(!requestId||!bookingId)throw new Error('reservation change request identity missing');
  const inquiryId=String(p.sharedInquiryId||`inq_change_${user.uid}_${requestId}`);
  const ref=F.doc(db,INQUIRY_COLLECTION,inquiryId);
  const holdId=p.changePlay===true&&String(p.playUse||'no')==='yes'?changeHoldDocId(requestId):'';
  await F.runTransaction(db,async tx=>{
    const existing=await tx.get(ref);
    if(auth.currentUser?.uid!==user.uid)throw Error('booking session changed');
    if(existing.exists()){
      const saved=existing.data();
      if(saved.ownerUid!==user.uid||saved.changeRequestId!==requestId||saved.changeBookingId!==bookingId)throw Error('reservation change identity conflict');
      // A retry must not recreate a released hold or overwrite a staff reply.
      return;
    }
    const bookingRef=F.doc(db,FULL_COLLECTION,bookingId),bookingSnap=await tx.get(bookingRef);
    if(!bookingSnap.exists()||bookingSnap.data().ownerUid!==user.uid)throw Error('예약 소유자를 확인해주세요.');
    const writes=[],previousId=String(bookingSnap.data().changePlayHoldRequestId||'');
    if(previousId&&previousId!==requestId){
      const previousRef=F.doc(db,AVAIL_COLLECTION,changeHoldDocId(previousId)),previous=await tx.get(previousRef);
      if(previous.exists()&&previous.data().sourceBookingId===bookingId)writes.push({ref:previousRef,data:{date:'',status:'done',playUse:'no',playStart:'',playEnd:'',playDuration:0,changePlayHoldActive:false,changePlayHoldDate:'',changePlayHoldStart:'',changePlayHoldEnd:'',changePlayHoldDuration:0,updatedAt:F.serverTimestamp()}});
    }
    writes.push({ref:bookingRef,data:{changePlayHoldRequestId:holdId?requestId:'',updatedAt:F.serverTimestamp()}});
    if(holdId){
      const date=String(p.changeRequestedDate||p.requestedDate||''),start=String(p.playStart||''),end=String(p.playEnd||''),duration=Number(p.playDuration||0);
      if(!date||!start||!end||![30,60].includes(duration))throw new Error('reservation change playground hold invalid');
      const holdRef=F.doc(db,AVAIL_COLLECTION,holdId),hold={
        id:holdId,ownerUid:user.uid,sourceBookingId:bookingId,date,status:'pending',playUse:'yes',playStart:start,playEnd:end,playDuration:duration,
        changePlayHoldDedicated:true,changePlayHoldActive:true,changePlayHoldRequestId:requestId,changePlayHoldSourceBookingId:bookingId,
        changePlayHoldDate:date,changePlayHoldStart:start,changePlayHoldEnd:end,changePlayHoldDuration:duration,bridgeVersion:BRIDGE_VERSION,updatedAt:F.serverTimestamp()
      };
      writes.push({ref:holdRef,data:hold});
    }
    const allocate=await window.ZRBookingAllocations.prepareWrites(F,db,tx,writes);
    allocate();for(const w of writes)tx.set(w.ref,w.data,{merge:true});
    tx.set(ref,{
      ...p,id:String(p.id||requestId),sharedInquiryId:inquiryId,sharedInquiryVersion:1,ownerUid:user.uid,
      changeRequest:true,changeRequestId:requestId,changeBookingId:bookingId,updatedAt:F.serverTimestamp()
    });
  });
  if(auth.currentUser?.uid!==user.uid)throw Error('booking session changed');
  return {requestId,bookingId,inquiryId,holdId};
}
function patchSetStore(){
  const wrapped=window.ZRStoreDispatch.register(window.setStore,{
    id:'customer-reservation',key:BOOKING_KEY,marker:'__zrCustomerFirebaseBridge',
    handle:function(base,args){
      const [k,v]=args;
    const before=k===BOOKING_KEY?readLocal():null;
    const r=base.apply(this,args);
    if(k===BOOKING_KEY&&!applyingRemote){
      try{queueBookingSync(before,v)}
      catch(e){
        lastWriteError=e;
        console.error('customer reservation firebase sync queue',e);
        toastSafe('예약은 이 기기에 저장됐지만 공용 DB 동기화 준비에 실패했습니다.');
      }
    }
    return r;
    }
  });
  if(!wrapped)return false;
  window.setStore=wrapped;
  try{setStore=wrapped}catch{}
  return true;
}
async function boot(){
  if(bridgeStarted)return;bridgeStarted=true;
  legacyLocal=new Map(readLocal().filter(x=>x&&x.id&&!x.__availabilityOnly).map(x=>[String(x.id),x]));
  try{
    const [appMod,authMod,fsMod]=await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`)
    ]);
    const app=appMod.getApps().find(x=>x.name===CUSTOMER_APP_NAME)||appMod.initializeApp(firebaseConfig,CUSTOMER_APP_NAME);
    auth=authMod.getAuth(app);db=fsMod.getFirestore(app);F={...authMod,...fsMod};
    patchSetStore();
    const hookTimer=setInterval(patchSetStore,500);setTimeout(()=>clearInterval(hookTimer),15000);
    await F.setPersistence(auth,F.browserLocalPersistence);
    F.onAuthStateChanged(auth,async user=>{
      try{
        if(!user){currentUser=null;stopListeners();await F.signInAnonymously(auth);return}
        currentUser=user;await startListeners(user);
      }catch(e){console.error('customer reservation auth state',e)}
    });
    if(!auth.currentUser)await F.signInAnonymously(auth);
    window.zrReservationFirebase={
      version:BRIDGE_VERSION,appName:CUSTOMER_APP_NAME,auth,db,
      get user(){return currentUser},
      isStaff:()=>false,
      ownsBooking:id=>!!auth.currentUser?.uid&&ownFull.get(String(id))?.ownerUid===auth.currentUser.uid,
      waitForWrites,cancelBooking,updatePendingBooking,
      submitChangeRequest:submitSharedChangeRequest,
      clearChangePlayHold:clearOwnChangePlayHold
    };
    try{document.dispatchEvent(new CustomEvent('zr:customer-firebase-ready',{detail:{appName:CUSTOMER_APP_NAME}}))}catch{}
  }catch(e){
    console.error('customer reservation firebase bridge boot failed',e);
    toastSafe('공용 예약 DB 연결 실패 · 기존 로컬 저장으로 동작합니다.');
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
