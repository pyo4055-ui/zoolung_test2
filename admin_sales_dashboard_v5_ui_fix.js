(()=>{
'use strict';
if(window.__ZR_ADMIN_SALES_DASHBOARD_V5_UI_FIX)return;
window.__ZR_ADMIN_SALES_DASHBOARD_V5_UI_FIX=true;
const $=id=>document.getElementById(id);
const PALETTE=['#470910','#fc5404','#f28a3b','#f6a85f','#c76e36','#9a4e2e','#f6c18d','#d98b55','#7a3528','#ffd5ae'];
let bound=false;

function injectStyle(){
  if($('zrAdminSalesDashboardV5UiFixStyle'))return;
  const s=document.createElement('style');s.id='zrAdminSalesDashboardV5UiFixStyle';s.textContent=`
    /* Sales pages use the same neutral admin language as reservation/activity screens. */
    #tab-sales-dashboard .zr-sales-title{font-size:24px!important;color:var(--zr-v3-text,#342f2b)!important;letter-spacing:-.03em!important}
    #tab-sales-dashboard .zr-sales-subtitle{color:var(--zr-v3-muted,#766d66)!important}
    #tab-sales-dashboard .zr-sales-filter,
    #zrSalesRevisitPanel .zr-sales-revisit-compare-head{padding:12px!important;border:1px solid var(--zr-v3-line,#e2d9d0)!important;border-radius:12px!important;background:#fff!important;box-shadow:none!important}
    #tab-sales-dashboard .zr-sales-filter label,
    #zrSalesRevisitPanel .zr-sales-revisit-yearbox{color:var(--zr-v3-muted,#766d66)!important}
    #tab-sales-dashboard .zr-sales-kpis{gap:10px!important}
    #tab-sales-dashboard .zr-sales-kpi{min-height:84px!important;padding:12px 14px!important;border:1px solid var(--zr-v3-line,#e2d9d0)!important;border-radius:12px!important;background:#fff!important;box-shadow:none!important}
    #tab-sales-dashboard .zr-sales-kpi span{color:var(--zr-v3-muted,#766d66)!important}
    #tab-sales-dashboard .zr-sales-kpi strong{margin-top:5px!important;font-size:18px!important;color:var(--zr-v3-text,#342f2b)!important}
    #tab-sales-dashboard .zr-sales-kpi small{color:#8a817a!important}
    #tab-sales-dashboard .zr-sales-card{padding:14px!important;border:1px solid var(--zr-v3-line,#e2d9d0)!important;border-radius:12px!important;background:#fff!important;box-shadow:none!important}
    #tab-sales-dashboard .zr-sales-card h3{color:var(--zr-v3-text,#342f2b)!important}
    #tab-sales-dashboard .zr-sales-note{padding:9px 2px!important;background:transparent!important;color:var(--zr-v3-muted,#766d66)!important;border-radius:0!important}
    #tab-sales-dashboard thead th{background:#f7f5f2!important;color:var(--zr-v3-muted,#766d66)!important}
    #tab-sales-dashboard .zr-sales-table-scroll{border-color:var(--zr-v3-line,#e2d9d0)!important;border-radius:10px!important}
    #tab-sales-dashboard .zr-sales-legend-row b{color:#6d625c!important}
    #tab-sales-dashboard .zr-sales-pie-empty{background:#ece9e5!important}

    /* Sales submenu follows the same sidebar rule as the other submenu groups. */
    #zrSalesDashboardRailWrap{--zr-sub-color:var(--zr-v3-green)!important;--zr-sub-soft:#fff7ef!important}
    #zrSalesDashboardRailWrap .zr-admin-shell-submenu-inner{border-left-color:#efc6a5!important}
    #zrSalesDashboardRailWrap .zr-admin-shell-subitem:before{background:var(--zr-v3-green)!important;opacity:.42!important}
    #zrSalesDashboardRailWrap .zr-admin-shell-subitem:hover{background:#fff7ef!important;color:var(--zr-v3-green)!important}
    #zrSalesDashboardRailWrap .zr-admin-shell-subitem.is-active{background:#fff1e5!important;color:var(--zr-v3-green)!important;box-shadow:inset 3px 0 0 var(--zr-v3-orange)!important}
    #zrSalesDashboardRailWrap .zr-admin-shell-subitem.is-active:before{background:var(--zr-v3-orange)!important;opacity:1!important}

    /* Every arrow-only admin control uses the exact visual language of the sidebar collapse arrow. */
    html.zr-admin-shell-mounted #adminView button.zr-admin-menu-arrow,
    html.zr-admin-shell-mounted #adminView button.zr-admin-menu-arrow.zr-safari-role-date-nav,
    html.zr-admin-shell-mounted #adminView .zr-sales-year-stepper button.zr-admin-menu-arrow,
    html.zr-admin-shell-mounted #adminView #zrSalesRevisitPanel button.zr-admin-menu-arrow{
      width:32px!important;height:32px!important;min-width:32px!important;min-height:32px!important;padding:0!important;
      border:1px solid var(--zr-v3-brown)!important;border-radius:9px!important;background:var(--zr-v3-brown)!important;
      color:#fff!important;-webkit-text-fill-color:#fff!important;font-size:20px!important;font-weight:850!important;line-height:1!important;
      box-shadow:0 4px 10px rgba(71,9,16,.18)!important;display:inline-grid!important;place-items:center!important;transition:background .12s ease,border-color .12s ease!important;
    }
    html.zr-admin-shell-mounted #adminView button.zr-admin-menu-arrow:hover,
    html.zr-admin-shell-mounted #adminView .zr-sales-year-stepper button.zr-admin-menu-arrow:hover,
    html.zr-admin-shell-mounted #adminView #zrSalesRevisitPanel button.zr-admin-menu-arrow:hover{
      background:var(--zr-v3-brown-dark)!important;border-color:var(--zr-v3-brown-dark)!important;color:#fff!important;-webkit-text-fill-color:#fff!important;
    }
    html.zr-admin-shell-mounted #adminView .zr-sales-year-stepper:has(button:hover) button.zr-admin-menu-arrow:not(:hover),
    html.zr-admin-shell-mounted #adminView #zrSalesRevisitPanel .zr-sales-revisit-yearctl:has(button:hover) button.zr-admin-menu-arrow:not(:hover){
      background:var(--zr-v3-brown)!important;border-color:var(--zr-v3-brown)!important;color:#fff!important;-webkit-text-fill-color:#fff!important;
    }
    #tab-sales-dashboard .zr-sales-year-value,
    #zrSalesRevisitPanel .zr-sales-revisit-year{height:32px!important;border-color:var(--zr-v3-line,#e2d9d0)!important;border-radius:9px!important;background:#fff!important;color:var(--zr-v3-text,#342f2b)!important}
    #tab-sales-dashboard.zr-sales-cafe-switching #zrSalesCafePanel{visibility:hidden!important}
  `;document.head.appendChild(s);
}
function exactText(el){return String(el?.textContent||'').replace(/\s+/g,'').trim()}
function decorateArrows(){
  document.querySelectorAll('#adminView button').forEach(btn=>{
    if(['‹','›','←','→','❮','❯'].includes(exactText(btn)))btn.classList.add('zr-admin-menu-arrow');
  });
}
function parseStops(bg){
  const out=[];
  const re=/(?:#[0-9a-fA-F]{3,8}|rgba?\([^\)]+\))\s+([\d.]+%)\s+([\d.]+%)/g;
  let m;while((m=re.exec(bg)))out.push([m[1],m[2]]);return out;
}
function recolorCharts(){
  document.querySelectorAll('#tab-sales-dashboard .zr-sales-pie').forEach(p=>{
    const bg=p.style.background||p.style.backgroundImage||'';
    if(!bg.includes('conic-gradient'))return;
    const stops=parseStops(bg);if(stops.length)p.style.background=`conic-gradient(${stops.map((x,i)=>`${PALETTE[i%PALETTE.length]} ${x[0]} ${x[1]}`).join(',')})`;
    const scope=p.closest('.zr-sales-card')||p.parentElement;
    scope?.querySelectorAll('.zr-sales-dot').forEach((dot,i)=>dot.style.background=PALETTE[i%PALETTE.length]);
  });
}
function finishVisuals(){injectStyle();decorateArrows();recolorCharts()}
function cafeSwitchStart(){
  const sec=$('tab-sales-dashboard');if(!sec)return;
  sec.classList.add('zr-sales-cafe-switching');
  queueMicrotask(finishVisuals);
  setTimeout(()=>{finishVisuals();sec.classList.remove('zr-sales-cafe-switching')},32);
  setTimeout(finishVisuals,70);
}
function isCafeTrigger(target){
  const el=target?.closest?.('[data-zr-sales-mode="cafe"],[data-zr-sales-rail-mode="cafe"]');return !!el;
}
function bind(){
  if(bound)return;bound=true;
  document.addEventListener('click',e=>{
    if(isCafeTrigger(e.target))cafeSwitchStart();
    if(e.target?.closest?.('#zrAdminShellRail [data-zr-admin-item],#adminView .admin-tabs button,[data-zr-sales-mode],[data-zr-sales-rail-mode],[data-zr-revisit-step],.zr-sales-year-stepper button')){
      queueMicrotask(finishVisuals);setTimeout(finishVisuals,30);setTimeout(finishVisuals,70);
    }
  },true);
  document.addEventListener('change',e=>{if(e.target?.closest?.('#tab-sales-dashboard')){queueMicrotask(finishVisuals);setTimeout(finishVisuals,30);setTimeout(finishVisuals,70)}},true);
}
function boot(){bind();finishVisuals();[80,220,500,1000].forEach(ms=>setTimeout(finishVisuals,ms))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,20),{once:true});
})();
