(()=>{
'use strict';
if(window.__ZR_ADMIN_TODAY_PRINT_LAYOUT_V1)return;
window.__ZR_ADMIN_TODAY_PRINT_LAYOUT_V1=true;

const STYLE_ID='zrAdminTodayPrintLayoutV1Style';
function install(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement('style');
  s.id=STYLE_ID;
  s.textContent=`
@media print{
  body.zr-today-printing #tab-today .zr-today-team-card{
    display:grid!important;
    grid-template-columns:20mm minmax(0,1.3fr) minmax(48mm,1fr) minmax(43mm,.9fr)!important;
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
    border-right:1px solid #edf0ed!important;
  }
  body.zr-today-printing #tab-today .zr-today-views{border-right:0!important}

  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-head{margin-bottom:2mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-head h2{font-size:14pt!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-date-title{font-size:6.8pt!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-summary{gap:1.5mm!important;margin-bottom:1.5mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-metric{padding:1.5mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-metric label{font-size:5.3pt!important;margin-bottom:.4mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-metric strong{font-size:10pt!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-metric small{font-size:4.8pt!important;margin-top:.3mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-list-head{margin-bottom:.8mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-list-head h3{font-size:8pt!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-list-head span{font-size:5pt!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-list{gap:.7mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-time{padding:1.2mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-time strong{font-size:8.5pt!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-time span{font-size:4.8pt!important;margin-top:.5mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-main,
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-program,
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-views{padding:1.1mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-name-row{gap:.8mm!important;margin-bottom:.5mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-org{font-size:7pt!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-badge{font-size:4.5pt!important;padding:.6mm 1mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-meta{font-size:5pt!important;gap:1mm!important;line-height:1.25!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-note{font-size:4.8pt!important;margin-top:.6mm!important;padding:.7mm 1mm!important;max-height:5.5mm!important;line-height:1.2!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-cafe{margin-top:.6mm!important;padding:.7mm 1mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-cafe-title{font-size:4.5pt!important;margin-bottom:.4mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-cafe-items{gap:.5mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-cafe-items span{font-size:4.5pt!important;padding:.45mm .8mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-label{font-size:4.5pt!important;margin-bottom:.5mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-program-grid{gap:.55mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-program-grid>div{padding:.7mm!important;border-radius:1mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-program-grid b{font-size:4.5pt!important;margin-bottom:.2mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-program-grid span{font-size:4.7pt!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-check-grid{gap:.5mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-check{padding:.65mm .8mm!important;border-radius:1mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-check b,
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-check span{font-size:4.7pt!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-schedule{padding:.7mm 1.2mm .8mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-schedule-title{margin-bottom:.45mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-schedule-title b{font-size:5pt!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-schedule-title span{font-size:4.3pt!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-schedule-bars{gap:.55mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-schedule-seg{padding:.7mm .9mm!important;border-radius:1mm!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-schedule-seg b{font-size:4.7pt!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-schedule-seg span{font-size:4.3pt!important}
  body.zr-today-printing #tab-today[data-team-count="5"] .zr-today-schedule-empty{font-size:4.7pt!important;padding:.8mm!important}
}
`;
  document.head.appendChild(s);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
