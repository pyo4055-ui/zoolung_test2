(()=>{
'use strict';
if(window.__ZR_CUSTOMER_ENTRY_BOOTSTRAP_V1)return;
window.__ZR_CUSTOMER_ENTRY_BOOTSTRAP_V1=true;

function installLandingHold(){
  if(document.getElementById('zrCustomerLandingVisualHoldV1'))return;
  const hold=document.createElement('div');
  hold.id='zrCustomerLandingVisualHoldV1';
  hold.setAttribute('aria-hidden','true');
  hold.style.cssText='position:fixed;inset:0;z-index:2147483646;background:#38271e;visibility:visible!important;pointer-events:none;';
  (document.body||document.documentElement).appendChild(hold);

  let removed=false;
  const release=()=>{
    if(removed)return;
    removed=true;
    requestAnimationFrame(()=>requestAnimationFrame(()=>hold.remove()));
  };
  if(window.__ZR_CUSTOMER_ENTRY_V2_READY)release();
  else document.addEventListener('zr:customer-entry-v2-ready',release,{once:true});
  setTimeout(release,9000);
}

function boot(){
  document.documentElement.classList.add('zr-customer-entry-page');
  document.title='주렁주렁 동탄점 단체예약';
  const style=document.createElement('style');
  style.id='zrCustomerEntryBootstrapStyleV1';
  style.textContent='html.zr-customer-entry-page #adminView,html.zr-customer-entry-page #adminLoginModal{display:none!important}';
  document.head.appendChild(style);
  document.getElementById('adminLoginModal')?.classList.add('hidden');
  const admin=document.getElementById('adminView');if(admin)admin.style.display='none';
  installLandingHold();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
