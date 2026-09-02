(()=>{
'use strict';
if(window.__ZR_ADMIN_LOGIN_INTRO_V1)return;
window.__ZR_ADMIN_LOGIN_INTRO_V1=true;

const VIDEO_URL='./admin_login_intro_v1.mp4?v=3';
const ROOT=document.documentElement;
const $=id=>document.getElementById(id);
let rootObserver=null;
let sessionActive=false;
let playToken=0;
let fallbackTimer=0;
let beginTimer=0;
let playStarted=false;
let mediaObjectUrl='';

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
    video.autoplay=true;
    video.loop=false;
    video.playsInline=true;
    video.preload='auto';
    video.disablePictureInPicture=true;
    video.setAttribute('autoplay','');
    video.setAttribute('playsinline','');
    video.setAttribute('webkit-playsinline','');
    video.setAttribute('muted','');
    video.setAttribute('preload','auto');
    video.setAttribute('disablepictureinpicture','');
    video.setAttribute('controlslist','nodownload noplaybackrate noremoteplayback');
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
function prepareVideo(video){
  if(!video)return Promise.reject(new Error('intro video missing'));
  if(video.dataset.zrMediaReady==='1'&&video.readyState>=2)return Promise.resolve(video);
  if(video.__zrPreparePromise)return video.__zrPreparePromise;

  video.__zrPreparePromise=(async()=>{
    const response=await fetch(VIDEO_URL,{cache:'force-cache'});
    if(!response.ok)throw new Error('intro video fetch failed');
    const buffer=await response.arrayBuffer();
    if(!buffer||buffer.byteLength<256)throw new Error('intro video is empty');

    const blob=new Blob([buffer],{type:'video/mp4'});
    if(mediaObjectUrl){try{URL.revokeObjectURL(mediaObjectUrl)}catch{}}
    mediaObjectUrl=URL.createObjectURL(blob);
    video.src=mediaObjectUrl;
    try{video.load()}catch{}

    await new Promise((resolve,reject)=>{
      if(video.readyState>=2){resolve();return}
      let done=false;
      const finish=(ok)=>{
        if(done)return;done=true;
        clearTimeout(timer);
        video.removeEventListener('loadeddata',onReady);
        video.removeEventListener('canplay',onReady);
        video.removeEventListener('error',onError);
        ok?resolve():reject(new Error('intro video decode failed'));
      };
      const onReady=()=>finish(true);
      const onError=()=>finish(false);
      const timer=setTimeout(()=>finish(false),6000);
      video.addEventListener('loadeddata',onReady,{once:true});
      video.addEventListener('canplay',onReady,{once:true});
      video.addEventListener('error',onError,{once:true});
    });
    video.dataset.zrMediaReady='1';
    return video;
  })().catch(err=>{
    video.__zrPreparePromise=null;
    throw err;
  });
  return video.__zrPreparePromise;
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

  video.addEventListener('playing',()=>ROOT.classList.add('zr-admin-login-intro-playing'),{once:true});
  video.addEventListener('ended',()=>finishIntro(token),{once:true});
  video.addEventListener('error',()=>fallbackToLogin(token),{once:true});
  fallbackTimer=setTimeout(()=>fallbackToLogin(token),9000);

  const attempt=()=>{
    try{
      const p=video.play();
      return p&&typeof p.catch==='function'?p:Promise.resolve();
    }catch(e){return Promise.reject(e)}
  };
  attempt().catch(()=>{
    setTimeout(()=>{
      if(token!==playToken||!sessionActive||video.ended)return;
      attempt().catch(()=>setTimeout(()=>fallbackToLogin(token),450));
    },220);
  });
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
  ROOT.classList.remove('zr-admin-login-intro-mounted','zr-admin-login-intro-playing');

  fallbackTimer=setTimeout(()=>fallbackToLogin(token),7500);
  prepareVideo(parts.video).then(()=>{
    if(token!==playToken||!sessionActive)return;
    if(fallbackTimer){clearTimeout(fallbackTimer);fallbackTimer=0}
    requestAnimationFrame(()=>startPlayback(parts,token));
  }).catch(()=>fallbackToLogin(token));
  return true;
}
function endLoginSession(){
  if(!sessionActive)return;
  clearTimers();
  ++playToken;
  sessionActive=false;
  playStarted=false;
  setReady(false);
  ROOT.classList.remove('zr-admin-login-intro-mounted','zr-admin-login-v4-booting','zr-admin-login-intro-playing');
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
  if(parts){
    clearLegacyVisual(parts.modal);
    prepareVideo(parts.video).catch(()=>{});
  }

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
   so the login modal already exists. Mount the media layer immediately instead
   of waiting for DOMContentLoaded and letting legacy visuals flash first. */
boot();
})();