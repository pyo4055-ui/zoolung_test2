(()=>{
'use strict';
if(window.__ZR_ADMIN_MOBILE_RESERVATION_CHANGE_ALERT_V1)return;
window.__ZR_ADMIN_MOBILE_RESERVATION_CHANGE_ALERT_V1=true;

const FIREBASE_VERSION='12.17.1';
const $=id=>document.getElementById(id);
let bodyObserver=null;
let availabilityStop=null;
let reservationsStop=null;
let sharedPendingReservation=null;
let sharedPendingChange=null;
let staffWatch=0;

function installStyle(){
  if($('zrAdminMobileReservationChangeAlertStyleV1'))return;
  const s=document.createElement('style');
  s.id='zrAdminMobileReservationChangeAlertStyleV1';
  s.textContent=`
    #zrAdminMobileAlertsV1 [data-mobile-go="reservationChange"] .zr-admin-mobile-alert-dot{background:#a74412!important}
    #zrAdminMobileDrawerV1 [data-mobile-go="reservationChange"] .zr-admin-mobile-menu-icon{background:#f7e6dc!important;color:#9a3c16!important}
  `;
  document.head.appendChild(s);
}
function ensureAlertRow(){
  const list=document.querySelector('#zrAdminMobileAlertsV1 .zr-admin-mobile-alert-list');
  if(!list)return false;
  let row=list.querySelector('[data-mobile-go="reservationChange"]');
  if(!row){
    row=document.createElement('button');
    row.type='button';
    row.className='zr-admin-mobile-alert-row';
    row.dataset.mobileGo='reservationChange';
    row.innerHTML='<span class="zr-admin-mobile-alert-dot"></span><span>예약변경요청</span><strong data-mobile-count="zrSmartReservationChange">0</strong>';
    const inquiry=list.querySelector('[data-mobile-go="inquiries"]');
    if(inquiry?.nextSibling)list.insertBefore(row,inquiry.nextSibling);else if(inquiry)list.appendChild(row);else list.appendChild(row);
  }
  return true;
}
function ensureDrawerRow(){
  const drawer=$('zrAdminMobileDrawerV1');if(!drawer)return false;
  const groups=[...drawer.querySelectorAll('[data-mobile-menu-group]')];
  const customer=groups.find(g=>(g.querySelector('.zr-admin-mobile-menu-title')?.textContent||'').trim()==='고객');
  const list=customer?.querySelector('.zr-admin-mobile-menu-list');if(!list)return false;
  if(list.querySelector('[data-mobile-go="reservationChange"]'))return true;
  const row=document.createElement('button');
  row.type='button';row.className='zr-admin-mobile-menu-row';row.dataset.mobileGo='reservationChange';row.dataset.mobileLabel='예약변경현황';
  row.innerHTML='<span class="zr-admin-mobile-menu-icon">2</span><span>예약변경현황</span>';
  const inquiry=list.querySelector('[data-mobile-go="inquiries"]');
  if(inquiry?.nextSibling)list.insertBefore(row,inquiry.nextSibling);else list.appendChild(row);
  return true;
}
function readLocalBookings(){try{const v=JSON.parse(localStorage.getItem('zr_bookings')||'[]');return Array.isArray(v)?v.filter(b=>b&&!b.__availabilityOnly):[]}catch{return[]}}
function localPendingChange(){return readLocalBookings().filter(b=>{const r=b?.reservationChangeRequest;if(!r||typeof r!=='object')return false;return !['done','rejected'].includes(String(r.status||'pending'))}).length}
function localPendingReservation(){return readLocalBookings().filter(b=>String(b.status||'')==='pending').length}
function numberText(v){const n=Number(v);return Number.isFinite(n)&&n>0?Math.trunc(n):0}
function setCount(id,value){const el=$(id);if(el)el.textContent=String(numberText(value))}
function syncBadge(){
  const badge=$('zrAdminMobileBellBadge');if(!badge)return;
  let total=0;
  document.querySelectorAll('#zrAdminMobileAlertsV1 [data-mobile-count]').forEach(el=>{
    const n=parseInt(String(el.textContent||'0').replace(/[^0-9-]/g,''),10);if(Number.isFinite(n)&&n>0)total+=n;
  });
  badge.textContent=total>99?'99+':String(total);badge.hidden=total===0;
}
function sync(){
  installStyle();ensureAlertRow();ensureDrawerRow();
  const pendingReservation=sharedPendingReservation===null?localPendingReservation():sharedPendingReservation;
  const pendingChange=sharedPendingChange===null?localPendingChange():sharedPendingChange;
  setCount('zrSmartPendingReservation',pendingReservation);
  setCount('zrSmartReservationChange',pendingChange);
  const mobileReservation=document.querySelector('#zrAdminMobileAlertsV1 [data-mobile-count="zrSmartPendingReservation"]');if(mobileReservation)mobileReservation.textContent=String(numberText(pendingReservation));
  const mobileChange=document.querySelector('#zrAdminMobileAlertsV1 [data-mobile-count="zrSmartReservationChange"]');if(mobileChange)mobileChange.textContent=String(numberText(pendingChange));
  syncBadge();
}
function closeMobileOverlays(){
  for(const id of ['zrAdminMobileAlertsV1','zrAdminMobileDrawerV1','zrAdminMobileQuickV1'])$(id)?.classList.remove('is-open');
  $('zrAdminMobileDrawerBackdropV1')?.classList.remove('is-open');
  $('zrAdminMobileBell')?.classList.remove('is-open');$('zrAdminMobileBell')?.setAttribute('aria-expanded','false');
  $('zrAdminMobileMenuTrigger')?.classList.remove('is-open');$('zrAdminMobileMenuTrigger')?.setAttribute('aria-expanded','false');
  document.documentElement.classList.remove('zr-admin-mobile-overlay-open');
}
function openReservationChange(){
  closeMobileOverlays();
  const rail=document.querySelector('#zrAdminShellRail [data-zr-admin-item="reservationChange"]');
  rail?.click();
  let tries=0;const timer=setInterval(()=>{
    const target=$('zrReservationChangeAdminRequestSubtab');
    if(target){clearInterval(timer);target.click();window.scrollTo({top:0,behavior:'auto'});return}
    if(++tries>30)clearInterval(timer);
  },50);
}
function intercept(e){
  const b=e.target?.closest?.('#zrAdminMobileAlertsV1 [data-mobile-go="reservationChange"],#zrAdminMobileDrawerV1 [data-mobile-go="reservationChange"]');
  if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openReservationChange();
}
async function attachSharedCounts(){
  const bridge=window.zrReservationFirebase;if(!bridge?.db||!bridge?.auth)return false;
  let F;try{F=await import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`)}catch{return false}
  if(!availabilityStop){
    try{availabilityStop=F.onSnapshot(F.collection(bridge.db,'reservationAvailability'),snap=>{sharedPendingReservation=snap.docs.filter(d=>String(d.data()?.status||'')==='pending').length;sync()},()=>{})}catch{}
  }
  if(!reservationsStop&&bridge.isStaff?.()){
    try{reservationsStop=F.onSnapshot(F.collection(bridge.db,'reservations'),snap=>{
      const rows=snap.docs.map(d=>d.data()||{});
      sharedPendingReservation=rows.filter(b=>String(b.status||'')==='pending').length;
      sharedPendingChange=rows.filter(b=>{const r=b.reservationChangeRequest;if(!r||typeof r!=='object')return false;return !['done','rejected'].includes(String(r.status||'pending'))}).length;
      sync();
    },()=>{})}catch{}
  }
  return true;
}
function watchStaff(){
  if(staffWatch)return;
  let tries=0;staffWatch=setInterval(()=>{
    attachSharedCounts();sync();
    if(window.zrReservationFirebase?.isStaff?.()&&reservationsStop){clearInterval(staffWatch);staffWatch=0}
    else if(++tries>240){clearInterval(staffWatch);staffWatch=0}
  },500);
}
function observeMount(){
  if(bodyObserver||!document.body)return;
  bodyObserver=new MutationObserver(()=>queueMicrotask(sync));
  bodyObserver.observe(document.body,{childList:true,subtree:true});
}
function boot(){
  installStyle();document.addEventListener('click',intercept,true);observeMount();sync();attachSharedCounts();watchStaff();
  document.addEventListener('zr:admin-staff-auth-ready',()=>{attachSharedCounts();sync()});
  document.addEventListener('zr:reservation-change-request-admin-updated',sync);
  window.addEventListener('storage',e=>{if(e.key==='zr_bookings')sync()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(()=>{sync();attachSharedCounts();watchStaff()},0),{once:true});
})();
