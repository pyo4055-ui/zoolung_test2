(()=>{
'use strict';
if(window.__ZR_ADMIN_LOGIN_VISUAL_V1)return;
window.__ZR_ADMIN_LOGIN_VISUAL_V1=true;

const $=id=>document.getElementById(id);
let observer=null,tries=0;

function ensureStyle(){
  if($('zrAdminLoginVisualV1Style'))return;
  const link=document.createElement('link');
  link.id='zrAdminLoginVisualV1Style';
  link.rel='stylesheet';
  link.href='./admin_login_visual_v1.css?v=1';
  document.head.appendChild(link);
}
function decorate(){
  const modal=$('adminLoginModal');
  if(!modal)return false;
  modal.dataset.zrLoginVisual='1';

  const title=modal.querySelector('.modal-card h2');
  if(title&&title.textContent.trim()!=='관리자 로그인')title.textContent='관리자 로그인';

  const identity=$('zrAdminIdentity');
  if(identity){
    identity.placeholder='아이디';
    identity.setAttribute('aria-label','아이디');
    identity.autocomplete='username';
  }
  const password=$('adminPassword');
  if(password){
    password.placeholder='비밀번호';
    password.setAttribute('aria-label','비밀번호');
    password.autocomplete='current-password';
  }
  const submit=$('adminLoginSubmit');
  if(submit)submit.textContent='로그인';
  return !!(identity&&password&&submit);
}
function scan(){
  ensureStyle();
  const done=decorate();
  if(done&&observer){observer.disconnect();observer=null}
  return done;
}
function boot(){
  ensureStyle();
  if(scan())return;
  observer=new MutationObserver(()=>scan());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  const timer=setInterval(()=>{
    if(scan()||++tries>120){clearInterval(timer);if(observer){observer.disconnect();observer=null}}
  },100);
  document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(scan,0));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
