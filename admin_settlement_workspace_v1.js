(()=>{
'use strict';
if(window.__ZR_ADMIN_SETTLEMENT_WORKSPACE_V1)return;
window.__ZR_ADMIN_SETTLEMENT_WORKSPACE_V1=true;

const KEY='zr_bookings',BASE_PRICE=15000,HOLD='hold';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let currentId='',renderWrap=null,detailWrap=null,dayWrap=null;

function all(){
  try{
    const list=typeof window.bookings==='function'?window.bookings():JSON.parse(localStorage.getItem(KEY)||'[]');
    return Array.isArray(list)?list.filter(b=>b&&!b.__availabilityOnly):[];
  }catch{return []}
}
function byId(id){return all().find(b=>String(b.id)===String(id))||null}
function save(list){
  if(typeof window.setStore==='function')window.setStore(KEY,list);
  else if(typeof setStore==='function')setStore(KEY,list);
  else localStorage.setItem(KEY,JSON.stringify(list));
}
function msg(text){try{window.toast?.(text)}catch{}}
function adminOk(){
  try{
    if(typeof window.adminGuard==='function')return !!window.adminGuard(false);
    if(typeof adminGuard==='function')return !!adminGuard(false);
  }catch{}
  return !!window.zrReservationFirebase?.isStaff?.();
}
function money(v){
  try{if(typeof window.money==='function')return window.money(v);if(typeof globalThis.money==='function')return globalThis.money(v)}catch{}
  return `${Math.round(Number(v||0)).toLocaleString('ko-KR')}원`;
}
function snap(v){return {id:v.id,name:v.name,groupPrice:Number(v.groupPrice||0),ticketFeeType:v.ticketFeeType==='percent'?'percent':'flat',ticketFeeValue:Number(v.ticketFeeValue||0),cafeFeeType:v.cafeFeeType==='percent'?'percent':'flat',cafeFeeValue:Number(v.cafeFeeValue||0)}}
function currentSnapshot(b){return b?.settlement?.vendorSnapshot||b?.outsourcingVendorSnapshot||null}
function vendorsFor(b){
  const base=[{id:'self',name:'자체',groupPrice:BASE_PRICE,ticketFeeType:'flat',ticketFeeValue:0,cafeFeeType:'flat',cafeFeeValue:0}];
  try{(settings().outsourcingVendors||[]).filter(v=>String(v?.name||'').trim()).slice(0,10).forEach(v=>base.push(snap(v)))}catch{}
  const selected=b?.settlement?.vendorId||b?.outsourcingVendorId||currentSnapshot(b)?.id||'self';
  const old=currentSnapshot(b);
  if(old?.id&&old?.name&&!base.some(v=>v.id===old.id))base.push(snap(old));
  return {list:base,selected};
}
function feeAmount(amount,type,value,multiplier=1){
  amount=Math.max(0,Number(amount||0));value=Math.max(0,Number(value||0));
  if(type==='percent')return Math.round(amount*value/100);
  return Math.round(value*Math.max(0,Number(multiplier||0)));
}
function statusText(b){
  if(b?.status===HOLD)return '예약보류';
  if(b?.status==='confirmed')return '예약 확정';
  if(b?.status==='pending')return '접수 대기';
  if(b?.status==='cancelled')return '예약 취소';
  if(b?.status==='rejected')return '예약 거절';
  return String(b?.status||'-');
}
function statusClass(b){
  if(b?.status===HOLD)return 'status zr-hold-status';
  if(b?.status==='confirmed')return 'status confirmed';
  if(b?.status==='pending')return 'status pending';
  if(['cancelled','rejected'].includes(b?.status))return 'status rejected';
  return 'status';
}
function selectedVendor(root,b){
  const id=root?.querySelector('[data-zr-settle-vendor]:checked')?.value||b?.settlement?.vendorId||b?.outsourcingVendorId||'self';
  return vendorsFor(b).list.find(v=>String(v.id)===String(id))||null;
}
function calc(root,b){
  const vendor=selectedVendor(root,b);
  const paid=Math.max(0,Number(root?.querySelector('[data-zr-settle-paid]')?.value||0));
  const free=Math.max(0,Number(root?.querySelector('[data-zr-settle-free]')?.value||0));
  const paidChap=Math.max(0,Number(root?.querySelector('[data-zr-settle-paidchap]')?.value||0));
  const cafe=Math.max(0,Number(root?.querySelector('[data-zr-settle-cafe]')?.value||0));
  const unit=Math.max(0,Number(vendor?.groupPrice||0));
  const admissions=paid+paidChap,ticket=admissions*unit,total=ticket+cafe,isSelf=vendor?.id==='self';
  const ticketFee=!vendor||isSelf?0:feeAmount(ticket,vendor.ticketFeeType,vendor.ticketFeeValue,admissions);
  const cafeFee=!vendor||isSelf||cafe<=0?0:feeAmount(cafe,vendor.cafeFeeType,vendor.cafeFeeValue,1);
  return {vendor,paid,free,paidChap,cafe,unit,admissions,ticket,total,ticketFee,cafeFee,totalFee:ticketFee+cafeFee};
}
function injectStyle(){
  if($('zrSettlementWorkspaceV1Style'))return;
  const s=document.createElement('style');s.id='zrSettlementWorkspaceV1Style';s.textContent=`
  #zrSettlementWorkspaceModal .modal-card{position:relative;width:min(760px,calc(100vw - 28px));max-height:86vh;overflow:auto;padding-top:24px}
  #zrSettlementWorkspaceModal .zr-settle-close{position:absolute;top:14px;right:14px;z-index:2;min-width:68px}
  #zrSettlementWorkspaceModal .zr-settle-head{padding-right:88px}
  #zrSettlementWorkspaceModal .zr-settle-vendors{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
  #zrSettlementWorkspaceModal .zr-settle-vendor{display:flex;align-items:center;gap:6px;padding:9px 10px;border:1px solid var(--line);border-radius:10px;background:#fff;cursor:pointer}
  #zrSettlementWorkspaceModal .zr-settle-vendor:has(input:checked){background:#f0f8f3;border-color:#6b9c7d}
  #zrSettlementWorkspaceModal .zr-settle-vendor input{width:auto;margin:0}
  #zrSettlementWorkspaceModal .zr-settle-summary{margin-top:14px;padding:12px;border:1px solid var(--line);border-radius:12px;background:#f8faf8;line-height:1.65}
  #zrSettlementWorkspaceModal .zr-settle-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}
  #activityList .zr-settle-card-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:10px;flex-wrap:wrap}
  .status.zr-settlement-done{background:#eef6ff!important;border-color:#cddff1!important;color:#315e88!important;font-weight:900!important}
  @media(max-width:560px){#zrSettlementWorkspaceModal .grid2{grid-template-columns:1fr!important}.zr-cal-state-row .zr-settle-open{flex-basis:100%;width:100%}}
  `;document.head.appendChild(s);
}
function ensureModal(){
  injectStyle();if($('zrSettlementWorkspaceModal'))return;
  const m=document.createElement('div');m.id='zrSettlementWorkspaceModal';m.className='modal hidden';m.innerHTML='<div class="modal-card"><button type="button" class="btn-gray zr-settle-close" id="zrSettlementWorkspaceClose">닫기</button><div id="zrSettlementWorkspaceBody"></div></div>';document.body.appendChild(m);
  $('zrSettlementWorkspaceClose').onclick=()=>{if(typeof window.closeModal==='function')window.closeModal('zrSettlementWorkspaceModal');else m.classList.add('hidden')};
}
function renderModal(id=currentId){
  ensureModal();currentId=String(id||currentId||'');const b=byId(currentId),root=$('zrSettlementWorkspaceBody');
  if(!root||!b)return msg('예약 정보를 찾지 못했습니다.');
  const st=b.settlement||{},vInfo=vendorsFor(b),actualPaid=st.actualPaidCount??b.paidCount??0,actualFree=st.actualFreeChaperone??b.freeChaperone??0,actualPaidChap=st.actualPaidChaperone??b.paidChaperone??0,actualCafe=st.actualCafeAmount??0;
  root.innerHTML=`<div class="zr-settle-head"><h2 style="margin-bottom:5px">${esc(b.orgName||'예약')} · 실제결제</h2><div class="help">예약일 ${esc(b.date||'-')} · <span class="${statusClass(b)}">${esc(statusText(b))}</span>${st.savedAt?' · 실제결제 입력완료':''}</div></div>
    <div class="calc" style="margin-top:16px"><b>결제 구분 / 아웃소싱 업체</b><div class="help" style="margin-top:4px">실제결제 저장 시 업체와 정산값이 함께 저장됩니다.</div><div class="zr-settle-vendors">${vInfo.list.map(v=>`<label class="zr-settle-vendor"><input type="radio" name="zrSettlementVendor" data-zr-settle-vendor value="${esc(v.id)}" ${String(v.id)===String(vInfo.selected)?'checked':''}><span>${esc(v.name)}${v.id!=='self'?` <small>${money(v.groupPrice)}</small>`:''}</span></label>`).join('')}</div></div>
    <div class="grid2" style="margin-top:14px"><div><label>실제 유료인원</label><input type="number" min="0" data-zr-settle-paid value="${Number(actualPaid||0)}"></div><div><label>실제 무료인솔</label><input type="number" min="0" data-zr-settle-free value="${Number(actualFree||0)}"></div><div><label>실제 유료인솔</label><input type="number" min="0" data-zr-settle-paidchap value="${Number(actualPaidChap||0)}"></div><div><label>카페 실제 결제금액</label><input type="number" min="0" step="100" data-zr-settle-cafe value="${Number(actualCafe||0)}"></div></div>
    <div class="zr-settle-summary" data-zr-settle-preview></div><div class="zr-settle-actions"><button type="button" class="btn-primary" data-zr-settle-save>실제 결제 저장</button></div>`;
  root.querySelectorAll('input').forEach(el=>el.addEventListener('input',()=>preview()));
  root.querySelectorAll('[data-zr-settle-vendor]').forEach(el=>el.addEventListener('change',()=>preview()));
  root.querySelector('[data-zr-settle-save]').onclick=saveSettlement;preview();
}
function preview(){
  const root=$('zrSettlementWorkspaceBody'),b=byId(currentId);if(!root||!b)return;
  const c=calc(root,b),box=root.querySelector('[data-zr-settle-preview]');if(!box)return;
  if(!c.vendor){box.innerHTML='<span class="danger">결제 구분을 선택해주세요.</span>';return}
  box.innerHTML=`<b>실제 매출 계산</b><br>결제 구분 <b>${esc(c.vendor.name)}</b> · 적용 단체가 <b>${money(c.unit)}</b><br>매표 매출 <b>${money(c.ticket)}</b> · 카페 실제 결제 <b>${money(c.cafe)}</b><br>${c.vendor.id==='self'?'':`아웃소싱 수수료 <b>${money(c.totalFee)}</b><br>`}<span class="money">실제 총매출 ${money(c.total)}</span>`;
}
function saveSettlement(){
  if(!adminOk())return;const root=$('zrSettlementWorkspaceBody'),list=all(),b=list.find(x=>String(x.id)===String(currentId));if(!root||!b)return msg('예약 정보를 찾지 못했습니다.');
  const c=calc(root,b);if(!c.vendor)return msg('자체 또는 아웃소싱 업체를 선택해주세요.');if(c.unit<=0)return msg('선택한 업체의 단체가를 설정해주세요.');
  const now=new Date().toISOString(),vendorSnap=snap(c.vendor);
  b.outsourcingVendorId=vendorSnap.id;b.outsourcingVendorSnapshot=vendorSnap;
  b.settlement={vendorId:vendorSnap.id,vendorSnapshot:vendorSnap,actualPaidCount:c.paid,actualFreeChaperone:c.free,actualPaidChaperone:c.paidChap,actualCafeAmount:c.cafe,ticketUnitPrice:c.unit,ticketAmount:c.ticket,totalActualSales:c.total,ticketFee:c.ticketFee,cafeFee:c.cafeFee,totalFee:c.totalFee,savedAt:now};
  b.settlementStatus='completed';b.settlementCompletedAt=now;save(list);
  try{window.addActivity?.('settlement',b,`실제 결제 저장 · ${vendorSnap.name}`)}catch{}
  try{window.renderActivity?.()}catch{}try{window.renderOutsourcingPayments?.()}catch{}
  msg('실제 결제 내역을 저장했습니다.');renderModal(b.id);
}
function openSettlement(id){if(!adminOk())return;currentId=String(id||'');if(!byId(currentId))return msg('예약 정보를 찾지 못했습니다.');renderModal(currentId);if(typeof window.openModal==='function')window.openModal('zrSettlementWorkspaceModal');else $('zrSettlementWorkspaceModal')?.classList.remove('hidden')}
window.zrOpenSettlementWorkspace=openSettlement;

function bookingIdFromDetailButton(btn){const raw=String(btn?.getAttribute?.('onclick')||'');const m=raw.match(/openAdminBookingDetail\(['"]([^'"]+)['"]\)/);return m?.[1]||''}
function setCardStatus(card,b){
  const badge=card.querySelector('.zr4-badges .status:not(.zr4-vendor):not(.zr-settlement-done),.row .status');
  if(badge){badge.textContent=statusText(b);badge.className=statusClass(b)}
  const badges=card.querySelector('.zr4-badges');if(!badges)return;
  let done=badges.querySelector('.zr-settlement-done');
  if(b?.settlement?.savedAt){if(!done){done=document.createElement('span');done.className='status zr-settlement-done';badges.appendChild(done)}done.textContent='실제결제 완료'}else done?.remove();
}
function decorateActivityCards(){
  const root=$('activityList');if(!root)return;
  root.querySelectorAll(':scope > .booking-item').forEach(card=>{
    const detail=[...card.querySelectorAll('button')].find(b=>String(b.getAttribute('onclick')||'').includes('openAdminBookingDetail('));if(!detail)return;
    const id=bookingIdFromDetailButton(detail),b=byId(id);if(!id||!b)return;setCardStatus(card,b);
    let actions=detail.closest('.zr-settle-card-actions');
    if(!actions){actions=detail.parentElement;if(actions)actions.classList.add('zr-settle-card-actions')}
    if(!actions)return;
    if(!actions.querySelector('.zr-settle-open')){const pay=document.createElement('button');pay.type='button';pay.className='btn-soft zr-settle-open';pay.textContent='실제결제';pay.onclick=()=>openSettlement(id);actions.appendChild(pay)}
  });
}
function stripLegacyPayment(root){if(!root)return;root.querySelectorAll(':scope > .zr2-vendor,:scope > .zr2-settle,:scope > .zr-settlement-editor').forEach(x=>x.remove())}
function ensureRowPaymentButtons(root){
  if(!root)return;root.querySelectorAll('.zr-cal-state-row[data-booking-id]').forEach(row=>{
    const id=row.dataset.bookingId;if(!id||row.querySelector('.zr-settle-open'))return;const b=document.createElement('button');b.type='button';b.className='btn-soft zr-settle-open';b.textContent='실제결제';b.onclick=()=>openSettlement(id);row.appendChild(b);
  });
}
function cleanupDetail(id=''){const root=$('adminBookingDetailContent');stripLegacyPayment(root);const b=byId(id);if(root&&b){const badge=root.querySelector(':scope > .row .status');if(badge){badge.textContent=statusText(b);badge.className=statusClass(b)}}ensureRowPaymentButtons(root)}
function cleanupDay(date=''){const root=$('dayDetailContent');if(!root)return;const list=all().filter(b=>String(b.date||'')===String(date||'')),items=[...root.querySelectorAll(':scope > .booking-item')];items.forEach((item,i)=>{stripLegacyPayment(item);const b=list[i],badge=item.querySelector(':scope > .row .status');if(b&&badge){badge.textContent=statusText(b);badge.className=statusClass(b)}});ensureRowPaymentButtons(root)}
function wrap(){
  const render=window.renderActivity;if(typeof render==='function'&&render.__zrHold&&render!==renderWrap&&!render.__zrSettlementWorkspaceV1){const base=render,w=function(){const out=base.apply(this,arguments);decorateActivityCards();return out};w.__zrSettlementWorkspaceV1=true;w.__zrHold=true;w.__zrBase=base;window.renderActivity=w;try{renderActivity=w}catch{}renderWrap=w}
  const detail=window.openAdminBookingDetail;if(typeof detail==='function'&&detail.__zrReservationDetailStatusSelect&&detail!==detailWrap&&!detail.__zrSettlementWorkspaceV1){const base=detail,w=function(id){const out=base.apply(this,arguments);cleanupDetail(id);return out};w.__zrSettlementWorkspaceV1=true;w.__zrReservationDetailStatusSelect=true;w.__zrHold=true;w.__zrBase=base;window.openAdminBookingDetail=w;try{openAdminBookingDetail=w}catch{}detailWrap=w}
  const day=window.openDay;if(typeof day==='function'&&day.__zrCalendarStatusSelect&&day!==dayWrap&&!day.__zrSettlementWorkspaceV1){const base=day,w=function(date){const out=base.apply(this,arguments);cleanupDay(date);return out};w.__zrSettlementWorkspaceV1=true;w.__zrCalendarStatusSelect=true;w.__zrHold=true;w.__zrBase=base;window.openDay=w;try{openDay=w}catch{}dayWrap=w}
}
function boot(){ensureModal();wrap();decorateActivityCards();cleanupDetail();cleanupDay();const timer=setInterval(()=>{wrap();decorateActivityCards()},250);setTimeout(()=>clearInterval(timer),20000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
