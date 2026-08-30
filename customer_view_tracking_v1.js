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
const MODALS={
  guide:'zrGuideMapModalV32',
  parking:'zrCustomerParkingQuickV1',
  schedule:'zrCustomerScheduleZoom'
};
const LABELS={guide:'가이드맵',parking:'주차 및 인솔',schedule:'관람 및 체험일정'};
const $=id=>document.getElementById(id);
const tel=s=>String(s||'').replace(/\D/g,'');
const remoteDone=new Set();
const inflight=new Set();
let FS=null,db=null,root=null,statusTimer=null;

function customerVisible(){
  const v=$('customerView');
  return !!v&&!v.classList.contains('hidden')&&getComputedStyle(v).display!=='none';
}
function readBookings(){
  try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}
  catch{return[]}
}
function customerBookings(){
  const manager=String($('startManager')?.value||'').trim();
  const contact=tel($('startContact')?.value||'');
  if(!manager||!contact)return[];
  return readBookings().filter(b=>b&&!b.__availabilityOnly&&!['cancelled','rejected'].includes(String(b.status||''))&&String(b.managerName||'').trim()===manager&&tel(b.contact)===contact);
}
function resolveCardBooking(card){
  if(!card)return null;
  const cached=String(card.dataset.zrBookingId||'');
  if(cached){const b=readBookings().find(x=>String(x?.id||'')===cached);if(b)return b}
  const candidates=customerBookings();
  if(!candidates.length)return null;
  const text=String(card.textContent||'').replace(/\s+/g,' ');
  let matched=candidates.filter(b=>String(b.id||'')&&text.includes(String(b.id)));
  if(matched.length!==1)matched=candidates.filter(b=>String(b.orgName||'').trim()&&text.includes(String(b.orgName).trim())&&String(b.date||'').trim()&&text.includes(String(b.date).trim()));
  if(matched.length!==1)matched=candidates.filter(b=>String(b.orgName||'').trim()&&text.includes(String(b.orgName).trim()));
  const b=matched.length===1?matched[0]:(candidates.length===1?candidates[0]:null);
  if(b)card.dataset.zrBookingId=String(b.id);
  return b;
}
function actionKind(btn){
  if(btn?.classList?.contains('zr-customer-guide-action'))return'guide';
  if(btn?.classList?.contains('zr-customer-parking-action'))return'parking';
  if(btn?.classList?.contains('zr-customer-schedule-action'))return'schedule';
  return'';
}
function modalOpen(id){
  const m=$(id);
  return !!m&&!m.classList.contains('hidden')&&getComputedStyle(m).display!=='none';
}
function showStatus(message,state='ok'){
  let el=$('zrCustomerViewTrackStatus');
  if(!el){
    el=document.createElement('div');
    el.id='zrCustomerViewTrackStatus';
    el.setAttribute('role','status');
    Object.assign(el.style,{position:'fixed',left:'50%',bottom:'22px',transform:'translateX(-50%)',zIndex:'13050',maxWidth:'calc(100vw - 28px)',padding:'11px 14px',borderRadius:'12px',fontSize:'13px',fontWeight:'800',lineHeight:'1.4',textAlign:'center',boxShadow:'0 8px 28px rgba(0,0,0,.24)',pointerEvents:'none',transition:'opacity .18s ease'});
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
async function ensureFirebase(timeout=5000){
  if(FS&&db)return true;
  const start=Date.now();
  while(Date.now()-start<timeout){
    const z=window.zrReservationFirebase;
    if(z?.db&&z?.auth?.currentUser){
      try{
        FS=await import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`);
        db=z.db;
        return true;
      }catch(e){console.debug('customer view firebase import',e);return false}
    }
    await new Promise(r=>setTimeout(r,100));
  }
  return false;
}
function fallbackOwnerSync(id,field,stamp){
  if(typeof window.setStore!=='function')return false;
  const list=readBookings();
  const b=list.find(x=>String(x?.id||'')===String(id));
  if(!b||b.__availabilityOnly||['cancelled','rejected'].includes(String(b.status||'')))return false;
  if(!b[field])b[field]=stamp;
  try{window.setStore(KEY,list);return true}catch(e){console.debug('customer view owner fallback',e);return false}
}
async function persistView(id,kind){
  const field=FIELDS[kind];
  if(!customerVisible()||!id||!field)return;
  const key=`${id}|${field}`;
  if(remoteDone.has(key)||inflight.has(key))return;
  inflight.add(key);
  const stamp=new Date().toISOString();
  let remoteOk=false,errorCode='firebase-unavailable';
  try{
    if(await ensureFirebase()){
      await FS.updateDoc(FS.doc(db,COLLECTION,String(id)),{[field]:stamp});
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
  const label=LABELS[kind]||'고객 안내';
  if(remoteOk)showStatus(`${label} · 서버 확인 기록 성공`,'ok');
  else if(/permission-denied/i.test(errorCode))showStatus(`${label} · Firebase 권한 거부 (permission-denied)`,'err');
  else if(errorCode==='firebase-unavailable')showStatus(`${label} · Firebase 연결 확인 필요`,'warn');
  else showStatus(`${label} · 서버 기록 실패 (${errorCode})`,'err');
  try{document.dispatchEvent(new CustomEvent('zr:customer-view-tracked',{detail:{bookingId:String(id),field,kind,remoteOk,localOk,errorCode}}))}catch{}
}
function armAction(btn){
  if(!customerVisible()||!btn)return;
  const kind=actionKind(btn);if(!kind)return;
  const b=resolveCardBooking(btn.closest('.existing-card'));
  if(!b?.id){showStatus('확인 기록 대상 예약을 찾지 못했습니다.','err');return}
  const id=String(b.id),modalId=MODALS[kind];
  [90,180,320].forEach(ms=>setTimeout(()=>{
    if(!remoteDone.has(`${id}|${FIELDS[kind]}`)&&!inflight.has(`${id}|${FIELDS[kind]}`)&&modalOpen(modalId))persistView(id,kind);
  },ms));
}
function onPointerUp(e){
  const btn=e.target?.closest?.('.zr-customer-guide-action,.zr-customer-parking-action,.zr-customer-schedule-action');
  if(btn&&root?.contains(btn))armAction(btn);
}
function onKeyDown(e){
  if(e.key!=='Enter'&&e.key!==' ')return;
  const btn=e.target?.closest?.('.zr-customer-guide-action,.zr-customer-parking-action,.zr-customer-schedule-action');
  if(btn&&root?.contains(btn))armAction(btn);
}
function bindRoot(){
  const next=$('existingBookingList');
  if(!next||next===root)return !!root;
  if(root){root.removeEventListener('pointerup',onPointerUp);root.removeEventListener('keydown',onKeyDown)}
  root=next;
  root.addEventListener('pointerup',onPointerUp,{passive:true});
  root.addEventListener('keydown',onKeyDown);
  return true;
}
function boot(){
  bindRoot();
  let tries=0;
  const timer=setInterval(()=>{if(bindRoot()&&++tries>12)clearInterval(timer);else if(++tries>60)clearInterval(timer)},300);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
