(()=>{
'use strict';
if(window.__ZR_ADMIN_SALES_DASHBOARD_V5_UI_FIX)return;
window.__ZR_ADMIN_SALES_DASHBOARD_V5_UI_FIX=true;
const $=id=>document.getElementById(id);
const PALETTE=['#470910','#fc5404','#f58b3a','#f7ad66','#f7c892','#8f5a32','#c97945','#e8a66b','#f3c28f','#a56542'];
const WINE='#470910',WINE_DARK='#300206';
let bound=false,observer=null,observeTimer=null;

function injectStyle(){
  if($('zrAdminSalesDashboardV5UiFixStyle'))return;
  const s=document.createElement('style');s.id='zrAdminSalesDashboardV5UiFixStyle';s.textContent=`
    /* Sales workspace: deliberately stronger than the old v3 orange report skin. */
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-title{font-size:26px!important;color:#2f2b28!important;letter-spacing:-.04em!important}
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-subtitle{color:#766d66!important}
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-head{align-items:center!important}
    html.zr-admin-shell-mounted body #adminView #zrSalesPrintBtn{
      min-height:40px!important;height:40px!important;margin:0 0 0 auto!important;padding:0 16px!important;
      border:1px solid var(--zr-v3-orange,#fc5404)!important;border-radius:10px!important;
      background:var(--zr-v3-orange,#fc5404)!important;color:#fff!important;-webkit-text-fill-color:#fff!important;
      font-size:12px!important;font-weight:900!important;box-shadow:none!important;white-space:nowrap!important;
    }
    html.zr-admin-shell-mounted body #adminView #zrSalesPrintBtn:hover{
      background:var(--zr-v3-orange-dark,#e24600)!important;border-color:var(--zr-v3-orange-dark,#e24600)!important;
    }
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-filter,
    html.zr-admin-shell-mounted body #adminView #zrSalesRevisitPanel .zr-sales-revisit-compare-head{
      padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;
      display:flex!important;align-items:flex-end!important;gap:10px!important;flex-wrap:wrap!important;margin-bottom:12px!important;
    }
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-filter label,
    html.zr-admin-shell-mounted body #adminView #zrSalesRevisitPanel .zr-sales-revisit-yearbox{
      color:#4d4945!important;background:#fff!important;border:1px solid #e2d9d0!important;border-radius:10px!important;
      padding:8px 10px!important;box-sizing:border-box!important;min-width:145px!important;
    }
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-filter input{min-height:38px!important;margin-top:4px!important}
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-kpis{gap:9px!important;margin-bottom:12px!important}
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-kpi{
      min-height:82px!important;padding:12px 13px!important;border:1px solid #e2d9d0!important;border-radius:11px!important;
      background:#fff!important;box-shadow:none!important;
    }
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-kpi:first-child{box-shadow:inset 0 3px 0 var(--zr-v3-orange,#fc5404)!important}
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-kpi span{color:#716963!important}
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-kpi strong{margin-top:4px!important;font-size:19px!important;color:#302c29!important}
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-kpi small{color:#8a817a!important}
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-card{
      padding:14px!important;border:1px solid #e2d9d0!important;border-radius:11px!important;background:#fff!important;box-shadow:none!important;
    }
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-card h3{color:#302c29!important;font-size:15px!important}
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-note{padding:8px 0!important;background:transparent!important;color:#766d66!important;border-radius:0!important}
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard thead th{background:#f7f3ee!important;color:#6f6862!important}
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-table-scroll{border-color:#e2d9d0!important;border-radius:9px!important}
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-legend-row b{color:#6d625c!important}
    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-pie-empty{background:#ece9e5!important}

    #zrSalesDashboardRailWrap{--zr-sub-color:var(--zr-v3-green)!important;--zr-sub-soft:#fff7ef!important}
    #zrSalesDashboardRailWrap .zr-admin-shell-submenu-inner{border-left-color:#efc6a5!important}
    #zrSalesDashboardRailWrap .zr-admin-shell-subitem:before{background:var(--zr-v3-green)!important;opacity:.42!important}
    #zrSalesDashboardRailWrap .zr-admin-shell-subitem:hover{background:#fff7ef!important;color:var(--zr-v3-green)!important}
    #zrSalesDashboardRailWrap .zr-admin-shell-subitem.is-active{background:#fff1e5!important;color:var(--zr-v3-green)!important;box-shadow:inset 3px 0 0 var(--zr-v3-orange)!important}
    #zrSalesDashboardRailWrap .zr-admin-shell-subitem.is-active:before{background:var(--zr-v3-orange)!important;opacity:1!important}

    html.zr-admin-shell-mounted body #adminView #tab-sales-dashboard .zr-sales-year-value,
    html.zr-admin-shell-mounted body #adminView #zrSalesRevisitPanel .zr-sales-revisit-year{height:32px!important;border-color:#e2d9d0!important;border-radius:9px!important;background:#fff!important;color:#302c29!important}
    #tab-sales-dashboard.zr-sales-cafe-switching #zrSalesCafePanel{visibility:hidden!important}

    @media print{
      @page{size:A4 landscape;margin:8mm}
      body.zr-sales-printing{background:#fff!important}
      body.zr-sales-printing> *:not(#adminView){display:none!important}
      body.zr-sales-printing #adminView{display:block!important;margin:0!important;padding:0!important;max-width:none!important;width:auto!important;background:#fff!important}
      body.zr-sales-printing #adminView> *:not(#tab-sales-dashboard){display:none!important}
      body.zr-sales-printing #tab-sales-dashboard{display:block!important;margin:0!important;padding:0!important;width:281mm!important;max-width:281mm!important;background:#fff!important}
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-head{margin-bottom:4mm!important}
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-title{font-size:18pt!important}
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-subtitle{font-size:8pt!important}
      body.zr-sales-printing #zrSalesPrintBtn,
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-subtabs{display:none!important}
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-panel{display:none!important}
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-panel.active{display:block!important}
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-kpis{gap:2mm!important;margin-bottom:3mm!important}
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-kpi{min-height:0!important;padding:2.5mm!important;border-radius:2mm!important;break-inside:avoid!important}
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-kpi span{font-size:7pt!important}
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-kpi strong{font-size:12pt!important}
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-kpi small{font-size:6pt!important}
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-grid2{gap:3mm!important}
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-card{padding:3mm!important;border-radius:2mm!important;break-inside:avoid!important;box-shadow:none!important}
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-card h3{font-size:10pt!important}
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-card .help{font-size:6.5pt!important}
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-pie{width:42mm!important}
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-legend-row{font-size:7pt!important}
      body.zr-sales-printing #tab-sales-dashboard table{font-size:7pt!important}
      body.zr-sales-printing #tab-sales-dashboard table th,
      body.zr-sales-printing #tab-sales-dashboard table td{padding:1.8mm 2mm!important}
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-table-scroll{max-height:none!important;overflow:visible!important}
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-filter{margin-bottom:3mm!important}
      body.zr-sales-printing #tab-sales-dashboard .zr-sales-note{font-size:6.5pt!important}
    }
  `;document.head.appendChild(s);
}
function exactText(el){return String(el?.textContent||'').replace(/\s+/g,'').trim()}
function isArrowOnly(btn){return !!btn&&btn.tagName==='BUTTON'&&['‹','›','←','→','❮','❯'].includes(exactText(btn))}
function paintArrow(btn,hover=false){
  if(!btn)return;
  const bg=hover?WINE_DARK:WINE;
  const set=(k,v)=>btn.style.setProperty(k,v,'important');
  set('width','32px');set('height','32px');set('min-width','32px');set('min-height','32px');set('padding','0');
  set('border','1px solid '+bg);set('border-radius','9px');set('background',bg);set('color','#fff');set('-webkit-text-fill-color','#fff');
  set('font-size','20px');set('font-weight','850');set('line-height','1');set('box-shadow','0 4px 10px rgba(71,9,16,.18)');
  set('display','inline-grid');set('place-items','center');set('opacity','1');set('visibility','visible');
}
function decorateButton(btn){
  if(!btn)return;
  if(!isArrowOnly(btn)&&!['zrTodayPrev','zrTodayNext','zrscPrev','zrscNext'].includes(btn.id))return;
  btn.classList.add('zr-admin-menu-arrow');
  paintArrow(btn,false);
  if(btn.dataset.zrWineArrowBound==='1')return;
  btn.dataset.zrWineArrowBound='1';
  btn.addEventListener('mouseenter',()=>paintArrow(btn,true));
  btn.addEventListener('mouseleave',()=>paintArrow(btn,false));
  btn.addEventListener('focus',()=>paintArrow(btn,true));
  btn.addEventListener('blur',()=>paintArrow(btn,false));
}
function decorateArrows(root=document){
  ['zrTodayPrev','zrTodayNext','zrscPrev','zrscNext'].forEach(id=>decorateButton($(id)));
  if(root?.nodeType===1&&root.matches?.('button'))decorateButton(root);
  root?.querySelectorAll?.('button').forEach(decorateButton);
}
function percentagesFromLegend(scope){
  const rows=[...(scope?.querySelectorAll?.('.zr-sales-legend-row')||[])];
  return rows.map(r=>parseFloat(String(r.querySelector('b')?.textContent||'').replace('%',''))).filter(Number.isFinite);
}
function recolorPie(p){
  if(!p?.classList?.contains('zr-sales-pie')||p.classList.contains('zr-sales-pie-empty'))return;
  const scope=p.closest('.zr-sales-card')||p.parentElement;
  const values=percentagesFromLegend(scope);if(!values.length)return;
  let acc=0;
  const parts=values.map((v,i)=>{
    const start=acc;acc+=v;const end=i===values.length-1?100:Math.min(100,acc);
    return `${PALETTE[i%PALETTE.length]} ${start}% ${end}%`;
  });
  p.style.setProperty('background',`conic-gradient(${parts.join(',')})`,'important');
  scope?.querySelectorAll('.zr-sales-dot').forEach((dot,i)=>dot.style.setProperty('background',PALETTE[i%PALETTE.length],'important'));
}
function recolorCharts(root=document){
  if(root?.nodeType===1&&root.matches?.('.zr-sales-pie'))recolorPie(root);
  root?.querySelectorAll?.('.zr-sales-pie').forEach(recolorPie);
}
function prepareSalesPrint(){
  const sec=$('tab-sales-dashboard');if(!sec||sec.classList.contains('hidden'))return;
  finishVisuals(sec);
  document.body.classList.add('zr-sales-printing');
  setTimeout(()=>window.print(),30);
}
function ensurePrintButton(){
  const sec=$('tab-sales-dashboard'),head=sec?.querySelector('.zr-sales-head');if(!head)return false;
  let btn=$('zrSalesPrintBtn');
  if(!btn){
    btn=document.createElement('button');btn.id='zrSalesPrintBtn';btn.type='button';btn.className='btn-primary';btn.textContent='인쇄하기';
    btn.setAttribute('aria-label','현재 매출 현황 인쇄하기');btn.addEventListener('click',prepareSalesPrint);head.appendChild(btn);
  }
  return true;
}
function finishVisuals(root=document){injectStyle();ensurePrintButton();decorateArrows(root);recolorCharts(root)}
function cafeSwitchStart(){
  const sec=$('tab-sales-dashboard');if(!sec)return;
  sec.classList.add('zr-sales-cafe-switching');
  requestAnimationFrame(()=>finishVisuals(sec));
  setTimeout(()=>{finishVisuals(sec);sec.classList.remove('zr-sales-cafe-switching')},80);
}
function isCafeTrigger(target){return !!target?.closest?.('[data-zr-sales-mode="cafe"],[data-zr-sales-rail-mode="cafe"]')}
function installObserver(){
  if(observer)return true;
  const root=$('adminView');if(!root)return false;
  observer=new MutationObserver(muts=>{
    muts.forEach(m=>m.addedNodes.forEach(node=>{
      if(node.nodeType!==1)return;
      finishVisuals(node);
      const sales=node.closest?.('#tab-sales-dashboard')||node.querySelector?.('#tab-sales-dashboard');if(sales)recolorCharts(sales);
    }));
  });
  observer.observe(root,{childList:true,subtree:true});
  return true;
}
function bind(){
  if(bound)return;bound=true;
  window.addEventListener('afterprint',()=>document.body.classList.remove('zr-sales-printing'));
  document.addEventListener('click',e=>{
    if(isCafeTrigger(e.target))cafeSwitchStart();
    if(e.target?.closest?.('#zrAdminShellRail [data-zr-admin-item],#adminView .admin-tabs button,[data-zr-sales-mode],[data-zr-sales-rail-mode],[data-zr-revisit-step],.zr-sales-year-stepper button')){
      requestAnimationFrame(()=>finishVisuals($('adminView')||document));
      setTimeout(()=>finishVisuals($('adminView')||document),40);
    }
  },true);
  document.addEventListener('change',e=>{
    if(e.target?.closest?.('#tab-sales-dashboard')){
      requestAnimationFrame(()=>finishVisuals($('tab-sales-dashboard')||document));
      setTimeout(()=>finishVisuals($('tab-sales-dashboard')||document),40);
    }
  },true);
}
function boot(){
  bind();finishVisuals();
  if(!installObserver()){
    let tries=0;observeTimer=setInterval(()=>{tries++;finishVisuals();if(installObserver()||tries>80){clearInterval(observeTimer);observeTimer=null}},100);
  }
  [80,200,500,1000].forEach(ms=>setTimeout(()=>finishVisuals($('adminView')||document),ms));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,20),{once:true});
})();
