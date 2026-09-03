(()=>{
'use strict';
if(window.__ZR_ADMIN_OPERATIONAL_UI_ALIGNMENT_V1)return;
window.__ZR_ADMIN_OPERATIONAL_UI_ALIGNMENT_V1=true;

const $=id=>document.getElementById(id);
let retryTimer=0;

function injectStyle(){
  if($('zrAdminOperationalUiAlignmentV1Style'))return;
  const s=document.createElement('style');
  s.id='zrAdminOperationalUiAlignmentV1Style';
  s.textContent=`
    /* 예약현황: 아웃소싱 조회 영역과 같은 흐름으로 정렬한다. */
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar{
      display:grid!important;
      grid-template-columns:repeat(15,minmax(0,1fr))!important;
      gap:10px 12px!important;
      align-items:end!important;
      margin:12px 0 10px!important;
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-start{grid-column:1/4!important;grid-row:1!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-end{grid-column:4/7!important;grid-row:1!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #activityDateBasisWrap{grid-column:7/10!important;grid-row:1!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityStatusWrap{grid-column:10/13!important;grid-row:1!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityOrgSearchWrap{
      grid-column:13/16!important;grid-row:1!important;display:flex!important;
      flex-direction:column!important;gap:5px!important;min-width:0!important;margin:0!important;
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityOrgSearchWrap.zr-activity-inline-search-disabled{display:flex!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityOrgSearch{
      width:100%!important;min-width:0!important;min-height:42px!important;height:42px!important;margin:0!important;
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-search-btn{grid-column:7/10!important;grid-row:2!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-today-btn{grid-column:10/13!important;grid-row:2!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-excel-btn{grid-column:13/16!important;grid-row:2!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityOrgModalBtn{display:none!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zrActivityOrgSearchHint,
    html.zr-admin-shell-mounted body #adminView #tab-activity .zr-admin-activity-legacy-help-hidden{display:none!important}

    /* Today: 이전/다음 날짜는 스케줄 관리와 동일하게 화살표만 노출. */
    html.zr-admin-shell-mounted body #adminView #tab-today button.zr-admin-today-arrow-nav{
      min-width:40px!important;width:40px!important;height:40px!important;min-height:40px!important;
      padding:0!important;border-radius:10px!important;background:#fff!important;
      border:1.5px solid var(--zr-v3-green,#004b2a)!important;
      color:var(--zr-v3-green,#004b2a)!important;-webkit-text-fill-color:var(--zr-v3-green,#004b2a)!important;
      font-size:20px!important;line-height:1!important;box-shadow:none!important;
    }
    html.zr-admin-shell-mounted body #adminView #tab-today button.zr-admin-today-arrow-nav:hover{
      background:var(--zr-v3-green-soft,#eef6f1)!important;
      color:var(--zr-v3-green-dark,#003b21)!important;-webkit-text-fill-color:var(--zr-v3-green-dark,#003b21)!important;
    }

    /* 스케줄 관리 연결 상태를 Today 등 운영 상태 배지와 같은 규격으로 통일. */
    html.zr-admin-shell-mounted body #adminView #tab-schedule #zrscStatus.zrsc-status{
      font-size:11px!important;font-weight:850!important;padding:6px 9px!important;border-radius:999px!important;
      background:#f2f4f2!important;border:1px solid #dfe5df!important;color:#6d756f!important;
      min-height:auto!important;height:auto!important;line-height:1.25!important;box-shadow:none!important;
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

function revealActivityOrgSearch(){
  const toolbar=$('zr11ActivityToolbar'),wrap=$('zrActivityOrgSearchWrap'),input=$('zrActivityOrgSearch');
  if(!toolbar||!wrap||!input)return false;
  if(wrap.parentElement!==toolbar)toolbar.appendChild(wrap);
  wrap.classList.remove('zr-activity-inline-search-disabled');
  input.disabled=false;
  input.removeAttribute('disabled');
  if(!input.dataset.zrOperationalUiAlignment){
    input.dataset.zrOperationalUiAlignment='1';
    input.addEventListener('input',()=>{
      if(String(input.value||'').trim())return;
      const basis=$('activityDateBasis'),start=$('activityStart')||$('activityStartDate'),end=$('activityEnd')||$('activityEndDate');
      if(basis)basis.disabled=false;if(start)start.disabled=false;if(end)end.disabled=false;
      $('activityDateBasisWrap')?.classList.remove('zr-search-ignored');
      start?.closest('div')?.classList.remove('zr-search-ignored');
      end?.closest('div')?.classList.remove('zr-search-ignored');
    });
  }
  const hint=$('zrActivityOrgSearchHint');if(hint)hint.setAttribute('aria-hidden','true');
  $('zrActivityOrgModalBtn')?.setAttribute('aria-hidden','true');
  const tab=$('tab-activity');
  if(tab){
    [...tab.querySelectorAll('.help')].forEach(el=>{
      const text=String(el.textContent||'').replace(/\s+/g,' ').trim();
      if(text.includes('기준으로 조회'))el.classList.add('zr-admin-activity-legacy-help-hidden');
    });
  }
  return true;
}

function compactTodayDateNav(){
  const prev=$('zrTodayPrev'),next=$('zrTodayNext');
  if(prev){prev.textContent='‹';prev.classList.add('zr-admin-today-arrow-nav');prev.setAttribute('aria-label','이전날');prev.title='이전날'}
  if(next){next.textContent='›';next.classList.add('zr-admin-today-arrow-nav');next.setAttribute('aria-label','다음날');next.title='다음날'}
  return !!(prev&&next);
}

function unifyScheduleStatus(){
  const status=$('zrscStatus');
  if(!status)return false;
  status.dataset.zrUnifiedStatus='1';
  return true;
}

function apply(){
  injectStyle();
  const a=revealActivityOrgSearch();
  const t=compactTodayDateNav();
  const s=unifyScheduleStatus();
  return a&&t&&s;
}

function boot(){
  injectStyle();
  let tries=0;
  retryTimer=setInterval(()=>{
    tries++;
    const done=apply();
    if(done&&tries>8){clearInterval(retryTimer);retryTimer=0}
    else if(tries>100){clearInterval(retryTimer);retryTimer=0}
  },200);
  document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(apply,0));
  document.addEventListener('click',()=>setTimeout(apply,0),true);
  const root=$('adminView')||document.body;
  new MutationObserver(()=>setTimeout(apply,0)).observe(root,{childList:true,subtree:true});
  setTimeout(apply,0);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
