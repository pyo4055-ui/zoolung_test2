(()=>{
'use strict';
if(window.__ZR_ADMIN_MOBILE_CONTENT_POLISH_V1)return;
window.__ZR_ADMIN_MOBILE_CONTENT_POLISH_V1=true;

const $=id=>document.getElementById(id);
const mobile=()=>window.matchMedia('(max-width:900px)').matches;
const VISIBLE_GROUPS=[
  ['tab-today','operation'],['tab-calendar','operation'],['tab-schedule','operation'],['tab-warning','operation'],
  ['tab-activity','reservation'],['tab-meals','reservation'],['tab-cleanup','reservation'],
  ['tab-inquiries','customer'],['tab-preview-visit','customer'],['zrGuideAdminSection','customer'],
  ['tab-sales-dashboard','sales'],['tab-outsourcing','sales'],['tab-menuadmin','sales'],['tab-settings','settings']
];
let visibleObserver=null;
const observedSections=new WeakSet();

function injectStyle(){
  if($('zrAdminMobileContentPolishV1Style'))return;
  const s=document.createElement('style');
  s.id='zrAdminMobileContentPolishV1Style';
  s.textContent=`
  @media(max-width:900px){
    html.zr-admin-shell-mounted body #adminView,
    html.zr-admin-shell-mounted body #adminView *{box-sizing:border-box}

    html.zr-admin-mobile-switching body #adminView{visibility:hidden!important}

    /* Approved iPhone date alignment. */
    html.zr-admin-shell-mounted body #adminView input[type="date"]{
      min-width:0!important;max-width:100%!important;height:44px!important;min-height:44px!important;max-height:44px!important;
      padding-top:0!important;padding-bottom:0!important;font-size:16px!important;line-height:44px!important;box-sizing:border-box!important
    }
    html.zr-admin-shell-mounted body #adminView input[type="date"]::-webkit-date-and-time-value{
      display:flex!important;align-items:center!important;width:100%!important;height:42px!important;min-height:42px!important;
      margin:0!important;padding:0!important;line-height:42px!important;text-align:left!important
    }
    html.zr-admin-shell-mounted body #adminView input[type="date"]::-webkit-calendar-picker-indicator{margin:0!important;padding:4px!important}

    /* Reservation status uses a dedicated mobile control surface. Keep the PC toolbar intact but invisible. */
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar{display:none!important}
    #zrMobileActivityToolbarV2{
      display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
      grid-template-areas:"start end" "basis status" "org org" "search today" "excel excel";
      gap:10px!important;width:100%!important;min-width:0!important;max-width:100%!important;
      margin:10px 0 12px!important;padding:0 8px 0 0!important;align-items:end!important;box-sizing:border-box!important
    }
    #zrMobileActivityToolbarV2 .zrm-act-field{display:flex!important;flex-direction:column!important;gap:6px!important;min-width:0!important;width:100%!important;max-width:100%!important;margin:0!important;overflow:hidden!important}
    #zrMobileActivityToolbarV2 .zrm-act-label{font-size:12px!important;font-weight:800!important;color:#332925!important;line-height:1.25!important;white-space:nowrap!important}
    #zrMobileActivityToolbarV2 .zrm-act-field input,
    #zrMobileActivityToolbarV2 .zrm-act-field select{
      display:block!important;width:100%!important;inline-size:100%!important;min-width:0!important;min-inline-size:0!important;max-width:100%!important;max-inline-size:100%!important;height:44px!important;min-height:44px!important;max-height:44px!important;
      margin:0!important;padding:0 11px!important;border:1px solid #dfd2c8!important;border-radius:11px!important;background:#fff!important;color:#352b26!important;font-size:16px!important;box-shadow:none!important;box-sizing:border-box!important
    }
    #zrMobileActivityToolbarV2 .zrm-act-start{grid-area:start}.zrm-act-end{grid-area:end}.zrm-act-basis{grid-area:basis}.zrm-act-status{grid-area:status}
    #zrMobileActivityToolbarV2 .zrm-act-org{grid-area:org}.zrm-act-search{grid-area:search}.zrm-act-today{grid-area:today}.zrm-act-excel{grid-area:excel}
    #zrMobileActivityToolbarV2 .zrm-act-btn{
      width:100%!important;min-width:0!important;max-width:100%!important;height:44px!important;min-height:44px!important;margin:0!important;padding:0 12px!important;
      border-radius:11px!important;font-size:13px!important;font-weight:900!important;box-shadow:none!important
    }
    #zrMobileActivityToolbarV2 .zrm-act-search{border:1px solid #f26828!important;background:#f26828!important;color:#fff!important}
    #zrMobileActivityToolbarV2 .zrm-act-today{border:1px solid #195b37!important;background:#195b37!important;color:#fff!important}
    #zrMobileActivityToolbarV2 .zrm-act-excel{border:1px solid #195b37!important;background:#fff!important;color:#195b37!important}
    #zrMobileActivityToolbarV2 .zrm-act-search:before{content:'조회하기'}
    #zrMobileActivityToolbarV2 .zrm-act-today:before{content:'오늘'}
    #zrMobileActivityToolbarV2 .zrm-act-excel:before{content:'엑셀 내려받기'}
    html.zr-admin-shell-mounted body #adminView #tab-activity .card{padding:14px!important}

    /* Cleanup tabs: keep dynamic date controls inside the same left/right inset. */
    html.zr-admin-shell-mounted body #adminView #tab-cleanup .zr-cleanup-filters{
      width:100%!important;min-width:0!important;max-width:100%!important;padding-right:8px!important;box-sizing:border-box!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-cleanup .zr-cleanup-field{width:100%!important;min-width:0!important;max-width:100%!important;overflow:hidden!important}
    html.zr-admin-shell-mounted body #adminView #tab-cleanup .zr-cleanup-field input[type="date"]{
      display:block!important;width:100%!important;inline-size:100%!important;min-width:0!important;min-inline-size:0!important;max-width:100%!important;max-inline-size:100%!important;margin:0!important;box-sizing:border-box!important
    }

    /* Sales month controls stay exactly as approved. */
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-filter{
      display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;align-items:end!important;width:100%!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-filter>label{
      display:flex!important;flex-direction:column!important;gap:5px!important;width:100%!important;min-width:0!important;max-width:100%!important;
      overflow:hidden!important;padding:8px 9px!important;box-sizing:border-box!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-filter>.help{grid-column:1/-1!important;margin:0!important}
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-filter input[type="month"]{
      display:block!important;width:100%!important;inline-size:100%!important;max-width:100%!important;max-inline-size:100%!important;
      min-width:0!important;min-inline-size:0!important;height:44px!important;min-height:44px!important;max-height:44px!important;
      margin:0!important;padding:0 10px!important;font-size:16px!important;line-height:42px!important;box-sizing:border-box!important;
      -webkit-appearance:none!important;appearance:none!important;background:#fff!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-filter input[type="month"]::-webkit-date-and-time-value{
      display:flex!important;align-items:center!important;width:100%!important;min-width:0!important;height:42px!important;margin:0!important;padding:0!important;line-height:42px!important;text-align:left!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-filter input[type="month"]::-webkit-calendar-picker-indicator{margin:0!important;padding:3px!important}
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard #zrSalesMonthlyPanel .zr-sales-filter>label,
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard #zrSalesCafePanel .zr-sales-filter>label{grid-column:1/2!important}
  }
  `;
  document.head.appendChild(s);
}

function textOf(el){return String(el?.textContent||'').replace(/\s+/g,'').trim()}
function originalActivityControls(){
  const tab=$('tab-activity'),toolbar=$('zr11ActivityToolbar');
  if(!tab||!toolbar)return null;
  const buttons=[...toolbar.querySelectorAll('button')];
  return {
    tab,toolbar,
    start:$('activityStart')||$('activityStartDate'),
    end:$('activityEnd')||$('activityEndDate'),
    basis:$('activityDateBasis'),
    status:$('zrActivityStatusFilter'),
    orgInput:$('zrActivityOrgSearch'),
    search:buttons.find(b=>textOf(b)==='조회하기'),
    today:buttons.find(b=>textOf(b)==='오늘'),
    excel:buttons.find(b=>textOf(b).includes('엑셀'))
  };
}
function optionHtml(select){return select?[...select.options].map(o=>`<option value="${String(o.value).replace(/"/g,'&quot;')}">${String(o.textContent||'')}</option>`).join(''):''}
function syncMobileActivityToolbar(){
  const c=originalActivityControls(),m=$('zrMobileActivityToolbarV2');if(!c||!m)return;
  const map=[['zrMobActivityStart',c.start],['zrMobActivityEnd',c.end],['zrMobActivityBasis',c.basis],['zrMobActivityStatus',c.status],['zrMobActivityOrg',c.orgInput]];
  map.forEach(([id,orig])=>{const clone=$(id);if(clone&&orig&&document.activeElement!==clone)clone.value=orig.value||''});
}
function pushMobileActivityValues(){
  const c=originalActivityControls();if(!c)return c;
  const pairs=[[c.start,$('zrMobActivityStart')],[c.end,$('zrMobActivityEnd')],[c.basis,$('zrMobActivityBasis')],[c.status,$('zrMobActivityStatus')],[c.orgInput,$('zrMobActivityOrg')]];
  pairs.forEach(([orig,clone])=>{if(orig&&clone&&orig.value!==clone.value){orig.value=clone.value;orig.dispatchEvent(new Event(orig.type==='search'?'input':'change',{bubbles:true}))}});
  return c;
}
function runMobileActivitySearch(){
  const x=pushMobileActivityValues(),input=x?.orgInput;
  if(!input)return;
  input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true,cancelable:true}));
}
function ensureMobileActivityToolbar(){
  if(!mobile())return false;
  const c=originalActivityControls();if(!c||!c.start||!c.end||!c.basis||!c.status||!c.orgInput||!c.search||!c.today||!c.excel)return false;
  let m=$('zrMobileActivityToolbarV2');
  if(!m){
    m=document.createElement('div');m.id='zrMobileActivityToolbarV2';m.setAttribute('aria-label','예약 현황 모바일 조회 조건');
    m.innerHTML=`
      <label class="zrm-act-field zrm-act-start"><span class="zrm-act-label">조회 시작일</span><input id="zrMobActivityStart" type="date"></label>
      <label class="zrm-act-field zrm-act-end"><span class="zrm-act-label">조회 종료일</span><input id="zrMobActivityEnd" type="date"></label>
      <label class="zrm-act-field zrm-act-basis"><span class="zrm-act-label">조회 기준</span><select id="zrMobActivityBasis">${optionHtml(c.basis)}</select></label>
      <label class="zrm-act-field zrm-act-status"><span class="zrm-act-label">처리 상태</span><select id="zrMobActivityStatus">${optionHtml(c.status)}</select></label>
      <label class="zrm-act-field zrm-act-org"><span class="zrm-act-label">단체명 검색</span><input id="zrMobActivityOrg" type="search" autocomplete="off" placeholder="단체명 일부 입력"></label>
      <button type="button" class="zrm-act-btn zrm-act-search" aria-label="조회하기"></button>
      <button type="button" class="zrm-act-btn zrm-act-today" aria-label="오늘"></button>
      <button type="button" class="zrm-act-btn zrm-act-excel" aria-label="엑셀 내려받기"></button>`;
    c.toolbar.insertAdjacentElement('beforebegin',m);
    $('zrMobActivityBasis').addEventListener('change',()=>pushMobileActivityValues());
    $('zrMobActivityStatus').addEventListener('change',()=>pushMobileActivityValues());
    $('zrMobActivityOrg').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();runMobileActivitySearch()}});
    m.querySelector('.zrm-act-search').addEventListener('click',runMobileActivitySearch);
    m.querySelector('.zrm-act-today').addEventListener('click',()=>{const x=originalActivityControls();x?.today?.click();setTimeout(syncMobileActivityToolbar,40);setTimeout(syncMobileActivityToolbar,160)});
    m.querySelector('.zrm-act-excel').addEventListener('click',()=>{const x=pushMobileActivityValues();x?.excel?.click()});
  }
  syncMobileActivityToolbar();
  return true;
}

