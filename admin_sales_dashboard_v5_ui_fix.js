(()=>{
'use strict';
if(window.__ZR_ADMIN_SALES_DASHBOARD_V5_UI_FIX)return;
window.__ZR_ADMIN_SALES_DASHBOARD_V5_UI_FIX=true;
const $=id=>document.getElementById(id);
const PALETTE=['#470910','#fc5404','#f58b3a','#f7ad66','#f7c892','#8f5a32','#c97945','#e8a66b','#f3c28f','#a56542'];
let bound=false,observer=null,observeTimer=null;

function injectStyle(){
  if($('zrAdminSalesDashboardV5UiFixStyle'))return;
  const s=document.createElement('style');s.id='zrAdminSalesDashboardV5UiFixStyle';s.textContent=`
    /* Sales uses the same quiet workspace language as the existing admin tabs. */
    #tab-sales-dashboard .zr-sales-title{font-size:27px!important;color:#211f1c!important;letter-spacing:-.04em!important}
    #tab-sales-dashboard .zr-sales-subtitle{color:var(--zr-v3-muted,#766d66)!important}
    #tab-sales-dashboard .zr-sales-filter,
    #zrSalesRevisitPanel .zr-sales-revisit-compare-head{
      padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;
      display:flex!important;align-items:flex-end!important;gap:10px!important;flex-wrap:wrap!important;margin-bottom:12px!important;
    }
    #tab-sales-dashboard .zr-sales-filter label,
    #zrSalesRevisitPanel .zr-sales-revisit-yearbox{
      color:#4d4945!important;background:#fff!important;border:1px solid #e1d8d0!important;border-radius:12px!important;
      padding:9px 11px!important;box-sizing:border-box!important;min-width:150px!important;
    }
    #tab-sales-dashboard .zr-sales-filter input{min-height:38px!important;margin-top:5px!important}
    #tab-sales-dashboard .zr-sales-kpis{gap:10px!important;margin-bottom:12px!important}
    #tab-sales-dashboard .zr-sales-kpi{
      min-height:86px!important;padding:13px 14px!important;border:1px solid #e1d8d0!important;border-radius:14px!important;
      background:#fff!important;box-shadow:0 5px 18px rgba(53,43,35,.035)!important;
    }
    #tab-sales-dashboard .zr-sales-kpi:first-child{box-shadow:inset 0 3px 0 var(--zr-v3-orange,#fc5404),0 5px 18px rgba(53,43,35,.04)!important}
    #tab-sales-dashboard .zr-sales-kpi span{color:#716963!important}
    #tab-sales-dashboard .zr-sales-kpi strong{margin-top:5px!important;font-size:19px!important;color:#302c29!important}
    #tab-sales-dashboard .zr-sales-kpi small{color:#8a817a!important}
    #tab-sales-dashboard .zr-sales-card{
      padding:15px!important;border:1px solid #e1d8d0!important;border-radius:14px!important;background:#fff!important;
      box-shadow:0 5px 18px rgba(53,43,35,.03)!important;
    }
    #tab-sales-dashboard .zr-sales-card h3{color:#302c29!important;font-size:15px!important}
    #tab-sales-dashboard .zr-sales-note{padding:9px 2px!important;background:transparent!important;color:var(--zr-v3-muted,#766d66)!important;border-radius:0!important}
    #tab-sales-dashboard thead th{background:#f7f3ee!important;color:#6f6862!important}
    #tab-sales-dashboard .zr-sales-table-scroll{border-color:#e1d8d0!important;border-radius:11px!important}
    #tab-sales-dashboard .zr-sales-legend-row b{color:#6d625c!important}
    #tab-sales-dashboard .zr-sales-pie-empty{background:#ece9e5!important}

    /* Sales submenu follows the exact same current sidebar language. */
    #zrSalesDashboardRailWrap{--zr-sub-color:var(--zr-v3-green)!important;--zr-sub-soft:#fff7ef!important}
    #zrSalesDashboardRailWrap .zr-admin-shell-submenu-inner{border-left-color:#efc6a5!important}
    #zrSalesDashboardRailWrap .zr-admin-shell-subitem:before{background:var(--zr-v3-green)!important;opacity:.42!important}
    #zrSalesDashboardRailWrap .zr-admin-shell-subitem:hover{background:#fff7ef!important;color:var(--zr-v3-green)!important}
    #zrSalesDashboardRailWrap .zr-admin-shell-subitem.is-active{background:#fff1e5!important;color:var(--zr-v3-green)!important;box-shadow:inset 3px 0 0 var(--zr-v3-orange)!important}
    #zrSalesDashboardRailWrap .zr-admin-shell-subitem.is-active:before{background:var(--zr-v3-orange)!important;opacity:1!important}

    /* Arrow-only controls: same wine square as the sidebar collapse control. IDs cover async-created Today/Schedule controls directly. */
    html.zr-admin-shell-mounted body #adminView #zrTodayPrev,
    html.zr-admin-shell-mounted body #adminView #zrTodayNext,
    html.zr-admin-shell-mounted body #adminView #zrscPrev,
    html.zr-admin-shell-mounted body #adminView #zrscNext,
    html.zr-admin-shell-mounted body #adminView button.zr-admin-menu-arrow,
    html.zr-admin-shell-mounted body #adminView .zr-sales-year-stepper button,
    html.zr-admin-shell-mounted body #adminView #zrSalesRevisitPanel [data-zr-revisit-step]{
      width:32px!important;height:32px!important;min-width:32px!important;min-height:32px!important;padding:0!important;
      border:1px solid var(--zr-v3-brown,#470910)!important;border-radius:9px!important;background:var(--zr-v3-brown,#470910)!important;
      color:#fff!important;-webkit-text-fill-color:#fff!important;font-size:20px!important;font-weight:850!important;line-height:1!important;
      box-shadow:0 4px 10px rgba(71,9,16,.18)!important;display:inline-grid!important;place-items:center!important;
      transition:background .12s ease,border-color .12s ease!important;
    }
    html.zr-admin-shell-mounted body #adminView #zrTodayPrev:hover,
    html.zr-admin-shell-mounted body #adminView #zrTodayNext:hover,
    html.zr-admin-shell-mounted body #adminView #zrscPrev:hover,
    html.zr-admin-shell-mounted body #adminView #zrscNext:hover,
    html.zr-admin-shell-mounted body #adminView button.zr-admin-menu-arrow:hover,
    html.zr-admin-shell-mounted body #adminView .zr-sales-year-stepper button:hover,
    html.zr-admin-shell-mounted body #adminView #zrSalesRevisitPanel [data-zr-revisit-step]:hover{
      background:var(--zr-v3-brown-dark,#300206)!important;border-color:var(--zr-v3-brown-dark,#300206)!important;
      color:#fff!important;-webkit-text-fill-color:#fff!important;
    }
    html.zr-admin-shell-mounted body #adminView .zr-sales-year-stepper:has(button:hover) button:not(:hover),
    html.zr-admin-shell-mounted body #adminView #zrSalesRevisitPanel .zr-sales-revisit-yearctl:has(button:hover) button:not(:hover){
      background:var(--zr-v3-brown,#470910)!important;border-color:var(--zr-v3-brown,#470910)!important;color:#fff!important;-webkit-text-fill-color:#fff!important;
    }
    #tab-sales-dashboard .zr-sales-year-value,
    #zrSalesRevisitPanel .zr-sales-revisit-year{height:32px!important;border-color:#e1d8d0!important;border-radius:9px!important;background:#fff!important;color:#302c29!important}
    #tab-sales-dashboard.zr-sales-cafe-switching #zrSalesCafePanel{visibility:hidden!important}
  `;document.head.appendChild(s);
}
function exactText(el){return String(el?.textContent||'').replace(/\s+/g,'').trim()}
function isArrowOnly(btn){return !!btn&&btn.tagName==='BUTTON'&&['‹','›','←','→','❮','❯'].includes(exactText(btn))}
function decorateButton(btn){if(isArrowOnly(btn))btn.classList.add('zr-admin-menu-arrow')}
function decorateArrows(root=document){
  if(root?.nodeType===1&&root.matches?.('button'))decorateButton(root);
  root?.querySelectorAll?.('button').forEach(decorateButton);
}
function parseStops(bg){
  const out=[];
  const re=/(?:#[0-9a-fA-F]{3,8}|rgba?\([^\)]+\)|[a-zA-Z]+)\s+([\d.]+%)\s+([\d.]+%)/g;
  let m;while((m=re.exec(bg)))out.push([m[1],m[2]]);return out;
}
function recolorPie(p){
  if(!p?.classList?.contains('zr-sales-pie'))return;
  const bg=p.style.background||p.style.backgroundImage||getComputedStyle(p).backgroundImage||'';
  if(!bg.includes('conic-gradient'))return;
  const stops=parseStops(bg);if(!stops.length)return;
  p.style.setProperty('background',`conic-gradient(${stops.map((x,i)=>`${PALETTE[i%PALETTE.length]} ${x[0]} ${x[1]}`).join(',')})`,'important');
  const scope=p.closest('.zr-sales-card')||p.parentElement;
  scope?.querySelectorAll('.zr-sales-dot').forEach((dot,i)=>dot.style.setProperty('background',PALETTE[i%PALETTE.length],'important'));
}
function recolorCharts(root=document){
  if(root?.nodeType===1&&root.matches?.('.zr-sales-pie'))recolorPie(root);
  root?.querySelectorAll?.('.zr-sales-pie').forEach(recolorPie);
}
function finishVisuals(root=document){injectStyle();decorateArrows(root);recolorCharts(root)}
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
      const parent=node.parentElement;if(parent?.closest?.('#tab-sales-dashboard'))recolorCharts(parent.closest('#tab-sales-dashboard'));
    }));
  });
  observer.observe(root,{childList:true,subtree:true});
  return true;
}
function bind(){
  if(bound)return;bound=true;
  document.addEventListener('click',e=>{
    if(isCafeTrigger(e.target))cafeSwitchStart();
    if(e.target?.closest?.('#zrAdminShellRail [data-zr-admin-item],#adminView .admin-tabs button,[data-zr-sales-mode],[data-zr-sales-rail-mode],[data-zr-revisit-step],.zr-sales-year-stepper button')){
      requestAnimationFrame(()=>finishVisuals($('adminView')||document));
      setTimeout(()=>finishVisuals($('adminView')||document),60);
    }
  },true);
  document.addEventListener('change',e=>{
    if(e.target?.closest?.('#tab-sales-dashboard')){
      requestAnimationFrame(()=>finishVisuals($('tab-sales-dashboard')||document));
      setTimeout(()=>finishVisuals($('tab-sales-dashboard')||document),60);
    }
  },true);
}
function boot(){
  bind();finishVisuals();
  if(!installObserver()){
    let tries=0;observeTimer=setInterval(()=>{tries++;finishVisuals();if(installObserver()||tries>80){clearInterval(observeTimer);observeTimer=null}},100);
  }
  [100,300,700,1400].forEach(ms=>setTimeout(()=>finishVisuals($('adminView')||document),ms));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,20),{once:true});
})();
