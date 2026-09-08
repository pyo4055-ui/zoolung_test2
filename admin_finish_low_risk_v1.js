(()=>{
'use strict';
if(window.__ZR_ADMIN_FINISH_LOW_RISK_V1)return;
window.__ZR_ADMIN_FINISH_LOW_RISK_V1=true;

const $=id=>document.getElementById(id);
const MAX_MOBILE=900;
let memoModal=null,memoHome=null,shortcutRouteToken=0,previewShortcutUntil=0,cancelMenuRouteToken=0;

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
    @media(max-width:${MAX_MOBILE}px){
      #adminView #zrActivityCancelWorkspaceV1 .zr-cancel-start,
      #adminView #zrActivityCancelWorkspaceV1 .zr-cancel-end{min-width:0!important;max-width:100%!important;overflow:hidden!important;box-sizing:border-box!important}
      #adminView #zrActivityCancelWorkspaceV1 .zr-cancel-toolbar input[type="date"]{
        display:block!important;width:calc(100% - 12px)!important;inline-size:calc(100% - 12px)!important;
        max-width:calc(100% - 12px)!important;max-inline-size:calc(100% - 12px)!important;
        min-width:0!important;min-inline-size:0!important;margin-left:auto!important;margin-right:auto!important;
        justify-self:center!important;box-sizing:border-box!important
      }
      #adminView #zrActivityCancelWorkspaceV1 .zr-cancel-toolbar input[type="date"]::-webkit-date-and-time-value{
        width:100%!important;min-width:0!important;margin:0!important;text-align:center!important
      }
      #adminView #zrCancelReviewTodayV1{
        min-height:44px!important;border:1px solid #195b37!important;background:#195b37!important;color:#fff!important;
        font-size:13px!important;font-weight:900!important;border-radius:11px!important;box-shadow:none!important
      }
    }
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
function seoulDate(){
  try{
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const get=t=>parts.find(x=>x.type===t)?.value||'';
    const y=get('year'),m=get('month'),d=get('day');
    if(y&&m&&d)return `${y}-${m}-${d}`;
  }catch{}
  const now=new Date(),pad=n=>String(n).padStart(2,'0');
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
}
function pendingShortcutKind(target){
  if(target?.closest?.('#zrAdminSmartPanelV1 .zr-admin-smart-pending-row[data-kind="reservation"]'))return 'reservation';
  if(target?.closest?.('#zrAdminSmartPanelV1 .zr-admin-smart-pending-row[data-kind="inquiry"]'))return 'inquiry';
  if(target?.closest?.('#zrAdminSmartPanelV1 .zr-admin-smart-pending-row[data-kind="preview"]'))return 'preview';
  const mobileRow=target?.closest?.('#zrAdminMobileAlertsV1 .zr-admin-mobile-alert-row');
  if(!mobileRow)return '';
  const go=String(mobileRow.dataset.mobileGo||'');
  if(go==='activity'&&/예약\s*대기/.test(norm(mobileRow.textContent)))return 'reservation';
  if(go==='inquiries')return 'inquiry';
  if(go==='previewVisit')return 'preview';
  return '';
}
function clearDateControl(el){
  if(!el)return;
  el.value='';el.dispatchEvent(new Event('change',{bubbles:true}));
}
function applyPendingOnly(){
  const tab=$('tab-activity');if(!tab)return false;
  const start=$('activityStart')||$('activityStartDate'),end=$('activityEnd')||$('activityEndDate'),status=$('zrActivityStatusFilter');
  if(!status)return false;
  clearDateControl(start);clearDateControl(end);
  status.value='pending';status.dispatchEvent(new Event('change',{bubbles:true}));
  const search=[...tab.querySelectorAll('button')].find(b=>norm(b.textContent)==='조회하기');
  if(!search)return false;
  search.click();return true;
}
function applyInquiryPendingOnly(){
  const start=$('zrInquiryStart'),end=$('zrInquiryEnd'),status=$('zrInquiryStatus'),search=$('zrInquiryApply');
  if(!start||!end||!status||!search)return false;
  clearDateControl(start);clearDateControl(end);
  status.value='pending';status.dispatchEvent(new Event('change',{bubbles:true}));
  search.click();return true;
}
function applyPreviewPendingOnly(){
  const start=$('zrPreviewStartDateFilter'),end=$('zrPreviewEndDateFilter'),status=$('zrPreviewStatusFilter'),search=$('zrPreviewApplyFilter');
  if(!start||!end||!status||!search)return false;
  clearDateControl(start);clearDateControl(end);
  status.value='received';status.dispatchEvent(new Event('change',{bubbles:true}));
  search.click();return true;
}
function restorePreviewDefaultAfterShortcut(){
  if(Date.now()<=previewShortcutUntil)return;
  const start=$('zrPreviewStartDateFilter'),end=$('zrPreviewEndDateFilter'),status=$('zrPreviewStatusFilter');
  if(!start||!end||!status||start.value||end.value)return;
  const today=seoulDate();
  start.value=`${today.slice(0,8)}01`;start.dispatchEvent(new Event('change',{bubbles:true}));
  end.value=today;end.dispatchEvent(new Event('change',{bubbles:true}));
  if(status.value==='received'){
    status.value='all';status.dispatchEvent(new Event('change',{bubbles:true}));
  }
}
function isCancelMenuClick(target){
  if(target?.closest?.('#zrAdminShellRail [data-zr-admin-subitem="activity-cancel"]'))return true;
  const mobileChild=target?.closest?.('#zrAdminMobileSubnavV3 [data-zrm-child-btn]');
  return !!mobileChild&&norm(mobileChild.textContent)==='예약취소';
}
function applyCancelDefaultPeriod(){
  const workspace=$('zrActivityCancelWorkspaceV1'),start=$('zrCancelReviewStartV1'),end=$('zrCancelReviewEndV1'),basis=$('zrCancelReviewBasisV1'),todayBtn=$('zrCancelReviewTodayV1'),search=$('zrCancelReviewSearchV1');
  if(!workspace||workspace.classList.contains('hidden')||!start||!end||!search)return false;
  const today=seoulDate(),first=`${today.slice(0,8)}01`;
  if(start.value!==first){start.value=first;start.dispatchEvent(new Event('change',{bubbles:true}))}
  if(end.value!==today){end.value=today;end.dispatchEvent(new Event('change',{bubbles:true}))}
  if(basis&&basis.value!=='cancel'){basis.value='cancel';basis.dispatchEvent(new Event('change',{bubbles:true}))}
  if(todayBtn&&todayBtn.textContent!=='오늘')todayBtn.textContent='오늘';
  search.click();
  return true;
}
function scheduleCancelDefaultPeriod(){
  const token=++cancelMenuRouteToken;
  [90,180,320,520,800].forEach(ms=>setTimeout(()=>{
    if(token!==cancelMenuRouteToken)return;
    if(applyCancelDefaultPeriod())cancelMenuRouteToken=0;
  },ms));
}
function applyShortcut(kind){
  if(kind==='reservation')return applyPendingOnly();
  if(kind==='inquiry')return applyInquiryPendingOnly();
  if(kind==='preview')return applyPreviewPendingOnly();
  return false;
}
function schedulePendingRoute(kind){
  const token=++shortcutRouteToken;
  [0,60,160,320,650,1000].forEach(ms=>setTimeout(()=>{
    if(token!==shortcutRouteToken)return;
    if(applyShortcut(kind))shortcutRouteToken=0;
  },ms));
}
function bindPendingRoute(){
  document.addEventListener('click',e=>{
    const kind=pendingShortcutKind(e.target);
    if(kind){
      if(kind==='preview')previewShortcutUntil=Date.now()+1800;
      schedulePendingRoute(kind);return;
    }
    if(isCancelMenuClick(e.target)){scheduleCancelDefaultPeriod();return}
    if(e.target?.closest?.('#zrPreviewVisitTabBtn'))restorePreviewDefaultAfterShortcut();
  },true);
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