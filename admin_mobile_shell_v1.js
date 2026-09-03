(()=>{
'use strict';
if(window.__ZR_ADMIN_MOBILE_SHELL_V1)return;
window.__ZR_ADMIN_MOBILE_SHELL_V1=true;

const MAX_MOBILE=900;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let root=null,alerts=null,drawer=null,backdrop=null,quick=null,bell=null,menuBtn=null,badge=null;
let railObserver=null,countObserver=null,adminObserver=null,resizeTimer=0,started=false;

const GROUPS={
  operation:{label:'운영',items:[['today','오늘 운영'],['calendar','예약 캘린더'],['schedule','스케줄 관리'],['warning','경고']]},
  reservation:{label:'예약',items:[['activity','예약 현황'],['meals','식사 현황'],['cleanup','과거 예약 정리']]},
  customer:{label:'고객',items:[['inquiries','1:1 문의'],['previewVisit','사전답사 관리'],['guide','고객 안내 관리']]},
  sales:{label:'매출',items:[['salesDashboard','매출 현황'],['outsourcing','아웃소싱 결제대금'],['menuadmin','카페 메뉴 관리']]},
  settings:{label:'설정',items:[['settings','예약설정']]}
};
const BOTTOM=[
  ['operation','운영'],['reservation','예약'],['customer','고객'],['sales','매출'],['settings','설정']
];
const ALERTS=[
  ['activity','예약 대기','zrSmartPendingReservation'],
  ['inquiries','1:1 문의','zrSmartInquiry'],
  ['previewVisit','사전답사','zrSmartPreview']
];

function mobile(){return window.matchMedia(`(max-width:${MAX_MOBILE}px)`).matches}
function adminVisible(){
  const v=$('adminView');if(!v)return false;
  try{return !v.classList.contains('hidden')&&getComputedStyle(v).display!=='none'}catch{return false}
}
function icon(name){
  const common='viewBox="0 0 24 24" aria-hidden="true" focusable="false"';
  if(name==='operation')return `<svg ${common}><rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M8 3v5M16 3v5M4 10h16"/><path d="M8 14h3M13 14h3M8 17h3"/></svg>`;
  if(name==='reservation')return `<svg ${common}><path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>`;
  if(name==='customer')return `<svg ${common}><circle cx="9" cy="8" r="3"/><path d="M3.8 19c.6-3.6 2.3-5.4 5.2-5.4s4.6 1.8 5.2 5.4"/><circle cx="17.5" cy="9.5" r="2.2"/><path d="M16.5 14c2.6.2 4.1 1.8 4.4 4.5"/></svg>`;
  if(name==='sales')return `<svg ${common}><path d="M5 20V11M12 20V5M19 20v-7"/><path d="M3 20h18"/></svg>`;
  if(name==='settings')return `<svg ${common}><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A7 7 0 0 0 15 6l-.3-2.6h-4L10.5 6A7 7 0 0 0 9 7.1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1A7 7 0 0 0 10.5 18l.2 2.6h4L15 18a7 7 0 0 0 1.5-1.1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1z"/></svg>`;
  if(name==='menu')return `<svg ${common}><path d="M5 7h14M5 12h14M5 17h14"/></svg>`;
  if(name==='bell')return `<svg ${common}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M9.5 20h5"/></svg>`;
  return '';
}
function injectStyle(){
  if($('zrAdminMobileShellV1Style'))return;
  const s=document.createElement('style');s.id='zrAdminMobileShellV1Style';s.textContent=`
  .zr-admin-mobile-shell,.zr-admin-mobile-bottom,.zr-admin-mobile-alerts,.zr-admin-mobile-drawer-backdrop,.zr-admin-mobile-drawer,.zr-admin-mobile-quick{display:none}
  @media(max-width:${MAX_MOBILE}px){
    :root{--zam-wine:#701418;--zam-wine2:#5f0e12;--zam-orange:#f28a2e;--zam-brown:#38271e;--zam-bg:#f7f2ec;--zam-paper:#fffdf9;--zam-line:#eaded5;--zam-muted:#8a766b;--zam-shadow:0 8px 28px rgba(65,40,28,.08)}
    html.zr-admin-shell-mounted,html.zr-admin-shell-mounted body{background:var(--zam-bg)!important;color:#332925!important;overflow-x:hidden!important;overflow-y:auto!important;min-width:0!important;width:100%!important}
    html.zr-admin-mobile-overlay-open,html.zr-admin-mobile-overlay-open body{overflow:hidden!important}
    html.zr-admin-shell-mounted .zr-admin-shell-rail,
    html.zr-admin-shell-mounted .zr-admin-shell-header,
    html.zr-admin-shell-mounted .zr-admin-shell-editor,
    html.zr-admin-shell-mounted .zr-admin-smart-panel,
    html.zr-admin-shell-mounted #zrAdminSmartPanelV1{display:none!important;visibility:hidden!important;pointer-events:none!important}

    html.zr-admin-shell-mounted body #adminView{
      display:block!important;position:relative!important;inset:auto!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;transform:none!important;float:none!important;
      box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;min-height:100svh!important;height:auto!important;
      margin:0!important;margin-left:0!important;margin-right:0!important;
      padding:calc(70px + env(safe-area-inset-top)) 10px calc(82px + env(safe-area-inset-bottom))!important;
      background:var(--zam-bg)!important;border:0!important;border-radius:0!important;box-shadow:none!important;overflow-x:hidden!important;overflow-y:visible!important
    }
    html.zr-admin-shell-mounted #adminView .zr-admin-mobile-origin-tabs{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
    html.zr-admin-shell-mounted #adminView>section,
    html.zr-admin-shell-mounted #adminView>.zr-admin-workspace-fluid-wrapper,
    html.zr-admin-shell-mounted #adminView .zr-admin-workspace-fluid-section,
    html.zr-admin-shell-mounted #tab-today,
    html.zr-admin-shell-mounted #tab-today .zr-today-shell{
      position:relative!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;transform:none!important;float:none!important;
      width:100%!important;max-width:100%!important;min-width:0!important;margin-left:0!important;margin-right:0!important;box-sizing:border-box!important
    }
    html.zr-admin-shell-mounted #adminView table{max-width:100%}

    .zr-admin-mobile-shell{position:fixed!important;left:0!important;right:0!important;top:0!important;z-index:180!important;height:calc(60px + env(safe-area-inset-top))!important;padding:env(safe-area-inset-top) 12px 0 15px!important;box-sizing:border-box!important;align-items:center!important;justify-content:space-between!important;background:rgba(255,253,249,.98)!important;border-bottom:1px solid var(--zam-line)!important;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
    html.zr-admin-shell-mounted .zr-admin-mobile-shell{display:flex!important}
    .zr-admin-mobile-logo{display:block!important;width:118px!important;height:44px!important;object-fit:contain!important;object-position:left center!important}
    .zr-admin-mobile-actions{display:flex;align-items:center;gap:2px}
    .zr-admin-mobile-icon-btn{position:relative;width:42px!important;height:42px!important;min-width:42px!important;padding:0!important;margin:0!important;border:0!important;border-radius:12px!important;background:transparent!important;color:var(--zam-wine)!important;display:grid!important;place-items:center!important;box-shadow:none!important}
    .zr-admin-mobile-icon-btn:active,.zr-admin-mobile-icon-btn.is-open{background:#f7e9df!important}
    .zr-admin-mobile-icon-btn svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    .zr-admin-mobile-bell-badge{position:absolute;right:3px;top:3px;min-width:17px;height:17px;padding:0 4px;border:2px solid var(--zam-paper);border-radius:999px;background:#ef4444;color:#fff;font-size:9px;font-weight:950;line-height:13px;text-align:center;box-sizing:border-box}
    .zr-admin-mobile-bell-badge[hidden]{display:none!important}

    .zr-admin-mobile-alerts{position:fixed;z-index:205;top:calc(56px + env(safe-area-inset-top));right:10px;width:min(330px,calc(100vw - 20px));padding:9px;background:var(--zam-paper);border:1px solid var(--zam-line);border-radius:18px;box-shadow:0 18px 50px rgba(56,39,30,.18);box-sizing:border-box}
    .zr-admin-mobile-alerts.is-open{display:block}
    .zr-admin-mobile-alert-head{display:flex;align-items:center;justify-content:space-between;padding:7px 8px 10px;border-bottom:1px solid #f0e7e0}.zr-admin-mobile-alert-head b{font-size:14px;color:var(--zam-brown)}.zr-admin-mobile-alert-head span{font-size:10px;color:var(--zam-muted)}
    .zr-admin-mobile-alert-list{display:grid;gap:5px;padding-top:7px}
    .zr-admin-mobile-alert-row{width:100%;min-height:48px;padding:8px 10px!important;border:0!important;border-radius:11px!important;background:#fffaf6!important;color:#58483f!important;box-shadow:none!important;display:flex!important;align-items:center!important;gap:9px!important;text-align:left!important;font-size:12px!important;font-weight:850!important}
    .zr-admin-mobile-alert-dot{width:8px;height:8px;border-radius:999px;background:var(--zam-orange);flex:none}.zr-admin-mobile-alert-row:nth-child(2) .zr-admin-mobile-alert-dot{background:var(--zam-wine)}.zr-admin-mobile-alert-row:nth-child(3) .zr-admin-mobile-alert-dot{background:#a56a3f}
    .zr-admin-mobile-alert-row strong{margin-left:auto;font-size:16px;color:var(--zam-wine);font-weight:950}.zr-admin-mobile-alert-row:after{content:'›';font-size:22px;line-height:1;color:#a39186}

    .zr-admin-mobile-bottom{position:fixed!important;left:0!important;right:0!important;bottom:0!important;z-index:185!important;height:calc(68px + env(safe-area-inset-bottom))!important;padding:0 4px env(safe-area-inset-bottom)!important;box-sizing:border-box!important;background:rgba(255,253,249,.98)!important;border-top:1px solid var(--zam-line)!important;box-shadow:0 -5px 20px rgba(64,42,31,.05)!important;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
    html.zr-admin-shell-mounted .zr-admin-mobile-bottom{display:grid!important;grid-template-columns:repeat(5,1fr)!important}
    .zr-admin-mobile-nav{position:relative;border:0!important;border-radius:0!important;background:transparent!important;color:#6f5d53!important;box-shadow:none!important;padding:7px 2px 5px!important;min-width:0!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:3px!important;font-size:10px!important;font-weight:850!important;line-height:1.1!important}
    .zr-admin-mobile-nav svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
    .zr-admin-mobile-nav.is-active{color:#fff!important;background:linear-gradient(180deg,#7b1518,#650d10)!important;border-radius:12px!important;margin:5px 3px!important;padding-top:3px!important;padding-bottom:3px!important}

    .zr-admin-mobile-quick{position:fixed;left:10px;right:10px;bottom:calc(72px + env(safe-area-inset-bottom));z-index:192;padding:9px;background:var(--zam-paper);border:1px solid var(--zam-line);border-radius:17px;box-shadow:0 14px 38px rgba(56,39,30,.16);box-sizing:border-box}
    .zr-admin-mobile-quick.is-open{display:block}
    .zr-admin-mobile-quick-head{display:flex;align-items:center;justify-content:space-between;padding:4px 5px 8px}.zr-admin-mobile-quick-head b{font-size:13px;color:var(--zam-wine)}.zr-admin-mobile-quick-head span{font-size:10px;color:var(--zam-muted)}
    .zr-admin-mobile-quick-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
    .zr-admin-mobile-quick-row{min-height:44px!important;margin:0!important;padding:8px 10px!important;border:1px solid #eaded5!important;border-radius:11px!important;background:#fffaf6!important;color:#523d33!important;box-shadow:none!important;text-align:left!important;font-size:12px!important;font-weight:850!important}
    .zr-admin-mobile-quick-row.is-current{border-color:#e3bba0!important;background:#fff0e3!important;color:var(--zam-wine)!important}

    .zr-admin-mobile-drawer-backdrop{position:fixed;inset:0;z-index:195;background:rgba(41,27,20,.30);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}
    .zr-admin-mobile-drawer-backdrop.is-open{display:block}
    .zr-admin-mobile-drawer{position:fixed;z-index:200;top:calc(66px + env(safe-area-inset-top));right:8px;bottom:calc(76px + env(safe-area-inset-bottom));left:auto;width:min(360px,calc(100vw - 24px));padding:12px 11px 15px;box-sizing:border-box;overflow:auto;overscroll-behavior:contain;background:var(--zam-paper);border:1px solid var(--zam-line);border-radius:22px;box-shadow:0 24px 70px rgba(56,39,30,.24)}
    .zr-admin-mobile-drawer.is-open{display:block}
    .zr-admin-mobile-drawer-head{display:flex;align-items:center;justify-content:space-between;padding:2px 5px 10px}.zr-admin-mobile-drawer-head b{color:var(--zam-wine);font-size:15px}.zr-admin-mobile-drawer-head span{color:var(--zam-muted);font-size:10px}
    .zr-admin-mobile-drawer-search{position:sticky;top:-12px;z-index:2;padding:4px 0 10px;background:linear-gradient(var(--zam-paper) 85%,rgba(255,253,249,0))}
    .zr-admin-mobile-drawer-search input{width:100%!important;height:46px!important;min-height:46px!important;margin:0!important;padding:0 13px 0 38px!important;border:1px solid #e3d5cb!important;border-radius:12px!important;background:#fffdfa!important;color:#44342c!important;font-size:16px!important;line-height:1!important;box-shadow:none!important;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23967b6c' stroke-width='1.7' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m20 20-4-4'/%3E%3C/svg%3E")!important;background-repeat:no-repeat!important;background-position:12px center!important}
    .zr-admin-mobile-menu-group{padding:9px 1px 10px;border-top:1px solid #efe5dd}.zr-admin-mobile-menu-group:first-of-type{border-top:0}.zr-admin-mobile-menu-title{padding:0 7px 5px;color:var(--zam-wine);font-size:11px;font-weight:950}
    .zr-admin-mobile-menu-list{display:grid;gap:2px}.zr-admin-mobile-menu-row{width:100%;min-height:43px;padding:7px 8px!important;border:0!important;border-radius:10px!important;background:transparent!important;color:#4b3b33!important;box-shadow:none!important;display:flex!important;align-items:center!important;gap:9px!important;text-align:left!important;font-size:13px!important;font-weight:800!important}
    .zr-admin-mobile-menu-row:hover,.zr-admin-mobile-menu-row:active{background:#fff1e5!important;color:var(--zam-wine)!important}.zr-admin-mobile-menu-row.is-hidden-by-search{display:none!important}
    .zr-admin-mobile-menu-icon{width:24px;height:24px;display:grid;place-items:center;border-radius:7px;background:#fff2e5;color:#a45325;font-size:12px;font-weight:950;flex:none}.zr-admin-mobile-menu-row:after{content:'›';margin-left:auto;font-size:21px;line-height:1;color:#9d8a7e}
    .zr-admin-mobile-no-result{display:none;padding:24px 10px;text-align:center;color:var(--zam-muted);font-size:12px}.zr-admin-mobile-no-result.is-visible{display:block}

    #tab-today{margin-top:4px!important}
    #tab-today .zr-today-head{margin:0 2px 12px!important;gap:9px!important;align-items:stretch!important;flex-direction:column!important}
    #tab-today .zr-today-head h2{font-size:25px!important;letter-spacing:-.04em!important;color:var(--zam-wine)!important}
    #tab-today .zr-today-date-title{font-size:11px!important;color:var(--zam-muted)!important}
    #tab-today .zr-today-tools{display:grid!important;grid-template-columns:minmax(0,1fr) auto auto!important;gap:6px!important}
    #tab-today .zr-today-tools input{width:100%!important;min-width:0!important;height:40px!important;font-size:16px!important;border-color:#ead9cc!important;border-radius:10px!important;background:#fffdfa!important;color:#51382d!important}
    #tab-today .zr-today-tools button{min-height:40px!important;border-radius:10px!important}
    #tab-today .zr-today-db{grid-column:1/-1;justify-self:start!important;border-color:#dfd6cf!important;background:#fffaf6!important;color:#77665c!important}
    #tab-today .zr-today-summary{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;margin-bottom:10px!important}
    #tab-today .zr-today-metric{min-height:86px!important;padding:12px!important;border-color:#eaded5!important;border-radius:14px!important;background:var(--zam-paper)!important;box-shadow:0 5px 18px rgba(60,39,28,.045)!important}
    #tab-today .zr-today-metric.em{background:#fff4e9!important;border-color:#efd3bc!important}
    #tab-today .zr-today-metric:last-child{grid-column:1/-1!important}
    #tab-today .zr-today-metric label{color:#7b6960!important;font-size:10px!important}
    #tab-today .zr-today-metric strong{color:var(--zam-wine)!important;font-size:22px!important}
    #tab-today .zr-today-alertbox{border-color:#eaded5!important;background:var(--zam-paper)!important;border-radius:14px!important;box-shadow:0 5px 18px rgba(60,39,28,.045)!important}
    #tab-today .zr-today-list-head h3{color:var(--zam-wine)!important}
    #tab-today .zr-today-team-card{display:block!important;width:100%!important;max-width:100%!important;border-color:#eaded5!important;border-radius:15px!important;background:var(--zam-paper)!important;box-shadow:0 5px 18px rgba(60,39,28,.05)!important}
    #tab-today .zr-today-time{padding:11px 13px!important;flex-direction:row!important;align-items:center!important;justify-content:space-between!important;background:#f8efe8!important;border:0!important;border-bottom:1px solid #eaded5!important}
    #tab-today .zr-today-time strong{font-size:17px!important;color:var(--zam-wine)!important}#tab-today .zr-today-time span{margin:0!important}
    #tab-today .zr-today-main,#tab-today .zr-today-program,#tab-today .zr-today-views{padding:12px!important;border-right:0!important;border-bottom:1px solid #eee2d9!important}
    #tab-today .zr-today-org{color:#3d2b23!important}#tab-today .zr-today-schedule{background:#fffaf6!important;border-color:#eee2d9!important;padding:9px 11px 11px!important}

    #tab-sales-dashboard .zr-sales-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important}#tab-sales-dashboard .zr-sales-grid2{grid-template-columns:1fr!important}#tab-sales-dashboard .zr-sales-head{flex-direction:column!important;align-items:stretch!important}#tab-sales-dashboard .zr-sales-title{font-size:23px!important;color:var(--zam-wine)!important}#tab-sales-dashboard .zr-sales-pie-wrap{grid-template-columns:1fr!important}#tab-sales-dashboard .zr-sales-filter{padding:11px!important}#tab-sales-dashboard .zr-sales-subtabs{max-width:100%!important}
  }
  `;document.head.appendChild(s);
}

function railButton(id){return document.querySelector(`#zrAdminShellRail [data-zr-admin-item="${CSS.escape(id)}"]`)}
function go(id){const b=railButton(id);if(!b)return false;closeOverlays();b.click();setTimeout(syncActive,30);setTimeout(syncActive,180);return true}
function activeId(){const b=document.querySelector('#zrAdminShellRail [data-zr-admin-item].is-active');return b?.dataset.zrAdminItem||''}
function groupForId(id){
  for(const [key,g] of Object.entries(GROUPS))if(g.items.some(([item])=>item===id))return key;
  return'';
}
function syncActive(){
  const g=groupForId(activeId());
  document.querySelectorAll('#zrAdminMobileBottomV1 [data-mobile-group]').forEach(b=>b.classList.toggle('is-active',b.dataset.mobileGroup===g));
  if(quick?.classList.contains('is-open'))renderQuick(quick.dataset.group||'');
}
function countText(id){const el=$(id);const n=parseInt(String(el?.textContent||'0').replace(/[^0-9-]/g,''),10);return Number.isFinite(n)&&n>0?n:0}
function syncCounts(){
  if(!alerts||!badge)return;let total=0;
  ALERTS.forEach(([,label,countId])=>{const n=countText(countId);total+=n;const el=alerts.querySelector(`[data-mobile-count="${countId}"]`);if(el)el.textContent=String(n)});
  badge.textContent=total>99?'99+':String(total);badge.hidden=total===0;
}
function openAlerts(){if(!alerts)return;const on=!alerts.classList.contains('is-open');closeDrawer();closeQuick();alerts.classList.toggle('is-open',on);bell?.classList.toggle('is-open',on);bell?.setAttribute('aria-expanded',on?'true':'false')}
function closeAlerts(){alerts?.classList.remove('is-open');bell?.classList.remove('is-open');bell?.setAttribute('aria-expanded','false')}
function openDrawer(){if(!drawer||!backdrop)return;closeAlerts();closeQuick();drawer.classList.add('is-open');backdrop.classList.add('is-open');menuBtn?.classList.add('is-open');menuBtn?.setAttribute('aria-expanded','true');document.documentElement.classList.add('zr-admin-mobile-overlay-open')}
function closeDrawer(){drawer?.classList.remove('is-open');backdrop?.classList.remove('is-open');menuBtn?.classList.remove('is-open');menuBtn?.setAttribute('aria-expanded','false');document.documentElement.classList.remove('zr-admin-mobile-overlay-open')}
function renderQuick(group){
  if(!quick||!GROUPS[group])return;const g=GROUPS[group],active=activeId();quick.dataset.group=group;
  quick.innerHTML=`<div class="zr-admin-mobile-quick-head"><b>${esc(g.label)} 메뉴</b><span>이동할 메뉴 선택</span></div><div class="zr-admin-mobile-quick-list">${g.items.map(([id,label])=>`<button type="button" class="zr-admin-mobile-quick-row ${id===active?'is-current':''}" data-mobile-go="${id}">${esc(label)}</button>`).join('')}</div>`;
}
function openQuick(group){if(!GROUPS[group])return;closeAlerts();closeDrawer();renderQuick(group);quick.classList.add('is-open')}
function closeQuick(){quick?.classList.remove('is-open');if(quick)quick.dataset.group=''}
function closeOverlays(){closeAlerts();closeDrawer();closeQuick()}
function tagOriginalTabs(){const tabs=document.querySelector('#adminView .admin-tabs');if(tabs)tabs.classList.add('zr-admin-mobile-origin-tabs')}

function buildHeader(){
  const h=document.createElement('div');h.className='zr-admin-mobile-shell';h.id='zrAdminMobileShellV1';h.setAttribute('role','banner');
  h.innerHTML=`<img class="zr-admin-mobile-logo" src="https://zoolungzoolung.com/wp-content/themes/zoolungzoolung/assets/images/zoolung_logo_color.svg" alt="주렁주렁"><div class="zr-admin-mobile-actions"><button type="button" class="zr-admin-mobile-icon-btn" id="zrAdminMobileBell" aria-label="처리 대기 알림" aria-expanded="false">${icon('bell')}<span class="zr-admin-mobile-bell-badge" id="zrAdminMobileBellBadge" hidden>0</span></button><button type="button" class="zr-admin-mobile-icon-btn" id="zrAdminMobileMenuTrigger" aria-label="전체 메뉴" aria-expanded="false">${icon('menu')}</button></div>`;
  return h;
}
function buildAlerts(){
  const p=document.createElement('section');p.className='zr-admin-mobile-alerts';p.id='zrAdminMobileAlertsV1';p.setAttribute('aria-label','처리 대기 알림');
  p.innerHTML=`<div class="zr-admin-mobile-alert-head"><b>처리 대기 알림</b><span>눌러서 바로 이동</span></div><div class="zr-admin-mobile-alert-list">${ALERTS.map(([id,label,countId])=>`<button type="button" class="zr-admin-mobile-alert-row" data-mobile-go="${id}"><span class="zr-admin-mobile-alert-dot"></span><span>${esc(label)}</span><strong data-mobile-count="${countId}">0</strong></button>`).join('')}</div>`;
  return p;
}
function buildBottom(){
  const n=document.createElement('nav');n.className='zr-admin-mobile-bottom';n.id='zrAdminMobileBottomV1';n.setAttribute('aria-label','모바일 관리자 주요 메뉴');
  n.innerHTML=BOTTOM.map(([group,label])=>`<button type="button" class="zr-admin-mobile-nav" data-mobile-group="${group}">${icon(group)}<span>${label}</span></button>`).join('');return n;
}
function buildQuick(){const p=document.createElement('section');p.className='zr-admin-mobile-quick';p.id='zrAdminMobileQuickV1';p.setAttribute('aria-label','빠른 하위 메뉴');return p}
function buildDrawer(){
  backdrop=document.createElement('div');backdrop.className='zr-admin-mobile-drawer-backdrop';backdrop.id='zrAdminMobileDrawerBackdropV1';
  const d=document.createElement('section');d.className='zr-admin-mobile-drawer';d.id='zrAdminMobileDrawerV1';d.setAttribute('aria-label','전체 관리자 메뉴');
  d.innerHTML=`<div class="zr-admin-mobile-drawer-head"><b>전체 메뉴</b><span>모든 관리자 기능</span></div><div class="zr-admin-mobile-drawer-search"><input id="zrAdminMobileMenuSearch" type="search" autocomplete="off" inputmode="search" placeholder="전체 메뉴 검색"></div>${Object.entries(GROUPS).map(([key,g])=>`<section class="zr-admin-mobile-menu-group" data-mobile-menu-group><div class="zr-admin-mobile-menu-title">${esc(g.label)}</div><div class="zr-admin-mobile-menu-list">${g.items.map(([id,label],i)=>`<button type="button" class="zr-admin-mobile-menu-row" data-mobile-go="${id}" data-mobile-label="${esc(label.toLowerCase())}"><span class="zr-admin-mobile-menu-icon">${i+1}</span><span>${esc(label)}</span></button>`).join('')}</div></section>`).join('')}<div class="zr-admin-mobile-no-result" id="zrAdminMobileNoResult">검색 결과가 없습니다.</div>`;
  return d;
}
function filterDrawer(value){
  if(!drawer)return;const q=String(value||'').trim().toLowerCase();let visible=0;
  drawer.querySelectorAll('.zr-admin-mobile-menu-row').forEach(b=>{const show=!q||String(b.dataset.mobileLabel||'').includes(q);b.classList.toggle('is-hidden-by-search',!show);if(show)visible++});
  drawer.querySelectorAll('[data-mobile-menu-group]').forEach(g=>{g.hidden=![...g.querySelectorAll('.zr-admin-mobile-menu-row')].some(b=>!b.classList.contains('is-hidden-by-search'))});
  $('zrAdminMobileNoResult')?.classList.toggle('is-visible',visible===0);
}
function bind(){
  bell=$('zrAdminMobileBell');menuBtn=$('zrAdminMobileMenuTrigger');badge=$('zrAdminMobileBellBadge');
  bell?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openAlerts()});
  menuBtn?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();drawer?.classList.contains('is-open')?closeDrawer():openDrawer()});
  document.addEventListener('click',e=>{
    const bottom=e.target?.closest?.('#zrAdminMobileBottomV1 [data-mobile-group]');
    if(bottom){e.preventDefault();e.stopPropagation();const group=bottom.dataset.mobileGroup||'';quick?.classList.contains('is-open')&&quick.dataset.group===group?closeQuick():openQuick(group);return}
    const goBtn=e.target?.closest?.('[data-mobile-go]');
    if(goBtn&&goBtn.closest('#zrAdminMobileAlertsV1,#zrAdminMobileDrawerV1,#zrAdminMobileQuickV1')){e.preventDefault();go(goBtn.dataset.mobileGo||'');return}
    if(quick?.classList.contains('is-open')&&!e.target?.closest?.('#zrAdminMobileQuickV1'))closeQuick();
    if(alerts?.classList.contains('is-open')&&!e.target?.closest?.('#zrAdminMobileAlertsV1,#zrAdminMobileBell'))closeAlerts();
  },true);
  backdrop?.addEventListener('click',closeDrawer);$('zrAdminMobileMenuSearch')?.addEventListener('input',e=>filterDrawer(e.target.value));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeOverlays()});
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(!mobile())closeOverlays()},100)});
}
function observeRail(){const rail=$('zrAdminShellRail');if(!rail||railObserver)return false;railObserver=new MutationObserver(syncActive);railObserver.observe(rail,{subtree:true,attributes:true,attributeFilter:['class']});syncActive();return true}
function observeCounts(){const panel=$('zrAdminSmartPanelV1');if(!panel||countObserver)return false;countObserver=new MutationObserver(syncCounts);countObserver.observe(panel,{subtree:true,childList:true,characterData:true});syncCounts();return true}
function observeAdmin(){const admin=$('adminView');if(!admin||adminObserver)return false;adminObserver=new MutationObserver(()=>{if(mobile()&&adminVisible())startMobileOnce()});adminObserver.observe(admin,{attributes:true,attributeFilter:['class','style']});return true}
function todayVisible(){const sec=$('tab-today');return !!sec&&!sec.classList.contains('hidden')&&getComputedStyle(sec).display!=='none'}
function openTodayInitial(attempt=0){if(!mobile()||!adminVisible())return;if(todayVisible()){syncActive();return}go('today');if(attempt<28)setTimeout(()=>openTodayInitial(attempt+1),100)}
function startMobileOnce(){if(started||!mobile()||!adminVisible())return;started=true;tagOriginalTabs();setTimeout(()=>openTodayInitial(0),60)}
function mount(){
  if(root)return true;if(!$('adminView')||!$('zrAdminShellRail'))return false;
  injectStyle();tagOriginalTabs();root=buildHeader();alerts=buildAlerts();const bottom=buildBottom();quick=buildQuick();drawer=buildDrawer();document.body.append(root,alerts,bottom,quick,backdrop,drawer);bind();observeRail();observeAdmin();syncCounts();startMobileOnce();return true
}
function boot(){
  injectStyle();let tries=0;const wait=setInterval(()=>{tries++;tagOriginalTabs();if(mount()){observeRail();observeAdmin();if(observeCounts()||tries>80)clearInterval(wait)}if(tries>120)clearInterval(wait)},100);
  document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(()=>{mount();observeCounts();startMobileOnce()},80),{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();