(()=>{
'use strict';
if(window.__ZR_CUSTOMER_FINISH_LOW_RISK_V1)return;
window.__ZR_CUSTOMER_FINISH_LOW_RISK_V1=true;

const $=id=>document.getElementById(id);
const NO_RESULT_MODAL_ID='zrCustomerLookupNoResultModalV1';
let suppressNoResultToastUntil=0,lookupToken=0,noResultDismissedUntil=0;

function norm(v){return String(v||'').replace(/\s+/g,' ').trim()}
function injectStyle(){
  if($('zrCustomerFinishLowRiskV1Style'))return;
  const s=document.createElement('style');s.id='zrCustomerFinishLowRiskV1Style';s.textContent=`
    #customerView .zr-final-privacy-invalid{border:1px solid #f0b4b4!important;border-radius:11px!important;background:#fff0f0!important;box-shadow:0 0 0 3px rgba(217,56,56,.08)!important;padding:10px!important}
    #customerView .zr-final-privacy-invalid label,#customerView .zr-final-privacy-invalid .help{color:#a62525!important}
    #inquiryModal .zr-final-privacy-invalid{border:1px solid #f0b4b4!important;border-radius:11px!important;background:#fff0f0!important;box-shadow:0 0 0 3px rgba(217,56,56,.08)!important;padding:10px!important}
    #${NO_RESULT_MODAL_ID}{position:fixed;inset:0;z-index:2147483400;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;background:rgba(36,22,16,.66)}
    #${NO_RESULT_MODAL_ID}.hidden{display:none!important}
    #${NO_RESULT_MODAL_ID} .zr-lookup-empty-sheet{width:min(460px,100%);border:1px solid #eaded5;border-radius:20px;background:#fff;box-shadow:0 26px 80px rgba(35,18,10,.30);overflow:hidden}
    #${NO_RESULT_MODAL_ID} .zr-lookup-empty-head{padding:18px 20px 12px;text-align:center}
    #${NO_RESULT_MODAL_ID} .zr-lookup-empty-title{margin:0;color:#470910;font-size:21px;font-weight:950;letter-spacing:-.03em}
    #${NO_RESULT_MODAL_ID} .zr-lookup-empty-text{margin:5px 0 0;padding:0 20px 20px;text-align:center;color:#554841;font-size:15px;font-weight:800;line-height:1.65;word-break:keep-all}
    #${NO_RESULT_MODAL_ID} .zr-lookup-empty-actions{display:grid;grid-template-columns:1fr 1.35fr;gap:9px;padding:0 20px 20px}
    #${NO_RESULT_MODAL_ID} .zr-lookup-empty-actions button{min-height:48px;border-radius:11px;font-size:14px;font-weight:900;cursor:pointer}
    #zrCustomerLookupNoResultCloseV1{border:1px solid #f1bcbc;background:#ffe7e7;color:#913535}
    #zrCustomerLookupNoResultApplyV1{grid-column:1/-1;justify-self:center;width:170px;max-width:100%;border:1px solid #fc5404;background:#fc5404;color:#fff;box-shadow:0 8px 16px rgba(252,84,4,.18)}
    #zrCustomerLookupNoResultApplyV1:hover{border-color:#e24600;background:#e24600}
    body #${NO_RESULT_MODAL_ID} .zr-lookup-empty-sheet .zr-lookup-empty-actions{display:flex!important;justify-content:center!important;align-items:center!important;gap:0!important}
    body #${NO_RESULT_MODAL_ID} .zr-lookup-empty-sheet #zrCustomerLookupNoResultApplyV1{display:block!important;flex:0 0 170px!important;width:170px!important;max-width:100%!important;margin:0 auto!important;justify-self:auto!important}
    html.zr-customer-entry-booking-transition #zrCustomerEntryResultsV2,
    html.zr-customer-entry-booking-transition #existingActions,
    html.zr-customer-entry-booking-transition #existingBookingList{display:none!important;visibility:hidden!important;pointer-events:none!important}
    @media(max-width:900px){#${NO_RESULT_MODAL_ID}{padding:14px}#${NO_RESULT_MODAL_ID} .zr-lookup-empty-sheet{border-radius:18px}}
  `;document.head.appendChild(s);
}

function privacyHolder(el){
  if(!el)return null;
  return el.closest('.calc,.card,.box,.field,.form-group,.zr-inquiry-section')||el.closest('label')?.parentElement||el.parentElement;
}
function privacyInvalid(el){
  if(!el)return false;
  const attempted=el.dataset.zrPrivacyAttempted==='1';
  const validatorMarked=el.classList.contains('zr-customer-invalid-v1')||el.getAttribute('aria-invalid')==='true';
  return !el.checked&&(attempted||validatorMarked);
}
function syncPrivacyHighlight(){
  for(const id of ['privacy','inqPrivacy']){
    const el=$(id),holder=privacyHolder(el);if(!el||!holder)continue;
    holder.classList.toggle('zr-final-privacy-invalid',privacyInvalid(el));
  }
}
function markPrivacyAttempt(id){
  const el=$(id);if(!el)return;
  el.dataset.zrPrivacyAttempted='1';
  if(!el.checked)el.setAttribute('aria-invalid','true');
  syncPrivacyHighlight();
}
function bindPrivacyAttempts(){
  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('button,input[type="submit"],input[type="button"]');if(!btn)return;
    const text=norm(btn.textContent||btn.value).replace(/\s+/g,'');
    if(btn.id==='submitBooking'||text==='예약신청하기')markPrivacyAttempt('privacy');
    if(btn.closest?.('#inquiryModal')&&/문의|보내기|접수/.test(text))markPrivacyAttempt('inqPrivacy');
  },true);
  document.addEventListener('change',e=>{
    if(!['privacy','inqPrivacy'].includes(e.target?.id))return;
    if(e.target.checked)e.target.removeAttribute('aria-invalid');
    syncPrivacyHighlight();
  },true);
}

