(()=>{
'use strict';
if(window.__ZR_CUSTOMER_LOOKUP_ACTIONS_V1)return;
window.__ZR_CUSTOMER_LOOKUP_ACTIONS_V1=true;

const $=id=>document.getElementById(id);
const tel=s=>String(s||'').replace(/\D/g,'');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=s=>{try{window.toast?.(s)}catch{}};
let cancelTargetId='';
let cancelMode=false;

function readBookings(){try{return JSON.parse(localStorage.getItem('zr_bookings')||'[]')}catch{return[]}}
function customerBookings(includeCancelled=true){
  const manager=String($('startManager')?.value||'').trim();
  const contact=tel($('startContact')?.value||'');
  if(!manager||!contact)return [];
  return readBookings().filter(b=>{
    if(!b||b.__availabilityOnly)return false;
    if(String(b.managerName||'').trim()!==manager||tel(b.contact)!==contact)return false;
    const status=String(b.status||'');
    return includeCancelled?status!=='rejected':!['cancelled','rejected'].includes(status);
  });
}
function cancellableCustomerBookings(){return customerBookings(false)}
function dateTimeText(v){
  if(!v)return '';
  const d=new Date(v);if(Number.isNaN(d.getTime()))return String(v);
  const p=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function injectStyle(){
  if($('zrCustomerLookupActionsV1Style'))return;
  const s=document.createElement('style');s.id='zrCustomerLookupActionsV1Style';s.textContent=`
  #existingBookingList .zr-confirmed-emphasis{display:flex;align-items:center;gap:8px;margin:0 0 12px;padding:11px 12px;border:1px solid #b9d9c5;border-radius:11px;background:#eaf6ee;color:#245b40;font-size:14px;font-weight:900;line-height:1.45}
  #existingBookingList .zr-cancelled-emphasis,#cancelSuccessView .zr-cancelled-emphasis{display:flex;align-items:center;gap:8px;margin:0 0 12px;padding:11px 12px;border:1px solid #e5bcbc;border-radius:11px;background:#fff0f0;color:#8b3434;font-size:14px;font-weight:900;line-height:1.45}
  #existingBookingList .zr-cancel-list-heading{margin:0 0 12px;padding:12px 13px;border:1px solid #ebcaca;border-radius:11px;background:#fff4f4;color:#7c3737;font-size:13px;font-weight:850;line-height:1.5}
  #existingBookingList .zr-cancelled-records{display:grid;gap:10px;margin-top:10px}
  #existingBookingList .zr-cancelled-record{border:1px solid #e3caca!important;background:#fffafa!important}
  #existingBookingList .zr-cancelled-record-head{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px}
  #existingBookingList .zr-cancelled-record-head b{font-size:16px}.zr-cancelled-record-id{font-size:10px;color:#7b817d;word-break:break-all}
  #existingBookingList .zr-cancelled-record-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px 12px;margin-top:9px}
  #existingBookingList .zr-cancelled-record-grid>div{font-size:12px;line-height:1.5;color:#525d56}.zr-cancelled-record-grid span{display:block;font-size:10px;color:#7a837d;font-weight:800;margin-bottom:1px}
  #existingBookingList .zr-cancelled-reason{margin-top:10px;padding:9px 10px;border-radius:9px;background:#fff0f0;color:#704242;font-size:12px;line-height:1.55;white-space:pre-wrap}
  #cancelConfirmModal .zr-cancel-reason-wrap{margin-top:14px;padding-top:13px;border-top:1px solid #ecefec}
  #cancelConfirmModal .zr-cancel-reason-wrap label{display:block;margin-bottom:6px;font-size:13px;font-weight:900;color:#313b35}
  #cancelConfirmModal #zrCustomerCancelReason{width:100%;min-height:94px;box-sizing:border-box;resize:vertical;padding:10px 11px;border:1px solid #cfd8d2;border-radius:10px;font:inherit;line-height:1.5;background:#fff}
  #cancelConfirmModal #zrCustomerCancelReason:focus{outline:2px solid rgba(166,67,67,.18);border-color:#b56b6b}
  #cancelConfirmModal .zr-cancel-reason-help{margin-top:6px;font-size:11px;color:#707a73;line-height:1.5}
  #cancelConfirmModal .zr-cancel-reason-error{display:none;margin-top:6px;font-size:11px;font-weight:800;color:#a33b3b}
  #cancelConfirmModal .zr-cancel-reason-error.show{display:block}
  @media(max-width:560px){#existingBookingList .zr-cancelled-record-grid{grid-template-columns:1fr}}
  `;document.head.appendChild(s);
}

function ensureReasonUi(){
  const modal=$('cancelConfirmModal');if(!modal)return false;
  const card=modal.querySelector('.modal-card');if(!card)return false;
  let wrap=$('zrCustomerCancelReasonWrap');
  if(!wrap){
    wrap=document.createElement('div');wrap.id='zrCustomerCancelReasonWrap';wrap.className='zr-cancel-reason-wrap';
    wrap.innerHTML='<label for="zrCustomerCancelReason">취소 사유 <span style="color:#a33b3b">*</span></label><textarea id="zrCustomerCancelReason" maxlength="300" placeholder="예약 취소 사유를 입력해주세요."></textarea><div class="zr-cancel-reason-help">작성한 사유는 예약 취소 내역과 함께 저장됩니다.</div><div class="zr-cancel-reason-error" id="zrCustomerCancelReasonError">취소 사유를 입력해주세요.</div>';
    const actions=card.querySelector('.modal-actions');actions?.insertAdjacentElement('beforebegin',wrap);
  }
  const title=card.querySelector('h2');if(title)title.textContent='예약 취소하기';
  const confirm=$('confirmCustomerCancel');if(confirm)confirm.textContent='예약 취소하기';
  return true;
}
function resetReason(){
  const ta=$('zrCustomerCancelReason'),err=$('zrCustomerCancelReasonError');
  if(ta)ta.value='';if(err)err.classList.remove('show');
}

function installCancelOpenWrapper(){
  const base=window.openCustomerCancel;
  if(typeof base!=='function'||base.__zrReasonV1)return false;
  const wrapped=function(id){
    cancelTargetId=String(id||'');
    ensureReasonUi();resetReason();
    const out=base.apply(this,arguments);
    setTimeout(()=>{ensureReasonUi();$('zrCustomerCancelReason')?.focus?.()},30);
    return out;
  };
  wrapped.__zrReasonV1=true;wrapped.__zrBase=base;
  window.openCustomerCancel=wrapped;
  try{openCustomerCancel=wrapped}catch{}
  return true;
}

function persistCancelReason(id,reason){
  if(!id||!reason)return;
  setTimeout(()=>{
    const list=readBookings();const b=list.find(x=>String(x?.id||'')===String(id));
    if(!b||String(b.status||'')!=='cancelled')return;
    if(String(b.cancelReason||'')===reason)return;
    b.cancelReason=reason;
    try{
      if(typeof window.setStore==='function')window.setStore('zr_bookings',list);
      else localStorage.setItem('zr_bookings',JSON.stringify(list));
    }catch(e){console.error('cancel reason persist',e);toast('예약은 취소됐지만 취소 사유 저장을 확인해주세요.');}
  },0);
}

function decorateCancelSuccess(){
  const view=$('cancelSuccessView');if(!view)return;
  let banner=view.querySelector('.zr-cancelled-emphasis');
  if(!banner){banner=document.createElement('div');banner.className='zr-cancelled-emphasis';view.prepend(banner)}
  banner.textContent='본 예약은 취소 되었습니다.';
}
function bindConfirmGuard(){
  const btn=$('confirmCustomerCancel');if(!btn||btn.dataset.zrReasonGuard==='1')return false;
  btn.dataset.zrReasonGuard='1';
  btn.addEventListener('click',e=>{
    const ta=$('zrCustomerCancelReason'),err=$('zrCustomerCancelReasonError');
    const reason=String(ta?.value||'').trim();
    if(!reason){
      e.preventDefault();e.stopImmediatePropagation();
      err?.classList.add('show');ta?.focus?.();toast('취소 사유를 입력해주세요.');return;
    }
    err?.classList.remove('show');
    const id=cancelTargetId;
    persistCancelReason(id,reason);
    setTimeout(()=>{cancelMode=false;decorateCancelSuccess();decorateList();renderCancelledRecords();syncLookupActions()},40);
    setTimeout(()=>{decorateCancelSuccess();decorateList();renderCancelledRecords();syncLookupActions()},300);
  },true);
  return true;
}

function statusBanner(card){
  if(card.classList.contains('zr-cancelled-record'))return;
  const statuses=[...card.querySelectorAll('.status')];
  const cancelled=statuses.some(x=>/취소/.test(String(x.textContent||'').trim())||x.classList.contains('cancelled'));
  const confirmed=statuses.some(x=>String(x.textContent||'').trim()==='확정'||x.classList.contains('confirmed'));
  const oldConfirmed=card.querySelector('.zr-confirmed-emphasis'),oldCancelled=card.querySelector('.zr-cancelled-emphasis');
  if(cancelled){
    oldConfirmed?.remove();
    let banner=oldCancelled;if(!banner){banner=document.createElement('div');banner.className='zr-cancelled-emphasis';card.prepend(banner)}
    banner.textContent='본 예약은 취소 되었습니다.';
    return;
  }
  oldCancelled?.remove();
  if(!confirmed){oldConfirmed?.remove();return}
  let banner=oldConfirmed;if(!banner){banner=document.createElement('div');banner.className='zr-confirmed-emphasis';card.prepend(banner)}
  banner.textContent='본 예약은 담당자로부터 예약확정 되었습니다.';
}
function renameCancelButtons(root=document){
  root.querySelectorAll?.('button').forEach(btn=>{
    const t=String(btn.textContent||'').replace(/\s+/g,' ').trim();
    if(['예약 내역 취소','예약 취소하기','이 예약 취소하기'].includes(t))btn.textContent=cancelMode?'이 예약 취소하기':'예약 취소하기';
  });
}
function cancelledRecordHtml(b){
  const by=String(b.cancelledBy||'')==='customer'?'고객 취소':String(b.cancelledBy||'')==='admin'?'관리자 취소':'취소';
  const when=dateTimeText(b.cancelledAt)||'-';
  const reason=String(b.cancelReason||'').trim();
  return `<div class="existing-card zr-cancelled-record" data-zr-cancelled-id="${esc(b.id)}">
    <div class="zr-cancelled-emphasis">본 예약은 취소 되었습니다.</div>
    <div class="zr-cancelled-record-head"><span class="status cancelled">취소</span><b>${esc(b.orgName||'단체 예약')}</b></div>
    <div class="zr-cancelled-record-id">예약번호 ${esc(b.id||'-')}</div>
    <div class="zr-cancelled-record-grid">
      <div><span>방문일</span>${esc(b.date||'-')}</div><div><span>예약시간</span>${esc(b.entryTime||'--:--')} ~ ${esc(b.exitTime||'--:--')}</div>
      <div><span>취소일시</span>${esc(when)}</div><div><span>취소구분</span>${esc(by)}</div>
    </div>
    ${reason?`<div class="zr-cancelled-reason"><b>취소 사유</b><br>${esc(reason)}</div>`:''}
  </div>`;
}
function renderCancelledRecords(){
  const list=$('existingBookingList');if(!list)return;
  const old=$('zrCancelledBookingRecordsV2');
  if(cancelMode){old?.remove();return}
  const cancelled=customerBookings(true).filter(b=>String(b.status||'')==='cancelled');
  if(!cancelled.length){old?.remove();return}
  const baseCards=[...list.querySelectorAll('.existing-card:not(.zr-cancelled-record)')];
  const shown=cancelled.filter(b=>!baseCards.some(card=>{
    const text=String(card.textContent||'');
    return /취소/.test(text)&&text.includes(String(b.orgName||''))&&text.includes(String(b.date||''));
  }));
  if(!shown.length){old?.remove();list.classList.remove('hidden');return}
  const html=shown.sort((a,b)=>String(b.cancelledAt||b.createdAt||'').localeCompare(String(a.cancelledAt||a.createdAt||''))).map(cancelledRecordHtml).join('');
  let box=old;
  if(!box){box=document.createElement('div');box.id='zrCancelledBookingRecordsV2';box.className='zr-cancelled-records';list.appendChild(box)}
  if(box.innerHTML!==html)box.innerHTML=html;
  list.classList.remove('hidden');
}
function decorateList(){
  const list=$('existingBookingList');if(!list)return;
  renameCancelButtons(list);
  list.querySelectorAll('.existing-card').forEach(statusBanner);
  if(cancelMode){
    let head=list.querySelector('.zr-cancel-list-heading');
    if(!head){head=document.createElement('div');head.className='zr-cancel-list-heading';list.prepend(head)}
    head.textContent='취소하실 예약의 ‘이 예약 취소하기’ 버튼을 눌러주세요. 취소 사유를 입력한 뒤 최종 취소됩니다.';
  }else list.querySelector('.zr-cancel-list-heading')?.remove();
}
function syncLookupActions(){
  const all=customerBookings(true),active=cancellableCustomerBookings();
  if(!all.length)return;
  const existing=$('existingActions'),newActions=$('newBookingActions');
  existing?.classList.remove('hidden');
  if(active.length)newActions?.classList.add('hidden');else newActions?.classList.remove('hidden');
  $('changeExisting')?.classList.toggle('hidden',active.length===0);
  $('cancelExisting')?.classList.toggle('hidden',active.length===0);
  if($('existingCount'))$('existingCount').textContent=`${all.length}건`;
}

function wrapActionButtons(){
  const lookup=$('lookupBooking');
  if(lookup&&lookup.dataset.zrCancelledLookupV2!=='1'){
    lookup.dataset.zrCancelledLookupV2='1';
    lookup.addEventListener('click',()=>{
      cancelMode=false;
      [0,80,220,600].forEach(ms=>setTimeout(syncLookupActions,ms));
    });
  }
  const check=$('checkExisting');
  if(check&&check.dataset.zrCancelModeV1!=='1'){
    check.dataset.zrCancelModeV1='1';
    check.addEventListener('click',()=>{
      cancelMode=false;
      [0,100,300,800,1500].forEach(ms=>setTimeout(()=>{decorateList();renderCancelledRecords();syncLookupActions()},ms));
    });
  }
  const cancel=$('cancelExisting');
  if(cancel&&cancel.dataset.zrCancelModeV1!=='1'){
    cancel.dataset.zrCancelModeV1='1';cancel.textContent='3. 예약 취소하기';
    const base=cancel.onclick;
    cancel.onclick=function(ev){
      cancelMode=true;
      const matches=cancellableCustomerBookings();
      if(!matches.length){toast('취소할 수 있는 예약 내역이 없습니다.');return}
      const out=typeof base==='function'?base.call(this,ev):undefined;
      setTimeout(()=>{
        decorateList();renderCancelledRecords();const list=$('existingBookingList');list?.classList.remove('hidden');list?.scrollIntoView?.({behavior:'smooth',block:'nearest'});
      },0);
      return out;
    };
  }
}

let pending=false;
function enhance(){
  if(pending)return;pending=true;
  requestAnimationFrame(()=>{
    pending=false;injectStyle();ensureReasonUi();installCancelOpenWrapper();bindConfirmGuard();wrapActionButtons();decorateList();decorateCancelSuccess();
  });
}
function boot(){
  enhance();
  new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('[data-close="cancelConfirmModal"]')){cancelTargetId='';resetReason()}
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();