(()=>{
'use strict';
if(window.__ZR_ADMIN_SHELL_SUBMENU_CUSTOMER_GUARD_V1)return;
window.__ZR_ADMIN_SHELL_SUBMENU_CUSTOMER_GUARD_V1=true;

function guardGuideMapItem(){
  const item=document.querySelector('.zr-admin-shell-subitem[data-zr-admin-subitem="guide-map"]');
  if(!item)return false;
  if(item.dataset.zrCustomerGuard==='1')return true;
  item.dataset.zrCustomerGuard='1';
  item.setAttribute('aria-label','가이드맵');
  item.textContent='가이드맵\u200B';
  return true;
}

function boot(){
  if(guardGuideMapItem())return;
  let tries=0;
  const timer=setInterval(()=>{
    if(guardGuideMapItem()||++tries>120)clearInterval(timer);
  },100);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,0),{once:true});
})();
