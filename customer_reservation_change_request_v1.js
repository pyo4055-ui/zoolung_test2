(()=>{
'use strict';
if(window.__ZR_CUSTOMER_RESERVATION_CHANGE_REQUEST_V1)return;
window.__ZR_CUSTOMER_RESERVATION_CHANGE_REQUEST_V1=true;

const $=id=>document.getElementById(id);
const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
const tel=v=>String(v||'').replace(/\D/g,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let changeMode=false;

function readBookings(){try{const v=JSON.parse(localStorage.getItem('zr_bookings')||'[]');return Array.isArray(v)?v:[]}catch{return[]}}
function matchingBookings(){
  const manager=norm($('startManager')?.value||$('zrCustomerEntryNameV2')?.value);
  const contact=tel($('startContact')?.value||$('zrCustomerEntryPhoneV2')?.value);
  if(!manager||!contact)return [];
  return readBookings().filter(b=>b&&!b.__availabilityOnly&&norm(b.managerName)===manager&&tel(b.contact)===contact&&!['cancelled','rejected'].includes(String(b.status||'')));
}
function selectedBooking(){
  const id=String($('zrChangeBookingSelect')?.value||'');
  return matchingBookings().find(b=>String(b.id||'')===id)||null;
}

function installStyle(){
  if($('zrReservationChangeRequestV1Style'))return;
  const s=document.createElement('style');s.id='zrReservationChangeRequestV1Style';s.textContent=`
  #zrReservationChangeNoticeV1{position:fixed;inset:0;z-index:2147483500;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;background:rgba(44,28,20,.72)}
  #zrReservationChangeNoticeV1.hidden{display:none!important}
  #zrReservationChangeNoticeV1 .zr-change-notice-card{width:min(510px,100%);overflow:hidden;border:1px solid rgba(91,52,36,.12);border-radius:20px;background:#fffdfa;box-shadow:0 28px 90px rgba(26,14,9,.30)}
  #zrReservationChangeNoticeV1 .zr-change-notice-head{padding:18px 22px;background:#fc5404;color:#fff;font-size:20px;font-weight:950;letter-spacing:-.4px}
  #zrReservationChangeNoticeV1 .zr-change-notice-body{padding:21px 22px 8px;color:#493a32;font-size:14px;line-height:1.72;word-break:keep-all}
  #zrReservationChangeNoticeV1 .zr-change-notice-body strong{display:block;margin-bottom:10px;color:#651012;font-size:15px}
  #zrReservationChangeNoticeV1 .zr-change-notice-points{margin:0;padding-left:19px}
  #zrReservationChangeNoticeV1 .zr-change-notice-points li{margin:7px 0}
  #zrReservationChangeNoticeV1 .zr-change-notice-actions{display:grid;grid-template-columns:1fr 1.35fr;gap:9px;padding:15px 22px 22px}
  #zrReservationChangeNoticeV1 button{min-height:50px;border-radius:12px;font:inherit;font-size:14px;font-weight:900;cursor:pointer;touch-action:manipulation}
  #zrReservationChangeNoticeCancel{border:1px solid #f1bcbc;background:#ffe7e7;color:#913535}
  #zrReservationChangeNoticeConfirm{border:1px solid #fc5404;background:#fc5404;color:#fff}

  #inquiryModal.zr-reservation-change-mode #zrInquiryVisitFields{border-color:#f2c4ad!important;background:#fffaf6!important}
  #inquiryModal.zr-reservation-change-mode #zrInquiryVisitFields .zr-inquiry-section-title{color:#651012!important}
  #inquiryModal.zr-reservation-change-mode #inqType{pointer-events:none;background:#f7f3ef;color:#635850}
  #inquiryModal.zr-reservation-change-mode #zrInquiryVisitFields .zr-inquiry-visit-grid{grid-template-columns:minmax(330px,1.32fr) minmax(230px,1fr)!important;gap:14px!important}
  #inquiryModal.zr-reservation-change-mode #zrInquiryVisitFields .zr-inquiry-date-selects{grid-template-columns:minmax(190px,1.35fr) minmax(110px,.65fr)!important;gap:9px!important}
  #inquiryModal.zr-reservation-change-mode #zrInquiryVisitFields .zr-inquiry-visit-grid label{font-size:14px!important;font-weight:900!important;color:#49352c!important;white-space:nowrap}
  #inquiryModal.zr-reservation-change-mode #zrInquiryVisitFields .zr-inquiry-date-selects select,
  #inquiryModal.zr-reservation-change-mode #inqVisitTime{min-height:50px!important;height:50px!important;font-size:15px!important;padding-left:12px!important;padding-right:36px!important}
  #zrChangeBookingField{margin:0 0 16px;padding:13px 14px;border:1px solid #ead8cc;border-radius:12px;background:#fff}
  #zrChangeBookingField label{display:block;margin:0 0 7px;font-size:14px;font-weight:900;color:#651012}
  #zrChangeBookingSelect{width:100%;min-height:50px;height:50px;font-size:14px;font-weight:750;background:#fff}
  #zrChangeBookingHelp{margin-top:7px;color:#74655d;font-size:11.5px;line-height:1.5}
  #zrChangeReviewBooking{grid-column:1/-1!important;background:#fff7f0!important;border:1px solid #f0d4c3!important;border-radius:10px!important;padding:10px 11px!important;margin:4px 0!important}

  @media(max-width:800px){
    #inquiryModal.zr-reservation-change-mode #zrInquiryVisitFields .zr-inquiry-visit-grid{grid-template-columns:1fr!important;gap:12px!important}
    #inquiryModal.zr-reservation-change-mode #zrInquiryVisitFields .zr-inquiry-date-selects{grid-template-columns:minmax(0,1.3fr) minmax(96px,.7fr)!important}
  }
  @media(max-width:520px){
    #zrReservationChangeNoticeV1{padding:12px}#zrReservationChangeNoticeV1 .zr-change-notice-head{padding:16px 17px;font-size:18px}#zrReservationChangeNoticeV1 .zr-change-notice-body{padding:18px 17px 7px;font-size:13.5px}#zrReservationChangeNoticeV1 .zr-change-notice-actions{grid-template-columns:1fr;padding:12px 17px 18px}#zrReservationChangeNoticeV1 button{min-height:48px}
    #inquiryModal.zr-reservation-change-mode #zrInquiryVisitFields .zr-inquiry-date-selects{grid-template-columns:1fr 96px!important;gap:7px!important}
    #zrChangeBookingField{padding:12px}
  }
  `;document.head.appendChild(s);
}

function ensureNotice(){
  let modal=$('zrReservationChangeNoticeV1');if(modal)return modal;
  modal=document.createElement('div');modal.id='zrReservationChangeNoticeV1';modal.className='hidden';
  modal.innerHTML=`<div class="zr-change-notice-card" role="dialog" aria-modal="true" aria-labelledby="zrReservationChangeNoticeTitle"><div class="zr-change-notice-head" id="zrReservationChangeNoticeTitle">예약 변경 전 확인</div><div class="zr-change-notice-body"><strong>예약 변경 요청은 즉시 예약이 변경되는 기능이 아닙니다.</strong><ul class="zr-change-notice-points"><li>변경을 요청한 날짜의 단체 예약 현황에 따라 변경이 불가할 수 있습니다.</li><li>담당자가 변경 가능 여부를 확인한 뒤 안내드립니다.</li><li>변경이 확정되면 예약 확정 문자를 다시 보내드립니다.</li></ul><div style="margin-top:13px">위 내용을 확인하고 예약 변경 요청을 접수하시겠습니까?</div></div><div class="zr-change-notice-actions"><button type="button" id="zrReservationChangeNoticeCancel">아니오</button><button type="button" id="zrReservationChangeNoticeConfirm">확인하고 변경 요청하기</button></div></div>`;
  document.body.appendChild(modal);
  $('zrReservationChangeNoticeCancel').onclick=()=>modal.classList.add('hidden');
  $('zrReservationChangeNoticeConfirm').onclick=continueChangeRequest;
  return modal;
}
function openNotice(){ensureNotice().classList.remove('hidden')}
function closeNotice(){$('zrReservationChangeNoticeV1')?.classList.add('hidden')}

function inquiryLabels(){
  const grid=$('zrInquiryVisitFields')?.querySelector('.zr-inquiry-visit-grid');
  const cols=grid?[...grid.children]:[];
  return {date:cols[0]?.querySelector('label')||null,time:cols[1]?.querySelector('label')||null};
}
function setModeCopy(on){
  const modal=$('inquiryModal');if(!modal)return;
  modal.classList.toggle('zr-reservation-change-mode',on);
  const labels=inquiryLabels();
  if(labels.date)labels.date.textContent=on?'예약변경날짜':'방문 희망일';
  if(labels.time)labels.time.textContent=on?'예약변경시간':'방문 희망시간';
  const title=$('zrInquiryFormStage')?.querySelector(':scope > h2');
  const intro=title?.nextElementSibling?.classList?.contains('help')?title.nextElementSibling:null;
  if(title)title.textContent=on?'예약 변경 요청':'1:1 문의하기';
  if(intro)intro.textContent=on?'변경할 예약을 선택한 뒤 희망 날짜와 시간을 입력해주세요. 접수 후 담당자가 가능 여부를 확인합니다.':'사전답사 또는 단체 관련 문의를 남겨주세요.';
  const review=$('zrInquiryReviewStage');
  const complete=$('zrInquiryCompleteStage');
  if(review){const h=review.querySelector('h2');if(h)h.textContent=on?'예약 변경 요청 확인':'문의 내용 확인';const b=$('zrInquiryReviewSubmit');if(b)b.textContent=on?'변경 요청 접수하기':'문의하기'}
  if(complete){const h=complete.querySelector('h2'),help=complete.querySelector('.zr-review-help');if(h)h.textContent=on?'예약 변경 요청이 접수됐습니다.':'문의하기가 완료됐습니다.';if(help)help.textContent=on?'아직 예약이 변경된 것은 아닙니다. 담당자 확인 후 가능 여부를 안내드리며, 변경이 확정되면 예약 확정 문자를 다시 보내드립니다.':'문의 내용을 확인한 후 입력하신 연락처로 안내드리겠습니다.'}
}
function ensureBookingSelector(){
  const fields=$('zrInquiryVisitFields');if(!fields)return null;
  let wrap=$('zrChangeBookingField');
  if(!wrap){
    wrap=document.createElement('div');wrap.id='zrChangeBookingField';wrap.className='hidden';
    wrap.innerHTML='<label class="req" for="zrChangeBookingSelect">변경할 예약 선택</label><select id="zrChangeBookingSelect"><option value="">변경할 예약을 선택해주세요</option></select><div id="zrChangeBookingHelp">예약이 여러 건이면 변경하려는 예약을 직접 선택해주세요.</div>';
    const title=fields.querySelector('.zr-inquiry-section-title');
    title?.insertAdjacentElement('afterend',wrap);
    $('zrChangeBookingSelect')?.addEventListener('change',()=>{
      const b=selectedBooking(),org=$('inqOrgName');
      if(b?.orgName&&org)org.value=b.orgName;
    });
  }
  return wrap;
}
function populateBookingSelector(){
  const wrap=ensureBookingSelector(),select=$('zrChangeBookingSelect');if(!wrap||!select)return;
  const matches=[...matchingBookings()].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.entryTime||'').localeCompare(String(b.entryTime||'')));
  const old=select.value;
  select.innerHTML='<option value="">변경할 예약을 선택해주세요</option>'+matches.map(b=>`<option value="${esc(b.id||'')}">${esc(`${b.date||'-'} · ${b.entryTime||'--:--'}~${b.exitTime||'--:--'} · ${b.orgName||'단체 예약'}`)}</option>`).join('');
  if(matches.some(b=>String(b.id||'')===old))select.value=old;
  else if(matches.length===1)select.value=String(matches[0].id||'');
  else select.value='';
  select.disabled=matches.length===0;
  const help=$('zrChangeBookingHelp');
  if(help)help.textContent=matches.length>1?'예약이 여러 건 조회되었습니다. 변경하려는 예약을 직접 선택해주세요.':matches.length===1?'조회된 예약이 자동으로 선택되었습니다.':'변경 가능한 예약을 찾지 못했습니다.';
  wrap.classList.toggle('hidden',!changeMode);
  const b=selectedBooking(),org=$('inqOrgName');if(b?.orgName&&org&&!org.value)org.value=b.orgName;
}
function decorateReview(){
  if(!changeMode)return;
  setModeCopy(true);
  const card=$('zrInquiryReviewCard');
  card?.querySelectorAll('.zr-review-label').forEach(el=>{
    const t=norm(el.textContent);
    if(t==='방문 희망일')el.textContent='예약변경날짜';
    if(t==='방문 희망시간')el.textContent='예약변경시간';
  });
  card?.querySelector('#zrChangeReviewBooking')?.remove();
  const b=selectedBooking(),grid=card?.querySelector('.zr-review-grid');
  if(b&&grid){
    const row=document.createElement('div');row.id='zrChangeReviewBooking';row.className='zr-review-row full';
    row.innerHTML=`<span class="zr-review-label">변경 대상 예약</span><div class="zr-review-value">${esc(`${b.date||'-'} · ${b.entryTime||'--:--'}~${b.exitTime||'--:--'} · ${b.orgName||'단체 예약'}`)}</div>`;
    grid.insertBefore(row,grid.firstChild);
  }
}
function prepareChangeInquiry(){
  const modal=$('inquiryModal');if(!modal)return false;
  changeMode=true;setModeCopy(true);ensureBookingSelector();populateBookingSelector();
  const type=$('inqType');if(type){type.value='group';type.dispatchEvent(new Event('change',{bubbles:true}))}
  const manager=norm($('startManager')?.value||$('zrCustomerEntryNameV2')?.value);
  const contact=tel($('startContact')?.value||$('zrCustomerEntryPhoneV2')?.value);
  const name=$('inqName'),mobile=$('inqMobile'),content=$('inqContent');
  if(name&&manager&&!name.value)name.value=manager;
  if(mobile&&/^010\d{8}$/.test(contact)&&!mobile.value)mobile.value=contact;
  if(content){
    if(!content.dataset.zrDefaultPlaceholder)content.dataset.zrDefaultPlaceholder=content.getAttribute('placeholder')||'';
    content.placeholder='변경 문의 내용을 적어주세요.';
    if(modal.dataset.zrChangeContentPrepared!=='1'){
      content.value='';modal.dataset.zrChangeContentPrepared='1';
    }
  }
  const b=selectedBooking(),org=$('inqOrgName');if(b?.orgName&&org&&!org.value)org.value=b.orgName;
  try{modal.querySelector('.modal-card')?.scrollTo?.({top:0,behavior:'auto'})}catch{}
  return true;
}
function resetNormalMode(){
  changeMode=false;setModeCopy(false);
  const modal=$('inquiryModal'),wrap=$('zrChangeBookingField'),content=$('inqContent');
  if(modal)delete modal.dataset.zrChangeContentPrepared;
  wrap?.classList.add('hidden');
  if(content){content.value='';content.placeholder=content.dataset.zrDefaultPlaceholder||'문의 내용을 입력해주세요.'}
  $('zrChangeReviewBooking')?.remove();
}
function injectHiddenChangeContext(){
  if(!changeMode)return;
  const stage=$('zrInquiryFormStage');
  if(!stage?.classList.contains('hidden'))return;
  const content=$('inqContent'),b=selectedBooking();if(!content||!b)return;
  const text=String(content.value||'');
  if(!text.startsWith('[단체 문의]')||text.includes('\n[예약 변경 정보]\n'))return;
  const re=/^(\[단체 문의\]\n단체명:\s*.*\n방문 희망일:\s*.*\n방문 희망시간:\s*.*\n단체 인원:\s*.*?)(?:\n\n)([\s\S]*)$/;
  const m=text.match(re);if(!m)return;
  const meta=`[예약 변경 정보]\n대상 예약번호: ${b.id||'-'}\n현재 예약일: ${b.date||'-'}\n현재 예약시간: ${b.entryTime||'--:--'} ~ ${b.exitTime||'--:--'}`;
  content.value=`${m[1]}\n\n${meta}\n\n${m[2]}`;
}

function continueChangeRequest(){
  closeNotice();
  const btn=$('changeExisting');
  if(!btn)return;
  btn.dataset.zrChangeRequestConfirmed='1';
  try{btn.click()}catch{}
  [0,40,120].forEach(ms=>setTimeout(prepareChangeInquiry,ms));
}
function bind(){
  installStyle();ensureNotice();
  const btn=$('changeExisting');if(btn)btn.textContent='2. 예약 변경하기';
  document.addEventListener('click',e=>{
    const change=e.target?.closest?.('#changeExisting');
    if(change){
      if(change.dataset.zrChangeRequestConfirmed==='1'){delete change.dataset.zrChangeRequestConfirmed;return}
      e.preventDefault();e.stopImmediatePropagation();openNotice();return;
    }
    if(e.target?.closest?.('#inquiryBtn,#zrCustomerEntryInquiryV2')){resetNormalMode();return}
    if(changeMode&&e.target?.closest?.('#submitInquiry')){
      injectHiddenChangeContext();
      setTimeout(decorateReview,0);
    }
    if(changeMode&&e.target?.closest?.('[data-close="inquiryModal"]'))setTimeout(resetNormalMode,0);
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('zrReservationChangeNoticeV1')?.classList.contains('hidden'))closeNotice()});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
document.addEventListener('zr:customer-runtime-ready',()=>{const b=$('changeExisting');if(b)b.textContent='2. 예약 변경하기'},{once:true});
})();