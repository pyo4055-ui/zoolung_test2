(()=>{
'use strict';
if(window.__ZR_ADMIN_OUTSOURCE_PEOPLE_STABILITY_V1)return;
window.__ZR_ADMIN_OUTSOURCE_PEOPLE_STABILITY_V1=true;

const $=id=>document.getElementById(id);
let installed=false;

function installStableSearch(){
  if(installed)return true;
  if(!window.__ZR_ADMIN_OPS_V10||typeof window.renderOutsourcingPayments!=='function')return false;
  const old=$('outsourceSearch');
  if(!old)return false;
  if(old.dataset.zrOutsourcePeopleStable==='1'){installed=true;return true}

  const next=old.cloneNode(true);
  next.dataset.zrOutsourcePeopleStable='1';
  next.onclick=e=>{
    e?.preventDefault?.();
    e?.stopPropagation?.();
    window.renderOutsourcingPayments();
    return false;
  };
  old.replaceWith(next);
  installed=true;
  return true;
}

function boot(){
  if(installStableSearch())return;
  let tries=0;
  const timer=setInterval(()=>{
    if(installStableSearch()||++tries>120)clearInterval(timer);
  },100);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',boot,{once:true});
})();
