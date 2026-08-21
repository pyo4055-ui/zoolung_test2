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
let ownFull=new Map(),availability=new Map();
let applyingRemote=false;
let writeChain=Promise.resolve();
let originalSetStore=null;
let bridgeStarted=false;
let legacyLocal=new Map();

const isStaff=u=>!!u&&String(u.email||'').toLowerCase()===STAFF_EMAIL.toLowerCase();
const readLocal=()=>{try{return JSON.parse(localStorage.getItem(BOOKING_KEY)||'[]')}catch{return []}};
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
    if(same(prev?.[k],next?.[k]))continue;
    const c=clean(next?.[k]);
    if(c!==undefined)out[k]=c;
  }
  return out;
}
function availabilityPatch(b,ownerUid){
  return clean({
    id:b.id,
    ownerUid,
    date:b.date||'',
    status:b.status||'pending',
    playUse:b.playUse||'no',
    playStart:b.playStart||'',
    playEnd:b.playEnd||'',
    bridgeVersion:BRIDGE_VERSION
  });
}
function availabilityPlaceholder(a){
  return {
    id:a.id,
    date:a.date||'',
    status:a.status||'pending',
    playUse:a.playUse||'no',
    playStart:a.playStart||'',
    playEnd:a.playEnd||'',
    paidCount:0,chaperoneCount:0,freeChaperone:0,paidChaperone:0,
    entryTime:'',exitTime:'',mealType:'none',mealStart:'',mealEnd:'',
    orgName:'',managerName:'',contact:'',email:'',notes:'',
    __availabilityOnly:true
  };
}
function refreshUi(){
  try{if(typeof window.renderVisitDays==='function')window.renderVisitDays()}catch(e){console.debug('renderVisitDays',e)}
  try{if(typeof window.refreshPlayStarts==='function')window.refreshPlayStarts()}catch(e){console.debug('refreshPlayStarts',e)}
  const av=document.getElementById('adminView');
  const adminVisible=av&&getComputedStyle(av).display!=='none'&&!av.classList.contains('hidden');
  if(adminVisible){
    for(const fn of ['renderAdmin','renderActivity','renderMealStatus','renderOutsourcingPayments']){
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
  directWriteLocal([...ownFull.values()].map(x=>clone(x)));
  refreshUi();
}
function stopListeners(){
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
      let ownerUid=user.uid;
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
  stopListeners();
  if(isStaff(user)){
    await migrateStaffLocal(user);
    stopFull=F.onSnapshot(F.collection(db,FULL_COLLECTION),snap=>{
      ownFull=new Map(snap.docs.map(d=>[d.id,{id:d.id,...d.data()}]));
      applyStaffCache();
    },e=>{console.error('reservation staff listener',e);toastSafe('공용 예약 DB 연결을 확인해주세요.')});
  }else{
    const q=F.query(F.collection(db,FULL_COLLECTION),F.where('ownerUid','==',user.uid));
    stopFull=F.onSnapshot(q,snap=>{
      ownFull=new Map(snap.docs.map(d=>[d.id,{id:d.id,...d.data()}]));
      applyAnonymousCache();
    },e=>console.error('reservation owner listener',e));
    stopAvail=F.onSnapshot(F.collection(db,AVAIL_COLLECTION),snap=>{
      availability=new Map(snap.docs.map(d=>[d.id,{id:d.id,...d.data()}]));
      applyAnonymousCache();
    },e=>console.error('reservation availability listener',e));
  }
}

async function ensureUser(){
  if(auth.currentUser)return auth.currentUser;
  await F.setPersistence(auth,F.browserLocalPersistence);
  const cred=await F.signInAnonymously(auth);
  return cred.user;
}

function queueBookingSync(before,after){
  if(applyingRemote)return;
  const prev=byId(before),next=byId(after);
  const changed=[];
  for(const [id,b] of next){
    const old=prev.get(id);
    if(!old||!same(clean(old),clean(b)))changed.push({id,old,b});
  }
  if(!changed.length)return;
  writeChain=writeChain.then(async()=>{
    const user=await ensureUser();
    for(const item of changed){
      const {id,old,b}=item;
      if(b.__availabilityOnly||b.__legacyLocal)continue;
      const remoteOwner=ownFull.get(id)?.ownerUid||old?.ownerUid||b.ownerUid||'';
      if(!isStaff(user)&&remoteOwner&&remoteOwner!==user.uid){
        console.warn('skip write: booking is not owned by this browser',id);continue;
      }
      const ownerUid=remoteOwner||user.uid;
      const patch=changedTop(old,b);
      if(!old)Object.assign(patch,clean(b));
      patch.id=id;patch.ownerUid=ownerUid;patch.bridgeVersion=BRIDGE_VERSION;patch.updatedAt=F.serverTimestamp();
      await F.setDoc(F.doc(db,FULL_COLLECTION,id),patch,{merge:true});
      await F.setDoc(F.doc(db,AVAIL_COLLECTION,id),{...availabilityPatch(b,ownerUid),updatedAt:F.serverTimestamp()},{merge:true});
    }
  }).catch(e=>{
    console.error('reservation firebase write',e);
    toastSafe('예약은 이 기기에 저장됐지만 공용 DB 저장에 실패했습니다.');
  });
}

function patchSetStore(){
  if(window.setStore?.__zrFirebaseBridge)return;
  if(typeof window.setStore!=='function')return false;
  originalSetStore=window.setStore;
  const wrapped=function(k,v){
    const before=k===BOOKING_KEY?readLocal():null;
    const r=originalSetStore.apply(this,arguments);
    if(k===BOOKING_KEY&&!applyingRemote)queueBookingSync(before,v);
    return r;
  };
  wrapped.__zrFirebaseBridge=true;
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
        if(!user){currentUser=null;await F.signInAnonymously(auth);return}
        currentUser=user;await startListeners(user);
      }catch(e){console.error('reservation auth state',e)}
    });
    if(!auth.currentUser)await F.signInAnonymously(auth);
    window.zrReservationFirebase={version:BRIDGE_VERSION,auth,db,get user(){return currentUser},isStaff:()=>isStaff(currentUser)};
  }catch(e){
    console.error('reservation firebase bridge boot failed',e);
    toastSafe('공용 예약 DB 연결 실패 · 기존 로컬 저장으로 동작합니다.');
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
