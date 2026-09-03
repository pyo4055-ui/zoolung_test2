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
  const mmPx=96/25.4,targetW=258*mmPx,targetH=172*mmPx;
  sheet.style.zoom='1';sheet.style.width='100%';void sheet.offsetHeight;
  const w=Math.max(sheet.scrollWidth,sheet.getBoundingClientRect().width,1),h=Math.max(sheet.scrollHeight,sheet.getBoundingClientRect().height,1);
  let scale=Math.min(1,targetW/w,targetH/h);
  if(scale<.58)scale=.58;
  sheet.style.zoom=String(scale);sheet.style.width=`${100/scale}%`;
  void sheet.offsetHeight;
  const rect=sheet.getBoundingClientRect();
  if(rect.width>targetW||rect.height>targetH){
    const correction=Math.min(targetW/Math.max(rect.width,1),targetH/Math.max(rect.height,1));
    scale=Math.max(.48,scale*correction*.98);sheet.style.zoom=String(scale);sheet.style.width=`${100/scale}%`;
  }
}
function standalonePrint(){
  const sec=$('tab-sales-dashboard'),panel=sec?.querySelector('.zr-sales-panel.active');if(!sec||sec.classList.contains('hidden')||!panel)return;
  const clone=panel.cloneNode(true);syncFormValues(panel,clone);clone.querySelectorAll('button').forEach(b=>b.remove());clone.querySelectorAll('[hidden]').forEach(el=>el.removeAttribute('hidden'));clone.style.display='block';clone.classList.add('active');
  const frame=document.createElement('iframe');frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;left:-12000px;top:0;width:1100px;height:760px;border:0;opacity:0;pointer-events:none';document.body.appendChild(frame);
  const doc=frame.contentDocument||frame.contentWindow?.document;if(!doc){frame.remove();return}
  const title=panelTitle(panel);
  doc.open();doc.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${title}</title>${styleMarkup()}<style>
    @page{size:A4 landscape;margin:10mm}
    *{box-sizing:border-box!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
    html,body{margin:0!important;padding:0!important;width:277mm!important;height:190mm!important;overflow:hidden!important;background:#fff!important}
    body{padding:4mm!important;font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif!important;color:#2f2b28!important}
    #zrSalesPrintSheet{transform-origin:top left!important;margin:0!important;padding:0!important}
    #tab-sales-dashboard{display:block!important;width:100%!important;min-width:0!important;margin:0!important;padding:0!important;background:#fff!important;overflow:visible!important}
    #tab-sales-dashboard .zr-sales-print-title{font-size:17pt!important;font-weight:950!important;margin:0 0 3mm!important;color:#2f2b28!important}
    #tab-sales-dashboard .zr-sales-subtitle,#tab-sales-dashboard .zr-sales-subtabs,#zrSalesPrintBtn{display:none!important}
    #tab-sales-dashboard .zr-sales-panel{display:block!important;width:100%!important;min-width:0!important;overflow:visible!important}
    #tab-sales-dashboard .zr-sales-filter,#tab-sales-dashboard .zr-sales-revisit-compare-head{display:flex!important;flex-wrap:wrap!important;gap:2mm!important;margin:0 0 2.5mm!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}
    #tab-sales-dashboard .zr-sales-filter label,#tab-sales-dashboard .zr-sales-revisit-yearbox{min-width:32mm!important;padding:1.8mm!important;border:1px solid #ddd6d0!important;border-radius:2mm!important;background:#fff!important}
    #tab-sales-dashboard .zr-sales-filter input{min-height:0!important;height:8mm!important;font-size:7pt!important}
    #tab-sales-dashboard .zr-sales-kpis{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:2mm!important;margin-bottom:2.5mm!important;min-width:0!important}
    #tab-sales-dashboard .zr-sales-kpi{min-width:0!important;min-height:0!important;padding:2.2mm!important;border:1px solid #ddd8d3!important;border-radius:2mm!important;background:#fff!important;box-shadow:none!important}
    #tab-sales-dashboard .zr-sales-kpi span{font-size:6.5pt!important}#tab-sales-dashboard .zr-sales-kpi strong{font-size:11pt!important;margin-top:1mm!important}#tab-sales-dashboard .zr-sales-kpi small{font-size:5.5pt!important;margin-top:.7mm!important}
    #tab-sales-dashboard .zr-sales-grid2{display:grid!important;grid-template-columns:1fr 1fr!important;gap:2mm!important;min-width:0!important;margin-bottom:0!important}
    #tab-sales-dashboard .zr-sales-card{min-width:0!important;width:auto!important;padding:2.3mm!important;border:1px solid #ddd8d3!important;border-radius:2mm!important;background:#fff!important;box-shadow:none!important;overflow:hidden!important;break-inside:avoid!important}
    #tab-sales-dashboard .zr-sales-card h3{font-size:8.5pt!important;margin:0 0 .8mm!important}#tab-sales-dashboard .zr-sales-card .help{font-size:5.3pt!important;margin-bottom:1.2mm!important}
    #tab-sales-dashboard .zr-sales-pie-wrap{display:grid!important;grid-template-columns:30mm minmax(0,1fr)!important;gap:2mm!important;align-items:center!important;min-width:0!important}
    #tab-sales-dashboard .zr-sales-pie{width:27mm!important;height:27mm!important}
    #tab-sales-dashboard .zr-sales-legend{gap:.7mm!important;min-width:0!important}#tab-sales-dashboard .zr-sales-legend-row{grid-template-columns:2mm minmax(0,1fr) 12mm 19mm!important;gap:1mm!important;font-size:5.3pt!important;min-width:0!important}#tab-sales-dashboard .zr-sales-legend-row small{font-size:5pt!important}
    #tab-sales-dashboard .zr-sales-table-scroll{width:100%!important;max-height:none!important;overflow:visible!important;border-radius:2mm!important}
    #tab-sales-dashboard table{width:100%!important;table-layout:auto!important;font-size:6.3pt!important}#tab-sales-dashboard table th,#tab-sales-dashboard table td{padding:1.25mm 1.5mm!important}
    #tab-sales-dashboard .zr-sales-note{font-size:5.2pt!important;padding:1.2mm 0!important;margin-top:1.2mm!important;background:transparent!important}
    #tab-sales-dashboard .zr-sales-year-stepper button,#tab-sales-dashboard [data-zr-revisit-step]{display:none!important}
    #tab-sales-dashboard .zr-sales-year-stepper,#tab-sales-dashboard .zr-sales-revisit-yearctl{display:block!important}
    #tab-sales-dashboard .zr-sales-change-chart{margin-top:2mm!important;break-inside:avoid!important;overflow:visible!important}
    #tab-sales-dashboard .zr-sales-change-chart-scroll{overflow:visible!important}#tab-sales-dashboard .zr-sales-change-bars{min-width:0!important}
    #tab-sales-dashboard .zr-sales-daily-grid{grid-template-columns:1fr 1fr!important;gap:2mm!important}
    #tab-sales-dashboard .zr-sales-daily-card{min-width:0!important;padding:1.8mm!important;border-color:#ddd8d3!important}
    #tab-sales-dashboard .zr-sales-daily-scroll{overflow:visible!important}
    #tab-sales-dashboard .zr-sales-daily-bars{min-width:0!important;width:100%!important;grid-template-columns:repeat(var(--zr-bars),minmax(0,1fr))!important}
    #tab-sales-dashboard .zr-sales-day{min-width:0!important}
  </style></head><body><div id="zrSalesPrintSheet"><section id="tab-sales-dashboard"><div class="zr-sales-print-title">${title}</div>${clone.outerHTML}</section></div></body></html>`);doc.close();
  const cleanup=()=>{try{frame.remove()}catch{}};
  const run=()=>{try{fitOnePage(doc);frame.contentWindow?.addEventListener('afterprint',cleanup,{once:true});frame.contentWindow?.focus();frame.contentWindow?.print();setTimeout(cleanup,120000)}catch{cleanup()}};
  if(doc.readyState==='complete')setTimeout(run,180);else frame.onload=()=>setTimeout(run,180);
}
function replaceExistingPrintAction(){
  const btn=$('zrSalesPrintBtn');if(!btn||btn.dataset.zrStandalonePrintV1==='2')return !!btn;btn.dataset.zrStandalonePrintV1='2';
  btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();standalonePrint()},true);return true;
}
function bind(){if(printBound)return;printBound=true}
function apply(){injectStyle();replaceExistingPrintAction()}
function boot(){bind();apply();let tries=0;const timer=setInterval(()=>{apply();if($('zrSalesPrintBtn')||++tries>60)clearInterval(timer)},100)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(apply,20));
})();
