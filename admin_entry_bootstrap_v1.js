(()=>{
'use strict';
if(window.__ZR_ADMIN_ENTRY_BOOTSTRAP_V1)return;
window.__ZR_ADMIN_ENTRY_BOOTSTRAP_V1=true;

const $=id=>document.getElementById(id);
let opened=false,loginObserver=null;
const hiddenLoginSiblings=new Set();

function installStyle(){
  if($('zrAdminEntryBootstrapStyleV1'))return;
  const s=document.createElement('style');
  s.id='zrAdminEntryBootstrapStyleV1';
  s.textContent=`
    html.zr-admin-entry-page #startView,
    html.zr-admin-entry-page #customerView,
    html.zr-admin-entry-page #successView,
    html.zr-admin-entry-page #cancelSuccessView{display:none!important}
    html.zr-admin-entry-page body>header{display:none!important}
    html.zr-admin-login-clean,html.zr-admin-login-clean body{background:#fff!important}
    html.zr-admin-login-clean body{overflow:hidden!important}
    .zr-admin-login-legacy-hidden{display:none!important}
    html.zr-admin-login-clean #adminLoginModal{background:#fff!important}
    html.zr-admin-entry-page #adminLoginModal [data-close="adminLoginModal"],
    html.zr-admin-entry-page #adminLoginModal .zr-modal-ux-header-close{display:none!important}
    html.zr-admin-shell-mounted #adminView>.admin-head,
    html.zr-admin-shell-mounted #adminView>.admin-tabs{display:none!important}
  `;
  document.head.appendChild(s);
}

function hideCustomerSurfaces(){
  for(const id of ['startView','customerView','successView','cancelSuccessView']){
    const el=$(id);if(el)el.classList.add('hidden');
  }
}
function clearLoginSiblingMask(){
  hiddenLoginSiblings.forEach(el=>el?.classList?.remove('zr-admin-login-legacy-hidden'));
  hiddenLoginSiblings.clear();
}
function maskSiblingsAlongModalPath(modal){
  clearLoginSiblingMask();
  const admin=$('adminView');
  let node=modal;
  while(node&&node!==document.body){
    const parent=node.parentElement;if(!parent)break;
    for(const sibling of parent.children){
      if(sibling===node||['SCRIPT','STYLE','LINK'].includes(sibling.tagName))continue;
      /* Never mask the real administrator workspace (or an ancestor that contains it).
         Its own pre-login display state already keeps it hidden. Masking it here creates
         a circular state where successful login can never be detected. */
      if(admin&&(sibling===admin||sibling.contains?.(admin)))continue;
      sibling.classList.add('zr-admin-login-legacy-hidden');hiddenLoginSiblings.add(sibling);
    }
    node=parent;
  }
}
function adminVisible(){
  const admin=$('adminView');if(!admin)return false;
  return !admin.classList.contains('hidden')&&getComputedStyle(admin).display!=='none';
}
function syncLoginClean(){
  const modal=$('adminLoginModal');if(!modal)return;
  const clean=!adminVisible();
  document.documentElement.classList.toggle('zr-admin-login-clean',clean);
  if(clean)maskSiblingsAlongModalPath(modal);else clearLoginSiblingMask();
}
function watchLoginClean(){
  const modal=$('adminLoginModal'),admin=$('adminView');if(!modal||!admin||loginObserver)return;
  loginObserver=new MutationObserver(()=>setTimeout(syncLoginClean,0));
  loginObserver.observe(modal,{attributes:true,attributeFilter:['class','style','hidden']});
  loginObserver.observe(admin,{attributes:true,attributeFilter:['class','style','hidden']});
  syncLoginClean();
}

function openAdminGate(force=false){
  document.documentElement.classList.add('zr-admin-entry-page');
  document.title='주렁주렁 동탄점 예약관리';
  installStyle();
  hideCustomerSurfaces();

  const modal=$('adminLoginModal'),admin=$('adminView');
  if(!modal||!admin||!$('adminLoginSubmit')||!$('adminPassword'))return false;
  watchLoginClean();

  const adminIsVisible=adminVisible();
  if(adminIsVisible&&!force){opened=true;syncLoginClean();return true}

  if(typeof window.openModal==='function')window.openModal('adminLoginModal');
  else modal.classList.remove('hidden');

  opened=true;syncLoginClean();
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
    if(e.target?.closest?.('#adminLoginSubmit')){
      setTimeout(syncLoginClean,0);
      setTimeout(syncLoginClean,120);
      setTimeout(syncLoginClean,500);
    }
    if(!e.target?.closest?.('#adminLogout'))return;
    setTimeout(()=>openAdminGate(true),0);
  });

  window.zrOpenDedicatedAdminLogin=()=>openAdminGate(true);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
