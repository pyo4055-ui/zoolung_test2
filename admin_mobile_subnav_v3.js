(()=>{
'use strict';
if(window.__ZR_ADMIN_MOBILE_SUBNAV_V3)return;
window.__ZR_ADMIN_MOBILE_SUBNAV_V3=true;

const MAX_MOBILE=900;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const mobile=()=>window.matchMedia(`(max-width:${MAX_MOBILE}px)`).matches;

const LEAVES={
  operation:{label:'운영',items:[
    {label:'오늘 운영',parent:'today'},
    {label:'예약 캘린더',parent:'calendar'},
    {label:'스케줄 관리',parent:'schedule'},
    {label:'경고',parent:'warning'}
  ]},
  reservation:{label:'예약',items:[
    {label:'예약 현황',parent:'activity'},
    {label:'식사 현황',parent:'meals'},
    {label:'예약 정리',parent:'cleanup',targetId:'zrCleanupSubtab'},
    {label:'취소 정리',parent:'cleanup',targetId:'zrCancelCleanupSubtab'},
    {label:'정리 내역',parent:'cleanup',targetId:'zrCleanupHistorySubtab'}
  ]},
  customer:{label:'고객',items:[
    {label:'문의 현황',parent:'inquiries',targetId:'zrInquiryReplyInquirySubtab'},
    {label:'답변 예시',parent:'inquiries',targetId:'zrInquiryReplyExampleSubtab'},
    {label:'사전답사 현황',parent:'previewVisit',targetId:'zrPreviewNotifyVisitSubtab'},
    {label:'확정문자 예시',parent:'previewVisit',targetId:'zrPreviewNotifyTemplateSubtab'},
    {label:'이용 안내',parent:'guide',targetId:'zrGuideInfoSubtabV1'},
    {label:'가이드맵',parent:'guide',targetId:'zrGuideMapSubtabV1'},
    {label:'주차 안내',parent:'guide',targetId:'zrGuideParkingSubtabV1'}
  ]},
  sales:{label:'매출',items:[
    {label:'월매출',parent:'salesDashboard',salesMode:'monthly'},
    {label:'전월매출',parent:'salesDashboard',salesMode:'prev'},
    {label:'전년매출',parent:'salesDashboard',salesMode:'year'},
    {label:'단체 카페매출',parent:'salesDashboard',salesMode:'cafe'},
    {label:'재방문율',parent:'salesDashboard',salesMode:'revisit'},
    {label:'아웃소싱 결제대금',parent:'outsourcing'},
    {label:'카페 메뉴 관리',parent:'menuadmin'}
  ]},
  settings:{label:'설정',items:[
    {label:'예약 운영',parent:'settings',targetId:'zrSettingsOperationSubtabV1'},
    {label:'스케줄 알림 문자',parent:'settings',targetId:'zrSettingsScheduleSmsSubtabV1'},
    {label:'아웃소싱 업체 설정',parent:'settings',targetId:'zrSettingsOutsourceSubtabV1'},
    {label:'예약 확정 문자',parent:'settings',targetId:'zrSettingsConfirmSmsSubtabV1'}
  ]}
};
const PARENT_GROUP={
  today:'operation',calendar:'operation',schedule:'operation',warning:'operation',
  activity:'reservation',meals:'reservation',cleanup:'reservation',
  inquiries:'customer',previewVisit:'customer',guide:'customer',
  salesDashboard:'sales',outsourcing:'sales',menuadmin:'sales',settings:'settings'
};

let bar=null,currentGroup='operation',activeKey='operation:0',railObserver=null;

function railButton(id){return document.querySelector(`#zrAdminShellRail [data-zr-admin-item="${CSS.escape(id)}"]`)}
function activeParent(){return document.querySelector('#zrAdminShellRail [data-zr-admin-item].is-active')?.dataset.zrAdminItem||''}
function leafKey(group,index){return `${group}:${index}`}

function injectStyle(){
  if($('zrAdminMobileSubnavV3Style'))return;
  const s=document.createElement('style');s.id='zrAdminMobileSubnavV3Style';s.textContent=`
  @media(max-width:${MAX_MOBILE}px){
    /* v1/v2 popup-style mobile submenu is retired. */
    #zrAdminMobileQuickV1,#zrAdminMobileTouchMenuV2{display:none!important;visibility:hidden!important;pointer-events:none!important}

    html.zr-admin-shell-mounted body #adminView{padding-bottom:calc(126px + env(safe-area-inset-bottom))!important}

    #zrAdminMobileSubnavV3{
      display:flex;position:fixed;left:0;right:0;bottom:calc(68px + env(safe-area-inset-bottom));z-index:184;
      height:48px;box-sizing:border-box;align-items:center;gap:6px;padding:6px 10px;
      overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;
      background:rgba(255,253,249,.985);border-top:1px solid #eaded5;border-bottom:1px solid #eaded5;
      box-shadow:0 -4px 16px rgba(64,42,31,.035);scrollbar-width:none
    }
    #zrAdminMobileSubnavV3::-webkit-scrollbar{display:none}
    #zrAdminMobileSubnavV3 .zrm-subnav-label{flex:0 0 auto;padding:0 2px;color:#701418;font-size:10px;font-weight:950;white-space:nowrap}
    #zrAdminMobileSubnavV3 .zrm-subnav-btn{
      flex:0 0 auto;height:34px;min-width:max-content;margin:0!important;padding:0 12px!important;
      border:1px solid #e6d9cf!important;border-radius:999px!important;background:#fffaf6!important;color:#645148!important;
      box-shadow:none!important;font-size:11px!important;font-weight:850!important;line-height:32px!important;white-space:nowrap!important;
      touch-action:manipulation;-webkit-tap-highlight-color:transparent
    }
    #zrAdminMobileSubnavV3 .zrm-subnav-btn.is-active{background:#78171a!important;border-color:#78171a!important;color:#fff!important}
    #zrAdminMobileSubnavV3 .zrm-subnav-btn:active{transform:none!important;background:#f7e8dd!important;color:#701418!important}

    /* Bottom bar becomes category selector only; no popup/overlay. */
    #zrAdminMobileBottomV1 [data-mobile-category].is-category-active{color:#fff!important;background:linear-gradient(180deg,#7b1518,#650d10)!important;border-radius:12px!important;margin:5px 3px!important;padding-top:3px!important;padding-bottom:3px!important}

    /* Native inner subtabs stay functional but are not duplicated inside mobile content. */
    #zrCleanupInnerTabs,
    #zrInquiryReplyInnerTabs,
    #zrPreviewNotifyInnerTabs,
    #zrGuideSubtabsV1,
    #zrSettingsSubtabsV1,
    #tab-sales-dashboard .zr-sales-subtabs{display:none!important}
  }
  `;document.head.appendChild(s);
}

function ensureBar(){
  if(bar)return bar;
  bar=document.createElement('nav');
  bar.id='zrAdminMobileSubnavV3';
  bar.setAttribute('aria-label','모바일 관리자 세부 메뉴');
  document.body.appendChild(bar);
  bar.addEventListener('click',e=>{
    const btn=e.target.closest('[data-zrm-subnav-group]');if(!btn)return;
    e.preventDefault();
    const group=btn.dataset.zrmSubnavGroup||'',index=Number(btn.dataset.zrmSubnavIndex||0);
    activate(group,index);
  });
  return bar;
}

function render(group=currentGroup){
  if(!mobile()||!LEAVES[group])return;
  currentGroup=group;
  const g=LEAVES[group],root=ensureBar();
  root.innerHTML=`<span class="zrm-subnav-label">${esc(g.label)}</span>${g.items.map((item,i)=>`<button type="button" class="zrm-subnav-btn ${activeKey===leafKey(group,i)?'is-active':''}" data-zrm-subnav-group="${group}" data-zrm-subnav-index="${i}">${esc(item.label)}</button>`).join('')}`;
  syncBottom();
  requestAnimationFrame(()=>{
    const active=root.querySelector('.zrm-subnav-btn.is-active');
    active?.scrollIntoView?.({block:'nearest',inline:'nearest'});
  });
}

function syncBottom(){
  document.querySelectorAll('#zrAdminMobileBottomV1 [data-mobile-category]').forEach(btn=>{
    btn.classList.toggle('is-category-active',btn.dataset.mobileCategory===currentGroup);
    btn.classList.remove('is-active');
  });
}

function prepareBottom(){
  const bottom=$('zrAdminMobileBottomV1');if(!bottom)return false;
  const buttons=[...bottom.querySelectorAll('[data-mobile-group],[data-mobile-category]')];if(!buttons.length)return false;
  buttons.forEach(btn=>{
    const group=btn.dataset.mobileCategory||btn.dataset.mobileGroup||'';
    if(!LEAVES[group])return;
    btn.removeAttribute('data-mobile-group');
    btn.dataset.mobileCategory=group;
    if(btn.dataset.zrMobileSubnavBound==='1')return;
    btn.dataset.zrMobileSubnavBound='1';
    btn.addEventListener('click',e=>{
      if(!mobile())return;
      e.preventDefault();e.stopPropagation();
      currentGroup=group;
      const parent=activeParent();
      const idx=LEAVES[group].items.findIndex(x=>x.parent===parent);
      if(idx>=0)activeKey=leafKey(group,idx);
      render(group);
    });
  });
  syncFromCurrent();
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

async function activate(group,index){
  const leaf=LEAVES[group]?.items?.[index];if(!leaf)return;
  currentGroup=group;activeKey=leafKey(group,index);render(group);
  const parent=railButton(leaf.parent);if(!parent)return;
  if(!parent.classList.contains('is-active'))parent.click();
  if(leaf.targetId)await clickWhenReady(`#${CSS.escape(leaf.targetId)}`);
  else if(leaf.salesMode)await clickWhenReady(`#tab-sales-dashboard [data-zr-sales-mode="${CSS.escape(leaf.salesMode)}"]`);
  activeKey=leafKey(group,index);render(group);
  window.scrollTo({top:0,behavior:'auto'});
}

function syncFromCurrent(){
  const parent=activeParent();
  const group=PARENT_GROUP[parent]||currentGroup||'operation';
  currentGroup=group;
  const idx=LEAVES[group]?.items?.findIndex(x=>x.parent===parent)??-1;
  if(idx>=0){
    /* Keep a specifically chosen nested leaf highlighted when its parent remains active. */
    if(!activeKey.startsWith(`${group}:`)||LEAVES[group].items[Number(activeKey.split(':')[1])]?.parent!==parent){activeKey=leafKey(group,idx)}
  }
  render(group);
}

function observeRail(){
  const rail=$('zrAdminShellRail');if(!rail||railObserver)return false;
  railObserver=new MutationObserver(()=>{if(mobile())syncFromCurrent()});
  railObserver.observe(rail,{subtree:true,attributes:true,attributeFilter:['class','aria-selected']});
  return true;
}

function boot(){
  injectStyle();ensureBar();
  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    const ready=prepareBottom();
    observeRail();
    if(ready||tries>120)clearInterval(timer);
  },100);
  document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(()=>{prepareBottom();observeRail();syncFromCurrent()},100),{once:true});
  window.addEventListener('resize',()=>{if(mobile()){prepareBottom();syncFromCurrent()}},{passive:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();