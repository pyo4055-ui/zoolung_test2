(()=>{
'use strict';
if(window.__ZR_CUSTOMER_FIREBASE_BRIDGE_RECOVERY_V1)return;
window.__ZR_CUSTOMER_FIREBASE_BRIDGE_RECOVERY_V1=true;

const FV='12.17.1';
const STAFF_EMAIL='zoolung09@zoolungzoolung.com';
let running=false,done=false;

function show(message,state='warn'){
  let el=document.getElementById('zrCustomerFirebaseRecoveryStatus');
  if(!el){
    el=document.createElement('div');
    el.id='zrCustomerFirebaseRecoveryStatus';
    Object.assign(el.style,{position:'fixed',left:'50%',bottom:'22px',transform:'translateX(-50%)',zIndex:'2147483590',maxWidth:'calc(100vw - 28px)',padding:'11px 14px',borderRadius:'12px',fontSize:'13px',fontWeight:'800',lineHeight:'1.4',textAlign:'center',boxShadow:'0 8px 28px rgba(0,0,0,.22)',pointerEvents:'none'});
    document.body.appendChild(el);
  }
  el.textContent=message;
  el.style.background=state==='ok'?'#e8f5ec':state==='err'?'#fdeceb':'#fff6d9';
  el.style.color=state==='ok'?'#24553f':state==='err'?'#8a2d2d':'#6a5317';
  el.style.border=state==='ok'?'1px solid #bedac8':state==='err'?'1px solid #edbcbc':'1px solid #e8d491';
  clearTimeout(show.timer);
  show.timer=setTimeout(()=>el.remove(),6500);
}

async function recover(){
  if(done||running)return;
  if(window.zrReservationFirebase?.db&&window.zrReservationFirebase?.auth?.currentUser){done=true;return}
  running=true;
  try{
    const [appMod,authMod,fsMod]=await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FV}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FV}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`)
    ]);
    const apps=appMod.getApps();
    if(!apps.length){
      show('Firebase 앱 초기화 실패 · 페이지를 새로고침해주세요.','err');
      return;
    }
    const app=appMod.getApp();
    const auth=authMod.getAuth(app);
    const db=fsMod.getFirestore(app);
    let user=auth.currentUser;
    if(!user){
      show('Firebase 로그인 복구 중...','warn');
      try{
        const cred=await authMod.signInAnonymously(auth);
        user=cred.user;
      }catch(e){
        const code=String(e?.code||e?.message||'unknown-error');
        show(`Firebase 로그인 실패 (${code})`,'err');
        return;
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
    show('Firebase 연결 복구 완료','ok');
    try{document.dispatchEvent(new CustomEvent('zr:customer-firebase-recovered'))}catch{}
  }catch(e){
    const code=String(e?.code||e?.message||'unknown-error');
    show(`Firebase 모듈 연결 실패 (${code})`,'err');
  }finally{
    running=false;
  }
}

function boot(){
  setTimeout(()=>{
    if(window.zrReservationFirebase?.db&&window.zrReservationFirebase?.auth?.currentUser){done=true;return}
    recover();
  },1800);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.zrCustomerFirebaseBridgeRecoveryV1={recover};
})();
