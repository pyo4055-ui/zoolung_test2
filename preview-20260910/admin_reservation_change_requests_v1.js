(()=>{
'use strict';
if(window.__ZR_ADMIN_RESERVATION_CHANGE_REQUESTS_V1)return;
window.__ZR_ADMIN_RESERVATION_CHANGE_REQUESTS_V1=true;

const INQUIRY_KEY='zr_inquiries';
const BOOKING_KEY='zr_bookings';
const SMS_KEY='zr_reservation_change_confirm_sms_v1';
const REPLY_MARKER='\n\n[관리자 답변]\n';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
const tel=v=>String(v||'').replace(/\D/g,'');
const DEFAULT_SMS='[주렁주렁 동탄점]\n예약 변경이 확정되었습니다.\n\n단체명: {단체명}\n변경 일시: {변경일} {변경시간}\n\n변경된 일정으로 방문 부탁드립니다. 감사합니다.';
let installed=false,currentApplyIndex=-1,currentDetailIndex=-1,mobileObserver=null,listObserver=null;

function toastSafe(msg){try{if(typeof window.toast==='function'){window.toast(msg);return}}catch{}alert(msg)}
function readList(key){try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:[]}catch{return[]}}
function writeList(key,list){
  if(typeof window.setStore==='function')window.setStore(key,list);
  else localStorage.setItem(key,JSON.stringify(list));
}
function contentKey(item){for(const k of ['content','message','inquiry','text'])if(Object.prototype.hasOwnProperty.call(item||{},k))return k;return 'content'}
function contentOf(item){return String(item?.[contentKey(item)]??'')}
function questionOf(item){const t=contentOf(item),i=t.lastIndexOf(REPLY_MARKER);return (i<0?t:t.slice(0,i)).trim()}
function pick(item,keys){for(const k of keys){const v=String(item?.[k]??'').trim();if(v)return v}return''}
function nameOf(item){return pick(item,['name','customerName','managerName','inqName','writer'])||'문의자 미입력'}
function mobileOf(item){return tel(pick(item,['mobile','mobilePhone','cellphone','cellPhone','hp','inqMobile','contact'])||pick(item,['phone','inqPhone','tel','telephone']))}
function createdOf(item){return pick(item,['createdAt','created','submittedAt','dateTime'])}
function lineValue(text,label){
  const target=`${label}:`;
  const line=String(text||'').split(/\r?\n/).find(x=>x.trim().startsWith(target));
  return line?line.trim().slice(target.length).trim():'';
}
function parseTimeRange(v){const m=String(v||'').match(/([0-2]\d:[0-5]\d)\s*~\s*([0-2]\d:[0-5]\d)/);return {entry:m?.[1]||'',exit:m?.[2]||''}}
function bodyOfChange(text){
  const q=String(text||'').replace(/\r\n/g,'\n');
  if(q.startsWith('[예약 변경 요청]')){
    const marker=q.match(/\n단체 인원:\s*\d+명\n\n/);if(marker)return q.slice((marker.index||0)+marker[0].length).trim();
  }
  const old='[예약 변경 정보]';
  const i=q.indexOf(old);if(i>=0){const rest=q.slice(i);const j=rest.indexOf('\n\n');if(j>=0)return rest.slice(j+2).trim()}
  return q.replace(/^\[[^\]]+\]\s*/,'').trim();
}
function isPreview(item){return /^\[(사전답사 문의|사전답사 확정)\]/.test(questionOf(item))}
function isChangeItem(item){const q=questionOf(item);return item?.changeRequest===true||/^\[예약 변경 요청\]/.test(q)||q.includes('\n[예약 변경 정보]\n')}
function parseChange(item,index){
  if(!item||!isChangeItem(item))return null;
  const q=questionOf(item);
  const oldRange=parseTimeRange(item.changeOldEntryTime&&item.changeOldExitTime?`${item.changeOldEntryTime} ~ ${item.changeOldExitTime}`:lineValue(q,'기존 예약시간')||lineValue(q,'현재 예약시간'));
  const targetId=pick(item,['changeBookingId'])||lineValue(q,'변경 대상 예약번호')||lineValue(q,'대상 예약번호');
  const requestedDate=pick(item,['changeRequestedDate'])||lineValue(q,'예약변경날짜')||lineValue(q,'방문 희망일');
  const requestedTime=pick(item,['changeRequestedTime'])||lineValue(q,'예약변경시간')||lineValue(q,'방문 희망시간');
  const org=pick(item,['changeRequestOrgName','orgName','groupName','organization'])||lineValue(q,'단체명')||'단체명 미입력';
  const oldDate=pick(item,['changeOldDate'])||lineValue(q,'기존 예약일')||lineValue(q,'현재 예약일');
  const oldEntry=pick(item,['changeOldEntryTime'])||oldRange.entry;
  const oldExit=pick(item,['changeOldExitTime'])||oldRange.exit;
  const status=String(item.changeRequestStatus||'pending');
  return {index,item,targetId,org,oldDate,oldEntry,oldExit,requestedDate,requestedTime,body:bodyOfChange(q)||'변경 문의 내용 없음',name:nameOf(item),mobile:mobileOf(item),created:createdOf(item),status};
}
function requests(){return readList(INQUIRY_KEY).map((x,i)=>parseChange(x,i)).filter(Boolean).sort((a,b)=>String(b.created||'').localeCompare(String(a.created||'')))}
function statusLabel(status){return status==='done'?'처리완료':status==='applied'?'예약반영':status==='rejected'?'변경불가':'대기'}
function statusClass(status){return ['done','applied','rejected'].includes(status)?status:'pending'}
function timeToMin(v){const m=/^(\d{2}):(\d{2})$/.exec(String(v||''));return m?Number(m[1])*60+Number(m[2]):NaN}
function minToTime(n){if(!Number.isFinite(n)||n<0||n>=1440)return'';return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
function formatCreated(v){if(!v)return'';const d=new Date(v);if(Number.isNaN(d.getTime()))return String(v);return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`}

function installStyle(){
  if($('zrAdminReservationChangeStyleV1'))return;
  const s=document.createElement('style');s.id='zrAdminReservationChangeStyleV1';s.textContent=`
  #zrInquiryReplyInnerTabs .zr-change-inner-tab{min-width:138px}
  #zrReservationChangeAdminPanel,#zrReservationChangeSmsPanel{margin-top:12px}
  #zrReservationChangeAdminPanel .zr-cr-head,#zrReservationChangeSmsPanel .zr-cr-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:18px}
  #zrReservationChangeAdminPanel .zr-cr-head h2,#zrReservationChangeSmsPanel .zr-cr-head h2{margin:0;font-size:22px}
  #zrReservationChangeAdminPanel .zr-cr-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  #zrReservationChangeAdminPanel .zr-cr-toolbar select{min-width:140px;height:40px}
  #zrReservationChangeAdminList{display:grid;gap:10px}
  .zr-cr-card{border:1px solid #e3ddd7;border-radius:15px;background:#fff;padding:14px 15px;box-shadow:0 2px 9px rgba(56,39,30,.04)}
  .zr-cr-card-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:11px}.zr-cr-org{font-size:16px;font-weight:950;color:#38271e}.zr-cr-created{margin-left:auto;color:#8b7c72;font-size:11px}
  .zr-cr-status{padding:4px 8px;border-radius:999px;font-size:11px;font-weight:950;border:1px solid #ead4a5;background:#fff4df;color:#956200}.zr-cr-status.applied{background:#fff0e3;border-color:#efc19f;color:#a74412}.zr-cr-status.done{background:#eee6e3;border-color:#d8c2ba;color:#651012}.zr-cr-status.rejected{background:#ffe7e7;border-color:#f1bcbc;color:#913535}
  .zr-cr-route{display:grid;grid-template-columns:minmax(0,1fr) 34px minmax(0,1fr);gap:9px;align-items:stretch}.zr-cr-box{border:1px solid #ece5df;border-radius:12px;background:#fcfbf9;padding:10px 12px}.zr-cr-box strong{display:block;margin-bottom:5px;font-size:11px;color:#84766d}.zr-cr-box b{font-size:14px;color:#38271e}.zr-cr-box.requested{background:#fff8f2;border-color:#f0d2bc}.zr-cr-arrow{display:flex;align-items:center;justify-content:center;font-weight:950;color:#fc5404;font-size:18px}
  .zr-cr-meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;color:#6e625b;font-size:12px}.zr-cr-body{margin-top:9px;padding:9px 11px;border-radius:10px;background:#f8f7f5;color:#5d514a;font-size:12px;line-height:1.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .zr-cr-actions{display:flex;justify-content:flex-end;gap:7px;flex-wrap:wrap;margin-top:12px}.zr-cr-actions button{min-height:38px;padding:7px 11px}.zr-cr-apply{background:#fc5404!important;color:#fff!important;border-color:#fc5404!important}.zr-cr-sms{background:#651012!important;color:#fff!important;border-color:#651012!important}
  .zr-cr-empty{padding:34px 12px;text-align:center;border:1px dashed #ded5ce;border-radius:14px;color:#8b7c72;background:#fbfaf8}
  #zrReservationChangeApplyModal .modal-card,#zrReservationChangeDetailModal .modal-card{width:min(620px,100%)}
  #zrReservationChangeApplyModal .zr-cr-compare{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:13px 0}.zr-cr-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.zr-cr-form-grid input{min-height:48px}
  #zrReservationChangeDetailBody{display:grid;grid-template-columns:1fr 1fr;gap:9px}.zr-cr-detail-row{padding:10px 11px;border:1px solid #ebe3dd;border-radius:11px;background:#fbfaf8}.zr-cr-detail-row.full{grid-column:1/-1}.zr-cr-detail-row span{display:block;margin-bottom:4px;font-size:11px;font-weight:850;color:#8b7c72}.zr-cr-detail-row div{font-size:14px;font-weight:800;line-height:1.55;white-space:pre-wrap;word-break:break-word}
  #zrReservationChangeSmsPanel .zr-cr-sms-grid{display:grid;grid-template-columns:minmax(240px,.8fr) minmax(0,1.2fr);gap:14px}.zr-cr-sms-box{border:1px solid #e5ddd6;border-radius:14px;background:#fff;padding:14px}.zr-cr-sms-box textarea{min-height:220px;resize:vertical}.zr-cr-sms-preview{min-height:220px;padding:14px;border:1px solid #eadfd8;border-radius:11px;background:#fbfaf8;white-space:pre-wrap;line-height:1.65;color:#4d4039}.zr-cr-sms-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
  .zr-change-sidebar-item{width:100%}
  @media(max-width:900px){#zrInquiryReplyInnerTabs{display:none!important}.zr-cr-route{grid-template-columns:1fr}.zr-cr-arrow{transform:rotate(90deg);min-height:20px}.zr-cr-created{width:100%;margin-left:0}.zr-cr-actions{display:grid;grid-template-columns:1fr 1fr}.zr-cr-actions button{width:100%}#zrReservationChangeSmsPanel .zr-cr-sms-grid{grid-template-columns:1fr}.zr-cr-form-grid,#zrReservationChangeApplyModal .zr-cr-compare,#zrReservationChangeDetailBody{grid-template-columns:1fr}.zr-cr-detail-row.full{grid-column:auto}}
  `;document.head.appendChild(s);
}

function directInquiryPanel(main){return [...main.children].find(el=>el.classList?.contains('zr-ir-panel'))||null}
function ensurePanels(){
  const main=$('tab-inquiry-reply-v1');if(!main)return false;
  if(!$('zrReservationChangeAdminPanel')){
    const p=document.createElement('div');p.id='zrReservationChangeAdminPanel';p.className='card zr-ir-panel hidden';p.innerHTML=`<div class="zr-cr-head"><div><h2>예약변경요청 관리</h2><div class="help" style="margin-top:5px">고객이 요청한 기존 일정과 변경 희망 일정을 비교하고 바로 예약에 반영할 수 있습니다.</div></div><div class="zr-cr-toolbar"><select id="zrReservationChangeStatusFilter"><option value="all">전체 요청</option><option value="pending">대기</option><option value="applied">예약반영</option><option value="done">처리완료</option></select><span class="help" id="zrReservationChangeCount"></span></div></div><div id="zrReservationChangeAdminList"></div>`;main.appendChild(p);
  }
  if(!$('zrReservationChangeSmsPanel')){
    const p=document.createElement('div');p.id='zrReservationChangeSmsPanel';p.className='card zr-ir-panel hidden';p.innerHTML=`<div class="zr-cr-head"><div><h2>예약변경 확정문자</h2><div class="help" style="margin-top:5px">예약 변경이 확정된 고객에게 보낼 문자 문구를 관리합니다.</div></div></div><div class="zr-cr-sms-grid"><div class="zr-cr-sms-box"><label>확정문자 문구</label><textarea id="zrReservationChangeSmsTemplate"></textarea><div class="help">사용 가능: {단체명} · {예약자} · {변경일} · {변경시간}</div><div class="zr-cr-sms-actions"><button type="button" class="btn-primary" id="zrReservationChangeSmsSave">문구 저장</button></div></div><div class="zr-cr-sms-box"><label>변경요청 선택</label><select id="zrReservationChangeSmsRequest"></select><div class="zr-cr-sms-preview" id="zrReservationChangeSmsPreview" style="margin-top:10px"></div><div class="zr-cr-sms-actions"><button type="button" class="btn-gray" id="zrReservationChangeSmsCopy">문구 복사</button><button type="button" class="btn-primary" id="zrReservationChangeSmsOpen">문자 앱 열기</button></div></div></div>`;main.appendChild(p);
  }
  return true;
}
function ensureTabs(){
  const nav=$('zrInquiryReplyInnerTabs');if(!nav)return false;
  if(!$('zrReservationChangeAdminRequestSubtab')){
    const b=document.createElement('button');b.type='button';b.id='zrReservationChangeAdminRequestSubtab';b.className='btn-gray zr-change-inner-tab';b.textContent='예약변경요청 관리';
    nav.insertBefore(b,$('zrInquiryReplyExampleSubtab')||null);b.onclick=()=>openMode('requests');
  }
  if(!$('zrReservationChangeAdminSmsSubtab')){
    const b=document.createElement('button');b.type='button';b.id='zrReservationChangeAdminSmsSubtab';b.className='btn-gray zr-change-inner-tab';b.textContent='예약변경확정문자';
    nav.insertBefore(b,$('zrInquiryReplyExampleSubtab')||null);b.onclick=()=>openMode('sms');
  }
  return true;
}
function setTabClasses(active){
  const ids=['zrInquiryReplyInquirySubtab','zrReservationChangeAdminRequestSubtab','zrReservationChangeAdminSmsSubtab','zrInquiryReplyExampleSubtab'];
  ids.forEach(id=>{const b=$(id);if(b)b.className=(id===active?'btn-primary':'btn-gray')+(id.startsWith('zrReservationChange')?' zr-change-inner-tab':'')});
}
function openMode(mode){
  const main=$('tab-inquiry-reply-v1');if(!main)return;
  const inquiry=directInquiryPanel(main),examples=$('tab-inquiry-reply-examples'),requestsPanel=$('zrReservationChangeAdminPanel'),smsPanel=$('zrReservationChangeSmsPanel');
  if(mode==='requests'){
    inquiry?.classList.add('hidden');examples?.classList.add('hidden');requestsPanel?.classList.remove('hidden');smsPanel?.classList.add('hidden');setTabClasses('zrReservationChangeAdminRequestSubtab');renderRequests();
  }else if(mode==='sms'){
    inquiry?.classList.add('hidden');examples?.classList.add('hidden');requestsPanel?.classList.add('hidden');smsPanel?.classList.remove('hidden');setTabClasses('zrReservationChangeAdminSmsSubtab');renderSmsPanel();
  }
}
function leaveChangeMode(){
  $('zrReservationChangeAdminPanel')?.classList.add('hidden');$('zrReservationChangeSmsPanel')?.classList.add('hidden');
}

function renderRequests(){
  const host=$('zrReservationChangeAdminList');if(!host)return;
  const all=requests(),filter=$('zrReservationChangeStatusFilter')?.value||'all',rows=filter==='all'?all:all.filter(x=>x.status===filter);
  if($('zrReservationChangeCount'))$('zrReservationChangeCount').textContent=`${rows.length}건 / 전체 ${all.length}건`;
  if(!rows.length){host.innerHTML='<div class="zr-cr-empty">조건에 맞는 예약 변경 요청이 없습니다.</div>';return}
  host.innerHTML=rows.map(r=>`<article class="zr-cr-card" data-change-index="${r.index}"><div class="zr-cr-card-head"><span class="zr-cr-status ${statusClass(r.status)}">${statusLabel(r.status)}</span><span class="zr-cr-org">${esc(r.org)}</span>${r.created?`<span class="zr-cr-created">접수 ${esc(formatCreated(r.created))}</span>`:''}</div><div class="zr-cr-route"><div class="zr-cr-box"><strong>기존 예약</strong><b>${esc(r.oldDate||'-')} · ${esc(r.oldEntry||'--:--')}${r.oldExit?` ~ ${esc(r.oldExit)}`:''}</b></div><div class="zr-cr-arrow">→</div><div class="zr-cr-box requested"><strong>변경 요청</strong><b>${esc(r.requestedDate||'-')} · ${esc(r.requestedTime||'--:--')}</b></div></div><div class="zr-cr-meta"><span>문의자 ${esc(r.name)}</span><span>연락처 ${esc(r.mobile||'-')}</span><span>예약번호 ${esc(r.targetId||'-')}</span></div><div class="zr-cr-body" title="${esc(r.body)}">${esc(r.body)}</div><div class="zr-cr-actions"><button type="button" class="btn-primary zr-cr-apply" data-change-apply="${r.index}">예약 반영</button><button type="button" class="btn-gray" data-change-detail="${r.index}">자세히</button><button type="button" class="btn-gray zr-cr-sms" data-change-sms="${r.index}">확정문자</button><button type="button" class="btn-gray" data-change-done="${r.index}">${r.status==='done'?'처리완료됨':'처리완료'}</button></div></article>`).join('');
}
function findBooking(req){
  const list=readList(BOOKING_KEY);
  let index=list.findIndex(b=>b&&!b.__availabilityOnly&&req.targetId&&String(b.id||'')===String(req.targetId));
  if(index<0)index=list.findIndex(b=>b&&!b.__availabilityOnly&&norm(b.orgName)===norm(req.org)&&(!req.oldDate||String(b.date||'')===req.oldDate));
  return {list,index,booking:index>=0?list[index]:null};
}
function ensureApplyModal(){
  if($('zrReservationChangeApplyModal'))return;
  const m=document.createElement('div');m.id='zrReservationChangeApplyModal';m.className='modal hidden';m.innerHTML=`<div class="modal-card"><h2 style="margin:0">예약 날짜·시간 반영</h2><div class="help" id="zrReservationChangeApplyHelp" style="margin-top:7px"></div><div class="zr-cr-compare"><div class="zr-cr-box"><strong>기존 예약</strong><b id="zrReservationChangeApplyOld"></b></div><div class="zr-cr-box requested"><strong>고객 요청</strong><b id="zrReservationChangeApplyRequested"></b></div></div><div class="zr-cr-form-grid"><div><label class="req">변경예약날짜</label><input type="date" id="zrReservationChangeApplyDate"></div><div><label class="req">변경예약시간</label><input type="time" step="1800" id="zrReservationChangeApplyTime"></div></div><div class="help" style="margin-top:10px">입장시간을 변경하면 기존 체류시간을 유지하도록 퇴장시간도 함께 이동합니다. 확정 스케줄이 이미 있는 예약은 스케줄 관리에서 한 번 더 확인해주세요.</div><div class="modal-actions"><button type="button" class="btn-gray" id="zrReservationChangeApplyCancel">취소</button><button type="button" class="btn-primary" id="zrReservationChangeApplyConfirm">예약에 반영</button></div></div>`;document.body.appendChild(m);
  $('zrReservationChangeApplyCancel').onclick=()=>m.classList.add('hidden');$('zrReservationChangeApplyConfirm').onclick=applyBookingChange;
}
function openApply(index){
  const req=parseChange(readList(INQUIRY_KEY)[index],index);if(!req){toastSafe('변경 요청 정보를 찾지 못했습니다.');return}
  const found=findBooking(req);if(!found.booking){toastSafe('연결된 예약을 찾지 못했습니다. 예약 자세히에서 먼저 예약번호를 확인해주세요.');return}
  ensureApplyModal();currentApplyIndex=index;
  $('zrReservationChangeApplyOld').textContent=`${found.booking.date||req.oldDate||'-'} · ${found.booking.entryTime||req.oldEntry||'--:--'}${found.booking.exitTime?` ~ ${found.booking.exitTime}`:''}`;
  $('zrReservationChangeApplyRequested').textContent=`${req.requestedDate||'-'} · ${req.requestedTime||'--:--'}`;
  $('zrReservationChangeApplyDate').value=req.requestedDate||found.booking.date||'';$('zrReservationChangeApplyTime').value=req.requestedTime||found.booking.entryTime||'';
  $('zrReservationChangeApplyHelp').textContent=found.booking.status==='confirmed'?'현재 확정 예약입니다. 반영 후 현장/고객 확정 스케줄도 확인해주세요.':'고객 요청값이 미리 입력되어 있습니다. 필요하면 수정한 뒤 반영하세요.';
  $('zrReservationChangeApplyModal').classList.remove('hidden');
}
function applyBookingChange(){
  if(currentApplyIndex<0)return;
  const inquiries=readList(INQUIRY_KEY),req=parseChange(inquiries[currentApplyIndex],currentApplyIndex);if(!req)return;
  const found=findBooking(req),booking=found.booking;if(!booking){toastSafe('연결된 예약을 찾지 못했습니다.');return}
  const date=$('zrReservationChangeApplyDate')?.value||'',entry=$('zrReservationChangeApplyTime')?.value||'';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){toastSafe('변경예약날짜를 확인해주세요.');$('zrReservationChangeApplyDate')?.focus();return}
  const newMin=timeToMin(entry);if(!Number.isFinite(newMin)){toastSafe('변경예약시간을 확인해주세요.');$('zrReservationChangeApplyTime')?.focus();return}
  const oldStart=timeToMin(booking.entryTime),oldEnd=timeToMin(booking.exitTime),duration=Number.isFinite(oldStart)&&Number.isFinite(oldEnd)&&oldEnd>oldStart?oldEnd-oldStart:NaN;
  const exit=Number.isFinite(duration)?minToTime(newMin+duration):String(booking.exitTime||'');
  if(Number.isFinite(duration)&&!exit){toastSafe('기존 체류시간 기준 퇴장시간이 하루를 넘어갑니다. 시간을 다시 확인해주세요.');return}
  found.list[found.index]={...booking,date,entryTime:entry,exitTime:exit||booking.exitTime};
  writeList(BOOKING_KEY,found.list);
  const item=inquiries[currentApplyIndex];item.changeRequestStatus='applied';item.changeAppliedAt=new Date().toISOString();item.changeAppliedDate=date;item.changeAppliedTime=entry;item.changeAppliedExitTime=exit||booking.exitTime;item.changeRequestUpdatedAt=new Date().toISOString();writeList(INQUIRY_KEY,inquiries);
  $('zrReservationChangeApplyModal').classList.add('hidden');currentApplyIndex=-1;renderRequests();filterGeneralList();toastSafe('예약 날짜와 시간을 반영했습니다.');
}
function markDone(index){
  const list=readList(INQUIRY_KEY),item=list[index];if(!item||!isChangeItem(item))return;
  if(item.changeRequestStatus==='done'){toastSafe('이미 처리완료된 요청입니다.');return}
  if(!confirm('이 예약 변경 요청을 처리완료로 표시할까요?'))return;
  item.changeRequestStatus='done';item.changeCompletedAt=new Date().toISOString();item.changeRequestUpdatedAt=new Date().toISOString();writeList(INQUIRY_KEY,list);renderRequests();filterGeneralList();
}
function ensureDetailModal(){
  if($('zrReservationChangeDetailModal'))return;
  const m=document.createElement('div');m.id='zrReservationChangeDetailModal';m.className='modal hidden';m.innerHTML=`<div class="modal-card"><h2 style="margin:0 0 14px">예약 변경 요청 자세히</h2><div id="zrReservationChangeDetailBody"></div><div class="modal-actions"><button type="button" class="btn-gray" id="zrReservationChangeDetailClose">닫기</button></div></div>`;document.body.appendChild(m);$('zrReservationChangeDetailClose').onclick=()=>m.classList.add('hidden');
}
function openDetail(index){
  const req=parseChange(readList(INQUIRY_KEY)[index],index);if(!req)return;ensureDetailModal();currentDetailIndex=index;
  const found=findBooking(req),current=found.booking;
  $('zrReservationChangeDetailBody').innerHTML=`<div class="zr-cr-detail-row"><span>처리상태</span><div>${esc(statusLabel(req.status))}</div></div><div class="zr-cr-detail-row"><span>예약번호</span><div>${esc(req.targetId||'-')}</div></div><div class="zr-cr-detail-row"><span>단체명</span><div>${esc(req.org)}</div></div><div class="zr-cr-detail-row"><span>문의자 / 연락처</span><div>${esc(req.name)} · ${esc(req.mobile||'-')}</div></div><div class="zr-cr-detail-row"><span>기존 예약</span><div>${esc(req.oldDate||'-')} · ${esc(req.oldEntry||'--:--')}${req.oldExit?` ~ ${esc(req.oldExit)}`:''}</div></div><div class="zr-cr-detail-row"><span>변경 요청</span><div>${esc(req.requestedDate||'-')} · ${esc(req.requestedTime||'--:--')}</div></div>${current?`<div class="zr-cr-detail-row full"><span>현재 저장된 예약</span><div>${esc(current.date||'-')} · ${esc(current.entryTime||'--:--')}${current.exitTime?` ~ ${esc(current.exitTime)}`:''} · ${esc(current.status||'')}</div></div>`:''}<div class="zr-cr-detail-row full"><span>변경 문의 내용</span><div>${esc(req.body)}</div></div>`;
  $('zrReservationChangeDetailModal').classList.remove('hidden');
}

function smsTemplate(){return localStorage.getItem(SMS_KEY)||DEFAULT_SMS}
function applySmsTemplate(req){return smsTemplate().replaceAll('{단체명}',req?.org||'').replaceAll('{예약자}',req?.name||'').replaceAll('{변경일}',req?.item?.changeAppliedDate||req?.requestedDate||'').replaceAll('{변경시간}',req?.item?.changeAppliedTime||req?.requestedTime||'')}
function renderSmsPanel(selectedIndex=null){
  const rows=requests();if($('zrReservationChangeSmsTemplate'))$('zrReservationChangeSmsTemplate').value=smsTemplate();
  const sel=$('zrReservationChangeSmsRequest');if(!sel)return;
  const old=selectedIndex!=null?String(selectedIndex):sel.value;
  sel.innerHTML='<option value="">변경요청을 선택해주세요</option>'+rows.map(r=>`<option value="${r.index}">${esc(`${r.org} · ${r.requestedDate||'-'} ${r.requestedTime||''} · ${statusLabel(r.status)}`)}</option>`).join('');
  if(rows.some(r=>String(r.index)===old))sel.value=old;else if(selectedIndex!=null)sel.value=String(selectedIndex);
  updateSmsPreview();
}
function selectedSmsRequest(){const i=Number($('zrReservationChangeSmsRequest')?.value);return Number.isInteger(i)?parseChange(readList(INQUIRY_KEY)[i],i):null}
function updateSmsPreview(){const r=selectedSmsRequest();if($('zrReservationChangeSmsPreview'))$('zrReservationChangeSmsPreview').textContent=r?applySmsTemplate(r):'변경요청을 선택하면 확정문자 미리보기가 표시됩니다.'}
function saveSmsTemplate(){const text=$('zrReservationChangeSmsTemplate')?.value.trim()||'';if(!text){toastSafe('확정문자 문구를 입력해주세요.');return}localStorage.setItem(SMS_KEY,text);updateSmsPreview();toastSafe('예약변경 확정문자를 저장했습니다.')}
async function copySms(){const r=selectedSmsRequest();if(!r){toastSafe('변경요청을 선택해주세요.');return}const text=applySmsTemplate(r);try{await navigator.clipboard.writeText(text);toastSafe('확정문자를 복사했습니다.')}catch{prompt('아래 문구를 복사해주세요.',text)}}
function smsUrl(phone,text){const number=tel(phone),body=encodeURIComponent(text),ios=/iPad|iPhone|iPod/.test(navigator.userAgent);return `sms:${number}${ios?'&':'?'}body=${body}`}
function openSms(){const r=selectedSmsRequest();if(!r){toastSafe('변경요청을 선택해주세요.');return}if(!r.mobile){toastSafe('고객 휴대폰번호가 없습니다.');return}window.location.href=smsUrl(r.mobile,applySmsTemplate(r))}
function openSmsFor(index){openMode('sms');renderSmsPanel(index)}

function filterGeneralList(){
  const list=$('zrInquiryReplyList');if(!list)return;
  const inquiries=readList(INQUIRY_KEY);let visible=0;
  list.querySelectorAll('.zr-ir-card[data-index]').forEach(card=>{const item=inquiries[Number(card.dataset.index)],hide=isChangeItem(item);card.classList.toggle('hidden',hide);if(!hide)visible++});
  const general=inquiries.filter(x=>x&&!isPreview(x)&&!isChangeItem(x)),pending=general.filter(x=>!contentOf(x).includes(REPLY_MARKER)).length;
  if($('zrInquiryReplyCount'))$('zrInquiryReplyCount').textContent=`조회 ${visible}건 · 전체 ${general.length}건 · 미답변 ${pending}건`;
}
function installListObserver(){
  const list=$('zrInquiryReplyList');if(!list||listObserver)return;
  listObserver=new MutationObserver(filterGeneralList);listObserver.observe(list,{childList:true});filterGeneralList();
}

function activateParentThen(targetId){
  const parent=document.querySelector('#zrAdminShellRail [data-zr-admin-item="inquiries"]');
  try{parent?.click()}catch{}
  setTimeout(()=>$(targetId)?.click(),90);
}
function decoratePcSidebar(){
  const inner=document.querySelector('.zr-admin-shell-item-wrap[data-zr-submenu-parent="inquiries"] .zr-admin-shell-submenu-inner');if(!inner)return false;
  const items=[['zrChangeSidebarRequests','예약변경요청 관리','zrReservationChangeAdminRequestSubtab'],['zrChangeSidebarSms','예약변경확정문자','zrReservationChangeAdminSmsSubtab']];
  for(const [id,label,target] of items){
    if($(id))continue;const b=document.createElement('button');b.type='button';b.id=id;b.className='zr-admin-shell-subitem zr-change-sidebar-item';b.textContent=label;b.onclick=e=>{e.preventDefault();e.stopPropagation();activateParentThen(target)};inner.appendChild(b);
  }
  return true;
}
function decorateMobileMenu(){
  const panel=$('zrAdminMobileSubnavV3');if(!panel)return false;
  const section=[...panel.querySelectorAll('.zrm-section')].find(s=>norm(s.querySelector('.zrm-main')?.textContent)==='1:1 문의');if(!section)return false;
  const children=section.querySelector('.zrm-children');if(!children)return false;
  const items=[['zrMobileChangeRequests','예약변경요청 관리','zrReservationChangeAdminRequestSubtab'],['zrMobileChangeSms','예약변경확정문자','zrReservationChangeAdminSmsSubtab']];
  for(const [id,label,target] of items){
    if($(id))continue;const b=document.createElement('button');b.type='button';b.id=id;b.className='zrm-child';b.textContent=label;b.onclick=e=>{e.preventDefault();e.stopPropagation();panel.classList.remove('is-open');activateParentThen(target)};children.appendChild(b);
  }
  return true;
}
function installMobileObserver(){
  const panel=$('zrAdminMobileSubnavV3');if(!panel||mobileObserver)return;
  mobileObserver=new MutationObserver(()=>decorateMobileMenu());mobileObserver.observe(panel,{childList:true});decorateMobileMenu();
}
function bindUi(){
  $('zrReservationChangeStatusFilter').onchange=renderRequests;
  $('zrReservationChangeSmsSave').onclick=saveSmsTemplate;$('zrReservationChangeSmsRequest').onchange=updateSmsPreview;$('zrReservationChangeSmsCopy').onclick=copySms;$('zrReservationChangeSmsOpen').onclick=openSms;
  const host=$('zrReservationChangeAdminList');if(host&&host.dataset.zrBound!=='1'){
    host.dataset.zrBound='1';host.addEventListener('click',e=>{
      const a=e.target.closest('[data-change-apply]');if(a){openApply(Number(a.dataset.changeApply));return}
      const d=e.target.closest('[data-change-detail]');if(d){openDetail(Number(d.dataset.changeDetail));return}
      const s=e.target.closest('[data-change-sms]');if(s){openSmsFor(Number(s.dataset.changeSms));return}
      const done=e.target.closest('[data-change-done]');if(done)markDone(Number(done.dataset.changeDone));
    });
  }
  $('zrInquiryReplyInquirySubtab')?.addEventListener('click',()=>{leaveChangeMode();setTimeout(filterGeneralList,0)});
  $('zrInquiryReplyExampleSubtab')?.addEventListener('click',leaveChangeMode);
  document.addEventListener('zr:inquiry-replies-changed',()=>{renderRequests();renderSmsPanel();setTimeout(filterGeneralList,0)});
  window.addEventListener('storage',e=>{if(e.key===INQUIRY_KEY){renderRequests();renderSmsPanel();setTimeout(filterGeneralList,0)}});
}
function install(){
  if(installed)return true;
  const main=$('tab-inquiry-reply-v1'),nav=$('zrInquiryReplyInnerTabs');if(!main||!nav)return false;
  installStyle();ensurePanels();ensureTabs();ensureApplyModal();ensureDetailModal();bindUi();renderRequests();renderSmsPanel();installListObserver();
  decoratePcSidebar();decorateMobileMenu();installMobileObserver();
  let tries=0;const t=setInterval(()=>{decoratePcSidebar();if($('zrAdminMobileSubnavV3')){installMobileObserver();decorateMobileMenu()}if(++tries>50)clearInterval(t)},120);
  installed=true;return true;
}
function boot(){if(install())return;let tries=0;const t=setInterval(()=>{if(install()||++tries>120)clearInterval(t)},100)}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,0),{once:true});
})();