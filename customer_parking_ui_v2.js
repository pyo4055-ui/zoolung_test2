(()=>{
'use strict';
if(window.__ZR_CUSTOMER_PARKING_UI_V2)return;
window.__ZR_CUSTOMER_PARKING_UI_V2=true;

function injectStyle(){
  if(document.getElementById('zrCustomerParkingUiV2Style'))return;
  const s=document.createElement('style');
  s.id='zrCustomerParkingUiV2Style';
  s.textContent=`
  .zr-parking-dropoff,.zr-parking-bus{position:relative;border-radius:12px!important;margin:10px 10px 0!important;padding:14px 15px!important;border:1px solid transparent!important}
  .zr-parking-dropoff{background:#eef8f2!important;border-color:#c9e2d2!important;box-shadow:inset 4px 0 0 #2f6b4f}
  .zr-parking-bus{background:#f1f5ff!important;border-color:#ccd8f0!important;box-shadow:inset 4px 0 0 #46689f}
  .zr-parking-dropoff h4,.zr-parking-bus h4,.zr-parking-dropoff>b:first-child,.zr-parking-bus>b:first-child{font-size:15px!important;font-weight:950!important;margin-bottom:7px!important}
  .zr-parking-dropoff h4,.zr-parking-dropoff>b:first-child{color:#25583e!important}
  .zr-parking-bus h4,.zr-parking-bus>b:first-child{color:#355789!important}
  .zr-parking-dropoff .zrpk31-place,.zr-parking-bus .zrpk31-place{font-size:14px!important;font-weight:900!important;color:#27352d!important}
  .zr-parking-dropoff .zrpk31-address,.zr-parking-bus .zrpk31-address{font-size:12px!important;font-weight:750!important}
  .zr-parking-dropoff .zrpk31-notes,.zr-parking-bus .zrpk31-notes{margin-top:9px!important;padding:9px 10px 9px 27px!important;border-radius:9px!important;background:rgba(255,255,255,.72)!important}
  #zrParkingInfoCard{padding-bottom:10px!important}
  #zrCustomerParkingQuickBody .zrpk31-title{border-bottom:0!important;padding-bottom:4px!important}
  #zrCustomerParkingQuickBody .zr-parking-dropoff,#zrCustomerParkingQuickBody .zr-parking-bus{margin-left:0!important;margin-right:0!important}
  #zrFinalParkingV31 .zrfinal31-place.zr-parking-dropoff,#zrFinalParkingV31 .zrfinal31-place.zr-parking-bus{padding:13px 14px!important;margin-top:9px!important;line-height:1.6!important}
  @media(max-width:560px){.zr-parking-dropoff,.zr-parking-bus{margin-left:8px!important;margin-right:8px!important;padding:12px!important}}
  `;
  document.head.appendChild(s);
}
function markPair(root,selector){
  if(!root)return;
  const rows=[...root.querySelectorAll(selector)];
  rows.forEach(x=>x.classList.remove('zr-parking-dropoff','zr-parking-bus'));
  rows[0]?.classList.add('zr-parking-dropoff');
  rows[1]?.classList.add('zr-parking-bus');
}
let pending=false;
function decorate(){
  if(pending)return;pending=true;
  requestAnimationFrame(()=>{
    pending=false;injectStyle();
    markPair(document.getElementById('zrParkingInfoCard'),'.zrpk31-row');
    markPair(document.getElementById('zrCustomerParkingQuickBody'),'.zrpk31-row');
    markPair(document.getElementById('zrFinalParkingV31'),'.zrfinal31-place');
  });
}
function boot(){
  injectStyle();decorate();
  new MutationObserver(decorate).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#zrCustomerParkingTabV1,#zrFinalOkV31'))setTimeout(decorate,0);
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
