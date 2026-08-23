(()=>{
'use strict';
if(window.__ZR_ADMIN_ACTIVITY_FILTER_FIX_V1)return;
window.__ZR_ADMIN_ACTIVITY_FILTER_FIX_V1=true;

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').trim().toLocaleLowerCase('ko-KR').replace(/\s+/g,'');
const ACTIVITY_BASIS_KEY='zr_activity_date_basis_v10';
const VENDOR_COLOR_KEY='zr_vendor_colors';
const SELF_COLOR='#ECEFF1';
let orgSearchRender=null;
let installed=false;

function readBookings(){
  try{
    const list=typeof window.bookings==='function'?window.bookings():(typeof bookings==='function'?bookings():[]);
    return Array.isArray(list)?list.filter(b=>b&&!b.__availabilityOnly):[];
  }catch{return []}
}
function seoulDate(value){
  const raw=String(value||'').trim();if(!raw)return '';
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
  const m=raw.match(/\d{4}-\d{2}-\d{2}/);return m?m[0]:'';
}
function basis(){
  const v=$('activityDateBasis')?.value;
  if(v==='reservation'||v==='reception')return v;
  return localStorage.getItem(ACTIVITY_BASIS_KEY)==='reservation'?'reservation':'reception';
}
function orgQuery(){return String($('zrActivityOrgSearch')?.value||'').trim()}
function filteredBookings(){
  const q=orgQuery();
  if(q)return readBookings().filter(b=>norm(b.orgName).includes(norm(q)));
  const start=$('activityStart')?.value||'',end=$('activityEnd')?.value||'',mode=basis();
  return readBookings().filter(b=>{
    const key=mode==='reservation'?String(b.date||''):seoulDate(b.createdAt);
    if(start&&key<start)return false;
    if(end&&key>end)return false;
    return true;
  }).sort((a,b)=>{
    const ak=mode==='reservation'?String(a.date||''):seoulDate(a.createdAt);
    const bk=mode==='reservation'?String(b.date||''):seoulDate(b.createdAt);
    return bk.localeCompare(ak)||String(b.createdAt||'').localeCompare(String(a.createdAt||''));
  });
}
function isSettled(b){return !!(b?.status==='confirmed'&&b?.settlement?.savedAt)}
function statusBadge(b){
  if(isSettled(b))return '<span class="status zr4-complete">정산완료</span>';
  if(b?.status==='pending')return '<span class="status pending">접수 대기</span>';
  if(b?.status==='confirmed')return '<span class="status confirmed">예약 확정</span>';
  if(b?.status==='cancelled')return '<span class="status rejected">예약 취소</span>';
  if(b?.status==='rejected')return '<span class="status rejected">예약 거절</span>';
  return `<span class="status">${esc(b?.status||'-')}</span>`;
}
function vendorColors(){
  try{const x=JSON.parse(localStorage.getItem(VENDOR_COLOR_KEY)||'{}');return x&&typeof x==='object'?x:{}}catch{return {}}
}
function vendorInfo(b){
  const st=b?.settlement||{},snap=st.vendorSnapshot||b?.outsourcingVendorSnapshot||{};
  const id=st.vendorId||b?.outsourcingVendorId||snap.id||'self';
  if(id==='self')return {id,name:'자체',color:SELF_COLOR};
  let current=null;try{current=(settings().outsourcingVendors||[]).find(v=>v.id===id)||null}catch{}
  return {id,name:snap.name||current?.name||id,color:vendorColors()[id]||'#E8ECEF'};
}
function vendorBadge(b){const v=vendorInfo(b);return `<span class="status zr4-vendor" style="background:${esc(v.color)};border-color:${esc(v.color)};color:#25312a">${esc(v.name)}</span>`}
function dateTime(v){try{return typeof dateTimeText==='function'?dateTimeText(v):String(v||'-')}catch{return String(v||'-')}}
function moneyText(v){try{return typeof money==='function'?money(v):`${Math.round(Number(v||0)).toLocaleString('ko-KR')}원`}catch{return `${Math.round(Number(v||0)).toLocaleString('ko-KR')}원`}}
function cancelSource(b){try{return typeof cancellationSourceText==='function'?cancellationSourceText(b):'취소'}catch{return '취소'}}
function setKpis(list){
  const settled=list.filter(isSettled).length;
  const set=(id,n)=>{const el=$(id);if(el)el.textContent=`${n}건`};
  set('activityKpiTotal',list.length);
  set('activityKpiConfirmed',list.filter(b=>b.status==='confirmed'&&!isSettled(b)).length);
  set('activityKpiPending',list.filter(b=>b.status==='pending').length);
  set('activityKpiCancelled',list.filter(b=>b.status==='cancelled').length);
  set('activityKpiCompleted',settled);
}
function renderDateFiltered(){
  if(orgQuery()&&typeof orgSearchRender==='function')return orgSearchRender();
  const root=$('activityList');if(!root)return;
  const list=filteredBookings();setKpis(list);
  root.innerHTML=list.length?list.map(b=>{
    const st=b.settlement||{};
    return `<div class="booking-item">
      <div class="zr4-badges">${statusBadge(b)}${vendorBadge(b)}</div>
      <div class="row" style="margin-top:7px"><div><b>${esc(b.orgName)}</b><div class="help">접수 ${esc(dateTime(b.createdAt))} · 예약일 ${esc(b.date||'-')}</div></div></div>
      <div class="detail-grid">
        <div><b>예약자</b><br>${esc(b.managerName||'-')}</div><div><b>연락처</b><br>${esc(b.contact||'-')}</div>
        <div><b>방문시간</b><br>${esc(b.entryTime||'--:--')} ~ ${esc(b.exitTime||'--:--')}</div><div><b>인원</b><br>유료 ${Number(b.paidCount||0)} / 인솔 ${Number(b.chaperoneCount||0)}</div>
        ${isSettled(b)?`<div><b>실제 매표</b><br>${esc(moneyText(st.ticketAmount||0))}</div><div><b>실제 카페</b><br>${esc(moneyText(st.actualCafeAmount||0))}</div>`:''}
        ${b.status==='cancelled'?`<div><b>취소 구분</b><br>${esc(cancelSource(b))}</div><div><b>취소 일시</b><br>${esc(dateTime(b.cancelledAt))}</div>`:''}
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn-soft" onclick="openAdminBookingDetail('${esc(b.id)}')">자세히</button></div>
    </div>`;
  }).join(''):'<div class="help">선택한 조회 조건에 예약 내역이 없습니다.</div>';
}
function bindControls(){
  const tab=$('tab-activity');if(!tab)return;
  const search=[...tab.querySelectorAll('button')].find(b=>(b.textContent||'').trim()==='조회하기');
  const today=[...tab.querySelectorAll('button')].find(b=>(b.textContent||'').trim()==='오늘');
  const after=()=>setTimeout(renderDateFiltered,0);
  const bind=(el,key,event='click')=>{if(!el||el.dataset[key])return;el.dataset[key]='1';el.addEventListener(event,after)};
  bind(search,'zrActivityFilterFix','click');
  bind(today,'zrActivityFilterFix','click');
  bind($('activityDateBasis'),'zrActivityFilterFix','change');
  bind($('zrActivityOrgSearch'),'zrActivityFilterFix','input');
}
function install(){
  if(installed)return true;
  const ready=window.__ZR_ADMIN_OPS_V11_PATCH&&$('tab-activity')&&$('activityDateBasis')&&$('zrActivityOrgSearch')&&typeof window.renderActivity==='function'&&window.renderActivity.__zrOrgSearchV2;
  if(!ready)return false;
  orgSearchRender=window.renderActivity;
  window.activityFilteredBookings=filteredBookings;try{activityFilteredBookings=filteredBookings}catch{}
  window.renderActivity=renderDateFiltered;try{renderActivity=renderDateFiltered}catch{}
  bindControls();installed=true;
  if(!$('tab-activity')?.classList.contains('hidden'))renderDateFiltered();
  return true;
}
function boot(){
  const timer=setInterval(()=>{if(install()){clearInterval(timer);return}bindControls()},120);
  setTimeout(()=>clearInterval(timer),20000);
  document.addEventListener('click',e=>{
    const tab=e.target?.closest?.('#adminView .admin-tabs button,[data-tab]');
    if(tab)setTimeout(()=>{install();bindControls();if(installed&&!$('tab-activity')?.classList.contains('hidden'))renderDateFiltered()},80);
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
