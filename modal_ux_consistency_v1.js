(()=>{
'use strict';
if(window.__ZR_MODAL_UX_CONSISTENCY_V1)return;
window.__ZR_MODAL_UX_CONSISTENCY_V1=true;

const OVERLAY_SELECTOR='.modal,.zr-customer-info-modal,.zr-customer-zoom,.zrgm32,.zrfinal31,.zr-guide-modal,.zr14-modal,#zrCustomerReturnHomeModal';
const SHELL_SELECTOR='.modal-card,.sheet,.zr-customer-info-sheet,.zr-customer-zoom-card,.zrgm32-sheet,.zrfinal31-sheet,.zr-guide-sheet,.zr14-modal-card,.zr-return-sheet';
let scanQueued=false;
let touchX=0,touchY=0;

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
  if(el.classList?.contains('zr-modal-ux-header-close'))return false;
  if(isDismissCancel(el))return true;
  const text=textOf(el);
  if(text==='닫기'||/^[×✕✖xX]$/.test(text))return true;
  const meta=metaOf(el);
  return /(close|닫기)/i.test(meta)&&!/(cancelToggle|bookingCancel|cancelBooking|reservationCancel|cancelReservation|statusCancel|delete|remove|cleanup|archive|back|뒤로|다시)/i.test(meta);
}
function shellForOverlay(overlay){
  if(!overlay)return null;
  if(overlay.matches?.(SHELL_SELECTOR))return overlay;
  return overlay.querySelector(':scope > .modal-card,:scope > .sheet,:scope > .zr-customer-info-sheet,:scope > .zr-customer-zoom-card,:scope > .zrgm32-sheet,:scope > .zrfinal31-sheet,:scope > .zr-guide-sheet,:scope > .zr14-modal-card,:scope > .zr-return-sheet,:scope > [role="dialog"],:scope > .card')||overlay.firstElementChild||null;
}
function labelledTitle(overlay,shell){
  const refs=[overlay?.getAttribute?.('aria-labelledby'),shell?.getAttribute?.('aria-labelledby')].filter(Boolean).join(' ').trim();
  if(!refs)return null;
  for(const id of refs.split(/\s+/)){
    const el=document.getElementById(id);
    if(el&&shell?.contains?.(el)&&textOf(el))return el;
  }
  return null;
}
function titleForOverlay(overlay,shell=shellForOverlay(overlay)){
  if(!shell)return null;
  return labelledTitle(overlay,shell)||shell.querySelector('.titleRow h1,.titleRow h2,.titleRow h3,.zr-guide-head h1,.zr-guide-head h2,.zr-guide-head h3,.modal-title,[data-modal-title],h1,h2,h3');
}
function sourcePriority(btn){
  const text=textOf(btn),meta=metaOf(btn);
  if(/^[×✕✖xX]$/.test(text))return 0;
  if(/(close|닫기)/i.test(meta))return 1;
  if(text==='닫기')return 2;
  return 3;
}
function pickCloseSource(overlay){
  return [...overlay.querySelectorAll('button,input[type="button"],input[type="submit"]')]
    .filter(isCloseControl)
    .sort((a,b)=>sourcePriority(a)-sourcePriority(b))[0]||null;
}
function restoreHeaderSources(header){
  const oldTitle=header?._zrTitleSource;
  const oldClose=header?._zrCloseSource;
  if(oldTitle?.isConnected)oldTitle.classList.remove('zr-modal-ux-title-source');
  if(oldClose?.isConnected)oldClose.classList.remove('zr-modal-ux-close-source');
  if(header){header._zrTitleSource=null;header._zrCloseSource=null}
}
function headerForShell(shell){
  let header=shell.querySelector(':scope > .zr-modal-ux-header');
  if(header)return header;
  header=document.createElement('div');
  header.className='zr-modal-ux-header';
  header.setAttribute('data-zr-modal-ux-header','1');
  const title=document.createElement('div');
  title.className='zr-modal-ux-header-title';
  const close=document.createElement('button');
  close.type='button';
  close.className='zr-modal-ux-header-close';
  close.setAttribute('aria-label','팝업 닫기');
  close.addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();
    const source=header._zrCloseSource;
    if(source?.isConnected)source.click();
    setTimeout(scheduleScan,0);
  });
  header.append(title,close);
  shell.insertBefore(header,shell.firstChild);
  return header;
}
function syncHeaderGeometry(shell,header){
  try{
    const s=getComputedStyle(shell);
    const pt=Math.max(0,parseFloat(s.paddingTop)||0);
    const pl=Math.max(0,parseFloat(s.paddingLeft)||0);
    const pr=Math.max(0,parseFloat(s.paddingRight)||0);
    header.style.setProperty('--zr-modal-ux-shell-pad-top',`${pt}px`);
    header.style.setProperty('--zr-modal-ux-shell-pad-left',`${pl}px`);
    header.style.setProperty('--zr-modal-ux-shell-pad-right',`${pr}px`);
  }catch{}
}
function syncOverlayHeader(overlay){
  if(!visibleOverlay(overlay))return;
  const shell=shellForOverlay(overlay);if(!shell)return;
  shell.classList.add('zr-modal-ux-shell');
  const titleSource=titleForOverlay(overlay,shell);
  const closeSource=pickCloseSource(overlay);
  if(!titleSource&&!closeSource)return;
  if(closeSource&&isDismissCancel(closeSource))renameDismissCancel(closeSource);
  const header=headerForShell(shell);
  const titleEl=header.querySelector('.zr-modal-ux-header-title');
  const closeEl=header.querySelector('.zr-modal-ux-header-close');
  if(header._zrTitleSource!==titleSource){
    if(header._zrTitleSource?.isConnected)header._zrTitleSource.classList.remove('zr-modal-ux-title-source');
    header._zrTitleSource=titleSource||null;
  }
  if(header._zrCloseSource!==closeSource){
    if(header._zrCloseSource?.isConnected)header._zrCloseSource.classList.remove('zr-modal-ux-close-source');
    header._zrCloseSource=closeSource||null;
  }
  if(titleSource){
    titleSource.classList.add('zr-modal-ux-title-source');
    titleEl.textContent=textOf(titleSource);
    titleEl.hidden=false;
  }else{
    titleEl.textContent='';
    titleEl.hidden=true;
  }
  if(closeSource){
    closeSource.classList.add('zr-modal-ux-close-source');
    const icon=/^[×✕✖xX]$/.test(textOf(closeSource));
    closeEl.textContent=icon?'✕':'닫기';
    closeEl.classList.toggle('zr-modal-ux-header-close-icon',icon);
    closeEl.hidden=false;
  }else{
    closeEl.hidden=true;
  }
  header.hidden=false;
  syncHeaderGeometry(shell,header);
}
function cleanupLegacyFloating(){
  ['zrModalUxPinnedClose','zrModalUxPinnedTitle','zrCustomerModalPinnedTitle'].forEach(id=>document.getElementById(id)?.remove());
  document.body?.classList.remove('zr-customer-modal-title-pin-active');
  document.querySelectorAll('.zr-modal-ux-proxied-source,.zr-modal-ux-proxied-title,.zr-customer-modal-title-source').forEach(el=>{
    el.classList.remove('zr-modal-ux-proxied-source','zr-modal-ux-proxied-title','zr-customer-modal-title-source');
  });
}
function scanCloseButtons(){
  scanQueued=false;
  cleanupLegacyFloating();
  document.querySelectorAll('button,input[type="button"],input[type="submit"]').forEach(btn=>{
    if(isDismissCancel(btn))renameDismissCancel(btn);
  });
  document.querySelectorAll(OVERLAY_SELECTOR).forEach(syncOverlayHeader);
}
function scheduleScan(){
  if(scanQueued)return;
  scanQueued=true;
  requestAnimationFrame(scanCloseButtons);
}
function injectStyle(){
  if(document.getElementById('zrModalUxConsistencyStyleV1'))return;
  const s=document.createElement('style');
  s.id='zrModalUxConsistencyStyleV1';
  s.textContent=`
    ${OVERLAY_SELECTOR}{overscroll-behavior:contain!important}
    ${SHELL_SELECTOR}{overscroll-behavior-y:contain!important;-webkit-overflow-scrolling:touch}
    .zr-modal-ux-shell{position:relative!important}
    .zr-modal-ux-title-source,.zr-modal-ux-close-source{display:none!important}
    .zr-modal-ux-header{position:sticky!important;top:0!important;z-index:50!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;box-sizing:border-box!important;width:calc(100% + var(--zr-modal-ux-shell-pad-left,0px) + var(--zr-modal-ux-shell-pad-right,0px))!important;min-height:52px!important;margin-top:calc(-1 * var(--zr-modal-ux-shell-pad-top,0px))!important;margin-right:calc(-1 * var(--zr-modal-ux-shell-pad-right,0px))!important;margin-left:calc(-1 * var(--zr-modal-ux-shell-pad-left,0px))!important;margin-bottom:16px!important;padding:10px max(14px,var(--zr-modal-ux-shell-pad-right,0px)) 10px max(14px,var(--zr-modal-ux-shell-pad-left,0px))!important;border-bottom:1px solid #e3e8e5!important;background:#fff!important;color:#1f2d25!important;box-shadow:none!important}
    .zr-modal-ux-header[hidden]{display:none!important}
    .zr-modal-ux-header-title{min-width:0!important;flex:1 1 auto!important;margin:0!important;padding:0!important;font:inherit!important;font-size:18px!important;font-weight:800!important;line-height:1.3!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;color:inherit!important;-webkit-text-fill-color:currentColor!important}
    .zr-modal-ux-header-title[hidden]{display:none!important}
    .zr-modal-ux-header-close{flex:0 0 auto!important;min-width:56px!important;min-height:36px!important;margin:0!important;padding:6px 10px!important;border:1px solid #d5ddd7!important;border-radius:8px!important;background:#fff!important;color:#31433a!important;box-shadow:none!important;font:inherit!important;font-weight:700!important;line-height:1.2!important;white-space:nowrap!important;cursor:pointer!important;-webkit-text-fill-color:currentColor!important}
    .zr-modal-ux-header-close.zr-modal-ux-header-close-icon{width:36px!important;min-width:36px!important;padding:0!important;font-size:18px!important}
    .zr-modal-ux-header-close[hidden]{display:none!important}
  `;
  document.head.appendChild(s);
}
function boot(){
  injectStyle();cleanupLegacyFloating();scanCloseButtons();
  window.__ZR_MODAL_UX_SYNC_HEADERS=scheduleScan;
  document.addEventListener('pointerdown',blockBackdrop,true);
  document.addEventListener('click',blockBackdrop,true);
  document.addEventListener('touchstart',guardTouchStart,{capture:true,passive:true});
  document.addEventListener('touchmove',guardTouchMove,{capture:true,passive:false});
  document.addEventListener('wheel',guardWheel,{capture:true,passive:false});
  document.addEventListener('click',()=>{scheduleScan();setTimeout(scheduleScan,80)},true);
  document.addEventListener('change',()=>{scheduleScan();setTimeout(scheduleScan,80)},true);
  window.addEventListener('resize',scheduleScan);
  window.addEventListener('orientationchange',()=>setTimeout(scheduleScan,100));
  document.addEventListener('zr:admin-runtime-ready',()=>{scheduleScan();setTimeout(scheduleScan,100)});
  const timer=setInterval(scheduleScan,700);setTimeout(()=>clearInterval(timer),12000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
