(()=>{
'use strict';
if(window.__ZR_ADMIN_MOBILE_RESERVATION_CHANGE_ALERT_V1)return;
window.__ZR_ADMIN_MOBILE_RESERVATION_CHANGE_ALERT_V1=true;

const $=id=>document.getElementById(id);
const mobile=()=>window.matchMedia('(max-width:900px)').matches;
function installStyle(){
  if($('zrAdminMobileReservationChangeAlertStyleV1'))return;
  const s=document.createElement('style');s.id='zrAdminMobileReservationChangeAlertStyleV1';
  s.textContent=`
    #zrAdminMobileAlertsV1 [data-mobile-go="reservationChange"] .zr-admin-mobile-alert-dot{background:#a74412!important}
    #zrAdminMobileDrawerV1 [data-mobile-go="reservationChange"] .zr-admin-mobile-menu-icon{background:#f7e6dc!important;color:#9a3c16!important}
    @media(max-width:900px){
      #zrReservationChangeAdminPanel,#zrReservationChangeAdminList,.zr-cr-card{min-width:0!important;max-width:100%!important;width:100%!important;box-sizing:border-box!important}
      #zrReservationChangeAdminList .zr-cr-route{grid-template-columns:minmax(0,1fr)!important}
      #zrReservationChangeAdminList .zr-cr-box,#zrReservationChangeAdminList .zr-cr-box b{min-width:0!important;max-width:100%!important;overflow-wrap:anywhere!important;word-break:break-word!important}
      #zrReservationChangeAdminList .zr-cr-meta{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:4px!important;min-width:0!important}
      #zrReservationChangeAdminList .zr-cr-meta span{min-width:0!important;max-width:100%!important;overflow-wrap:anywhere!important;word-break:break-word!important}
      #zrReservationChangeAdminList .zr-cr-body{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;overflow-wrap:anywhere!important;word-break:break-word!important;max-width:100%!important}
      #zrReservationChangeAdminList .zr-cr-actions{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:7px!important;width:100%!important}
      #zrReservationChangeAdminList .zr-cr-actions button{width:100%!important;min-width:0!important;white-space:normal!important}
    }
  `;
  document.head.appendChild(s);
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
function start(){installStyle();if(mobile())ensureDrawerRow()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(start,0),{once:true});
window.addEventListener('resize',start,{passive:true});
})();
