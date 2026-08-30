(()=>{
'use strict';
if(window.__ZR_CUSTOMER_FIREBASE_BRIDGE_RECOVERY_V1)return;
window.__ZR_CUSTOMER_FIREBASE_BRIDGE_RECOVERY_V1=true;

const FV='12.17.1';
const STAFF_EMAIL='zoolung09@zoolungzoolung.com';
let running=false,done=false,lastError='';

function state(){
  return {running,done,lastError};
}
async function recover(){
  if(done)return true;
  if(running)return false;
  if(window.zrReservationFirebase?.db&&window.zrReservationFirebase?.auth?.currentUser){
    done=true;lastError='';return true;
  }
  running=true;
  try{
    const [appMod,authMod,fsMod]=await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FV}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FV}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`)
    ]);
    const apps=appMod.getApps();
    if(!apps.length){
      lastError='firebase-app-unavailable';
      console.debug('customer firebase recovery',lastError);
      return false;
    }
    const app=appMod.getApp();
    const auth=authMod.getAuth(app);
    const db=fsMod.getFirestore(app);
    let user=auth.currentUser;
    if(!user){
      try{
        const cred=await authMod.signInAnonymously(auth);
        user=cred.user;
      }catch(e){
        lastError=String(e?.code||e?.message||'unknown-error');
        console.debug('customer firebase recovery auth',lastError);
        return false;
      }
    }
    if(!window.zrReservationFirebase){
      window.zrReservationFirebase={
        version:1,
        auth,
        db,
        get user(){return auth.currentUser},
        isStaff:()=>String(auth.currentUser?.email||'').toLowerCase()===STAFF_EMAIL.toLowerCase()
      };
    }
    done=true;
    lastError='';
    try{document.dispatchEvent(new CustomEvent('zr:customer-firebase-recovered'))}catch{}
    return true;
  }catch(e){
    lastError=String(e?.code||e?.message||'unknown-error');
    console.debug('customer firebase recovery module',lastError);
    return false;
  }finally{
    running=false;
  }
}

function boot(){
  setTimeout(()=>{
    if(window.zrReservationFirebase?.db&&window.zrReservationFirebase?.auth?.currentUser){done=true;lastError='';return}
    recover();
  },1800);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.zrCustomerFirebaseBridgeRecoveryV1={recover,state};
})();
