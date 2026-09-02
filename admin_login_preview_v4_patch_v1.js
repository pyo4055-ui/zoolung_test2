(()=>{
'use strict';
if(window.__ZR_ADMIN_LOGIN_PREVIEW_V4_PATCH_V1)return;
window.__ZR_ADMIN_LOGIN_PREVIEW_V4_PATCH_V1=true;

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
  clearLegacyLoginBackground();
  requestAnimationFrame(clearLegacyLoginBackground);
}

/* admin_entry_bootstrap_v1.js registers first. Running immediately after it and
   again on DOM ready removes the retired photo layer before the browser paints
   the dedicated login state. No authentication behavior is intercepted. */
sync();
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',sync,{once:true});
}else{
  sync();
}
document.addEventListener('zr:admin-runtime-ready',sync);
})();