function visible(el){
  if(!el||el.classList?.contains('hidden'))return false;
  try{const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&el.getClientRects().length>0}catch{return true}
}
function realResultsVisible(){
  const list=$('existingBookingList');if(!visible(list))return false;
  return [...list.querySelectorAll('.existing-card')].some(visible);
}
function forceNoResultActionCenter(){
  const modal=$(NO_RESULT_MODAL_ID);if(!modal)return;
  const actions=modal.querySelector('.zr-lookup-empty-actions'),btn=$('zrCustomerLookupNoResultApplyV1');
  if(actions){
    actions.style.setProperty('display','flex','important');
    actions.style.setProperty('justify-content','center','important');
    actions.style.setProperty('align-items','center','important');
    actions.style.setProperty('gap','0','important');
  }
  if(btn){
    btn.style.setProperty('display','block','important');
    btn.style.setProperty('width','170px','important');
    btn.style.setProperty('max-width','100%','important');
    btn.style.setProperty('margin','0 auto','important');
  }
}
function hideNoResultPopup(){
  const modal=$(NO_RESULT_MODAL_ID);if(!modal)return;
  modal.classList.add('hidden');modal.setAttribute('aria-hidden','true');
  try{window.__ZR_MODAL_UX_SYNC_HEADERS?.()}catch{}
}
function dismissNoResultPopup(){
  lookupToken=0;
  noResultDismissedUntil=Date.now()+6000;
  hideNoResultPopup();
}
function clearLookupSurface(){
  document.documentElement.classList.remove('zr-customer-entry-lookup-open');
  $('startView')?.classList.remove('zr-v2-has-results');
  try{$('zrCustomerEntryResultsV2')?.scrollTo?.(0,0)}catch{}
}
function beginBookingTransition(){
  lookupToken=0;
  noResultDismissedUntil=Date.now()+6000;
  suppressNoResultToastUntil=Date.now()+6000;
  document.documentElement.classList.add('zr-customer-entry-booking-transition');
  clearLookupSurface();
  hideNoResultPopup();
}
function startReservationFromPopup(){
  const btn=$('zrCustomerEntryApplyV2');
  beginBookingTransition();
  if(btn){btn.click();return}
  try{window.toast?.('예약 접수 화면을 준비하지 못했습니다. 새로고침 후 다시 시도해주세요.')}catch{}
}
function ensureNoResultPopup(){
  let modal=$(NO_RESULT_MODAL_ID);if(modal){forceNoResultActionCenter();return modal}
  modal=document.createElement('div');modal.id=NO_RESULT_MODAL_ID;modal.className='modal hidden';modal.setAttribute('aria-hidden','true');
  modal.innerHTML='<div class="modal-card zr-lookup-empty-sheet" role="dialog" aria-modal="true" aria-labelledby="zrCustomerLookupNoResultTitleV1"><div class="zr-lookup-empty-head"><h2 class="zr-lookup-empty-title" id="zrCustomerLookupNoResultTitleV1">예약 조회</h2></div><p class="zr-lookup-empty-text">현재 예약하신 내역이 없습니다.</p><div class="zr-lookup-empty-actions"><button type="button" id="zrCustomerLookupNoResultCloseV1">닫기</button><button type="button" id="zrCustomerLookupNoResultApplyV1">예약 접수</button></div></div>';
  document.body.appendChild(modal);
  $('zrCustomerLookupNoResultCloseV1')?.addEventListener('click',dismissNoResultPopup);
  $('zrCustomerLookupNoResultApplyV1')?.addEventListener('click',startReservationFromPopup);
  forceNoResultActionCenter();
  return modal;
}
function showNoResultPopup(){
  if(Date.now()<noResultDismissedUntil||realResultsVisible())return false;
  const modal=ensureNoResultPopup();
  modal.classList.remove('hidden');modal.setAttribute('aria-hidden','false');
  try{window.__ZR_MODAL_UX_SYNC_HEADERS?.()}catch{}
  forceNoResultActionCenter();
  requestAnimationFrame(forceNoResultActionCenter);
  return true;
}
function observeLookupResult(token){
  [500,950,1500,2300,3200].forEach(ms=>setTimeout(()=>{
    if(token!==lookupToken)return;
    if(realResultsVisible()){hideNoResultPopup();lookupToken=0;return}
    if(ms>=2300)showNoResultPopup();
  },ms));
}
function patchToast(){
  const current=window.toast;
  if(typeof current!=='function'||current.__zrCustomerFinishLowRiskV1)return false;
  const wrapped=function(message){
    const text=norm(message);
    if(Date.now()<suppressNoResultToastUntil&&/(일치하는 예약 내역이 없습니다|현재 예약하신 내역이 없습니다)/.test(text)){
      if(Date.now()<noResultDismissedUntil)return;
      showNoResultPopup();return;
    }
    return current.apply(this,arguments);
  };
  wrapped.__zrCustomerFinishLowRiskV1=true;wrapped.__zrBase=current;
  window.toast=wrapped;return true;
}
function bindLookup(){
  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('#zrCustomerEntryLookupV2');if(!btn)return;
    document.documentElement.classList.remove('zr-customer-entry-booking-transition');
    hideNoResultPopup();
    noResultDismissedUntil=0;
    suppressNoResultToastUntil=Date.now()+5500;
    const token=++lookupToken;patchToast();observeLookupResult(token);
  },true);
}
function bindBookingTransition(){
  document.addEventListener('click',e=>{
    if(!e.target?.closest?.('#zrCustomerEntryApplyV2'))return;
    beginBookingTransition();
  },true);
}

