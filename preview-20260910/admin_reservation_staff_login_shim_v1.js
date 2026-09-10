(()=>{
'use strict';
if(window.__ZR_ADMIN_RESERVATION_STAFF_LOGIN_SHIM_V1)return;
window.__ZR_ADMIN_RESERVATION_STAFF_LOGIN_SHIM_V1=true;

/* Loaded after the normal admin scripts. The existing reservation Firebase bridge
   periodically looks for an onclick handler on the login button. Some admin builds
   only use addEventListener, so provide a delayed no-op hook that the bridge can wrap.
   This file never changes the login result, prevents clicks, or touches the page boot. */
function arm(){
  const btn=document.getElementById('adminLoginSubmit');
  if(!btn)return false;
  if(btn.dataset.zrFirebaseLateHook==='1')return true;
  if(typeof btn.onclick!=='function'){
    btn.onclick=async function(){await new Promise(resolve=>setTimeout(resolve,700))};
  }
  btn.dataset.zrFirebaseLateHook='1';
  return true;
}
function boot(){
  if(arm())return;
  let tries=0;
  const timer=setInterval(()=>{if(arm()||++tries>80)clearInterval(timer)},100);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,0),{once:true});
})();
