(()=>{
'use strict';
if(window.__ZR_CUSTOMER_MODAL_TITLE_PIN_V1)return;
window.__ZR_CUSTOMER_MODAL_TITLE_PIN_V1=true;

const OVERLAY_SELECTOR='.zr-customer-info-modal,.zr-customer-zoom,.zrgm32,.zrfinal31,.zr-guide-modal,.zr14-modal,#zrCustomerReturnHomeModal';
const SHELL_SELECTOR='.zr-customer-info-sheet,.zr-customer-zoom-card,.zrgm32-sheet,.zrfinal31-sheet,.zr-guide-sheet,.zr14-modal-card,.zr-return-sheet,.modal-card,.sheet';
let titleSource=null,scanQueued=false,positionQueued=false;

function visible(el){
  if(!(el instanceof Element)||el.classList.contains('hidden'))return false;
  try{
    const s=getComputedStyle(el);
    return s.display!=='none'&&s.visibility!=='hidden'&&s.pointerEvents!=='none'&&el.getClientRects().length>0;
  }catch{return true}
}
function topOverlay(){
  let best=null,bestZ=-Infinity;
  document.querySelectorAll(OVERLAY_SELECTOR).forEach(el=>{
    if(!visible(el))return;
    let z=0;try{const raw=getComputedStyle(el).zIndex;z=raw==='auto'?0:Number(raw)||0}catch{}
    if(!best||z>=bestZ){best=el;bestZ=z}
  });
  return best;
}
function shellFor(overlay){
  if(!overlay)return null;
  if(overlay.matches?.(SHELL_SELECTOR))return overlay;
  return overlay.querySelector(':scope > .zr-customer-info-sheet,:scope > .zr-customer-zoom-card,:scope > .zrgm32-sheet,:scope > .zrfinal31-sheet,:scope > .zr-guide-sheet,:scope > .zr14-modal-card,:scope > .zr-return-sheet,:scope > .modal-card,:scope > .sheet,:scope > [role="dialog"],:scope > .card')||overlay.firstElementChild||null;
}
function textOf(el){return String(el?.textContent||'').replace(/\s+/g,' ').trim()}
function labelledTitle(overlay,shell){
  const refs=[overlay?.getAttribute?.('aria-labelledby'),shell?.getAttribute?.('aria-labelledby')].filter(Boolean).join(' ').trim();
  if(!refs)return null;
  for(const id of refs.split(/\s+/)){
    const el=document.getElementById(id);
    if(el&&shell?.contains?.(el)&&textOf(el))return el;
  }
  return null;
}
function titleFor(overlay){
  const shell=shellFor(overlay);if(!shell)return null;
  return labelledTitle(overlay,shell)||shell.querySelector('.titleRow h1,.titleRow h2,.titleRow h3,.zr-guide-head h1,.zr-guide-head h2,.zr-guide-head h3,.modal-title,[data-modal-title],h1,h2,h3');
}
function proxy(){
  let el=document.getElementById('zrCustomerModalPinnedTitle');
  if(el)return el;
  el=document.createElement('div');
  el.id='zrCustomerModalPinnedTitle';
  el.hidden=true;
  el.setAttribute('aria-hidden','true');
  document.body.appendChild(el);
  return el;
}
function restoreTitle(){
  if(titleSource)titleSource.classList.remove('zr-customer-modal-title-source');
  titleSource=null;
}
function commonCloseRect(){
  const close=document.getElementById('zrModalUxPinnedClose');
  if(!visible(close))return null;
  try{return close.getBoundingClientRect()}catch{return null}
}
function place(overlay,titleProxy=proxy()){
  if(!visible(overlay)||titleProxy.hidden)return;
  const shell=shellFor(overlay);if(!shell)return;
  let rect;try{rect=shell.getBoundingClientRect()}catch{return}
  const inset=12,height=38;
  const top=Math.max(inset,Math.min(rect.top+inset,window.innerHeight-height-inset));
  const left=Math.max(inset,Math.min(rect.left+inset,window.innerWidth-inset));
  const closeRect=commonCloseRect();
  const shellRight=Math.min(rect.right,window.innerWidth)-inset;
  const rightEdge=closeRect?Math.min(shellRight,closeRect.left-inset):shellRight;
  const width=Math.max(70,rightEdge-left);
  titleProxy.style.setProperty('--zr-customer-modal-title-top',`${Math.round(top)}px`);
  titleProxy.style.setProperty('--zr-customer-modal-title-left',`${Math.round(left)}px`);
  titleProxy.style.setProperty('--zr-customer-modal-title-width',`${Math.round(width)}px`);
}
function sync(){
  scanQueued=false;
  const titleProxy=proxy();
  const overlay=topOverlay();
  if(!overlay){
    restoreTitle();
    titleProxy.hidden=true;
    document.body.classList.remove('zr-customer-modal-title-pin-active');
    return;
  }
  const title=titleFor(overlay);
  if(!title||!textOf(title)){
    restoreTitle();
    titleProxy.hidden=true;
    document.body.classList.remove('zr-customer-modal-title-pin-active');
    return;
  }
  if(titleSource!==title){
    restoreTitle();
    titleSource=title;
    titleSource.classList.add('zr-customer-modal-title-source');
  }
  titleProxy.textContent=textOf(title);
  titleProxy.hidden=false;
  document.body.classList.add('zr-customer-modal-title-pin-active');
  place(overlay,titleProxy);
}
function scheduleSync(){
  if(scanQueued)return;
  scanQueued=true;
  requestAnimationFrame(sync);
}
function schedulePosition(){
  if(positionQueued)return;
  positionQueued=true;
  requestAnimationFrame(()=>{positionQueued=false;const overlay=topOverlay();if(overlay)place(overlay)});
}
function injectStyle(){
  if(document.getElementById('zrCustomerModalTitlePinStyleV1'))return;
  const s=document.createElement('style');
  s.id='zrCustomerModalTitlePinStyleV1';
  s.textContent=`
    body.zr-customer-modal-title-pin-active #zrModalUxPinnedTitle{display:none!important}
    .zr-customer-modal-title-source{visibility:hidden!important;pointer-events:none!important}
    #zrCustomerModalPinnedTitle{position:fixed!important;top:var(--zr-customer-modal-title-top,14px)!important;left:var(--zr-customer-modal-title-left,14px)!important;width:var(--zr-customer-modal-title-width,180px)!important;height:38px!important;z-index:2147482999!important;display:flex!important;align-items:center!important;margin:0!important;padding:0 8px!important;box-sizing:border-box!important;border-radius:9px!important;background:#fff!important;color:#1f2d25!important;box-shadow:0 3px 12px rgba(0,0,0,.10)!important;font:inherit!important;font-weight:800!important;line-height:1.2!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;pointer-events:none!important;-webkit-text-fill-color:currentColor!important}
    #zrCustomerModalPinnedTitle[hidden]{display:none!important}
  `;
  document.head.appendChild(s);
}
function boot(){
  injectStyle();proxy();sync();
  document.addEventListener('click',()=>{scheduleSync();setTimeout(scheduleSync,80)},true);
  document.addEventListener('change',()=>{scheduleSync();setTimeout(scheduleSync,80)},true);
  document.addEventListener('scroll',schedulePosition,true);
  window.addEventListener('resize',schedulePosition);
  window.addEventListener('orientationchange',()=>setTimeout(schedulePosition,100));
  setInterval(scheduleSync,900);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
