(()=>{
'use strict';
if(window.ZRAdminActivitySearch)return;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').trim().toLocaleLowerCase('ko-KR').replace(/\s+/g,'');
let activityClickBound=false;

function readBookings(){
  try{
    const list=typeof window.bookings==='function'?window.bookings():JSON.parse(localStorage.getItem('zr_bookings')||'[]');
    return Array.isArray(list)?list.filter(b=>b&&!b.__availabilityOnly):[];
  }catch{return []}
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
function dateText(v){const s=String(v||'');const m=s.match(/\d{4}-\d{2}-\d{2}/);return m?m[0]:(s||'-')}
function setKpis(list){
  const set=(id,n)=>{const el=$(id);if(el)el.textContent=`${n}건`};
  set('activityKpiTotal',list.length);
  set('activityKpiConfirmed',list.filter(b=>b?.status==='confirmed'&&!isSettled(b)).length);
  set('activityKpiPending',list.filter(b=>b?.status==='pending').length);
  set('activityKpiCancelled',list.filter(b=>b?.status==='cancelled'||b?.status==='rejected').length);
  set('activityKpiCompleted',list.filter(isSettled).length);
}
function bookingCard(b){
  return `<div class="booking-item"><div class="zr4-badges">${statusBadge(b)}</div><div class="row" style="margin-top:7px"><div><b>${esc(b?.orgName||'')}</b><div class="help">접수 ${esc(dateText(b?.createdAt))} · 예약일 ${esc(b?.date||'-')}</div></div></div><div class="detail-grid"><div><b>예약자</b><br>${esc(b?.managerName||'-')}</div><div><b>연락처</b><br>${esc(b?.contact||'-')}</div><div><b>방문시간</b><br>${esc(b?.entryTime||'--:--')} ~ ${esc(b?.exitTime||'--:--')}</div><div><b>인원</b><br>유료 ${Number(b?.paidCount||0)} / 인솔 ${Number(b?.chaperoneCount||0)}</div></div><div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn-soft" onclick="openAdminBookingDetail('${window.ZRDisplaySafety.inlineString(b?.id||'')}')">자세히</button></div></div>`;
}
function orgInput(){return $('zrActivityOrgStandaloneSearch')}
function renderOrgSearch(){
  const input=orgInput(),root=$('activityList');if(!input||!root)return false;
  const q=String(input.value||'').trim();if(!q)return false;
  const nq=norm(q);
  const list=readBookings().filter(b=>norm(b?.orgName).includes(nq)).sort((a,b)=>String(b?.date||'').localeCompare(String(a?.date||''))||String(b?.createdAt||'').localeCompare(String(a?.createdAt||'')));
  setKpis(list);
  root.innerHTML=list.length?list.map(bookingCard).join(''):`<div class="help">‘${esc(q)}’ 단체명을 포함한 예약이 없습니다.</div>`;
  return true;
}
function bindActivityDelegatedSearch(){
  if(activityClickBound)return;
  activityClickBound=true;
  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('#tab-activity button');if(!btn)return;
    if(String(btn.textContent||'').replace(/\s+/g,'').trim()!=='조회하기')return;
    const input=orgInput();if(!input||!String(input.value||'').trim())return;
    e.preventDefault();e.stopImmediatePropagation();renderOrgSearch();
  },true);
}
function prepareActivitySearch(){
  const toolbar=$('zr11ActivityToolbar'),wrap=$('zrActivityOrgSearchWrap');if(!toolbar||!wrap)return false;
  if(wrap.parentElement!==toolbar)toolbar.appendChild(wrap);
  wrap.classList.remove('zr-activity-inline-search-disabled');
  let input=orgInput();
  if(!input){
    input=document.createElement('input');input.id='zrActivityOrgStandaloneSearch';input.type='search';input.autocomplete='off';input.placeholder='단체명 일부 입력';
    const old=$('zrActivityOrgSearch');if(old?.nextSibling)wrap.insertBefore(input,old.nextSibling);else wrap.appendChild(input);
  }
  input.disabled=false;input.tabIndex=0;
  if(!input.dataset.zrOperationalSearchBound){
    input.dataset.zrOperationalSearchBound='1';
    input.addEventListener('keydown',e=>{if(e.isComposing||e.keyCode===229||e.key!=='Enter'||!String(input.value||'').trim())return;e.preventDefault();e.stopImmediatePropagation();renderOrgSearch()},true);
  }
  $('zrActivityOrgSearchHint')?.classList.add('zr-admin-activity-legacy-help-hidden');
  const modalBtn=$('zrActivityOrgModalBtn');if(modalBtn){modalBtn.style.display='none';modalBtn.setAttribute('aria-hidden','true')}
  const tab=$('tab-activity');
  if(tab)[...tab.querySelectorAll('.help')].forEach(el=>{if(String(el.textContent||'').replace(/\s+/g,' ').trim().includes('기준으로 조회'))el.classList.add('zr-admin-activity-legacy-help-hidden')});
  return true;
}

function boot(){
  bindActivityDelegatedSearch();
  document.addEventListener('zr:activity-search-ui-ready',prepareActivitySearch);
  document.addEventListener('zr:admin-runtime-ready',prepareActivitySearch);
  prepareActivitySearch();
}
window.ZRAdminActivitySearch=Object.freeze({bind:bindActivityDelegatedSearch,prepare:prepareActivitySearch,render:renderOrgSearch});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
