(()=>{
'use strict';
if(window.__ZR_ADMIN_LOGIN_INTRO_V1)return;
window.__ZR_ADMIN_LOGIN_INTRO_V1=true;

const VIDEO_URL='./admin_login_intro_v1.mp4?v=1';
const $=id=>document.getElementById(id);
let rootObserver=null,wasClean=false,fallbackTimer=0,playToken=0;

function clearFallback(){
  if(fallbackTimer){clearTimeout(fallbackTimer);fallbackTimer=0}
}
function setReady(ready){
  document.documentElement.classList.toggle('zr-admin-login-intro-ready',!!ready);
}
function ensureScene(){
  const modal=$('adminLoginModal');
  const card=modal?.querySelector('.modal-card');
  if(!modal||!card)return null;

  /* Bootstrap from older builds may have installed an inline photo. The intro owns
     only login visuals, so clear those visual-only properties without touching auth. */
  modal.style.setProperty('background-color','#38271e','important');
  modal.style.setProperty('background-image','none','important');
  modal.style.setProperty('background-size','auto','important');
  modal.style.setProperty('background-position','center','important');
  modal.style.setProperty('background-repeat','no-repeat','important');

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

function finishIntro(token){
  if(token!==playToken)return;
  clearFallback();
  setReady(true);
}

function playIntro(){
  const parts=ensureScene();
  if(!parts)return false;
  const {video}=parts;
  const token=++playToken;
  clearFallback();
  setReady(false);

  try{video.pause()}catch{}
  try{video.currentTime=0}catch{}
  video.loop=false;
  video.muted=true;
  video.defaultMuted=true;

  const onEnded=()=>finishIntro(token);
  video.addEventListener('ended',onEnded,{once:true});

  /* The source is about five seconds. If a browser blocks/stalls autoplay,
     never strand staff on a blank login screen. */
  fallbackTimer=setTimeout(()=>finishIntro(token),8500);

  try{
    const p=video.play();
    if(p&&typeof p.catch==='function'){
      p.catch(()=>finishIntro(token));
    }
  }catch{
    finishIntro(token);
  }
  return true;
}

function leaveLogin(){
  clearFallback();
  ++playToken;
  setReady(false);
  const video=$('zrAdminLoginIntroVideoV1');
  try{video?.pause()}catch{}
}

function sync(){
  const clean=document.documentElement.classList.contains('zr-admin-login-clean');
  ensureScene();
  if(clean&&!wasClean){
    /* Let the existing bootstrap finish opening the modal first. */
    setTimeout(playIntro,0);
  }else if(!clean&&wasClean){
    leaveLogin();
  }else if(clean){
    /* Re-assert the brown/video visual after any legacy visual helper runs. */
    const modal=$('adminLoginModal');
    if(modal){
      modal.style.setProperty('background-color','#38271e','important');
      modal.style.setProperty('background-image','none','important');
    }
  }
  wasClean=clean;
}

function boot(){
  ensureScene();
  sync();
  if(!rootObserver){
    rootObserver=new MutationObserver(sync);
    rootObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  }
  document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(()=>{ensureScene();sync()},0));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();