(()=>{
'use strict';
if(window.__ZR_ADMIN_OPERATIONAL_UI_ALIGNMENT_V1)return;
window.__ZR_ADMIN_OPERATIONAL_UI_ALIGNMENT_V1=true;

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').trim().toLocaleLowerCase('ko-KR').replace(/\s+/g,'');
let readyTimer=0;
let scheduleStatusObserver=null;
let activityClickBound=false;

function injectStyle(){
  if($('zrAdminOperationalUiAlignmentV1Style'))return;
  const s=document.createElement('style');
  s.id='zrAdminOperationalUiAlignmentV1Style';
  s.textContent=`
    /* 예약현황: 아웃소싱처럼 한 줄 필터 + 독립 단체명 검색 */
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar{
      display:grid!important;grid-template-columns:repeat(15,minmax(0,1fr))!important;
      gap:10px 12px!important;align-items:end!important;margin:12px 0 10px!important;
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-start{grid-column:1/4!important;grid-row:1!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-end{grid-column:4/7!important;grid-row:1!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #activityDateBasisWrap{grid-column:7/10!important;grid-row:1!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityStatusWrap{grid-column:10/13!important;grid-row:1!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityOrgSearchWrap,
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityOrgSearchWrap.zr-activity-inline-search-disabled{
      grid-column:13/16!important;grid-row:1!important;display:flex!important;flex-direction:column!important;
      gap:5px!important;min-width:0!important;margin:0!important;opacity:1!important;
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity #zrActivityOrgSearch{display:none!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zrActivityOrgStandaloneSearch{
      display:block!important;width:100%!important;min-width:0!important;min-height:42px!important;height:42px!important;
      box-sizing:border-box!important;margin:0!important;opacity:1!important;pointer-events:auto!important;cursor:text!important;
      background:#fff!important;color:inherit!important;-webkit-text-fill-color:currentColor!important;
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-search-btn{grid-column:7/10!important;grid-row:2!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-today-btn{grid-column:10/13!important;grid-row:2!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-excel-btn{grid-column:13/16!important;grid-row:2!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zrActivityOrgModalBtn{display:none!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zrActivityOrgSearchHint,
    html.zr-admin-shell-mounted body #adminView #tab-activity .zr-admin-activity-legacy-help-hidden{display:none!important}

    /* Today 날짜 이동은 화살표만 유지 */
    html.zr-admin-shell-mounted body #adminView #tab-today button.zr-admin-today-arrow-nav{
      min-width:40px!important;width:40px!important;height:40px!important;min-height:40px!important;padding:0!important;
      border-radius:10px!important;background:#fff!important;border:1.5px solid var(--zr-v3-green,#004b2a)!important;
      color:var(--zr-v3-green,#004b2a)!important;-webkit-text-fill-color:var(--zr-v3-green,#004b2a)!important;
      font-size:20px!important;line-height:1!important;box-shadow:none!important;
    }

    /* 스케줄 연결 상태는 카드 밖 우측에 배치하고 실제 모양은 Today computed style을 그대로 복사 */
    html.zr-admin-shell-mounted body #adminView #tab-schedule .zr-schedule-status-row-v1{
      display:flex!important;justify-content:flex-end!important;align-items:center!important;
      min-height:28px!important;margin:-5px 0 8px!important;padding:0!important;
    }
    html.zr-admin-shell-mounted body #adminView #tab-schedule .zr-schedule-status-row-v1 #zrscStatus{
      margin:0!important;white-space:nowrap!important;
    }

    @media(max-width:900px){
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar{grid-template-columns:repeat(12,minmax(0,1fr))!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-start{grid-column:1/7!important;grid-row:1!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-end{grid-column:7/13!important;grid-row:1!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #activityDateBasisWrap{grid-column:1/5!important;grid-row:2!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityStatusWrap{grid-column:5/9!important;grid-row:2!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityOrgSearchWrap{grid-column:9/13!important;grid-row:2!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-search-btn{grid-column:4/7!important;grid-row:3!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-today-btn{grid-column:7/10!important;grid-row:3!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-excel-btn{grid-column:10/13!important;grid-row:3!important}
    }
    @media(max-width:640px){
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-start{grid-column:1/13!important;grid-row:1!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-end{grid-column:1/13!important;grid-row:2!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #activityDateBasisWrap{grid-column:1/13!important;grid-row:3!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityStatusWrap{grid-column:1/13!important;grid-row:4!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityOrgSearchWrap{grid-column:1/13!important;grid-row:5!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-search-btn{grid-column:1/7!important;grid-row:6!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-today-btn{grid-column:7/13!important;grid-row:6!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-excel-btn{grid-column:1/13!important;grid-row:7!important}
    }
  `;
  document.head.appendChild(s);
}

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
  return `<div class="booking-item"><div class="zr4-badges">${statusBadge(b)}</div><div class="row" style="margin-top:7px"><div><b>${esc(b?.orgName||'')}</b><div class="help">접수 ${esc(dateText(b?.createdAt))} · 예약일 ${esc(b?.date||'-')}</div></div></div><div class="detail-grid"><div><b>예약자</b><br>${esc(b?.managerName||'-')}</div><div><b>연락처</b><br>${esc(b?.contact||'-')}</div><div><b>방문시간</b><br>${esc(b?.entryTime||'--:--')} ~ ${esc(b?.exitTime||'--:--')}</div><div><b>인원</b><br>유료 ${Number(b?.paidCount||0)} / 인솔 ${Number(b?.chaperoneCount||0)}</div></div><div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn-soft" onclick="openAdminBookingDetail('${esc(b?.id||'')}')">자세히</button></div></div>`;
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
    input.addEventListener('keydown',e=>{if(e.key!=='Enter'||!String(input.value||'').trim())return;e.preventDefault();e.stopImmediatePropagation();renderOrgSearch()},true);
  }
  $('zrActivityOrgSearchHint')?.classList.add('zr-admin-activity-legacy-help-hidden');
  const modalBtn=$('zrActivityOrgModalBtn');if(modalBtn){modalBtn.style.display='none';modalBtn.setAttribute('aria-hidden','true')}
  const tab=$('tab-activity');
  if(tab)[...tab.querySelectorAll('.help')].forEach(el=>{if(String(el.textContent||'').replace(/\s+/g,' ').trim().includes('기준으로 조회'))el.classList.add('zr-admin-activity-legacy-help-hidden')});
  return true;
}

