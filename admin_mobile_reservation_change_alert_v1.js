(()=>{
'use strict';
if(window.__ZR_ADMIN_MOBILE_RESERVATION_CHANGE_ALERT_V1)return;
window.__ZR_ADMIN_MOBILE_RESERVATION_CHANGE_ALERT_V1=true;

const FIREBASE_VERSION='12.17.1';
const $=id=>document.getElementById(id);
const mobile=()=>window.matchMedia('(max-width:900px)').matches;
let firestorePromise=null,availabilityStop=null,reservationsStop=null,inquiriesStop=null,timer=0;
let sharedPendingReservation=null;

function installStyle(){
  if($('zrAdminMobileReservationChangeAlertStyleV1'))return;
  const s=document.createElement('style');s.id='zrAdminMobileReservationChangeAlertStyleV1';
  s.textContent=`
    #zrAdminMobileAlertsV1 [data-mobile-go="reservationChange"] .zr-admin-mobile-alert-dot{background:#a74412!important}
    #zrAdminMobileDrawerV1 [data-mobile-go="reservationChange"] .zr-admin-mobile-menu-icon{background:#f7e6dc!important;color:#9a3c16!important}
  `;
  document.head.appendChild(s);
}
function ensureAlertRow(){
  const list=document.querySelector('#zrAdminMobileAlertsV1 .zr-admin-mobile-alert-list');if(!list)return false;
  if(list.querySelector('[data-mobile-go="reservationChange"]'))return true;
  const row=document.createElement('button');row.type='button';row.className='zr-admin-mobile-alert-row';row.dataset.mobileGo='reservationChange';
  row.innerHTML='<span class="zr-admin-mobile-alert-dot"></span><span>예약변경요청</span><strong data-mobile-count="zrSmartReservationChange">0</strong>';
  const inquiry=list.querySelector('[data-mobile-go="inquiries"]');
  if(inquiry?.nextSibling)list.insertBefore(row,inquiry.nextSibling);else if(inquiry)list.appendChild(row);else list.appendChild(row);
  return true;
}
function ensureDrawerRow(){
  const drawer=$('zrAdminMobileDrawerV1');if(!drawer)return false;
  const customer=[...drawer.querySelectorAll('[data-mobile-menu-group]')].find(g=>(g.querySelector('.zr-admin-mobile-menu-title')?.textContent||'').trim()==='고객');
  const list=customer?.querySelector('.zr-admin-mobile-menu-list');if(!list)return false;
  if(list.querySelector('[data-mobile-go="reservationChange"]'))return true;
  const row=document.createElement('button');row.type='button';row.className='zr-admin-mobile-menu-row';row.dataset.mobileGo='reservationChange';row.dataset.mobileLabel='예약변경현황';
  row.innerHTML='<span class="zr-admin-mobile-menu-icon">2</span><span>예약변경현황</span>';
  const inquiry=list.querySelector('[data-mobile-go="inquiries"]');
  if(inquiry?.nextSibling)list.insertBefore(row,inquiry.nextSibling);else list.appendChild(row);
  return true;
}
function allBookings(){
  try{
    const list=typeof window.bookings==='function'?window.bookings():JSON.parse(localStorage.getItem('zr_bookings')||'[]');
    return Array.isArray(list)?list.filter(b=>b&&!b.__availabilityOnly):[];
  }catch{
    try{const v=JSON.parse(localStorage.getItem('zr_bookings')||'[]');return Array.isArray(v)?v.filter(b=>b&&!b.__availabilityOnly):[]}catch{return[]}
  }
}
function localPendingReservation(){return allBookings().filter(b=>String(b.status||'')==='pending').length}
function localPendingChange(){return allBookings().filter(b=>{const r=b?.reservationChangeRequest;return !!r&&typeof r==='object'&&!['done','rejected'].includes(String(r.status||'pending'))}).length}
function countValue(v){const n=Number(v);return Number.isFinite(n)&&n>0?Math.trunc(n):0}
function setText(el,v){if(el)el.textContent=String(countValue(v))}
function syncBadge(){
  const badge=$('zrAdminMobileBellBadge');if(!badge)return;
  let total=0;document.querySelectorAll('#zrAdminMobileAlertsV1 [data-mobile-count]').forEach(el=>{const n=parseInt(String(el.textContent||'0').replace(/[^0-9-]/g,''),10);if(Number.isFinite(n)&&n>0)total+=n});
  badge.textContent=total>99?'99+':String(total);badge.hidden=total===0;
}
function sync(){
  if(!mobile())return;
  installStyle();ensureAlertRow();ensureDrawerRow();
  const pendingReservation=sharedPendingReservation===null?localPendingReservation():sharedPendingReservation;
  /* Use the exact same booking source as the desktop smart panel. The shared
     Firestore listeners wake this view up, but they do not build a second
     reservation-change count with their own request-id deduplication rules. */
  const pendingChange=localPendingChange();
  setText($('zrSmartPendingReservation'),pendingReservation);setText($('zrSmartReservationChange'),pendingChange);
  setText(document.querySelector('#zrAdminMobileAlertsV1 [data-mobile-count="zrSmartPendingReservation"]'),pendingReservation);
  setText(document.querySelector('#zrAdminMobileAlertsV1 [data-mobile-count="zrSmartReservationChange"]'),pendingChange);
  syncBadge();
}
function firestore(){return firestorePromise||(firestorePromise=import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`).catch(()=>null))}
async function attachSharedCounts(){
  const bridge=window.zrReservationFirebase;if(!bridge?.db)return false;
  const F=await firestore();if(!F)return false;
  if(!availabilityStop){
    try{
      availabilityStop=F.onSnapshot(F.collection(bridge.db,'reservationAvailability'),snap=>{
        sharedPendingReservation=snap.docs.filter(d=>{const x=d.data()||{};return x.changePlayHoldDedicated!==true&&String(x.status||'')==='pending'}).length;sync();
      },()=>{});
    }catch{}
  }
  if(bridge.isStaff?.()){
    if(!reservationsStop){
      try{
        reservationsStop=F.onSnapshot(F.collection(bridge.db,'reservations'),snap=>{
          const rows=snap.docs.map(d=>({id:d.id,...(d.data()||{})}));
          sharedPendingReservation=rows.filter(b=>String(b.status||'')==='pending').length;
          sync();
        },()=>{});
      }catch{}
    }
    if(!inquiriesStop){
      try{
        inquiriesStop=F.onSnapshot(F.collection(bridge.db,'customerInquiries'),()=>sync(),()=>{});
      }catch{}
    }
  }
  return true;
}
function start(){
  installStyle();sync();attachSharedCounts();
  if(timer)return;
  timer=setInterval(()=>{sync();attachSharedCounts()},700);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(start,0),{once:true});
document.addEventListener('zr:inquiry-shared-updated',()=>setTimeout(sync,0));
document.addEventListener('zr:inquiry-replies-changed',()=>setTimeout(sync,0));
window.addEventListener('storage',e=>{if(e.key==='zr_bookings'||e.key==='zr_inquiries')setTimeout(sync,0)});
window.addEventListener('resize',()=>{if(mobile())start()},{passive:true});
})();
