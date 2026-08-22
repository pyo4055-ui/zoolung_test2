(()=>{
'use strict';
if(window.__ZR_ADMIN_CANCEL_VISIBILITY_V1)return;
window.__ZR_ADMIN_CANCEL_VISIBILITY_V1=true;

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function readBookings(){try{return JSON.parse(localStorage.getItem('zr_bookings')||'[]')}catch{return[]}}
function byId(id){return readBookings().find(b=>String(b?.id||'')===String(id))||null}
function cardBookingId(card){
  const btn=card?.querySelector?.('button[onclick*="openAdminBookingDetail"]');
  const m=String(btn?.getAttribute('onclick')||'').match(/openAdminBookingDetail\(['"]([^'"]+)['"]\)/);
  return m?.[1]||'';
}
function injectStyle(){
  if($('zrAdminCancelVisibilityV1Style'))return;
  const s=document.createElement('style');s.id='zrAdminCancelVisibilityV1Style';s.textContent=`
  #activityList .booking-item.zr-admin-cancelled{border-color:#e0caca;background:#fffafa}
  #activityList .zr-admin-cancel-reason{margin-top:10px;padding:9px 10px;border:1px solid #ead0d0;border-radius:9px;background:#fff0f0;color:#704242;font-size:12px;line-height:1.55;white-space:pre-wrap}
  #adminBookingDetailContent .zr-admin-cancel-detail{margin-top:12px;padding:10px 11px;border:1px solid #ead0d0;border-radius:10px;background:#fff0f0;color:#704242;font-size:13px;line-height:1.55;white-space:pre-wrap}
  `;document.head.appendChild(s);
}
function decorateActivity(){
  const root=$('activityList');if(!root)return;
  root.querySelectorAll('.booking-item').forEach(card=>{
    const id=cardBookingId(card),b=byId(id);
    let box=card.querySelector('.zr-admin-cancel-reason');
    if(!b||String(b.status||'')!=='cancelled'){
      card.classList.remove('zr-admin-cancelled');box?.remove();return;
    }
    card.classList.add('zr-admin-cancelled');
    const reason=String(b.cancelReason||'').trim()||'취소 사유 미기록';
    if(!box){box=document.createElement('div');box.className='zr-admin-cancel-reason';card.appendChild(box)}
    box.innerHTML=`<b>취소 사유</b><br>${esc(reason)}`;
  });
}
let detailId='';
function decorateDetail(){
  const body=$('adminBookingDetailContent');if(!body||!detailId)return;
  const b=byId(detailId);let box=body.querySelector('.zr-admin-cancel-detail');
  if(!b||String(b.status||'')!=='cancelled'){box?.remove();return}
  const reason=String(b.cancelReason||'').trim()||'취소 사유 미기록';
  if(!box){box=document.createElement('div');box.className='zr-admin-cancel-detail';body.appendChild(box)}
  box.innerHTML=`<b>취소 사유</b><br>${esc(reason)}`;
}
let pending=false;
function decorate(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;injectStyle();decorateActivity();decorateDetail()})}
function boot(){
  injectStyle();decorate();
  new MutationObserver(decorate).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('button[onclick*="openAdminBookingDetail"]');
    if(btn){const m=String(btn.getAttribute('onclick')||'').match(/openAdminBookingDetail\(['"]([^'"]+)['"]\)/);detailId=m?.[1]||'';setTimeout(decorateDetail,30);setTimeout(decorateDetail,120)}
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
