(()=>{
'use strict';
if(window.__ZR_ADMIN_TODAY_TAB_V1)return;
window.__ZR_ADMIN_TODAY_TAB_V1=true;

const FV='12.17.1';
const STAFF_EMAIL='zoolung09@zoolungzoolung.com';
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const today=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const shift=(s,n)=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const COLORS={f4:'#f8d7bf',f5:'#cfe7f7',meal:'#fff0a8',play:'#d8efc9',free:'#edf0ed'};
const LABELS={f4:'4F 베이직',f5:'5F 워터가든',meal:'식사',play:'놀이터',free:'자율관람'};
const VIEW_FIELDS=['customerViewedParkingAt','customerViewedGuideMapAt','customerViewedScheduleAt'];
let installed=false,date=today(),FS=null,db=null,unsub=null,remote=new Map(),pollTimer=null,lastBookingSig='',tabsObserver=null;

function allBookings(){
  try{return typeof window.bookings==='function'?window.bookings():JSON.parse(localStorage.getItem('zr_bookings')||'[]')}
  catch{return[]}
}
function rowsForDate(){
  return allBookings().filter(b=>b&&!b.__availabilityOnly&&String(b.status||'')==='confirmed'&&String(b.date||'')===date)
    .sort((a,b)=>String(a.entryTime||'99:99').localeCompare(String(b.entryTime||'99:99'))||String(a.orgName||'').localeCompare(String(b.orgName||''),'ko'));
}
function previewCount(d){
  try{if(typeof window.zrPreviewVisitConfirmedByDate==='function')return Number(window.zrPreviewVisitConfirmedByDate(d)||0)}catch{}
  try{
    const list=JSON.parse(localStorage.getItem('zr_inquiries')||'[]');
    return (Array.isArray(list)?list:[]).filter(x=>{const text=String(x?.content??x?.message??x?.inquiry??x?.text??'');return text.startsWith('[사전답사 확정]')&&text.includes(`방문 희망일: ${d}`)}).length;
  }catch{return 0}
}
function mealText(b){return ({lunchbox:'도시락',cafe:'카페 주문',none:'식사 없음'})[b?.mealType]||'식사 없음'}
function endFromDuration(start,duration){
  if(!start||!Number(duration))return'';const [h,m]=String(start).split(':').map(Number);if(!Number.isFinite(h)||!Number.isFinite(m))return'';const total=h*60+m+Number(duration);return `${pad(Math.floor(total/60))}:${pad(total%60)}`;
}
function playText(b){
  if(String(b?.playUse||'no')==='no')return'이용 안 함';
  const s=String(b?.playStart||''),e=String(b?.playEnd||'')||endFromDuration(s,b?.playDuration);
  return s?(e?`${s}~${e}`:s):'시간 미정';
}
function cafeItems(b){return Array.isArray(b?.cafe?.items)?b.cafe.items.filter(x=>x&&String(x.name||'').trim()&&Number(x.qty||0)>0):[]}
function groupType(b){return String(b?.groupType||b?.organizationType||b?.orgType||'').trim()}
function viewed(b,key){return !!String(b?.[key]||'').trim()}
function viewAll(b){return VIEW_FIELDS.every(k=>viewed(b,k))}
function segmentName(s){return String(s?.label||LABELS[s?.type]||s?.type||'컨텐츠')}
function segmentColor(s){const c=String(s?.color||COLORS[s?.type]||'#edf0ed');return /^#[0-9a-f]{6}$/i.test(c)?c:'#edf0ed'}
function scheduleSegments(b){
  const d=remote.get(String(b?.id||''));
  const list=Array.isArray(d?.segments)?d.segments:Array.isArray(b?.customerSchedule?.segments)?b.customerSchedule.segments:[];
  return list.filter(s=>s?.start&&s?.end).slice().sort((a,z)=>String(a.start).localeCompare(String(z.start)));
}
function bookingSignature(rows){
  return JSON.stringify(rows.map(b=>[b.id,b.status,b.date,b.entryTime,b.exitTime,b.paidCount,b.chaperoneCount,b.mealType,b.mealStart,b.mealEnd,b.playUse,b.playStart,b.playEnd,b.playDuration,b.notes,b.schedulePublished,b.customerViewedParkingAt,b.customerViewedGuideMapAt,b.customerViewedScheduleAt,b.cafe?.items]));
}
function isStaff(){const u=window.zrReservationFirebase?.auth?.currentUser;return !!u&&String(u.email||'').toLowerCase()===STAFF_EMAIL.toLowerCase()}
function stopSchedule(){if(unsub){unsub();unsub=null}remote=new Map()}
function stopPoll(){if(pollTimer){clearInterval(pollTimer);pollTimer=null}}
function isOpen(){const sec=$('tab-today');return !!sec&&!sec.classList.contains('hidden')}
async function ensureFirebase(){
  if(FS&&db)return true;
  const z=window.zrReservationFirebase;if(!z?.db)return false;
  try{FS=await import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`);db=z.db;return true}catch(e){console.debug('today firebase',e);return false}
}
async function listenSchedule(){
  stopSchedule();if(!isOpen())return;
  if(!(await ensureFirebase())||!isStaff()){renderStatus('스케줄 DB 연결 대기','wait');return}
  renderStatus('스케줄 불러오는 중','wait');
  try{
    const q=FS.query(FS.collection(db,'scheduleGroups'),FS.where('date','==',date));
    unsub=FS.onSnapshot(q,s=>{
      remote=new Map(s.docs.filter(d=>d.id!=='__content_catalog__').map(d=>[d.id,{id:d.id,...d.data()}]));
      renderStatus('스케줄 실시간 연결','ok');render();
    },e=>{console.error('today schedule read',e);renderStatus('스케줄 연결 확인 필요','err')});
  }catch(e){console.error('today schedule listen',e);renderStatus('스케줄 연결 확인 필요','err')}
}
function renderStatus(text,state='wait'){
  const el=$('zrTodayDbStatus');if(!el)return;el.textContent='● '+text;el.className='zr-today-db '+state;
}
function formatDateTitle(v){
  const d=new Date(v+'T12:00:00');if(Number.isNaN(d.getTime()))return v;
  const days=['일','월','화','수','목','금','토'];return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 ${days[d.getDay()]}요일 · 운영 현황`;
}
function countSummary(rows){
  const meals=rows.filter(b=>String(b.mealType||'none')!=='none');
  return {
    teams:rows.length,people:rows.reduce((s,b)=>s+Number(b.paidCount||0)+Number(b.chaperoneCount||0),0),
    meals:meals.length,lunchbox:meals.filter(b=>b.mealType==='lunchbox').length,cafe:meals.filter(b=>b.mealType==='cafe').length,
    play:rows.filter(b=>String(b.playUse||'no')!=='no').length,viewed:rows.filter(viewAll).length,preview:previewCount(date)
  };
}
function renderMetrics(rows){
  const x=countSummary(rows);
  $('zrTodayTeams').textContent=`${x.teams}팀`;$('zrTodayTeamSub').textContent=`사전답사 ${x.preview}건 별도`;
  $('zrTodayPeople').textContent=`${x.people}명`;$('zrTodayMeal').textContent=`${x.meals}팀`;$('zrTodayMealSub').textContent=`도시락 ${x.lunchbox} · 카페 ${x.cafe}`;
  $('zrTodayPlay').textContent=`${x.play}팀`;$('zrTodayViewed').textContent=`${x.viewed}/${x.teams}팀`;
}
function alertChip(text,kind){return `<span class="zr-today-chip ${kind}">${esc(text)}</span>`}
function renderAlerts(rows){
  const parking=rows.filter(b=>!viewed(b,'customerViewedParkingAt')).length;
  const map=rows.filter(b=>!viewed(b,'customerViewedGuideMapAt')).length;
  const unpublished=rows.filter(b=>!b.schedulePublished).length;
  const sched=rows.filter(b=>b.schedulePublished&&!viewed(b,'customerViewedScheduleAt')).length;
  const out=[];
  if(parking)out.push(alertChip(`주차안내 미확인 ${parking}팀`,'danger'));
  if(map)out.push(alertChip(`가이드맵 미확인 ${map}팀`,'warn'));
  if(unpublished)out.push(alertChip(`스케줄 미확정 ${unpublished}팀`,'warn'));
  if(sched)out.push(alertChip(`최종 스케줄 미확인 ${sched}팀`,'danger'));
  if(!out.length)out.push(alertChip('확인 필요한 항목 없음','ok'));
  $('zrTodayAlerts').innerHTML=out.join('');
}
function stateRow(label,ok){return `<div class="zr-today-check"><b>${esc(label)}</b><span class="${ok?'ok':'no'}">${ok?'확인':'미확인'}</span></div>`}
function scheduleBars(b){
  const segs=scheduleSegments(b);
  if(!segs.length)return '<div class="zr-today-schedule-empty">스케줄이 아직 반영되지 않았습니다.</div>';
  return `<div class="zr-today-schedule-bars">${segs.map(s=>`<div class="zr-today-schedule-seg" style="background:${esc(segmentColor(s))}" title="${esc(segmentName(s)+' '+s.start+'~'+s.end)}"><b>${esc(segmentName(s))}</b><span>${esc(s.start)}~${esc(s.end)}</span></div>`).join('')}</div>`;
}
function cardHtml(b){
  const paid=Number(b.paidCount||0),chap=Number(b.chaperoneCount||0),all=viewAll(b),items=cafeItems(b),type=groupType(b);
  const meal=mealText(b),mealTime=b.mealStart?(b.mealEnd?`${b.mealStart}~${b.mealEnd}`:b.mealStart):'';
  const note=String(b.notes||'').trim()||'없음';
  const cafe=items.length?`<div class="zr-today-cafe"><div class="zr-today-cafe-title">카페 주문</div><div class="zr-today-cafe-items">${items.map(x=>`<span>${esc(x.name)} × ${Number(x.qty||0)}</span>`).join('')}</div></div>`:'';
  return `<article class="zr-today-team-card" data-booking="${esc(b.id)}">
    <div class="zr-today-time"><strong>${esc(b.entryTime||'--:--')}</strong><span>${esc(b.exitTime||'--:--')} 퇴장</span></div>
    <div class="zr-today-main"><div class="zr-today-name-row"><span class="zr-today-org">${esc(b.orgName||'단체명 미입력')}</span><span class="zr-today-badge confirmed">예약 확정</span><span class="zr-today-badge ${all?'confirmed':'pending'}">${all?'고객 확인 완료':'고객 확인 필요'}</span></div><div class="zr-today-meta">${type?`<span>${esc(type)}</span>`:''}<span>유료 ${paid}명</span><span>인솔 ${chap}명</span><span>총 ${paid+chap}명</span></div><div class="zr-today-note"><b>특이사항</b> · ${esc(note)}</div>${cafe}</div>
    <div class="zr-today-program"><div class="zr-today-label">운영 정보</div><div class="zr-today-program-grid"><div><b>식사</b><span>${esc(meal)}${mealTime?` · ${esc(mealTime)}`:''}</span></div><div><b>놀이터</b><span>${esc(playText(b))}</span></div><div><b>입장 / 퇴장</b><span>${esc(b.entryTime||'--:--')} ~ ${esc(b.exitTime||'--:--')}</span></div><div><b>스케줄 확정</b><span class="${b.schedulePublished?'ok':'wait'}">${b.schedulePublished?'확정 완료':'확인 필요'}</span></div></div></div>
    <div class="zr-today-views"><div class="zr-today-label">고객 열람 확인</div><div class="zr-today-check-grid">${stateRow('주차 및 인솔 안내',viewed(b,'customerViewedParkingAt'))}${stateRow('가이드맵',viewed(b,'customerViewedGuideMapAt'))}${stateRow('최종 스케줄',viewed(b,'customerViewedScheduleAt'))}</div></div>
    <div class="zr-today-schedule"><div class="zr-today-schedule-title"><b>당일 스케줄</b><span>스케줄 관리 · 현장스케줄과 동일 데이터</span></div>${scheduleBars(b)}</div>
  </article>`;
}
function render(){
  const list=$('zrTodayList');if(!list)return;
  const rows=rowsForDate();
  $('zrTodayDateTitle').textContent=formatDateTitle(date);$('zrTodayDate').value=date;
  renderMetrics(rows);renderAlerts(rows);
  const sec=$('tab-today');if(sec)sec.dataset.teamCount=String(rows.length);
  list.innerHTML=rows.length?rows.map(cardHtml).join(''):'<div class="zr-today-empty"><b>이 날짜에 확정 단체가 없습니다.</b><span>다른 날짜를 선택해 운영 현황을 확인할 수 있습니다.</span></div>';
  lastBookingSig=bookingSignature(rows);
}
function startPoll(){
  stopPoll();lastBookingSig=bookingSignature(rowsForDate());
  pollTimer=setInterval(()=>{if(!isOpen())return stopPoll();const sig=bookingSignature(rowsForDate());if(sig!==lastBookingSig)render()},1000);
}
function bindOtherTab(btn){
  if(!btn||btn.id==='zrTodayTabBtn'||btn.dataset.zrTodayHideHook==='1')return;
  btn.dataset.zrTodayHideHook='1';btn.addEventListener('click',()=>{const sec=$('tab-today');if(sec)sec.classList.add('hidden');stopSchedule();stopPoll()});
}
function bindTabsRoot(tabs){
  tabs.querySelectorAll('button').forEach(bindOtherTab);
  if(tabs.dataset.zrTodayTabsObserved==='1')return;
  tabs.dataset.zrTodayTabsObserved='1';
  tabsObserver=new MutationObserver(()=>tabs.querySelectorAll('button').forEach(bindOtherTab));
  tabsObserver.observe(tabs,{childList:true});
}
function openTab(){
  document.querySelectorAll('#adminView section[id^="tab-"]').forEach(s=>s.classList.add('hidden'));
  document.querySelectorAll('#adminView .admin-tabs button').forEach(b=>b.className='btn-gray');
  $('tab-today')?.classList.remove('hidden');if($('zrTodayTabBtn'))$('zrTodayTabBtn').className='btn-primary';
  $('zrTodayDate').value=date;render();listenSchedule();startPoll();
}
function setDate(v){if(!v)return;date=v;render();if(isOpen())listenSchedule()}
function preparePrint(){
  const rows=rowsForDate();const sec=$('tab-today');if(sec)sec.dataset.teamCount=String(rows.length);
  document.body.classList.add('zr-today-printing');setTimeout(()=>window.print(),30);
}
function installStyle(){
  if($('zrTodayStyleV1'))return;const s=document.createElement('style');s.id='zrTodayStyleV1';s.textContent=`
#tab-today{--zt-green:#2f6b4f;--zt-soft:#eaf4ed;--zt-text:#1f2a23;--zt-muted:#6d756f;--zt-line:#dfe5df;--zt-red:#a94747;--zt-redsoft:#f9eaea;--zt-yellow:#fff7dc;--zt-shadow:0 6px 24px rgba(30,50,36,.07);margin-top:14px}
#tab-today .zr-today-shell{color:var(--zt-text)}#tab-today .zr-today-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:14px}#tab-today .zr-today-head h2{margin:0 0 5px;font-size:26px}#tab-today .zr-today-date-title{font-size:13px;color:var(--zt-muted)}#tab-today .zr-today-tools{display:flex;gap:7px;align-items:center;flex-wrap:wrap}#tab-today .zr-today-tools input{width:auto;min-width:145px;height:42px;margin:0}#tab-today .zr-today-tools button{min-height:42px;margin:0}
#tab-today .zr-today-db{font-size:11px;font-weight:850;padding:6px 9px;border-radius:999px;background:#f2f4f2;border:1px solid var(--zt-line);color:var(--zt-muted)}#tab-today .zr-today-db.ok{background:#e9f3ed;color:#2f6b4f;border-color:#c6decf}#tab-today .zr-today-db.err{background:#fbecec;color:#a33b3b;border-color:#e8c6c6}
#tab-today .zr-today-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin-bottom:11px}#tab-today .zr-today-metric{border:1px solid var(--zt-line);border-radius:14px;background:#fff;padding:14px;min-height:88px;box-shadow:var(--zt-shadow)}#tab-today .zr-today-metric.em{background:var(--zt-soft);border-color:#cfe1d5}#tab-today .zr-today-metric label{display:block;font-size:11px;color:var(--zt-muted);font-weight:850;margin-bottom:5px}#tab-today .zr-today-metric strong{display:block;font-size:21px}#tab-today .zr-today-metric small{display:block;font-size:10px;color:var(--zt-muted);margin-top:4px;line-height:1.35}
#tab-today .zr-today-alertbox{border:1px solid var(--zt-line);border-radius:14px;background:#fff;padding:12px 14px;box-shadow:var(--zt-shadow);margin-bottom:15px}#tab-today .zr-today-alert-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}#tab-today .zr-today-alert-head b{font-size:14px}#tab-today .zr-today-alert-head span{font-size:11px;color:var(--zt-muted)}#tab-today .zr-today-alerts{display:flex;gap:7px;flex-wrap:wrap}.zr-today-chip{display:inline-flex;padding:6px 9px;border-radius:999px;font-size:11px;font-weight:900;border:1px solid}.zr-today-chip.warn{background:var(--zt-yellow);border-color:#ead999;color:#806d22}.zr-today-chip.danger{background:var(--zt-redsoft);border-color:#e7c2c2;color:var(--zt-red)}.zr-today-chip.ok{background:var(--zt-soft);border-color:#cfe1d5;color:var(--zt-green)}
#tab-today .zr-today-list-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 9px}#tab-today .zr-today-list-head h3{margin:0;font-size:17px}#tab-today .zr-today-list-head span{font-size:11px;color:var(--zt-muted)}#tab-today .zr-today-list{display:grid;gap:10px}
#tab-today .zr-today-team-card{display:grid;grid-template-columns:102px minmax(0,1.28fr) minmax(260px,1fr) minmax(230px,.9fr);border:1px solid var(--zt-line);border-radius:16px;background:#fff;overflow:hidden;box-shadow:var(--zt-shadow)}#tab-today .zr-today-time{display:flex;flex-direction:column;justify-content:center;padding:16px 13px;background:#f0f4f1;border-right:1px solid var(--zt-line)}#tab-today .zr-today-time strong{font-size:20px}#tab-today .zr-today-time span{font-size:11px;color:var(--zt-muted);margin-top:5px}#tab-today .zr-today-main,#tab-today .zr-today-program,#tab-today .zr-today-views{padding:14px}#tab-today .zr-today-main,#tab-today .zr-today-program{border-right:1px solid #edf0ed}
#tab-today .zr-today-name-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px}#tab-today .zr-today-org{font-size:16px;font-weight:900}.zr-today-badge{display:inline-flex;padding:4px 7px;border-radius:999px;font-size:10px;font-weight:900;border:1px solid}.zr-today-badge.confirmed{background:var(--zt-soft);border-color:#cfe1d5;color:var(--zt-green)}.zr-today-badge.pending{background:var(--zt-yellow);border-color:#ead999;color:#806d22}#tab-today .zr-today-meta{display:flex;gap:8px;flex-wrap:wrap;font-size:12px;color:#4e5651;line-height:1.5}#tab-today .zr-today-note{margin-top:8px;padding:7px 9px;border:1px dashed #d7ddd8;border-radius:9px;background:#fafbf9;font-size:11px;color:#5d655f;white-space:pre-wrap;line-height:1.45}
#tab-today .zr-today-cafe{margin-top:7px;padding:8px 9px;border:1px solid #ead8aa;border-radius:9px;background:#fff8e8}.zr-today-cafe-title{font-size:10px;font-weight:900;color:#7c6824;margin-bottom:5px}.zr-today-cafe-items{display:flex;gap:5px;flex-wrap:wrap}.zr-today-cafe-items span{padding:4px 7px;border:1px solid #ead8aa;border-radius:999px;background:#fff;font-size:10px;font-weight:850;color:#66551e}
#tab-today .zr-today-label{font-size:10px;color:var(--zt-muted);font-weight:900;margin-bottom:6px}#tab-today .zr-today-program-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}#tab-today .zr-today-program-grid>div{padding:8px 9px;border:1px solid #e7ebe7;border-radius:9px;background:#f8f9f7;min-width:0}#tab-today .zr-today-program-grid b{display:block;font-size:10px;margin-bottom:2px}#tab-today .zr-today-program-grid span{display:block;font-size:10.5px;color:#59615c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#tab-today .zr-today-program-grid .ok{color:var(--zt-green);font-weight:900}#tab-today .zr-today-program-grid .wait{color:#8b7727;font-weight:900}
#tab-today .zr-today-check-grid{display:grid;gap:6px}.zr-today-check{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 8px;border:1px solid var(--zt-line);border-radius:9px;font-size:10.5px}.zr-today-check b{font-size:10.5px}.zr-today-check span{font-weight:900}.zr-today-check .ok{color:var(--zt-green)}.zr-today-check .no{color:var(--zt-red)}
#tab-today .zr-today-schedule{grid-column:1/-1;padding:10px 13px 12px;border-top:1px solid #edf0ed;background:#fbfcfa}.zr-today-schedule-title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}.zr-today-schedule-title b{font-size:11px}.zr-today-schedule-title span{font-size:9.5px;color:var(--zt-muted)}.zr-today-schedule-bars{display:flex;gap:6px;align-items:stretch;overflow-x:auto;padding-bottom:1px}.zr-today-schedule-seg{flex:1 0 150px;min-width:150px;display:flex;align-items:center;justify-content:space-between;gap:9px;padding:8px 10px;border:1px solid rgba(0,0,0,.05);border-radius:9px}.zr-today-schedule-seg b{font-size:10.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.zr-today-schedule-seg span{font-size:10px;font-weight:850;white-space:nowrap}.zr-today-schedule-empty{padding:9px 10px;border:1px dashed var(--zt-line);border-radius:9px;background:#f5f6f5;color:var(--zt-muted);font-size:10.5px;text-align:center}.zr-today-empty{padding:36px 12px;border:1px dashed var(--zt-line);border-radius:14px;background:#fff;text-align:center;color:var(--zt-muted)}.zr-today-empty b,.zr-today-empty span{display:block}.zr-today-empty span{margin-top:5px;font-size:11px}
@media(max-width:1050px){#tab-today .zr-today-summary{grid-template-columns:repeat(3,1fr)}#tab-today .zr-today-team-card{grid-template-columns:90px 1fr 1fr}#tab-today .zr-today-views{grid-column:2/4;border-top:1px solid #edf0ed}#tab-today .zr-today-program{border-right:0}}
@media(max-width:720px){#tab-today .zr-today-head{align-items:stretch;flex-direction:column}#tab-today .zr-today-summary{grid-template-columns:repeat(2,1fr)}#tab-today .zr-today-metric:last-child{grid-column:1/-1}#tab-today .zr-today-team-card{display:block}#tab-today .zr-today-time{padding:11px 13px;flex-direction:row;align-items:center;justify-content:space-between;border-right:0;border-bottom:1px solid var(--zt-line)}#tab-today .zr-today-time strong{font-size:17px}#tab-today .zr-today-time span{margin:0}#tab-today .zr-today-main,#tab-today .zr-today-program{border-right:0;border-bottom:1px solid #edf0ed}.zr-today-schedule-seg{flex-basis:140px;min-width:140px}}
@media print{
 @page{size:A4 landscape;margin:8mm}
 body.zr-today-printing{background:#fff!important}
 body.zr-today-printing> *:not(#adminView){display:none!important}
 body.zr-today-printing #adminView{display:block!important;margin:0!important;padding:0!important;max-width:none!important;width:auto!important}
 body.zr-today-printing #adminView> *:not(#tab-today){display:none!important}
 body.zr-today-printing #tab-today{display:block!important;margin:0!important;padding:0!important}
 body.zr-today-printing #tab-today .zr-today-tools,body.zr-today-printing #tab-today .zr-today-db,body.zr-today-printing #tab-today .zr-today-alertbox{display:none!important}
 body.zr-today-printing #tab-today .zr-today-shell{width:281mm!important;margin:0!important}
 body.zr-today-printing #tab-today .zr-today-head{margin:0 0 3mm!important}
 body.zr-today-printing #tab-today .zr-today-head h2{font-size:16pt!important;margin-bottom:1mm!important}
 body.zr-today-printing #tab-today .zr-today-date-title{font-size:7.5pt!important}
 body.zr-today-printing #tab-today .zr-today-summary{grid-template-columns:repeat(5,1fr)!important;gap:2mm!important;margin-bottom:2.5mm!important}
 body.zr-today-printing #tab-today .zr-today-metric{box-shadow:none!important;min-height:0!important;padding:2.4mm!important;border-radius:2.5mm!important}
 body.zr-today-printing #tab-today .zr-today-metric label{font-size:6pt!important;margin-bottom:.8mm!important}body.zr-today-printing #tab-today .zr-today-metric strong{font-size:12pt!important}body.zr-today-printing #tab-today .zr-today-metric small{font-size:5.5pt!important;margin-top:.6mm!important}
 body.zr-today-printing #tab-today .zr-today-list-head{margin:0 0 1.5mm!important}body.zr-today-printing #tab-today .zr-today-list-head h3{font-size:9pt!important}body.zr-today-printing #tab-today .zr-today-list-head span{font-size:5.5pt!important}
 body.zr-today-printing #tab-today .zr-today-list{gap:1.5mm!important}
 body.zr-today-printing #tab-today .zr-today-team-card{grid-template-columns:20mm minmax(0,1.3fr) minmax(48mm,1fr) minmax(43mm,.9fr)!important;border-radius:2.5mm!important;box-shadow:none!important;break-inside:avoid!important;page-break-inside:avoid!important}
 body.zr-today-printing #tab-today .zr-today-time{padding:2mm!important}body.zr-today-printing #tab-today .zr-today-time strong{font-size:10pt!important}body.zr-today-printing #tab-today .zr-today-time span{font-size:5.5pt!important;margin-top:1mm!important}
 body.zr-today-printing #tab-today .zr-today-main,body.zr-today-printing #tab-today .zr-today-program,body.zr-today-printing #tab-today .zr-today-views{padding:2mm!important}
 body.zr-today-printing #tab-today .zr-today-org{font-size:8pt!important}.zr-today-badge{font-size:5pt!important;padding:1mm 1.4mm!important}body.zr-today-printing #tab-today .zr-today-meta{font-size:5.7pt!important;gap:1.5mm!important}body.zr-today-printing #tab-today .zr-today-note{font-size:5.4pt!important;margin-top:1.2mm!important;padding:1.2mm 1.5mm!important;max-height:9mm!important;overflow:hidden!important}
 body.zr-today-printing #tab-today .zr-today-cafe{margin-top:1mm!important;padding:1.2mm 1.5mm!important}.zr-today-cafe-title{font-size:5pt!important;margin-bottom:.8mm!important}.zr-today-cafe-items{gap:.8mm!important}.zr-today-cafe-items span{font-size:5pt!important;padding:.7mm 1.1mm!important}
 body.zr-today-printing #tab-today .zr-today-label{font-size:5pt!important;margin-bottom:1mm!important}body.zr-today-printing #tab-today .zr-today-program-grid{gap:1mm!important}body.zr-today-printing #tab-today .zr-today-program-grid>div{padding:1.2mm!important;border-radius:1.5mm!important}body.zr-today-printing #tab-today .zr-today-program-grid b{font-size:5pt!important}body.zr-today-printing #tab-today .zr-today-program-grid span{font-size:5.2pt!important}.zr-today-check-grid{gap:1mm!important}.zr-today-check{padding:1.1mm!important;border-radius:1.5mm!important}.zr-today-check b,.zr-today-check span{font-size:5.2pt!important}
 body.zr-today-printing #tab-today .zr-today-schedule{padding:1.4mm 2mm 1.7mm!important}.zr-today-schedule-title{margin-bottom:1mm!important}.zr-today-schedule-title b{font-size:5.5pt!important}.zr-today-schedule-title span{font-size:4.8pt!important}.zr-today-schedule-bars{gap:1mm!important;overflow:hidden!important}.zr-today-schedule-seg{min-width:0!important;flex:1 1 0!important;padding:1.3mm!important;border-radius:1.5mm!important}.zr-today-schedule-seg b{font-size:5.3pt!important}.zr-today-schedule-seg span{font-size:4.9pt!important}.zr-today-schedule-empty{font-size:5.2pt!important;padding:1.5mm!important}
 body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-summary{margin-bottom:1.7mm!important}body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-metric{padding:1.9mm!important}body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-list{gap:1mm!important}body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-main,body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-program,body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-views{padding:1.6mm!important}body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-schedule{padding-top:1mm!important;padding-bottom:1.2mm!important}
}
`;document.head.appendChild(s)
}
function ensureUi(){
  if(installed)return true;const tabs=document.querySelector('#adminView .admin-tabs'),admin=$('adminView');if(!tabs||!admin)return false;
  installStyle();let btn=$('zrTodayTabBtn');if(!btn){btn=document.createElement('button');btn.id='zrTodayTabBtn';btn.className='btn-gray';btn.textContent='Today';tabs.insertBefore(btn,tabs.firstChild)}
  let sec=$('tab-today');if(!sec){sec=document.createElement('section');sec.id='tab-today';sec.className='hidden';sec.innerHTML=`<div class="zr-today-shell"><div class="zr-today-head"><div><h2>Today</h2><div class="zr-today-date-title" id="zrTodayDateTitle"></div></div><div class="zr-today-tools"><span class="zr-today-db wait" id="zrTodayDbStatus">● 스케줄 DB 연결 대기</span><button type="button" class="btn-gray" id="zrTodayPrev">‹ 이전날</button><input type="date" id="zrTodayDate"><button type="button" class="btn-gray" id="zrTodayNext">다음날 ›</button><button type="button" class="btn-soft" id="zrTodayNow">오늘</button><button type="button" class="btn-primary" id="zrTodayPrint">인쇄하기</button></div></div><div class="zr-today-summary"><div class="zr-today-metric em"><label>확정 단체</label><strong id="zrTodayTeams">0팀</strong><small id="zrTodayTeamSub">사전답사 0건 별도</small></div><div class="zr-today-metric"><label>총 방문 인원</label><strong id="zrTodayPeople">0명</strong><small>유료 + 인솔 포함</small></div><div class="zr-today-metric"><label>식사 이용</label><strong id="zrTodayMeal">0팀</strong><small id="zrTodayMealSub">도시락 0 · 카페 0</small></div><div class="zr-today-metric"><label>놀이터 이용</label><strong id="zrTodayPlay">0팀</strong><small>예약 이용 기준</small></div><div class="zr-today-metric"><label>고객 확인 완료</label><strong id="zrTodayViewed">0/0팀</strong><small>주차 · 가이드맵 · 스케줄 모두 확인</small></div></div><div class="zr-today-alertbox"><div class="zr-today-alert-head"><b>오늘 최종 확인</b><span>놓친 항목만 빠르게 확인</span></div><div class="zr-today-alerts" id="zrTodayAlerts"></div></div><div class="zr-today-list-head"><h3>운영 순서</h3><span>입장 시간순 · 하루 최대 5팀 기준</span></div><div class="zr-today-list" id="zrTodayList"></div></div>`;admin.appendChild(sec)}
  btn.onclick=openTab;$('zrTodayPrev').onclick=()=>setDate(shift(date,-1));$('zrTodayNext').onclick=()=>setDate(shift(date,1));$('zrTodayNow').onclick=()=>setDate(today());$('zrTodayDate').onchange=e=>setDate(e.target.value);$('zrTodayPrint').onclick=preparePrint;
  bindTabsRoot(tabs);date=today();render();installed=true;return true;
}
function boot(){
  window.addEventListener('afterprint',()=>document.body.classList.remove('zr-today-printing'));
  if(ensureUi())return;let tries=0;const timer=setInterval(()=>{if(ensureUi()||++tries>40)clearInterval(timer)},250);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
