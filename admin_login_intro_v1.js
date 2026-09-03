(()=>{
'use strict';
if(window.__ZR_ADMIN_LOGIN_INTRO_V1)return;
window.__ZR_ADMIN_LOGIN_INTRO_V1=true;

const INTRO_HTML_URL='./admin_login_intro_html_v1.html?v=1';
const ROOT=document.documentElement;
const $=id=>document.getElementById(id);
let rootObserver=null;
let sessionActive=false;
let playToken=0;
let fallbackTimer=0;
let beginTimer=0;

function clearTimers(){
  if(fallbackTimer){clearTimeout(fallbackTimer);fallbackTimer=0}
  if(beginTimer){clearTimeout(beginTimer);beginTimer=0}
}
function setReady(ready){
  ROOT.classList.toggle('zr-admin-login-intro-ready',!!ready);
}
function adminVisible(){
  const admin=$('adminView');
  if(!admin)return false;
  try{return !admin.classList.contains('hidden')&&getComputedStyle(admin).display!=='none'}catch{return false}
}
function loginIsStable(){
  return ROOT.classList.contains('zr-admin-login-clean')&&!adminVisible();
}
function clearLegacyVisual(modal){
  if(!modal)return;
  modal.style.setProperty('background-color','#38271e','important');
  modal.style.setProperty('background-image','none','important');
  modal.style.setProperty('background-size','auto','important');
  modal.style.setProperty('background-position','center','important');
  modal.style.setProperty('background-repeat','no-repeat','important');
}
function ensureScene(){
  const modal=$('adminLoginModal');
  const card=modal?.querySelector('.modal-card');
  if(!modal||!card)return null;
  clearLegacyVisual(modal);

  let scene=$('zrAdminLoginSceneV1');
  if(!scene){
    scene=document.createElement('div');
    scene.id='zrAdminLoginSceneV1';
    scene.setAttribute('aria-hidden','true');

    const frame=document.createElement('iframe');
    frame.id='zrAdminLoginIntroFrameV1';
    frame.title='주렁주렁 관리자 인트로';
    frame.setAttribute('allow','autoplay');
    frame.setAttribute('tabindex','-1');
    frame.setAttribute('aria-hidden','true');
    scene.appendChild(frame);
    modal.insertBefore(scene,modal.firstChild);
  }

  let employee=$('zrAdminLoginEmployeeV1');
  if(!employee){
    employee=document.createElement('div');
    employee.id='zrAdminLoginEmployeeV1';
    employee.textContent='내부 직원용';
    card.appendChild(employee);
  }

  modal.dataset.zrLoginIntro='1';
  return {modal,card,scene,frame:$('zrAdminLoginIntroFrameV1')};
}
function revealIntroSurface(){
  ROOT.classList.add('zr-admin-login-intro-mounted');
  ROOT.classList.remove('zr-admin-login-v4-booting');
}
function finishIntro(token){
  if(token!==playToken||!sessionActive)return;
  if(fallbackTimer){clearTimeout(fallbackTimer);fallbackTimer=0}
  ROOT.classList.remove('zr-admin-login-intro-playing');
  revealIntroSurface();
  setReady(true);
}
function fallbackToLogin(token){
  if(token!==playToken||!sessionActive)return;
  ROOT.classList.remove('zr-admin-login-intro-playing');
  revealIntroSurface();
  finishIntro(token);
}
function beginLoginSession(){
  if(sessionActive||!loginIsStable())return false;
  const parts=ensureScene();
  if(!parts)return false;

  sessionActive=true;
  const token=++playToken;
  clearTimers();
  setReady(false);
  ROOT.classList.add('zr-admin-login-v4-booting');
  ROOT.classList.remove('zr-admin-login-intro-mounted','zr-admin-login-intro-playing');

  /* Reload the dedicated HTML document for every login session. The iframe owns
     autoplay/currentTime/end-frame behavior, keeping the admin runtime out of it. */
  parts.frame.src=INTRO_HTML_URL+'&session='+token+'&t='+Date.now();
  fallbackTimer=setTimeout(()=>fallbackToLogin(token),10000);
  return true;
}
function endLoginSession(){
  if(!sessionActive)return;
  clearTimers();
  ++playToken;
  sessionActive=false;
  setReady(false);
  ROOT.classList.remove('zr-admin-login-intro-mounted','zr-admin-login-v4-booting','zr-admin-login-intro-playing');
}
function scheduleBegin(delay=40){
  if(sessionActive||beginTimer)return;
  beginTimer=setTimeout(()=>{
    beginTimer=0;
    if(!beginLoginSession()&&loginIsStable())scheduleBegin(60);
  },delay);
}
function sync(){
  const parts=ensureScene();
  if(parts)clearLegacyVisual(parts.modal);

  if(adminVisible()){
    endLoginSession();
    return;
  }
  if(loginIsStable()&&!sessionActive)scheduleBegin(30);
}
function handleIntroMessage(e){
  if(!sessionActive)return;
  const frame=$('zrAdminLoginIntroFrameV1');
  if(!frame||e.source!==frame.contentWindow)return;
  const data=e.data;
  if(!data||data.source!=='zr-admin-intro-html-v1')return;
  const token=playToken;
  if(data.event==='ready'){
    revealIntroSurface();
    return;
  }
  if(data.event==='playing'){
    ROOT.classList.add('zr-admin-login-intro-playing');
    revealIntroSurface();
    return;
  }
  if(data.event==='ended'){
    finishIntro(token);
    return;
  }
  if(data.event==='error')fallbackToLogin(token);
}
function boot(){
  ROOT.classList.add('zr-admin-login-v4-booting');
  window.addEventListener('message',handleIntroMessage);
  sync();
  if(!rootObserver){
    rootObserver=new MutationObserver(()=>{
      const parts=ensureScene();
      if(parts)clearLegacyVisual(parts.modal);
      scheduleBegin(35);
    });
    rootObserver.observe(ROOT,{attributes:true,attributeFilter:['class']});
  }
  document.addEventListener('zr:admin-runtime-ready',()=>{
    setTimeout(sync,0);
    setTimeout(sync,80);
  });
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#adminLogout')){
      ROOT.classList.add('zr-admin-login-v4-booting');
      setTimeout(sync,0);
      setTimeout(sync,100);
    }
  },true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(sync,0),{once:true});
}

/* This script is injected at the end of the restored administrator document,
   so the login modal already exists. Mount the isolated HTML intro immediately. */
boot();
})();
