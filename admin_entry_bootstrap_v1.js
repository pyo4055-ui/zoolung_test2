(()=>{
'use strict';
if(window.__ZR_ADMIN_ENTRY_BOOTSTRAP_V1)return;
window.__ZR_ADMIN_ENTRY_BOOTSTRAP_V1=true;

const $=id=>document.getElementById(id);
let opened=false;

function installStyle(){
  if($('zrAdminEntryBootstrapStyleV1'))return;
  const s=document.createElement('style');
  s.id='zrAdminEntryBootstrapStyleV1';
  s.textContent=`
    html.zr-admin-entry-page #startView,
    html.zr-admin-entry-page #customerView,
    html.zr-admin-entry-page #successView,
    html.zr-admin-entry-page #cancelSuccessView{display:none!important}
  `;
  document.head.appendChild(s);
}

function hideCustomerSurfaces(){
  for(const id of ['startView','customerView','successView','cancelSuccessView']){
    const el=$(id);if(el)el.classList.add('hidden');
  }
}

function openAdminGate(force=false){
  document.documentElement.classList.add('zr-admin-entry-page');
  document.title='주렁주렁 동탄점 예약관리';
  installStyle();
  hideCustomerSurfaces();

  const modal=$('adminLoginModal'),admin=$('adminView');
  if(!modal||!admin||!$('adminLoginSubmit')||!$('adminPassword'))return false;

  const adminVisible=getComputedStyle(admin).display!=='none'&&!admin.classList.contains('hidden');
  if(adminVisible&&!force){opened=true;return true}

  if(typeof window.openModal==='function')window.openModal('adminLoginModal');
  else modal.classList.remove('hidden');

  opened=true;
  setTimeout(()=>$('adminPassword')?.focus?.(),60);
  return true;
}

function boot(){
  document.documentElement.classList.add('zr-admin-entry-page');
  installStyle();

  const tryOpen=()=>{
    if(!window.__ZR_ADMIN_REFACTOR_READY)return false;
    return openAdminGate(false);
  };

  if(!tryOpen()){
    document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(()=>openAdminGate(false),0),{once:true});
    let tries=0;
    const t=setInterval(()=>{
      if(tryOpen()||++tries>80)clearInterval(t);
    },150);
  }

  document.addEventListener('click',e=>{
    if(!e.target?.closest?.('#adminLogout'))return;
    setTimeout(()=>openAdminGate(true),0);
  });

  window.zrOpenDedicatedAdminLogin=()=>openAdminGate(true);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
