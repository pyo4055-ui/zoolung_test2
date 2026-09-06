(()=>{
'use strict';
if(window.__ZR_CUSTOMER_RESERVATION_CHANGE_REQUEST_V1)return;
window.__ZR_CUSTOMER_RESERVATION_CHANGE_REQUEST_V1=true;

const $=id=>document.getElementById(id);
const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
const tel=v=>String(v||'').replace(/\D/g,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let changeMode=false,extraBookingId='';

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
function timeToMin(v){const m=/^(\d{2}):(\d{2})$/.exec(String(v||''));return m?Number(m[1])*60+Number(m[2]):NaN}
function minToTime(n){if(!Number.isFinite(n)||n<0||n>=1440)return'';return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
function durationFromRange(start,end,fallback=30){const s=timeToMin(start),e=timeToMin(end);return Number.isFinite(s)&&Number.isFinite(e)&&e>s&&[30,60].includes(e-s)?e-s:Number(fallback)===60?60:30}
function requestDate(){return String($('inqVisitDate')?.value||($('inqVisitMonth')?.value&&$('inqVisitDay')?.value?`${$('inqVisitMonth').value}-${$('inqVisitDay').value}`:''))}
function requestEntry(){return String($('inqVisitTime')?.value||'')}
function mealLabel(v){return ({lunchbox:'도시락 지참',cafe:'내부 카페 주문',none:'식사 안 함'})[String(v||'none')]||'식사 안 함'}
function currentPlayText(b){if(String(b?.playUse||'no')!=='yes')return '현재: 이용 안 함';const s=String(b?.playStart||''),e=String(b?.playEnd||'');return `현재: 이용함${s?` · ${s}${e?`~${e}`:''}`:''}`}
function currentMealText(b){const type=String(b?.mealType||'none'),s=String(b?.mealStart||''),e=String(b?.mealEnd||'');return `현재: ${mealLabel(type)}${type!=='none'&&s?` · ${s}${e?`~${e}`:''}`:''}`}

function nativePlayTimes(){
  const values=[];
  for(const id of ['playStart','entryTime']){
    const el=$(id);if(!el)continue;
    if(el.tagName==='SELECT')for(const o of el.options){const v=String(o.value||'').trim();if(/^\d{2}:\d{2}$/.test(v))values.push(v)}
    else {const v=String(el.value||'').trim();if(/^\d{2}:\d{2}$/.test(v))values.push(v)}
    if(values.length)break;
  }
  return [...new Set(values)].sort();
}
function requestedExit(b){
  const oldStart=timeToMin(b?.entryTime),oldEnd=timeToMin(b?.exitTime),entry=timeToMin(requestEntry());
  if(!Number.isFinite(oldStart)||!Number.isFinite(oldEnd)||oldEnd<=oldStart||!Number.isFinite(entry))return NaN;
  return entry+(oldEnd-oldStart);
}
function sameSource(row,bookingId){
  if(!bookingId)return false;
  return String(row?.id||'')===bookingId||String(row?.sourceBookingId||'')===bookingId;
}
function playgroundOccupancies(date,bookingId){
  return readBookings().filter(row=>{
    if(!row||sameSource(row,bookingId)||String(row.date||'')!==date)return false;
    if(['cancelled','rejected'].includes(String(row.status||'')))return false;
    if(String(row.playUse||'no')!=='yes')return false;
    const s=timeToMin(row.playStart),e=timeToMin(row.playEnd);
    return Number.isFinite(s)&&Number.isFinite(e)&&e>s;
  }).map(row=>({start:timeToMin(row.playStart),end:timeToMin(row.playEnd)}));
}
function playSlotState(start,duration){
  const date=requestDate(),b=selectedBooking(),bookingId=String(b?.id||'');
  const sm=timeToMin(start),mins=Number(duration||0),em=sm+mins;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!b||!Number.isFinite(sm)||![30,60].includes(mins))return {ok:false,reason:'date'};
  const entry=timeToMin(requestEntry()),exit=requestedExit(b);
  if(Number.isFinite(entry)&&sm<entry&&entry-sm!==mins)return {ok:false,reason:'entry'};
  if(Number.isFinite(exit)&&em>exit)return {ok:false,reason:'range'};
  const conflict=playgroundOccupancies(date,bookingId).some(x=>sm<x.end&&em>x.start);
  return conflict?{ok:false,reason:'full'}:{ok:true,reason:''};
}
function syncChangePlayAvailability(){
  const select=$('zrChangePlayStart'),duration=$('zrChangePlayDuration'),help=$('zrChangePlayAvailabilityHelp');
  if(!select||!duration)return;
  const playMode=String($('zrChangePlayMode')?.value||'keep');
  if(playMode!=='yes'){select.disabled=true;duration.disabled=true;if(help)help.textContent='';return}
  const date=requestDate();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){
    select.innerHTML='<option value="">예약변경날짜를 먼저 선택해주세요</option>';select.disabled=true;duration.disabled=true;
    if(help)help.textContent='예약변경날짜를 선택하면 해당 날짜의 놀이터 예약 가능 시간을 확인할 수 있습니다.';
    return;
  }
  duration.disabled=false;
  const mins=Number(duration.value||30),old=String(select.value||''),times=nativePlayTimes();
  if(!times.length){select.innerHTML='<option value="">놀이터 시간을 불러오는 중입니다</option>';select.disabled=true;if(help)help.textContent='잠시 후 놀이터 시간을 다시 확인해주세요.';setTimeout(syncChangePlayAvailability,180);return}
  let available=0;
  select.innerHTML='<option value="">시작시간 선택</option>'+times.map(v=>{
    const state=playSlotState(v,mins);if(state.ok)available++;
    const suffix=state.reason==='full'?' (마감)':state.reason==='entry'||state.reason==='range'?' (이용시간 확인)':'';
    return `<option value="${v}"${state.ok?'':' disabled'}>${v}${suffix}</option>`;
  }).join('');
  if(old&&[...select.options].some(o=>o.value===old&&!o.disabled))select.value=old;else select.value='';
  select.disabled=false;
  if(help)help.textContent=available?`예약 가능한 시간만 선택할 수 있습니다. 마감된 시간은 선택할 수 없습니다.`:'선택한 날짜와 이용시간에 예약 가능한 놀이터 시간이 없습니다.';
}

function extraRequestSnapshot(){
  const b=selectedBooking()||{};
  const playMode=String($('zrChangePlayMode')?.value||'keep'),mealMode=String($('zrChangeMealMode')?.value||'keep');
  const changePlay=playMode!=='keep',changeMeal=mealMode!=='keep';
  const playStart=changePlay&&playMode==='yes'?String($('zrChangePlayStart')?.value||''):'';
  const playDuration=changePlay&&playMode==='yes'?Number($('zrChangePlayDuration')?.value||30):0;
  const sm=timeToMin(playStart),playEnd=playStart&&playDuration&&Number.isFinite(sm)?minToTime(sm+playDuration):'';
  const mealStart=changeMeal&&mealMode!=='none'?String($('zrChangeMealStart')?.value||''):'';
  const mealEnd=changeMeal&&mealMode!=='none'?String($('zrChangeMealEnd')?.value||''):'';
  return {b,changePlay,playUse:changePlay?playMode:String(b.playUse||'no'),playStart,playEnd,playDuration,changeMeal,mealType:changeMeal?mealMode:String(b.mealType||'none'),mealStart,mealEnd};
}
function playRequestText(x=extraRequestSnapshot()){if(!x.changePlay)return '현재 예약 유지';if(x.playUse!=='yes')return '이용 안 함';return `이용함${x.playStart?` · ${x.playStart}${x.playEnd?`~${x.playEnd}`:''}`:''}`}
function mealRequestText(x=extraRequestSnapshot()){if(!x.changeMeal)return '현재 예약 유지';return `${mealLabel(x.mealType)}${x.mealType!=='none'&&x.mealStart?` · ${x.mealStart}${x.mealEnd?`~${x.mealEnd}`:''}`:''}`}

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
  #inquiryModal.zr-reservation-change-mode #zrInquiryVisitFields .zr-inquiry-date-selects select,#inquiryModal.zr-reservation-change-mode #inqVisitTime{min-height:50px!important;height:50px!important;font-size:15px!important;padding-left:12px!important;padding-right:36px!important}
  #zrChangeBookingField{margin:0 0 16px;padding:13px 14px;border:1px solid #ead8cc;border-radius:12px;background:#fff}
  #zrChangeBookingField label{display:block;margin:0 0 7px;font-size:14px;font-weight:900;color:#651012}
  #zrChangeBookingSelect{width:100%;min-height:50px;height:50px;font-size:14px;font-weight:750;background:#fff}
  #zrChangeBookingHelp{margin-top:7px;color:#74655d;font-size:11.5px;line-height:1.5}
  #zrChangeExtraFields{margin:15px 0 0;padding:14px;border:1px solid #dfe5df;border-radius:13px;background:#fff}
  #zrChangeExtraFields .zr-change-extra-title{margin:0 0 10px;font-size:14px;font-weight:950;color:#31433a}
  #zrChangeExtraFields .zr-change-extra-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}
  #zrChangeExtraFields .zr-change-extra-card{padding:12px;border:1px solid #e4e9e6;border-radius:11px;background:#fafcf9}
  #zrChangeExtraFields label{display:block;margin:0 0 6px;font-size:12px;font-weight:900;color:#31433a}
  #zrChangeExtraFields select,#zrChangeExtraFields input{width:100%;min-height:44px;height:44px;box-sizing:border-box;font-size:13px;background:#fff}
  #zrChangeExtraFields .zr-change-extra-current{margin-top:6px;color:#68766e;font-size:11.5px;line-height:1.45}
  #zrChangeExtraFields .zr-change-extra-times{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
  #zrChangePlayAvailabilityHelp{margin-top:8px;color:#68766e;font-size:11.5px;line-height:1.5}
  #zrChangeExtraFields .zr-change-extra-foot{margin-top:10px;color:#68766e;font-size:11.5px;line-height:1.55}
  #zrChangeReviewBooking,#zrChangeReviewPlay,#zrChangeReviewMeal{grid-column:1/-1!important;background:#fff7f0!important;border:1px solid #f0d4c3!important;border-radius:10px!important;padding:10px 11px!important;margin:4px 0!important}
  @media(max-width:800px){#inquiryModal.zr-reservation-change-mode #zrInquiryVisitFields .zr-inquiry-visit-grid{grid-template-columns:1fr!important;gap:12px!important}#inquiryModal.zr-reservation-change-mode #zrInquiryVisitFields .zr-inquiry-date-selects{grid-template-columns:minmax(0,1.3fr) minmax(96px,.7fr)!important}#zrChangeExtraFields .zr-change-extra-grid{grid-template-columns:1fr}}
  @media(max-width:520px){#zrReservationChangeNoticeV1{padding:12px}#zrReservationChangeNoticeV1 .zr-change-notice-head{padding:16px 17px;font-size:18px}#zrReservationChangeNoticeV1 .zr-change-notice-body{padding:18px 17px 7px;font-size:13.5px}#zrReservationChangeNoticeV1 .zr-change-notice-actions{grid-template-columns:1fr;padding:12px 17px 18px}#zrReservationChangeNoticeV1 button{min-height:48px}#inquiryModal.zr-reservation-change-mode #zrInquiryVisitFields .zr-inquiry-date-selects{grid-template-columns:1fr 96px!important;gap:7px!important}#zrChangeBookingField,#zrChangeExtraFields{padding:12px}#zrChangeExtraFields .zr-change-extra-times{grid-template-columns:1fr}}
  `;document.head.appendChild(s);
}

function ensureNotice(){
  let modal=$('zrReservationChangeNoticeV1');if(modal)return modal;
  modal=document.createElement('div');modal.id='zrReservationChangeNoticeV1';modal.className='hidden';
  modal.innerHTML=`<div class="zr-change-notice-card" role="dialog" aria-modal="true" aria-labelledby="zrReservationChangeNoticeTitle"><div class="zr-change-notice-head" id="zrReservationChangeNoticeTitle">예약 변경 전 확인</div><div class="zr-change-notice-body"><strong>예약 변경 요청은 즉시 예약이 변경되는 기능이 아닙니다.</strong><ul class="zr-change-notice-points"><li>변경을 요청한 날짜의 단체 예약 현황에 따라 변경이 불가할 수 있습니다.</li><li>놀이터 변경 요청은 접수되는 즉시 해당 시간의 예약 가능 여부에 반영됩니다.</li><li>변경이 확정되면 예약 확정 문자를 다시 보내드립니다.</li></ul><div style="margin-top:13px">위 내용을 확인하고 예약 변경 요청을 접수하시겠습니까?</div></div><div class="zr-change-notice-actions"><button type="button" id="zrReservationChangeNoticeCancel">아니오</button><button type="button" id="zrReservationChangeNoticeConfirm">확인하고 변경 요청하기</button></div></div>`;
  document.body.appendChild(modal);$('zrReservationChangeNoticeCancel').onclick=()=>modal.classList.add('hidden');$('zrReservationChangeNoticeConfirm').onclick=continueChangeRequest;return modal;
}
function openNotice(){ensureNotice().classList.remove('hidden')}
function closeNotice(){$('zrReservationChangeNoticeV1')?.classList.add('hidden')}
function inquiryLabels(){const grid=$('zrInquiryVisitFields')?.querySelector('.zr-inquiry-visit-grid'),cols=grid?[...grid.children]:[];return {date:cols[0]?.querySelector('label')||null,time:cols[1]?.querySelector('label')||null}}
function setModeCopy(on){
  const modal=$('inquiryModal');if(!modal)return;modal.classList.toggle('zr-reservation-change-mode',on);
  const labels=inquiryLabels();if(labels.date)labels.date.textContent=on?'예약변경날짜':'방문 희망일';if(labels.time)labels.time.textContent=on?'예약변경시간':'방문 희망시간';
  const title=$('zrInquiryFormStage')?.querySelector(':scope > h2'),intro=title?.nextElementSibling?.classList?.contains('help')?title.nextElementSibling:null;
  if(title)title.textContent=on?'예약 변경 요청':'1:1 문의하기';if(intro)intro.textContent=on?'변경할 예약을 선택한 뒤 희망 날짜·시간과 필요한 경우 놀이터·식사 변경 내용을 입력해주세요. 접수 후 담당자가 가능 여부를 확인합니다.':'사전답사 또는 단체 관련 문의를 남겨주세요.';
  const review=$('zrInquiryReviewStage'),complete=$('zrInquiryCompleteStage');
  if(review){const h=review.querySelector('h2');if(h)h.textContent=on?'예약 변경 요청 확인':'문의 내용 확인';const b=$('zrInquiryReviewSubmit');if(b)b.textContent=on?'변경 요청 접수하기':'문의하기'}
  if(complete){const h=complete.querySelector('h2'),help=complete.querySelector('.zr-review-help');if(h)h.textContent=on?'예약 변경 요청이 접수됐습니다.':'문의하기가 완료됐습니다.';if(help)help.textContent=on?'아직 예약이 변경된 것은 아닙니다. 담당자 확인 후 가능 여부를 안내드리며, 변경이 확정되면 예약 확정 문자를 다시 보내드립니다.':'문의 내용을 확인한 후 입력하신 연락처로 안내드리겠습니다.'}
}
function ensureBookingSelector(){
  const fields=$('zrInquiryVisitFields');if(!fields)return null;let wrap=$('zrChangeBookingField');
  if(!wrap){wrap=document.createElement('div');wrap.id='zrChangeBookingField';wrap.className='hidden';wrap.innerHTML='<label class="req" for="zrChangeBookingSelect">변경할 예약 선택</label><select id="zrChangeBookingSelect"><option value="">변경할 예약을 선택해주세요</option></select><div id="zrChangeBookingHelp">예약이 여러 건이면 변경하려는 예약을 직접 선택해주세요.</div>';fields.querySelector('.zr-inquiry-section-title')?.insertAdjacentElement('afterend',wrap);$('zrChangeBookingSelect')?.addEventListener('change',()=>{const b=selectedBooking(),org=$('inqOrgName');if(b?.orgName&&org)org.value=b.orgName;syncChangeExtraFields(true)})}
  return wrap;
}
function ensureChangeExtraFields(){
  const fields=$('zrInquiryVisitFields');if(!fields)return null;let wrap=$('zrChangeExtraFields');if(wrap)return wrap;
  wrap=document.createElement('div');wrap.id='zrChangeExtraFields';wrap.className='hidden';
  wrap.innerHTML=`<div class="zr-change-extra-title">추가 변경 항목</div><div class="zr-change-extra-grid"><div class="zr-change-extra-card"><label for="zrChangePlayMode">놀이터 변경</label><select id="zrChangePlayMode"><option value="keep">현재 예약 유지</option><option value="yes">이용함</option><option value="no">이용 안 함</option></select><div class="zr-change-extra-current" id="zrChangePlayCurrent"></div><div class="zr-change-extra-times hidden" id="zrChangePlayTimes"><div><label for="zrChangePlayStart">시작시간</label><select id="zrChangePlayStart"><option value="">예약변경날짜를 먼저 선택해주세요</option></select></div><div><label for="zrChangePlayDuration">이용시간</label><select id="zrChangePlayDuration"><option value="30">30분</option><option value="60">60분</option></select></div></div><div id="zrChangePlayAvailabilityHelp"></div></div><div class="zr-change-extra-card"><label for="zrChangeMealMode">식사 변경</label><select id="zrChangeMealMode"><option value="keep">현재 예약 유지</option><option value="lunchbox">도시락 지참</option><option value="cafe">내부 카페 주문</option><option value="none">식사 안 함</option></select><div class="zr-change-extra-current" id="zrChangeMealCurrent"></div><div class="zr-change-extra-times hidden" id="zrChangeMealTimes"><div><label for="zrChangeMealStart">식사 시작</label><input type="time" step="1800" id="zrChangeMealStart"></div><div><label for="zrChangeMealEnd">식사 종료</label><input type="time" step="1800" id="zrChangeMealEnd"></div></div></div></div><div class="zr-change-extra-foot">변경하지 않을 항목은 <b>현재 예약 유지</b>로 두세요. 놀이터는 기존 예약과 다른 변경 요청까지 포함해 마감 시간을 자동으로 확인합니다.</div>`;
  fields.querySelector('.zr-inquiry-visit-grid')?.insertAdjacentElement('afterend',wrap);
  $('zrChangePlayMode')?.addEventListener('change',syncChangeExtraVisibility);$('zrChangePlayDuration')?.addEventListener('change',syncChangePlayAvailability);$('zrChangeMealMode')?.addEventListener('change',syncChangeExtraVisibility);return wrap;
}
function syncChangeExtraVisibility(){
  const play=String($('zrChangePlayMode')?.value||'keep'),meal=String($('zrChangeMealMode')?.value||'keep');
  $('zrChangePlayTimes')?.classList.toggle('hidden',play!=='yes');$('zrChangeMealTimes')?.classList.toggle('hidden',!['lunchbox','cafe'].includes(meal));syncChangePlayAvailability();
}
function syncChangeExtraFields(force=false){
  const wrap=ensureChangeExtraFields();if(!wrap)return;const b=selectedBooking(),id=String(b?.id||'');
  if(!b){extraBookingId='';wrap.classList.toggle('hidden',!changeMode);$('zrChangePlayCurrent').textContent='예약을 먼저 선택해주세요.';$('zrChangeMealCurrent').textContent='예약을 먼저 선택해주세요.';syncChangePlayAvailability();return}
  const reset=force||id!==extraBookingId;extraBookingId=id;
  if(reset){$('zrChangePlayMode').value='keep';$('zrChangeMealMode').value='keep';$('zrChangePlayDuration').value=String(durationFromRange(b.playStart,b.playEnd,b.playDuration));$('zrChangeMealStart').value=String(b.mealStart||'');$('zrChangeMealEnd').value=String(b.mealEnd||'')}
  $('zrChangePlayCurrent').textContent=currentPlayText(b);$('zrChangeMealCurrent').textContent=currentMealText(b);wrap.classList.toggle('hidden',!changeMode);syncChangeExtraVisibility();
}
function populateBookingSelector(){
  const wrap=ensureBookingSelector(),select=$('zrChangeBookingSelect');if(!wrap||!select)return;const matches=[...matchingBookings()].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.entryTime||'').localeCompare(String(b.entryTime||''))),old=select.value;
  select.innerHTML='<option value="">변경할 예약을 선택해주세요</option>'+matches.map(b=>`<option value="${esc(b.id||'')}">${esc(`${b.date||'-'} · ${b.entryTime||'--:--'}~${b.exitTime||'--:--'} · ${b.orgName||'단체 예약'}`)}</option>`).join('');
  if(matches.some(b=>String(b.id||'')===old))select.value=old;else if(matches.length===1)select.value=String(matches[0].id||'');else select.value='';select.disabled=matches.length===0;
  const help=$('zrChangeBookingHelp');if(help)help.textContent=matches.length>1?'예약이 여러 건 조회되었습니다. 변경하려는 예약을 직접 선택해주세요.':matches.length===1?'조회된 예약이 자동으로 선택되었습니다.':'변경 가능한 예약을 찾지 못했습니다.';wrap.classList.toggle('hidden',!changeMode);const b=selectedBooking(),org=$('inqOrgName');if(b?.orgName&&org&&!org.value)org.value=b.orgName;syncChangeExtraFields(false);
}
function validateExtraChanges(){
  if(!changeMode)return true;const x=extraRequestSnapshot();
  if(x.changePlay&&x.playUse==='yes'){
    syncChangePlayAvailability();
    if(!x.playStart||![30,60].includes(x.playDuration)||!x.playEnd){try{$('zrChangePlayStart')?.focus()}catch{};try{window.toast?.('놀이터 시작시간과 이용시간을 확인해주세요.')}catch{};return false}
    const state=playSlotState(x.playStart,x.playDuration);if(!state.ok){try{$('zrChangePlayStart')?.focus()}catch{};try{window.toast?.(state.reason==='full'?'선택한 놀이터 시간은 이미 마감되었습니다. 다른 시간을 선택해주세요.':'선택한 놀이터 시간이 변경 예약시간과 맞지 않습니다.')}catch{};return false}
  }
  if(x.changeMeal&&['lunchbox','cafe'].includes(x.mealType)){const s=timeToMin(x.mealStart),e=timeToMin(x.mealEnd);if(!Number.isFinite(s)||!Number.isFinite(e)||e<=s){try{$('zrChangeMealStart')?.focus()}catch{};try{window.toast?.('식사 시작·종료시간을 확인해주세요.')}catch{};return false}}
  return true;
}
function decorateReview(){
  if(!changeMode)return;setModeCopy(true);const card=$('zrInquiryReviewCard');card?.querySelectorAll('.zr-review-label').forEach(el=>{const t=norm(el.textContent);if(t==='방문 희망일')el.textContent='예약변경날짜';if(t==='방문 희망시간')el.textContent='예약변경시간'});['zrChangeReviewBooking','zrChangeReviewPlay','zrChangeReviewMeal'].forEach(id=>card?.querySelector('#'+id)?.remove());const b=selectedBooking(),grid=card?.querySelector('.zr-review-grid'),x=extraRequestSnapshot();
  if(b&&grid){const bookingRow=document.createElement('div');bookingRow.id='zrChangeReviewBooking';bookingRow.className='zr-review-row full';bookingRow.innerHTML=`<span class="zr-review-label">변경 대상 예약</span><div class="zr-review-value">${esc(`${b.date||'-'} · ${b.entryTime||'--:--'}~${b.exitTime||'--:--'} · ${b.orgName||'단체 예약'}`)}</div>`;const playRow=document.createElement('div');playRow.id='zrChangeReviewPlay';playRow.className='zr-review-row full';playRow.innerHTML=`<span class="zr-review-label">놀이터 변경</span><div class="zr-review-value">${esc(playRequestText(x))}</div>`;const mealRow=document.createElement('div');mealRow.id='zrChangeReviewMeal';mealRow.className='zr-review-row full';mealRow.innerHTML=`<span class="zr-review-label">식사 변경</span><div class="zr-review-value">${esc(mealRequestText(x))}</div>`;grid.insertBefore(mealRow,grid.firstChild);grid.insertBefore(playRow,grid.firstChild);grid.insertBefore(bookingRow,grid.firstChild)}
}
function prepareChangeInquiry(){
  const modal=$('inquiryModal');if(!modal)return false;changeMode=true;setModeCopy(true);ensureBookingSelector();ensureChangeExtraFields();populateBookingSelector();const type=$('inqType');if(type){type.value='group';type.dispatchEvent(new Event('change',{bubbles:true}))}
  const manager=norm($('startManager')?.value||$('zrCustomerEntryNameV2')?.value),contact=tel($('startContact')?.value||$('zrCustomerEntryPhoneV2')?.value),name=$('inqName'),mobile=$('inqMobile'),content=$('inqContent');if(name&&manager&&!name.value)name.value=manager;if(mobile&&/^010\d{8}$/.test(contact)&&!mobile.value)mobile.value=contact;
  if(content){if(!content.dataset.zrDefaultPlaceholder)content.dataset.zrDefaultPlaceholder=content.getAttribute('placeholder')||'';content.placeholder='변경 문의 내용을 적어주세요.';if(modal.dataset.zrChangeContentPrepared!=='1'){content.value='';modal.dataset.zrChangeContentPrepared='1'}}
  const b=selectedBooking(),org=$('inqOrgName');if(b?.orgName&&org&&!org.value)org.value=b.orgName;syncChangeExtraFields(false);[60,180,420].forEach(ms=>setTimeout(syncChangePlayAvailability,ms));try{modal.querySelector('.modal-card')?.scrollTo?.({top:0,behavior:'auto'})}catch{}return true;
}
function resetNormalMode(){changeMode=false;setModeCopy(false);extraBookingId='';const modal=$('inquiryModal'),wrap=$('zrChangeBookingField'),extra=$('zrChangeExtraFields'),content=$('inqContent');if(modal)delete modal.dataset.zrChangeContentPrepared;wrap?.classList.add('hidden');extra?.classList.add('hidden');if(content){content.value='';content.placeholder=content.dataset.zrDefaultPlaceholder||'문의 내용을 입력해주세요.'}['zrChangeReviewBooking','zrChangeReviewPlay','zrChangeReviewMeal'].forEach(id=>$(id)?.remove())}
function injectHiddenChangeContext(){
  if(!changeMode)return;const stage=$('zrInquiryFormStage');if(!stage?.classList.contains('hidden'))return;const content=$('inqContent'),b=selectedBooking();if(!content||!b)return;const text=String(content.value||'');if(!text.startsWith('[단체 문의]')||text.includes('\n[예약 변경 정보]\n'))return;
  const re=/^(\[단체 문의\]\n단체명:\s*.*\n방문 희망일:\s*.*\n방문 희망시간:\s*.*\n단체 인원:\s*.*?)(?:\n\n)([\s\S]*)$/,m=text.match(re);if(!m)return;const x=extraRequestSnapshot();const meta=`[예약 변경 정보]\n대상 예약번호: ${b.id||'-'}\n현재 예약일: ${b.date||'-'}\n현재 예약시간: ${b.entryTime||'--:--'} ~ ${b.exitTime||'--:--'}\n놀이터 변경: ${playRequestText(x)}\n식사 변경: ${mealRequestText(x)}`;content.value=`${m[1]}\n\n${meta}\n\n${m[2]}`;
}
function continueChangeRequest(){closeNotice();const btn=$('changeExisting');if(!btn)return;btn.dataset.zrChangeRequestConfirmed='1';try{btn.click()}catch{}[0,40,120].forEach(ms=>setTimeout(prepareChangeInquiry,ms))}
function bind(){
  installStyle();ensureNotice();const btn=$('changeExisting');if(btn)btn.textContent='2. 예약 변경하기';
  document.addEventListener('click',e=>{const change=e.target?.closest?.('#changeExisting');if(change){if(change.dataset.zrChangeRequestConfirmed==='1'){delete change.dataset.zrChangeRequestConfirmed;return}e.preventDefault();e.stopImmediatePropagation();openNotice();return}if(e.target?.closest?.('#inquiryBtn,#zrCustomerEntryInquiryV2')){resetNormalMode();return}if(changeMode&&e.target?.closest?.('#submitInquiry')){if(!validateExtraChanges()){e.preventDefault();e.stopImmediatePropagation();return}injectHiddenChangeContext();setTimeout(decorateReview,0)}if(changeMode&&e.target?.closest?.('[data-close="inquiryModal"]'))setTimeout(resetNormalMode,0)},true);
  document.addEventListener('change',e=>{if(!changeMode)return;const id=e.target?.id||'';if(['inqVisitDate','inqVisitMonth','inqVisitDay','inqVisitTime'].includes(id))setTimeout(syncChangePlayAvailability,0)},true);
  document.addEventListener('zr:reservation-availability-updated',()=>{if(changeMode)setTimeout(syncChangePlayAvailability,0)});
  window.addEventListener('storage',e=>{if(changeMode&&e.key==='zr_bookings')setTimeout(syncChangePlayAvailability,0)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('zrReservationChangeNoticeV1')?.classList.contains('hidden'))closeNotice()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
document.addEventListener('zr:customer-runtime-ready',()=>{const b=$('changeExisting');if(b)b.textContent='2. 예약 변경하기'},{once:true});
})();
