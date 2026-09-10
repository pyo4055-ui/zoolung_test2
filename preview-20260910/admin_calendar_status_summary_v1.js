(()=>{
'use strict';
if(window.__ZR_ADMIN_CALENDAR_STATUS_SUMMARY_V1)return;
window.__ZR_ADMIN_CALENDAR_STATUS_SUMMARY_V1=true;

const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
let renderedYm='';

function allBookings(){
  try{return typeof window.bookings==='function'?(window.bookings()||[]):[]}
  catch{return []}
}
function isComplete(b){return !!(b&&b.status==='confirmed'&&b.settlement&&b.settlement.savedAt)}
function previewCount(date){
  try{return Math.max(0,Number(window.zrPreviewVisitConfirmedByDate?.(date)||0))}
  catch{return 0}
}
function selectedYm(){
  const ym=String($('adminMonth')?.value||'');
  return /^\d{4}-\d{2}$/.test(ym)?ym:'';
}
function injectStyle(){
  if($('zrAdminCalendarStatusSummaryV1Style'))return;
  const s=document.createElement('style');
  s.id='zrAdminCalendarStatusSummaryV1Style';
  s.textContent=`
  #adminCalendar .day{min-height:142px!important;box-sizing:border-box;display:flex!important;flex-direction:column!important}
  #adminCalendar .day>.meta{flex:0 0 auto}
  #adminCalendar .day>.btn-soft{margin-top:auto!important;flex:0 0 auto}
  #adminCalendar .zr-cal-status-summary{display:flex;align-items:center;align-content:flex-start;gap:2px 4px;flex-wrap:wrap;min-height:16px;max-height:46px;margin:3px 0 4px;overflow:hidden;font-size:10px;font-weight:900;letter-spacing:-.45px;line-height:1.25}
  #adminCalendar .zr-cal-status-summary .pending{color:#a76600}
  #adminCalendar .zr-cal-status-summary .hold{color:#7657a8}
  #adminCalendar .zr-cal-status-summary .confirmed{color:#2f6b9a}
  #adminCalendar .zr-cal-status-summary .completed{color:#2f6b4f}
  #adminCalendar .zr-cal-status-summary .cancelled{color:#a33b3b}
  #adminCalendar .zr-cal-status-summary .preview{color:#6b50a0}
  #adminCalendar .zr-cal-status-summary .sep{color:#aeb6b0;font-weight:700}
  @media(max-width:720px){
    #adminCalendar .day{min-height:138px!important}
    #adminCalendar .zr-cal-status-summary{gap:2px 3px;font-size:9.4px;letter-spacing:-.55px}
  }
  `;
  document.head.appendChild(s);
}
function dateOf(day){
  if(!/^\d{4}-\d{2}$/.test(renderedYm))return '';
  const first=day.querySelector(':scope > .num > span');
  const m=String(first?.textContent||'').match(/(\d{1,2})일/);
  return m?`${renderedYm}-${pad(Number(m[1]))}`:'';
}
function summaryHtml(pending,hold,confirmed,completed,cancelled,preview){
  const items=[];
  if(pending)items.push(`<span class="pending">접수 ${pending}</span>`);
  if(hold)items.push(`<span class="hold">보류 ${hold}</span>`);
  if(confirmed)items.push(`<span class="confirmed">확정 ${confirmed}</span>`);
  if(completed)items.push(`<span class="completed">완료 ${completed}</span>`);
  if(cancelled)items.push(`<span class="cancelled">취소 ${cancelled}</span>`);
  if(preview)items.push(`<span class="preview">답사 ${preview}</span>`);
  return items.join('<span class="sep">·</span>');
}
function patchDay(day,bookings){
  const date=dateOf(day);if(!date)return;
  const list=bookings.filter(b=>b&&!b.__availabilityOnly&&b.date===date);
  const pending=list.filter(b=>b.status==='pending').length;
  const hold=list.filter(b=>b.status==='hold').length;
  const completed=list.filter(isComplete).length;
  const confirmed=list.filter(b=>b.status==='confirmed'&&!isComplete(b)).length;
  const cancelled=list.filter(b=>b.status==='cancelled').length;
  const preview=previewCount(date);

  const top=day.querySelector(':scope > .num');if(!top)return;
  top.querySelectorAll('.status.pending').forEach(x=>{
    if(/^접수\s*\d+건$/.test(String(x.textContent||'').replace(/\s+/g,' ').trim()))x.remove();
  });

  const meta=day.querySelector(':scope > .meta');if(!meta)return;
  meta.classList.remove('zr-cal-meta');
  meta.querySelector(':scope > .zr-cal-status-summary')?.remove();
  day.querySelector(':scope > .zr-cal-status-summary')?.remove();

  const html=summaryHtml(pending,hold,confirmed,completed,cancelled,preview);
  if(!html)return;
  const summary=document.createElement('div');
  summary.className='zr-cal-status-summary';
  summary.innerHTML=html;
  meta.insertAdjacentElement('afterend',summary);
}
function isCalendarRenderMutation(record){
  const cal=$('adminCalendar');
  if(!cal||record.target!==cal)return false;
  const hasCalendarNode=node=>node?.nodeType===1&&(node.matches?.('.day,.weekday')||node.querySelector?.('.day,.weekday'));
  return [...record.addedNodes,...record.removedNodes].some(hasCalendarNode);
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
window.zrAdminCalendarStatusSummaryPatch=patch;
function boot(){
  injectStyle();renderedYm=selectedYm();patch();
  const cal=$('adminCalendar');
  if(cal){
    new MutationObserver(records=>{
      if(records.some(isCalendarRenderMutation))renderedYm=selectedYm();
      patch();
    }).observe(cal,{childList:true,subtree:true});
  }else{
    new MutationObserver(()=>{
      if(!$('adminCalendar'))return;
      if(!renderedYm)renderedYm=selectedYm();
      patch();
    }).observe(document.body,{childList:true,subtree:true});
  }
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#adminView .admin-tabs button,#adminCalendar button'))setTimeout(patch,0);
  });
  document.addEventListener('zr:preview-visits-changed',()=>setTimeout(patch,0));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
