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
  s.textContent=`
    /* 보고서 제목 아래 설명 문구는 화면/인쇄 모두 제거 */
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-subtitle{display:none!important}

    @media print{
      @page{size:A4 landscape;margin:8mm}
      html,body{width:auto!important;min-width:0!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;background:#fff!important}
      body.zr-sales-printing .zr-sales-print-hide{display:none!important}
      body.zr-sales-printing .zr-sales-print-ancestor{
        display:block!important;
        width:100%!important;min-width:0!important;max-width:none!important;
        height:auto!important;min-height:0!important;max-height:none!important;
        margin:0!important;padding:0!important;
        overflow:visible!important;overflow-x:visible!important;overflow-y:visible!important;
        position:static!important;inset:auto!important;transform:none!important;
        contain:none!important;clip:auto!important;clip-path:none!important;
        box-shadow:none!important;background:#fff!important;
      }
      body.zr-sales-printing #adminView,
      body.zr-sales-printing #tab-sales-dashboard{
        display:block!important;
        width:100%!important;min-width:0!important;max-width:none!important;
        height:auto!important;min-height:0!important;max-height:none!important;
        margin:0!important;padding:0!important;
        overflow:visible!important;overflow-x:visible!important;overflow-y:visible!important;
        position:static!important;transform:none!important;background:#fff!important;
      }
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-head{margin:0 0 4mm!important}
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-subtitle{display:none!important}
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-panel.active,
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-panel.active *{
        max-height:none!important;
      }
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-panel.active,
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-table-scroll,
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-grid2,
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-card{
        overflow:visible!important;overflow-x:visible!important;overflow-y:visible!important;
      }
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-table-scroll{
        height:auto!important;min-height:0!important;max-height:none!important;
      }
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-card{
        break-inside:avoid-page!important;page-break-inside:avoid!important;
      }
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-grid2{
        grid-template-columns:1fr 1fr!important;
      }
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-kpis{
        grid-template-columns:repeat(5,minmax(0,1fr))!important;
      }
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-pie-wrap{
        grid-template-columns:minmax(38mm,46mm) 1fr!important;
      }
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-pie{
        width:38mm!important;height:38mm!important;aspect-ratio:1!important;
      }
      body.zr-sales-printing #tab-sales-dashboard table{
        width:100%!important;max-width:100%!important;table-layout:auto!important;
      }
    }
  `;
  document.head.appendChild(s);
}

function clearPrintClasses(){
  document.querySelectorAll('.zr-sales-print-ancestor').forEach(el=>el.classList.remove('zr-sales-print-ancestor'));
  document.querySelectorAll('.zr-sales-print-hide').forEach(el=>el.classList.remove('zr-sales-print-hide'));
  document.body.classList.remove('zr-sales-printing');
}

function markPrintPath(){
  clearPrintClasses();
  const sec=$('tab-sales-dashboard');
  if(!sec)return false;
  let node=sec;
  while(node&&node.nodeType===1){
    node.classList.add('zr-sales-print-ancestor');
    const parent=node.parentElement;
    if(parent){
      [...parent.children].forEach(sib=>{
        if(sib!==node&&sib.tagName!=='SCRIPT'&&sib.tagName!=='STYLE')sib.classList.add('zr-sales-print-hide');
      });
    }
    if(node===document.body)break;
    node=parent;
  }
  document.body.classList.add('zr-sales-printing');
  return true;
}

function replaceExistingPrintAction(){
  const btn=$('zrSalesPrintBtn');
  if(!btn||btn.dataset.zrPrintFixV1==='1')return !!btn;
  btn.dataset.zrPrintFixV1='1';
  btn.addEventListener('click',e=>{
    e.preventDefault();
    e.stopImmediatePropagation();
    if(!markPrintPath())return;
    requestAnimationFrame(()=>setTimeout(()=>window.print(),20));
  },true);
  return true;
}

function bind(){
  if(printBound)return;
  printBound=true;
  window.addEventListener('afterprint',clearPrintClasses);
  window.addEventListener('beforeprint',()=>{
    if($('tab-sales-dashboard')&&!$('tab-sales-dashboard').classList.contains('hidden'))markPrintPath();
  });
}

function apply(){
  injectStyle();
  replaceExistingPrintAction();
}

function boot(){
  bind();apply();
  let tries=0;
  const timer=setInterval(()=>{
    apply();
    if($('zrSalesPrintBtn')||++tries>60)clearInterval(timer);
  },100);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(apply,20));
})();
