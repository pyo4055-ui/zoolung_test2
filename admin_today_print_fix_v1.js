(()=>{
'use strict';
if(window.__ZR_ADMIN_TODAY_PRINT_FIX_V1)return;
window.__ZR_ADMIN_TODAY_PRINT_FIX_V1=true;

const $=id=>document.getElementById(id);
let timer=null;
function styleMarkup(){return [...document.head.querySelectorAll('style,link[rel="stylesheet"]')].map(el=>el.outerHTML).join('\n')}
function fitOnePage(doc){
  const sheet=doc.getElementById('zrTodayPrintSheet');if(!sheet)return;
  const mmPx=96/25.4,targetH=174*mmPx;
  sheet.style.zoom='1';sheet.style.width='250mm';void sheet.offsetHeight;
  const h=Math.max(sheet.scrollHeight,sheet.getBoundingClientRect().height,1);
  const scale=Math.max(.56,Math.min(1,targetH/h));
  sheet.style.zoom=String(scale);
}
function standaloneTodayPrint(){
  const sec=$('tab-today'),shell=sec?.querySelector('.zr-today-shell');if(!sec||sec.classList.contains('hidden')||!shell)return;
  const clone=shell.cloneNode(true);clone.querySelector('.zr-today-tools')?.remove();clone.querySelector('.zr-today-alertbox')?.remove();clone.querySelectorAll('button,input').forEach(el=>el.remove());
  const frame=document.createElement('iframe');frame.setAttribute('aria-hidden','true');frame.style.cssText='position:fixed;left:-12000px;top:0;width:1100px;height:760px;border:0;opacity:0;pointer-events:none';document.body.appendChild(frame);
  const doc=frame.contentDocument||frame.contentWindow?.document;if(!doc){frame.remove();return}
  const dateTitle=String(sec.querySelector('#zrTodayDateTitle')?.textContent||'').trim();
  doc.open();doc.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>오늘 운영${dateTitle?' - '+dateTitle:''}</title>${styleMarkup()}<style>
    @page{size:A4 landscape;margin:10mm}
    *{box-sizing:border-box!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
    html,body{margin:0!important;padding:0!important;width:277mm!important;height:190mm!important;overflow:hidden!important;background:#fff!important}
    body{padding:3mm 12mm 3mm 3mm!important;font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif!important;color:#1f2a23!important}
    #zrTodayPrintSheet{transform-origin:top left!important;width:250mm!important;max-width:250mm!important;margin:0!important;padding:0!important}
    #tab-today,#tab-today .zr-today-shell{display:block!important;width:250mm!important;max-width:250mm!important;min-width:0!important;margin:0!important;padding:0!important;background:#fff!important;overflow:visible!important}
    #tab-today .zr-today-head{display:block!important;margin:0 0 2mm!important}
    #tab-today .zr-today-head h2{font-size:15pt!important;margin:0 0 .7mm!important;color:#211f1c!important}
    #tab-today .zr-today-date-title{font-size:7pt!important;color:#6d756f!important}
    #tab-today .zr-today-tools,#tab-today .zr-today-db,#tab-today .zr-today-alertbox{display:none!important}
    #tab-today .zr-today-summary{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:1.5mm!important;margin:0 0 1.8mm!important;width:100%!important}
    #tab-today .zr-today-metric{min-width:0!important;min-height:0!important;padding:1.8mm!important;border-radius:2mm!important;box-shadow:none!important}
    #tab-today .zr-today-metric label{font-size:5.5pt!important;margin-bottom:.4mm!important}#tab-today .zr-today-metric strong{font-size:10pt!important}#tab-today .zr-today-metric small{font-size:4.9pt!important;margin-top:.35mm!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
    #tab-today .zr-today-list-head{display:flex!important;margin:0 0 1mm!important}#tab-today .zr-today-list-head h3{font-size:8pt!important}#tab-today .zr-today-list-head span{font-size:4.8pt!important}
    #tab-today .zr-today-list{display:grid!important;grid-template-columns:1fr!important;gap:1.2mm!important;width:100%!important;overflow:visible!important}
    #tab-today .zr-today-team-card{display:grid!important;grid-template-columns:15mm minmax(0,1.25fr) minmax(42mm,.86fr) minmax(40mm,.82fr)!important;width:100%!important;max-width:100%!important;border-radius:2mm!important;box-shadow:none!important;overflow:hidden!important;break-inside:avoid!important;min-width:0!important}
    #tab-today .zr-today-time{padding:1.25mm!important;min-width:0!important}#tab-today .zr-today-time strong{font-size:8.5pt!important}#tab-today .zr-today-time span{font-size:4.5pt!important;margin-top:.5mm!important}
    #tab-today .zr-today-main,#tab-today .zr-today-program,#tab-today .zr-today-views{padding:1.25mm!important;min-width:0!important;overflow:hidden!important}
    #tab-today .zr-today-org{font-size:6.8pt!important}#tab-today .zr-today-badge{font-size:4.1pt!important;padding:.55mm .85mm!important}#tab-today .zr-today-meta{font-size:4.5pt!important;gap:.8mm!important}#tab-today .zr-today-note{font-size:4.3pt!important;margin-top:.6mm!important;padding:.6mm .8mm!important;max-height:4.8mm!important;overflow:hidden!important}
    #tab-today .zr-today-cafe{margin-top:.5mm!important;padding:.6mm .8mm!important}#tab-today .zr-today-cafe-title{font-size:4.1pt!important;margin-bottom:.35mm!important}#tab-today .zr-today-cafe-items{gap:.4mm!important}#tab-today .zr-today-cafe-items span{font-size:4pt!important;padding:.4mm .65mm!important}
    #tab-today .zr-today-label{font-size:4.1pt!important;margin-bottom:.45mm!important}#tab-today .zr-today-program-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:.45mm!important}#tab-today .zr-today-program-grid>div{padding:.6mm!important;border-radius:.8mm!important;min-width:0!important}#tab-today .zr-today-program-grid b{font-size:4pt!important}#tab-today .zr-today-program-grid span{font-size:4.1pt!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
    #tab-today .zr-today-check-grid{gap:.4mm!important}#tab-today .zr-today-check{padding:.55mm!important;border-radius:.8mm!important;min-width:0!important}#tab-today .zr-today-check b,#tab-today .zr-today-check span{font-size:4.05pt!important}
    #tab-today .zr-today-schedule{grid-column:1/-1!important;padding:.7mm 1mm .85mm!important;min-width:0!important;overflow:hidden!important}
    #tab-today .zr-today-schedule-title{margin-bottom:.4mm!important}#tab-today .zr-today-schedule-title b{font-size:4.3pt!important}#tab-today .zr-today-schedule-title span{font-size:3.9pt!important}
    #tab-today .zr-today-schedule-bars{gap:.4mm!important;overflow:hidden!important;min-width:0!important}#tab-today .zr-today-schedule-seg{min-width:0!important;flex:1 1 0!important;padding:.55mm!important;border-radius:.8mm!important}#tab-today .zr-today-schedule-seg b{font-size:4.1pt!important}#tab-today .zr-today-schedule-seg span{font-size:3.8pt!important}
    #tab-today .zr-today-empty{width:100%!important}
  </style></head><body><div id="zrTodayPrintSheet"><section id="tab-today">${clone.outerHTML}</section></div></body></html>`);doc.close();
  const cleanup=()=>{try{frame.remove()}catch{}};
  const run=()=>{try{fitOnePage(doc);frame.contentWindow?.addEventListener('afterprint',cleanup,{once:true});frame.contentWindow?.focus();frame.contentWindow?.print();setTimeout(cleanup,120000)}catch{cleanup()}};
  if(doc.readyState==='complete')setTimeout(run,180);else frame.onload=()=>setTimeout(run,180);
}
function apply(){
  const btn=$('zrTodayPrint');if(!btn)return false;if(btn.dataset.zrStandaloneTodayPrintV1==='3')return true;btn.dataset.zrStandaloneTodayPrintV1='3';
  btn.onclick=e=>{e?.preventDefault?.();standaloneTodayPrint()};return true;
}
function boot(){apply();let tries=0;timer=setInterval(()=>{tries++;if(apply()||tries>80){clearInterval(timer);timer=null}},100)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(apply,20));
})();
