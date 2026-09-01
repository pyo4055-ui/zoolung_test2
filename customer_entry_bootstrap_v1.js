(()=>{
'use strict';
if(window.__ZR_CUSTOMER_ENTRY_BOOTSTRAP_V1)return;
window.__ZR_CUSTOMER_ENTRY_BOOTSTRAP_V1=true;

function boot(){
  document.documentElement.classList.add('zr-customer-entry-page');
  document.title='주렁주렁 동탄점 단체예약';
  const style=document.createElement('style');
  style.id='zrCustomerEntryBootstrapStyleV1';
  style.textContent='html.zr-customer-entry-page #adminView,html.zr-customer-entry-page #adminLoginModal{display:none!important}';
  document.head.appendChild(style);
  document.getElementById('adminLoginModal')?.classList.add('hidden');
  const admin=document.getElementById('adminView');if(admin)admin.style.display='none';
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
