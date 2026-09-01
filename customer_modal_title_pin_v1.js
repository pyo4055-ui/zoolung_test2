(()=>{
'use strict';
if(window.__ZR_CUSTOMER_MODAL_TITLE_PIN_V1)return;
window.__ZR_CUSTOMER_MODAL_TITLE_PIN_V1=true;

function cleanupLegacyFloating(){
  ['zrCustomerModalPinnedTitle','zrModalUxPinnedTitle','zrModalUxPinnedClose'].forEach(id=>document.getElementById(id)?.remove());
  document.body?.classList.remove('zr-customer-modal-title-pin-active');
  document.querySelectorAll('.zr-customer-modal-title-source,.zr-modal-ux-proxied-title,.zr-modal-ux-proxied-source').forEach(el=>{
    el.classList.remove('zr-customer-modal-title-source','zr-modal-ux-proxied-title','zr-modal-ux-proxied-source');
  });
}
function syncCommonHeader(){
  cleanupLegacyFloating();
  if(typeof window.__ZR_MODAL_UX_SYNC_HEADERS==='function')window.__ZR_MODAL_UX_SYNC_HEADERS();
}
function boot(){
  cleanupLegacyFloating();
  syncCommonHeader();
  document.addEventListener('click',()=>setTimeout(syncCommonHeader,0),true);
  document.addEventListener('change',()=>setTimeout(syncCommonHeader,0),true);
  window.addEventListener('resize',syncCommonHeader);
  window.addEventListener('orientationchange',()=>setTimeout(syncCommonHeader,100));
  const timer=setInterval(syncCommonHeader,700);setTimeout(()=>clearInterval(timer),12000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
