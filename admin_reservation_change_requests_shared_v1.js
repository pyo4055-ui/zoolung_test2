(()=>{
'use strict';
if(window.__ZR_ADMIN_RESERVATION_CHANGE_REQUESTS_SHARED_V1)return;
window.__ZR_ADMIN_RESERVATION_CHANGE_REQUESTS_SHARED_V1=true;

const BOOKING_KEY='zr_bookings';
const SMS_KEY='zr_reservation_change_confirm_sms_v1';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tel=v=>String(v||'').replace(/\D/g,'');
const DEFAULT_SMS='[주렁주렁 동탄점]\n예약 변경이 확정되었습니다.\n\n단체명: {단체명}\n변경 일시: {변경일} {변경시간}\n\n변경된 일정으로 방문 부탁드립니다. 감사합니다.';
let installed=false,currentBookingId='';

function toastSafe(msg){try{if(typeof window.toast==='function'){window.toast(msg);return}}catch{}alert(msg)}
function readBookings(){try{const v=JSON.parse(localStorage.getItem(BOOKING_KEY)||'[]');return Array.isArray(v)?v:[]}catch{return[]}}
function writeBookings(list){
  if(typeof window.setStore==='function')window.setStore(BOOKING_KEY,list);
  else localStorage.setItem(BOOKING_KEY,JSON.stringify(list));
  try{document.dispatchEvent(new CustomEvent('zr:reservation-change-request-admin-updated'))}catch{}
}
function reqOf(booking,index){
  const r=booking?.reservationChangeRequest;if(!r||typeof r!=='object')return null;
  const status=String(r.status||'pending');
  return {
    booking,index,id:String(r.id||''),status,
    bookingId:String(booking.id||''),org:String(r.orgName||booking.orgName||'단체명 미입력'),
    oldDate:String(r.oldDate||booking.date||''),oldEntry:String(r.oldEntryTime||booking.entryTime||''),oldExit:String(r.oldExitTime||booking.exitTime||''),
    requestedDate:String(r.requestedDate||''),requestedTime:String(r.requestedTime||''),
    body:String(r.body||''),name:String(r.requesterName||booking.managerName||'문의자 미입력'),mobile:tel(r.requesterMobile||booking.contact),
    created:String(r.createdAt||r.updatedAt||''),appliedDate:String(r.appliedDate||''),appliedTime:String(r.appliedTime||'')
  };
}
function requests(){return readBookings().map((b,i)=>b&&!b.__availabilityOnly?reqOf(b,i):null).filter(Boolean).sort((a,b)=>String(b.created).localeCompare(String(a.created)))}
function statusLabel(v){return v==='done'?'처리완료':v==='applied'?'예약반영':v==='rejected'?'변경불가':'대기'}
function statusClass(v){return ['done','applied','rejected'].includes(v)?v:'pending'}
function formatCreated(v){if(!v)return'';const d=new Date(v);if(Number.isNaN(d.getTime()))return String(v);const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}.${p(d.getMonth()+1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`}
function findBooking(id){const list=readBookings(),index=list.findIndex(b=>b&&!b.__availabilityOnly&&String(b.id||'')===String(id));return {list,index,booking:index>=0?list[index]:null}}
function timeToMin(v){const m=/^(\d{2}):(\d{2})$/.exec(String(v||''));return m?Number(m[1])*60+Number(m[2]):NaN}
function minToTime(n){if(!Number.isFinite(n)||n<0||n>=1440)return'';return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}

function installStyle(){
  if($('zrAdminReservationChangeSharedStyleV1'))return;
  const s=document.createElement('style');s.id='zrAdminReservationChangeSharedStyleV1';s.textContent=`
  #zrReservationChangeAdminList .zr-cr-shared-note{margin:0 0 10px;padding:9px 11px;border-radius:10px;background:#fff8f2;border:1px solid #f0d2bc;color:#765445;font-size:12px;font-weight:800}
  #zrReservationChangeAdminList .zr-cr-status.done{background:#e7f5ed!important;border-color:#b9dcc7!important;color:#1f7a4d!important}
  #zrReservationChangeAdminList .zr-cr-detail{background:#f5f1ee!important;border-color:#ddd1c9!important;color:#5b463b!important}
  #zrReservationChangeAdminList .zr-cr-sms{background:#651012!important;border-color:#651012!important;color:#fff!important}
  #zrReservationChangeAdminList .zr-cr-done{background:#8a5a44!important;border-color:#8a5a44!important;color:#fff!important}
  #zrReservationChangeAdminList .zr-cr-done.is-done{background:#1f7a4d!important;border-color:#1f7a4d!important;color:#fff!important}
  #zrReservationChangeAdminList .zr-cr-done.is-done:hover{background:#19663f!important;border-color:#19663f!important}
  #zrSharedReservationChangeApplyModal .modal-card,#zrSharedReservationChangeDetailModal .modal-card{width:min(620px,100%)}
  #zrSharedReservationChangeApplyModal .zr-cr-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  #zrSharedReservationChangeApplyModal input{min-height:48px}
  #zrSharedReservationChangeDetailBody{display:grid;grid-template-columns:1fr 1fr;gap:9px}
  #zrReservationChangeSmsPanel .zr-cr-shared-sms-only{max-width:760px}
  #zrReservationChangeSmsPanel .zr-cr-shared-sms-only textarea{width:100%;min-height:220px;box-sizing:border-box;resize:vertical}
  #zrReservationChangeSmsPanel .zr-cr-shared-sms-actions{display:flex;justify-content:flex-end;margin-top:10px}
  @media(max-width:720px){#zrSharedReservationChangeApplyModal .zr-cr-form-grid,#zrSharedReservationChangeDetailBody{grid-template-columns:1fr}}
  `;document.head.appendChild(s);
}

function renderRequests(){
  const host=$('zrReservationChangeAdminList');if(!host)return;
  const all=requests(),filter=$('zrReservationChangeStatusFilter')?.value||'all',rows=filter==='all'?all:all.filter(x=>x.status===filter);
  if($('zrReservationChangeCount'))$('zrReservationChangeCount').textContent=`${rows.length}건 / 전체 ${all.length}건`;
  if(!rows.length){host.innerHTML='<div class="zr-cr-empty">조건에 맞는 예약 변경 요청이 없습니다.</div>';return}
  host.innerHTML=rows.map(r=>`<article class="zr-cr-card" data-zr-shared-booking="${esc(r.bookingId)}"><div class="zr-cr-card-head"><span class="zr-cr-status ${statusClass(r.status)}">${statusLabel(r.status)}</span><span class="zr-cr-org">${esc(r.org)}</span>${r.created?`<span class="zr-cr-created">접수 ${esc(formatCreated(r.created))}</span>`:''}</div><div class="zr-cr-route"><div class="zr-cr-box"><strong>기존 예약</strong><b>${esc(r.oldDate||'-')} · ${esc(r.oldEntry||'--:--')}${r.oldExit?` ~ ${esc(r.oldExit)}`:''}</b></div><div class="zr-cr-arrow">→</div><div class="zr-cr-box requested"><strong>변경 요청</strong><b>${esc(r.requestedDate||'-')} · ${esc(r.requestedTime||'--:--')}</b></div></div><div class="zr-cr-meta"><span>문의자 ${esc(r.name)}</span><span>연락처 ${esc(r.mobile||'-')}</span><span>예약번호 ${esc(r.bookingId||'-')}</span></div><div class="zr-cr-body" title="${esc(r.body||'변경 문의 내용 없음')}">${esc(r.body||'변경 문의 내용 없음')}</div><div class="zr-cr-actions"><button type="button" class="btn-primary zr-cr-apply" data-zr-shared-apply="${esc(r.bookingId)}">예약 반영</button><button type="button" class="btn-gray zr-cr-detail" data-zr-shared-detail="${esc(r.bookingId)}">자세히</button><button type="button" class="btn-gray zr-cr-sms" data-zr-shared-sms="${esc(r.bookingId)}">확정문자</button><button type="button" class="btn-gray zr-cr-done${r.status==='done'?' is-done':''}" data-zr-shared-done="${esc(r.bookingId)}">${r.status==='done'?'처리완료됨':'처리완료'}</button></div></article>`).join('');
}

function ensureApplyModal(){
  if($('zrSharedReservationChangeApplyModal'))return;
  const m=document.createElement('div');m.id='zrSharedReservationChangeApplyModal';m.className='modal hidden';m.innerHTML=`<div class="modal-card"><h2 style="margin:0">예약 날짜·시간 반영</h2><div class="help" id="zrSharedChangeApplyHelp" style="margin-top:7px"></div><div class="zr-cr-form-grid" style="margin-top:15px"><div><label class="req">변경예약날짜</label><input type="date" id="zrSharedChangeApplyDate"></div><div><label class="req">변경예약시간</label><input type="time" step="1800" id="zrSharedChangeApplyTime"></div></div><div class="help" style="margin-top:10px">입장시간을 변경하면 기존 체류시간을 유지해 퇴장시간도 함께 이동합니다. 확정 스케줄이 있는 예약은 스케줄 관리에서 한 번 더 확인해주세요.</div><div class="modal-actions"><button type="button" class="btn-gray" id="zrSharedChangeApplyCancel">취소</button><button type="button" class="btn-primary" id="zrSharedChangeApplyConfirm">예약에 반영</button></div></div>`;document.body.appendChild(m);
  $('zrSharedChangeApplyCancel').onclick=()=>m.classList.add('hidden');$('zrSharedChangeApplyConfirm').onclick=applyBookingChange;
}
function openApply(id){
  const found=findBooking(id),req=found.booking?reqOf(found.booking,found.index):null;if(!req){toastSafe('변경 요청 정보를 찾지 못했습니다.');return}
  ensureApplyModal();currentBookingId=id;
  $('zrSharedChangeApplyDate').value=req.requestedDate||found.booking.date||'';$('zrSharedChangeApplyTime').value=req.requestedTime||found.booking.entryTime||'';
  $('zrSharedChangeApplyHelp').textContent=`기존 ${req.oldDate||'-'} ${req.oldEntry||'--:--'} → 고객 요청 ${req.requestedDate||'-'} ${req.requestedTime||'--:--'}`;
  $('zrSharedReservationChangeApplyModal').classList.remove('hidden');
}
function applyBookingChange(){
  if(!currentBookingId)return;
  const found=findBooking(currentBookingId),booking=found.booking,req=booking?.reservationChangeRequest;if(!booking||!req){toastSafe('연결된 예약을 찾지 못했습니다.');return}
  const date=$('zrSharedChangeApplyDate')?.value||'',entry=$('zrSharedChangeApplyTime')?.value||'';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){toastSafe('변경예약날짜를 확인해주세요.');return}
  const newMin=timeToMin(entry);if(!Number.isFinite(newMin)){toastSafe('변경예약시간을 확인해주세요.');return}
  const oldStart=timeToMin(booking.entryTime),oldEnd=timeToMin(booking.exitTime),duration=Number.isFinite(oldStart)&&Number.isFinite(oldEnd)&&oldEnd>oldStart?oldEnd-oldStart:NaN;
  const exit=Number.isFinite(duration)?minToTime(newMin+duration):String(booking.exitTime||'');
  if(Number.isFinite(duration)&&!exit){toastSafe('퇴장시간이 하루를 넘어갑니다. 변경시간을 다시 확인해주세요.');return}
  booking.date=date;booking.entryTime=entry;if(exit)booking.exitTime=exit;
  booking.reservationChangeRequest={...req,status:'applied',appliedDate:date,appliedTime:entry,appliedExitTime:exit||booking.exitTime,appliedAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  found.list[found.index]=booking;writeBookings(found.list);
  $('zrSharedReservationChangeApplyModal').classList.add('hidden');currentBookingId='';renderRequests();toastSafe('예약 날짜와 시간을 반영했습니다.');
}

function ensureDetailModal(){
  if($('zrSharedReservationChangeDetailModal'))return;
  const m=document.createElement('div');m.id='zrSharedReservationChangeDetailModal';m.className='modal hidden';m.innerHTML=`<div class="modal-card"><h2 style="margin:0 0 14px">예약 변경 요청 자세히</h2><div id="zrSharedReservationChangeDetailBody"></div><div class="modal-actions"><button type="button" class="btn-gray" id="zrSharedReservationChangeDetailClose">닫기</button></div></div>`;document.body.appendChild(m);$('zrSharedReservationChangeDetailClose').onclick=()=>m.classList.add('hidden');
}
function openDetail(id){
  const found=findBooking(id),r=found.booking?reqOf(found.booking,found.index):null;if(!r)return;ensureDetailModal();
  $('zrSharedReservationChangeDetailBody').innerHTML=`<div class="zr-cr-detail-row"><span>처리상태</span><div>${esc(statusLabel(r.status))}</div></div><div class="zr-cr-detail-row"><span>예약번호</span><div>${esc(r.bookingId)}</div></div><div class="zr-cr-detail-row"><span>단체명</span><div>${esc(r.org)}</div></div><div class="zr-cr-detail-row"><span>문의자 / 연락처</span><div>${esc(r.name)} · ${esc(r.mobile||'-')}</div></div><div class="zr-cr-detail-row"><span>기존 예약</span><div>${esc(r.oldDate||'-')} · ${esc(r.oldEntry||'--:--')}${r.oldExit?` ~ ${esc(r.oldExit)}`:''}</div></div><div class="zr-cr-detail-row"><span>변경 요청</span><div>${esc(r.requestedDate||'-')} · ${esc(r.requestedTime||'--:--')}</div></div><div class="zr-cr-detail-row full"><span>현재 저장된 예약</span><div>${esc(found.booking.date||'-')} · ${esc(found.booking.entryTime||'--:--')}${found.booking.exitTime?` ~ ${esc(found.booking.exitTime)}`:''}</div></div><div class="zr-cr-detail-row full"><span>변경 문의 내용</span><div>${esc(r.body||'변경 문의 내용 없음')}</div></div>`;
  $('zrSharedReservationChangeDetailModal').classList.remove('hidden');
}
function markDone(id,silent=false){
  const found=findBooking(id),booking=found.booking,req=booking?.reservationChangeRequest;if(!booking||!req)return false;
  booking.reservationChangeRequest={...req,status:'done',completedAt:new Date().toISOString(),updatedAt:new Date().toISOString()};found.list[found.index]=booking;writeBookings(found.list);renderRequests();if(!silent)toastSafe('처리완료로 표시했습니다.');return true;
}

function smsTemplate(){return localStorage.getItem(SMS_KEY)||DEFAULT_SMS}
function applySmsTemplate(r){const date=r?.appliedDate||r?.requestedDate||'',time=r?.appliedTime||r?.requestedTime||'';return smsTemplate().replaceAll('{단체명}',r?.org||'').replaceAll('{예약자}',r?.name||'').replaceAll('{변경일}',date).replaceAll('{변경시간}',time)}
function smsUrl(phone,text){const number=tel(phone),body=encodeURIComponent(text),ios=/iPad|iPhone|iPod/.test(navigator.userAgent);return `sms:${number}${ios?'&':'?'}body=${body}`}
function sendConfirmSms(id){
  const found=findBooking(id),r=found.booking?reqOf(found.booking,found.index):null;if(!r){toastSafe('변경 요청 정보를 찾지 못했습니다.');return}if(!r.mobile){toastSafe('고객 휴대폰번호가 없습니다.');return}
  const text=applySmsTemplate(r);markDone(id,true);window.location.href=smsUrl(r.mobile,text);
}
function simplifySmsPanel(){
  const panel=$('zrReservationChangeSmsPanel');if(!panel)return;
  if(panel.dataset.zrSharedSmsOnly==='1')return;
  panel.dataset.zrSharedSmsOnly='1';panel.innerHTML=`<div class="zr-cr-head"><div><h2>예약변경 확정문자</h2><div class="help" style="margin-top:5px">변경 확정 시 사용할 문자 문구만 관리합니다. 변경요청 목록의 확정문자 버튼을 누르면 문자 앱으로 바로 연결되고 처리완료로 표시됩니다.</div></div></div><div class="zr-cr-sms-box zr-cr-shared-sms-only"><label>확정문자 문구</label><textarea id="zrSharedReservationChangeSmsTemplate"></textarea><div class="help">사용 가능: {단체명} · {예약자} · {변경일} · {변경시간}</div><div class="zr-cr-shared-sms-actions"><button type="button" class="btn-primary" id="zrSharedReservationChangeSmsSave">문구 저장</button></div></div>`;
  $('zrSharedReservationChangeSmsTemplate').value=smsTemplate();$('zrSharedReservationChangeSmsSave').onclick=()=>{const text=$('zrSharedReservationChangeSmsTemplate')?.value.trim()||'';if(!text){toastSafe('확정문자 문구를 입력해주세요.');return}localStorage.setItem(SMS_KEY,text);toastSafe('예약변경 확정문자를 저장했습니다.')};
}
function setSubtabClasses(active){
  const pairs=[['zrInquiryReplyInquirySubtab',false],['zrInquiryReplyExampleSubtab',false],['zrReservationChangeAdminRequestSubtab',active==='requests'],['zrReservationChangeAdminSmsSubtab',active==='sms']];
  pairs.forEach(([id,on])=>{const b=$(id);if(!b)return;b.className=(on?'btn-primary':'btn-gray')+(id.startsWith('zrReservationChange')?' zr-change-inner-tab':'')});
}
function showSharedMode(mode){
  const main=$('tab-inquiry-reply-v1'),examples=$('tab-inquiry-reply-examples'),requestsPanel=$('zrReservationChangeAdminPanel'),smsPanel=$('zrReservationChangeSmsPanel');
  if(!main)return;
  [...main.children].forEach(el=>{if(el.classList?.contains('zr-ir-panel'))el.classList.add('hidden')});
  examples?.classList.add('hidden');setSubtabClasses(mode);
  if(mode==='requests'){
    requestsPanel?.classList.remove('hidden');smsPanel?.classList.add('hidden');renderRequests();
  }else{
    requestsPanel?.classList.add('hidden');smsPanel?.classList.remove('hidden');simplifySmsPanel();
  }
}

function bind(){
  const host=$('zrReservationChangeAdminList');if(host&&host.dataset.zrSharedBound!=='1'){
    host.dataset.zrSharedBound='1';host.addEventListener('click',e=>{
      const a=e.target.closest('[data-zr-shared-apply]');if(a){openApply(a.dataset.zrSharedApply);return}
      const d=e.target.closest('[data-zr-shared-detail]');if(d){openDetail(d.dataset.zrSharedDetail);return}
      const s=e.target.closest('[data-zr-shared-sms]');if(s){sendConfirmSms(s.dataset.zrSharedSms);return}
      const done=e.target.closest('[data-zr-shared-done]');if(done){if(confirm('이 예약 변경 요청을 처리완료로 표시할까요?'))markDone(done.dataset.zrSharedDone);}
    });
  }
  const requestTab=$('zrReservationChangeAdminRequestSubtab');
  if(requestTab&&requestTab.dataset.zrSharedRouteBound!=='1'){
    requestTab.dataset.zrSharedRouteBound='1';requestTab.addEventListener('click',e=>{e.stopImmediatePropagation();showSharedMode('requests')},true);
  }
  const smsTab=$('zrReservationChangeAdminSmsSubtab');
  if(smsTab&&smsTab.dataset.zrSharedRouteBound!=='1'){
    smsTab.dataset.zrSharedRouteBound='1';smsTab.addEventListener('click',e=>{e.stopImmediatePropagation();showSharedMode('sms')},true);
  }
  $('zrReservationChangeStatusFilter')?.addEventListener('change',()=>setTimeout(renderRequests,0));
  document.addEventListener('zr:reservation-change-request-admin-updated',()=>setTimeout(renderRequests,0));
  window.addEventListener('storage',e=>{if(e.key===BOOKING_KEY)setTimeout(renderRequests,0)});
  document.addEventListener('click',e=>{const b=e.target?.closest?.('#zrChangeSidebarRequests,#zrMobileChangeRequests');if(b)setTimeout(()=>showSharedMode('requests'),0);const s=e.target?.closest?.('#zrChangeSidebarSms,#zrMobileChangeSms');if(s)setTimeout(()=>showSharedMode('sms'),0)},true);
}
function install(){
  if(installed)return true;
  if(!$('zrReservationChangeAdminPanel')||!$('zrReservationChangeAdminList')||!$('zrReservationChangeAdminRequestSubtab'))return false;
  installStyle();ensureApplyModal();ensureDetailModal();bind();simplifySmsPanel();renderRequests();
  [300,900,1800].forEach(ms=>setTimeout(renderRequests,ms));installed=true;return true;
}
function boot(){if(install())return;let tries=0;const t=setInterval(()=>{if(install()||++tries>80)clearInterval(t)},100)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,0),{once:true});
})();