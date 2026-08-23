(()=>{
'use strict';
if(window.__ZR_ADMIN_CALENDAR_STATUS_SUMMARY_V1)return;
window.__ZR_ADMIN_CALENDAR_STATUS_SUMMARY_V1=true;

const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');

function allBookings(){
  try{return typeof window.bookings==='function'?(window.bookings()||[]):[]}
  catch{return []}
}
function isComplete(b){return !!(b&&b.status==='confirmed'&&b.settlement&&b.settlement.savedAt)}
function injectStyle(){
  if($('zrAdminCalendarStatusSummaryV1Style'))return;
  const s=document.createElement('style');
  s.id='zrAdminCalendarStatusSummaryV1Style';
  s.textContent=`
  #adminCalendar .zr-cal-status-summary{display:flex;align-items:center;gap:4px;min-height:18px;margin:4px 0 1px;white-space:nowrap;font-size:10.5px;font-weight:900;letter-spacing:-.35px;line-height:1.25}
  #adminCalendar .zr-cal-status-summary .pending{color:#a76600}
  #adminCalendar .zr-cal-status-summary .completed{color:#2f6b4f}
  #adminCalendar .zr-cal-status-summary .cancelled{color:#a33b3b}
  #adminCalendar .zr-cal-status-summary .sep{color:#aeb6b0;font-weight:700}
  @media(max-width:720px){#adminCalendar .zr-cal-status-summary{gap:3px;font-size:10px;letter-spacing:-.45px}}
  `;
  document.head.appendChild(s);
}
function dateOf(day){
  const ym=String($('adminMonth')?.value||'');
  if(!/^\d{4}-\d{2}$/.test(ym))return '';
  const first=day.querySelector(':scope > .num > span');
  const m=String(first?.textContent||'').match(/(\d{1,2})일/);
  return m?`${ym}-${pad(Number(m[1]))}`:'';
}
function summaryHtml(pending,completed,cancelled){
  const items=[];
  if(pending)items.push(`<span class="pending">접수 ${pending}</span>`);
  if(completed)items.push(`<span class="completed">완료 ${completed}</span>`);
  if(cancelled)items.push(`<span class="cancelled">취소 ${cancelled}</span>`);
  return items.join('<span class="sep">·</span>');
}
function patchDay(day,bookings){
  const date=dateOf(day);if(!date)return;
  const list=bookings.filter(b=>b&&!b.__availabilityOnly&&b.date===date);
  const pending=list.filter(b=>b.status==='pending').length;
  const completed=list.filter(isComplete).length;
  const cancelled=list.filter(b=>b.status==='cancelled').length;

  const top=day.querySelector(':scope > .num');if(!top)return;
  top.querySelectorAll('.status.pending').forEach(x=>{
    if(/^접수\s*\d+건$/.test(String(x.textContent||'').replace(/\s+/g,' ').trim()))x.remove();
  });

  let row=day.querySelector(':scope > .zr-cal-status-summary');
  const html=summaryHtml(pending,completed,cancelled);
  if(!html){row?.remove();return}
  if(!row){row=document.createElement('div');row.className='zr-cal-status-summary';top.insertAdjacentElement('afterend',row)}
  if(row.innerHTML!==html)row.innerHTML=html;
}
let pendingPatch=false;
function patch(){
  if(pendingPatch)return;
  pendingPatch=true;
  requestAnimationFrame(()=>{
    pendingPatch=false;injectStyle();
    const cal=$('adminCalendar');if(!cal)return;
    const bs=allBookings();
    cal.querySelectorAll('.day').forEach(day=>patchDay(day,bs));
  });
}
function boot(){
  injectStyle();patch();
  const cal=$('adminCalendar');
  if(cal)new MutationObserver(patch).observe(cal,{childList:true,subtree:true});
  else new MutationObserver(()=>{if($('adminCalendar'))patch()}).observe(document.body,{childList:true,subtree:true});
  $('adminMonth')?.addEventListener('change',()=>setTimeout(patch,0));
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#adminView .admin-tabs button,#adminCalendar button'))setTimeout(patch,0);
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
