(()=>{
'use strict';
if(window.__ZR_ADMIN_RESERVATION_STAFF_LOGIN_SHIM_V1)return;
window.__ZR_ADMIN_RESERVATION_STAFF_LOGIN_SHIM_V1=true;

/* reservation_firebase_bridge_v1 wraps adminLoginSubmit.onclick to switch the
   reservation listener to the shared staff account. Some admin login builds use
   addEventListener only, leaving onclick empty. Give the existing bridge a harmless
   async hook point; the bridge itself remains responsible for authentication. */
function arm(){
  const btn=document.getElementById('adminLoginSubmit');
  if(!btn)return false;
  if(btn.dataset.zrFirebaseLoginShim==='1')return true;
  if(typeof btn.onclick!=='function'){
    btn.onclick=function(){return new Promise(resolve=>setTimeout(resolve,350))};
  }
  btn.dataset.zrFirebaseLoginShim='1';
  return true;
}
function boot(){
  if(arm())return;
  let tries=0;
  const timer=setInterval(()=>{if(arm()||++tries>100)clearInterval(timer)},100);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,0),{once:true});
})();
