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
let ownFull=new Map(),availability=new Map(),legacyLocal=new Map();
let applyingRemote=false,writeChain=Promise.resolve(),lastWriteError=null,originalSetStore=null,bridgeStarted=false;

const readLocal=()=>{try{return JSON.parse(localStorage.getItem(BOOKING_KEY)||'[]')}catch{return[]}};
const directWriteLocal=v=>{applyingRemote=true;try{localStorage.setItem(BOOKING_KEY,JSON.stringify(v))}finally{applyingRemote=false}};
const clone=v=>JSON.parse(JSON.stringify(v));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const toastSafe=msg=>{try{if(typeof window.toast==='function')window.toast(msg)}catch{}};

function clean(value){
  if(Array.isArray(value))return value.map(clean).filter(v=>v!==undefined);
  if(value&&typeof value==='object'){
    const out={};
    for(const [k,v] of Object.entries(value)){
      if(k.startsWith('__')||v===undefined||typeof v==='function')continue;
      const c=clean(v);if(c!==undefined)out[k]=c;
    }
    return out;
  }
  if(value===undefined||typeof value==='function')return undefined;
  return value;
}
function byId(list){return new Map((Array.isArray(list)?list:[]).filter(x=>x&&x.id&&!x.__availabilityOnly).map(x=>[String(x.id),x]))}
function changedTop(prev,next){
  if(!prev)return clean(next);
  const out={};
  const keys=new Set([...Object.keys(prev||{}),...Object.keys(next||{})]);
  for(const k of keys){
    if(k.startsWith('__')||k==='updatedAt'||k==='ownerUid'||k==='bridgeVersion')continue;
    if(!same(prev?.[k],next?.[k]))out[k]=clean(next?.[k]);
  }
  return out;
}
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
  return clean({
    id:b.id,ownerUid,date:b.date||'',status:b.status||'pending',
    playUse:b.playUse||'no',playStart:b.playStart||'',playEnd:b.playEnd||'',
    changePlayHoldActive:hold.active===true,
    changePlayHoldRequestId:hold.active?hold.requestId:'',
    changePlayHoldDate:hold.active?hold.date:'',
    changePlayHoldStart:hold.active?hold.start:'',
    changePlayHoldEnd:hold.active?hold.end:'',
    changePlayHoldDuration:hold.active?hold.duration:0,
    bridgeVersion:BRIDGE_VERSION
  });
}
function availabilityPlaceholder(a){
  return {
    id:a.id,sourceBookingId:String(a.sourceBookingId||a.changePlayHoldSourceBookingId||''),date:a.date||'',status:a.status||'pending',playUse:a.playUse||'no',
    playStart:a.playStart||'',playEnd:a.playEnd||'',playDuration:Number(a.playDuration||0),
    paidCount:0,chaperoneCount:0,freeChaperone:0,paidChaperone:0,
    entryTime:'',exitTime:'',mealType:'none',mealStart:'',mealEnd:'',
    orgName:'',managerName:'',contact:'',email:'',notes:'',__availabilityOnly:true,__changePlayHold:a.changePlayHoldDedicated===true
  };
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
  directWriteLocal([...full,...legacy,...shadows,...holds]);
  refreshUi();
}
function stopListeners(){
  if(stopFull){stopFull();stopFull=null}
  if(stopAvail){stopAvail();stopAvail=null}
  ownFull.clear();availability.clear();
}
async function startListeners(user){
  stopListeners();
  const q=F.query(F.collection(db,FULL_COLLECTION),F.where('ownerUid','==',user.uid));
  stopFull=F.onSnapshot(q,snap=>{
    ownFull=new Map(snap.docs.map(d=>[d.id,{id:d.id,...d.data()}]));
    applyCustomerCache();
  },e=>console.error('reservation owner listener',e));
  stopAvail=F.onSnapshot(F.collection(db,AVAIL_COLLECTION),snap=>{
    availability=new Map(snap.docs.map(d=>[d.id,{id:d.id,...d.data()}]));
    applyCustomerCache();
  },e=>console.error('reservation availability listener',e));
}
async function ensureUser(){
  if(auth.currentUser)return auth.currentUser;
  await F.setPersistence(auth,F.browserLocalPersistence);
  const cred=await F.signInAnonymously(auth);
  return cred.user;
}
function queueBookingSync(before,after){
  if(applyingRemote)return writeChain;
  const prev=byId(before),next=byId(after),changed=[];
  for(const [id,b] of next){
    const old=prev.get(id);
    if(!old||!same(clean(old),clean(b)))changed.push({id,old,b});
  }
  if(!changed.length)return writeChain;
  lastWriteError=null;
  writeChain=writeChain.then(async()=>{
    const user=await ensureUser();
    for(const {id,old,b} of changed){
      if(b.__availabilityOnly)continue;
      const remoteOwner=ownFull.get(id)?.ownerUid||'';
      if(remoteOwner&&remoteOwner!==user.uid){
        console.warn('skip write: booking is not owned by this customer session',id);continue;
      }
      const ownerUid=remoteOwner||user.uid;
      const patch=changedTop(old,b);
      if(!old)Object.assign(patch,clean(b));
      patch.id=id;patch.ownerUid=ownerUid;patch.bridgeVersion=BRIDGE_VERSION;patch.updatedAt=F.serverTimestamp();
      await F.setDoc(F.doc(db,FULL_COLLECTION,id),patch,{merge:true});
      await F.setDoc(F.doc(db,AVAIL_COLLECTION,id),{...availabilityPatch(b,ownerUid),updatedAt:F.serverTimestamp()},{merge:true});
    }
  }).catch(e=>{
    lastWriteError=e;
    console.error('customer reservation firebase write',e);
    toastSafe('예약은 이 기기에 저장됐지만 공용 DB 저장에 실패했습니다.');
  });
  return writeChain;
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
    await F.setDoc(ref,{ownerUid:user.uid,date:'',status:'done',playUse:'no',playStart:'',playEnd:'',playDuration:0,changePlayHoldDedicated:true,changePlayHoldActive:false,changePlayHoldRequestId:String(requestId),changePlayHoldDate:'',changePlayHoldStart:'',changePlayHoldEnd:'',changePlayHoldDuration:0,updatedAt:F.serverTimestamp()},{merge:true});
    return true;
  }catch(e){console.warn('customer change hold clear',e);return false}
}
async function submitSharedChangeRequest(payload){
  const user=await ensureUser(),p=clean(payload&&typeof payload==='object'?payload:{});
  const requestId=String(p.changeRequestId||p.requestId||''),bookingId=String(p.changeBookingId||p.bookingId||'');
  if(!requestId||!bookingId)throw new Error('reservation change request identity missing');
  let holdCreated=false;
  if(p.changePlay===true&&String(p.playUse||'no')==='yes'){
    const holdId=changeHoldDocId(requestId),date=String(p.changeRequestedDate||p.requestedDate||''),start=String(p.playStart||''),end=String(p.playEnd||''),duration=Number(p.playDuration||0);
    if(!date||!start||!end||![30,60].includes(duration))throw new Error('reservation change playground hold invalid');
    await F.setDoc(F.doc(db,AVAIL_COLLECTION,holdId),{
      id:holdId,ownerUid:user.uid,sourceBookingId:bookingId,date,status:'pending',playUse:'yes',playStart:start,playEnd:end,playDuration:duration,
      changePlayHoldDedicated:true,changePlayHoldActive:true,changePlayHoldRequestId:requestId,changePlayHoldSourceBookingId:bookingId,
      changePlayHoldDate:date,changePlayHoldStart:start,changePlayHoldEnd:end,changePlayHoldDuration:duration,bridgeVersion:BRIDGE_VERSION,updatedAt:F.serverTimestamp()
    },{merge:true});
    holdCreated=true;
  }
  const inquiryId=String(p.sharedInquiryId||`inq_change_${requestId}`);
  try{
    await F.setDoc(F.doc(db,INQUIRY_COLLECTION,inquiryId),{
      ...p,id:String(p.id||requestId),sharedInquiryId:inquiryId,sharedInquiryVersion:1,ownerUid:user.uid,
      changeRequest:true,changeRequestId:requestId,changeBookingId:bookingId,updatedAt:F.serverTimestamp()
    },{merge:true});
  }catch(e){
    if(holdCreated)await clearOwnChangePlayHold(requestId);
    throw e;
  }
  return {requestId,bookingId,inquiryId,holdId:holdCreated?changeHoldDocId(requestId):''};
}
function patchSetStore(){
  const current=window.setStore;
  if(current?.__zrSetStoreChain?.includes('customer-reservation'))return true;
  if(typeof current!=='function')return false;
  const chain=Array.isArray(current.__zrSetStoreChain)?current.__zrSetStoreChain:[];
  originalSetStore=current;
  const wrapped=function(k,v){
    const before=k===BOOKING_KEY?readLocal():null;
    const r=originalSetStore.apply(this,arguments);
    if(k===BOOKING_KEY&&!applyingRemote){
      try{queueBookingSync(before,v)}
      catch(e){
        lastWriteError=e;
        console.error('customer reservation firebase sync queue',e);
        toastSafe('예약은 이 기기에 저장됐지만 공용 DB 동기화 준비에 실패했습니다.');
      }
    }
    return r;
  };
  wrapped.__zrCustomerFirebaseBridge=true;
  wrapped.__zrSetStoreChain=[...chain,'customer-reservation'];
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
        if(!user){currentUser=null;await F.signInAnonymously(auth);return}
        currentUser=user;await startListeners(user);
      }catch(e){console.error('customer reservation auth state',e)}
    });
    if(!auth.currentUser)await F.signInAnonymously(auth);
    window.zrReservationFirebase={
      version:BRIDGE_VERSION,appName:CUSTOMER_APP_NAME,auth,db,
      get user(){return currentUser},
      isStaff:()=>false,
      waitForWrites,
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
