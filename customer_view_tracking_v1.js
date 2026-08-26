(()=>{
'use strict';
if(window.__ZR_CUSTOMER_VIEW_TRACKING_V1)return;
window.__ZR_CUSTOMER_VIEW_TRACKING_V1=true;

const FV='12.17.1';
const KEY='zr_bookings';
const FIELDS={
  guide:'customerViewedGuideMapAt',
  parking:'customerViewedParkingAt',
  schedule:'customerViewedScheduleAt'
};
const ALLOWED_FIELDS=new Set(Object.values(FIELDS));
const $=id=>document.getElementById(id);
const tel=s=>String(s||'').replace(/\D/g,'');
let listObserver=null;
let scheduleObserver=null;
let syncQueued=false;
let FS=null,db=null;
const inflight=new Set();
const remoteDone=new Set();
const failureShown=new Set();

function toastSafe(msg){try{if(typeof window.toast==='function')window.toast(msg)}catch{}}
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
async function ensureDirectDb(){
  if(FS&&db)return true;
  const z=window.zrReservationFirebase;
  if(!z?.db)return false;
  try{
    FS=await import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`);
    db=z.db;
    return true;
  }catch(e){console.debug('customer view tracking firebase',e);return false}
}
async function writeRemoteView(id,field,stamp){
  if(!id||!ALLOWED_FIELDS.has(field))return false;
  const key=`${id}:${field}`;
  if(remoteDone.has(key)||inflight.has(key))return true;
  inflight.add(key);
  try{
    if(!(await ensureDirectDb()))throw new Error('firebase-unavailable');
    await FS.updateDoc(FS.doc(db,'reservations',String(id)),{[field]:stamp});
    remoteDone.add(key);
    failureShown.delete(key);
    toastSafe('확인 기록 완료');
    document.dispatchEvent(new CustomEvent('zr:customer-view-tracked',{detail:{bookingId:String(id),field,remote:true}}));
    return true;
  }catch(e){
    console.warn('customer view receipt write failed',id,field,e);
    if(!failureShown.has(key)){
      failureShown.add(key);
      toastSafe('확인 기록 권한 확인 필요');
    }
    return false;
  }finally{inflight.delete(key)}
}
function persistFirstView(id,field,retry=0){
  if(!customerVisible()||!id||!ALLOWED_FIELDS.has(field))return;
  const list=readBookings();
  const b=list.find(x=>String(x?.id||'')===String(id));
  if(!b||b.__availabilityOnly||['cancelled','rejected'].includes(String(b.status||'')))return;
  const stamp=String(b[field]||'').trim()||new Date().toISOString();
  if(!b[field]){
    if(typeof window.setStore!=='function'){
      if(retry<12)setTimeout(()=>persistFirstView(id,field,retry+1),250);
      return;
    }
    b[field]=stamp;
    try{window.setStore(KEY,list)}catch(e){console.debug('customer view local tracking',e)}
  }
  void writeRemoteView(id,field,stamp);
}
function modalOpen(id){
  const m=$(id);return !!m&&!m.classList.contains('hidden')&&getComputedStyle(m).display!=='none';
}
function confirmModalAfter(id,field,modalId){
  [40,120,300].forEach(ms=>setTimeout(()=>{if(modalOpen(modalId))persistFirstView(id,field)},ms));
}
function bindAction(button,field,modalId){
  if(!button||button.dataset.zrViewTracking==='1')return;
  button.dataset.zrViewTracking='1';
  const arm=()=>{
    const card=button.closest('.existing-card');
    const b=resolveCardBooking(card);if(!b)return;
    confirmModalAfter(b.id,field,modalId);
  };
  button.addEventListener('pointerdown',arm,{passive:true});
  button.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')arm()});
}
function bindCustomerCards(){
  const list=$('existingBookingList');if(!list)return;
  list.querySelectorAll('.existing-card').forEach(card=>{
    if(card.classList.contains('zr-cancelled-record'))return;
    const b=resolveCardBooking(card);
    if(b)card.dataset.zrBookingId=String(b.id);
    bindAction(card.querySelector('.zr-customer-guide-action'),FIELDS.guide,'zrGuideMapModalV32');
    bindAction(card.querySelector('.zr-customer-parking-action'),FIELDS.parking,'zrCustomerParkingQuickV1');
  });
}
function bindScheduleCards(){
  document.querySelectorAll('#zrCustomerScheduleBox .zr-customer-schedule').forEach(card=>{
    if(card.dataset.zrViewTracking==='1')return;
    const id=card.querySelector('[data-zr-zoom]')?.dataset?.zrZoom||'';
    if(!id)return;
    card.dataset.zrViewTracking='1';
    card.dataset.zrBookingId=String(id);
    const zoom=card.querySelector('[data-zr-zoom]');
    if(zoom){
      zoom.addEventListener('pointerdown',()=>persistFirstView(id,FIELDS.schedule),{passive:true});
      zoom.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')persistFirstView(id,FIELDS.schedule)});
    }
    if(scheduleObserver)scheduleObserver.observe(card);
    else card.addEventListener('click',()=>persistFirstView(id,FIELDS.schedule),{once:true});
  });
}
function sync(){
  if(syncQueued)return;syncQueued=true;
  requestAnimationFrame(()=>{syncQueued=false;if(!customerVisible())return;bindCustomerCards();bindScheduleCards()});
}
function installListObserver(){
  const list=$('existingBookingList');if(!list||list.dataset.zrViewTrackingRoot==='1')return false;
  list.dataset.zrViewTrackingRoot='1';
  listObserver=new MutationObserver(()=>{sync();setTimeout(sync,80);setTimeout(sync,350)});
  listObserver.observe(list,{childList:true,subtree:true});
  return true;
}
function hookLookupButtons(){
  ['lookupBooking','checkExisting'].forEach(id=>{
    const b=$(id);if(!b||b.dataset.zrViewTrackingHook==='1')return;
    b.dataset.zrViewTrackingHook='1';
    b.addEventListener('click',()=>[0,100,350,900].forEach(ms=>setTimeout(sync,ms)));
  });
}
function boot(){
  if('IntersectionObserver' in window){
    scheduleObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting||entry.intersectionRatio<0.15)return;
        const id=entry.target.dataset.zrBookingId||entry.target.querySelector('[data-zr-zoom]')?.dataset?.zrZoom||'';
        if(id)persistFirstView(id,FIELDS.schedule);
        scheduleObserver.unobserve(entry.target);
      });
    },{threshold:[0.15]});
  }
  hookLookupButtons();installListObserver();sync();
  let tries=0;
  const timer=setInterval(()=>{
    hookLookupButtons();installListObserver();sync();
    if(++tries>60)clearInterval(timer);
  },300);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
