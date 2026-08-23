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
let installed=false;
let applied=null;

function readBookings(){
  try{
    const list=JSON.parse(localStorage.getItem('zr_bookings')||'[]');
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
function selectedBasis(){
  const v=$('activityDateBasis')?.value;
  if(v==='reservation'||v==='reception')return v;
  return localStorage.getItem(ACTIVITY_BASIS_KEY)==='reservation'?'reservation':'reception';
}
function currentControls(){
  return {
    start:$('activityStart')?.value||'',
    end:$('activityEnd')?.value||'',
    basis:selectedBasis()
  };
}
function orgQuery(){return String($('zrActivityOrgSearch')?.value||'').trim()}
function keyFor(b,mode){return mode==='reservation'?String(b?.date||''):seoulDate(b?.createdAt)}
function sortByBasis(list,mode){
  return list.sort((a,b)=>{
    const ak=keyFor(a,mode),bk=keyFor(b,mode);
    return bk.localeCompare(ak)||String(b?.createdAt||'').localeCompare(String(a?.createdAt||''));
  });
}
function listForApplied(){
  const q=orgQuery();
  if(q){
    return readBookings().filter(b=>norm(b?.orgName).includes(norm(q))).sort((a,b)=>String(b?.date||'').localeCompare(String(a?.date||''))||String(b?.createdAt||'').localeCompare(String(a?.createdAt||'')));
  }
  const state=applied||currentControls();
  return sortByBasis(readBookings().filter(b=>{
    const key=keyFor(b,state.basis);
    if(state.start&&key<state.start)return false;
    if(state.end&&key>state.end)return false;
    return true;
  }),state.basis);
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
function searchNote(list){
  const q=orgQuery();if(!q)return '';
  return `<div class="zr-search-result-note">단체명 ‘${esc(q)}’ 검색 결과 ${list.length}건 · 조회 시작일·종료일·조회 기준은 적용하지 않았습니다.</div>`;
}
function renderActivityOwned(){
  const root=$('activityList');if(!root)return;
  const list=listForApplied();setKpis(list);
  const cards=list.map(b=>{
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
  }).join('');
  root.innerHTML=searchNote(list)+(cards||'<div class="help">선택한 조회 조건에 예약 내역이 없습니다.</div>');
}
function applyFromControls(){
  const next=currentControls();
  if(next.start&&next.end&&next.start>next.end){
    try{if(typeof toast==='function')toast('조회 시작일은 조회 종료일보다 늦을 수 없습니다.')}catch{}
    return false;
  }
  applied={...next};
  localStorage.setItem(ACTIVITY_BASIS_KEY,next.basis);
  renderActivityOwned();
  return true;
}
function applyToday(){
  const q=$('zrActivityOrgSearch');if(q)q.value='';
  const today=seoulDate(new Date().toISOString());
  if($('activityStart'))$('activityStart').value=today;
  if($('activityEnd'))$('activityEnd').value=today;
  applyFromControls();
}
function ownLegacyHandlers(){
  const tab=$('tab-activity');if(!tab)return;
  const buttons=[...tab.querySelectorAll('button')];
  const search=buttons.find(b=>(b.textContent||'').trim()==='조회하기');
  const today=buttons.find(b=>(b.textContent||'').trim()==='오늘');
  if(search)search.onclick=null;
  if(today)today.onclick=null;
  const basis=$('activityDateBasis');
  if(basis)basis.onchange=null;
}
function install(){
  if(installed)return true;
  const ready=$('tab-activity')&&$('activityStart')&&$('activityEnd')&&$('activityDateBasis')&&$('activityList')&&typeof window.renderActivity==='function';
  if(!ready)return false;
  applied=currentControls();
  window.activityFilteredBookings=()=>listForApplied();try{activityFilteredBookings=window.activityFilteredBookings}catch{}
  window.renderActivity=renderActivityOwned;try{renderActivity=renderActivityOwned}catch{}
  ownLegacyHandlers();
  installed=true;
  if(!$('tab-activity')?.classList.contains('hidden'))renderActivityOwned();
  return true;
}
function boot(){
  const timer=setInterval(()=>{if(install()){clearInterval(timer);return}ownLegacyHandlers()},120);
  setTimeout(()=>clearInterval(timer),20000);

  document.addEventListener('change',e=>{
    if(e.target?.id!=='activityDateBasis')return;
    const v=e.target.value==='reservation'?'reservation':'reception';
    localStorage.setItem(ACTIVITY_BASIS_KEY,v);
    e.stopImmediatePropagation();
  },true);

  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('#tab-activity button');if(!btn)return;
    const text=(btn.textContent||'').trim();
    if(text==='조회하기'){
      if(norm(orgQuery()))return;
      e.preventDefault();e.stopImmediatePropagation();
      install();ownLegacyHandlers();applyFromControls();
      return;
    }
    if(text==='오늘'){
      e.preventDefault();e.stopImmediatePropagation();
      install();ownLegacyHandlers();applyToday();
    }
  },true);

  document.addEventListener('keydown',e=>{
    if(e.target?.id!=='zrActivityOrgSearch'||e.key!=='Enter'||norm(e.target.value))return;
    e.preventDefault();e.stopImmediatePropagation();
    install();applyFromControls();
  },true);

  document.addEventListener('click',e=>{
    const tab=e.target?.closest?.('#adminView .admin-tabs button,[data-tab]');
    if(tab)setTimeout(()=>{install();ownLegacyHandlers();if(installed&&!$('tab-activity')?.classList.contains('hidden'))renderActivityOwned()},80);
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
