(()=>{
'use strict';
if(window.__ZR_CUSTOMER_GUIDE_TRANSITION_V3)return;
window.__ZR_CUSTOMER_GUIDE_TRANSITION_V3=true;

const $=id=>document.getElementById(id);
const PLAY_IDS=new Set(['playStart','playDuration']);
let playGuardUntil=0;
let playTimer=0;

function injectStyle(){
  if($('zrCustomerGuideTransitionV3Style'))return;
  const s=document.createElement('style');
  s.id='zrCustomerGuideTransitionV3Style';
  s.textContent=`body.zr-play-guide-transition #zrGuideModal{display:none!important}`;
  document.head.appendChild(s);
}
function visible(el){
  if(!el||el.classList?.contains('hidden'))return false;
  const cs=getComputedStyle(el);
  return cs.display!=='none'&&cs.visibility!=='hidden';
}
function closeGuide(id,finalDialog=null){
  const modal=$(id);if(!modal)return;
  if(finalDialog&&(modal===finalDialog||modal.contains(finalDialog)))return;
  modal.classList.add('hidden');
}
function closeZooGuide(){closeGuide('zrGuideModal')}
function closeCustomerGuides(finalDialog=null){
  closeGuide('zrGuideModal',finalDialog);
  closeGuide('zrPlayGuideModal',finalDialog);
}
function beginPlayTransition(){
  playGuardUntil=Date.now()+1000;
  document.body.classList.add('zr-play-guide-transition');
  closeZooGuide();
  clearTimeout(playTimer);
  playTimer=setTimeout(endPlayTransition,1050);
}
function endPlayTransition(){
  if(Date.now()<playGuardUntil)return;
  closeZooGuide();
  document.body.classList.remove('zr-play-guide-transition');
}
function isPlayControl(el){return !!el&&!el.closest?.('#adminView')&&PLAY_IDS.has(el.id)}

function finalDialog(){
  const phrase='예약 전 최종 확인';
  const candidates=[...document.querySelectorAll('[role="dialog"],.modal-card,.modal-sheet,.zr-guide-sheet,[id*="Modal"],[class*="modal"]')];
  let best=null,bestLen=Infinity;
  for(const el of candidates){
    if(!visible(el))continue;
    const text=String(el.textContent||'').replace(/\s+/g,' ').trim();
    if(!text.includes(phrase))continue;
    if(text.length<bestLen){best=el;bestLen=text.length}
  }
  return best;
}
function syncTransitions(){
  if(Date.now()<playGuardUntil){
    document.body.classList.add('zr-play-guide-transition');
    closeZooGuide();
  }else if(document.body.classList.contains('zr-play-guide-transition'))endPlayTransition();

  const final=finalDialog();
  if(final)closeCustomerGuides(final);
}
function boot(){
  injectStyle();
  for(const type of ['pointerdown','mousedown','touchstart','focusin','input','change']){
    document.addEventListener(type,e=>{if(isPlayControl(e.target))beginPlayTransition()},true);
  }
  new MutationObserver(syncTransitions).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('button');
    const text=String(btn?.textContent||'').replace(/\s+/g,' ').trim();
    if(text.includes('확인 후 예약 신청'))closeCustomerGuides(finalDialog());
  },true);
  syncTransitions();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
