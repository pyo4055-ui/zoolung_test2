(()=>{
'use strict';
if(window.__ZR_CANCEL_REVIEW_STATE_V1)return;
window.__ZR_CANCEL_REVIEW_STATE_V1=true;

const KEY='zr_bookings';
const $=id=>document.getElementById(id);
let customerCancelTarget='';
let activityObserver=null,detailObserver=null,smartObserver=null,retryTimer=0;

function readBookings(){
  try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}
  catch{return[]}
}
function writeBookings(list){
  if(typeof window.setStore==='function')window.setStore(KEY,list);
  else localStorage.setItem(KEY,JSON.stringify(list));
}
function staffName(){
  try{return String(window.zrReservationFirebase?.auth?.currentUser?.email||'admin')}
  catch{return'admin'}
}
function bookingById(id){return readBookings().find(b=>String(b?.id||'')===String(id))||null}
function pendingCount(){return readBookings().filter(b=>String(b?.status||'')==='cancelled'&&b?.cancelReviewed===false).length}
function markCancelledUnreviewed(id){
  if(!id)return false;
  const list=readBookings(),b=list.find(x=>String(x?.id||'')===String(id));
  if(!b||String(b.status||'')!=='cancelled')return false;
  if(b.cancelReviewed===false)return true;
  b.cancelReviewed=false;
  delete b.cancelReviewedAt;delete b.cancelReviewedBy;
  writeBookings(list);
  changed(id,false);
  return true;
}
function markReviewed(id){
  const list=readBookings(),b=list.find(x=>String(x?.id||'')===String(id));
  if(!b||String(b.status||'')!=='cancelled')return false;
  b.cancelReviewed=true;
  b.cancelReviewedAt=new Date().toISOString();
  b.cancelReviewedBy=staffName();
  writeBookings(list);
  changed(id,true);
  try{window.toast?.('예약 취소 확인을 완료했습니다.')}catch{}
  return true;
}
function changed(id,reviewed){
  try{document.dispatchEvent(new CustomEvent('zr:cancel-review-updated',{detail:{id:String(id||''),reviewed:!!reviewed}}))}catch{}
  setTimeout(syncAll,0);setTimeout(syncAll,120);
}

function installCustomerHook(){
  const base=window.openCustomerCancel;
  if(typeof base!=='function'||base.__zrCancelReviewV1)return false;
  const wrapped=function(id){customerCancelTarget=String(id||'');return base.apply(this,arguments)};
  wrapped.__zrCancelReviewV1=true;wrapped.__zrBase=base;
  window.openCustomerCancel=wrapped;
  try{openCustomerCancel=wrapped}catch{}
  return true;
}
function installAdminCancelHook(){
  const base=window.setBookingStatus;
  if(typeof base!=='function'||base.__zrCancelReviewV1)return false;
  const wrapped=function(id,status){
    const out=base.apply(this,arguments);
    if(String(status||'')==='cancelled'){
      const bid=String(id||'');
      [30,120,320].forEach(ms=>setTimeout(()=>markCancelledUnreviewed(bid),ms));
    }
    return out;
  };
  wrapped.__zrCancelReviewV1=true;wrapped.__zrBase=base;
  window.setBookingStatus=wrapped;
  try{setBookingStatus=wrapped}catch{}
  return true;
}

function cardBookingId(card){
  const btn=card?.querySelector?.('button[onclick*="openAdminBookingDetail"]');
  const m=String(btn?.getAttribute('onclick')||'').match(/openAdminBookingDetail\(['"]([^'"]+)['"]\)/);
  return m?.[1]||'';
}
function reviewLabel(b){
  if(b?.cancelReviewed===false)return '<span class="zr-cancel-review-state need">취소 확인 필요</span>';
  if(b?.cancelReviewed===true)return '<span class="zr-cancel-review-state done">확인완료</span>';
  return '';
}
function reviewActionHtml(b,id){
  if(String(b?.status||'')!=='cancelled'||b?.cancelReviewed===undefined)return '';
  const label=reviewLabel(b);
  if(b.cancelReviewed===false)return `<div class="zr-cancel-review-box">${label}<button type="button" class="btn-primary zr-cancel-review-btn" data-zr-cancel-review="${String(id).replace(/[&<>"']/g,'')}">확인완료</button></div>`;
  const when=String(b.cancelReviewedAt||'').trim();
  return `<div class="zr-cancel-review-box reviewed">${label}${when?`<small>${when.slice(0,16).replace('T',' ')}</small>`:''}</div>`;
}
function decorateActivity(){
  const root=$('activityList');if(!root)return;
  root.querySelectorAll('.booking-item').forEach(card=>{
    const id=cardBookingId(card),b=bookingById(id);let box=card.querySelector('.zr-cancel-review-box');
    if(!b||String(b.status||'')!=='cancelled'||b.cancelReviewed===undefined){box?.remove();return}
    const holder=document.createElement('div');holder.innerHTML=reviewActionHtml(b,id);const next=holder.firstElementChild;
    if(!next){box?.remove();return}
    if(box)box.replaceWith(next);else card.appendChild(next);
  });
}
let detailId='';
function decorateDetail(){
  const body=$('adminBookingDetailContent');if(!body||!detailId)return;
  const b=bookingById(detailId);let box=body.querySelector('.zr-cancel-review-box');
  if(!b||String(b.status||'')!=='cancelled'||b.cancelReviewed===undefined){box?.remove();return}
  const holder=document.createElement('div');holder.innerHTML=reviewActionHtml(b,detailId);const next=holder.firstElementChild;
  if(!next){box?.remove();return}
  if(box)box.replaceWith(next);else body.appendChild(next);
}

function ensureSmartRow(){
  const list=document.querySelector('#zrAdminSmartPanelV1 .zr-admin-smart-pending');if(!list)return false;
  if(list.querySelector('[data-zr-cancel-review-open]'))return true;
  const row=document.createElement('button');row.type='button';row.className='zr-admin-smart-pending-row';row.dataset.kind='cancel';row.dataset.zrCancelReviewOpen='1';
  row.innerHTML='<span>예약 취소</span><strong id="zrSmartCancelReview">0</strong>';
  const reservation=list.querySelector('[data-kind="reservation"]');
  if(reservation?.nextSibling)list.insertBefore(row,reservation.nextSibling);else list.appendChild(row);
  return true;
}
function ensureMobileRow(){
  const list=document.querySelector('#zrAdminMobileAlertsV1 .zr-admin-mobile-alert-list');if(!list)return false;
  if(list.querySelector('[data-zr-cancel-review-open]'))return true;
  const row=document.createElement('button');row.type='button';row.className='zr-admin-mobile-alert-row';row.dataset.zrCancelReviewOpen='1';
  row.innerHTML='<span class="zr-admin-mobile-alert-dot"></span><span>예약 취소</span><strong data-mobile-count="zrSmartCancelReview">0</strong>';
  const reservation=list.querySelector('[data-mobile-go="activity"]');
  if(reservation?.nextSibling)list.insertBefore(row,reservation.nextSibling);else list.prepend(row);
  return true;
}
function setCount(el,n){if(el&&el.textContent!==String(n))el.textContent=String(n)}
function syncBellBadge(){
  const badge=$('zrAdminMobileBellBadge');if(!badge)return;
  let total=0;document.querySelectorAll('#zrAdminMobileAlertsV1 [data-mobile-count]').forEach(el=>{const n=parseInt(String(el.textContent||'0').replace(/[^0-9-]/g,''),10);if(Number.isFinite(n)&&n>0)total+=n});
  const text=total>99?'99+':String(total);if(badge.textContent!==text)badge.textContent=text;badge.hidden=total===0;
}
function syncNotifications(){
  ensureSmartRow();ensureMobileRow();const n=pendingCount();
  setCount($('zrSmartCancelReview'),n);
  setCount(document.querySelector('#zrAdminMobileAlertsV1 [data-mobile-count="zrSmartCancelReview"]'),n);
  syncBellBadge();
}

function closeMobileAlerts(){
  $('zrAdminMobileAlertsV1')?.classList.remove('is-open');$('zrAdminMobileBell')?.classList.remove('is-open');$('zrAdminMobileBell')?.setAttribute('aria-expanded','false');
}
function applyCancelledFilter(attempt=0){
  const status=$('zrActivityStatusFilter'),tab=$('tab-activity');
  const search=tab?[...tab.querySelectorAll('button')].find(b=>(b.textContent||'').trim()==='조회하기'):null;
  if(status&&search){
    const start=$('activityStart')||$('activityStartDate'),end=$('activityEnd')||$('activityEndDate');
    if(start)start.value='';if(end)end.value='';status.value='cancelled';search.click();return true;
  }
  if(attempt<20)setTimeout(()=>applyCancelledFilter(attempt+1),60);
  return false;
}
function openCancelReview(){
  closeMobileAlerts();
  const rail=document.querySelector('#zrAdminShellRail [data-zr-admin-item="activity"]');
  if(rail)rail.click();else document.querySelector('[data-tab="activity"]')?.click?.();
  setTimeout(()=>applyCancelledFilter(0),30);
}
window.zrOpenCancelReviewV1=openCancelReview;

function installStyle(){
  if($('zrCancelReviewStateV1Style'))return;
  const s=document.createElement('style');s.id='zrCancelReviewStateV1Style';s.textContent=`
  .zr-cancel-review-box{margin-top:10px;padding:9px 10px;border:1px solid #efc5c5;border-radius:10px;background:#fff7f7;display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}.zr-cancel-review-box.reviewed{border-color:#d8e2dc;background:#f8faf9}.zr-cancel-review-state{margin-right:auto;font-size:12px;font-weight:900}.zr-cancel-review-state.need{color:#a33f3f}.zr-cancel-review-state.done{color:#4e6859}.zr-cancel-review-box small{font-size:10px;color:#788179}.zr-cancel-review-btn{min-height:38px!important;padding:7px 13px!important}
  #zrAdminSmartPanelV1 [data-kind="cancel"]{--zr-row-color:#b94c4c}.zr-admin-mobile-alert-row[data-zr-cancel-review-open] .zr-admin-mobile-alert-dot{background:#b94c4c!important}
  @media(max-width:900px){.zr-cancel-review-box{align-items:stretch;flex-direction:column}.zr-cancel-review-state{margin-right:0}.zr-cancel-review-btn{width:100%!important;min-height:46px!important;font-size:14px!important}}
  `;document.head.appendChild(s);
}
function attachObservers(){
  const activity=$('activityList');
  if(activity&&!activityObserver){activityObserver=new MutationObserver(()=>{decorateActivity();syncNotifications()});activityObserver.observe(activity,{childList:true,subtree:true})}
  const detail=$('adminBookingDetailContent');
  if(detail&&!detailObserver){detailObserver=new MutationObserver(decorateDetail);detailObserver.observe(detail,{childList:true,subtree:true})}
  const updated=$('zrSmartUpdated');
  if(updated&&!smartObserver){smartObserver=new MutationObserver(syncNotifications);smartObserver.observe(updated,{childList:true,characterData:true,subtree:true})}
}
function syncAll(){installStyle();installCustomerHook();installAdminCancelHook();attachObservers();syncNotifications();decorateActivity();decorateDetail()}
function bootRetries(){
  if(retryTimer)return;let tries=0;retryTimer=setInterval(()=>{tries++;syncAll();if(tries>=40){clearInterval(retryTimer);retryTimer=0}},250)
}

document.addEventListener('click',e=>{
  const review=e.target?.closest?.('[data-zr-cancel-review]');
  if(review){e.preventDefault();e.stopPropagation();markReviewed(review.dataset.zrCancelReview||'');return}
  if(e.target?.closest?.('[data-zr-cancel-review-open]')){e.preventDefault();e.stopImmediatePropagation();openCancelReview();return}
  const detail=e.target?.closest?.('button[onclick*="openAdminBookingDetail"]');
  if(detail){const m=String(detail.getAttribute('onclick')||'').match(/openAdminBookingDetail\(['"]([^'"]+)['"]\)/);detailId=m?.[1]||'';setTimeout(decorateDetail,50)}
  if(e.target?.closest?.('#confirmCustomerCancel')){
    const id=customerCancelTarget;[40,140,360].forEach(ms=>setTimeout(()=>markCancelledUnreviewed(id),ms));
  }
},true);
document.addEventListener('zr:admin-runtime-ready',()=>{syncAll();bootRetries()});
document.addEventListener('zr:customer-runtime-ready',()=>{syncAll();bootRetries()});
document.addEventListener('zr:admin-firebase-staff-ready',syncAll);
document.addEventListener('zr:cancel-review-updated',syncNotifications);
window.addEventListener('storage',e=>{if(e.key===KEY)syncAll()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{syncAll();bootRetries()},{once:true});else{syncAll();bootRetries()}
})();
