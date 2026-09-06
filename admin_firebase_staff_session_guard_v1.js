(()=>{
'use strict';
if(window.__ZR_ADMIN_FIREBASE_STAFF_SESSION_GUARD_V1)return;
window.__ZR_ADMIN_FIREBASE_STAFF_SESSION_GUARD_V1=true;

const FV='12.17.1';
const STAFF_EMAIL='zoolung09@zoolungzoolung.com';
let pendingPassword='';
let attemptToken=0;
let authModPromise=null;

const bridge=()=>window.zrReservationFirebase||null;
const adminVisible=()=>{
  const el=document.getElementById('adminView');
  return !!el&&!el.classList.contains('hidden')&&getComputedStyle(el).display!=='none';
};
const clearPending=()=>{pendingPassword='';attemptToken++};
const emitReady=()=>{try{document.dispatchEvent(new CustomEvent('zr:admin-firebase-staff-ready'))}catch{}};
const authModule=()=>authModPromise||(authModPromise=import(`https://www.gstatic.com/firebasejs/${FV}/firebase-auth.js`));

async function ensureStaff(token){
  if(token!==attemptToken||!pendingPassword||!adminVisible())return false;
  const started=Date.now();
  while(token===attemptToken&&Date.now()-started<10000){
    const z=bridge();
    if(z?.auth){
      if(z.isStaff?.()){
        clearPending();emitReady();return true;
      }
      try{
        const A=await authModule();
        if(token!==attemptToken||!pendingPassword||!adminVisible())return false;
        const password=pendingPassword;
        await A.setPersistence(z.auth,A.browserLocalPersistence);
        await A.signInWithEmailAndPassword(z.auth,STAFF_EMAIL,password);
        clearPending();emitReady();return true;
      }catch(e){
        console.error('admin firebase staff session guard',e);
        clearPending();return false;
      }
    }
    await new Promise(r=>setTimeout(r,100));
  }
  return false;
}

function scheduleEnsure(){
  const token=attemptToken;
  for(const delay of [250,700,1400,2600])setTimeout(()=>ensureStaff(token),delay);
}
function captureLogin(){
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#adminLogout')){clearPending();return}
    if(!e.target?.closest?.('#adminLoginSubmit'))return;
    const pw=String(document.getElementById('adminPassword')?.value||'');
    if(!pw)return;
    pendingPassword=pw;
    attemptToken++;
    scheduleEnsure();
  },true);
}
function boot(){
  captureLogin();
  if(bridge()?.isStaff?.())emitReady();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>{if(bridge()?.isStaff?.())emitReady()},{once:true});
})();
