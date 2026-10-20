(()=>{
'use strict';
if(window.__ZR_ADMIN_OPERATIONAL_UI_ALIGNMENT_V1)return;
window.__ZR_ADMIN_OPERATIONAL_UI_ALIGNMENT_V1=true;

const $=id=>document.getElementById(id);
let scheduleStatusTarget=null;
let scheduleStatusObserver=null;

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

    /* 스케줄 연결 상태는 카드 밖 우측에 배치하고 실제 모양은 Today computed style을 그대로 복사 */
    html.zr-admin-shell-mounted body #adminView #tab-schedule .zr-schedule-status-row-v1{
      display:flex!important;justify-content:flex-end!important;align-items:center!important;
      min-height:28px!important;margin:-5px 0 8px!important;padding:0!important;
    }
    html.zr-admin-shell-mounted body #adminView #tab-schedule .zr-schedule-status-row-v1 #zrscStatus{
      margin:0!important;white-space:nowrap!important;
    }

    /* Both desktop rails consume about 580px. Reflow before date fields clip. */
    @media(max-width:1500px){
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar{grid-template-columns:repeat(12,minmax(0,1fr))!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-start{grid-column:1/7!important;grid-row:1!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-end{grid-column:7/13!important;grid-row:1!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #activityDateBasisWrap{grid-column:1/5!important;grid-row:2!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityStatusWrap{grid-column:5/9!important;grid-row:2!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityOrgSearchWrap,
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityOrgSearchWrap.zr-activity-inline-search-disabled{grid-column:9/13!important;grid-row:2!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-search-btn{grid-column:4/7!important;grid-row:3!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-today-btn{grid-column:7/10!important;grid-row:3!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-excel-btn{grid-column:10/13!important;grid-row:3!important}
    }
    @media(max-width:640px){
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-start{grid-column:1/13!important;grid-row:1!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-end{grid-column:1/13!important;grid-row:2!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #activityDateBasisWrap{grid-column:1/13!important;grid-row:3!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityStatusWrap{grid-column:1/13!important;grid-row:4!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityOrgSearchWrap,
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityOrgSearchWrap.zr-activity-inline-search-disabled{grid-column:1/13!important;grid-row:5!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-search-btn{grid-column:1/7!important;grid-row:6!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-today-btn{grid-column:7/13!important;grid-row:6!important}
      html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-excel-btn{grid-column:1/13!important;grid-row:7!important}
    }
    /* Match paired controls without changing their colors or click handlers. */
    html.zr-admin-shell-mounted body #adminView #autoCloseMinus,
    html.zr-admin-shell-mounted body #adminView #autoClosePlus{
      box-sizing:border-box!important;width:42px!important;min-width:42px!important;
      height:42px!important;min-height:42px!important;padding:0!important;
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
      line-height:1!important;flex:0 0 42px!important;
    }
    html.zr-admin-shell-mounted body #adminView #zrGuideAdminContents .zrga-mini{
      box-sizing:border-box!important;min-width:40px!important;height:40px!important;
      min-height:40px!important;padding:0 10px!important;line-height:1!important;
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
      flex-shrink:0!important;
    }
  `;
  document.head.appendChild(s);
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
  if(scheduleStatusTarget!==status){scheduleStatusObserver?.disconnect();scheduleStatusObserver=new MutationObserver(rewrite);scheduleStatusObserver.observe(status,{childList:true,characterData:true,subtree:true});scheduleStatusTarget=status}
  return copyTodayStatusVisual(status);
}

function applyStableUi(){
  injectStyle();
  return syncScheduleStatus();
}
function boot(){
  document.addEventListener('zr:admin-section-header-ready',e=>{if(e.detail?.id==='tab-schedule')applyStableUi()});
  document.addEventListener('zr:today-ui-ready',applyStableUi);
  document.addEventListener('zr:admin-runtime-ready',applyStableUi);
  applyStableUi();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
