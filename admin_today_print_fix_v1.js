(()=>{
'use strict';
if(window.__ZR_ADMIN_TODAY_PRINT_FIX_V1)return;
window.__ZR_ADMIN_TODAY_PRINT_FIX_V1=true;

const $=id=>document.getElementById(id);
let timer=null;

function styleMarkup(){
  return [...document.head.querySelectorAll('style,link[rel="stylesheet"]')].map(el=>el.outerHTML).join('\n');
}
function fitOnePage(doc){
  const sheet=doc.getElementById('zrTodayPrintSheet');if(!sheet)return;
  const mmPx=96/25.4,targetW=268*mmPx,targetH=181*mmPx;
  sheet.style.zoom='1';sheet.style.width='100%';
  const baseW=Math.max(sheet.scrollWidth,sheet.getBoundingClientRect().width,1);
  const baseH=Math.max(sheet.scrollHeight,sheet.getBoundingClientRect().height,1);
  let scale=Math.max(.20,Math.min(1,targetW/baseW,targetH/baseH));
  for(let i=0;i<3;i++){
    sheet.style.zoom=String(scale);sheet.style.width=`${100/scale}%`;
    void sheet.offsetHeight;
    const rect=sheet.getBoundingClientRect();
    const correction=Math.min(1,targetW/Math.max(rect.width,1),targetH/Math.max(rect.height,1));
    if(correction>.995)break;
    scale=Math.max(.20,scale*correction*.985);
  }
  doc.documentElement.style.overflow='hidden';doc.body.style.overflow='hidden';
}
function standaloneTodayPrint(){
  const sec=$('tab-today'),shell=sec?.querySelector('.zr-today-shell');
  if(!sec||sec.classList.contains('hidden')||!shell)return;
  const clone=shell.cloneNode(true);
  clone.querySelector('.zr-today-tools')?.remove();
  clone.querySelector('.zr-today-alertbox')?.remove();
  clone.querySelectorAll('button,input').forEach(el=>el.remove());

  const frame=document.createElement('iframe');
  frame.setAttribute('aria-hidden','true');
  frame.style.cssText='position:fixed;left:-12000px;top:0;width:1200px;height:800px;border:0;opacity:0;pointer-events:none';
  document.body.appendChild(frame);
  const doc=frame.contentDocument||frame.contentWindow?.document;if(!doc){frame.remove();return}
  const dateTitle=String(sec.querySelector('#zrTodayDateTitle')?.textContent||'').trim();
  doc.open();
  doc.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>오늘 운영${dateTitle?' - '+dateTitle:''}</title>${styleMarkup()}<style>
    @page{size:A4 landscape;margin:10mm}
    *{box-sizing:border-box!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
    html,body{margin:0!important;width:277mm!important;height:190mm!important;max-width:277mm!important;max-height:190mm!important;overflow:hidden!important;background:#fff!important}
    body{padding:3mm!important;font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif!important;color:#1f2a23!important}
    #zrTodayPrintSheet{transform-origin:top left!important;margin:0!important;padding:0!important}
    #tab-today{display:block!important;margin:0!important;padding:0!important;width:100%!important;max-width:none!important;background:#fff!important}
    #tab-today .zr-today-shell{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;overflow:visible!important}
    #tab-today .zr-today-head{display:block!important;margin:0 0 3mm!important}
    #tab-today .zr-today-head h2{font-size:17pt!important;margin:0 0 1mm!important;color:#211f1c!important}
    #tab-today .zr-today-date-title{font-size:7.5pt!important;color:#6d756f!important}
    #tab-today .zr-today-tools,#tab-today .zr-today-db,#tab-today .zr-today-alertbox{display:none!important}
    #tab-today .zr-today-summary{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:2mm!important;margin:0 0 2.5mm!important}
    #tab-today .zr-today-metric{min-height:0!important;padding:2.4mm!important;border-radius:2.5mm!important;box-shadow:none!important}
    #tab-today .zr-today-metric label{font-size:6pt!important;margin-bottom:.8mm!important}#tab-today .zr-today-metric strong{font-size:12pt!important}#tab-today .zr-today-metric small{font-size:5.5pt!important;margin-top:.6mm!important}
    #tab-today .zr-today-list-head{display:flex!important;margin:0 0 1.5mm!important}#tab-today .zr-today-list-head h3{font-size:9pt!important}#tab-today .zr-today-list-head span{font-size:5.5pt!important}
    #tab-today .zr-today-list{display:grid!important;gap:1.5mm!important;overflow:visible!important}
    #tab-today .zr-today-team-card{display:grid!important;grid-template-columns:20mm minmax(0,1.3fr) minmax(48mm,1fr) minmax(43mm,.9fr)!important;border-radius:2.5mm!important;box-shadow:none!important;overflow:hidden!important;break-inside:avoid!important}
    #tab-today .zr-today-time{padding:2mm!important}#tab-today .zr-today-time strong{font-size:10pt!important}#tab-today .zr-today-time span{font-size:5.5pt!important;margin-top:1mm!important}
    #tab-today .zr-today-main,#tab-today .zr-today-program,#tab-today .zr-today-views{padding:2mm!important;min-width:0!important}
    #tab-today .zr-today-org{font-size:8pt!important}#tab-today .zr-today-badge{font-size:5pt!important;padding:1mm 1.4mm!important}#tab-today .zr-today-meta{font-size:5.7pt!important;gap:1.5mm!important}#tab-today .zr-today-note{font-size:5.4pt!important;margin-top:1.2mm!important;padding:1.2mm 1.5mm!important;max-height:9mm!important;overflow:hidden!important}
    #tab-today .zr-today-cafe{margin-top:1mm!important;padding:1.2mm 1.5mm!important}#tab-today .zr-today-cafe-title{font-size:5pt!important;margin-bottom:.8mm!important}#tab-today .zr-today-cafe-items{gap:.8mm!important}#tab-today .zr-today-cafe-items span{font-size:5pt!important;padding:.7mm 1.1mm!important}
    #tab-today .zr-today-label{font-size:5pt!important;margin-bottom:1mm!important}#tab-today .zr-today-program-grid{grid-template-columns:1fr 1fr!important;gap:1mm!important}#tab-today .zr-today-program-grid>div{padding:1.2mm!important;border-radius:1.5mm!important;min-width:0!important}#tab-today .zr-today-program-grid b{font-size:5pt!important}#tab-today .zr-today-program-grid span{font-size:5.2pt!important;overflow:hidden!important;text-overflow:ellipsis!important}
    #tab-today .zr-today-check-grid{gap:1mm!important}#tab-today .zr-today-check{padding:1.1mm!important;border-radius:1.5mm!important;min-width:0!important}#tab-today .zr-today-check b,#tab-today .zr-today-check span{font-size:5.2pt!important}
    #tab-today .zr-today-schedule{grid-column:1/-1!important;padding:1.4mm 2mm 1.7mm!important}#tab-today .zr-today-schedule-title{margin-bottom:1mm!important}#tab-today .zr-today-schedule-title b{font-size:5.5pt!important}#tab-today .zr-today-schedule-title span{font-size:4.8pt!important}#tab-today .zr-today-schedule-bars{gap:1mm!important;overflow:hidden!important}#tab-today .zr-today-schedule-seg{min-width:0!important;flex:1 1 0!important;padding:1.3mm!important;border-radius:1.5mm!important}#tab-today .zr-today-schedule-seg b{font-size:5.3pt!important}#tab-today .zr-today-schedule-seg span{font-size:4.9pt!important}
  </style></head><body><div id="zrTodayPrintSheet"><section id="tab-today">${clone.outerHTML}</section></div></body></html>`);
  doc.close();

  const cleanup=()=>{try{frame.remove()}catch{}};
  const run=()=>{
    try{
      fitOnePage(doc);
      frame.contentWindow?.addEventListener('afterprint',cleanup,{once:true});
      frame.contentWindow?.focus();frame.contentWindow?.print();setTimeout(cleanup,120000);
    }catch{cleanup()}
  };
  if(doc.readyState==='complete')setTimeout(run,160);else frame.onload=()=>setTimeout(run,160);
}
function apply(){
  const btn=$('zrTodayPrint');if(!btn)return false;
  if(btn.dataset.zrStandaloneTodayPrintV1==='1')return true;
  btn.dataset.zrStandaloneTodayPrintV1='1';
  btn.onclick=e=>{e?.preventDefault?.();standaloneTodayPrint()};
  return true;
}
function boot(){
  apply();let tries=0;timer=setInterval(()=>{tries++;if(apply()||tries>80){clearInterval(timer);timer=null}},100);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(apply,20));
})();
