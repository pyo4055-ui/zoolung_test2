(()=>{
'use strict';
if(window.__ZR_ADMIN_FINISH_LOW_RISK_V1)return;
window.__ZR_ADMIN_FINISH_LOW_RISK_V1=true;

const $=id=>document.getElementById(id);
const MAX_MOBILE=900;
let memoModal=null,memoHome=null,pendingRouteToken=0;

function mobile(){try{return matchMedia(`(max-width:${MAX_MOBILE}px)`).matches}catch{return innerWidth<=MAX_MOBILE}}
function noteIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 4h12v16H6z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>'}
function injectStyle(){
  if($('zrAdminFinishLowRiskV1Style'))return;
  const s=document.createElement('style');s.id='zrAdminFinishLowRiskV1Style';s.textContent=`
    #zrAdminMobileMemoModal{position:fixed;inset:0;z-index:2147483450;display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;background:rgba(24,22,20,.50)}
    #zrAdminMobileMemoModal.hidden{display:none!important}
    #zrAdminMobileMemoModal .zr-admin-mobile-memo-sheet{width:min(560px,100%);max-height:calc(100dvh - 24px);overflow:auto;border:1px solid #e3e8e5;border-radius:18px;background:#fff;padding:16px;box-sizing:border-box;box-shadow:0 24px 70px rgba(0,0,0,.20);-webkit-overflow-scrolling:touch}
    #zrAdminMobileMemoModal .zr-admin-mobile-memo-source-title{margin:0 0 12px;font-size:19px;color:#1f2d25}
    #zrAdminMobileMemoModal .zr-admin-mobile-memo-close{float:right;min-height:38px;border:1px solid #d5ddd7;border-radius:9px;background:#fff;color:#31433a;font-weight:800}
    #zrAdminMobileMemoHost{clear:both}
    #zrAdminMobileMemoModal .zr-admin-daily-memo{margin:0!important;border-color:#e3e8e5!important;box-shadow:none!important}
    @media(min-width:${MAX_MOBILE+1}px){#zrAdminMobileMemoModal{display:none!important}}
  `;document.head.appendChild(s);
}
function closeDrawerResidue(){
  $('zrAdminMobileDrawerV1')?.classList.remove('is-open');
  $('zrAdminMobileDrawerBackdropV1')?.classList.remove('is-open');
  document.documentElement.classList.remove('zr-admin-mobile-overlay-open');
}
function ensureMemoModal(){
  if(memoModal?.isConnected)return memoModal;
  memoModal=document.createElement('div');memoModal.id='zrAdminMobileMemoModal';memoModal.className='modal hidden';
  memoModal.innerHTML='<div class="modal-card zr-admin-mobile-memo-sheet" role="dialog" aria-modal="true" aria-labelledby="zrAdminMobileMemoTitle"><h2 class="zr-admin-mobile-memo-source-title" id="zrAdminMobileMemoTitle">공용 운영 메모</h2><button type="button" class="zr-admin-mobile-memo-close" id="zrAdminMobileMemoClose">닫기</button><div id="zrAdminMobileMemoHost"></div></div>';
  document.body.appendChild(memoModal);
  $('zrAdminMobileMemoClose')?.addEventListener('click',closeMemo);
  return memoModal;
}
function restoreMemoSection(){
  const section=$('zrAdminDailyMemoV1');
  if(section&&memoHome?.isConnected&&section.parentElement!==memoHome)memoHome.appendChild(section);
}
function openMemo(){
  if(!mobile())return;
  injectStyle();closeDrawerResidue();
  const section=$('zrAdminDailyMemoV1');
  if(!section){try{window.toast?.('공용 메모를 준비하는 중입니다. 잠시 후 다시 눌러주세요.')}catch{};return}
  const modal=ensureMemoModal(),host=$('zrAdminMobileMemoHost');
  if(!memoHome||!memoHome.isConnected)memoHome=section.parentElement;
  if(host&&section.parentElement!==host)host.appendChild(section);
  modal.classList.remove('hidden');
  $('zrAdminMobileMenuTrigger')?.classList.add('is-open');
  $('zrAdminMobileMenuTrigger')?.setAttribute('aria-expanded','true');
  try{window.__ZR_MODAL_UX_SYNC_HEADERS?.()}catch{}
}
function closeMemo(){
  memoModal?.classList.add('hidden');restoreMemoSection();
  $('zrAdminMobileMenuTrigger')?.classList.remove('is-open');
  $('zrAdminMobileMenuTrigger')?.setAttribute('aria-expanded','false');
  try{window.__ZR_MODAL_UX_SYNC_HEADERS?.()}catch{}
}
function prepareMemoTrigger(){
  const btn=$('zrAdminMobileMenuTrigger');if(!btn)return false;
  btn.setAttribute('aria-label','공용 운영 메모');btn.setAttribute('title','공용 운영 메모');
  if(btn.dataset.zrMemoVisual!=='1'){btn.dataset.zrMemoVisual='1';btn.innerHTML=noteIcon()}
  if(btn.dataset.zrMemoBound==='1')return true;
  btn.dataset.zrMemoBound='1';
  btn.addEventListener('click',e=>{
    if(!mobile())return;
    e.preventDefault();e.stopImmediatePropagation();
    memoModal&&!memoModal.classList.contains('hidden')?closeMemo():openMemo();
  },true);
  return true;
}

function norm(s){return String(s||'').replace(/\s+/g,' ').trim()}
function pendingShortcut(target){
  const pc=target?.closest?.('#zrAdminSmartPanelV1 .zr-admin-smart-pending-row[data-kind="reservation"]');
  if(pc)return pc;
  const mobileRow=target?.closest?.('#zrAdminMobileAlertsV1 .zr-admin-mobile-alert-row[data-mobile-go="activity"]');
  if(mobileRow&&/예약\s*대기/.test(norm(mobileRow.textContent)))return mobileRow;
  return null;
}
function applyPendingOnly(){
  const tab=$('tab-activity');if(!tab)return false;
  const start=$('activityStart')||$('activityStartDate'),end=$('activityEnd')||$('activityEndDate'),status=$('zrActivityStatusFilter');
  if(!status)return false;
  if(start){start.value='';start.dispatchEvent(new Event('change',{bubbles:true}))}
  if(end){end.value='';end.dispatchEvent(new Event('change',{bubbles:true}))}
  status.value='pending';status.dispatchEvent(new Event('change',{bubbles:true}));
  const search=[...tab.querySelectorAll('button')].find(b=>norm(b.textContent)==='조회하기');
  if(!search)return false;
  search.click();
  return true;
}
function schedulePendingRoute(){
  const token=++pendingRouteToken;
  [0,60,160,320,650].forEach(ms=>setTimeout(()=>{
    if(token!==pendingRouteToken)return;
    if(applyPendingOnly())pendingRouteToken=0;
  },ms));
}
function bindPendingRoute(){
  document.addEventListener('click',e=>{if(pendingShortcut(e.target))schedulePendingRoute()},true);
}
function boot(){
  injectStyle();bindPendingRoute();
  let tries=0;const t=setInterval(()=>{prepareMemoTrigger();if(++tries>200)clearInterval(t)},100);
  prepareMemoTrigger();
  window.addEventListener('resize',()=>{if(!mobile())closeMemo();setTimeout(prepareMemoTrigger,0)});
  window.addEventListener('orientationchange',()=>setTimeout(()=>{if(!mobile())closeMemo();prepareMemoTrigger()},120));
  document.addEventListener('zr:admin-runtime-ready',()=>{setTimeout(prepareMemoTrigger,0);setTimeout(prepareMemoTrigger,300)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
