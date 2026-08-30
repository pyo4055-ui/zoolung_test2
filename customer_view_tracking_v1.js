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
const $=id=>document.getElementById(id);
const tel=s=>String(s||'').replace(/\D/g,'');
const done=new Set();
let FS=null,db=null,root=null;

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
  if(done.has(key))return;
  done.add(key);
  const stamp=new Date().toISOString();
  let remoteOk=false;
  try{
    if(await ensureFirebase()){
      await FS.updateDoc(FS.doc(db,COLLECTION,String(id)),{[field]:stamp});
      remoteOk=true;
    }
  }catch(e){
    console.debug('customer view direct write',kind,id,e?.code||e?.message||e);
  }
  if(!remoteOk)fallbackOwnerSync(id,field,stamp);
  try{document.dispatchEvent(new CustomEvent('zr:customer-view-tracked',{detail:{bookingId:String(id),field,kind,remoteOk}}))}catch{}
}
function armAction(btn){
  if(!customerVisible()||!btn)return;
  const kind=actionKind(btn);if(!kind)return;
  const b=resolveCardBooking(btn.closest('.existing-card'));if(!b?.id)return;
  const id=String(b.id),modalId=MODALS[kind];
  [90,180,320].forEach(ms=>setTimeout(()=>{
    if(!done.has(`${id}|${FIELDS[kind]}`)&&modalOpen(modalId))persistView(id,kind);
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
