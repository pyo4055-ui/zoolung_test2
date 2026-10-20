(()=>{
'use strict';
if(window.__ZR_ADMIN_SETTLEMENT_WORKSPACE_V1)return;
window.__ZR_ADMIN_SETTLEMENT_WORKSPACE_V1=true;

const KEY='zr_bookings',BASE_PRICE=15000,HOLD='hold';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let currentId='';

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
const snap=window.ZRSettlementRules.vendorSnapshot;
function currentSnapshot(b){return b?.settlement?.vendorSnapshot||b?.outsourcingVendorSnapshot||null}
function vendorsFor(b){
  const base=[{id:'self',name:'자체',groupPrice:BASE_PRICE,ticketFeeType:'flat',ticketFeeValue:0,cafeFeeType:'flat',cafeFeeValue:0}];
  try{(settings().outsourcingVendors||[]).filter(v=>String(v?.name||'').trim()).slice(0,10).forEach(v=>base.push(snap(v)))}catch{}
  const selected=b?.settlement?.vendorId||b?.outsourcingVendorId||currentSnapshot(b)?.id||'self';
  const old=currentSnapshot(b);
  if(old?.id&&old?.name&&!base.some(v=>v.id===old.id))base.push(snap(old));
  return {list:base,selected};
}
const feeAmount=window.ZRSettlementRules.feeAmount;
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
  const additionalSales=readExtraRows(root);
  const extra=window.ZRSettlementRules.extraTotal(additionalSales);
  const unit=Math.max(0,Number(vendor?.groupPrice||0));
  const admissions=paid+paidChap,ticket=admissions*unit,total=ticket+cafe+extra,isSelf=vendor?.id==='self';
  const ticketFee=!vendor||isSelf?0:feeAmount(ticket,vendor.ticketFeeType,vendor.ticketFeeValue,admissions);
  const cafeFee=!vendor||isSelf||cafe<=0?0:feeAmount(cafe,vendor.cafeFeeType,vendor.cafeFeeValue,1);
  return {additionalSales,extra,vendor,paid,free,paidChap,cafe,unit,admissions,ticket,total,ticketFee,cafeFee,totalFee:ticketFee+cafeFee};
}
function readExtraRows(root){return window.ZRSettlementRules.normalizeExtras([...root.querySelectorAll('[data-zr-extra-row]')].map(row=>({category:row.querySelector('select').value,amount:row.querySelector('input').value,quantity:row.querySelector('[data-zr-extra-quantity]')?.value})))}
function extraRow(item={category:'shop',amount:0}){
  return `<div data-zr-extra-row class="grid2" style="margin-top:8px"><div><label>부가매출 항목</label><select aria-label="부가매출 항목">${Object.entries(window.ZRSettlementRules.extraCategories).map(([value,label])=>`<option value="${value}" ${item.category===value?'selected':''}>${label}</option>`).join('')}</select></div><div><label>부가매출 금액</label><div style="display:flex;gap:6px"><input type="number" aria-label="부가매출 금액" min="0" step="1" value="${Number(item.amount)||0}" style="min-width:0"><button type="button" class="btn-gray" data-zr-extra-remove aria-label="부가매출 항목 제거">제거</button></div></div><div data-zr-extra-quantity-wrap ${['passport','feed'].includes(item.category)?'':'hidden'}><label>구매 수량</label><input data-zr-extra-quantity type="number" min="0" step="1" aria-label="부가매출 수량" placeholder="개수" value="${item.quantity==null?'':Number(item.quantity)||0}"></div></div>`;
}
const savedExtras=window.ZRSettlementRules.savedExtras;
function syncExtraCategory(e){const row=e.target.closest?.('[data-zr-extra-row]');if(!row||e.target.tagName!=='SELECT')return;const wrap=row.querySelector('[data-zr-extra-quantity-wrap]');const hidden=!['passport','feed'].includes(e.target.value);if(wrap.hidden!==hidden)wrap.hidden=hidden}
document.addEventListener('input',syncExtraCategory,true);
document.addEventListener('change',syncExtraCategory,true);
document.addEventListener('input',e=>{if(!e.target.matches?.('[data-zr-extra-quantity]'))return;const row=e.target.closest('[data-zr-extra-row]');if(['feed','passport'].includes(row.querySelector('select').value)){const quantity=Number(e.target.value);if(Number.isSafeInteger(quantity)&&quantity>=0){const amount=row.querySelector('input');amount.value=quantity*10000;amount.dispatchEvent(new Event('input',{bubbles:true}))}}});
window.ZRAdditionalSalesEditor={
 mount(root,b){injectStyle();const rows=savedExtras(b.settlement||{},b);root.insertAdjacentHTML('beforeend',`<div class="calc" data-zr-booking-extras style="margin-top:14px"><b>부가매출</b><div data-zr-extra-list>${(rows.length?rows:[{}]).map(extraRow).join('')}</div><button type="button" class="btn-soft" data-zr-extra-add style="margin-top:8px">항목 추가</button></div>`);const box=root.querySelector('[data-zr-booking-extras]');box.querySelector('[data-zr-extra-add]').onclick=()=>{box.querySelector('[data-zr-extra-list]').insertAdjacentHTML('beforeend',extraRow());box.dispatchEvent(new Event('input',{bubbles:true}))};box.addEventListener('click',e=>{const button=e.target.closest('[data-zr-extra-remove]');if(button){button.closest('[data-zr-extra-row]').remove();box.dispatchEvent(new Event('input',{bubbles:true}))}})},
 read(root){const box=root.querySelector('[data-zr-booking-extras]');if(!box)return null;return readExtraRows(box) }
};
function injectStyle(){
  if($('zrSettlementWorkspaceV1Style'))return;
  const s=document.createElement('style');s.id='zrSettlementWorkspaceV1Style';s.textContent=`
  [data-zr-extra-row]{align-items:start!important;gap:12px!important}
  [data-zr-extra-row] label{display:block;margin:0 0 6px!important;line-height:1.4!important}
  [data-zr-extra-row] select,[data-zr-extra-row] input,[data-zr-extra-row] button{box-sizing:border-box!important;height:42px!important;min-height:42px!important;margin:0!important}
  [data-zr-extra-row] input{flex:1 1 0;width:0!important;min-width:0!important}
  [data-zr-extra-quantity-wrap][hidden]{display:none!important}
  [data-zr-extra-quantity-wrap] input{width:100%!important}
  [data-zr-extra-quantity-wrap],[data-zr-extra-quantity-wrap] *{animation:none!important;transition:none!important}
  [data-zr-extra-remove]{flex:0 0 54px!important;white-space:nowrap!important;padding:0 10px!important}

  #zrSettlementWorkspaceModal .modal-card{position:relative;width:min(760px,calc(100vw - 28px));max-height:86vh;overflow:auto;padding-top:24px}
  #zrSettlementWorkspaceModal .zr-settle-close{position:absolute;top:14px;right:14px;z-index:2;min-width:68px}
  #zrSettlementWorkspaceModal .zr-settle-head{padding-right:88px}
  #zrSettlementWorkspaceModal .zr-settle-vendors{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
  #zrSettlementWorkspaceModal .zr-settle-vendor{display:flex;align-items:center;gap:6px;padding:9px 10px;border:1px solid var(--line);border-radius:10px;background:#fff;cursor:pointer}
  #zrSettlementWorkspaceModal .zr-settle-vendor:has(input:checked){background:#fff3e8;border-color:#fc5404}
  #zrSettlementWorkspaceModal .zr-settle-vendor input{width:auto;margin:0}
  #zrSettlementWorkspaceModal .zr-settle-summary{margin-top:14px;padding:12px;border:1px solid var(--line);border-radius:12px;background:#faf7f3;line-height:1.65}
  #zrSettlementWorkspaceModal .zr-settle-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}
  :is(#zrSettlementWorkspaceModal,#zr2EditModal,#zr2QuickModal) .calc{background:#faf7f3;border-color:#e5d8cd;color:#493d33}
  :is(#zrSettlementWorkspaceModal,#zr2EditModal,#zr2QuickModal) .btn-soft{background:#f3ece3;color:#685b50}
  :is(#zrSettlementWorkspaceModal,#zr2EditModal,#zr2QuickModal) .btn-primary{background:#fc5404;color:#fff;border-color:#fc5404}
  :is(#zrSettlementWorkspaceModal,#zr2EditModal,#zr2QuickModal) .money{color:#493d33}
  :is(#zrSettlementWorkspaceModal,#zr2EditModal,#zr2QuickModal){--line:#e5d8cd;color:#493d33}
  :is(#zrSettlementWorkspaceModal,#zr2EditModal,#zr2QuickModal) :is(input,select,textarea){border-color:#ddcec2;background:#fff;color:#302a26;accent-color:#fc5404}
  :is(#zrSettlementWorkspaceModal,#zr2EditModal,#zr2QuickModal) :is(input,select,textarea):focus{border-color:#fc5404;outline-color:#fc5404;box-shadow:0 0 0 2px #fc54041a}
  :is(#zrSettlementWorkspaceModal,#zr2EditModal,#zr2QuickModal) label{color:#493d33}
  :is(#zrSettlementWorkspaceModal,#zr2EditModal,#zr2QuickModal) .btn-gray{background:#f3ece3;color:#685b50;border-color:#e5d8cd}
  #activityList .zr-settle-card-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:10px;flex-wrap:wrap}
  .status.zr-settlement-done{background:#eef6ff!important;border-color:#cddff1!important;color:#315e88!important;font-weight:900!important}
  @media(max-width:560px){#zrSettlementWorkspaceModal .grid2{grid-template-columns:1fr!important}.zr-cal-state-row .zr-settle-open{flex-basis:100%;width:100%}}
  `;document.head.appendChild(s);
}
function ensureModal(){
  injectStyle();if($('zrSettlementWorkspaceModal'))return;
  const m=document.createElement('div');m.id='zrSettlementWorkspaceModal';m.className='modal hidden';m.innerHTML='<div class="modal-card"><button type="button" class="btn-gray zr-settle-close" id="zrSettlementWorkspaceClose">닫기</button><div id="zrSettlementWorkspaceBody"></div></div>';document.body.appendChild(m);
  $('zrSettlementWorkspaceClose').onclick=()=>{if(typeof window.closeModal==='function')window.closeModal('zrSettlementWorkspaceModal');else m.classList.add('hidden')};
  document.dispatchEvent(new CustomEvent('zr:settlement-workspace-ready'));
}
function renderModal(id=currentId){
  ensureModal();currentId=String(id||currentId||'');const b=byId(currentId),root=$('zrSettlementWorkspaceBody');
  if(!root||!b)return msg('예약 정보를 찾지 못했습니다.');
  const st=b.settlement||{},vInfo=vendorsFor(b),actualPaid=st.actualPaidCount??b.paidCount??0,actualFree=st.actualFreeChaperone??b.freeChaperone??0,actualPaidChap=st.actualPaidChaperone??b.paidChaperone??0,actualCafe=st.actualCafeAmount??0;
  root.innerHTML=`<div class="zr-settle-head"><h2 style="margin-bottom:5px">${esc(b.orgName||'예약')} · 실제결제</h2><div class="help">예약일 ${esc(b.date||'-')} · <span class="${statusClass(b)}">${esc(statusText(b))}</span>${st.savedAt?' · 정산완료':''}</div></div>
    <div class="calc" style="margin-top:16px"><b>결제 구분 / 아웃소싱 업체</b><div class="zr-settle-vendors">${vInfo.list.map(v=>`<label class="zr-settle-vendor"><input type="radio" name="zrSettlementVendor" data-zr-settle-vendor value="${esc(v.id)}" ${String(v.id)===String(vInfo.selected)?'checked':''}><span>${esc(v.name)}${v.id!=='self'?` <small>${money(v.groupPrice)}</small>`:''}</span></label>`).join('')}</div></div>
    <div class="grid2" style="margin-top:14px"><div><label>실제 유료인원</label><input type="number" min="0" data-zr-settle-paid value="${Number(actualPaid||0)}"></div><div><label>실제 무료인솔</label><input type="number" min="0" data-zr-settle-free value="${Number(actualFree||0)}"></div><div><label>실제 유료인솔</label><input type="number" min="0" data-zr-settle-paidchap value="${Number(actualPaidChap||0)}"></div><div><label>카페 실제 결제금액</label><input type="number" min="0" step="100" data-zr-settle-cafe value="${Number(actualCafe||0)}"></div></div>
    <div class="calc" style="margin-top:14px"><b>부가매출</b><div data-zr-extra-list>${(savedExtras(st,b).length?savedExtras(st,b):[{}]).map(extraRow).join('')}</div><button type="button" class="btn-soft" data-zr-extra-add style="margin-top:8px">항목 추가</button></div>
    <div class="zr-settle-summary" data-zr-settle-preview></div><div class="zr-settle-actions"><button type="button" class="btn-primary" data-zr-settle-save>저장</button></div>`;
  root.oninput=()=>preview();root.onchange=()=>preview();
  root.querySelector('[data-zr-extra-add]').onclick=()=>{root.querySelector('[data-zr-extra-list]').insertAdjacentHTML('beforeend',extraRow());preview()};
  root.onclick=e=>{const button=e.target.closest('[data-zr-extra-remove]');if(!button)return;button.closest('[data-zr-extra-row]').remove();preview()};
  root.querySelectorAll('[data-zr-settle-vendor]').forEach(el=>el.addEventListener('change',()=>preview()));
  root.querySelector('[data-zr-settle-save]').onclick=async()=>{const button=root.querySelector('[data-zr-settle-save]');if(button.disabled)return false;button.disabled=true;try{return await saveSettlement()}finally{if(button.isConnected)button.disabled=false}};preview();window.ZRAdminEditMeta?.show(root,st.adminEditMeta,'settlement');window.ZRAdminFormDrafts?.capture('settlement');
}
function preview(){
  const root=$('zrSettlementWorkspaceBody'),b=byId(currentId);if(!root||!b)return;
  const box=root.querySelector('[data-zr-settle-preview]');if(!box)return;let c;try{c=calc(root,b)}catch(e){box.textContent=e.message;return}
  if(!c.vendor){box.innerHTML='<span class="danger">결제 구분을 선택해주세요.</span>';return}
  box.innerHTML=`<b>실제 매출 계산</b><br>결제 구분 <b>${esc(c.vendor.name)}</b> · 적용 단체가 <b>${money(c.unit)}</b><br>매표 매출 <b>${money(c.ticket)}</b> · 카페 실제 결제 <b>${money(c.cafe)}</b><br>부가매출 <b>${money(c.extra)}</b><br>${c.vendor.id==='self'?'':`아웃소싱 수수료 <b>${money(c.totalFee)}</b><br>`}<span class="money">실제 총매출 ${money(c.total)}</span>`;
}
async function saveSettlement(){
  if(!adminOk())return;const root=$('zrSettlementWorkspaceBody'),list=all(),b=list.find(x=>String(x.id)===String(currentId));if(!root||!b)return msg('예약 정보를 찾지 못했습니다.');
  let c;try{c=calc(root,b)}catch(e){return msg(e.message)}const error=window.ZRSettlementRules.paymentError(c);if(error==='vendor')return msg('자체 또는 아웃소싱 업체를 선택해주세요.');if(error==='unit')return msg('선택한 업체의 단체가를 설정해주세요.');
  const draft=structuredClone(b);
  const vendorSnap=window.ZRSettlementRules.applyPayment(draft,c,new Date().toISOString());
  if(!await window.zrReservationFirebase?.saveBooking?.(draft))return false;
  try{window.addActivity?.('settlement',b,`실제 결제 저장 · ${vendorSnap.name}`)}catch{}
  try{window.renderActivity?.()}catch{}try{window.renderOutsourcingPayments?.()}catch{}
  msg('실제 결제 내역을 저장했습니다.');renderModal(b.id);window.ZRDialogs?.saved(document.querySelector('[data-zr-settle-save]'));window.ZRAdminFormDrafts?.saved('settlement');return true;
}
function openSettlement(id){if(!adminOk())return;currentId=String(id||'');if(!byId(currentId))return msg('예약 정보를 찾지 못했습니다.');renderModal(currentId);if(typeof window.openModal==='function')window.openModal('zrSettlementWorkspaceModal');else $('zrSettlementWorkspaceModal')?.classList.remove('hidden')}
window.zrOpenSettlementWorkspace=openSettlement;
(window.ZRAdminFormActions||(window.ZRAdminFormActions={})).settlement={save:()=>document.querySelector('[data-zr-settle-save]')?.onclick(),discard:()=>renderModal(currentId)};

function bookingIdFromDetailButton(btn){const raw=String(btn?.getAttribute?.('onclick')||'');const m=raw.match(/openAdminBookingDetail\(['"]([^'"]+)['"]\)/);return m?.[1]||''}
function setCardStatus(card,b){
  const badge=card.querySelector('.zr4-badges .status:not(.zr4-vendor):not(.zr-settlement-done),.row .status');
  if(badge){if(badge.textContent!==statusText(b))badge.textContent=statusText(b);if(badge.className!==statusClass(b))badge.className=statusClass(b)}
  const badges=card.querySelector('.zr4-badges');if(!badges)return;
  let done=badges.querySelector('.zr-settlement-done');
  if(b?.settlement?.savedAt){if(!done){done=document.createElement('span');done.className='status zr-settlement-done';badges.appendChild(done)}if(done.textContent!=='정산완료')done.textContent='정산완료'}else done?.remove();
}
function decorateActivityCards(){
  const root=$('activityList');if(!root)return;
  root.querySelectorAll(':scope > .booking-item').forEach(card=>{
    const detail=[...card.querySelectorAll('button')].find(b=>String(b.getAttribute('onclick')||'').includes('openAdminBookingDetail('));if(!detail)return;
    const id=bookingIdFromDetailButton(detail),b=byId(id);if(!id||!b)return;setCardStatus(card,b);
    let actions=detail.closest('.zr-settle-card-actions');
    if(!actions){actions=detail.parentElement;if(actions)actions.classList.add('zr-settle-card-actions')}
    if(!actions)return;
    let pay=actions.querySelector('.zr-settle-open');
    if(!pay){pay=document.createElement('button');pay.type='button';pay.className='btn-soft zr-settle-open';pay.textContent='실제결제';actions.appendChild(pay)}
    pay.onclick=()=>window.zrOpenSettlementWorkspace?.(id);
  });
}
window.ZRSettlementCards=Object.freeze({refresh:decorateActivityCards});
function stripLegacyPayment(root){if(!root)return;root.querySelectorAll(':scope > .zr2-vendor,:scope > .zr2-settle,:scope > .zr-settlement-editor').forEach(x=>x.remove())}
function ensureRowPaymentButtons(root){
  if(!root)return;root.querySelectorAll('.zr-cal-state-row[data-booking-id]').forEach(row=>{
    const id=row.dataset.bookingId;if(!id||row.querySelector('.zr-settle-open'))return;const b=document.createElement('button');b.type='button';b.className='btn-soft zr-settle-open';b.textContent='실제결제';b.onclick=()=>openSettlement(id);row.appendChild(b);
  });
}
function cleanupDetail(id=''){const root=$('adminBookingDetailContent');stripLegacyPayment(root);const b=byId(id);if(root&&b){const badge=root.querySelector(':scope > .row .status');if(badge){badge.textContent=statusText(b);badge.className=statusClass(b)}}ensureRowPaymentButtons(root)}
function cleanupDay(date=''){const root=$('dayDetailContent');if(!root)return;const list=all().filter(b=>String(b.date||'')===String(date||'')),items=[...root.querySelectorAll(':scope > .booking-item')];items.forEach((item,i)=>{stripLegacyPayment(item);const b=list[i],badge=item.querySelector(':scope > .row .status');if(b&&badge){badge.textContent=statusText(b);badge.className=statusClass(b)}});ensureRowPaymentButtons(root)}
function boot(){
  document.addEventListener('zr:booking-activity-rendered',decorateActivityCards);
  document.addEventListener('zr:booking-detail-rendered',e=>cleanupDetail(e.detail?.id||''));
  document.addEventListener('zr:booking-day-rendered',e=>cleanupDay(e.detail?.date||''));
  ensureModal();decorateActivityCards();cleanupDetail();cleanupDay();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
