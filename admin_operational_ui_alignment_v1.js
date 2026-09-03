(()=>{
'use strict';
if(window.__ZR_ADMIN_OPERATIONAL_UI_ALIGNMENT_V1)return;
window.__ZR_ADMIN_OPERATIONAL_UI_ALIGNMENT_V1=true;

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').trim().toLocaleLowerCase('ko-KR').replace(/\s+/g,'');
let readyTimer=0;
let scheduleStatusObserver=null;

function injectStyle(){
  if($('zrAdminOperationalUiAlignmentV1Style'))return;
  const s=document.createElement('style');
  s.id='zrAdminOperationalUiAlignmentV1Style';
  s.textContent=`
    /* 예약현황: 아웃소싱과 같은 인라인 조회 흐름 */
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
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityOrgSearch{
      display:block!important;width:100%!important;min-width:0!important;min-height:42px!important;height:42px!important;
      margin:0!important;opacity:1!important;pointer-events:auto!important;cursor:text!important;
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-search-btn{grid-column:7/10!important;grid-row:2!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-today-btn{grid-column:10/13!important;grid-row:2!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-excel-btn{grid-column:13/16!important;grid-row:2!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityOrgModalBtn{display:none!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zrActivityOrgSearchHint,
    html.zr-admin-shell-mounted body #adminView #tab-activity .zr-admin-activity-legacy-help-hidden{display:none!important}

    /* Today 날짜 이동: 스케줄 관리처럼 화살표만 */
    html.zr-admin-shell-mounted body #adminView #tab-today button.zr-admin-today-arrow-nav{
      min-width:40px!important;width:40px!important;height:40px!important;min-height:40px!important;padding:0!important;
      border-radius:10px!important;background:#fff!important;border:1.5px solid var(--zr-v3-green,#004b2a)!important;
      color:var(--zr-v3-green,#004b2a)!important;-webkit-text-fill-color:var(--zr-v3-green,#004b2a)!important;
      font-size:20px!important;line-height:1!important;box-shadow:none!important;
    }
    html.zr-admin-shell-mounted body #adminView #tab-today button.zr-admin-today-arrow-nav:hover{
      background:var(--zr-v3-green-soft,#eef6f1)!important;color:var(--zr-v3-green-dark,#003b21)!important;
      -webkit-text-fill-color:var(--zr-v3-green-dark,#003b21)!important;
    }

    /* 스케줄 관리 연결 상태: Today 연결 배지와 동일 규격 */
    html.zr-admin-shell-mounted body #adminView #tab-schedule #zrscStatus.zrsc-status{
      margin:0 4px 0 0!important;min-height:0!important;height:auto!important;padding:6px 9px!important;
      border-radius:999px!important;font-size:11px!important;font-weight:850!important;line-height:1.25!important;
      background:#f2f4f2!important;border:1px solid #dfe5df!important;color:#6d756f!important;box-shadow:none!important;
      white-space:nowrap!important;
    }
    html.zr-admin-shell-mounted body #adminView #tab-schedule #zrscStatus.zrsc-status.ok{
      background:#e9f3ed!important;color:#2f6b4f!important;border-color:#c6decf!important;
    }
    html.zr-admin-shell-mounted body #adminView #tab-schedule #zrscStatus.zrsc-status.wait{
      background:#f2f4f2!important;color:#6d756f!important;border-color:#dfe5df!important;
    }
    html.zr-admin-shell-mounted body #adminView #tab-schedule #zrscStatus.zrsc-status.err{
      background:#fbecec!important;color:#a33b3b!important;border-color:#e8c6c6!important;
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
function dateText(v){
  const s=String(v||'');const m=s.match(/\d{4}-\d{2}-\d{2}/);return m?m[0]:(s||'-');
}
function setKpis(list){
  const set=(id,n)=>{const el=$(id);if(el)el.textContent=`${n}건`};
  set('activityKpiTotal',list.length);
  set('activityKpiConfirmed',list.filter(b=>b?.status==='confirmed'&&!isSettled(b)).length);
  set('activityKpiPending',list.filter(b=>b?.status==='pending').length);
  set('activityKpiCancelled',list.filter(b=>b?.status==='cancelled'||b?.status==='rejected').length);
  set('activityKpiCompleted',list.filter(isSettled).length);
}
function bookingCard(b){
  return `<div class="booking-item">
    <div class="zr4-badges">${statusBadge(b)}</div>
    <div class="row" style="margin-top:7px"><div><b>${esc(b?.orgName||'')}</b><div class="help">접수 ${esc(dateText(b?.createdAt))} · 예약일 ${esc(b?.date||'-')}</div></div></div>
    <div class="detail-grid">
      <div><b>예약자</b><br>${esc(b?.managerName||'-')}</div><div><b>연락처</b><br>${esc(b?.contact||'-')}</div>
      <div><b>방문시간</b><br>${esc(b?.entryTime||'--:--')} ~ ${esc(b?.exitTime||'--:--')}</div><div><b>인원</b><br>유료 ${Number(b?.paidCount||0)} / 인솔 ${Number(b?.chaperoneCount||0)}</div>
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn-soft" onclick="openAdminBookingDetail('${esc(b?.id||'')}')">자세히</button></div>
  </div>`;
}
function renderOrgSearch(){
  const input=$('zrActivityOrgSearch'),root=$('activityList');if(!input||!root)return false;
  const q=String(input.value||'').trim();if(!q)return false;
  const nq=norm(q);
  const list=readBookings().filter(b=>norm(b?.orgName).includes(nq)).sort((a,b)=>String(b?.date||'').localeCompare(String(a?.date||''))||String(b?.createdAt||'').localeCompare(String(a?.createdAt||'')));
  setKpis(list);
  root.innerHTML=list.length?list.map(bookingCard).join(''):`<div class="help">‘${esc(q)}’ 단체명을 포함한 예약이 없습니다.</div>`;
  return true;
}

function prepareActivitySearch(){
  const toolbar=$('zr11ActivityToolbar'),wrap=$('zrActivityOrgSearchWrap'),input=$('zrActivityOrgSearch');
  if(!toolbar||!wrap||!input)return false;
  if(wrap.parentElement!==toolbar)toolbar.appendChild(wrap);
  wrap.classList.remove('zr-activity-inline-search-disabled');
  input.disabled=false;input.removeAttribute('disabled');input.tabIndex=0;
  $('zrActivityOrgSearchHint')?.classList.add('zr-admin-activity-legacy-help-hidden');
  const modalBtn=$('zrActivityOrgModalBtn');if(modalBtn){modalBtn.style.display='none';modalBtn.setAttribute('aria-hidden','true')}

  if(!input.dataset.zrOperationalSearchBound){
    input.dataset.zrOperationalSearchBound='1';
    input.addEventListener('keydown',e=>{
      if(e.key!=='Enter')return;
      const q=String(input.value||'').trim();if(!q)return;
      e.preventDefault();e.stopImmediatePropagation();renderOrgSearch();
    },true);
  }
  const search=[...($('tab-activity')?.querySelectorAll('button')||[])].find(b=>String(b.textContent||'').trim()==='조회하기');
  if(search&&!search.dataset.zrOperationalSearchBound){
    search.dataset.zrOperationalSearchBound='1';
    search.addEventListener('click',e=>{
      const q=String(input.value||'').trim();if(!q)return;
      e.preventDefault();e.stopImmediatePropagation();renderOrgSearch();
    },true);
  }
  const tab=$('tab-activity');
  if(tab){
    [...tab.querySelectorAll('.help')].forEach(el=>{
      const text=String(el.textContent||'').replace(/\s+/g,' ').trim();
      if(text.includes('기준으로 조회'))el.classList.add('zr-admin-activity-legacy-help-hidden');
    });
  }
  return !input.disabled;
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
function syncScheduleStatusText(){
  const status=$('zrscStatus');if(!status)return false;
  const next='● '+normalizedScheduleStatusText(status.textContent);
  if(status.textContent!==next)status.textContent=next;
  if(!scheduleStatusObserver){
    scheduleStatusObserver=new MutationObserver(()=>{
      const el=$('zrscStatus');if(!el)return;
      const wanted='● '+normalizedScheduleStatusText(el.textContent);
      if(el.textContent!==wanted)el.textContent=wanted;
    });
    scheduleStatusObserver.observe(status,{childList:true,characterData:true,subtree:true});
  }
  return true;
}

function applyStableUi(){
  injectStyle();
  const a=prepareActivitySearch();
  const t=compactTodayDateNav();
  const s=syncScheduleStatusText();
  return a&&t&&s;
}

function boot(){
  injectStyle();
  let stable=0,tries=0;
  readyTimer=setInterval(()=>{
    tries++;
    const ok=applyStableUi();
    stable=ok?stable+1:0;
    if(stable>=12||tries>=100){clearInterval(readyTimer);readyTimer=0}
  },200);
  document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(applyStableUi,50),{once:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
