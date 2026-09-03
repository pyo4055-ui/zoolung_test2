(()=>{
'use strict';
if(window.__ZR_ADMIN_MOBILE_CONTENT_POLISH_V1)return;
window.__ZR_ADMIN_MOBILE_CONTENT_POLISH_V1=true;

function injectStyle(){
  if(document.getElementById('zrAdminMobileContentPolishV1Style'))return;
  const s=document.createElement('style');
  s.id='zrAdminMobileContentPolishV1Style';
  s.textContent=`
  @media(max-width:900px){
    html.zr-admin-shell-mounted body #adminView,
    html.zr-admin-shell-mounted body #adminView *{box-sizing:border-box}

    html.zr-admin-shell-mounted body #adminView :where(.card,.zr-cleanup-panel,.zr-sales-card,.zr-ir-panel,.zr-pv-panel){
      min-width:0!important;max-width:100%!important
    }

    /* iPhone/Safari date + month controls: keep every admin screen compact and inside its card. */
    html.zr-admin-shell-mounted body #adminView :where(input[type="date"],input[type="month"]){
      display:block!important;width:100%!important;inline-size:100%!important;max-width:100%!important;max-inline-size:100%!important;
      min-width:0!important;min-inline-size:0!important;height:44px!important;min-height:44px!important;max-height:44px!important;
      margin:0!important;padding:0 11px!important;border-radius:11px!important;font-size:16px!important;line-height:1.2!important;
      box-sizing:border-box!important;text-align:left!important
    }
    html.zr-admin-shell-mounted body #adminView :where(input[type="date"],input[type="month"])::-webkit-date-and-time-value{
      width:100%!important;min-width:0!important;margin:0!important;padding:0!important;text-align:left!important
    }
    html.zr-admin-shell-mounted body #adminView :where(label,div):has(> input[type="date"]),
    html.zr-admin-shell-mounted body #adminView :where(label,div):has(> input[type="month"]){
      min-width:0!important;max-width:100%!important
    }
    html.zr-admin-shell-mounted body #adminView :where(input,select,textarea){max-width:100%!important}
    html.zr-admin-shell-mounted body #adminView select{min-width:0!important}

    /* 예약 현황: PC 12-column form -> clean 2-column mobile filter. */
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar{
      display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:10px!important;
      align-items:end!important;width:100%!important;min-width:0!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar>*{min-width:0!important;max-width:100%!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-start{grid-column:1/4!important;grid-row:1!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-end{grid-column:4/7!important;grid-row:1!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #activityDateBasisWrap{grid-column:1/4!important;grid-row:2!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityStatusWrap{grid-column:4/7!important;grid-row:2!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar #zrActivityOrgModalBtn{grid-column:1/7!important;grid-row:3!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-search-btn{grid-column:1/3!important;grid-row:4!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-today-btn{grid-column:3/5!important;grid-row:4!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar .zr-act-excel-btn{grid-column:5/7!important;grid-row:4!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar :where(input,select,button){
      width:100%!important;min-width:0!important;max-width:100%!important;height:44px!important;min-height:44px!important;margin:0!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity #zr11ActivityToolbar :where(label,.zr-act-start,.zr-act-end,#activityDateBasisWrap,#zrActivityStatusWrap){
      min-width:0!important;width:auto!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-activity .card{padding:14px!important}
    html.zr-admin-shell-mounted body #adminView #tab-activity .detail-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}

    /* 과거 예약/취소 정리: dates side-by-side, action full width. */
    html.zr-admin-shell-mounted body #adminView #tab-cleanup .zr-cleanup-panel{padding:14px!important;border-radius:14px!important}
    html.zr-admin-shell-mounted body #adminView #tab-cleanup .zr-cleanup-head{margin-bottom:14px!important}
    html.zr-admin-shell-mounted body #adminView #tab-cleanup .zr-cleanup-head h2{font-size:21px!important}
    html.zr-admin-shell-mounted body #adminView #tab-cleanup .zr-cleanup-filters{
      display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;align-items:end!important;width:100%!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-cleanup .zr-cleanup-field{min-width:0!important}
    html.zr-admin-shell-mounted body #adminView #tab-cleanup .zr-cleanup-field input{width:100%!important;height:44px!important;min-height:44px!important;max-height:44px!important}
    html.zr-admin-shell-mounted body #adminView #tab-cleanup .zr-cleanup-filters>button{
      grid-column:1/-1!important;width:100%!important;min-width:0!important;height:44px!important;min-height:44px!important;margin:0!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-cleanup .zr-cleanup-tools{gap:9px!important}
    html.zr-admin-shell-mounted body #adminView #tab-cleanup .zr-cleanup-toolbuttons{width:100%!important}

    /* Sales: compact month pickers and comparison form. */
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-head{
      display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;margin-bottom:14px!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-head>div{min-width:0!important}
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-title{font-size:24px!important;text-align:left!important}
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-subtitle{font-size:11px!important}
    html.zr-admin-shell-mounted body #adminView #zrSalesPrintBtn{
      flex:0 0 auto!important;width:auto!important;min-width:84px!important;height:40px!important;min-height:40px!important;padding:0 13px!important;font-size:11px!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-filter,
    html.zr-admin-shell-mounted body #adminView #zrSalesRevisitPanel .zr-sales-revisit-compare-head{
      display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;width:100%!important;align-items:end!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-filter>label,
    html.zr-admin-shell-mounted body #adminView #zrSalesRevisitPanel .zr-sales-revisit-yearbox{
      min-width:0!important;width:auto!important;max-width:100%!important;padding:9px!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-filter>label:only-child{grid-column:1/-1!important}
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-filter input,
    html.zr-admin-shell-mounted body #adminView #zrSalesRevisitPanel :where(input,select){
      width:100%!important;min-width:0!important;max-width:100%!important;height:44px!important;min-height:44px!important;max-height:44px!important;margin:4px 0 0!important
    }
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-kpi{min-width:0!important;min-height:90px!important;padding:12px!important}
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-grid2{grid-template-columns:1fr!important}
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-card{min-width:0!important;padding:13px!important}

    /* Other date-heavy admin pages: one stable control size, no protruding intrinsic width. */
    html.zr-admin-shell-mounted body #adminView :where(#tab-inquiry-reply-v1,#tab-preview-visit,#tab-meals,#tab-outsourcing,#tab-settings) :where(input[type="date"],input[type="month"]){
      width:100%!important;min-width:0!important;max-width:100%!important;height:44px!important;min-height:44px!important;max-height:44px!important
    }
    html.zr-admin-shell-mounted body #adminView :where(#tab-inquiry-reply-v1,#tab-preview-visit,#tab-meals,#tab-outsourcing,#tab-settings) :where(.row,.grid,.zr-ir-filterbar,.zr-pv-filterbar)>*{
      min-width:0!important;max-width:100%!important
    }
  }

  @media(max-width:430px){
    html.zr-admin-shell-mounted body #adminView #tab-activity .detail-grid{grid-template-columns:1fr!important}
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-subtitle{display:none!important}
  }
  `;
  document.head.appendChild(s);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',injectStyle,{once:true});
else injectStyle();
document.addEventListener('zr:admin-runtime-ready',injectStyle,{once:true});
})();