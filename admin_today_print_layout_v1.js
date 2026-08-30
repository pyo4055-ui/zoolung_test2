(()=>{
'use strict';
if(window.__ZR_ADMIN_TODAY_PRINT_LAYOUT_V1)return;
window.__ZR_ADMIN_TODAY_PRINT_LAYOUT_V1=true;

const STYLE_ID='zrAdminTodayPrintLayoutV1Style';
function markScheduleColors(){
  document.querySelectorAll('#tab-today .zr-today-schedule-seg').forEach(el=>{
    const color=getComputedStyle(el).backgroundColor;
    if(color)el.style.setProperty('--zr-print-seg-color',color);
  });
}
function install(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=`
@media print{
  body.zr-today-printing #tab-today,
  body.zr-today-printing #tab-today *{
    -webkit-print-color-adjust:exact!important;
    print-color-adjust:exact!important;
  }
  body.zr-today-printing #tab-today .zr-today-team-card{
    display:grid!important;
    grid-template-columns:18mm minmax(0,1.35fr) minmax(45mm,1fr) minmax(41mm,.9fr)!important;
    align-items:stretch!important;
  }
  body.zr-today-printing #tab-today .zr-today-time{
    display:flex!important;
    flex-direction:column!important;
    align-items:stretch!important;
    justify-content:center!important;
    border-right:1px solid var(--zt-line)!important;
    border-bottom:0!important;
  }
  body.zr-today-printing #tab-today .zr-today-main,
  body.zr-today-printing #tab-today .zr-today-program,
  body.zr-today-printing #tab-today .zr-today-views{
    grid-column:auto!important;
    min-width:0!important;
    border-top:0!important;
    border-bottom:0!important;
  }
  body.zr-today-printing #tab-today .zr-today-main,
  body.zr-today-printing #tab-today .zr-today-program{
    border-right:1px solid #cfd8d1!important;
  }
  body.zr-today-printing #tab-today .zr-today-views{border-right:0!important}

  body.zr-today-printing #tab-today .zr-today-metric.em{
    border-color:#2f6b4f!important;
  }
  body.zr-today-printing #tab-today .zr-today-badge.confirmed{
    color:#1f6847!important;border-color:#2f8a60!important;
  }
  body.zr-today-printing #tab-today .zr-today-badge.pending{
    color:#8a6500!important;border-color:#c79300!important;
  }
  body.zr-today-printing #tab-today .zr-today-check .ok{
    color:#16633f!important;
  }
  body.zr-today-printing #tab-today .zr-today-check .no{
    color:#b32626!important;
  }
  body.zr-today-printing #tab-today .zr-today-cafe{
    border-color:#c99721!important;
  }
  body.zr-today-printing #tab-today .zr-today-schedule-seg{
    border:1px solid var(--zr-print-seg-color,#6f7b73)!important;
    border-left:2mm solid var(--zr-print-seg-color,#6f7b73)!important;
  }

  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-head{margin-bottom:1.4mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-head h2{font-size:13pt!important;margin-bottom:.45mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-date-title{font-size:6.2pt!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-summary{gap:1mm!important;margin-bottom:1mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-metric{padding:1.15mm 1.35mm!important;border-radius:1.7mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-metric label{font-size:4.9pt!important;margin-bottom:.25mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-metric strong{font-size:9pt!important;line-height:1.05!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-metric small{font-size:4.35pt!important;margin-top:.2mm!important;line-height:1.1!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-list-head{margin-bottom:.55mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-list-head h3{font-size:7.4pt!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-list-head span{font-size:4.5pt!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-list{gap:.45mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-team-card{border-radius:1.7mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-time{padding:.8mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-time strong{font-size:7.8pt!important;line-height:1.05!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-time span{font-size:4.35pt!important;margin-top:.3mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-main,
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-program,
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-views{padding:.75mm .9mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-name-row{gap:.55mm!important;margin-bottom:.3mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-org{font-size:6.4pt!important;line-height:1.05!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-badge{font-size:4pt!important;padding:.45mm .75mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-meta{font-size:4.45pt!important;gap:.7mm!important;line-height:1.15!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-note{font-size:4.4pt!important;margin-top:.35mm!important;padding:.45mm .7mm!important;max-height:4.2mm!important;line-height:1.1!important;border-radius:.8mm!important;overflow:hidden!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-cafe{margin-top:.35mm!important;padding:.45mm .7mm!important;border-radius:.8mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-cafe-title{font-size:4pt!important;margin-bottom:.25mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-cafe-items{gap:.35mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-cafe-items span{font-size:4pt!important;padding:.3mm .6mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-label{font-size:4.05pt!important;margin-bottom:.3mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-program-grid{gap:.4mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-program-grid>div{padding:.5mm .6mm!important;border-radius:.75mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-program-grid b{font-size:4.05pt!important;margin-bottom:.1mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-program-grid span{font-size:4.25pt!important;line-height:1.1!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-check-grid{gap:.35mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-check{padding:.45mm .6mm!important;border-radius:.75mm!important;line-height:1.05!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-check b,
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-check span{font-size:4.25pt!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-schedule{padding:.45mm .8mm .5mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-schedule-title{margin-bottom:.25mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-schedule-title b{font-size:4.5pt!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-schedule-title span{display:none!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-schedule-bars{gap:.35mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-schedule-seg{padding:.45mm .6mm!important;border-radius:.7mm!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-schedule-seg b{font-size:4.25pt!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-schedule-seg span{font-size:3.95pt!important}
  body.zr-today-printing #tab-today:is([data-team-count="4"],[data-team-count="5"]) .zr-today-schedule-empty{font-size:4.2pt!important;padding:.5mm!important}

  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-head{margin-bottom:1mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-summary{margin-bottom:.7mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-metric{padding:.9mm 1.1mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-list{gap:.3mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-main,
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-program,
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-views{padding:.6mm .75mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-note{max-height:3.7mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-schedule{padding:.35mm .7mm .4mm!important}
}
`;
  document.head.appendChild(s);
}

function boot(){
  install();
  window.addEventListener('beforeprint',markScheduleColors);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
