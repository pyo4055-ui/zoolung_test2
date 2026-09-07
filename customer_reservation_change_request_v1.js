(()=>{
'use strict';
if(window.__ZR_CUSTOMER_RESERVATION_CHANGE_REQUEST_V1)return;
window.__ZR_CUSTOMER_RESERVATION_CHANGE_REQUEST_V1=true;
window.__ZR_RESERVATION_CHANGE_DEDICATED_V1=true;

const BOOKING_KEY='zr_bookings';
const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
const tel=v=>String(v||'').replace(/\D/g,'');
let currentBookingId='';
let pendingBookingId='';
let reviewSnapshot=null;

function readBookings(){
  try{const v=JSON.parse(localStorage.getItem(BOOKING_KEY)||'[]');return Array.isArray(v)?v:[]}
  catch{return []}
}
function managerValue(){return norm($('startManager')?.value||$('zrCustomerEntryNameV2')?.value)}
function contactValue(){return tel($('startContact')?.value||$('zrCustomerEntryPhoneV2')?.value)}
function matchingBookings(){
  const manager=managerValue(),contact=contactValue();
  if(!manager||!contact)return [];
  return readBookings().filter(b=>b&&!b.__availabilityOnly&&norm(b.managerName)===manager&&tel(b.contact)===contact&&!['cancelled','rejected'].includes(String(b.status||'')));
}
function bookingById(id){return readBookings().find(b=>b&&!b.__availabilityOnly&&String(b.id||'')===String(id||''))||null}
function selectedBooking(){return bookingById(currentBookingId)}
function timeToMin(v){const m=/^(\d{2}):(\d{2})$/.exec(String(v||''));return m?Number(m[1])*60+Number(m[2]):NaN}
function minToTime(n){if(!Number.isFinite(n)||n<0||n>=1440)return'';return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
function pad2(n){return String(n).padStart(2,'0')}
function localToday(){const d=new Date();return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`}
function mealLabel(v){return ({lunchbox:'도시락 지참',cafe:'내부 카페 주문',none:'식사 안 함'})[String(v||'none')]||'식사 안 함'}
function playLabel(v){return String(v||'no')==='yes'?'이용함':'이용 안 함'}
function statusLabel(v){const s=String(v||'pending');if(s==='confirmed')return'확정';if(s==='hold')return'보류';if(s==='completed')return'완료';return'접수'}
function rangeDuration(start,end,allowed,fallback){
  const s=timeToMin(start),e=timeToMin(end),d=e-s;
  return Number.isFinite(s)&&Number.isFinite(e)&&e>s&&allowed.includes(d)?d:fallback;
}
function optionTimeValues(id){
  const el=$(id);if(!el||el.tagName!=='SELECT')return [];
  return [...new Set([...el.options].map(o=>String(o.value||'').trim()).filter(v=>/^\d{2}:\d{2}$/.test(v)))].sort();
}
function generatedTimes(start=10*60+30,end=18*60){
  const out=[];for(let m=start;m<=end;m+=30)out.push(minToTime(m));return out;
}
function entryValues(){const native=optionTimeValues('entryTime');return native.length?native:generatedTimes()}
function playgroundBaseValues(){const native=optionTimeValues('playStart');return native.length?native:entryValues()}
function requestDate(){const month=String($('zrChangeVisitMonth')?.value||''),day=String($('zrChangeVisitDay')?.value||'');return month&&day?`${month}-${day}`:''}
function requestEntry(){return String($('zrChangeEntryTime')?.value||'')}
function requestExit(){return String($('zrChangeExitTime')?.value||'')}

function toastSafe(msg){
  try{if(typeof window.toast==='function'){window.toast(msg);return}}catch{}
  try{alert(msg)}catch{}
}
function clearInvalid(){
  $('zrReservationChangeForm')?.querySelectorAll('.zr-change-invalid').forEach(el=>el.classList.remove('zr-change-invalid'));
  $('zrChangeFormError')?.classList.add('hidden');
}
function failForm(message,control){
  showStage('form');clearInvalid();
  const target=typeof control==='string'?$(control):control;
  if(target){target.classList.add('zr-change-invalid');target.closest('.zr-change-field,.zr-change-section')?.classList.add('zr-change-invalid')}
  const box=$('zrChangeFormError');if(box){box.textContent=message;box.classList.remove('hidden')}
  toastSafe(message);
  setTimeout(()=>{try{target?.scrollIntoView?.({behavior:'smooth',block:'center'});target?.focus?.({preventScroll:true})}catch{}},40);
  return null;
}

function ensureStyle(){
  if($('zrReservationChangeDedicatedStyleV1'))return;
  const s=document.createElement('style');s.id='zrReservationChangeDedicatedStyleV1';s.textContent=`
  #zrReservationChangeSelectV1{z-index:2147483480}
  #zrReservationChangeSelectV1.hidden,#zrReservationChangeNoticeV1.hidden,#zrReservationChangeModalV1.hidden{display:none!important}
  #zrReservationChangeSelectV1 .zr-change-select-sheet{width:min(620px,100%);max-height:min(92vh,860px);padding:18px;overflow:auto;background:#fff;color:#35261f;border-radius:18px;box-shadow:0 24px 80px rgba(0,0,0,.26);-webkit-overflow-scrolling:touch}
  #zrReservationChangeSelectV1 .zr-change-select-head{display:flex;align-items:center;gap:10px;margin-bottom:8px}
  #zrReservationChangeSelectV1 .zr-change-select-head h2{margin:0;flex:1;font-size:20px;color:#38271e}
  #zrReservationChangeSelectV1 .zr-change-select-close{border:1px solid #f1bcbc;border-radius:9px;padding:8px 11px;background:#ffe7e7;color:#913535;font-weight:900;cursor:pointer}
  #zrReservationChangeSelectV1 .zr-change-select-head:has(.zr-modal-ux-title-source){display:none!important}
  #zrReservationChangeSelectV1 .zr-modal-ux-header{margin-bottom:12px!important;background:#fff!important;color:#38271e!important;border-bottom:1px solid #e9e1dc!important}
  #zrReservationChangeSelectV1 .zr-modal-ux-header-close{border-color:#f1bcbc!important;background:#ffe7e7!important;color:#913535!important}
  #zrReservationChangeSelectV1 .zr-change-select-help{margin:0 0 14px;color:#6d5b52;font-size:13px;line-height:1.6}
  #zrReservationChangeSelectV1 .zr-change-select-list{display:grid;gap:10px}
  #zrReservationChangeSelectV1 .zr-change-select-item{border:1px solid #e6ddd6;border-radius:13px;padding:13px;background:#fff}
  #zrReservationChangeSelectV1 .zr-change-select-item-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  #zrReservationChangeSelectV1 .zr-change-select-item-head b{font-size:16px;color:#38271e}
  #zrReservationChangeSelectV1 .zr-change-select-status{display:inline-flex;align-items:center;padding:3px 8px;border-radius:999px;background:#edf5f0;color:#2f6b4f;font-size:11px;font-weight:900}
  #zrReservationChangeSelectV1 .zr-change-select-meta{display:grid;grid-template-columns:1fr 1fr;gap:8px 12px;margin-top:10px}
  #zrReservationChangeSelectV1 .zr-change-select-meta div{font-size:13px;color:#4b403a;line-height:1.45}
  #zrReservationChangeSelectV1 .zr-change-select-meta span{display:block;margin-bottom:2px;color:#82746d;font-size:10px;font-weight:850}
  #zrReservationChangeSelectV1 .zr-change-select-action{display:flex;justify-content:flex-end;margin-top:12px}
  #zrReservationChangeSelectV1 .zr-change-select-action button{min-height:42px;border:1px solid #fc5404;border-radius:10px;padding:0 14px;background:#fc5404;color:#fff;font:inherit;font-size:13px;font-weight:900;cursor:pointer;touch-action:manipulation}
  #zrReservationChangeNoticeV1{position:fixed;inset:0;z-index:2147483500;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;background:rgba(44,28,20,.72)}
  #zrReservationChangeNoticeV1 .zr-change-notice-card{width:min(510px,100%);overflow:hidden;border:1px solid rgba(91,52,36,.12);border-radius:20px;background:#fff;box-shadow:0 28px 90px rgba(26,14,9,.30)}
  #zrReservationChangeNoticeV1 .zr-change-notice-head{padding:18px 22px;background:#fff;color:#38271e;border-bottom:1px solid #e9e1dc;font-size:20px;font-weight:950}
  #zrReservationChangeNoticeV1 .zr-change-notice-body{padding:21px 22px 8px;color:#493a32;font-size:14px;line-height:1.72;word-break:keep-all}
  #zrReservationChangeNoticeV1 .zr-change-notice-body strong{display:block;margin-bottom:10px;color:#651012;font-size:15px}
  #zrReservationChangeNoticeV1 .zr-change-notice-points{margin:0;padding-left:19px}#zrReservationChangeNoticeV1 .zr-change-notice-points li{margin:7px 0}
  #zrReservationChangeNoticeV1 .zr-change-notice-actions{display:grid;grid-template-columns:1fr 1.35fr;gap:9px;padding:15px 22px 22px}
  #zrReservationChangeNoticeV1 button{min-height:50px;border-radius:12px;font:inherit;font-size:14px;font-weight:900;cursor:pointer}
  #zrReservationChangeNoticeCancel{border:1px solid #f1bcbc;background:#ffe7e7;color:#913535}#zrReservationChangeNoticeConfirm{border:1px solid #fc5404;background:#fc5404;color:#fff}
  #zrReservationChangeModalV1{z-index:2147483450}
  #zrReservationChangeModalV1 .modal-card{width:min(760px,100%);max-height:min(92vh,920px);padding:0;overflow:auto;background:#fff;color:#35261f;border-radius:20px}
  #zrReservationChangeModalV1 .zr-change-modal-head{position:sticky;top:0;z-index:4;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;background:#fff;color:#38271e;border-bottom:1px solid #e9e1dc;box-shadow:none}
  #zrReservationChangeModalV1 .zr-change-modal-head h2{margin:0;font-size:20px;color:#38271e}
  #zrReservationChangeModalV1 .zr-change-modal-head:has(.zr-modal-ux-title-source){display:none!important}
  #zrReservationChangeModalV1 .zr-change-close{border:1px solid #f1bcbc;background:#ffe7e7;color:#913535;border-radius:10px;padding:9px 13px;font-weight:900;cursor:pointer}
  #zrReservationChangeModalV1 .zr-modal-ux-header{margin-bottom:0!important;border-bottom:1px solid #e9e1dc!important;background:#fff!important;color:#38271e!important}
  #zrReservationChangeModalV1 .zr-modal-ux-header-close{border-color:#f1bcbc!important;background:#ffe7e7!important;color:#913535!important}
  #zrReservationChangeModalV1 .zr-change-stage{padding:17px 18px 22px}
  #zrReservationChangeModalV1 .zr-change-intro{margin:0 0 14px;color:#6d5b52;font-size:13px;line-height:1.6}
  #zrReservationChangeModalV1 .zr-change-target{margin:0 0 14px;padding:12px 14px;border:1px solid #eadfd8;border-radius:12px;background:#faf7f5;color:#56463d;font-size:12px;line-height:1.55}
  #zrReservationChangeModalV1 .zr-change-target b{display:block;margin-top:3px;color:#38271e;font-size:14px}
  #zrReservationChangeModalV1 .zr-change-section{margin:0 0 14px;padding:14px;border:1px solid #e6ddd6;border-radius:14px;background:#fff}
  #zrReservationChangeModalV1 .zr-change-section-title{margin:0 0 11px;font-size:15px;font-weight:950;color:#46342b}
  #zrReservationChangeModalV1 .zr-change-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  #zrReservationChangeModalV1 .zr-change-date-grid{display:grid;grid-template-columns:1.35fr .65fr;gap:8px}
  #zrReservationChangeModalV1 .zr-change-field label{display:block;margin:0 0 6px;font-size:12.5px;font-weight:900;color:#49372e}
  #zrReservationChangeModalV1 .zr-change-field label.req:after{content:' *';color:#b23838}
  #zrReservationChangeModalV1 select,#zrReservationChangeModalV1 input,#zrReservationChangeModalV1 textarea{width:100%;box-sizing:border-box;border:1px solid #d7cdc6;border-radius:11px;background:#fff;color:#2d2520;font:inherit;font-size:14px}
  #zrReservationChangeModalV1 select,#zrReservationChangeModalV1 input{height:50px;min-height:50px;padding:0 12px}
  #zrReservationChangeModalV1 textarea{min-height:96px;padding:12px;resize:vertical;line-height:1.55}
  #zrReservationChangeModalV1 input[disabled]{background:#f5f3f1;color:#6c625d;opacity:1;-webkit-text-fill-color:#6c625d}
  #zrReservationChangeModalV1 .zr-change-help{margin-top:6px;color:#756a64;font-size:11.5px;line-height:1.5}
  #zrReservationChangeModalV1 .zr-change-current{margin-top:8px;padding:8px 10px;border-radius:9px;background:#f7f5f2;color:#64584f;font-size:11.5px;line-height:1.5}
  #zrReservationChangeModalV1 .zr-change-subfields{margin-top:10px;padding-top:10px;border-top:1px dashed #e5ddd7}
  #zrReservationChangeModalV1 .zr-change-form-error{margin:0 0 12px;padding:10px 12px;border:1px solid #e3a7a7;border-radius:10px;background:#fff0f0;color:#9c3434;font-size:12.5px;font-weight:850;line-height:1.55}
  #zrReservationChangeModalV1 .zr-change-invalid{border-color:#d94a4a!important;background:#fff3f3!important;box-shadow:0 0 0 2px rgba(217,74,74,.09)}
  #zrReservationChangeModalV1 .zr-change-section.zr-change-invalid{padding:13px}
  #zrReservationChangeModalV1 .zr-change-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
  #zrReservationChangeModalV1 .zr-change-actions button{min-height:48px;border-radius:11px;padding:0 16px;font:inherit;font-size:14px;font-weight:900;cursor:pointer}
  #zrReservationChangeModalV1 .zr-change-primary{border:1px solid #fc5404;background:#fc5404;color:#fff}
  #zrReservationChangeModalV1 .zr-change-secondary{border:1px solid #e5bcbc;background:#ffeaea;color:#8d3f3f}
  #zrReservationChangeModalV1 .zr-change-review-card{border:1px solid #e5ddd7;border-radius:14px;background:#fff;padding:2px 14px}
  #zrReservationChangeModalV1 .zr-change-review-row{padding:11px 0;border-bottom:1px solid #eee8e4}.zr-change-review-row:last-child{border-bottom:0}
  #zrReservationChangeModalV1 .zr-change-review-row span{display:block;margin-bottom:4px;color:#7a6a61;font-size:11px;font-weight:800}
  #zrReservationChangeModalV1 .zr-change-review-row b{display:block;color:#38271e;font-size:14px;line-height:1.5;white-space:pre-wrap}
  #zrReservationChangeModalV1 .zr-change-complete{text-align:center;padding:32px 18px 36px}
  #zrReservationChangeModalV1 .zr-change-complete-mark{display:flex;width:58px;height:58px;align-items:center;justify-content:center;margin:0 auto 14px;border-radius:50%;background:#e9f3ed;color:#2f6b4f;font-size:28px;font-weight:950}
  #zrReservationChangeModalV1 .zr-change-complete h3{margin:0 0 9px;font-size:20px;color:#38271e}.zr-change-complete p{margin:0 auto;max-width:520px;color:#6e6058;font-size:13px;line-height:1.65}
  @media(max-width:720px){#zrReservationChangeSelectV1 .zr-change-select-sheet{padding:15px}#zrReservationChangeSelectV1 .zr-change-select-meta{grid-template-columns:1fr}#zrReservationChangeSelectV1 .zr-change-select-action button{width:100%;min-height:46px;font-size:14px}#zrReservationChangeModalV1{padding:10px}#zrReservationChangeModalV1 .modal-card{max-height:94svh;border-radius:18px}#zrReservationChangeModalV1 .zr-change-modal-head{padding:14px 15px}#zrReservationChangeModalV1 .zr-change-modal-head h2{font-size:18px}#zrReservationChangeModalV1 .zr-change-stage{padding:14px 14px 20px}#zrReservationChangeModalV1 .zr-change-grid2{grid-template-columns:1fr}#zrReservationChangeModalV1 .zr-change-date-grid{grid-template-columns:minmax(0,1.35fr) minmax(92px,.65fr)}#zrReservationChangeModalV1 select,#zrReservationChangeModalV1 input{height:50px!important;min-height:50px!important;max-height:50px!important;padding-top:0!important;padding-bottom:0!important}#zrReservationChangeModalV1 .zr-change-actions{display:grid;grid-template-columns:1fr 1.35fr}#zrReservationChangeModalV1 .zr-change-actions button{width:100%}}
  @media(max-width:430px){#zrReservationChangeNoticeV1{padding:10px}#zrReservationChangeNoticeV1 .zr-change-notice-actions{grid-template-columns:1fr;padding:12px 17px 18px}#zrReservationChangeModalV1 .zr-change-date-grid{grid-template-columns:1fr 90px}}
  `;document.head.appendChild(s);
}

function activeChangeBookings(){return matchingBookings().filter(b=>!['cancelled','rejected'].includes(String(b.status||'')))}
function changeChoiceHtml(b){
  return `<section class="zr-change-select-item"><div class="zr-change-select-item-head"><span class="zr-change-select-status">${esc(statusLabel(b.status))}</span><b>${esc(b.orgName||'단체 예약')}</b></div><div class="zr-change-select-meta"><div><span>방문일</span>${esc(b.date||'-')}</div><div><span>방문시간</span>${esc(b.entryTime||'--:--')} ~ ${esc(b.exitTime||'--:--')}</div></div><div class="zr-change-select-action"><button type="button" data-zr-change-select="${esc(b.id||'')}">이 예약 변경하기</button></div></section>`;
}
function ensureChangeSelect(){
  let modal=$('zrReservationChangeSelectV1');if(modal)return modal;
  modal=document.createElement('div');modal.id='zrReservationChangeSelectV1';modal.className='modal zr-change-select-modal hidden';
  modal.innerHTML='<div class="modal-card zr-change-select-sheet" role="dialog" aria-modal="true" aria-labelledby="zrReservationChangeSelectTitle"><div class="zr-change-select-head"><h2 id="zrReservationChangeSelectTitle">예약 변경하기</h2><button type="button" class="zr-change-select-close">닫기</button></div><p class="zr-change-select-help">변경하실 예약의 ‘이 예약 변경하기’ 버튼을 눌러주세요.</p><div class="zr-change-select-list" id="zrReservationChangeSelectList"></div></div>';
  document.body.appendChild(modal);
  modal.querySelector('.zr-change-select-close').onclick=closeChangeSelect;
  modal.addEventListener('click',e=>{
    if(e.target===modal){closeChangeSelect();return}
    const btn=e.target?.closest?.('[data-zr-change-select]');if(!btn)return;
    const id=String(btn.dataset.zrChangeSelect||'');closeChangeSelect();openNotice(id);
  });
  return modal;
}
function openChangeSelect(){
  const rows=activeChangeBookings();if(!rows.length){toastSafe('변경할 수 있는 예약 내역이 없습니다.');return}
  const modal=ensureChangeSelect(),list=$('zrReservationChangeSelectList');
  const ordered=[...rows].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.entryTime||'').localeCompare(String(b.entryTime||'')));
  list.innerHTML=ordered.map(changeChoiceHtml).join('');modal.classList.remove('hidden');try{window.__ZR_MODAL_UX_SYNC_HEADERS?.()}catch{}
}
function closeChangeSelect(){$('zrReservationChangeSelectV1')?.classList.add('hidden');try{window.__ZR_MODAL_UX_SYNC_HEADERS?.()}catch{}}

function ensureNotice(){
  let modal=$('zrReservationChangeNoticeV1');if(modal)return modal;
  modal=document.createElement('div');modal.id='zrReservationChangeNoticeV1';modal.className='hidden';
  modal.innerHTML=`<div class="zr-change-notice-card" role="dialog" aria-modal="true" aria-labelledby="zrReservationChangeNoticeTitle"><div class="zr-change-notice-head" id="zrReservationChangeNoticeTitle">예약 변경 전 확인</div><div class="zr-change-notice-body"><strong>예약 변경 요청은 즉시 예약이 변경되는 기능이 아닙니다.</strong><ul class="zr-change-notice-points"><li>변경 요청 날짜의 예약 현황에 따라 변경이 불가할 수 있습니다.</li><li>놀이터 변경 요청은 접수 즉시 해당 시간의 예약 가능 여부에 반영됩니다.</li><li>변경이 확정되면 예약 확정 문자를 다시 보내드립니다.</li></ul><div style="margin-top:13px">위 내용을 확인하고 예약 변경 요청을 작성하시겠습니까?</div></div><div class="zr-change-notice-actions"><button type="button" id="zrReservationChangeNoticeCancel">아니오</button><button type="button" id="zrReservationChangeNoticeConfirm">확인하고 변경하기</button></div></div>`;
  document.body.appendChild(modal);
  $('zrReservationChangeNoticeCancel').onclick=()=>{pendingBookingId='';closeNotice()};
  $('zrReservationChangeNoticeConfirm').onclick=()=>{const id=pendingBookingId;closeNotice();openChangeModal(id)};
  return modal;
}
function openNotice(bookingId){
  const b=bookingById(bookingId);if(!b){toastSafe('변경할 예약 정보를 다시 확인해주세요.');return}
  pendingBookingId=String(b.id||'');ensureNotice().classList.remove('hidden');try{window.__ZR_MODAL_UX_SYNC_HEADERS?.()}catch{}
}
function closeNotice(){$('zrReservationChangeNoticeV1')?.classList.add('hidden');try{window.__ZR_MODAL_UX_SYNC_HEADERS?.()}catch{}}

function ensureModal(){
  let modal=$('zrReservationChangeModalV1');if(modal)return modal;
  modal=document.createElement('div');modal.id='zrReservationChangeModalV1';modal.className='modal hidden';
  modal.innerHTML=`<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="zrChangeModalTitle"><div class="zr-change-modal-head"><h2 id="zrChangeModalTitle">예약 변경 요청</h2><button type="button" class="zr-change-close" id="zrChangeModalClose">닫기</button></div><div id="zrReservationChangeForm" class="zr-change-stage"><p class="zr-change-intro">현재 예약값을 불러왔습니다. 예약접수와 같은 방식으로 변경할 날짜와 시간을 선택해주세요.</p><div class="zr-change-target"><span>변경 대상 예약</span><b id="zrChangeTargetBooking">-</b></div><div id="zrChangeFormError" class="zr-change-form-error hidden"></div><section class="zr-change-section"><div class="zr-change-section-title">방문 희망일 및 시간</div><div class="zr-change-grid2"><div class="zr-change-field"><label class="req">예약변경날짜</label><div class="zr-change-date-grid"><select id="zrChangeVisitMonth"><option value="">월 선택</option></select><select id="zrChangeVisitDay" disabled><option value="">일 선택</option></select></div></div><div class="zr-change-field"><label class="req" for="zrChangeEntryTime">입장시간</label><select id="zrChangeEntryTime"><option value="">입장시간 선택</option></select></div><div class="zr-change-field"><label class="req" for="zrChangeExitTime">퇴장시간</label><select id="zrChangeExitTime"><option value="">퇴장시간 선택</option></select><div class="zr-change-help">30분 단위 · 식사 안 함 최대 3시간 / 식사 이용 최대 4시간</div></div></div></section><section class="zr-change-section"><div class="zr-change-section-title">식사</div><div class="zr-change-field"><label class="req" for="zrChangeMealMode">식사 선택</label><select id="zrChangeMealMode"><option value="lunchbox">도시락 지참</option><option value="cafe">내부 카페 주문</option><option value="none">식사 안 함</option></select><div class="zr-change-current" id="zrChangeMealCurrent"></div></div><div class="zr-change-subfields" id="zrChangeMealFields"><div class="zr-change-grid2"><div class="zr-change-field"><label class="req" for="zrChangeMealStart">식사 시작시간</label><select id="zrChangeMealStart"><option value="">시작시간 선택</option></select></div><div class="zr-change-field"><label class="req" for="zrChangeMealDuration">식사 이용시간</label><select id="zrChangeMealDuration"><option value="">선택</option><option value="30">30분</option><option value="45">45분</option><option value="60">60분</option></select></div><div class="zr-change-field"><label for="zrChangeMealEnd">식사 종료시간</label><input id="zrChangeMealEnd" disabled placeholder="자동계산"></div></div></div></section><section class="zr-change-section"><div class="zr-change-section-title">놀이터 예약</div><div class="zr-change-field"><label class="req" for="zrChangePlayMode">놀이터 이용 여부</label><select id="zrChangePlayMode"><option value="yes">이용함</option><option value="no">이용 안 함</option></select><div class="zr-change-current" id="zrChangePlayCurrent"></div></div><div class="zr-change-subfields" id="zrChangePlayFields"><div class="zr-change-grid2"><div class="zr-change-field"><label class="req" for="zrChangePlayStart">놀이터 시작시간</label><select id="zrChangePlayStart"><option value="">시작시간 선택</option></select><div class="zr-change-help" id="zrChangePlayHelp">변경 입장시간 이후의 예약 가능한 시간만 선택할 수 있습니다.</div></div><div class="zr-change-field"><label class="req" for="zrChangePlayDuration">놀이터 이용시간</label><select id="zrChangePlayDuration"><option value="">선택</option><option value="30">30분</option><option value="60">60분</option></select></div><div class="zr-change-field"><label for="zrChangePlayEnd">놀이터 종료시간</label><input id="zrChangePlayEnd" disabled placeholder="자동계산"></div></div></div></section><section class="zr-change-section"><div class="zr-change-section-title">변경 요청사항 <span style="font-size:11px;font-weight:700;color:#84756c">(선택)</span></div><div class="zr-change-field"><textarea id="zrChangeNotes" placeholder="담당자에게 전달할 내용이 있으면 입력해주세요."></textarea></div></section><div class="zr-change-actions"><button type="button" class="zr-change-secondary" id="zrChangeFormCancel">취소</button><button type="button" class="zr-change-primary" id="zrChangeReviewOpen">변경내용 확인</button></div></div><div id="zrReservationChangeReview" class="zr-change-stage hidden"><p class="zr-change-intro">아래 내용으로 예약 변경을 요청합니다. 아직 예약이 확정 변경된 것은 아닙니다.</p><div class="zr-change-review-card" id="zrChangeReviewCard"></div><div class="zr-change-actions"><button type="button" class="zr-change-secondary" id="zrChangeReviewEdit">수정하기</button><button type="button" class="zr-change-primary" id="zrChangeSubmit">변경 요청 접수하기</button></div></div><div id="zrReservationChangeComplete" class="zr-change-complete hidden"><div class="zr-change-complete-mark">✓</div><h3>예약 변경 요청이 접수됐습니다.</h3><p>아직 예약이 변경된 것은 아닙니다. 담당자가 가능 여부를 확인한 뒤 안내드리며, 변경이 확정되면 예약 확정 문자를 다시 보내드립니다.</p><div class="zr-change-actions" style="justify-content:center;margin-top:22px"><button type="button" class="zr-change-primary" id="zrChangeCompleteClose">확인</button></div></div></div>`;
  document.body.appendChild(modal);
  $('zrChangeModalClose').onclick=closeChangeModal;
  $('zrChangeFormCancel').onclick=closeChangeModal;
  $('zrChangeCompleteClose').onclick=closeChangeModal;
  $('zrChangeReviewEdit').onclick=()=>showStage('form');
  $('zrChangeReviewOpen').onclick=openReview;
  $('zrChangeSubmit').onclick=submitChangeRequest;
  $('zrChangeVisitMonth').addEventListener('change',()=>{fillDays('',true);refreshPlayOptions();syncMealOptions()});
  $('zrChangeVisitDay').addEventListener('change',()=>{refreshPlayOptions();syncMealOptions()});
  $('zrChangeEntryTime').addEventListener('change',()=>{fillExitOptions('',true);refreshPlayOptions();syncMealOptions()});
  $('zrChangeExitTime').addEventListener('change',()=>{refreshPlayOptions();syncMealOptions()});
  $('zrChangeMealMode').addEventListener('change',()=>{syncMealVisibility();fillExitOptions(String($('zrChangeExitTime')?.value||''),true);syncMealOptions()});
  $('zrChangeMealStart').addEventListener('change',syncMealEnd);
  $('zrChangeMealDuration').addEventListener('change',syncMealEnd);
  $('zrChangePlayMode').addEventListener('change',()=>{syncPlayVisibility();refreshPlayOptions()});
  $('zrChangePlayDuration').addEventListener('change',()=>refreshPlayOptions(String($('zrChangePlayStart')?.value||'')));
  $('zrChangePlayStart').addEventListener('change',syncPlayEnd);
  return modal;
}
function showStage(name){
  $('zrReservationChangeForm')?.classList.toggle('hidden',name!=='form');
  $('zrReservationChangeReview')?.classList.toggle('hidden',name!=='review');
  $('zrReservationChangeComplete')?.classList.toggle('hidden',name!=='complete');
  const card=$('zrReservationChangeModalV1')?.querySelector('.modal-card');setTimeout(()=>{try{card?.scrollTo?.({top:0,behavior:'auto'})}catch{}},0);
}
function openChangeModal(bookingId){
  const booking=bookingById(bookingId);if(!booking){toastSafe('변경할 예약 정보를 다시 확인해주세요.');return}
  const modal=ensureModal();currentBookingId=String(booking.id||'');pendingBookingId='';loadBookingDefaults(booking);showStage('form');clearInvalid();reviewSnapshot=null;
  const target=$('zrChangeTargetBooking');if(target)target.textContent=`${booking.date||'-'} · ${booking.entryTime||'--:--'}~${booking.exitTime||'--:--'} · ${booking.orgName||'단체 예약'}`;
  modal.classList.remove('hidden');try{window.__ZR_MODAL_UX_SYNC_HEADERS?.()}catch{}
  const card=modal.querySelector('.modal-card');setTimeout(()=>{try{card?.scrollTo?.({top:0,behavior:'auto'})}catch{}},0);
}
function closeChangeModal(){
  $('zrReservationChangeModalV1')?.classList.add('hidden');pendingBookingId='';reviewSnapshot=null;clearInvalid();try{window.__ZR_MODAL_UX_SYNC_HEADERS?.()}catch{}
}

function fillMonths(preferred=''){
  const sel=$('zrChangeVisitMonth');if(!sel)return;
  const native=$('visitMonth'),nativeOpts=native?.tagName==='SELECT'?[...native.options].filter(o=>/^\d{4}-\d{2}$/.test(String(o.value||''))):[];
  const rows=nativeOpts.length?nativeOpts.map(o=>({value:String(o.value),text:String(o.textContent||o.value),disabled:!!o.disabled})):(()=>{const out=[],now=new Date();for(let i=0;i<18;i++){const d=new Date(now.getFullYear(),now.getMonth()+i,1),v=`${d.getFullYear()}-${pad2(d.getMonth()+1)}`;out.push({value:v,text:`${d.getFullYear()}년 ${d.getMonth()+1}월`,disabled:false})}return out})();
  sel.innerHTML='<option value="">월 선택</option>'+rows.map(x=>`<option value="${x.value}"${x.disabled?' disabled':''}>${esc(x.text)}</option>`).join('');
  if(preferred&&[...sel.options].some(o=>o.value===preferred&&!o.disabled))sel.value=preferred;else sel.value='';
}
function fillDays(preferred='',preserve=false){
  const month=String($('zrChangeVisitMonth')?.value||''),sel=$('zrChangeVisitDay');if(!sel)return;
  const current=preserve?String(sel.value||''):preferred;
  if(!/^\d{4}-\d{2}$/.test(month)){sel.innerHTML='<option value="">일 선택</option>';sel.disabled=true;return}
  const [year,mon]=month.split('-').map(Number),last=new Date(year,mon,0).getDate(),today=localToday();
  const native=$('visitDay'),nativeRows=native?.tagName==='SELECT'?[...native.options].filter(o=>DATE_RE.test(String(o.value||''))&&String(o.value).startsWith(month+'-')):[];
  const rows=nativeRows.length?nativeRows.map(o=>({day:String(o.value).slice(8,10),text:String(o.textContent||`${Number(String(o.value).slice(8,10))}일`),disabled:!!o.disabled||String(o.value)<=today})):(()=>{const out=[];for(let d=1;d<=last;d++){const dd=pad2(d),full=`${month}-${dd}`;out.push({day:dd,text:`${d}일`,disabled:full<=today})}return out})();
  sel.innerHTML='<option value="">일 선택</option>'+rows.map(x=>`<option value="${x.day}"${x.disabled?' disabled':''}>${esc(x.text)}</option>`).join('');sel.disabled=false;
  if(current&&[...sel.options].some(o=>o.value===current&&!o.disabled))sel.value=current;else sel.value='';
}
function fillEntryOptions(preferred=''){
  const sel=$('zrChangeEntryTime');if(!sel)return;const vals=entryValues();
  sel.innerHTML='<option value="">입장시간 선택</option>'+vals.map(v=>`<option value="${v}">${v}</option>`).join('');
  if(preferred&&[...sel.options].some(o=>o.value===preferred))sel.value=preferred;else sel.value='';
}
function maxVisitMinutes(){return String($('zrChangeMealMode')?.value||'none')==='none'?180:240}
function fillExitOptions(preferred='',cascade=false){
  const sel=$('zrChangeExitTime');if(!sel)return;const entry=timeToMin(requestEntry()),max=maxVisitMinutes(),vals=[];
  if(Number.isFinite(entry))for(let m=entry+30;m<=Math.min(entry+max,23*60+30);m+=30)vals.push(minToTime(m));
  if(preferred&&Number.isFinite(entry)){const pm=timeToMin(preferred);if(Number.isFinite(pm)&&pm>entry&&pm-entry<=max&&!vals.includes(preferred))vals.push(preferred)}
  vals.sort();sel.innerHTML='<option value="">퇴장시간 선택</option>'+vals.map(v=>`<option value="${v}">${v}</option>`).join('');
  if(preferred&&vals.includes(preferred))sel.value=preferred;else if(vals.length)sel.value=vals[vals.length-1];else sel.value='';
  if(cascade){syncMealOptions();refreshPlayOptions()}
}
function fillMealStartOptions(preferred=''){
  const sel=$('zrChangeMealStart');if(!sel)return;const entry=timeToMin(requestEntry()),exit=timeToMin(requestExit()),vals=[];
  if(Number.isFinite(entry)&&Number.isFinite(exit))for(let m=entry;m<=exit-30;m+=30)vals.push(minToTime(m));
  sel.innerHTML='<option value="">시작시간 선택</option>'+vals.map(v=>`<option value="${v}">${v}</option>`).join('');
  if(preferred&&vals.includes(preferred))sel.value=preferred;else sel.value='';
}
function syncMealVisibility(){$('zrChangeMealFields')?.classList.toggle('hidden',String($('zrChangeMealMode')?.value||'none')==='none')}
function syncMealOptions(preferredStart){
  const meal=String($('zrChangeMealMode')?.value||'none');syncMealVisibility();
  if(meal==='none'){$('zrChangeMealStart').value='';$('zrChangeMealDuration').value='';$('zrChangeMealEnd').value='';return}
  const current=preferredStart!==undefined?String(preferredStart||''):String($('zrChangeMealStart')?.value||'');fillMealStartOptions(current);syncMealEnd();
}
function syncMealEnd(){
  const start=timeToMin($('zrChangeMealStart')?.value),duration=Number($('zrChangeMealDuration')?.value||0),exit=timeToMin(requestExit());
  const end=Number.isFinite(start)&&[30,45,60].includes(duration)?start+duration:NaN;
  $('zrChangeMealEnd').value=Number.isFinite(end)&&end<=exit?minToTime(end):'';
}

function sameSource(row,bookingId){if(!bookingId)return false;return String(row?.id||'')===String(bookingId)||String(row?.sourceBookingId||'')===String(bookingId)}
function playgroundOccupancies(date,bookingId){
  return readBookings().filter(row=>{
    if(!row||sameSource(row,bookingId)||String(row.date||'')!==date)return false;
    if(['cancelled','rejected'].includes(String(row.status||'')))return false;
    if(String(row.playUse||'no')!=='yes')return false;
    const s=timeToMin(row.playStart),e=timeToMin(row.playEnd);return Number.isFinite(s)&&Number.isFinite(e)&&e>s;
  }).map(row=>({start:timeToMin(row.playStart),end:timeToMin(row.playEnd)}));
}
function playSlotState(start,duration){
  const date=requestDate(),booking=selectedBooking(),sm=timeToMin(start),mins=Number(duration||0),entry=timeToMin(requestEntry()),exit=timeToMin(requestExit());
  if(!DATE_RE.test(date)||!booking||!Number.isFinite(sm)||![30,60].includes(mins)||!Number.isFinite(entry)||!Number.isFinite(exit))return {ok:false,reason:'range'};
  const end=sm+mins;if(sm<entry||end>exit)return {ok:false,reason:'range'};
  const conflict=playgroundOccupancies(date,String(booking.id||'')).some(x=>sm<x.end&&end>x.start);
  return conflict?{ok:false,reason:'full'}:{ok:true,reason:''};
}
function syncPlayVisibility(){$('zrChangePlayFields')?.classList.toggle('hidden',String($('zrChangePlayMode')?.value||'no')!=='yes')}
function refreshPlayOptions(preferred){
  const use=String($('zrChangePlayMode')?.value||'no'),sel=$('zrChangePlayStart');if(!sel)return;syncPlayVisibility();
  if(use!=='yes'){sel.innerHTML='<option value="">시작시간 선택</option>';$('zrChangePlayEnd').value='';return}
  const current=preferred!==undefined?String(preferred||''):String(sel.value||''),entry=timeToMin(requestEntry()),exit=timeToMin(requestExit()),duration=Number($('zrChangePlayDuration')?.value||0),date=requestDate();
  if(!DATE_RE.test(date)||!Number.isFinite(entry)||!Number.isFinite(exit)){
    sel.innerHTML='<option value="">날짜·입장·퇴장시간을 먼저 선택해주세요</option>';sel.value='';$('zrChangePlayEnd').value='';return;
  }
  const base=playgroundBaseValues().filter(v=>{const m=timeToMin(v);return Number.isFinite(m)&&m>=entry&&m<exit});let available=0;
  sel.innerHTML='<option value="">시작시간 선택</option>'+base.map(v=>{
    const state=[30,60].includes(duration)?playSlotState(v,duration):{ok:true,reason:''};if(state.ok)available++;
    const suffix=state.reason==='full'?' (마감)':state.reason==='range'?' (이용시간 확인)':'';
    return `<option value="${v}"${state.ok?'':' disabled'}>${v}${suffix}</option>`;
  }).join('');
  if(current&&[...sel.options].some(o=>o.value===current&&!o.disabled))sel.value=current;else sel.value='';syncPlayEnd();
  const help=$('zrChangePlayHelp');if(help)help.textContent=available?'변경 입장시간 이후의 예약 가능한 시간만 선택할 수 있습니다. 마감된 시간은 선택할 수 없습니다.':'현재 조건에서 선택 가능한 놀이터 시간이 없습니다.';
}
function syncPlayEnd(){
  const start=timeToMin($('zrChangePlayStart')?.value),duration=Number($('zrChangePlayDuration')?.value||0),exit=timeToMin(requestExit()),end=Number.isFinite(start)&&[30,60].includes(duration)?start+duration:NaN;
  $('zrChangePlayEnd').value=Number.isFinite(end)&&end<=exit?minToTime(end):'';
}

function clearFormValues(){
  fillMonths('');fillDays('');fillEntryOptions('');$('zrChangeExitTime').innerHTML='<option value="">퇴장시간 선택</option>';$('zrChangeMealMode').value='none';syncMealOptions('');$('zrChangePlayMode').value='no';$('zrChangePlayDuration').value='';refreshPlayOptions('');$('zrChangeNotes').value='';$('zrChangeMealCurrent').textContent='';$('zrChangePlayCurrent').textContent='';
}
function loadBookingDefaults(booking){
  clearInvalid();if(!booking){currentBookingId='';clearFormValues();return}currentBookingId=String(booking.id||'');
  const date=String(booking.date||''),month=date.slice(0,7),day=date.slice(8,10);fillMonths(month);fillDays(day);
  fillEntryOptions(String(booking.entryTime||''));
  const mealType=['lunchbox','cafe','none'].includes(String(booking.mealType||''))?String(booking.mealType):'none';$('zrChangeMealMode').value=mealType;
  fillExitOptions(String(booking.exitTime||''),false);
  $('zrChangeMealCurrent').textContent=`현재: ${mealLabel(booking.mealType)}${booking.mealStart?` · ${booking.mealStart}${booking.mealEnd?`~${booking.mealEnd}`:''}`:''}`;
  syncMealVisibility();
  if(mealType!=='none'){
    fillMealStartOptions(String(booking.mealStart||''));
    const md=rangeDuration(booking.mealStart,booking.mealEnd,[30,45,60],30);$('zrChangeMealDuration').value=String(md);syncMealEnd();
  }else syncMealOptions('');
  const playUse=String(booking.playUse||'no')==='yes'?'yes':'no';$('zrChangePlayMode').value=playUse;$('zrChangePlayCurrent').textContent=`현재: ${playLabel(booking.playUse)}${booking.playStart?` · ${booking.playStart}${booking.playEnd?`~${booking.playEnd}`:''}`:''}`;
  const pd=rangeDuration(booking.playStart,booking.playEnd,[30,60],Number(booking.playDuration)===60?60:30);$('zrChangePlayDuration').value=playUse==='yes'?String(pd):'';syncPlayVisibility();refreshPlayOptions(playUse==='yes'?String(booking.playStart||''):'');
  $('zrChangeNotes').value='';
}

function collectRequest(){
  clearInvalid();const booking=selectedBooking();if(!booking)return failForm('변경할 예약 정보를 다시 불러와주세요.',$('zrChangeTargetBooking'));
  const date=requestDate();if(!DATE_RE.test(date)||date<=localToday())return failForm('예약변경날짜를 확인해주세요.','zrChangeVisitMonth');
  const entry=requestEntry(),exit=requestExit(),entryMin=timeToMin(entry),exitMin=timeToMin(exit);if(!Number.isFinite(entryMin))return failForm('입장시간을 선택해주세요.','zrChangeEntryTime');if(!Number.isFinite(exitMin)||exitMin<=entryMin)return failForm('퇴장시간을 입장시간보다 늦게 선택해주세요.','zrChangeExitTime');
  const mealType=String($('zrChangeMealMode')?.value||'none'),max=mealType==='none'?180:240;if(exitMin-entryMin>max)return failForm(mealType==='none'?'식사하지 않는 단체는 최대 3시간까지 이용할 수 있습니다.':'식사 이용 단체는 최대 4시간까지 이용할 수 있습니다.','zrChangeExitTime');
  let mealStart='',mealEnd='',mealDuration=0;
  if(mealType!=='none'){
    mealStart=String($('zrChangeMealStart')?.value||'');mealDuration=Number($('zrChangeMealDuration')?.value||0);const ms=timeToMin(mealStart);if(!Number.isFinite(ms))return failForm('식사 시작시간을 선택해주세요.','zrChangeMealStart');if(![30,45,60].includes(mealDuration))return failForm('식사 이용시간을 선택해주세요.','zrChangeMealDuration');const me=ms+mealDuration;if(ms<entryMin||me>exitMin)return failForm('식사시간은 입장·퇴장시간 안에서 선택해주세요.','zrChangeMealStart');mealEnd=minToTime(me);
  }
  const playUse=String($('zrChangePlayMode')?.value||'no')==='yes'?'yes':'no';let playStart='',playEnd='',playDuration=0;
  if(playUse==='yes'){
    playStart=String($('zrChangePlayStart')?.value||'');playDuration=Number($('zrChangePlayDuration')?.value||0);if(!playStart)return failForm('놀이터 시작시간을 선택해주세요.','zrChangePlayStart');if(![30,60].includes(playDuration))return failForm('놀이터 이용시간을 선택해주세요.','zrChangePlayDuration');const state=playSlotState(playStart,playDuration);if(!state.ok)return failForm(state.reason==='full'?'선택한 놀이터 시간은 이미 마감되었습니다. 다른 시간을 선택해주세요.':'놀이터는 변경 입장시간 이후부터 퇴장시간 안에서 선택해주세요.','zrChangePlayStart');playEnd=minToTime(timeToMin(playStart)+playDuration);
  }
  return {booking,date,entry,exit,mealType,mealStart,mealEnd,mealDuration,playUse,playStart,playEnd,playDuration,body:String($('zrChangeNotes')?.value||'').trim()};
}
function openReview(){
  const x=collectRequest();if(!x)return;reviewSnapshot=x;const current=x.booking;
  const mealText=x.mealType==='none'?'식사 안 함':`${mealLabel(x.mealType)} · ${x.mealStart}~${x.mealEnd} (${x.mealDuration}분)`;
  const playText=x.playUse==='yes'?`이용함 · ${x.playStart}~${x.playEnd} (${x.playDuration}분)`:'이용 안 함';
  $('zrChangeReviewCard').innerHTML=`<div class="zr-change-review-row"><span>변경 대상 예약</span><b>${esc(`${current.date||'-'} · ${current.entryTime||'--:--'}~${current.exitTime||'--:--'} · ${current.orgName||'단체 예약'}`)}</b></div><div class="zr-change-review-row"><span>변경 요청 일시</span><b>${esc(`${x.date} · ${x.entry}~${x.exit}`)}</b></div><div class="zr-change-review-row"><span>식사</span><b>${esc(mealText)}</b></div><div class="zr-change-review-row"><span>놀이터</span><b>${esc(playText)}</b></div><div class="zr-change-review-row"><span>변경 요청사항</span><b>${esc(x.body||'없음')}</b></div>`;showStage('review');
}
function waitForReservationBridge(timeout=5000){
  return new Promise(resolve=>{const started=Date.now();const check=()=>{if(typeof window.setStore==='function'&&window.setStore.__zrCustomerFirebaseBridge){resolve(true);return}if(Date.now()-started>=timeout){resolve(false);return}setTimeout(check,100)};check()})
}
function waitForSavedRequest(bookingId,requestId,timeout=1600){
  return new Promise(resolve=>{const started=Date.now();const check=()=>{const b=bookingById(bookingId);if(String(b?.reservationChangeRequest?.id||'')===requestId){resolve(true);return}if(Date.now()-started>=timeout){resolve(false);return}setTimeout(check,80)};check()})
}
async function submitChangeRequest(){
  const btn=$('zrChangeSubmit');if(btn?.disabled)return;const x=collectRequest();if(!x)return;reviewSnapshot=x;if(btn){btn.disabled=true;btn.textContent='접수 중...'}
  try{
    if(!await waitForReservationBridge()){showStage('form');failForm('예약 DB 연결을 확인 중입니다. 잠시 후 다시 시도해주세요.',$('zrChangeTargetBooking'));return}
    const list=readBookings(),index=list.findIndex(b=>b&&!b.__availabilityOnly&&String(b.id||'')===String(x.booking.id||''));if(index<0){showStage('form');failForm('변경할 예약 정보를 다시 불러와주세요.',$('zrChangeTargetBooking'));return}
    const booking=list[index],now=new Date().toISOString(),requestId=`cr_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    booking.reservationChangeRequest={
      id:requestId,status:'pending',
      oldDate:String(booking.date||''),oldEntryTime:String(booking.entryTime||''),oldExitTime:String(booking.exitTime||''),
      requestedDate:x.date,requestedTime:x.entry,requestedExitTime:x.exit,
      changePlay:true,playUse:x.playUse,playStart:x.playStart,playEnd:x.playEnd,playDuration:x.playDuration,
      changeMeal:true,mealType:x.mealType,mealStart:x.mealStart,mealEnd:x.mealEnd,mealDuration:x.mealDuration,
      orgName:String(booking.orgName||''),requesterName:String(booking.managerName||managerValue()),requesterMobile:tel(booking.contact||contactValue()),
      people:Number(booking.paidCount||0)+Number(booking.chaperoneCount||0),body:x.body,createdAt:now,updatedAt:now
    };
    list[index]=booking;
    let writeError=null;try{window.setStore(BOOKING_KEY,list)}catch(e){writeError=e;console.warn('reservation change setStore continued to verification',e)}
    const saved=await waitForSavedRequest(String(booking.id||''),requestId);
    if(!saved){if(writeError)throw writeError;showStage('form');failForm('예약 변경 요청 저장이 완료되지 않았습니다. 다시 시도해주세요.',$('zrChangeTargetBooking'));return}
    currentBookingId=String(booking.id||'');try{document.dispatchEvent(new CustomEvent('zr:reservation-change-request-shared',{detail:{bookingId:currentBookingId,requestId}}))}catch{}
    showStage('complete');
  }catch(e){console.error('reservation change submit',e);showStage('form');failForm('예약 변경 요청을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.',$('zrChangeTargetBooking'))}
  finally{if(btn){btn.disabled=false;btn.textContent='변경 요청 접수하기'}}
}

function bind(){
  ensureStyle();ensureChangeSelect();ensureNotice();ensureModal();
  const setButton=()=>{const btn=$('changeExisting');if(btn){btn.textContent='2. 예약 변경하기';btn.classList.remove('hidden')}};setButton();
  document.addEventListener('click',e=>{
    const global=e.target?.closest?.('#changeExisting');if(!global)return;
    e.preventDefault();e.stopImmediatePropagation();openChangeSelect();
  },true);
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape')return;
    if(!$('zrReservationChangeSelectV1')?.classList.contains('hidden')){closeChangeSelect();return}
    if(!$('zrReservationChangeNoticeV1')?.classList.contains('hidden')){pendingBookingId='';closeNotice();return}
    if(!$('zrReservationChangeModalV1')?.classList.contains('hidden'))closeChangeModal();
  });
  document.addEventListener('zr:reservation-availability-updated',()=>{setButton();if(!$('zrReservationChangeModalV1')?.classList.contains('hidden'))refreshPlayOptions(String($('zrChangePlayStart')?.value||''))});
  window.addEventListener('storage',e=>{if(e.key!==BOOKING_KEY)return;setButton();if(!$('zrReservationChangeModalV1')?.classList.contains('hidden'))refreshPlayOptions(String($('zrChangePlayStart')?.value||''))});
  document.addEventListener('zr:customer-runtime-ready',setButton,{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
