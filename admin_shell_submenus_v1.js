(()=>{
'use strict';
if(window.__ZR_ADMIN_SHELL_SUBMENUS_V1)return;
window.__ZR_ADMIN_SHELL_SUBMENUS_V1=true;

const HOVER_OPEN_DELAY_MS=1000;
const SUBMENUS={
  cleanup:[
    {id:'reservation-cleanup',label:'예약 정리',targetId:'zrCleanupSubtab'},
    {id:'cancel-cleanup',label:'취소 정리',targetId:'zrCancelCleanupSubtab'},
    {id:'cleanup-history',label:'정리 내역',targetId:'zrCleanupHistorySubtab'}
  ],
  inquiries:[
    {id:'inquiry-list',label:'문의 현황',targetId:'zrInquiryReplyInquirySubtab'},
    {id:'inquiry-examples',label:'답변 예시',targetId:'zrInquiryReplyExampleSubtab'}
  ],
  guide:[
    {id:'guide-info',label:'이용 안내',targetId:'zrGuideInfoSubtabV1'},
    {id:'guide-map',label:'가이드맵',targetId:'zrGuideMapSubtabV1'},
    {id:'guide-parking',label:'주차 안내',targetId:'zrGuideParkingSubtabV1'}
  ],
  settings:[
    {id:'settings-operation',label:'예약 운영',targetId:'zrSettingsOperationSubtabV1'},
    {id:'settings-schedule-sms',label:'스케줄 알림 문자',targetId:'zrSettingsScheduleSmsSubtabV1'},
    {id:'settings-outsourcing',label:'아웃소싱 업체 설정',targetId:'zrSettingsOutsourceSubtabV1'},
    {id:'settings-confirm-sms',label:'예약 확정 문자',targetId:'zrSettingsConfirmSmsSubtabV1'}
  ]
};
const $=id=>document.getElementById(id);
let rail=null,admin=null,observer=null,scheduled=false,hoverTimer=0,hoverPendingId='',suppressParentToggle=false;
const wrappers=new Map();
const openIds=new Set();

function injectStyle(){
  if($('zrAdminShellSubmenusStyleV1'))return;
  const style=document.createElement('style');
  style.id='zrAdminShellSubmenusStyleV1';
  style.textContent=`
    .zr-admin-shell-nav{overflow-y:auto!important;overscroll-behavior-y:contain;scrollbar-gutter:stable}
    .zr-admin-shell-item-wrap{--zr-sub-color:var(--zr-settings);--zr-sub-soft:var(--zr-settings-soft);position:relative}
    .zr-admin-shell-item-wrap[data-group="operation"]{--zr-sub-color:var(--zr-operation);--zr-sub-soft:var(--zr-operation-soft)}
    .zr-admin-shell-item-wrap[data-group="reservation"]{--zr-sub-color:var(--zr-reservation);--zr-sub-soft:var(--zr-reservation-soft)}
    .zr-admin-shell-item-wrap[data-group="customer"]{--zr-sub-color:var(--zr-customer);--zr-sub-soft:var(--zr-customer-soft)}
    .zr-admin-shell-item-wrap[data-group="sales"]{--zr-sub-color:var(--zr-sales);--zr-sub-soft:var(--zr-sales-soft)}
    .zr-admin-shell-item-wrap[data-group="settings"]{--zr-sub-color:var(--zr-settings);--zr-sub-soft:var(--zr-settings-soft)}
    .zr-admin-shell-item-wrap[hidden]{display:none!important}
    .zr-admin-shell-item-wrap>.zr-admin-shell-item{position:relative}
    .zr-admin-shell-submenu-chevron{margin-left:auto;flex:none;color:#8b958e;font-size:13px;font-weight:950;line-height:1;transform:rotate(0deg);transition:transform .15s ease,color .15s ease}
    .zr-admin-shell-item-wrap.is-submenu-open .zr-admin-shell-submenu-chevron{transform:rotate(180deg);color:var(--zr-sub-color)}
    .zr-admin-shell-submenu{display:grid;grid-template-rows:0fr;opacity:0;margin:0 4px 0 18px;transition:grid-template-rows .16s ease,opacity .14s ease,margin .16s ease}
    .zr-admin-shell-submenu-inner{min-height:0;overflow:hidden;border-left:2px solid color-mix(in srgb,var(--zr-sub-color) 24%,transparent);padding-left:9px;display:grid;gap:2px}
    .zr-admin-shell-item-wrap.is-submenu-open .zr-admin-shell-submenu{grid-template-rows:1fr;opacity:1;margin-top:2px;margin-bottom:6px}
    .zr-admin-shell-subitem{width:100%;min-height:32px!important;border:1px solid transparent!important;border-radius:8px!important;background:transparent!important;color:#66726b!important;box-shadow:none!important;padding:6px 9px!important;text-align:left!important;font-size:12px!important;font-weight:760!important;line-height:1.25!important;display:flex!important;align-items:center!important;gap:7px!important}
    .zr-admin-shell-subitem:before{content:"";width:5px;height:5px;border-radius:999px;background:var(--zr-sub-color);opacity:.48;flex:none}
    .zr-admin-shell-subitem:hover{background:var(--zr-sub-soft)!important;color:var(--zr-sub-color)!important}
    .zr-admin-shell-subitem.is-active{background:var(--zr-sub-soft)!important;color:var(--zr-sub-color)!important;font-weight:900!important}
    .zr-admin-shell-subitem.is-active:before{opacity:1}
    html.zr-admin-shell-collapsed .zr-admin-shell-item-wrap .zr-admin-shell-submenu,html.zr-admin-shell-collapsed .zr-admin-shell-submenu-chevron{display:none!important}
    @media(max-width:900px){.zr-admin-shell-submenu{display:none!important}}
    @media(prefers-reduced-motion:reduce){.zr-admin-shell-submenu,.zr-admin-shell-submenu-chevron{transition:none!important}}
  `;
  document.head.appendChild(style);
}
function isTargetActive(target){
  return !!target&&(target.classList.contains('btn-primary')||target.classList.contains('zr-subtab-active')||target.getAttribute('aria-selected')==='true');
}
function scheduleSync(){
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;syncAll()});
}
function syncAll(){
  const collapsed=document.documentElement.classList.contains('zr-admin-shell-collapsed');
  wrappers.forEach((wrap,parentId)=>{
    const parent=wrap.querySelector(':scope > .zr-admin-shell-item');
    if(!parent)return;
    wrap.hidden=parent.hidden;
    const open=!collapsed&&openIds.has(parentId);
    wrap.classList.toggle('is-submenu-open',open);
    parent.setAttribute('aria-expanded',open?'true':'false');
    wrap.querySelectorAll('[data-zr-admin-subitem]').forEach(button=>{
      const target=$(button.dataset.targetId||'');
      button.classList.toggle('is-active',isTargetActive(target));
    });
  });
}
function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
function cancelHover(parentId=''){
  if(parentId&&hoverPendingId&&hoverPendingId!==parentId)return;
  if(hoverTimer){clearTimeout(hoverTimer);hoverTimer=0}
  hoverPendingId='';
}
function openSubmenu(parentId){
  if(document.documentElement.classList.contains('zr-admin-shell-collapsed'))return;
  openIds.add(parentId);scheduleSync();
}
function toggleSubmenu(parentId){
  if(document.documentElement.classList.contains('zr-admin-shell-collapsed'))return;
  if(openIds.has(parentId))openIds.delete(parentId);else openIds.add(parentId);
  scheduleSync();
}
function scheduleHover(parentId,wrap){
  cancelHover();
  if(document.documentElement.classList.contains('zr-admin-shell-collapsed')||openIds.has(parentId))return;
  hoverPendingId=parentId;
  hoverTimer=setTimeout(()=>{
    hoverTimer=0;
    if(hoverPendingId!==parentId)return;
    hoverPendingId='';
    if(!wrap.matches(':hover'))return;
    openSubmenu(parentId);
  },HOVER_OPEN_DELAY_MS);
}
async function activateSubitem(parentId,sub){
  const wrap=wrappers.get(parentId),parent=wrap?.querySelector(':scope > .zr-admin-shell-item');
  if(!parent)return;
  cancelHover();openSubmenu(parentId);
  const alreadyActive=parent.classList.contains('is-active');
  if(!alreadyActive){
    suppressParentToggle=true;
    try{parent.click()}finally{suppressParentToggle=false}
    openSubmenu(parentId);
  }
  let target=$(sub.targetId);
  if(target){
    target.click();
    await wait(30);scheduleSync();return;
  }
  for(let i=0;!target&&i<28;i++){
    await wait(50);target=$(sub.targetId);
  }
  if(!target){console.debug('admin shell submenu target not ready',parentId,sub.targetId);return}
  target.click();
  await wait(30);scheduleSync();
}
function createSubmenu(parentId,parent){
  if(wrappers.has(parentId)||!parent?.parentElement)return;
  const wrap=document.createElement('div');
  wrap.className='zr-admin-shell-item-wrap';
  wrap.dataset.zrSubmenuParent=parentId;
  wrap.dataset.group=parent.dataset.group||'';
  parent.parentElement.insertBefore(wrap,parent);
  wrap.appendChild(parent);
  parent.setAttribute('aria-haspopup','true');
  parent.setAttribute('aria-expanded','false');

  const chevron=document.createElement('span');
  chevron.className='zr-admin-shell-submenu-chevron';
  chevron.setAttribute('aria-hidden','true');
  chevron.textContent='⌄';
  parent.appendChild(chevron);

  const menu=document.createElement('div');menu.className='zr-admin-shell-submenu';
  const inner=document.createElement('div');inner.className='zr-admin-shell-submenu-inner';
  for(const sub of SUBMENUS[parentId]){
    const b=document.createElement('button');
    b.type='button';b.className='zr-admin-shell-subitem';
    b.dataset.zrAdminSubitem=sub.id;b.dataset.targetId=sub.targetId;
    b.textContent=sub.label;
    b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();activateSubitem(parentId,sub)});
    inner.appendChild(b);
  }
  menu.appendChild(inner);wrap.appendChild(menu);
  wrappers.set(parentId,wrap);

  wrap.addEventListener('mouseenter',()=>scheduleHover(parentId,wrap));
  wrap.addEventListener('mouseleave',()=>cancelHover(parentId));
  wrap.addEventListener('focusin',()=>cancelHover());
  parent.addEventListener('click',()=>{
    cancelHover();
    if(!suppressParentToggle)toggleSubmenu(parentId);
  },true);
  parent.addEventListener('click',()=>{
    setTimeout(scheduleSync,0);setTimeout(scheduleSync,120);
  });
}
function installMenus(){
  rail=$('zrAdminShellRail');admin=$('adminView');
  if(!rail||!admin)return false;
  injectStyle();
  for(const parentId of Object.keys(SUBMENUS)){
    const parent=rail.querySelector(`[data-zr-admin-item="${CSS.escape(parentId)}"]`);
    if(parent)createSubmenu(parentId,parent);
  }
  syncAll();
  return wrappers.size>0;
}
function installObserver(){
  if(observer||!rail||!admin)return;
  observer=new MutationObserver(scheduleSync);
  observer.observe(rail,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-selected']});
  observer.observe(admin,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-selected','style']});
  document.addEventListener('click',e=>{if(!e.target?.closest?.('.zr-admin-shell-item-wrap'))cancelHover()},true);
}
function boot(){
  if(installMenus()){installObserver();return}
  let tries=0;
  const timer=setInterval(()=>{
    if(installMenus()){installObserver();clearInterval(timer);return}
    if(++tries>120)clearInterval(timer);
  },100);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,0),{once:true});
})();
