(()=>{
'use strict';
if(window.__ZR_ADMIN_SETTLEMENT_UI_STABILITY_V1)return;
window.__ZR_ADMIN_SETTLEMENT_UI_STABILITY_V1=true;

const KEY='zr_bookings',HOLD='hold';
const $=id=>document.getElementById(id);
let queued=false;

function all(){
  try{
    const list=typeof window.bookings==='function'?window.bookings():JSON.parse(localStorage.getItem(KEY)||'[]');
    return Array.isArray(list)?list.filter(b=>b&&!b.__availabilityOnly):[];
  }catch{return []}
}
function byId(id){return all().find(b=>String(b.id)===String(id))||null}
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
function bookingIdFromDetail(btn){
  const raw=String(btn?.getAttribute?.('onclick')||'');
  return raw.match(/openAdminBookingDetail\(['"]([^'"]+)['"]\)/)?.[1]||'';
}
function setTextClass(el,text,className){
  if(!el)return;
  if(el.textContent!==text)el.textContent=text;
  if(el.className!==className)el.className=className;
}
function injectStyle(){
  if($('zrSettlementUiStabilityV1Style'))return;
  const s=document.createElement('style');s.id='zrSettlementUiStabilityV1Style';s.textContent=`
    #activityList .zr-settle-card-actions{display:flex!important;justify-content:flex-end!important;gap:8px!important;margin-top:10px!important;flex-wrap:wrap!important}
    #activityList .zr-settlement-done{background:#eee8fb!important;border-color:#d7c9ef!important;color:#5d4388!important;font-weight:900!important}
    #adminBookingDetailContent .zr-settle-open{display:none!important}
  `;document.head.appendChild(s);
}
function syncCard(card){
  const detail=[...card.querySelectorAll('button')].find(btn=>String(btn.getAttribute('onclick')||'').includes('openAdminBookingDetail('));
  if(!detail)return;
  const id=bookingIdFromDetail(detail),b=byId(id);if(!id||!b)return;
  const badges=card.querySelector('.zr4-badges');
  if(badges){
    const primary=badges.querySelector('.status:not(.zr4-vendor):not(.zr-settlement-done)');
    setTextClass(primary,statusText(b),statusClass(b));
    let done=badges.querySelector('.zr-settlement-done');
    if(b?.settlement?.savedAt){
      if(!done){done=document.createElement('span');done.className='status zr-settlement-done';badges.appendChild(done)}
      if(done.textContent!=='정산완료')done.textContent='정산완료';
    }else done?.remove();
  }
  let actions=detail.closest('.zr-settle-card-actions')||detail.parentElement;
  if(!actions)return;
  actions.classList.add('zr-settle-card-actions');
  let pay=actions.querySelector('.zr-settle-open');
  if(!pay){
    pay=document.createElement('button');pay.type='button';pay.className='btn-soft zr-settle-open';pay.textContent='실제결제';actions.appendChild(pay);
  }
  pay.onclick=()=>window.zrOpenSettlementWorkspace?.(id);
}
function syncActivity(){
  const root=$('activityList');if(!root)return;
  root.querySelectorAll(':scope > .booking-item').forEach(syncCard);
}
function syncDetail(){
  const root=$('adminBookingDetailContent');if(!root)return;
  root.querySelectorAll('.zr-settle-open').forEach(btn=>btn.remove());
}
function syncWorkspace(){
  const head=$('zrSettlementWorkspaceBody')?.querySelector('.zr-settle-head .help');
  if(head&&head.innerHTML.includes('실제결제 입력완료'))head.innerHTML=head.innerHTML.replace(/실제결제 입력완료/g,'정산완료');
}
function syncAll(){injectStyle();syncActivity();syncDetail();syncWorkspace()}
function schedule(){
  if(queued)return;queued=true;
  queueMicrotask(()=>{queued=false;syncAll()});
}
function observe(id){
  const root=$(id);if(!root||root.dataset.zrSettlementStableObserved==='1')return false;
  root.dataset.zrSettlementStableObserved='1';
  new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  return true;
}
function bind(){
  observe('activityList');observe('adminBookingDetailContent');observe('zrSettlementWorkspaceBody');syncAll();
}
function boot(){
  bind();
  const t=setInterval(bind,250);setTimeout(()=>clearInterval(t),20000);
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#adminView .admin-tabs button,[data-tab],#activityList button'))setTimeout(schedule,0);
  },true);
  document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(bind,0));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
