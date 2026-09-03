(()=>{
'use strict';
if(window.__ZR_ADMIN_MOBILE_CONTENT_POLISH_V1)return;
window.__ZR_ADMIN_MOBILE_CONTENT_POLISH_V1=true;

const $=id=>document.getElementById(id);
const mobile=()=>window.matchMedia('(max-width:900px)').matches;

function injectStyle(){
  if($('zrAdminMobileContentPolishV1Style'))return;
  const s=document.createElement('style');
  s.id='zrAdminMobileContentPolishV1Style';
  s.textContent=`
  @media(max-width:900px){
    html.zr-admin-shell-mounted body #adminView,
    html.zr-admin-shell-mounted body #adminView *{box-sizing:border-box}

    /* Date controls: keep the now-approved vertical centering, without changing page layout. */
    html.zr-admin-shell-mounted body #adminView input[type="date"]{
      min-width:0!important;max-width:100%!important;
      height:44px!important;min-height:44px!important;max-height:44px!important;
      padding-top:0!important;padding-bottom:0!important;
      font-size:16px!important;line-height:44px!important;box-sizing:border-box!important
    }
    html.zr-admin-shell-mounted body #adminView input[type="date"]::-webkit-date-and-time-value{
      display:flex!important;align-items:center!important;width:100%!important;height:42px!important;min-height:42px!important;
      margin:0!important;padding:0!important;line-height:42px!important;text-align:left!important
    }
    html.zr-admin-shell-mounted body #adminView input[type="date"]::-webkit-calendar-picker-indicator{margin:0!important;padding:4px!important}

    /* Reservation status: target the real runtime classes/ids only. */
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar{
      display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;
      grid-template-areas:
        "start end"
        "basis status"
        "org org"
        "search today"
        "excel excel"!important;
      gap:10px!important;align-items:end!important;width:100%!important;min-width:0!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>*{min-width:0!important;max-width:100%!important;margin:0!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-start{grid-area:start!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-end{grid-area:end!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #activityDateBasisWrap{grid-area:basis!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityStatusWrap{grid-area:status!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityOrgModalBtn{grid-area:org!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-search-btn{grid-area:search!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-today-btn{grid-area:today!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-excel-btn{grid-area:excel!important}

    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar :where(input,select,button){
      width:100%!important;min-width:0!important;max-width:100%!important;height:44px!important;min-height:44px!important;max-height:44px!important;margin:0!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar :where(.zr-act-start,.zr-act-end,#activityDateBasisWrap,#zrActivityStatusWrap){
      display:flex!important;flex-direction:column!important;gap:6px!important;width:100%!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar :where(.zr-act-start,.zr-act-end,#activityDateBasisWrap,#zrActivityStatusWrap)>:where(label,span){
      margin:0!important;line-height:1.25!important;white-space:nowrap!important
    }
    /* Old inline org-name field must never compete with the dedicated modal button on mobile. */
    html.zr-admin-shell-mounted body #adminView #tab-activity #zrActivityOrgSearchWrap,
    html.zr-admin-shell-mounted body #adminView #tab-activity #zrActivityOrgSearch,
    html.zr-admin-shell-mounted body #adminView #tab-activity .zr-activity-inline-search-disabled{display:none!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zrActivityOrgModalBtn{display:block!important;font-size:13px!important;font-weight:850!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity .card{padding:14px!important}

    /* Sales month controls: iPhone month inputs have a stubborn intrinsic width, so contain them explicitly. */
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

    /* Single-month reports stay compact; comparison reports naturally use the two columns. */
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard #zrSalesMonthlyPanel .zr-sales-filter>label,
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard #zrSalesCafePanel .zr-sales-filter>label{grid-column:1/2!important}
  }

  @media(max-width:430px){
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar{gap:9px!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar :where(input,select,button){font-size:14px!important}
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-filter{gap:8px!important}
  }
  `;
  document.head.appendChild(s);
}

function normalizeControls(){
  if(!mobile())return;
  document.querySelectorAll('#adminView input[type="date"]').forEach(el=>{
    el.style.setProperty('min-width','0','important');
    el.style.setProperty('max-width','100%','important');
    el.style.setProperty('height','44px','important');
    el.style.setProperty('min-height','44px','important');
    el.style.setProperty('max-height','44px','important');
    el.style.setProperty('padding-top','0','important');
    el.style.setProperty('padding-bottom','0','important');
    el.style.setProperty('line-height','44px','important');
    el.style.setProperty('box-sizing','border-box','important');
  });
  document.querySelectorAll('#tab-sales-dashboard input[type="month"]').forEach(el=>{
    el.style.setProperty('display','block','important');
    el.style.setProperty('width','100%','important');
    el.style.setProperty('inline-size','100%','important');
    el.style.setProperty('max-width','100%','important');
    el.style.setProperty('max-inline-size','100%','important');
    el.style.setProperty('min-width','0','important');
    el.style.setProperty('min-inline-size','0','important');
    el.style.setProperty('height','44px','important');
    el.style.setProperty('min-height','44px','important');
    el.style.setProperty('max-height','44px','important');
    el.style.setProperty('padding','0 10px','important');
    el.style.setProperty('line-height','42px','important');
    el.style.setProperty('box-sizing','border-box','important');
    el.style.setProperty('-webkit-appearance','none','important');
    el.style.setProperty('appearance','none','important');
  });
}

function apply(){injectStyle();normalizeControls()}
function boot(){
  apply();
  let tries=0;
  const timer=setInterval(()=>{apply();if(++tries>=28)clearInterval(timer)},180);
  setTimeout(()=>clearInterval(timer),5500);
  document.addEventListener('click',e=>{
    if(!mobile())return;
    if(e.target?.closest?.('#zrAdminMobileBottomV1,#zrAdminMobileSubnavV3,#zrAdminMobileShellV1,#adminView .admin-tabs,#tab-sales-dashboard')){
      setTimeout(apply,60);setTimeout(apply,220);
    }
  },true);
  document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(apply,0),{once:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();