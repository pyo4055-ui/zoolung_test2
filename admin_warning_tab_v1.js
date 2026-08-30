(()=>{
'use strict';
if(window.__ZR_ADMIN_WARNING_TAB_V1)return;
window.__ZR_ADMIN_WARNING_TAB_V1=true;

const KEY='zr_bookings';
const PREP_DAYS=5;
const PAGE_SIZE=8;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const today=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const dayDiff=(from,to)=>{
  const a=new Date(String(from)+'T12:00:00'),b=new Date(String(to)+'T12:00:00');
  if(Number.isNaN(a.getTime())||Number.isNaN(b.getTime()))return null;
  return Math.round((b-a)/86400000);
};
let installed=false,filter='all',page=1,pollTimer=null,lastSig='';

function allBookings(){
  try{
    const list=typeof window.bookings==='function'?window.bookings():JSON.parse(localStorage.getItem(KEY)||'[]');
    return Array.isArray(list)?list.filter(b=>b&&!b.__availabilityOnly):[];
  }catch{return []}
}
function confirmedBookings(){
  return allBookings().filter(b=>String(b?.status||'')==='confirmed'&&String(b?.date||''));
}
function mealNeedsTime(b){
  return String(b?.mealType||'none')!=='none'&&(!String(b?.mealStart||'').trim()||!String(b?.mealEnd||'').trim());
}
function playNeedsTime(b){
  if(String(b?.playUse||'no')==='no')return false;
  const start=String(b?.playStart||'').trim();
  const end=String(b?.playEnd||'').trim();
  const duration=Number(b?.playDuration||0);
  return !start||(!end&&!duration);
}
function settlementDone(b){return !!String(b?.settlement?.savedAt||b?.settlementCompletedAt||'').trim()}
function issue(type,label,detail,severity='warn'){return {type,label,detail,severity}}
function issuesFor(b,now=today()){
  const diff=dayDiff(now,b.date);
  if(diff===null)return [];
  const out=[];
  if(diff<=-PREP_DAYS&&!settlementDone(b)){
    out.push(issue('settlement','정산/실결제 미처리',`방문일이 ${Math.abs(diff)}일 지났지만 실제결제가 저장되지 않았습니다.`,'danger'));
  }
  if(diff>=0&&diff<=PREP_DAYS){
    if(!b.schedulePublished)out.push(issue('schedule','스케줄 미확정',diff===0?'오늘 방문인데 최종 스케줄이 확정되지 않았습니다.':`방문 ${diff}일 전 · 최종 스케줄이 확정되지 않았습니다.`,diff<=1?'danger':'warn'));
    if(mealNeedsTime(b))out.push(issue('meal','식사시간 없음','식사 이용 예약인데 식사 시작/종료 시간이 완성되지 않았습니다.',diff<=1?'danger':'warn'));
    if(playNeedsTime(b))out.push(issue('play','놀이터시간 없음','놀이터 이용 예약인데 이용 시간이 완성되지 않았습니다.',diff<=1?'danger':'warn'));
  }
  return out;
}
function rows(){
  const now=today();
  return confirmedBookings().map(b=>({booking:b,issues:issuesFor(b,now)})).filter(x=>x.issues.length)
    .sort((a,b)=>String(a.booking.date).localeCompare(String(b.booking.date))||String(a.booking.entryTime||'99:99').localeCompare(String(b.booking.entryTime||'99:99'))||String(a.booking.orgName||'').localeCompare(String(b.booking.orgName||''),'ko'));
}
function filteredRows(list=rows()){
  if(filter==='all')return list;
  return list.map(x=>({...x,issues:x.issues.filter(i=>i.type===filter)})).filter(x=>x.issues.length);
}
function signature(){
  return JSON.stringify(confirmedBookings().map(b=>[
    b.id,b.status,b.date,b.entryTime,b.orgName,b.mealType,b.mealStart,b.mealEnd,b.playUse,b.playStart,b.playEnd,b.playDuration,
    b.schedulePublished,b.settlement?.savedAt,b.settlementCompletedAt
  ]));
}
function isOpen(){const sec=$('tab-warning');return !!sec&&!sec.classList.contains('hidden')}
function stopPoll(){if(pollTimer){clearInterval(pollTimer);pollTimer=null}}
function startPoll(){
  stopPoll();lastSig=signature();
  pollTimer=setInterval(()=>{
    if(!isOpen())return stopPoll();
    const sig=signature();if(sig!==lastSig)render();
  },1200);
}
function dateLabel(v){
  const d=new Date(String(v)+'T12:00:00');
  if(Number.isNaN(d.getTime()))return String(v||'-');
  const days=['일','월','화','수','목','금','토'];
  return `${d.getMonth()+1}/${d.getDate()}(${days[d.getDay()]})`;
}
function relativeLabel(v){
  const diff=dayDiff(today(),v);
  if(diff===null)return '';
  if(diff===0)return '오늘';
  if(diff===1)return '내일';
  if(diff>1)return `D-${diff}`;
  return `${Math.abs(diff)}일 지남`;
}
function severityRank(s){return s==='danger'?0:s==='warn'?1:2}
function issueHtml(i){
  return `<div class="zr-warning-issue ${esc(i.severity)}"><div><b>${esc(i.label)}</b><span>${esc(i.detail)}</span></div></div>`;
}
function cardHtml(row){
  const b=row.booking,issues=row.issues.slice().sort((a,z)=>severityRank(a.severity)-severityRank(z.severity));
  const paid=Number(b.paidCount||0),chap=Number(b.chaperoneCount||0),needsSettlement=issues.some(i=>i.type==='settlement');
  return `<article class="zr-warning-card" data-booking="${esc(b.id)}">
    <div class="zr-warning-date"><strong>${esc(dateLabel(b.date))}</strong><span>${esc(relativeLabel(b.date))}</span><small>${esc(b.entryTime||'--:--')} 입장</small></div>
    <div class="zr-warning-main">
      <div class="zr-warning-title"><b>${esc(b.orgName||'단체명 미입력')}</b><span>${issues.length}건 확인 필요</span></div>
      <div class="zr-warning-meta"><span>유료 ${paid}명</span><span>인솔 ${chap}명</span><span>총 ${paid+chap}명</span></div>
      <div class="zr-warning-issues">${issues.map(issueHtml).join('')}</div>
    </div>
    <div class="zr-warning-actions">${needsSettlement?`<button type="button" class="btn-primary" data-zr-warning-settlement="${esc(b.id)}">실제결제</button>`:''}<button type="button" class="btn-gray" data-zr-warning-detail="${esc(b.id)}">예약 자세히</button></div>
  </article>`;
}
function counts(list){
  const allIssues=list.flatMap(x=>x.issues);
  return {
    bookings:list.length,
    issues:allIssues.length,
    urgent:allIssues.filter(i=>i.severity==='danger').length,
    schedule:allIssues.filter(i=>i.type==='schedule').length,
    operation:allIssues.filter(i=>i.type==='meal'||i.type==='play').length,
    settlement:allIssues.filter(i=>i.type==='settlement').length
  };
}
function paginationHtml(totalPages){
  if(totalPages<=1)return '';
  let buttons=`<button type="button" class="btn-gray" data-zr-warning-page="prev" ${page<=1?'disabled':''}>‹ 이전</button>`;
  for(let n=1;n<=totalPages;n++)buttons+=`<button type="button" class="${n===page?'btn-primary':'btn-gray'}" data-zr-warning-page="${n}">${n}</button>`;
  buttons+=`<button type="button" class="btn-gray" data-zr-warning-page="next" ${page>=totalPages?'disabled':''}>다음 ›</button>`;
  return `<div class="zr-warning-page-info">${page} / ${totalPages} 페이지</div><div class="zr-warning-page-buttons">${buttons}</div>`;
}
function render(){
  const list=rows(),shown=filteredRows(list),c=counts(list);
  if($('zrWarningBookings'))$('zrWarningBookings').textContent=`${c.bookings}팀`;
  if($('zrWarningIssues'))$('zrWarningIssues').textContent=`${c.issues}건`;
  if($('zrWarningUrgent'))$('zrWarningUrgent').textContent=`${c.urgent}건`;
  if($('zrWarningSchedule'))$('zrWarningSchedule').textContent=`${c.schedule}건`;
  if($('zrWarningOperation'))$('zrWarningOperation').textContent=`${c.operation}건`;
  if($('zrWarningSettlement'))$('zrWarningSettlement').textContent=`${c.settlement}건`;
  const root=$('zrWarningList'),pager=$('zrWarningPagination');if(!root)return;
  const totalPages=Math.max(1,Math.ceil(shown.length/PAGE_SIZE));page=Math.min(Math.max(1,page),totalPages);
  const start=(page-1)*PAGE_SIZE,pageRows=shown.slice(start,start+PAGE_SIZE);
  root.innerHTML=pageRows.length?pageRows.map(cardHtml).join(''):`<div class="zr-warning-empty"><b>${filter==='all'?'현재 확인 필요한 경고가 없습니다.':'선택한 항목의 경고가 없습니다.'}</b><span>확정 예약의 기존 데이터만 계산해서 표시합니다.</span></div>`;
  if(pager)pager.innerHTML=shown.length?paginationHtml(totalPages):'';
  document.querySelectorAll('#zrWarningFilters button').forEach(btn=>btn.className=btn.dataset.zrWarningFilter===filter?'btn-primary':'btn-gray');
  lastSig=signature();
}
function setFilter(next){
  filter=String(next||'all');page=1;render();
}
function setPage(next){
  const shown=filteredRows(rows()),totalPages=Math.max(1,Math.ceil(shown.length/PAGE_SIZE));
  if(next==='prev')page=Math.max(1,page-1);
  else if(next==='next')page=Math.min(totalPages,page+1);
  else page=Math.min(totalPages,Math.max(1,Number(next)||1));
  render();
  $('tab-warning')?.scrollIntoView?.({block:'start',behavior:'smooth'});
}
function openSettlement(id){
  if(typeof window.zrOpenSettlementWorkspace==='function'){window.zrOpenSettlementWorkspace(id);return}
  try{window.toast?.('실제결제 입력창을 불러오는 중입니다. 잠시 후 다시 눌러주세요.')}catch{}
}
function openTab(){
  document.querySelectorAll('#adminView section[id^="tab-"]').forEach(s=>s.classList.add('hidden'));
  document.querySelectorAll('#adminView .admin-tabs button').forEach(b=>b.className='btn-gray');
  $('tab-warning')?.classList.remove('hidden');
  if($('zrWarningTabBtn'))$('zrWarningTabBtn').className='btn-primary';
  render();startPoll();
}
function installStyle(){
  if($('zrWarningStyleV1'))return;
  const s=document.createElement('style');s.id='zrWarningStyleV1';s.textContent=`
#tab-warning{--zw-green:#2f6b4f;--zw-soft:#eaf4ed;--zw-text:#1f2a23;--zw-muted:#6d756f;--zw-line:#dfe5df;--zw-red:#a94747;--zw-redsoft:#f9eaea;--zw-yellow:#fff7dc;--zw-blue:#eef5fb;--zw-shadow:0 6px 24px rgba(30,50,36,.07);margin-top:14px;color:var(--zw-text)}
#tab-warning .zr-warning-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:14px}#tab-warning h2{margin:0 0 5px;font-size:26px}#tab-warning .zr-warning-help{font-size:12px;color:var(--zw-muted);line-height:1.5}
#tab-warning .zr-warning-summary{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px;margin-bottom:12px}.zr-warning-metric{padding:13px;border:1px solid var(--zw-line);border-radius:14px;background:#fff;box-shadow:var(--zw-shadow)}.zr-warning-metric.em{background:var(--zw-soft);border-color:#cfe1d5}.zr-warning-metric.danger{background:var(--zw-redsoft);border-color:#e7c2c2}.zr-warning-metric label{display:block;font-size:10.5px;color:var(--zw-muted);font-weight:850;margin-bottom:5px}.zr-warning-metric strong{font-size:19px}
#tab-warning .zr-warning-filterbox{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:0 0 12px;padding:11px 12px;border:1px solid var(--zw-line);border-radius:13px;background:#fff}.zr-warning-filterbox b{font-size:12px}.zr-warning-filters{display:flex;gap:6px;flex-wrap:wrap}.zr-warning-filters button{min-height:34px;padding:7px 10px;margin:0;font-size:11px}
#tab-warning .zr-warning-list{display:grid;gap:9px}.zr-warning-card{display:grid;grid-template-columns:112px minmax(0,1fr) 126px;border:1px solid var(--zw-line);border-radius:15px;background:#fff;overflow:hidden;box-shadow:var(--zw-shadow)}.zr-warning-date{display:flex;flex-direction:column;justify-content:center;padding:14px;background:#f4f6f4;border-right:1px solid var(--zw-line)}.zr-warning-date strong{font-size:16px}.zr-warning-date span{margin-top:4px;font-size:11px;font-weight:900;color:var(--zw-red)}.zr-warning-date small{margin-top:6px;color:var(--zw-muted);font-size:10px}.zr-warning-main{padding:13px 14px}.zr-warning-title{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.zr-warning-title>b{font-size:15px}.zr-warning-title>span{font-size:10px;font-weight:900;color:var(--zw-red);background:var(--zw-redsoft);border:1px solid #e7c2c2;border-radius:999px;padding:4px 7px}.zr-warning-meta{display:flex;gap:8px;flex-wrap:wrap;margin:5px 0 8px;font-size:10.5px;color:var(--zw-muted)}
.zr-warning-issues{display:grid;gap:5px}.zr-warning-issue{padding:8px 9px;border-radius:9px;border:1px solid var(--zw-line);background:#fafbfa}.zr-warning-issue b{display:block;font-size:11px}.zr-warning-issue span{display:block;margin-top:2px;font-size:10px;line-height:1.45;color:#5d655f}.zr-warning-issue.danger{background:var(--zw-redsoft);border-color:#e7c2c2}.zr-warning-issue.danger b{color:var(--zw-red)}.zr-warning-issue.warn{background:var(--zw-yellow);border-color:#ead999}.zr-warning-issue.warn b{color:#806d22}.zr-warning-issue.info{background:var(--zw-blue);border-color:#d7e5f1}.zr-warning-issue.info b{color:#456a86}
.zr-warning-actions{display:flex;flex-direction:column;gap:7px;align-items:stretch;justify-content:center;padding:12px;border-left:1px solid #edf0ed}.zr-warning-actions button{width:100%;margin:0;white-space:nowrap}.zr-warning-empty{padding:36px 12px;border:1px dashed var(--zw-line);border-radius:14px;background:#fff;text-align:center;color:var(--zw-muted)}.zr-warning-empty b,.zr-warning-empty span{display:block}.zr-warning-empty span{margin-top:5px;font-size:11px}
.zr-warning-pagination{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:14px}.zr-warning-page-info{font-size:11px;font-weight:850;color:var(--zw-muted)}.zr-warning-page-buttons{display:flex;gap:5px;flex-wrap:wrap;justify-content:center}.zr-warning-page-buttons button{min-width:38px;min-height:34px;margin:0;padding:7px 9px}.zr-warning-page-buttons button:disabled{opacity:.45;cursor:not-allowed}
@media(max-width:1050px){#tab-warning .zr-warning-summary{grid-template-columns:repeat(3,1fr)}}@media(max-width:720px){#tab-warning .zr-warning-head{align-items:stretch;flex-direction:column}#tab-warning .zr-warning-summary{grid-template-columns:repeat(2,1fr)}.zr-warning-card{display:block}.zr-warning-date{flex-direction:row;align-items:center;gap:9px;justify-content:flex-start;border-right:0;border-bottom:1px solid var(--zw-line)}.zr-warning-date span,.zr-warning-date small{margin:0}.zr-warning-actions{flex-direction:row;border-left:0;border-top:1px solid #edf0ed}.zr-warning-actions button{width:auto;flex:1 1 0}.zr-warning-pagination{align-items:stretch;flex-direction:column}.zr-warning-page-info{text-align:center}}
`;document.head.appendChild(s);
}
function ensureUi(){
  if(installed)return true;
  const tabs=document.querySelector('#adminView .admin-tabs'),admin=$('adminView');
  if(!tabs||!admin)return false;
  installStyle();
  let btn=$('zrWarningTabBtn');
  if(!btn){
    btn=document.createElement('button');btn.id='zrWarningTabBtn';btn.className='btn-gray';btn.textContent='경고';
    const todayBtn=$('zrTodayTabBtn');tabs.insertBefore(btn,todayBtn?.nextSibling||tabs.firstChild);
  }
  let sec=$('tab-warning');
  if(!sec){
    sec=document.createElement('section');sec.id='tab-warning';sec.className='hidden';
    sec.innerHTML=`<div class="zr-warning-head"><div><h2>경고</h2><div class="zr-warning-help">방문 5일 전부터 준비 항목을 확인하고, 방문 후 5일이 지난 확정 예약은 실제결제 누락을 표시합니다.<br>별도 경고 데이터는 저장하지 않습니다.</div></div><button type="button" class="btn-soft" id="zrWarningRefresh">새로고침</button></div>
      <div class="zr-warning-summary">
        <div class="zr-warning-metric em"><label>확인 필요한 단체</label><strong id="zrWarningBookings">0팀</strong></div>
        <div class="zr-warning-metric"><label>전체 경고</label><strong id="zrWarningIssues">0건</strong></div>
        <div class="zr-warning-metric danger"><label>긴급</label><strong id="zrWarningUrgent">0건</strong></div>
        <div class="zr-warning-metric"><label>스케줄</label><strong id="zrWarningSchedule">0건</strong></div>
        <div class="zr-warning-metric"><label>식사/놀이터</label><strong id="zrWarningOperation">0건</strong></div>
        <div class="zr-warning-metric"><label>정산/실결제</label><strong id="zrWarningSettlement">0건</strong></div>
      </div>
      <div class="zr-warning-filterbox"><b>경고 종류</b><div class="zr-warning-filters" id="zrWarningFilters">
        <button type="button" class="btn-primary" data-zr-warning-filter="all">전체</button>
        <button type="button" class="btn-gray" data-zr-warning-filter="schedule">스케줄</button>
        <button type="button" class="btn-gray" data-zr-warning-filter="meal">식사</button>
        <button type="button" class="btn-gray" data-zr-warning-filter="play">놀이터</button>
        <button type="button" class="btn-gray" data-zr-warning-filter="settlement">정산/실결제</button>
      </div></div>
      <div class="zr-warning-list" id="zrWarningList"></div>
      <div class="zr-warning-pagination" id="zrWarningPagination"></div>`;
    admin.appendChild(sec);
  }
  btn.onclick=openTab;
  $('zrWarningRefresh').onclick=()=>{page=1;render()};
  $('zrWarningFilters').onclick=e=>{const b=e.target?.closest?.('[data-zr-warning-filter]');if(b)setFilter(b.dataset.zrWarningFilter)};
  $('zrWarningPagination').onclick=e=>{const b=e.target?.closest?.('[data-zr-warning-page]');if(b&&!b.disabled)setPage(b.dataset.zrWarningPage)};
  $('zrWarningList').onclick=e=>{
    const pay=e.target?.closest?.('[data-zr-warning-settlement]');
    if(pay){openSettlement(pay.dataset.zrWarningSettlement);return}
    const b=e.target?.closest?.('[data-zr-warning-detail]');if(!b)return;
    const id=b.dataset.zrWarningDetail;
    if(typeof window.openAdminBookingDetail==='function')window.openAdminBookingDetail(id);
    else if(typeof globalThis.openAdminBookingDetail==='function')globalThis.openAdminBookingDetail(id);
  };
  installed=true;render();return true;
}
function boot(){
  if(ensureUi())return;
  let tries=0;const timer=setInterval(()=>{if(ensureUi()||++tries>40)clearInterval(timer)},250);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
