(()=>{
'use strict';
if(window.__ZR_MODAL_UX_CONSISTENCY_V1)return;
window.__ZR_MODAL_UX_CONSISTENCY_V1=true;

const OVERLAY_SELECTOR='.modal,.zr-customer-info-modal,.zr-customer-zoom,.zrgm32,.zrfinal31,.zr-guide-modal,.zr14-modal,#zrCustomerReturnHomeModal';
const SHELL_SELECTOR='.modal-card,.sheet,.zr-customer-info-sheet,.zr-customer-zoom-card,.zrgm32-sheet,.zrfinal31-sheet,.zr-guide-sheet,.zr14-modal-card,.zr-return-sheet';
let scanQueued=false,positionQueued=false;
let touchX=0,touchY=0;
let pinnedSource=null;

function visibleOverlay(el){
  if(!(el instanceof Element)||!el.matches(OVERLAY_SELECTOR))return false;
  if(el.classList.contains('hidden'))return false;
  try{
    const s=getComputedStyle(el);
    return s.display!=='none'&&s.visibility!=='hidden'&&s.pointerEvents!=='none'&&el.getClientRects().length>0;
  }catch{return true}
}
function overlayForTarget(target){
  const own=target instanceof Element?target.closest(OVERLAY_SELECTOR):null;
  if(visibleOverlay(own))return own;
  return topVisibleOverlay();
}
function topVisibleOverlay(){
  let best=null,bestZ=-Infinity;
  document.querySelectorAll(OVERLAY_SELECTOR).forEach(el=>{
    if(!visibleOverlay(el))return;
    let z=0;try{const raw=getComputedStyle(el).zIndex;z=raw==='auto'?0:Number(raw)||0}catch{}
    if(!best||z>=bestZ){best=el;bestZ=z}
  });
  return best;
}
function blockBackdrop(e){
  if(!visibleOverlay(e.target))return;
  e.preventDefault();
  e.stopImmediatePropagation();
}
function isScrollable(el){
  if(!(el instanceof Element)||el.scrollHeight<=el.clientHeight+1)return false;
  try{return /^(auto|scroll|overlay)$/.test(getComputedStyle(el).overflowY)}catch{return false}
}
function canScroll(el,deltaY){
  if(deltaY>0)return el.scrollTop+el.clientHeight<el.scrollHeight-1;
  if(deltaY<0)return el.scrollTop>1;
  return true;
}
function scrollContainerFor(target,overlay,deltaY=0){
  let el=target instanceof Element?target:target?.parentElement;
  while(el&&el!==overlay){
    if(isScrollable(el)&&canScroll(el,deltaY))return el;
    el=el.parentElement;
  }
  if(isScrollable(overlay)&&canScroll(overlay,deltaY))return overlay;
  return null;
}
function guardTouchStart(e){
  if(!overlayForTarget(e.target)||e.touches?.length!==1)return;
  touchX=e.touches[0].clientX;
  touchY=e.touches[0].clientY;
}
function guardTouchMove(e){
  const overlay=overlayForTarget(e.target);
  if(!overlay||e.touches?.length!==1)return;
  const x=e.touches[0].clientX,y=e.touches[0].clientY;
  const dx=x-touchX,deltaY=touchY-y;
  touchX=x;touchY=y;
  if(Math.abs(dx)>Math.abs(deltaY))return;
  if(scrollContainerFor(e.target,overlay,deltaY))return;
  if(e.cancelable)e.preventDefault();
}
function guardWheel(e){
  const overlay=overlayForTarget(e.target);
  if(!overlay||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
  if(scrollContainerFor(e.target,overlay,e.deltaY))return;
  if(e.cancelable)e.preventDefault();
}
function textOf(el){return String(el?.textContent||el?.value||'').replace(/\s+/g,' ').trim()}
function metaOf(el){return `${el?.id||''} ${typeof el?.className==='string'?el.className:''} ${el?.getAttribute?.('name')||''} ${el?.getAttribute?.('aria-label')||''} ${el?.getAttribute?.('title')||''}`}
function isDangerousCancel(el){
  const text=textOf(el),meta=metaOf(el);
  if(text!=='취소')return false;
  if(el.matches?.('.danger,.btn-danger,[data-danger="true"],[data-destructive="true"]'))return true;
  return /(cancelToggle|bookingCancel|cancelBooking|reservationCancel|cancelReservation|statusCancel|cancelStatus|delete|remove|cleanup|archive)/i.test(meta);
}
function isDismissCancel(el){
  return textOf(el)==='취소'&&!!el.closest?.(OVERLAY_SELECTOR)&&!isDangerousCancel(el);
}
function renameDismissCancel(el){
  if(!isDismissCancel(el)||el.dataset.zrModalUxRenamed==='1')return;
  el.dataset.zrModalUxRenamed='1';
  if(el.matches('input'))el.value='닫기';else el.textContent='닫기';
}
function isCloseControl(el){
  if(!el?.matches?.('button,input[type="button"],input[type="submit"]'))return false;
  if(isDismissCancel(el))return true;
  const text=textOf(el);
  if(text==='닫기'||/^[×✕✖xX]$/.test(text))return true;
  const meta=metaOf(el);
  return /(close|닫기)/i.test(meta)&&!/(cancelToggle|bookingCancel|cancelBooking|reservationCancel|cancelReservation|statusCancel|delete|remove|cleanup|archive|back|뒤로|다시)/i.test(meta);
}
function shellFor(btn){
  const direct=btn?.closest?.(SHELL_SELECTOR);if(direct)return direct;
  const overlay=btn?.closest?.(OVERLAY_SELECTOR);if(!overlay)return null;
  return overlay.querySelector(':scope > .modal-card,:scope > .sheet,:scope > [role="dialog"],:scope > .card')||overlay.firstElementChild||null;
}
function decorateClose(btn){
  if(isDismissCancel(btn))renameDismissCancel(btn);
  if(btn.dataset.zrModalUxClose==='1')return;
  const shell=shellFor(btn);if(!shell)return;
  btn.dataset.zrModalUxClose='1';
  btn.classList.add('zr-modal-ux-close');
  if(/^[×✕✖xX]$/.test(textOf(btn)))btn.classList.add('zr-modal-ux-close-icon');
  shell.classList.add('zr-modal-ux-shell');
  const title=shell.querySelector('h1,h2,h3');if(title)title.classList.add('zr-modal-ux-title');
}
function proxyButton(){
  let btn=document.getElementById('zrModalUxPinnedClose');
  if(btn)return btn;
  btn=document.createElement('button');
  btn.type='button';
  btn.id='zrModalUxPinnedClose';
  btn.className='zr-modal-ux-pinned-close';
  btn.hidden=true;
  btn.setAttribute('aria-label','팝업 닫기');
  btn.addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();
    const source=pinnedSource;
    if(source?.isConnected)source.click();
    setTimeout(()=>{scheduleScan();schedulePosition()},0);
  });
  document.body.appendChild(btn);
  return btn;
}
function sourcePriority(btn){
  const text=textOf(btn),meta=metaOf(btn);
  if(/^[×✕✖xX]$/.test(text))return 0;
  if(/(close|닫기)/i.test(meta))return 1;
  if(text==='닫기')return 2;
  return 3;
}
function pickPinnedSource(overlay){
  const list=[...overlay.querySelectorAll('button,input[type="button"],input[type="submit"]')]
    .filter(isCloseControl)
    .sort((a,b)=>sourcePriority(a)-sourcePriority(b));
  return list[0]||null;
}
function clearPinnedSource(){
  if(pinnedSource)pinnedSource.classList.remove('zr-modal-ux-proxied-source');
  pinnedSource=null;
}
function syncPinnedClose(){
  const proxy=proxyButton();
  const overlay=topVisibleOverlay();
  if(!overlay){clearPinnedSource();proxy.hidden=true;return}
  const source=pickPinnedSource(overlay);
  if(!source){clearPinnedSource();proxy.hidden=true;return}
  decorateClose(source);
  if(pinnedSource!==source){
    clearPinnedSource();
    pinnedSource=source;
    pinnedSource.classList.add('zr-modal-ux-proxied-source');
  }
  const icon=/^[×✕✖xX]$/.test(textOf(source));
  proxy.textContent=icon?'✕':'닫기';
  proxy.classList.toggle('zr-modal-ux-pinned-icon',icon);
  proxy.hidden=false;
  placePinnedClose(overlay,source,proxy);
}
function placePinnedClose(overlay,source,proxy=proxyButton()){
  if(!visibleOverlay(overlay)||!source?.isConnected){proxy.hidden=true;return}
  const shell=shellFor(source)||overlay.firstElementChild||overlay;
  let rect;try{rect=shell.getBoundingClientRect()}catch{return}
  const inset=12;
  const width=proxy.offsetWidth||64,height=proxy.offsetHeight||38;
  const top=Math.max(inset,Math.min(rect.top+inset,window.innerHeight-height-inset));
  const right=Math.max(inset,Math.min(window.innerWidth-width-inset,window.innerWidth-Math.min(rect.right,window.innerWidth)+inset));
  proxy.style.setProperty('--zr-modal-close-top',`${Math.round(top)}px`);
  proxy.style.setProperty('--zr-modal-close-right',`${Math.round(right)}px`);
}
function scanCloseButtons(){
  scanQueued=false;
  document.querySelectorAll('button,input[type="button"],input[type="submit"]').forEach(btn=>{
    if(isDismissCancel(btn))renameDismissCancel(btn);
    if(isCloseControl(btn))decorateClose(btn);
  });
  syncPinnedClose();
}
function scheduleScan(){
  if(scanQueued)return;
  scanQueued=true;
  requestAnimationFrame(scanCloseButtons);
}
function schedulePosition(){
  if(positionQueued)return;
  positionQueued=true;
  requestAnimationFrame(()=>{positionQueued=false;syncPinnedClose()});
}
function injectStyle(){
  if(document.getElementById('zrModalUxConsistencyStyleV1'))return;
  const s=document.createElement('style');
  s.id='zrModalUxConsistencyStyleV1';
  s.textContent=`
    ${OVERLAY_SELECTOR}{overscroll-behavior:contain!important}
    ${SHELL_SELECTOR}{overscroll-behavior-y:contain!important;-webkit-overflow-scrolling:touch}
    .zr-modal-ux-shell{position:relative!important}
    .zr-modal-ux-shell .zr-modal-ux-title{padding-right:82px!important}
    .zr-modal-ux-proxied-source{visibility:hidden!important;pointer-events:none!important}
    #zrModalUxPinnedClose{position:fixed!important;top:var(--zr-modal-close-top,14px)!important;right:var(--zr-modal-close-right,14px)!important;bottom:auto!important;left:auto!important;z-index:2147483000!important;margin:0!important;transform:none!important;float:none!important;min-width:64px!important;min-height:38px!important;padding:7px 11px!important;border:1px solid #d5ddd7!important;border-radius:9px!important;background:#fff!important;color:#31433a!important;box-shadow:0 3px 12px rgba(0,0,0,.13)!important;font:inherit!important;font-weight:700!important;line-height:1.2!important;white-space:nowrap!important;cursor:pointer!important;-webkit-text-fill-color:currentColor!important}
    #zrModalUxPinnedClose.zr-modal-ux-pinned-icon{width:40px!important;min-width:40px!important;padding:0!important;font-size:18px!important}
    #zrModalUxPinnedClose[hidden]{display:none!important}
  `;
  document.head.appendChild(s);
}
function boot(){
  injectStyle();proxyButton();scanCloseButtons();
  document.addEventListener('pointerdown',blockBackdrop,true);
  document.addEventListener('click',blockBackdrop,true);
  document.addEventListener('touchstart',guardTouchStart,{capture:true,passive:true});
  document.addEventListener('touchmove',guardTouchMove,{capture:true,passive:false});
  document.addEventListener('wheel',guardWheel,{capture:true,passive:false});
  document.addEventListener('click',()=>{scheduleScan();setTimeout(scheduleScan,80)},true);
  document.addEventListener('scroll',schedulePosition,true);
  window.addEventListener('resize',schedulePosition);
  window.addEventListener('orientationchange',()=>setTimeout(schedulePosition,100));
  document.addEventListener('zr:admin-runtime-ready',()=>{scheduleScan();setTimeout(scheduleScan,100)});
  const timer=setInterval(scheduleScan,700);setTimeout(()=>clearInterval(timer),12000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
