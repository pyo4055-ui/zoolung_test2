(()=>{
'use strict';
if(window.__ZR_ADMIN_BOOKING_HOLD_QUERY_FIX_V1)return;
window.__ZR_ADMIN_BOOKING_HOLD_QUERY_FIX_V1=true;

const HOLD='hold';
const FILTER_KEY='zr_activity_status_filter_v1';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

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
function setKpis(total){
  const set=(id,n)=>{const el=$(id);if(el)el.textContent=`${n}건`};
  set('activityKpiTotal',total);
  set('activityKpiConfirmed',0);
  set('activityKpiPending',0);
  set('activityKpiCancelled',0);
  set('activityKpiCompleted',0);
}
function renderHeld(){
  const root=$('activityList');
  if(!root)return;
  const list=heldBookings();
  setKpis(list.length);
  root.innerHTML=list.length?list.map(b=>`<div class="booking-item">
    <div class="zr4-badges"><span class="status zr-hold-status">예약보류</span></div>
    <div class="row" style="margin-top:7px"><div><b>${esc(b.orgName)}</b><div class="help">접수 ${esc(seoulDate(b.createdAt)||'-')} · 예약일 ${esc(b.date||'-')}</div></div></div>
    <div class="detail-grid">
      <div><b>예약자</b><br>${esc(b.managerName||'-')}</div><div><b>연락처</b><br>${esc(b.contact||'-')}</div>
      <div><b>방문시간</b><br>${esc(b.entryTime||'--:--')} ~ ${esc(b.exitTime||'--:--')}</div><div><b>인원</b><br>유료 ${Number(b.paidCount||0)} / 인솔 ${Number(b.chaperoneCount||0)}</div>
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn-soft" onclick="openAdminBookingDetail('${esc(b.id)}')">자세히</button></div>
  </div>`).join(''):'<div class="help">선택한 조회 조건에 보류 예약이 없습니다.</div>';
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
