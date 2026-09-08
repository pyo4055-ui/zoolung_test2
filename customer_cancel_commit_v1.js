(()=>{
'use strict';
if(window.__ZR_CUSTOMER_CANCEL_COMMIT_V1)return;
window.__ZR_CUSTOMER_CANCEL_COMMIT_V1=true;

const KEY='zr_bookings';
const $=id=>document.getElementById(id);
const tel=v=>String(v||'').replace(/\D/g,'');
let targetId='';
let busy=false;

function readBookings(){
  try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}
  catch{return[]}
}
function toast(msg){try{window.toast?.(msg)}catch{}}
function armConfirmButton(){
  const btn=$('confirmCustomerCancel');if(!btn)return false;
  if(!busy)btn.disabled=false;
  btn.removeAttribute('aria-disabled');
  btn.style.setProperty('pointer-events','auto','important');
  btn.style.setProperty('touch-action','manipulation','important');
  const actions=btn.closest?.('.modal-actions');
  if(actions){
    actions.style.setProperty('position','relative','important');
    actions.style.setProperty('z-index','5','important');
    actions.style.setProperty('pointer-events','auto','important');
  }
  return true;
}
function currentTarget(){
  if(targetId)return targetId;
  const name=String($('startManager')?.value||'').trim(),phone=tel($('startContact')?.value||'');
  if(!name||!phone)return'';
  const matches=readBookings().filter(b=>b&&!b.__availabilityOnly&&!b.__legacyLocal&&String(b.managerName||'').trim()===name&&tel(b.contact)===phone&&!['cancelled','rejected'].includes(String(b.status||'')));
  return matches.length===1?String(matches[0].id||''):'';
}
function installOpenHook(){
  const base=window.openCustomerCancel;
  if(typeof base!=='function'||base.__zrCancelCommitV1)return false;
  const wrapped=function(id){
    targetId=String(id||'');
    const out=base.apply(this,arguments);
    [0,30,100,250].forEach(ms=>setTimeout(armConfirmButton,ms));
    return out;
  };
  wrapped.__zrCancelCommitV1=true;wrapped.__zrBase=base;
  window.openCustomerCancel=wrapped;
  try{openCustomerCancel=wrapped}catch{}
  return true;
}
function setReasonError(show){
  const err=$('zrCustomerCancelReasonError'),ta=$('zrCustomerCancelReason');
  err?.classList.toggle('show',!!show);
  if(show){ta?.focus?.();toast('취소 사유를 입력해주세요.')}
}
function closeConfirm(){
  try{window.closeModal?.('cancelConfirmModal')}catch{}
  const modal=$('cancelConfirmModal');
  if(modal){modal.classList.add('hidden');modal.setAttribute('aria-hidden','true');modal.style.removeProperty('display')}
}
function ensureSuccessModal(){
  let modal=$('zrCustomerCancelSuccessV1');if(modal)return modal;
  const style=document.createElement('style');style.id='zrCustomerCancelSuccessV1Style';style.textContent=`
    #cancelConfirmModal #confirmCustomerCancel{pointer-events:auto!important;touch-action:manipulation!important}
    #cancelConfirmModal .modal-actions{position:relative!important;z-index:5!important;pointer-events:auto!important}
    #zrCustomerCancelSuccessV1{position:fixed;inset:0;z-index:2147483400;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:rgba(37,22,16,.66)}
    #zrCustomerCancelSuccessV1.hidden{display:none!important}
    #zrCustomerCancelSuccessV1 .zr-cancel-success-card{width:min(440px,100%);box-sizing:border-box;border:1px solid rgba(91,52,36,.12);border-radius:22px;background:#fffdfa;padding:26px 22px 22px;box-shadow:0 28px 80px rgba(24,12,8,.28);text-align:center;color:#38271e}
    #zrCustomerCancelSuccessV1 .zr-cancel-success-icon{width:58px;height:58px;margin:0 auto 15px;border-radius:50%;display:grid;place-items:center;background:#fff0ed;color:#a53c34;font-size:28px;font-weight:900}
    #zrCustomerCancelSuccessV1 h2{margin:0 0 9px;font-size:22px;line-height:1.3;color:#38271e}
    #zrCustomerCancelSuccessV1 p{margin:0;color:#75675f;font-size:14px;line-height:1.65}
    #zrCustomerCancelSuccessV1 button{width:100%;min-height:48px;margin-top:20px;border:0;border-radius:13px;background:#fc5404;color:#fff;font:inherit;font-weight:900;font-size:15px;cursor:pointer}
  `;document.head.appendChild(style);
  modal=document.createElement('div');modal.id='zrCustomerCancelSuccessV1';modal.className='hidden';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','zrCustomerCancelSuccessTitleV1');
  modal.innerHTML='<div class="zr-cancel-success-card"><div class="zr-cancel-success-icon">✓</div><h2 id="zrCustomerCancelSuccessTitleV1">예약 취소가 완료되었습니다.</h2><p>취소 내역은 예약 조회에서 다시 확인할 수 있습니다.</p><button type="button" id="zrCustomerCancelSuccessOkV1">확인</button></div>';
  document.body.appendChild(modal);
  $('zrCustomerCancelSuccessOkV1')?.addEventListener('click',()=>{
    modal.classList.add('hidden');
    try{$('checkExisting')?.click()}catch{}
  });
  return modal;
}
function showSuccess(){
  const modal=ensureSuccessModal();modal.classList.remove('hidden');
  try{window.__ZR_MODAL_UX_SYNC_HEADERS?.()}catch{}
}
function refreshLookup(){
  [0,80,240].forEach(ms=>setTimeout(()=>{try{$('checkExisting')?.click()}catch{}},ms));
}
async function commitCancellation(id,reason){
  const bridge=window.zrReservationFirebase;
  if(!bridge||typeof bridge.waitForWrites!=='function'||typeof window.setStore!=='function')throw new Error('bridge-not-ready');
  const list=readBookings(),b=list.find(x=>String(x?.id||'')===String(id));
  if(!b||b.__availabilityOnly)throw new Error('booking-not-found');
  if(b.__legacyLocal)throw new Error('legacy-local');
  const uid=String(bridge.auth?.currentUser?.uid||bridge.user?.uid||'');
  if(b.ownerUid&&uid&&String(b.ownerUid)!==uid)throw new Error('owner-mismatch');
  if(String(b.status||'')==='cancelled')return b;

  b.status='cancelled';
  b.cancelledAt=new Date().toISOString();
  b.cancelledBy='customer';
  b.cancelReason=reason;
  b.cancelReviewed=false;
  delete b.cancelReviewedAt;delete b.cancelReviewedBy;
  window.setStore(KEY,list);

  const requestId=String(b?.reservationChangeRequest?.id||b?.reservationChangeRequest?.requestId||'');
  if(requestId&&typeof bridge.clearChangePlayHold==='function'){
    try{await bridge.clearChangePlayHold(requestId)}catch{}
  }
  await bridge.waitForWrites();
  return b;
}
async function onConfirm(e){
  if(busy){e.preventDefault();e.stopImmediatePropagation();return}
  const reason=String($('zrCustomerCancelReason')?.value||'').trim();
  if(!reason){e.preventDefault();e.stopImmediatePropagation();setReasonError(true);return}
  setReasonError(false);
  const id=currentTarget();
  if(!id){e.preventDefault();e.stopImmediatePropagation();toast('취소할 예약을 확인하지 못했습니다. 예약 조회 후 다시 시도해주세요.');return}
  const bridge=window.zrReservationFirebase;
  if(!bridge||typeof bridge.waitForWrites!=='function'||typeof window.setStore!=='function'){
    e.preventDefault();e.stopImmediatePropagation();toast('예약 DB 연결을 준비 중입니다. 잠시 후 다시 시도해주세요.');return;
  }

  e.preventDefault();e.stopImmediatePropagation();busy=true;
  const btn=$('confirmCustomerCancel'),oldText=btn?.textContent||'예약 취소하기';
  if(btn){btn.disabled=true;btn.textContent='취소 처리 중...'}
  try{
    await commitCancellation(id,reason);
    closeConfirm();refreshLookup();showSuccess();
    try{document.dispatchEvent(new CustomEvent('zr:customer-cancel-completed',{detail:{id}}))}catch{}
    targetId='';
  }catch(err){
    console.error('customer cancellation commit',err);
    const code=String(err?.message||err||'');
    if(code==='legacy-local'||code==='owner-mismatch')toast('이 예약의 공용 DB 연결을 확인할 수 없습니다. 새로고침 후 예약 조회를 다시 해주세요.');
    else if(code==='booking-not-found')toast('취소할 예약을 찾지 못했습니다. 예약 조회 후 다시 시도해주세요.');
    else if(code==='bridge-not-ready')toast('예약 DB 연결을 준비 중입니다. 잠시 후 다시 시도해주세요.');
    else toast('예약 취소 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
  }finally{
    busy=false;if(btn){btn.disabled=false;btn.textContent=oldText;armConfirmButton()}
  }
}
function handleConfirmClick(e){
  const btn=e.target?.closest?.('#confirmCustomerCancel');
  if(!btn)return;
  onConfirm(e);
}
function bind(){installOpenHook();armConfirmButton()}
function boot(){
  ensureSuccessModal();
  document.addEventListener('click',handleConfirmClick,true);
  [0,80,220,600,1400,3000,6000].forEach(ms=>setTimeout(bind,ms));
  document.addEventListener('zr:customer-runtime-ready',()=>{bind();setTimeout(bind,250)});
  document.addEventListener('zr:customer-firebase-ready',()=>{bind();setTimeout(bind,120)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();