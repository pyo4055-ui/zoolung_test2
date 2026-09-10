(()=>{
'use strict';
if(window.__ZR_ADMIN_LOGIN_PREVIEW_V4_PATCH_V1)return;
window.__ZR_ADMIN_LOGIN_PREVIEW_V4_PATCH_V1=true;

const ROOT=document.documentElement;
ROOT.classList.add('zr-admin-login-v4-booting');

function installFinalVisualStyle(){
  if(!document.getElementById('zrAdminLoginPreviewV4PatchV1Style')){
    const link=document.createElement('link');
    link.id='zrAdminLoginPreviewV4PatchV1Style';
    link.rel='stylesheet';
    link.href='./admin_login_preview_v4_patch_v1.css?v=2';
    document.head.appendChild(link);
  }
  if(!document.getElementById('zrAdminLoginPreviewV4CriticalV2')){
    const style=document.createElement('style');
    style.id='zrAdminLoginPreviewV4CriticalV2';
    style.textContent=`
      html.zr-admin-login-clean #adminLoginModal .zr-modal-ux-header{display:none!important}
      html.zr-admin-login-v4-booting #adminLoginModal[data-zr-login-visual="1"]>.modal-card{opacity:0!important;visibility:hidden!important;pointer-events:none!important}
      html.zr-admin-login-clean #adminLoginModal[data-zr-login-visual="1"]{background:#38271e!important;background-image:none!important}
    `;
    document.head.appendChild(style);
  }
}

function clearLegacyLoginBackground(){
  const modal=document.getElementById('adminLoginModal');
  if(!modal)return false;
  modal.style.setProperty('background-color','#38271e','important');
  modal.style.setProperty('background-image','none','important');
  modal.style.setProperty('background-size','auto','important');
  modal.style.setProperty('background-position','center','important');
  modal.style.setProperty('background-repeat','no-repeat','important');
  return true;
}

function sync(){
  installFinalVisualStyle();
  clearLegacyLoginBackground();
  requestAnimationFrame(clearLegacyLoginBackground);
}

sync();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});
else sync();
document.addEventListener('zr:admin-runtime-ready',()=>{sync();setTimeout(sync,0);setTimeout(sync,120)});
document.addEventListener('click',e=>{
  if(e.target?.closest?.('#adminLogout'))ROOT.classList.add('zr-admin-login-v4-booting');
},true);
})();
