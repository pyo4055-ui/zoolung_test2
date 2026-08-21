(()=>{
'use strict';
if(window.__ZR_CUSTOMER_LOOKUP_ACTIONS_V1)return;
window.__ZR_CUSTOMER_LOOKUP_ACTIONS_V1=true;

const $=id=>document.getElementById(id);
const tel=s=>String(s||'').replace(/\D/g,'');
const toast=s=>{try{window.toast?.(s)}catch{}};
let cancelTargetId='';
let cancelMode=false;

function readBookings(){try{return JSON.parse(localStorage.getItem('zr_bookings')||'[]')}catch{return[]}}
function customerMatchesFallback(){
  const manager=String($('startManager')?.value||'').trim();
  const contact=tel($('startContact')?.value||'');
  if(!manager||!contact)return [];
  return readBookings().filter(b=>b&&!b.__availabilityOnly&&!['cancelled','rejected'].includes(String(b.status||''))&&String(b.managerName||'').trim()===manager&&tel(b.contact)===contact);
}
function customerMatchesSafe(){
  try{if(typeof window.customerMatches==='function')return window.customerMatches()||[]}catch{}
  return customerMatchesFallback();
}

function injectStyle(){
  if($('zrCustomerLookupActionsV1Style'))return;
  const s=document.createElement('style');s.id='zrCustomerLookupActionsV1Style';s.textContent=`
  #existingBookingList .zr-confirmed-emphasis{display:flex;align-items:center;gap:8px;margin:0 0 12px;padding:11px 12px;border:1px solid #b9d9c5;border-radius:11px;background:#eaf6ee;color:#245b40;font-size:14px;font-weight:900;line-height:1.45}
  #existingBookingList .zr-cancel-list-heading{margin:0 0 12px;padding:12px 13px;border:1px solid #ebcaca;border-radius:11px;background:#fff4f4;color:#7c3737;font-size:13px;font-weight:850;line-height:1.5}
  #cancelConfirmModal .zr-cancel-reason-wrap{margin-top:14px;padding-top:13px;border-top:1px solid #ecefec}
  #cancelConfirmModal .zr-cancel-reason-wrap label{display:block;margin-bottom:6px;font-size:13px;font-weight:900;color:#313b35}
  #cancelConfirmModal #zrCustomerCancelReason{width:100%;min-height:94px;box-sizing:border-box;resize:vertical;padding:10px 11px;border:1px solid #cfd8d2;border-radius:10px;font:inherit;line-height:1.5;background:#fff}
  #cancelConfirmModal #zrCustomerCancelReason:focus{outline:2px solid rgba(166,67,67,.18);border-color:#b56b6b}
  #cancelConfirmModal .zr-cancel-reason-help{margin-top:6px;font-size:11px;color:#707a73;line-height:1.5}
  #cancelConfirmModal .zr-cancel-reason-error{display:none;margin-top:6px;font-size:11px;font-weight:800;color:#a33b3b}
  #cancelConfirmModal .zr-cancel-reason-error.show{display:block}
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
  },true);
  return true;
}

function confirmedBanner(card){
  if(card.querySelector('.zr-confirmed-emphasis'))return;
  const confirmed=[...card.querySelectorAll('.status')].some(x=>String(x.textContent||'').trim()==='확정'||x.classList.contains('confirmed'));
  if(!confirmed)return;
  const banner=document.createElement('div');banner.className='zr-confirmed-emphasis';banner.textContent='✓ 본 예약은 담당자로부터 예약확정 되었습니다.';
  card.prepend(banner);
}
function renameCancelButtons(root=document){
  root.querySelectorAll?.('button').forEach(btn=>{
    const t=String(btn.textContent||'').replace(/\s+/g,' ').trim();
    if(t==='예약 내역 취소')btn.textContent='예약 취소하기';
  });
}
function decorateList(){
  const list=$('existingBookingList');if(!list)return;
  renameCancelButtons(list);
  list.querySelectorAll('.existing-card').forEach(confirmedBanner);
  if(cancelMode){
    let head=list.querySelector('.zr-cancel-list-heading');
    if(!head){head=document.createElement('div');head.className='zr-cancel-list-heading';head.textContent='취소할 예약을 선택해주세요. 예약을 선택한 뒤 취소 사유를 입력해야 최종 취소됩니다.';list.prepend(head)}
  }else list.querySelector('.zr-cancel-list-heading')?.remove();
}

function wrapActionButtons(){
  const check=$('checkExisting');
  if(check&&check.dataset.zrCancelModeV1!=='1'){
    check.dataset.zrCancelModeV1='1';
    check.addEventListener('click',()=>{cancelMode=false;setTimeout(decorateList,0);setTimeout(decorateList,120)});
  }
  const cancel=$('cancelExisting');
  if(cancel&&cancel.dataset.zrCancelModeV1!=='1'){
    cancel.dataset.zrCancelModeV1='1';cancel.textContent='3. 예약 취소하기';
    const base=cancel.onclick;
    cancel.onclick=function(ev){
      cancelMode=true;
      const matches=customerMatchesSafe();
      if(!matches.length){toast('취소할 수 있는 예약 내역이 없습니다.');return}
      const out=typeof base==='function'?base.call(this,ev):undefined;
      setTimeout(()=>{
        decorateList();const list=$('existingBookingList');list?.classList.remove('hidden');list?.scrollIntoView?.({behavior:'smooth',block:'nearest'});
      },0);
      return out;
    };
  }
}

let pending=false;
function enhance(){
  if(pending)return;pending=true;
  requestAnimationFrame(()=>{
    pending=false;injectStyle();ensureReasonUi();installCancelOpenWrapper();bindConfirmGuard();wrapActionButtons();decorateList();
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
