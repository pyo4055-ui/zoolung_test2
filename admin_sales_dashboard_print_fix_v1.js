(()=>{
'use strict';
if(window.__ZR_ADMIN_SALES_DASHBOARD_PRINT_FIX_V1)return;
window.__ZR_ADMIN_SALES_DASHBOARD_PRINT_FIX_V1=true;

const $=id=>document.getElementById(id);
let printBound=false;

function injectStyle(){
  if($('zrAdminSalesDashboardPrintFixV1Style'))return;
  const s=document.createElement('style');
  s.id='zrAdminSalesDashboardPrintFixV1Style';
  s.textContent=`html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-subtitle{display:none!important}`;
  document.head.appendChild(s);
}

function syncFormValues(source,clone){
  const a=[...source.querySelectorAll('input,select,textarea')];
  const b=[...clone.querySelectorAll('input,select,textarea')];
  a.forEach((el,i)=>{
    const c=b[i];if(!c)return;
    if(el.tagName==='SELECT')c.value=el.value;
    else if(el.type==='checkbox'||el.type==='radio')c.checked=el.checked;
    else c.value=el.value;
    if(c.tagName==='INPUT')c.setAttribute('value',el.value||'');
  });
}

function styleMarkup(){
  return [...document.head.querySelectorAll('style,link[rel="stylesheet"]')].map(el=>el.outerHTML).join('\n');
}

function standalonePrint(){
  const sec=$('tab-sales-dashboard');
  const panel=sec?.querySelector('.zr-sales-panel.active');
  if(!sec||sec.classList.contains('hidden')||!panel)return;

  const clone=panel.cloneNode(true);syncFormValues(panel,clone);
  clone.querySelectorAll('button').forEach(b=>b.remove());
  clone.querySelectorAll('[hidden]').forEach(el=>el.removeAttribute('hidden'));
  clone.style.display='block';clone.classList.add('active');

  const frame=document.createElement('iframe');
  frame.setAttribute('aria-hidden','true');
  frame.style.cssText='position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
  document.body.appendChild(frame);
  const doc=frame.contentDocument||frame.contentWindow?.document;if(!doc){frame.remove();return}
  const title=String(sec.querySelector('.zr-sales-title')?.textContent||'매출 현황').trim();
  doc.open();
  doc.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${title}</title>${styleMarkup()}<style>
    @page{size:A4 landscape;margin:8mm}
    *{box-sizing:border-box!important}
    html,body{margin:0!important;padding:0!important;width:auto!important;height:auto!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;overflow:visible!important;background:#fff!important}
    body{font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif!important;color:#2f2b28!important}
    #tab-sales-dashboard{display:block!important;width:100%!important;max-width:none!important;min-width:0!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;padding:0!important;overflow:visible!important;background:#fff!important}
    #tab-sales-dashboard .zr-sales-print-title{font-size:18pt!important;font-weight:950!important;letter-spacing:-.04em!important;margin:0 0 4mm!important;color:#2f2b28!important}
    #tab-sales-dashboard .zr-sales-subtitle,#tab-sales-dashboard .zr-sales-subtabs,#zrSalesPrintBtn{display:none!important}
    #tab-sales-dashboard .zr-sales-panel{display:block!important;width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important}
    #tab-sales-dashboard .zr-sales-filter,#tab-sales-dashboard .zr-sales-revisit-compare-head{display:flex!important;flex-wrap:wrap!important;gap:2mm!important;margin:0 0 3mm!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}
    #tab-sales-dashboard .zr-sales-filter label,#tab-sales-dashboard .zr-sales-revisit-yearbox{min-width:34mm!important;padding:2mm!important;border:1px solid #ded6cf!important;border-radius:2mm!important;background:#fff!important}
    #tab-sales-dashboard .zr-sales-kpis{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:2mm!important;margin-bottom:3mm!important}
    #tab-sales-dashboard .zr-sales-kpi{min-width:0!important;min-height:0!important;padding:2.5mm!important;border-radius:2mm!important;box-shadow:none!important;break-inside:avoid!important}
    #tab-sales-dashboard .zr-sales-kpi span{font-size:7pt!important}#tab-sales-dashboard .zr-sales-kpi strong{font-size:12pt!important}#tab-sales-dashboard .zr-sales-kpi small{font-size:6pt!important}
    #tab-sales-dashboard .zr-sales-grid2{display:grid!important;grid-template-columns:1fr 1fr!important;gap:3mm!important;overflow:visible!important}
    #tab-sales-dashboard .zr-sales-card{min-width:0!important;height:auto!important;max-height:none!important;padding:3mm!important;border-radius:2mm!important;box-shadow:none!important;overflow:visible!important;break-inside:avoid-page!important}
    #tab-sales-dashboard .zr-sales-card h3{font-size:10pt!important}#tab-sales-dashboard .zr-sales-card .help{font-size:6.5pt!important}
    #tab-sales-dashboard .zr-sales-table-scroll{width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;border-radius:2mm!important}
    #tab-sales-dashboard table{width:100%!important;max-width:100%!important;table-layout:auto!important;font-size:7pt!important}#tab-sales-dashboard table th,#tab-sales-dashboard table td{padding:1.6mm 1.8mm!important}
    #tab-sales-dashboard .zr-sales-pie-wrap{display:grid!important;grid-template-columns:42mm 1fr!important;gap:3mm!important;align-items:center!important}#tab-sales-dashboard .zr-sales-pie{width:38mm!important;height:38mm!important}
    #tab-sales-dashboard .zr-sales-note{font-size:6.5pt!important;padding:2mm 0!important;background:transparent!important}
    #tab-sales-dashboard .zr-sales-year-stepper button,#tab-sales-dashboard [data-zr-revisit-step]{display:none!important}
    #tab-sales-dashboard .zr-sales-year-stepper,#tab-sales-dashboard .zr-sales-revisit-yearctl{display:block!important}
    #tab-sales-dashboard .zr-sales-change-chart{break-inside:avoid-page!important;overflow:visible!important}
    #tab-sales-dashboard .zr-sales-change-chart-scroll{overflow:visible!important}#tab-sales-dashboard .zr-sales-change-bars{min-width:0!important}
  </style></head><body><section id="tab-sales-dashboard"><div class="zr-sales-print-title">${title}</div>${clone.outerHTML}</section></body></html>`);
  doc.close();

  const cleanup=()=>{try{frame.remove()}catch{}};
  const run=()=>{
    try{
      frame.contentWindow?.addEventListener('afterprint',cleanup,{once:true});
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      setTimeout(cleanup,120000);
    }catch{cleanup()}
  };
  if(doc.readyState==='complete')setTimeout(run,80);else frame.onload=()=>setTimeout(run,80);
}

function replaceExistingPrintAction(){
  const btn=$('zrSalesPrintBtn');
  if(!btn||btn.dataset.zrStandalonePrintV1==='1')return !!btn;
  btn.dataset.zrStandalonePrintV1='1';
  btn.addEventListener('click',e=>{
    e.preventDefault();e.stopImmediatePropagation();standalonePrint();
  },true);
  return true;
}
function bind(){if(printBound)return;printBound=true}
function apply(){injectStyle();replaceExistingPrintAction()}
function boot(){
  bind();apply();
  let tries=0;const timer=setInterval(()=>{apply();if($('zrSalesPrintBtn')||++tries>60)clearInterval(timer)},100);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(apply,20));
})();
