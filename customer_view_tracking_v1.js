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
const LABELS={guide:'가이드맵',parking:'주차 및 인솔',schedule:'관람 및 체험일정'};
const $=id=>document.getElementById(id);
const remoteDone=new Set();
const inflight=new Set();
let FS=null,db=null,statusTimer=null;

function showStatus(message,state='ok'){
  let el=$('zrCustomerViewTrackStatus');
  if(!el){
    el=document.createElement('div');
    el.id='zrCustomerViewTrackStatus';
    el.setAttribute('role','status');
    Object.assign(el.style,{position:'fixed',left:'50%',bottom:'22px',transform:'translateX(-50%)',zIndex:'2147483600',maxWidth:'calc(100vw - 28px)',padding:'11px 14px',borderRadius:'12px',fontSize:'13px',fontWeight:'800',lineHeight:'1.4',textAlign:'center',boxShadow:'0 8px 28px rgba(0,0,0,.24)',pointerEvents:'none',transition:'opacity .18s ease'});
    document.body.appendChild(el);
  }
  el.textContent=message;
  el.style.background=state==='ok'?'#e8f5ec':state==='warn'?'#fff6d9':'#fdeceb';
  el.style.color=state==='ok'?'#24553f':state==='warn'?'#6a5317':'#8a2d2d';
  el.style.border=state==='ok'?'1px solid #bedac8':state==='warn'?'1px solid #e8d491':'1px solid #edbcbc';
  el.style.opacity='1';
  clearTimeout(statusTimer);
  statusTimer=setTimeout(()=>{el.style.opacity='0'},5200);
}
function ensureRecovery(){
  if(window.__ZR_CUSTOMER_FIREBASE_BRIDGE_RECOVERY_V1||$('zrCustomerFirebaseBridgeRecoveryV1'))return;
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
      }catch(e){console.debug('customer view firebase import',e);return false}
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
  try{window.setStore(KEY,list);return true}catch(e){console.debug('customer view owner fallback',e);return false}
}
async function track(id,kind){
  const field=FIELDS[kind],label=LABELS[kind]||'고객 안내';
  id=String(id||'');
  if(!id||!field){showStatus('고객 확인 기록 정보가 올바르지 않습니다.','err');return}
  const key=`${id}|${field}`;
  if(remoteDone.has(key)){showStatus(`${label} · 서버 확인 기록 완료`,'ok');return}
  if(inflight.has(key))return;
  inflight.add(key);
  showStatus(`${label} · 서버 기록 확인 중...`,'warn');
  const stamp=new Date().toISOString();
  let remoteOk=false,errorCode='firebase-unavailable';
  try{
    if(await ensureFirebase()){
      await FS.updateDoc(FS.doc(db,COLLECTION,id),{[field]:stamp});
      remoteOk=true;errorCode='';remoteDone.add(key);
    }
  }catch(e){
    errorCode=String(e?.code||e?.message||'unknown-error');
    console.debug('customer view direct write',kind,id,errorCode);
  }finally{
    inflight.delete(key);
  }
  const localOk=remoteOk?false:fallbackOwnerSync(id,field,stamp);
  if(remoteOk)showStatus(`${label} · 서버 확인 기록 성공`,'ok');
  else if(/permission-denied/i.test(errorCode))showStatus(`${label} · Firebase 권한 거부 (permission-denied)`,'err');
  else if(errorCode==='firebase-unavailable')showStatus(`${label} · Firebase 연결 확인 필요`,'warn');
  else showStatus(`${label} · 서버 기록 실패 (${errorCode})`,'err');
  try{document.dispatchEvent(new CustomEvent('zr:customer-view-tracked',{detail:{bookingId:id,field,kind,remoteOk,localOk,errorCode}}))}catch{}
}

ensureRecovery();
window.zrCustomerViewTrackingV1={version:4,track};
try{document.dispatchEvent(new CustomEvent('zr:customer-view-tracking-ready'))}catch{}
})();
