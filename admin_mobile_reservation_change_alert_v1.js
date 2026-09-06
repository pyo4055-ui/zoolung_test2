(()=>{
'use strict';
if(window.__ZR_ADMIN_MOBILE_RESERVATION_CHANGE_ALERT_V1)return;
window.__ZR_ADMIN_MOBILE_RESERVATION_CHANGE_ALERT_V1=true;

const $=id=>document.getElementById(id);
let observer=null,timer=0;

function installStyle(){
  if($('zrAdminMobileReservationChangeAlertStyleV1'))return;
  const s=document.createElement('style');
  s.id='zrAdminMobileReservationChangeAlertStyleV1';
  s.textContent=`
    #zrAdminMobileAlertsV1 [data-mobile-go="reservationChange"] .zr-admin-mobile-alert-dot{background:#a74412!important}
  `;
  document.head.appendChild(s);
}
function ensureRow(){
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
function readCount(id){
  const n=parseInt(String($(id)?.textContent||'0').replace(/[^0-9-]/g,''),10);
  return Number.isFinite(n)&&n>0?n:0;
}
function sync(){
  if(!ensureRow())return;
  const row=document.querySelector('#zrAdminMobileAlertsV1 [data-mobile-count="zrSmartReservationChange"]');
  if(row)row.textContent=String(readCount('zrSmartReservationChange'));
  const badge=$('zrAdminMobileBellBadge');
  if(badge){
    let total=0;
    document.querySelectorAll('#zrAdminMobileAlertsV1 [data-mobile-count]').forEach(el=>{
      const n=parseInt(String(el.textContent||'0').replace(/[^0-9-]/g,''),10);
      if(Number.isFinite(n)&&n>0)total+=n;
    });
    badge.textContent=total>99?'99+':String(total);
    badge.hidden=total===0;
  }
}
function observe(){
  const panel=$('zrAdminSmartPanelV1');
  if(panel&&!observer){
    observer=new MutationObserver(()=>queueMicrotask(sync));
    observer.observe(panel,{subtree:true,childList:true,characterData:true});
  }
}
function boot(){
  installStyle();sync();observe();
  if(timer)clearInterval(timer);
  let tries=0;
  timer=setInterval(()=>{
    sync();observe();
    if(++tries>120&&observer){clearInterval(timer);timer=0}
  },250);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,0),{once:true});
document.addEventListener('zr:admin-shared-reservation-ready',()=>setTimeout(sync,0));
})();
