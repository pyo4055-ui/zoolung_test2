(()=>{
'use strict';
if(window.__ZR_CUSTOMER_TIME_GUIDE_GUARD_V2)return;
window.__ZR_CUSTOMER_TIME_GUIDE_GUARD_V2=true;

let exitGuardUntil=0;
const isExit=el=>el?.id==='exitTime'&&!el.closest?.('#adminView');
function closeZooGuide(){
  if(Date.now()>exitGuardUntil)return;
  const m=document.getElementById('zrGuideModal');
  if(m&&!m.classList.contains('hidden'))m.classList.add('hidden');
}
function guardExit(){
  exitGuardUntil=Date.now()+900;
  queueMicrotask(closeZooGuide);
  setTimeout(closeZooGuide,0);
  setTimeout(closeZooGuide,40);
  setTimeout(closeZooGuide,120);
}
function boot(){
  for(const type of ['pointerdown','mousedown','touchstart','focusin','change']){
    document.addEventListener(type,e=>{if(isExit(e.target))guardExit()},true);
  }
  new MutationObserver(closeZooGuide).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
