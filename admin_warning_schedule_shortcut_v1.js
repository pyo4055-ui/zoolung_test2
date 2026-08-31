(()=>{
'use strict';
if(window.__ZR_ADMIN_WARNING_SCHEDULE_SHORTCUT_V1)return;
window.__ZR_ADMIN_WARNING_SCHEDULE_SHORTCUT_V1=true;

const KEY='zr_bookings';
const SCHEDULE_LABELS=new Set(['스케줄 미확정','고객 알림 미완료','스케줄 시간 겹침']);
let installed=false,observer=null;

function allBookings(){
  try{
    const list=typeof window.bookings==='function'?window.bookings():JSON.parse(localStorage.getItem(KEY)||'[]');
    return Array.isArray(list)?list.filter(b=>b&&!b.__availabilityOnly):[];
  }catch{return []}
}
function bookingById(id){return allBookings().find(b=>String(b?.id)===String(id))||null}
function toast(text){try{window.toast?.(text)}catch{}}
function removeRefresh(){document.getElementById('zrWarningRefresh')?.remove()}
function ensurePagination(){
  const pager=document.getElementById('zrWarningPagination');if(!pager)return;
  if(String(pager.innerHTML||'').trim())return;
  pager.innerHTML='<div class="zr-warning-page-info">1 / 1 페이지</div><div class="zr-warning-page-buttons"><button type="button" class="btn-gray" disabled>‹ 이전</button><button type="button" class="btn-primary" disabled>1</button><button type="button" class="btn-gray" disabled>다음 ›</button></div>';
}
function hasScheduleIssue(card){
  return [...card.querySelectorAll('.zr-warning-issue b')].some(el=>SCHEDULE_LABELS.has(String(el.textContent||'').trim()));
}
function decorate(){
  removeRefresh();ensurePagination();
  document.querySelectorAll('#zrWarningList .zr-warning-card').forEach(card=>{
    const actions=card.querySelector('.zr-warning-actions');if(!actions)return;
    const id=String(card.dataset.booking||'');
    let btn=actions.querySelector('[data-zr-warning-schedule]');
    if(!hasScheduleIssue(card)){btn?.remove();return}
    if(!btn){
      btn=document.createElement('button');btn.type='button';btn.className='btn-soft';btn.textContent='스케줄 관리';
      const detail=actions.querySelector('[data-zr-warning-detail]');actions.insertBefore(btn,detail||actions.firstChild);
    }
    btn.dataset.zrWarningSchedule=id;
  });
}
function applyScheduleDate(date){
  const input=document.getElementById('zrscDate');
  if(!input||!date)return false;
  if(String(input.value)!==String(date)){
    input.value=String(date);
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }
  return true;
}
function openSchedule(id){
  const booking=bookingById(id);if(!booking?.date)return toast('예약 방문일을 찾지 못했습니다.');
  const tab=document.getElementById('zrScheduleTabBtn');if(!tab)return toast('스케줄 관리 탭을 불러오는 중입니다. 잠시 후 다시 눌러주세요.');
  tab.click();
  if(!applyScheduleDate(booking.date))setTimeout(()=>applyScheduleDate(booking.date),80);
  setTimeout(()=>applyScheduleDate(booking.date),250);
}
function install(){
  if(installed)return true;
  const list=document.getElementById('zrWarningList');if(!list)return false;
  removeRefresh();decorate();
  list.addEventListener('click',e=>{
    const btn=e.target?.closest?.('[data-zr-warning-schedule]');if(!btn)return;
    openSchedule(btn.dataset.zrWarningSchedule||'');
  });
  observer=new MutationObserver(()=>decorate());observer.observe(list,{childList:true,subtree:true});
  installed=true;return true;
}
function boot(){
  if(install())return;
  let tries=0;const timer=setInterval(()=>{if(install()||++tries>80)clearInterval(timer)},250);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();