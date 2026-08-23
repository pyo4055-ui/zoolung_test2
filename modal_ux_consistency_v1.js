(()=>{
'use strict';
if(window.__ZR_MODAL_UX_CONSISTENCY_V1)return;
window.__ZR_MODAL_UX_CONSISTENCY_V1=true;

const OVERLAY_SELECTOR='.modal,.zr-customer-info-modal,.zrgm32,.zrfinal31,.zr-guide-modal,.zr14-modal,#zrCustomerReturnHomeModal';
const SHELL_SELECTOR='.modal-card,.zr-customer-info-sheet,.zrgm32-sheet,.zrfinal31-sheet,.zr-guide-sheet,.zr14-modal-card,.zr-return-sheet';
let scanQueued=false;

function visibleOverlay(el){
  if(!(el instanceof Element)||!el.matches(OVERLAY_SELECTOR))return false;
  if(el.classList.contains('hidden'))return false;
  try{return getComputedStyle(el).display!=='none'}catch{return true}
}
function blockBackdrop(e){
  if(!visibleOverlay(e.target))return;
  e.preventDefault();
  e.stopImmediatePropagation();
}
function textOf(el){return String(el?.textContent||el?.value||'').replace(/\s+/g,' ').trim()}
function isCloseControl(el){
  if(!el?.matches?.('button,input[type="button"],input[type="submit"]'))return false;
  const text=textOf(el);
  if(text==='닫기'||/^[×✕✖xX]$/.test(text))return true;
  const meta=`${el.id||''} ${typeof el.className==='string'?el.className:''} ${el.getAttribute('aria-label')||''} ${el.getAttribute('title')||''}`;
  return /(close|닫기)/i.test(meta)&&!/(cancel|취소|back|뒤로|다시)/i.test(meta);
}
function shellFor(btn){
  const direct=btn.closest(SHELL_SELECTOR);if(direct)return direct;
  const overlay=btn.closest(OVERLAY_SELECTOR);if(!overlay)return null;
  return overlay.querySelector(':scope > .modal-card,:scope > [role="dialog"],:scope > .card')||overlay.firstElementChild||null;
}
function decorateClose(btn){
  if(btn.dataset.zrModalUxClose==='1')return;
  const shell=shellFor(btn);if(!shell)return;
  btn.dataset.zrModalUxClose='1';
  btn.classList.add('zr-modal-ux-close');
  if(/^[×✕✖xX]$/.test(textOf(btn)))btn.classList.add('zr-modal-ux-close-icon');
  shell.classList.add('zr-modal-ux-shell');
  const title=shell.querySelector('h1,h2,h3');if(title)title.classList.add('zr-modal-ux-title');
}
function scanCloseButtons(){
  scanQueued=false;
  document.querySelectorAll('button,input[type="button"],input[type="submit"]').forEach(btn=>{
    if(isCloseControl(btn))decorateClose(btn);
  });
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
    .zr-modal-ux-shell{position:relative!important}
    .zr-modal-ux-shell .zr-modal-ux-title{padding-right:82px!important}
    .zr-modal-ux-close{position:absolute!important;top:14px!important;right:14px!important;bottom:auto!important;left:auto!important;z-index:60!important;margin:0!important;transform:none!important;float:none!important;min-width:64px!important;min-height:36px!important;padding:7px 11px!important;border-radius:9px!important;line-height:1.2!important;white-space:nowrap!important}
    .zr-modal-ux-close.zr-modal-ux-close-icon{width:38px!important;min-width:38px!important;padding:0!important}
  `;
  document.head.appendChild(s);
}
function boot(){
  injectStyle();scanCloseButtons();
  document.addEventListener('pointerdown',blockBackdrop,true);
  document.addEventListener('click',blockBackdrop,true);
  document.addEventListener('click',()=>{scheduleScan();setTimeout(scheduleScan,80)},true);
  document.addEventListener('zr:admin-runtime-ready',()=>{scheduleScan();setTimeout(scheduleScan,100)});
  const timer=setInterval(scheduleScan,700);setTimeout(()=>clearInterval(timer),12000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
