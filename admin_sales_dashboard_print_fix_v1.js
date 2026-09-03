(()=>{
'use strict';
if(window.__ZR_ADMIN_SALES_DASHBOARD_PRINT_FIX_V1)return;
window.__ZR_ADMIN_SALES_DASHBOARD_PRINT_FIX_V1=true;

const $=id=>document.getElementById(id);
let printBound=false;
function injectStyle(){
  if($('zrAdminSalesDashboardPrintFixV1Style'))return;
  const s=document.createElement('style');s.id='zrAdminSalesDashboardPrintFixV1Style';
  s.textContent=`html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-subtitle{display:none!important}`;
  document.head.appendChild(s);
}
function syncFormValues(source,clone){
  const a=[...source.querySelectorAll('input,select,textarea')],b=[...clone.querySelectorAll('input,select,textarea')];
  a.forEach((el,i)=>{const c=b[i];if(!c)return;if(el.tagName==='SELECT')c.value=el.value;else if(el.type==='checkbox'||el.type==='radio')c.checked=el.checked;else c.value=el.value;if(c.tagName==='INPUT')c.setAttribute('value',el.value||'')});
}
function styleMarkup(){return [...document.head.querySelectorAll('style,link[rel="stylesheet"]')].map(el=>el.outerHTML).join('\n')}
function panelTitle(panel){
  const id=panel?.id||'';return ({zrSalesMonthlyPanel:'월매출 현황',zrSalesPrevPanel:'전월매출 현황',zrSalesYearPanel:'전년매출 현황',zrSalesCafePanel:'단체 카페매출',zrSalesRevisitPanel:'재방문율'})[id]||'매출 현황';
}
function fitOnePage(doc){
  const sheet=doc.getElementById('zrSalesPrintSheet');if(!sheet)return;
  const mmPx=96/25.4,targetH=176*mmPx;
  sheet.style.zoom='1';sheet.style.width='267mm';void sheet.offsetHeight;
  const h=Math.max(sheet.scrollHeight,sheet.getBoundingClientRect().height,1);
  sheet.style.zoom=String(Math.max(.54,Math.min(1,targetH/h)));
}
function standalonePrint(){
  const sec=$('tab-sales-dashboard'),panel=sec?.querySelector('.zr-sales-panel.active');if(!sec||sec.classList.contains('hidden')||!panel)return;
  const clone=panel.cloneNode(true);syncFormValues(panel,clone);clone.querySelectorAll('button').forEach(b=>b.remove());clone.querySelectorAll('[hidden]').forEach(el=>el.removeAttribute('hidden'));clone.style.display='block';clone.classList.add('active');
  const frame=document.createElement('iframe');frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;left:-12000px;top:0;width:1120px;height:760px;border:0;opacity:0;pointer-events:none';document.body.appendChild(frame);
  const doc=frame.contentDocument||frame.contentWindow?.document;if(!doc){frame.remove();return}
  const title=panelTitle(panel);
  doc.open();doc.write(`<!doctype html><html lang="ko" class="zr-admin-shell-mounted"><head><meta charset="utf-8"><title>${title}</title>${styleMarkup()}<style>
    @page{size:A4 landscape;margin:10mm}
    *{box-sizing:border-box!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
    html,body{margin:0!important;padding:0!important;width:277mm!important;height:190mm!important;overflow:hidden!important;background:#fff!important}
    body{padding:3mm 4mm 3mm 3mm!important;font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif!important}
    #adminView{display:block!important;width:267mm!important;max-width:267mm!important;min-width:0!important;margin:0!important;padding:0!important;background:#fff!important;overflow:visible!important}
    #zrSalesPrintSheet{transform-origin:top left!important;width:267mm!important;max-width:267mm!important;margin:0!important;padding:0!important}
    #tab-sales-dashboard{display:block!important;width:267mm!important;max-width:267mm!important;min-width:0!important;margin:0!important;padding:0!important;background:#fff!important;overflow:visible!important}
    #tab-sales-dashboard .zr-sales-print-title{font-size:17pt!important;font-weight:950!important;margin:0 0 2.5mm!important;letter-spacing:-.04em!important}
    #tab-sales-dashboard .zr-sales-subtitle,#tab-sales-dashboard .zr-sales-subtabs,#zrSalesPrintBtn{display:none!important}
    #tab-sales-dashboard .zr-sales-panel{display:block!important;width:267mm!important;max-width:267mm!important;min-width:0!important;overflow:visible!important}
    #tab-sales-dashboard .zr-sales-filter,#tab-sales-dashboard .zr-sales-revisit-compare-head{display:flex!important;flex-wrap:wrap!important;gap:2mm!important;margin:0 0 2mm!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;max-width:100%!important}
    #tab-sales-dashboard .zr-sales-filter label,#tab-sales-dashboard .zr-sales-revisit-yearbox{min-width:31mm!important;padding:1.6mm!important;border-radius:1.6mm!important;background:#fff!important}
    #tab-sales-dashboard .zr-sales-filter input{min-height:0!important;height:7.5mm!important;font-size:7pt!important}
    #tab-sales-dashboard .zr-sales-kpis{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:1.7mm!important;margin-bottom:2mm!important;min-width:0!important;max-width:100%!important}
    #tab-sales-dashboard .zr-sales-kpi{min-width:0!important;min-height:0!important;padding:2mm!important;border-radius:1.8mm!important;background:#fff!important;box-shadow:none!important;overflow:hidden!important}
    #tab-sales-dashboard .zr-sales-kpi span{font-size:6.2pt!important}#tab-sales-dashboard .zr-sales-kpi strong{font-size:10.5pt!important;margin-top:.8mm!important;white-space:nowrap!important}#tab-sales-dashboard .zr-sales-kpi small{font-size:5.2pt!important;margin-top:.5mm!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
    #tab-sales-dashboard .zr-sales-grid2{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:2mm!important;min-width:0!important;max-width:100%!important;margin-bottom:0!important}
    #tab-sales-dashboard .zr-sales-card{min-width:0!important;max-width:100%!important;width:auto!important;padding:2.1mm!important;border-radius:1.8mm!important;background:#fff!important;box-shadow:none!important;overflow:hidden!important;break-inside:avoid!important}
    #tab-sales-dashboard .zr-sales-card h3{font-size:8.3pt!important;margin:0 0 .6mm!important}#tab-sales-dashboard .zr-sales-card .help{font-size:5.1pt!important;margin-bottom:1mm!important}
    #tab-sales-dashboard .zr-sales-pie-wrap{display:grid!important;grid-template-columns:28mm minmax(0,1fr)!important;gap:1.7mm!important;align-items:center!important;min-width:0!important;max-width:100%!important}
    #tab-sales-dashboard .zr-sales-pie{width:25mm!important;height:25mm!important}
    #tab-sales-dashboard .zr-sales-legend{gap:.55mm!important;min-width:0!important}#tab-sales-dashboard .zr-sales-legend-row{grid-template-columns:2mm minmax(0,1fr) 11mm 18mm!important;gap:.8mm!important;font-size:5pt!important;min-width:0!important}#tab-sales-dashboard .zr-sales-legend-row small{font-size:4.8pt!important}
    #tab-sales-dashboard .zr-sales-table-scroll{width:100%!important;max-width:100%!important;max-height:none!important;overflow:visible!important;border-radius:1.6mm!important}
    #tab-sales-dashboard table{width:100%!important;max-width:100%!important;table-layout:auto!important;font-size:6pt!important}#tab-sales-dashboard table th,#tab-sales-dashboard table td{padding:1.05mm 1.2mm!important}
    #tab-sales-dashboard .zr-sales-note{font-size:4.9pt!important;padding:1mm 0!important;margin-top:1mm!important;background:transparent!important}
    #tab-sales-dashboard .zr-sales-year-stepper button,#tab-sales-dashboard [data-zr-revisit-step]{display:none!important}
    #tab-sales-dashboard .zr-sales-year-stepper,#tab-sales-dashboard .zr-sales-revisit-yearctl{display:block!important}
    #tab-sales-dashboard .zr-sales-change-chart{margin-top:1.6mm!important;break-inside:avoid!important;overflow:visible!important;max-width:100%!important}
    #tab-sales-dashboard .zr-sales-change-chart-scroll{overflow:visible!important}#tab-sales-dashboard .zr-sales-change-bars{min-width:0!important;max-width:100%!important}
    #tab-sales-dashboard .zr-sales-daily-grid{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:1.7mm!important;max-width:100%!important}
    #tab-sales-dashboard .zr-sales-daily-card{min-width:0!important;max-width:100%!important;padding:1.6mm!important;overflow:hidden!important}
    #tab-sales-dashboard .zr-sales-daily-head{margin-bottom:.6mm!important}#tab-sales-dashboard .zr-sales-daily-head h3{font-size:7.2pt!important}#tab-sales-dashboard .zr-sales-daily-head span{font-size:4.7pt!important}
    #tab-sales-dashboard .zr-sales-daily-scroll{overflow:visible!important;max-width:100%!important}
    #tab-sales-dashboard .zr-sales-daily-bars{min-width:0!important;max-width:100%!important;width:100%!important;height:27mm!important;grid-template-columns:repeat(var(--zr-bars),minmax(0,1fr))!important;gap:.35mm!important;padding-top:.5mm!important}
    #tab-sales-dashboard .zr-sales-day{min-width:0!important;height:25mm!important;grid-template-rows:3mm 1fr 3mm!important}
    #tab-sales-dashboard .zr-sales-day-track{height:18mm!important}#tab-sales-dashboard .zr-sales-day-bar{width:1.8mm!important;min-height:.5mm!important}
    #tab-sales-dashboard .zr-sales-day-value,#tab-sales-dashboard .zr-sales-day-label{font-size:4pt!important;line-height:2.7mm!important}
  </style></head><body><div id="adminView"><div id="zrSalesPrintSheet"><section id="tab-sales-dashboard"><div class="zr-sales-print-title">${title}</div>${clone.outerHTML}</section></div></div></body></html>`);doc.close();
  const cleanup=()=>{try{frame.remove()}catch{}};
  const run=()=>{try{fitOnePage(doc);frame.contentWindow?.addEventListener('afterprint',cleanup,{once:true});frame.contentWindow?.focus();frame.contentWindow?.print();setTimeout(cleanup,120000)}catch{cleanup()}};
  if(doc.readyState==='complete')setTimeout(run,180);else frame.onload=()=>setTimeout(run,180);
}
function replaceExistingPrintAction(){
  const btn=$('zrSalesPrintBtn');if(!btn||btn.dataset.zrStandalonePrintV1==='4')return !!btn;btn.dataset.zrStandalonePrintV1='4';
  btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();standalonePrint()},true);return true;
}
function bind(){if(printBound)return;printBound=true}
function apply(){injectStyle();replaceExistingPrintAction()}
function boot(){bind();apply();let tries=0;const timer=setInterval(()=>{apply();if($('zrSalesPrintBtn')||++tries>60)clearInterval(timer)},100)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(apply,20));
})();
