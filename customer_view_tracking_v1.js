(()=>{
'use strict';
if(window.__ZR_CUSTOMER_VIEW_TRACKING_V1)return;
window.__ZR_CUSTOMER_VIEW_TRACKING_V1=true;

const FV='12.17.1';
const COLLECTION='reservations';
const KEY='zr_bookings';
const FIELDS={
  guide:'customerViewedGuideMapAt',
  parking:'customerViewedParkingAt',
  schedule:'customerViewedScheduleAt'
};
const remoteDone=new Set();
const inflight=new Set();
let FS=null,db=null;

function ensureRecovery(){
  if(window.__ZR_CUSTOMER_FIREBASE_BRIDGE_RECOVERY_V1||document.getElementById('zrCustomerFirebaseBridgeRecoveryV1'))return;
  const s=document.createElement('script');
  s.id='zrCustomerFirebaseBridgeRecoveryV1';
  s.async=false;
  s.src='./customer_firebase_bridge_recovery_v1.js?v=1';
  document.body.appendChild(s);
}
async function ensureFirebase(timeout=7000){
  if(FS&&db)return true;
  ensureRecovery();
  const start=Date.now();
  let recoveryAsked=false;
  while(Date.now()-start<timeout){
    const z=window.zrReservationFirebase;
    if(z?.db&&z?.auth?.currentUser){
      try{
        FS=await import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`);
        db=z.db;
        return true;
      }catch(e){
        console.debug('customer view firebase import',e);
        return false;
      }
    }
    if(!recoveryAsked&&Date.now()-start>900&&typeof window.zrCustomerFirebaseBridgeRecoveryV1?.recover==='function'){
      recoveryAsked=true;
      window.zrCustomerFirebaseBridgeRecoveryV1.recover();
    }
    await new Promise(r=>setTimeout(r,100));
  }
  return false;
}
function readBookings(){
  try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}
  catch{return[]}
}
function fallbackOwnerSync(id,field,stamp){
  if(typeof window.setStore!=='function')return false;
  const list=readBookings();
  const b=list.find(x=>String(x?.id||'')===String(id));
  if(!b||b.__availabilityOnly||['cancelled','rejected'].includes(String(b.status||'')))return false;
  if(!b[field])b[field]=stamp;
  try{window.setStore(KEY,list);return true}
  catch(e){console.debug('customer view owner fallback',e);return false}
}
async function track(id,kind){
  const field=FIELDS[kind];
  id=String(id||'');
  if(!id||!field)return;
  const key=`${id}|${field}`;
  if(remoteDone.has(key)||inflight.has(key))return;
  inflight.add(key);
  const stamp=new Date().toISOString();
  let remoteOk=false,errorCode='firebase-unavailable';
  try{
    if(await ensureFirebase()){
      await FS.updateDoc(FS.doc(db,COLLECTION,id),{[field]:stamp});
      remoteOk=true;
      errorCode='';
      remoteDone.add(key);
    }
  }catch(e){
    errorCode=String(e?.code||e?.message||'unknown-error');
    console.debug('customer view direct write',kind,id,errorCode);
  }finally{
    inflight.delete(key);
  }
  const localOk=remoteOk?false:fallbackOwnerSync(id,field,stamp);
  try{document.dispatchEvent(new CustomEvent('zr:customer-view-tracked',{detail:{bookingId:id,field,kind,remoteOk,localOk,errorCode}}))}catch{}
}

ensureRecovery();
window.zrCustomerViewTrackingV1={version:5,track};
try{document.dispatchEvent(new CustomEvent('zr:customer-view-tracking-ready'))}catch{}
})();
