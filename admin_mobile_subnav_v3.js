(()=>{
'use strict';
if(window.__ZR_ADMIN_MOBILE_SUBNAV_V3)return;
window.__ZR_ADMIN_MOBILE_SUBNAV_V3=true;

const MAX_MOBILE=900;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const mobile=()=>window.matchMedia(`(max-width:${MAX_MOBILE}px)`).matches;

const MENUS={
  operation:{label:'운영',sections:[
    {label:'오늘 운영',parent:'today'},
    {label:'예약 캘린더',parent:'calendar'},
    {label:'스케줄 관리',parent:'schedule'},
    {label:'경고',parent:'warning'}
  ]},
  reservation:{label:'예약',sections:[
    {label:'예약 현황',parent:'activity'},
    {label:'식사 현황',parent:'meals'},
    {label:'과거 예약 정리',parent:'cleanup',children:[
      {label:'예약 정리',targetId:'zrCleanupSubtab'},
      {label:'취소 정리',targetId:'zrCancelCleanupSubtab'},
      {label:'정리 내역',targetId:'zrCleanupHistorySubtab'}
    ]}
  ]},
  customer:{label:'고객',sections:[
    {label:'1:1 문의',parent:'inquiries',children:[
      {label:'문의 현황',targetId:'zrInquiryReplyInquirySubtab'},
      {label:'답변 예시',targetId:'zrInquiryReplyExampleSubtab'}
    ]},
    {label:'사전답사 관리',parent:'previewVisit',children:[
      {label:'사전답사 현황',targetId:'zrPreviewNotifyVisitSubtab'},
      {label:'확정문자 예시',targetId:'zrPreviewNotifyTemplateSubtab'}
    ]},
    {label:'고객 안내 관리',parent:'guide',children:[
      {label:'이용 안내',targetId:'zrGuideInfoSubtabV1'},
      {label:'가이드맵',targetId:'zrGuideMapSubtabV1'},
      {label:'주차 안내',targetId:'zrGuideParkingSubtabV1'}
    ]}
  ]},
  sales:{label:'매출',sections:[
    {label:'매출 현황',parent:'salesDashboard',children:[
      {label:'월매출',salesMode:'monthly'},
      {label:'전월매출',salesMode:'prev'},
      {label:'전년매출',salesMode:'year'},
      {label:'단체 카페매출',salesMode:'cafe'},
      {label:'재방문율',salesMode:'revisit'}
    ]},
    {label:'아웃소싱 결제대금',parent:'outsourcing'},
    {label:'카페 메뉴 관리',parent:'menuadmin'}
  ]},
  settings:{label:'설정',sections:[
    {label:'예약설정',parent:'settings',children:[
      {label:'예약 운영',targetId:'zrSettingsOperationSubtabV1'},
      {label:'스케줄 알림 문자',targetId:'zrSettingsScheduleSmsSubtabV1'},
      {label:'아웃소싱 업체 설정',targetId:'zrSettingsOutsourceSubtabV1'},
      {label:'예약 확정 문자',targetId:'zrSettingsConfirmSmsSubtabV1'}
    ]}
  ]}
};
const PARENT_GROUP={
  today:'operation',calendar:'operation',schedule:'operation',warning:'operation',
  activity:'reservation',meals:'reservation',cleanup:'reservation',
  inquiries:'customer',previewVisit:'customer',guide:'customer',
  salesDashboard:'sales',outsourcing:'sales',menuadmin:'sales',settings:'settings'
};

let panel=null,currentGroup='operation',menuGroup='',activeParentId='today',activeChildKey='',resizeObserver=null,navigating=false;

function railButton(id){return document.querySelector(`#zrAdminShellRail [data-zr-admin-item="${CSS.escape(id)}"]`)}
function currentRailParent(){return document.querySelector('#zrAdminShellRail [data-zr-admin-item].is-active')?.dataset.zrAdminItem||''}
function childKey(group,sectionIndex,childIndex){return `${group}:${sectionIndex}:${childIndex}`}

function injectStyle(){
  if($('zrAdminMobileSubnavV3Style'))return;
  const s=document.createElement('style');
  s.id='zrAdminMobileSubnavV3Style';
  s.textContent=`
  @media(max-width:${MAX_MOBILE}px){
    #zrAdminMobileQuickV1,#zrAdminMobileTouchMenuV2{display:none!important;visibility:hidden!important;pointer-events:none!important}
    html.zr-admin-shell-mounted body #adminView{padding-bottom:calc(82px + env(safe-area-inset-bottom))!important}

    #zrAdminMobileSubnavV3{
      display:none;position:fixed;left:8px;right:8px;bottom:calc(74px + env(safe-area-inset-bottom));z-index:194;
      max-height:min(38svh,270px);box-sizing:border-box;padding:8px 9px 9px;overflow-y:auto;overflow-x:hidden;
      overscroll-behavior:contain;-webkit-overflow-scrolling:touch;background:rgba(255,253,249,.995);
      border:1px solid #eaded5;border-radius:18px;box-shadow:0 14px 40px rgba(56,39,30,.17)
    }
    #zrAdminMobileSubnavV3.is-open{display:block}
    #zrAdminMobileSubnavV3 .zrm-group-title{display:flex;align-items:center;gap:7px;padding:2px 4px 7px;color:#701418;font-size:11px;font-weight:950;letter-spacing:-.02em}
    #zrAdminMobileSubnavV3 .zrm-group-title:after{content:'';height:1px;flex:1;background:#efe4dc}
    #zrAdminMobileSubnavV3 .zrm-section{display:grid;grid-template-columns:minmax(100px,120px) minmax(0,1fr);gap:7px;align-items:center;padding:5px 2px;border-top:1px solid #f3eae3}
    #zrAdminMobileSubnavV3 .zrm-section:first-of-type{border-top:0}
    #zrAdminMobileSubnavV3 .zrm-section.no-children{grid-template-columns:minmax(0,1fr)}
    #zrAdminMobileSubnavV3 .zrm-main{
      min-height:38px;margin:0!important;padding:7px 10px!important;border:1px solid #e5d8cf!important;border-radius:10px!important;
      background:#fffaf6!important;color:#57443a!important;box-shadow:none!important;text-align:left!important;font-size:11px!important;
      font-weight:900!important;line-height:1.2!important;touch-action:manipulation;-webkit-tap-highlight-color:transparent
    }
    #zrAdminMobileSubnavV3 .zrm-main.is-active{background:#fff0e3!important;border-color:#dfa77f!important;color:#701418!important;box-shadow:inset 3px 0 0 #f26828!important}
    #zrAdminMobileSubnavV3 .zrm-children{display:flex;align-items:center;gap:5px;min-width:0;overflow-x:auto;overflow-y:hidden;padding:1px 0;scrollbar-width:none;-webkit-overflow-scrolling:touch}
    #zrAdminMobileSubnavV3 .zrm-children::-webkit-scrollbar{display:none}
    #zrAdminMobileSubnavV3 .zrm-child{
      flex:0 0 auto;min-height:31px;margin:0!important;padding:5px 9px!important;border:1px solid #e8ddd5!important;border-radius:999px!important;
      background:#fff!important;color:#735e53!important;box-shadow:none!important;font-size:10px!important;font-weight:850!important;line-height:1.2!important;
      white-space:nowrap!important;touch-action:manipulation;-webkit-tap-highlight-color:transparent
    }
    #zrAdminMobileSubnavV3 .zrm-child.is-active{background:#78171a!important;border-color:#78171a!important;color:#fff!important}
    #zrAdminMobileSubnavV3 button:active{transform:none!important}

    #zrAdminMobileBottomV1 [data-mobile-category].is-category-active{color:#fff!important;background:linear-gradient(180deg,#7b1518,#650d10)!important;border-radius:12px!important;margin:5px 3px!important;padding-top:3px!important;padding-bottom:3px!important}
    #zrAdminMobileBottomV1 [data-mobile-category].is-active:not(.is-category-active){color:#6f5d53!important;background:transparent!important;margin:0!important;padding:7px 2px 5px!important;border-radius:0!important}

    #zrCleanupInnerTabs,#zrInquiryReplyInnerTabs,#zrPreviewNotifyInnerTabs,#zrGuideSubtabsV1,#zrSettingsSubtabsV1,#tab-sales-dashboard .zr-sales-subtabs{display:none!important}

    html.zr-admin-shell-mounted #adminView [id^="tab-"],
    html.zr-admin-shell-mounted #adminView .card,
    html.zr-admin-shell-mounted #adminView .zr-today-shell,
    html.zr-admin-shell-mounted #adminView .zr-ir-panel,
    html.zr-admin-shell-mounted #adminView .zr-sales-shell{min-width:0!important;max-width:100%!important;box-sizing:border-box!important}
    html.zr-admin-shell-mounted #adminView input,
    html.zr-admin-shell-mounted #adminView select,
    html.zr-admin-shell-mounted #adminView textarea{max-width:100%!important;box-sizing:border-box!important}
    html.zr-admin-shell-mounted #adminView table{max-width:100%}
    html.zr-admin-shell-mounted #adminView .table-wrap,
    html.zr-admin-shell-mounted #adminView .table-scroll,
    html.zr-admin-shell-mounted #adminView .zr-table-wrap{max-width:100%!important;overflow-x:auto!important;-webkit-overflow-scrolling:touch}
  }
  `;
  document.head.appendChild(s);
}

function updatePanelHeight(){
  if(!panel||!mobile()||!panel.classList.contains('is-open'))return;
  panel.style.setProperty('--zrm-panel-height',`${Math.ceil(panel.getBoundingClientRect().height)}px`);
}
function ensurePanel(){
  if(panel)return panel;
  panel=document.createElement('nav');
  panel.id='zrAdminMobileSubnavV3';
  panel.setAttribute('aria-label','모바일 관리자 메뉴');
  document.body.appendChild(panel);
  panel.addEventListener('click',e=>{
    const main=e.target.closest('[data-zrm-main]');
    if(main){e.preventDefault();activateMain(main.dataset.zrmGroup||'',Number(main.dataset.zrmSection||0));return}
    const child=e.target.closest('[data-zrm-child-btn]');
    if(child){e.preventDefault();activateChild(child.dataset.zrmGroup||'',Number(child.dataset.zrmSection||0),Number(child.dataset.zrmChildIndex||0))}
  });
  if('ResizeObserver'in window){resizeObserver=new ResizeObserver(updatePanelHeight);resizeObserver.observe(panel)}
  return panel;
}

function render(group=menuGroup||currentGroup){
  if(!mobile()||!MENUS[group])return;
  const root=ensurePanel(),menu=MENUS[group];
  root.innerHTML=`<div class="zrm-group-title">${esc(menu.label)} 메뉴</div>${menu.sections.map((section,si)=>{
    const children=Array.isArray(section.children)?section.children:[];
    const activeMain=activeParentId===section.parent;
    const childHtml=children.length?`<div class="zrm-children">${children.map((child,ci)=>`<button type="button" class="zrm-child ${activeChildKey===childKey(group,si,ci)?'is-active':''}" data-zrm-child-btn data-zrm-group="${group}" data-zrm-section="${si}" data-zrm-child-index="${ci}">${esc(child.label)}</button>`).join('')}</div>`:'';
    return `<div class="zrm-section ${children.length?'':'no-children'}"><button type="button" class="zrm-main ${activeMain?'is-active':''}" data-zrm-main data-zrm-group="${group}" data-zrm-section="${si}">${esc(section.label)}</button>${childHtml}</div>`;
  }).join('')}`;
  requestAnimationFrame(updatePanelHeight);
}

function menuOpen(){return !!panel?.classList.contains('is-open')}
function openMenu(group){if(!MENUS[group])return;menuGroup=group;render(group);ensurePanel().classList.add('is-open');syncBottom();requestAnimationFrame(updatePanelHeight)}
function closeMenu(){panel?.classList.remove('is-open');menuGroup='';syncBottom()}
function toggleMenu(group){if(menuOpen()&&menuGroup===group){closeMenu();return}openMenu(group)}

function syncBottom(){
  const highlighted=menuOpen()&&menuGroup?menuGroup:currentGroup;
  document.querySelectorAll('#zrAdminMobileBottomV1 [data-mobile-category]').forEach(btn=>{
    btn.classList.toggle('is-category-active',btn.dataset.mobileCategory===highlighted);
    btn.classList.remove('is-active');
  });
}

function prepareBottom(){
  const bottom=$('zrAdminMobileBottomV1');if(!bottom)return false;
  const buttons=[...bottom.querySelectorAll('[data-mobile-group],[data-mobile-category]')];if(!buttons.length)return false;
  buttons.forEach(btn=>{
    const group=btn.dataset.mobileCategory||btn.dataset.mobileGroup||'';if(!MENUS[group])return;
    btn.removeAttribute('data-mobile-group');btn.dataset.mobileCategory=group;
    if(btn.dataset.zrMobileSubnavBound==='1')return;
    btn.dataset.zrMobileSubnavBound='1';
    btn.addEventListener('click',e=>{if(!mobile())return;e.preventDefault();e.stopPropagation();toggleMenu(group)});
  });
  syncBottom();
  return true;
}

async function clickWhenReady(selector,attempts=44){
  for(let i=0;i<attempts;i++){
    const el=document.querySelector(selector);
    if(el){el.click();return true}
    await wait(50);
  }
  return false;
}

async function navigateSection(group,sectionIndex,childIndex=-1){
  if(navigating)return;
  const section=MENUS[group]?.sections?.[sectionIndex];if(!section)return;
  const child=childIndex>=0?section.children?.[childIndex]:null;
  navigating=true;
  try{
    currentGroup=group;
    activeParentId=section.parent;
    activeChildKey=child?childKey(group,sectionIndex,childIndex):'';
    closeMenu();
    syncBottom();

    const parent=railButton(section.parent);
    if(!parent)return;
    /* Always click the real PC navigation item. Its active class can be stale after a sales submode switch. */
    parent.click();
    await wait(90);

    if(child?.targetId)await clickWhenReady(`#${CSS.escape(child.targetId)}`);
    else if(child?.salesMode)await clickWhenReady(`#tab-sales-dashboard [data-zr-sales-mode="${CSS.escape(child.salesMode)}"]`);

    currentGroup=group;
    activeParentId=section.parent;
    activeChildKey=child?childKey(group,sectionIndex,childIndex):'';
    syncBottom();
    window.scrollTo({top:0,behavior:'auto'});
    setTimeout(()=>{if(!navigating)syncFromCurrent()},220);
  }finally{
    navigating=false;
  }
}

function activateMain(group,sectionIndex){navigateSection(group,sectionIndex,-1)}
function activateChild(group,sectionIndex,childIndex){
  const section=MENUS[group]?.sections?.[sectionIndex],child=section?.children?.[childIndex];
  if(!section||!child)return;navigateSection(group,sectionIndex,childIndex)
}

function syncFromCurrent(){
  if(navigating)return;
  const parent=currentRailParent();if(!parent)return;
  const group=PARENT_GROUP[parent];if(group&&MENUS[group])currentGroup=group;
  const section=MENUS[currentGroup]?.sections?.find(x=>x.parent===parent);
  if(section){if(activeParentId!==parent)activeChildKey='';activeParentId=parent}
  syncBottom();
}

function bindRail(){
  const rail=$('zrAdminShellRail');if(!rail||rail.dataset.zrMobileSubnavRailBound==='1')return false;
  rail.dataset.zrMobileSubnavRailBound='1';
  rail.addEventListener('click',()=>setTimeout(()=>{if(!mobile()||navigating)return;closeMenu();syncFromCurrent()},20));
  return true;
}

function bindOutsideClose(){
  if(document.documentElement.dataset.zrMobileSubnavOutsideBound==='1')return;
  document.documentElement.dataset.zrMobileSubnavOutsideBound='1';
  document.addEventListener('click',e=>{if(!mobile()||!menuOpen())return;if(e.target?.closest?.('#zrAdminMobileSubnavV3,#zrAdminMobileBottomV1'))return;closeMenu()});
}

function boot(){
  injectStyle();ensurePanel();bindOutsideClose();
  let tries=0;
  const timer=setInterval(()=>{tries++;const ready=prepareBottom();bindRail();if(ready||tries>120)clearInterval(timer)},100);
  document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(()=>{prepareBottom();bindRail();syncFromCurrent();closeMenu()},100),{once:true});
  window.addEventListener('resize',()=>{if(!mobile()){closeMenu();return}prepareBottom();if(!navigating)syncFromCurrent();if(menuOpen())updatePanelHeight()},{passive:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();