function normalizeControls(){
  if(!mobile())return;
  document.querySelectorAll('#adminView input[type="date"]').forEach(el=>{
    el.style.setProperty('min-width','0','important');el.style.setProperty('max-width','100%','important');
    el.style.setProperty('height','44px','important');el.style.setProperty('min-height','44px','important');el.style.setProperty('max-height','44px','important');
    el.style.setProperty('padding-top','0','important');el.style.setProperty('padding-bottom','0','important');
    el.style.setProperty('line-height','44px','important');el.style.setProperty('box-sizing','border-box','important');
  });
  document.querySelectorAll('#zrMobileActivityToolbarV2 input[type="date"],#tab-cleanup .zr-cleanup-field input[type="date"]').forEach(el=>{
    el.style.setProperty('display','block','important');el.style.setProperty('width','100%','important');el.style.setProperty('inline-size','100%','important');
    el.style.setProperty('min-width','0','important');el.style.setProperty('min-inline-size','0','important');el.style.setProperty('max-width','100%','important');el.style.setProperty('max-inline-size','100%','important');
    el.style.setProperty('margin','0','important');el.style.setProperty('box-sizing','border-box','important');
  });
  document.querySelectorAll('#tab-sales-dashboard input[type="month"]').forEach(el=>{
    el.style.setProperty('display','block','important');el.style.setProperty('width','100%','important');el.style.setProperty('inline-size','100%','important');
    el.style.setProperty('max-width','100%','important');el.style.setProperty('max-inline-size','100%','important');el.style.setProperty('min-width','0','important');el.style.setProperty('min-inline-size','0','important');
    el.style.setProperty('height','44px','important');el.style.setProperty('min-height','44px','important');el.style.setProperty('max-height','44px','important');
    el.style.setProperty('padding','0 10px','important');el.style.setProperty('line-height','42px','important');el.style.setProperty('box-sizing','border-box','important');
    el.style.setProperty('-webkit-appearance','none','important');el.style.setProperty('appearance','none','important');
  });
}

