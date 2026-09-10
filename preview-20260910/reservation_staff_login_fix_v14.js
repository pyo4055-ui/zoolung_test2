(()=>{
'use strict';
if(window.__ZR_STAFF_LOGIN_FIX_V14)return;
window.__ZR_STAFF_LOGIN_FIX_V14=true;
const FV='12.17.1',STAFF_EMAIL='zoolung09@zoolungzoolung.com';
let authMod=null,bound=false;
async function ensureAuthMod(){if(authMod)return authMod;authMod=await import(`https://www.gstatic.com/firebasejs/${FV}/firebase-auth.js`);return authMod}
function adminOpened(){const v=document.getElementById('adminView');return !!v&&getComputedStyle(v).display!=='none'&&!v.classList.contains('hidden')}
function bind(){
  const btn=document.getElementById('adminLoginSubmit');if(!btn||btn.dataset.zrStaffFix14)return false;
  btn.dataset.zrStaffFix14='1';
  btn.addEventListener('click',async()=>{
    const pw=document.getElementById('adminPassword')?.value||'';if(!pw)return;
    setTimeout(async()=>{
      try{
        const z=window.zrReservationFirebase;if(!z?.auth||!adminOpened()||z.isStaff?.())return;
        const A=await ensureAuthMod();await A.setPersistence(z.auth,A.browserLocalPersistence);await A.signInWithEmailAndPassword(z.auth,STAFF_EMAIL,pw);
        try{window.toast?.('공용 예약 DB 연결 완료')}catch{}
      }catch(e){console.error('staff firebase reconnect',e);try{window.toast?.('관리자는 열렸지만 DB 로그인에 실패했습니다.')}catch{}}
    },80);
  },true);
  return true;
}
function boot(){const t=setInterval(()=>{if(bind())clearInterval(t)},250);setTimeout(()=>clearInterval(t),15000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();