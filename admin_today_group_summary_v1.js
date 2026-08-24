(()=>{
'use strict';
if(window.__ZR_ADMIN_TODAY_GROUP_SUMMARY_V1)return;
window.__ZR_ADMIN_TODAY_GROUP_SUMMARY_V1=true;

const ROOT_ID='zrAdminTodayGroupSummaryV1';
const STYLE_ID='zrAdminTodayGroupSummaryV1Style';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let patchQueued=false;
let observedCalendar=null;
let calendarObserver=null;

function allBookings(){
  try{
    const list=typeof window.bookings==='function'?window.bookings():[];
    return Array.isArray(list)?list.filter(b=>b&&!b.__availabilityOnly):[];
  }catch{return []}
}
function seoulToday(){
  try{
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const get=t=>parts.find(x=>x.type===t)?.value||'';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }catch{
    const d=new Date(Date.now()+9*60*60*1000);
    return d.toISOString().slice(0,10);
  }
}
function prettyDate(date){
  const m=String(date||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m?`${Number(m[2])}월 ${Number(m[3])}일`:String(date||'');
}
function isComplete(b){return !!(b?.status==='confirmed'&&b?.settlement?.savedAt)}
function statusInfo(b){
  if(isComplete(b))return {key:'completed',label:'완료'};
  if(b?.status==='confirmed')return {key:'confirmed',label:'확정'};
  return {key:'pending',label:'접수'};
}
function isMeal(b){return !!b?.mealType&&String(b.mealType).toLowerCase()!=='none'}
function isPlayground(b){return String(b?.playUse||'').toLowerCase()==='yes'}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
function validTime(v){return /^\d{2}:\d{2}$/.test(String(v||''))}
function todayBookings(){
  const date=seoulToday();
  return allBookings().filter(b=>b.date===date&&(b.status==='pending'||b.status==='confirmed')).sort((a,b)=>{
    const at=validTime(a.entryTime)?a.entryTime:'99:99';
    const bt=validTime(b.entryTime)?b.entryTime:'99:99';
    return at.localeCompare(bt)||String(a.orgName||'').localeCompare(String(b.orgName||''),'ko-KR');
  });
}
function injectStyle(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=`
    #${ROOT_ID}{margin:0 0 14px;padding:16px;border:1px solid #dfe5df;border-radius:16px;background:#fff;box-shadow:0 3px 14px rgba(30,50,36,.045);box-sizing:border-box}
    #${ROOT_ID} .zr-today-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
    #${ROOT_ID} .zr-today-title{font-size:16px;font-weight:900;color:#1f2a23;letter-spacing:-.3px}
    #${ROOT_ID} .zr-today-date{margin-top:3px;font-size:12px;color:#6d756f}
    #${ROOT_ID} .zr-today-statuses{display:flex;justify-content:flex-end;gap:6px;flex-wrap:wrap}
    #${ROOT_ID} .zr-today-status{padding:4px 7px;border-radius:999px;font-size:11px;font-weight:800;white-space:nowrap;background:#f3f5f3;color:#59625c}
    #${ROOT_ID} .zr-today-status.pending{background:#fff4de;color:#9a6200}
    #${ROOT_ID} .zr-today-status.confirmed{background:#eaf3fb;color:#2f6b9a}
    #${ROOT_ID} .zr-today-status.completed{background:#eaf4ee;color:#2f6b4f}
    #${ROOT_ID} .zr-today-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-bottom:12px}
    #${ROOT_ID} .zr-today-kpi{min-width:0;padding:10px 11px;border-radius:12px;background:#f6f8f6;border:1px solid #e7ebe7}
    #${ROOT_ID} .zr-today-kpi b{display:block;margin-top:3px;font-size:15px;color:#253129;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    #${ROOT_ID} .zr-today-kpi span{font-size:10.5px;font-weight:800;color:#778079}
    #${ROOT_ID} .zr-today-list{display:flex;flex-direction:column;gap:7px}
    #${ROOT_ID} .zr-today-row{display:grid;grid-template-columns:58px minmax(0,1fr) auto auto;align-items:center;gap:8px;padding:8px 9px;border:1px solid #e8ece8;border-radius:11px;background:#fff}
    #${ROOT_ID} .zr-today-time{font-size:12px;font-weight:900;color:#2f6b4f;text-align:center}
    #${ROOT_ID} .zr-today-org{min-width:0;font-size:12.5px;font-weight:900;color:#253129;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #${ROOT_ID} .zr-today-meta{font-size:11px;color:#6d756f;white-space:nowrap}
    #${ROOT_ID} .zr-today-detail{min-height:30px!important;padding:5px 9px!important;font-size:11px!important;white-space:nowrap}
    #${ROOT_ID} .zr-today-empty{padding:8px 2px 2px;color:#7b847d;font-size:12px}
    @media(max-width:760px){
      #${ROOT_ID}{padding:13px;margin-bottom:12px}
      #${ROOT_ID} .zr-today-head{display:block}
      #${ROOT_ID} .zr-today-statuses{justify-content:flex-start;margin-top:8px}
      #${ROOT_ID} .zr-today-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
      #${ROOT_ID} .zr-today-kpi:last-child{grid-column:1/-1}
      #${ROOT_ID} .zr-today-row{grid-template-columns:52px minmax(0,1fr) auto}
      #${ROOT_ID} .zr-today-meta{grid-column:2/3;white-space:normal}
      #${ROOT_ID} .zr-today-detail{grid-column:3/4;grid-row:1/3}
    }
  `;
  document.head.appendChild(s);
}
function ensureRoot(){
  const cal=document.getElementById('adminCalendar');
  if(!cal)return null;
  let root=document.getElementById(ROOT_ID);
  if(!root){root=document.createElement('section');root.id=ROOT_ID;root.setAttribute('aria-label','오늘 단체 요약')}
  if(root.parentElement!==cal.parentElement||root.nextElementSibling!==cal)cal.parentElement?.insertBefore(root,cal);
  return root;
}
function render(){
  injectStyle();
  const root=ensureRoot();if(!root)return;
  const date=seoulToday(),list=todayBookings();
  const pending=list.filter(b=>b.status==='pending').length;
  const completed=list.filter(isComplete).length;
  const confirmed=list.filter(b=>b.status==='confirmed'&&!isComplete(b)).length;
  const paid=list.reduce((sum,b)=>sum+num(b.paidCount),0);
  const entries=list.map(b=>b.entryTime).filter(validTime).sort();
  const exits=list.map(b=>b.exitTime).filter(validTime).sort();
  const meal=list.filter(isMeal).length;
  const play=list.filter(isPlayground).length;
  const statusChips=[
    pending?`<span class="zr-today-status pending">접수 ${pending}</span>`:'',
    confirmed?`<span class="zr-today-status confirmed">확정 ${confirmed}</span>`:'',
    completed?`<span class="zr-today-status completed">완료 ${completed}</span>`:''
  ].join('');
  const rows=list.map(b=>{
    const st=statusInfo(b);
    const extras=[isMeal(b)?'식사':'',isPlayground(b)?'놀이터':''].filter(Boolean).join(' · ');
    const meta=`유료 ${num(b.paidCount)}명${extras?` · ${extras}`:''} · ${st.label}`;
    return `<div class="zr-today-row">
      <div class="zr-today-time">${esc(b.entryTime||'--:--')}</div>
      <div class="zr-today-org" title="${esc(b.orgName||'-')}">${esc(b.orgName||'-')}</div>
      <div class="zr-today-meta">${esc(meta)}</div>
      <button type="button" class="btn-soft zr-today-detail" data-booking-id="${esc(b.id||'')}">자세히</button>
    </div>`;
  }).join('');
  root.innerHTML=`
    <div class="zr-today-head">
      <div><div class="zr-today-title">오늘 단체 요약</div><div class="zr-today-date">${esc(prettyDate(date))} 방문 기준</div></div>
      <div class="zr-today-statuses">${statusChips||'<span class="zr-today-status">예약 없음</span>'}</div>
    </div>
    <div class="zr-today-kpis">
      <div class="zr-today-kpi"><span>오늘 단체</span><b>${list.length}팀</b></div>
      <div class="zr-today-kpi"><span>예상 유료인원</span><b>${paid.toLocaleString('ko-KR')}명</b></div>
      <div class="zr-today-kpi"><span>첫 입장</span><b>${esc(entries[0]||'-')}</b></div>
      <div class="zr-today-kpi"><span>마지막 퇴장</span><b>${esc(exits.at(-1)||'-')}</b></div>
      <div class="zr-today-kpi"><span>이용 현황</span><b>식사 ${meal} · 놀이터 ${play}</b></div>
    </div>
    <div class="zr-today-list">${rows||'<div class="zr-today-empty">오늘 방문 예정 단체가 없습니다.</div>'}</div>
  `;
}
function scheduleRender(){
  if(patchQueued)return;
  patchQueued=true;
  requestAnimationFrame(()=>{patchQueued=false;render();attachCalendarObserver()});
}
function attachCalendarObserver(){
  const cal=document.getElementById('adminCalendar');
  if(!cal||cal===observedCalendar)return;
  calendarObserver?.disconnect();
  observedCalendar=cal;
  calendarObserver=new MutationObserver(()=>scheduleRender());
  calendarObserver.observe(cal,{childList:true,subtree:true});
}
function boot(){
  scheduleRender();
  attachCalendarObserver();
  document.addEventListener('zr:admin-runtime-ready',scheduleRender);
  document.addEventListener('click',e=>{
    const detail=e.target?.closest?.(`#${ROOT_ID} [data-booking-id]`);
    if(detail){
      const id=detail.dataset.bookingId||'';
      if(id&&typeof window.openAdminBookingDetail==='function')window.openAdminBookingDetail(id);
      return;
    }
    if(e.target?.closest?.('#adminView .admin-tabs button,#adminCalendar button'))setTimeout(scheduleRender,0);
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
