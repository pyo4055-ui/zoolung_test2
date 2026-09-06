(()=>{
'use strict';
if(window.__ZR_ADMIN_RESERVATION_STAFF_LOGIN_SHIM_V1)return;
window.__ZR_ADMIN_RESERVATION_STAFF_LOGIN_SHIM_V1=true;

/* The reservation Firebase bridge only wraps adminLoginSubmit when onclick is a
   function. Some admin builds use addEventListener only, so provide a harmless
   onclick hook before the bridge finishes booting. This keeps PC and mobile on
   the same staff reservation listener without changing the login UI itself. */
function arm(){
  const btn=document.getElementById('adminLoginSubmit');
  if(!btn)return false;
  if(btn.dataset.zrFirebaseLoginShim==='1')return true;
  if(typeof btn.onclick!=='function')btn.onclick=function(){return new Promise(resolve=>setTimeout(resolve,350))};
  btn.dataset.zrFirebaseLoginShim='1';
  return true;
}
function boot(){
  if(arm())return;
  let tries=0;
  const timer=setInterval(()=>{if(arm()||++tries>100)clearInterval(timer)},100);
}
/* Run immediately as well as on lifecycle events. Waiting only for DOMContentLoaded
   can be too late because reservation_firebase_bridge registered its handler first. */
boot();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,0),{once:true});
})();
