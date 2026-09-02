(()=>{
'use strict';
if(window.__ZR_ADMIN_LOGIN_INTRO_V1)return;
window.__ZR_ADMIN_LOGIN_INTRO_V1=true;

const VIDEO_URL='./admin_login_intro_v1.mp4?v=2';
const ROOT=document.documentElement;
const $=id=>document.getElementById(id);
let rootObserver=null;
let sessionActive=false;
let playToken=0;
let fallbackTimer=0;
let beginTimer=0;
let playStarted=false;

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

    const video=document.createElement('video');
    video.id='zrAdminLoginIntroVideoV1';
    video.muted=true;
    video.defaultMuted=true;
    video.autoplay=false;
    video.loop=false;
    video.playsInline=true;
    video.preload='auto';
    video.disablePictureInPicture=true;
    video.setAttribute('playsinline','');
    video.setAttribute('muted','');
    video.setAttribute('preload','auto');
    video.setAttribute('disablepictureinpicture','');
    video.setAttribute('controlslist','nodownload noplaybackrate noremoteplayback');
    video.src=VIDEO_URL;
    scene.appendChild(video);
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
  return {modal,card,scene,video:$('zrAdminLoginIntroVideoV1')};
}
function revealIntroSurface(){
  ROOT.classList.add('zr-admin-login-intro-mounted');
  ROOT.classList.remove('zr-admin-login-v4-booting');
}
function finishIntro(token){
  if(token!==playToken||!sessionActive)return;
  if(fallbackTimer){clearTimeout(fallbackTimer);fallbackTimer=0}
  revealIntroSurface();
  setReady(true);
}
function fallbackToLogin(token){
  if(token!==playToken||!sessionActive)return;
  revealIntroSurface();
  finishIntro(token);
}
function startPlayback(parts,token){
  if(token!==playToken||!sessionActive||!loginIsStable()||playStarted)return;
  const {video}=parts;
  playStarted=true;
  setReady(false);
  revealIntroSurface();

  try{video.pause()}catch{}
  try{video.currentTime=0}catch{}
  video.loop=false;
  video.muted=true;
  video.defaultMuted=true;

  video.addEventListener('ended',()=>finishIntro(token),{once:true});
  video.addEventListener('error',()=>fallbackToLogin(token),{once:true});
  fallbackTimer=setTimeout(()=>fallbackToLogin(token),8500);

  try{
    const p=video.play();
    if(p&&typeof p.catch==='function'){
      p.catch(()=>{
        /* Muted inline video should autoplay. Give media loading one retry before
           falling back so a transient startup race does not skip the intro. */
        setTimeout(()=>{
          if(token!==playToken||!sessionActive||video.ended)return;
          try{
            const retry=video.play();
            if(retry&&typeof retry.catch==='function')retry.catch(()=>fallbackToLogin(token));
          }catch{fallbackToLogin(token)}
        },180);
      });
    }
  }catch{fallbackToLogin(token)}
}
function beginLoginSession(){
  if(sessionActive||!loginIsStable())return false;
  const parts=ensureScene();
  if(!parts)return false;

  sessionActive=true;
  playStarted=false;
  const token=++playToken;
  clearTimers();
  setReady(false);
  ROOT.classList.add('zr-admin-login-v4-booting');
  ROOT.classList.remove('zr-admin-login-intro-mounted');

  const {video}=parts;
  const begin=()=>startPlayback(parts,token);
  if(video.readyState>=2){
    requestAnimationFrame(begin);
  }else{
    video.addEventListener('loadeddata',begin,{once:true});
    video.addEventListener('canplay',begin,{once:true});
    video.addEventListener('error',()=>fallbackToLogin(token),{once:true});
    try{video.load()}catch{}
    /* Media must not trap employees on a blank screen if it cannot load. */
    fallbackTimer=setTimeout(()=>fallbackToLogin(token),6500);
  }
  return true;
}
function endLoginSession(){
  if(!sessionActive)return;
  clearTimers();
  ++playToken;
  sessionActive=false;
  playStarted=false;
  setReady(false);
  ROOT.classList.remove('zr-admin-login-intro-mounted','zr-admin-login-v4-booting');
  const video=$('zrAdminLoginIntroVideoV1');
  try{video?.pause()}catch{}
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
function boot(){
  ROOT.classList.add('zr-admin-login-v4-booting');
  sync();
  if(!rootObserver){
    rootObserver=new MutationObserver(()=>scheduleBegin(35));
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
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
