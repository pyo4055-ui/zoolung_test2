(()=>{
'use strict';
if(window.__ZR_ADMIN_BOOKING_HOLD_QUERY_FIX_V1)return;
window.__ZR_ADMIN_BOOKING_HOLD_QUERY_FIX_V1=true;

const HOLD='hold';
const FILTER_KEY='zr_activity_status_filter_v1';
const $=id=>document.getElementById(id);

function seoulDate(value){
  const raw=String(value||'').trim();
  if(!raw)return '';
  if(/^\d{4}-\d{2}-\d{2}$/.test(raw))return raw;
  const d=new Date(raw);
  if(Number.isFinite(d.getTime())){
    try{
      const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
      const get=t=>parts.find(x=>x.type===t)?.value||'';
      const y=get('year'),m=get('month'),day=get('day');
      if(y&&m&&day)return `${y}-${m}-${day}`;
    }catch{}
  }
  const m=raw.match(/\d{4}-\d{2}-\d{2}/);
  return m?m[0]:'';
}
function readBookings(){
  try{
    const list=typeof window.bookings==='function'?window.bookings():[];
    return Array.isArray(list)?list.filter(b=>b&&!b.__availabilityOnly):[];
  }catch{return []}
}
function keyFor(b,reservation){return reservation?String(b?.date||''):seoulDate(b?.createdAt)}
function heldBookings(){
  const start=$('activityStart')?.value||$('activityStartDate')?.value||'';
  const end=$('activityEnd')?.value||$('activityEndDate')?.value||'';
  const reservation=$('activityDateBasis')?.value==='reservation';
  return readBookings().filter(b=>{
    if(b?.status!==HOLD)return false;
    const key=keyFor(b,reservation);
    if(!key)return false;
    if(start&&key<start)return false;
    if(end&&key>end)return false;
    return true;
  }).sort((a,b)=>{
    const ak=keyFor(a,reservation),bk=keyFor(b,reservation);
    return bk.localeCompare(ak)||String(b.createdAt||'').localeCompare(String(a.createdAt||''));
  });
}
function renderHeld(){
  window.zrRenderHeldBookingRows(heldBookings(),seoulDate);
}
function intercept(e){
  const select=$('zrActivityStatusFilter');
  if(select?.value!==HOLD)return;
  const button=e.target?.closest?.('#tab-activity button');
  if(!button)return;
  const text=String(button.textContent||'').trim();
  if(text!=='조회하기'&&text!=='오늘')return;
  e.preventDefault();
  e.stopImmediatePropagation();
  if(text==='오늘'){
    const d=seoulDate(new Date().toISOString());
    const start=$('activityStart')||$('activityStartDate');
    const end=$('activityEnd')||$('activityEndDate');
    if(start)start.value=d;
    if(end)end.value=d;
  }
  localStorage.setItem(FILTER_KEY,HOLD);
  renderHeld();
}

window.zrRenderHeldActivity=renderHeld;
window.addEventListener('click',intercept,true);
})();