function elementVisible(el){
  if(!el||el.classList.contains('hidden'))return false;
  try{return getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden'}catch{return false}
}
function visibleGroup(){for(const [id,group] of VISIBLE_GROUPS){if(elementVisible($(id)))return group}return''}
function syncBottomVisual(){
  if(!mobile()||$('zrAdminMobileSubnavV3')?.classList.contains('is-open'))return;
  const group=visibleGroup();if(!group)return;
  document.querySelectorAll('#zrAdminMobileBottomV1 [data-mobile-category]').forEach(btn=>{
    btn.classList.remove('is-active','is-category-active');
    if(btn.dataset.mobileCategory===group)btn.classList.add('is-category-active');
  });
}
function bindVisibleSync(){
  if(!visibleObserver)visibleObserver=new MutationObserver(()=>requestAnimationFrame(syncBottomVisual));
  for(const [id] of VISIBLE_GROUPS){const el=$(id);if(!el||observedSections.has(el))continue;observedSections.add(el);visibleObserver.observe(el,{attributes:true,attributeFilter:['class','hidden']})}
}
function apply(){injectStyle();ensureMobileActivityToolbar();normalizeControls();bindVisibleSync();syncBottomVisual()}
function boot(){
  apply();
  let tries=0;
  const timer=setInterval(()=>{apply();if(++tries>=32)clearInterval(timer)},180);
  setTimeout(()=>clearInterval(timer),6500);
  document.addEventListener('click',e=>{
    if(!mobile())return;
    const child=e.target?.closest?.('#zrAdminMobileSubnavV3 .zrm-child');
    if(child){
      document.documentElement.classList.add('zr-admin-mobile-switching');
      setTimeout(()=>document.documentElement.classList.remove('zr-admin-mobile-switching'),220);
    }
    if(e.target?.closest?.('#zrAdminMobileBottomV1,#zrAdminMobileSubnavV3,#zrAdminMobileShellV1,#adminView .admin-tabs,#tab-sales-dashboard,#tab-cleanup')){
      setTimeout(apply,60);setTimeout(apply,220);setTimeout(syncBottomVisual,420);
    }
  },true);
  document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(apply,0),{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();