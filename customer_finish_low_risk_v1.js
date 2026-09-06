(()=>{
'use strict';
if(window.__ZR_CUSTOMER_FINISH_LOW_RISK_V1)return;
window.__ZR_CUSTOMER_FINISH_LOW_RISK_V1=true;

const $=id=>document.getElementById(id);
const ROOT=document.documentElement;
const NO_RESULT_ID='zrCustomerLookupNoResultV1';
let suppressNoResultToastUntil=0,lookupToken=0,toastPatchTimer=null;

function norm(v){return String(v||'').replace(/\s+/g,' ').trim()}
function injectStyle(){
  if($('zrCustomerFinishLowRiskV1Style'))return;
  const s=document.createElement('style');s.id='zrCustomerFinishLowRiskV1Style';s.textContent=`
    #customerView .zr-final-privacy-invalid{border:1px solid #f0b4b4!important;border-radius:11px!important;background:#fff0f0!important;box-shadow:0 0 0 3px rgba(217,56,56,.08)!important;padding:10px!important}
    #customerView .zr-final-privacy-invalid label,#customerView .zr-final-privacy-invalid .help{color:#a62525!important}
    #inquiryModal .zr-final-privacy-invalid{border:1px solid #f0b4b4!important;border-radius:11px!important;background:#fff0f0!important;box-shadow:0 0 0 3px rgba(217,56,56,.08)!important;padding:10px!important}
    #${NO_RESULT_ID}{display:none;margin:0;padding:24px 18px;border:1px solid #e5ddd6;border-radius:15px;background:#fff;text-align:center;color:#403a35}
    #${NO_RESULT_ID}.is-visible{display:block}
    #${NO_RESULT_ID} .zr-lookup-empty-title{font-size:19px;font-weight:950;color:#332f2b;margin-bottom:8px}
    #${NO_RESULT_ID} .zr-lookup-empty-text{font-size:14px;font-weight:800;line-height:1.6;color:#665e57}
    @media(max-width:900px){#${NO_RESULT_ID}{padding:22px 14px}}
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

function resultRegion(){return $('zrCustomerEntryResultsV2')}
function visible(el){
  if(!el||el.classList?.contains('hidden'))return false;
  try{const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&el.getClientRects().length>0}catch{return true}
}
function realResultsVisible(){
  const list=$('existingBookingList');if(!visible(list))return false;
  return [...list.querySelectorAll('.existing-card')].some(visible);
}
function ensureNoResult(){
  const region=resultRegion();if(!region)return null;
  let box=$(NO_RESULT_ID);
  if(!box){box=document.createElement('div');box.id=NO_RESULT_ID;box.innerHTML='<div class="zr-lookup-empty-title">예약 조회</div><div class="zr-lookup-empty-text">현재 예약하신 내역이 없습니다.</div>';region.appendChild(box)}
  return box;
}
function hideNoResult(){
  $(NO_RESULT_ID)?.classList.remove('is-visible');
  if(!realResultsVisible()){
    ROOT.classList.remove('zr-customer-entry-lookup-open');
    $('startView')?.classList.remove('zr-v2-has-results');
  }
}
function showNoResult(){
  if(realResultsVisible())return false;
  const box=ensureNoResult(),region=resultRegion();if(!box||!region)return false;
  box.classList.add('is-visible');
  $('newBookingActions')?.classList.add('hidden');
  ROOT.classList.add('zr-customer-entry-lookup-open');
  $('startView')?.classList.add('zr-v2-has-results');
  try{window.__ZR_MODAL_UX_SYNC_HEADERS?.()}catch{}
  if(innerWidth<=900)setTimeout(()=>{try{region.scrollIntoView({behavior:'smooth',block:'start'})}catch{}},40);
  return true;
}
function observeLookupResult(token){
  [500,900,1400,1900,2600,3400].forEach(ms=>setTimeout(()=>{
    if(token!==lookupToken)return;
    if(realResultsVisible()){hideNoResult();lookupToken=0;return}
    if(ms>=1900)showNoResult();
  },ms));
}
function patchToast(){
  const current=window.toast;
  if(typeof current!=='function'||current.__zrCustomerFinishLowRiskV1)return false;
  const wrapped=function(message){
    const text=norm(message);
    if(Date.now()<suppressNoResultToastUntil&&/(일치하는 예약 내역이 없습니다|현재 예약하신 내역이 없습니다)/.test(text)){
      showNoResult();return;
    }
    return current.apply(this,arguments);
  };
  wrapped.__zrCustomerFinishLowRiskV1=true;wrapped.__zrBase=current;
  window.toast=wrapped;return true;
}
function bindLookup(){
  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('#zrCustomerEntryLookupV2');if(!btn)return;
    hideNoResult();
    suppressNoResultToastUntil=Date.now()+4500;
    const token=++lookupToken;observeLookupResult(token);patchToast();
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
  const observer=new MutationObserver(()=>{syncPrivacyHighlight();simplifyMinimumCopy();if(realResultsVisible())hideNoResult()});
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-invalid']});
  let tries=0;const t=setInterval(()=>{
    patchToast();syncPrivacyHighlight();simplifyMinimumCopy();
    if(realResultsVisible())hideNoResult();
    if(++tries>160){clearInterval(t);if(toastPatchTimer)clearInterval(toastPatchTimer)}
  },125);
  toastPatchTimer=setInterval(patchToast,600);
}
function boot(){injectStyle();patchToast();bindLookup();bindPrivacyAttempts();watchUi();syncPrivacyHighlight();simplifyMinimumCopy()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
