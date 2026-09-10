(()=>{
'use strict';
if(window.__ZR_SCHEDULE_LOGIN_ANIMALS_V1)return;
window.__ZR_SCHEDULE_LOGIN_ANIMALS_V1=true;

const INTRO_URL='./admin_login_intro_html_v1.html?v=1';
let observer=null;
let playToken=0;
let fallbackTimer=0;
let wasVisible=null;

function installStyle(){
  if(document.getElementById('zrScheduleLoginAnimalsV1Style'))return;
  const style=document.createElement('style');
  style.id='zrScheduleLoginAnimalsV1Style';
  style.textContent=`
    #login.login{isolation:isolate!important;background:#38271e!important}
    #zrScheduleLoginAnimalsV1{position:absolute!important;inset:0!important;z-index:0!important;display:block!important;overflow:hidden!important;background:#38271e!important;pointer-events:none!important}
    #zrScheduleLoginAnimalsV1 iframe{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;border:0!important;margin:0!important;padding:0!important;display:block!important;background:#38271e!important;pointer-events:none!important}
    #zrScheduleLoginAnimalsV1::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:rgba(32,18,12,.10)}
    #login .loginbox{position:relative!important;z-index:2!important;transition:opacity .38s ease,transform .38s ease,visibility .38s ease!important}
    #login.zr-schedule-login-animals-booting .loginbox{opacity:0!important;visibility:hidden!important;transform:translateY(8px) scale(.992)!important;pointer-events:none!important}
    #login.zr-schedule-login-animals-ready .loginbox{opacity:1!important;visibility:visible!important;transform:none!important;pointer-events:auto!important}
    @media(max-width:700px){#zrScheduleLoginAnimalsV1::after{background:rgba(32,18,12,.16)}}
    @media(prefers-reduced-motion:reduce){#login .loginbox{transition:none!important}#login.zr-schedule-login-animals-booting .loginbox{transform:none!important}}
  `;
  document.head.appendChild(style);
}

function parts(){
  const login=document.getElementById('login');
  const box=login?.querySelector('.loginbox');
  if(!login||!box)return null;
  let scene=document.getElementById('zrScheduleLoginAnimalsV1');
  if(!scene){
    scene=document.createElement('div');
    scene.id='zrScheduleLoginAnimalsV1';
    scene.setAttribute('aria-hidden','true');
    const frame=document.createElement('iframe');
    frame.id='zrScheduleLoginAnimalsFrameV1';
    frame.title='주렁주렁 현장스케줄 로그인 동물 인트로';
    frame.setAttribute('tabindex','-1');
    frame.setAttribute('aria-hidden','true');
    scene.appendChild(frame);
    login.insertBefore(scene,box);
  }
  return {login,box,scene,frame:document.getElementById('zrScheduleLoginAnimalsFrameV1')};
}

function loginVisible(login){return !!login&&!login.classList.contains('hidden')}
function clearFallback(){if(fallbackTimer){clearTimeout(fallbackTimer);fallbackTimer=0}}
function reveal(token){
  if(token!==playToken)return;
  const p=parts();if(!p)return;
  clearFallback();
  p.login.classList.remove('zr-schedule-login-animals-booting');
  p.login.classList.add('zr-schedule-login-animals-ready');
}
function play(){
  const p=parts();
  if(!p||!loginVisible(p.login))return;
  const token=++playToken;
  clearFallback();
  p.login.classList.remove('zr-schedule-login-animals-ready');
  p.login.classList.add('zr-schedule-login-animals-booting');
  p.frame.src=INTRO_URL+'&surface=schedule&session='+token+'&t='+Date.now();
  fallbackTimer=setTimeout(()=>reveal(token),1800);
}
function syncVisibility(force=false){
  installStyle();
  const p=parts();if(!p)return;
  const visible=loginVisible(p.login);
  if(!force&&visible===wasVisible)return;
  wasVisible=visible;
  if(visible)play();
  else{
    ++playToken;
    clearFallback();
    p.login.classList.remove('zr-schedule-login-animals-booting','zr-schedule-login-animals-ready');
  }
}
function handleMessage(e){
  const p=parts();if(!p||e.source!==p.frame.contentWindow)return;
  const data=e.data;
  if(!data||data.source!=='zr-admin-intro-html-v1')return;
  const token=playToken;
  if(data.event==='ended'||data.event==='error')reveal(token);
}
function boot(){
  installStyle();
  const p=parts();if(!p)return;
  window.addEventListener('message',handleMessage);
  if(!observer){
    observer=new MutationObserver(()=>syncVisibility(false));
    observer.observe(p.login,{attributes:true,attributeFilter:['class']});
  }
  syncVisibility(true);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
