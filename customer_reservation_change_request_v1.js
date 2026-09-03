(()=>{
'use strict';
if(window.__ZR_CUSTOMER_RESERVATION_CHANGE_REQUEST_V1)return;
window.__ZR_CUSTOMER_RESERVATION_CHANGE_REQUEST_V1=true;

const $=id=>document.getElementById(id);
const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
const tel=v=>String(v||'').replace(/\D/g,'');
let changeMode=false;

function readBookings(){try{const v=JSON.parse(localStorage.getItem('zr_bookings')||'[]');return Array.isArray(v)?v:[]}catch{return[]}}
function matchingBookings(){
  const manager=norm($('startManager')?.value||$('zrCustomerEntryNameV2')?.value);
  const contact=tel($('startContact')?.value||$('zrCustomerEntryPhoneV2')?.value);
  if(!manager||!contact)return [];
  return readBookings().filter(b=>b&&!b.__availabilityOnly&&norm(b.managerName)===manager&&tel(b.contact)===contact&&!['cancelled','rejected'].includes(String(b.status||'')));
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
  @media(max-width:520px){#zrReservationChangeNoticeV1{padding:12px}#zrReservationChangeNoticeV1 .zr-change-notice-head{padding:16px 17px;font-size:18px}#zrReservationChangeNoticeV1 .zr-change-notice-body{padding:18px 17px 7px;font-size:13.5px}#zrReservationChangeNoticeV1 .zr-change-notice-actions{grid-template-columns:1fr;padding:12px 17px 18px}#zrReservationChangeNoticeV1 button{min-height:48px}}
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
  if(intro)intro.textContent=on?'변경을 희망하는 날짜와 시간을 입력해주세요. 접수 후 담당자가 가능 여부를 확인합니다.':'사전답사 또는 단체 관련 문의를 남겨주세요.';
  const review=$('zrInquiryReviewStage');
  const complete=$('zrInquiryCompleteStage');
  if(review){const h=review.querySelector('h2');if(h)h.textContent=on?'예약 변경 요청 확인':'문의 내용 확인';const b=$('zrInquiryReviewSubmit');if(b)b.textContent=on?'변경 요청 접수하기':'문의하기'}
  if(complete){const h=complete.querySelector('h2'),help=complete.querySelector('.zr-review-help');if(h)h.textContent=on?'예약 변경 요청이 접수됐습니다.':'문의하기가 완료됐습니다.';if(help)help.textContent=on?'아직 예약이 변경된 것은 아닙니다. 담당자 확인 후 가능 여부를 안내드리며, 변경이 확정되면 예약 확정 문자를 다시 보내드립니다.':'문의 내용을 확인한 후 입력하신 연락처로 안내드리겠습니다.'}
}
function decorateReview(){
  if(!changeMode)return;
  setModeCopy(true);
  $('zrInquiryReviewCard')?.querySelectorAll('.zr-review-label').forEach(el=>{
    const t=norm(el.textContent);
    if(t==='방문 희망일')el.textContent='예약변경날짜';
    if(t==='방문 희망시간')el.textContent='예약변경시간';
  });
}
function bookingReferenceText(booking,matches){
  if(booking){
    return `[예약 변경 요청]\n예약번호: ${booking.id||'-'}\n현재 예약일: ${booking.date||'-'}\n현재 예약시간: ${booking.entryTime||'--:--'} ~ ${booking.exitTime||'--:--'}\n\n변경 요청은 담당자 확인 후 확정되는 것을 확인했습니다.`;
  }
  if(matches.length>1){
    const refs=matches.slice(0,5).map(b=>`- ${b.date||'-'} ${b.entryTime||'--:--'}~${b.exitTime||'--:--'} · ${b.orgName||'단체 예약'} · ${b.id||'-'}`).join('\n');
    return `[예약 변경 요청]\n조회된 예약이 여러 건입니다. 변경하려는 예약을 문의내용에 적어주세요.\n${refs}\n\n변경 요청은 담당자 확인 후 확정되는 것을 확인했습니다.`;
  }
  return '[예약 변경 요청]\n변경하려는 기존 예약을 확인할 수 있도록 예약 정보를 문의내용에 적어주세요.\n\n변경 요청은 담당자 확인 후 확정되는 것을 확인했습니다.';
}
function prepareChangeInquiry(){
  const modal=$('inquiryModal');if(!modal)return false;
  changeMode=true;setModeCopy(true);
  const type=$('inqType');if(type){type.value='group';type.dispatchEvent(new Event('change',{bubbles:true}))}
  const manager=norm($('startManager')?.value||$('zrCustomerEntryNameV2')?.value);
  const contact=tel($('startContact')?.value||$('zrCustomerEntryPhoneV2')?.value);
  const matches=matchingBookings(),booking=matches.length===1?matches[0]:null;
  const name=$('inqName'),mobile=$('inqMobile'),org=$('inqOrgName'),content=$('inqContent');
  if(name&&manager&&!name.value)name.value=manager;
  if(mobile&&/^010\d{8}$/.test(contact)&&!mobile.value)mobile.value=contact;
  if(org&&booking?.orgName&&!org.value)org.value=booking.orgName;
  if(content)content.value=bookingReferenceText(booking,matches);
  try{modal.querySelector('.modal-card')?.scrollTo?.({top:0,behavior:'auto'})}catch{}
  return true;
}
function resetNormalMode(){
  changeMode=false;setModeCopy(false);
  const content=$('inqContent');
  if(content&&/^\[예약 변경 요청\]/.test(String(content.value||'')))content.value='';
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
    if(changeMode&&e.target?.closest?.('#submitInquiry'))setTimeout(decorateReview,0);
  },true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('zrReservationChangeNoticeV1')?.classList.contains('hidden'))closeNotice()});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
document.addEventListener('zr:customer-runtime-ready',()=>{const b=$('changeExisting');if(b)b.textContent='2. 예약 변경하기'},{once:true});
})();