function simplifyMinimumCopy(){
  const root=$('customerView');if(!root)return;
  const notice=[...root.querySelectorAll(':scope > .notice,.notice')].find(el=>/단체\s*예약/.test(norm(el.textContent))&&/15명/.test(norm(el.textContent)));
  const noticeHtml='※ 단체 예약은 <b>유료인원 합계 15명 이상</b>부터 가능합니다. 결제는 현장에서 진행됩니다.';
  if(notice&&notice.innerHTML!==noticeHtml)notice.innerHTML=noticeHtml;
  const help=$('zrGroupMinimumRuleV1');
  const helpHtml='<b>유료인원 합계 15명 이상부터 예약 가능합니다.</b><br>15명 충족 후 유료인원 5명당 인솔자 1명이 무료입니다.';
  if(help&&help.innerHTML!==helpHtml)help.innerHTML=helpHtml;
  const calc=$('peopleCalc');
  calc?.querySelectorAll('.help').forEach(el=>{
    if(/인솔자\s*\d+명은 최소 유료인원 15명 충족을 위해 유료로 적용됩니다/.test(norm(el.textContent))){
      el.textContent='유료 관람인원이 15명 미만이라 인솔자 일부가 유료인원에 포함됩니다.';
    }
  });
}
function watchUi(){
  const observer=new MutationObserver(()=>{
    syncPrivacyHighlight();simplifyMinimumCopy();
    if(realResultsVisible()){hideNoResultPopup();lookupToken=0}
  });
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-invalid']});
  let tries=0;const t=setInterval(()=>{
    patchToast();syncPrivacyHighlight();simplifyMinimumCopy();
    if(realResultsVisible()){hideNoResultPopup();lookupToken=0}
    if(++tries>160)clearInterval(t);
  },125);
}
function boot(){injectStyle();patchToast();bindLookup();bindBookingTransition();bindPrivacyAttempts();watchUi();syncPrivacyHighlight();simplifyMinimumCopy()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