function compactTodayDateNav(){
  const prev=$('zrTodayPrev'),next=$('zrTodayNext');
  if(prev){prev.textContent='‹';prev.classList.add('zr-admin-today-arrow-nav');prev.setAttribute('aria-label','이전날');prev.title='이전날'}
  if(next){next.textContent='›';next.classList.add('zr-admin-today-arrow-nav');next.setAttribute('aria-label','다음날');next.title='다음날'}
  return !!(prev&&next);
}

function normalizedScheduleStatusText(text){
  const raw=String(text||'').replace(/^●\s*/,'').trim();
  if(/실시간 연결/.test(raw))return '스케줄 실시간 연결';
  if(/불러오는 중/.test(raw))return '스케줄 불러오는 중';
  if(/DB 연결 대기/.test(raw))return '스케줄 DB 연결 대기';
  if(/DB 연결 확인 필요|연결 확인 필요/.test(raw))return '스케줄 연결 확인 필요';
  if(/관리자 DB 로그인 필요/.test(raw))return '관리자 DB 로그인 필요';
  return raw;
}
function copyTodayStatusVisual(status){
  const source=$('zrTodayDbStatus');if(!source||!status)return false;
  const cs=getComputedStyle(source);
  const props=[
    'display','box-sizing','font-family','font-size','font-style','font-weight','letter-spacing','line-height','text-transform','white-space',
    'padding-top','padding-right','padding-bottom','padding-left',
    'border-top-width','border-top-style','border-top-color','border-right-width','border-right-style','border-right-color',
    'border-bottom-width','border-bottom-style','border-bottom-color','border-left-width','border-left-style','border-left-color',
    'border-top-left-radius','border-top-right-radius','border-bottom-right-radius','border-bottom-left-radius',
    'background-color','background-image','color','box-shadow','opacity','min-height','height'
  ];
  props.forEach(p=>status.style.setProperty(p,cs.getPropertyValue(p),'important'));
  status.style.setProperty('margin','0','important');
  status.style.setProperty('width','auto','important');
  status.style.setProperty('min-width','0','important');
  return true;
}
function syncScheduleStatus(){
  const tab=$('tab-schedule'),status=$('zrscStatus'),head=tab?.querySelector(':scope > .zr-admin-section-head');if(!tab||!status||!head)return false;
  let row=$('zrScheduleStatusRowV1');
  if(!row){row=document.createElement('div');row.id='zrScheduleStatusRowV1';row.className='zr-schedule-status-row-v1';head.insertAdjacentElement('afterend',row)}
  if(status.parentElement!==row)row.appendChild(status);
  const rewrite=()=>{
    const wanted='● '+normalizedScheduleStatusText(status.textContent);if(status.textContent!==wanted)status.textContent=wanted;
    copyTodayStatusVisual(status);
  };
  rewrite();
  if(!scheduleStatusObserver){scheduleStatusObserver=new MutationObserver(rewrite);scheduleStatusObserver.observe(status,{childList:true,characterData:true,subtree:true})}
  return copyTodayStatusVisual(status);
}

function applyStableUi(){injectStyle();return prepareActivitySearch()&&compactTodayDateNav()&&syncScheduleStatus()}
function boot(){
  injectStyle();bindActivityDelegatedSearch();let stable=0,tries=0;
  readyTimer=setInterval(()=>{tries++;const ok=applyStableUi();stable=ok?stable+1:0;if(stable>=8||tries>=60){clearInterval(readyTimer);readyTimer=0}},200);
  document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(applyStableUi,50),{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();