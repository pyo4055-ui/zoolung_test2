(()=>{
'use strict';
if(window.__ZR_SCHEDULE_PUBLISH_TOGGLE_V5)return;
window.__ZR_SCHEDULE_PUBLISH_TOGGLE_V5=true;

const BOOKING_KEY='zr_bookings';
const toast=msg=>{try{if(typeof window.toast==='function')window.toast(msg)}catch{}};

function allBookings(){
  try{return typeof window.bookings==='function'?window.bookings():[]}catch{return[]}
}
function unpublish(id,btn){
  const bs=allBookings(),b=bs.find(x=>String(x.id)===String(id));
  if(!b)return toast('예약 정보를 찾지 못했습니다.');
  b.schedulePublished=false;
  try{
    if(typeof window.setStore==='function')window.setStore(BOOKING_KEY,bs);
    else localStorage.setItem(BOOKING_KEY,JSON.stringify(bs));
  }catch(e){console.error('schedule unpublish',e);return toast('스케줄 확정 취소 저장에 실패했습니다.');}
  const card=btn.closest('.zrsc-card');
  card?.querySelector('.zrsc-published')?.remove();
  btn.textContent='스케줄 확정';
  btn.disabled=false;
  toast('스케줄 확정을 취소했습니다. 고객에게는 더 이상 노출되지 않습니다.');
}
function bind(){
  document.querySelectorAll('#tab-schedule [data-publish]').forEach(btn=>{
    if(btn.dataset.zrPublishToggleV5==='1')return;
    btn.dataset.zrPublishToggleV5='1';
    const original=btn.onclick;
    btn.onclick=function(ev){
      const id=btn.dataset.publish;
      const b=allBookings().find(x=>String(x.id)===String(id));
      if(b?.schedulePublished){
        ev?.preventDefault?.();
        btn.disabled=true;btn.textContent='확정 취소 중...';
        unpublish(id,btn);
        return;
      }
      if(typeof original==='function')return original.call(this,ev);
    };
  });
}
function boot(){
  bind();
  const root=document.getElementById('adminView')||document.body;
  new MutationObserver(()=>bind()).observe(root,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
