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

    html.zr-admin-shell-mounted body #adminView input[type="date"]{
      min-width:0!important;max-width:100%!important;height:44px!important;min-height:44px!important;max-height:44px!important;
      padding-top:0!important;padding-bottom:0!important;font-size:16px!important;line-height:44px!important;box-sizing:border-box!important
    }
    html.zr-admin-shell-mounted body #adminView input[type="date"]::-webkit-date-and-time-value{
      display:flex!important;align-items:center!important;width:100%!important;height:42px!important;min-height:42px!important;
      margin:0!important;padding:0!important;line-height:42px!important;text-align:left!important
    }
    html.zr-admin-shell-mounted body #adminView input[type="date"]::-webkit-calendar-picker-indicator{margin:0!important;padding:4px!important}

    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar{
      display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
      grid-template-areas:"start end" "basis status" "org org" "search today" "excel excel"!important;
      gap:10px!important;align-items:end!important;width:100%!important;min-width:0!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>.zr-mob-act-start{grid-area:start!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>.zr-mob-act-end{grid-area:end!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>.zr-mob-act-basis{grid-area:basis!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>.zr-mob-act-status{grid-area:status!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>.zr-mob-act-org{grid-area:org!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>.zr-mob-act-search{grid-area:search!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>.zr-mob-act-today{grid-area:today!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>.zr-mob-act-excel{grid-area:excel!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>.zr-mob-act-extra{display:none!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>:where(.zr-mob-act-start,.zr-mob-act-end,.zr-mob-act-basis,.zr-mob-act-status){
      display:flex!important;flex-direction:column!important;gap:6px!important;width:100%!important;min-width:0!important;max-width:100%!important;margin:0!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>:where(.zr-mob-act-start,.zr-mob-act-end,.zr-mob-act-basis,.zr-mob-act-status) :where(label,span){
      margin:0!important;line-height:1.25!important;white-space:nowrap!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>:where(.zr-mob-act-start,.zr-mob-act-end,.zr-mob-act-basis,.zr-mob-act-status) :where(input,select){
      display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;height:44px!important;min-height:44px!important;max-height:44px!important;margin:0!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>:where(.zr-mob-act-org,.zr-mob-act-search,.zr-mob-act-today,.zr-mob-act-excel){
      width:100%!important;min-width:0!important;max-width:100%!important;margin:0!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>:where(.zr-mob-act-org,.zr-mob-act-search,.zr-mob-act-today,.zr-mob-act-excel) button,
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>button:is(.zr-mob-act-org,.zr-mob-act-search,.zr-mob-act-today,.zr-mob-act-excel){
      width:100%!important;min-width:0!important;max-width:100%!important;height:44px!important;min-height:44px!important;max-height:44px!important;margin:0!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity .card{padding:14px!important}

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

function directChildOf(el,parent){let node=el;while(node&&node.parentElement&&node.parentElement!==parent)node=node.parentElement;return node?.parentElement===parent?node:null}
function textOf(el){return String(el?.textContent||'').replace(/\s+/g,'').trim()}
function prepareActivityToolbar(){
  if(!mobile())return;
  const toolbar=$('zr11ActivityToolbar');if(!toolbar)return;
  const start=directChildOf($('activityStart')||$('activityStartDate'),toolbar);
  const end=directChildOf($('activityEnd')||$('activityEndDate'),toolbar);
  const basis=directChildOf($('activityDateBasisWrap')||$('activityDateBasis'),toolbar);
  const status=directChildOf($('zrActivityStatusWrap')||$('zrActivityStatusFilter'),toolbar);
  const org=directChildOf($('zrActivityOrgModalBtn'),toolbar);
  const buttons=[...toolbar.querySelectorAll('button')];
  const search=directChildOf(buttons.find(b=>textOf(b)==='조회하기'),toolbar);
  const today=directChildOf(buttons.find(b=>textOf(b)==='오늘'),toolbar);
  const excel=directChildOf(buttons.find(b=>textOf(b).includes('엑셀')),toolbar);
  const roles=[[start,'zr-mob-act-start'],[end,'zr-mob-act-end'],[basis,'zr-mob-act-basis'],[status,'zr-mob-act-status'],[org,'zr-mob-act-org'],[search,'zr-mob-act-search'],[today,'zr-mob-act-today'],[excel,'zr-mob-act-excel']];
  const keep=new Set(roles.map(([el])=>el).filter(Boolean));
  [...toolbar.children].forEach(el=>{
    el.classList.remove('zr-mob-act-start','zr-mob-act-end','zr-mob-act-basis','zr-mob-act-status','zr-mob-act-org','zr-mob-act-search','zr-mob-act-today','zr-mob-act-excel','zr-mob-act-extra');
    if(!keep.has(el))el.classList.add('zr-mob-act-extra');
  });
  roles.forEach(([el,cls])=>{if(el)el.classList.add(cls)});
  roles.forEach(([el])=>{if(el&&el.parentElement===toolbar)toolbar.appendChild(el)});
}

function normalizeControls(){
  if(!mobile())return;
  document.querySelectorAll('#adminView input[type="date"]').forEach(el=>{
    el.style.setProperty('min-width','0','important');el.style.setProperty('max-width','100%','important');
    el.style.setProperty('height','44px','important');el.style.setProperty('min-height','44px','important');el.style.setProperty('max-height','44px','important');
    el.style.setProperty('padding-top','0','important');el.style.setProperty('padding-bottom','0','important');
    el.style.setProperty('line-height','44px','important');el.style.setProperty('box-sizing','border-box','important');
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
function visibleGroup(){
  for(const [id,group] of VISIBLE_GROUPS){if(elementVisible($(id)))return group}
  return'';
}
function syncBottomVisual(){
  if(!mobile())return;
  if($('zrAdminMobileSubnavV3')?.classList.contains('is-open'))return;
  const group=visibleGroup();if(!group)return;
  document.querySelectorAll('#zrAdminMobileBottomV1 [data-mobile-category]').forEach(btn=>{
    btn.classList.remove('is-active','is-category-active');
    if(btn.dataset.mobileCategory===group)btn.classList.add('is-category-active');
  });
}
function bindVisibleSync(){
  if(!visibleObserver)visibleObserver=new MutationObserver(()=>requestAnimationFrame(syncBottomVisual));
  for(const [id] of VISIBLE_GROUPS){
    const el=$(id);if(!el||observedSections.has(el))continue;
    observedSections.add(el);visibleObserver.observe(el,{attributes:true,attributeFilter:['class','hidden']});
  }
}
function apply(){injectStyle();prepareActivityToolbar();normalizeControls();bindVisibleSync();syncBottomVisual()}
function boot(){
  apply();
  let tries=0;
  const timer=setInterval(()=>{apply();if(++tries>=28)clearInterval(timer)},180);
  setTimeout(()=>clearInterval(timer),5500);
  document.addEventListener('click',e=>{
    if(!mobile())return;
    if(e.target?.closest?.('#zrAdminMobileBottomV1,#zrAdminMobileSubnavV3,#zrAdminMobileShellV1,#adminView .admin-tabs,#tab-sales-dashboard')){
      setTimeout(apply,60);setTimeout(apply,220);setTimeout(syncBottomVisual,420);
    }
  },true);
  document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(apply,0),{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();