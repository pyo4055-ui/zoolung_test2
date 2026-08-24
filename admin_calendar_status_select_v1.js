(()=>{
'use strict';
if(window.__ZR_ADMIN_CALENDAR_STATUS_SELECT_V1)return;
window.__ZR_ADMIN_CALENDAR_STATUS_SELECT_V1=true;

const HOLD='hold',KEY='zr_bookings';
const $=id=>document.getElementById(id);
let lastDate='';

function all(){
  try{
    const list=typeof window.bookings==='function'?window.bookings():JSON.parse(localStorage.getItem(KEY)||'[]');
    return Array.isArray(list)?list.filter(b=>b&&!b.__availabilityOnly):[];
  }catch{return []}
}
function byId(id){return all().find(b=>String(b.id)===String(id))||null}
function msg(text){try{window.toast?.(text)}catch{}}
function save(list){
  if(typeof window.setStore==='function')window.setStore(KEY,list);
  else if(typeof setStore==='function')setStore(KEY,list);
  else localStorage.setItem(KEY,JSON.stringify(list));
}
function adminOk(){
  try{
    if(typeof window.adminGuard==='function')return !!window.adminGuard(false);
    if(typeof adminGuard==='function')return !!adminGuard(false);
  }catch{}
  return !!window.zrReservationFirebase?.isStaff?.();
}
function settled(b){return !!(b?.status==='confirmed'&&b?.settlement?.savedAt)}
function refreshDirect(b){
  try{window.renderAdmin?.()}catch{}
  try{window.renderActivity?.()}catch{}
  const date=String(b?.date||lastDate||'');
  setTimeout(()=>{if(date&&$('dayDetailModal')&&!$('dayDetailModal').classList.contains('hidden'))window.openDay?.(date)},40);
}
function injectStyle(){
  if($('zrAdminCalendarStatusSelectV1Style'))return;
  const s=document.createElement('style');s.id='zrAdminCalendarStatusSelectV1Style';s.textContent=`
  #dayDetailContent .zr-cal-state-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:12px}
  #dayDetailContent .zr-cal-state-row select{flex:1 1 170px;max-width:240px;min-width:150px;min-height:40px}
  #dayDetailContent .zr-cal-state-row button{min-height:40px}
  #dayDetailContent .zr-cal-booking-date{margin-bottom:2px;font-weight:800}
  #dayDetailContent .status.zr-hold-status{background:#f1ebff!important;border-color:#d7c7f5!important;color:#65459a!important;font-weight:900!important}
  @media(max-width:560px){
    #dayDetailContent .zr-cal-state-row select{max-width:none;min-width:0;flex:1 1 calc(100% - 82px)}
    #dayDetailContent .zr-cal-state-row .zr-cal-edit{flex-basis:100%;width:100%}
  }`;
  document.head.appendChild(s);
}
function directHold(id){
  if(!adminOk())return;
  const list=all(),b=list.find(x=>String(x.id)===String(id));
  if(!b)return msg('예약 정보를 찾지 못했습니다.');
  if(settled(b))return msg('정산 완료 예약은 보류로 변경할 수 없습니다.');
  if(!['pending','confirmed'].includes(b.status))return msg('접수 또는 확정 예약만 보류로 변경할 수 있습니다.');
  b.status=HOLD;b.statusUpdatedAt=new Date().toISOString();save(list);
  try{window.addActivity?.('hold',b,'예약 보류')}catch{}
  msg('예약을 보류 상태로 변경했습니다.');refreshDirect(b);
}
function directConfirmed(id){
  const fn=typeof window.setBookingStatus==='function'?window.setBookingStatus:(typeof setBookingStatus==='function'?setBookingStatus:null);
  if(typeof fn==='function')return fn(id,'confirmed');
  const fallback=typeof window.requestBookingStatus==='function'?window.requestBookingStatus:(typeof requestBookingStatus==='function'?requestBookingStatus:null);
  if(typeof fallback==='function')return fallback(id,'confirmed');
  msg('예약 확정 기능을 불러오지 못했습니다.');
}
function restoreCancelled(id,target){
  if(!adminOk())return;
  const list=all(),b=list.find(x=>String(x.id)===String(id));
  if(!b||b.status!=='cancelled')return msg('취소 예약 정보를 찾지 못했습니다.');
  if(!['confirmed',HOLD].includes(target))return;
  const now=new Date().toISOString();
  b.status=target;b.statusUpdatedAt=now;
  if(target==='confirmed')b.confirmedAt=now;
  delete b.cancelReason;delete b.cancelledAt;delete b.cancelledBy;
  save(list);
  try{window.addActivity?.(target==='confirmed'?'confirmed':'hold',b,target==='confirmed'?'취소 예약 복구 · 예약 확정':'취소 예약 복구 · 예약 보류')}catch{}
  msg(target==='confirmed'?'취소 예약을 확정 상태로 복구했습니다.':'취소 예약을 보류 상태로 복구했습니다.');
  refreshDirect(b);
}
function applyStatus(id,select){
  const b=byId(id);if(!b)return msg('예약 정보를 찾지 못했습니다.');
  const target=String(select?.value||'');
  if(!target)return msg('변경할 상태를 선택해주세요.');
  if(target===b.status)return msg('현재 상태와 동일합니다.');
  if(target===HOLD){
    if(b.status==='cancelled')return restoreCancelled(id,HOLD);
    return directHold(id);
  }
  if(target==='confirmed'){
    if(b.status==='cancelled')return restoreCancelled(id,'confirmed');
    return directConfirmed(id);
  }
  if(target==='cancelled'){
    const fn=typeof window.requestBookingStatus==='function'?window.requestBookingStatus:(typeof requestBookingStatus==='function'?requestBookingStatus:null);
    if(typeof fn==='function')return fn(id,'cancelled');
    return msg('예약 취소 기능을 불러오지 못했습니다.');
  }
}
function actionRow(b){
  const row=document.createElement('div');row.className='top-actions zr-cal-state-row';
  const select=document.createElement('select');select.className='zr-cal-state-select';select.setAttribute('aria-label','예약 상태 변경');
  select.innerHTML='<option value="">상태 선택</option><option value="confirmed">예약 확정</option><option value="hold">예약 보류</option><option value="cancelled">예약 취소</option>';
  if(['confirmed',HOLD,'cancelled'].includes(b.status))select.value=b.status;
  const saveBtn=document.createElement('button');saveBtn.type='button';saveBtn.className='btn-primary';saveBtn.textContent='저장';saveBtn.onclick=()=>applyStatus(b.id,select);
  row.append(select,saveBtn);
  if(b.status!=='cancelled'&&typeof window.openAdminEditBooking==='function'){
    const edit=document.createElement('button');edit.type='button';edit.className='btn-soft zr-cal-edit';edit.textContent='예약 수정';edit.onclick=()=>window.openAdminEditBooking(b.id);row.appendChild(edit);
  }
  return row;
}
function decorateBookingDate(card,b){
  const grid=card.querySelector(':scope > .detail-grid'),zoo=grid?.children?.[1];
  if(!zoo)return;
  let line=zoo.querySelector(':scope > .zr-cal-booking-date');
  if(!line){line=document.createElement('div');line.className='zr-cal-booking-date';zoo.prepend(line)}
  line.textContent=`예약일 ${b.date||'-'}`;
}
function decorateDay(date=lastDate){
  injectStyle();lastDate=String(date||lastDate||'');
  const root=$('dayDetailContent');if(!root||!lastDate)return;
  const list=all().filter(b=>String(b.date||'')===lastDate),cards=[...root.querySelectorAll(':scope > .booking-item')];
  cards.forEach((card,i)=>{
    const b=list[i];if(!b||!['pending','confirmed',HOLD,'cancelled'].includes(b.status))return;
    decorateBookingDate(card,b);
    if(b.status===HOLD){const badge=card.querySelector(':scope > .row .status');if(badge){badge.textContent='보류';badge.className='status zr-hold-status'}}
    card.querySelectorAll(':scope > .zr-cal-state-row').forEach(x=>x.remove());
    const old=card.querySelector(':scope > .top-actions');if(old)old.remove();
    const settlement=card.querySelector(':scope > .zr2-settle,:scope > .zr-settlement-editor');
    const row=actionRow(b);settlement?card.insertBefore(row,settlement):card.appendChild(row);
  });
}
function wrapOpenDay(){
  const current=window.openDay;
  if(typeof current!=='function')return false;
  if(current.__zrCalendarStatusSelect)return true;
  if(typeof window.zrRequestBookingHold!=='function')return false;
  const base=current;
  const wrapped=function(date){lastDate=String(date||'');const out=base.apply(this,arguments);setTimeout(()=>decorateDay(date),80);return out};
  wrapped.__zrCalendarStatusSelect=true;wrapped.__zrHold=true;wrapped.__zrBase=base;
  window.openDay=wrapped;try{openDay=wrapped}catch{}
  return true;
}
function boot(){
  injectStyle();
  const timer=setInterval(()=>{if(wrapOpenDay())clearInterval(timer)},120);
  setTimeout(()=>clearInterval(timer),20000);setTimeout(()=>wrapOpenDay(),0);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
