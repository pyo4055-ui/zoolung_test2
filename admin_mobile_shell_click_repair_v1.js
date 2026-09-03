(()=>{
'use strict';
if(window.__ZR_ADMIN_MOBILE_CLICK_REPAIR_V1)return;
window.__ZR_ADMIN_MOBILE_CLICK_REPAIR_V1=true;

const MAX_MOBILE=900;
const LEAVES={
  operation:[
    {label:'오늘 운영',parent:'today'},
    {label:'예약 캘린더',parent:'calendar'},
    {label:'스케줄 관리',parent:'schedule'},
    {label:'경고',parent:'warning'}
  ],
  reservation:[
    {label:'예약 현황',parent:'activity'},
    {label:'식사 현황',parent:'meals'},
    {label:'예약 정리',parent:'cleanup',targetId:'zrCleanupSubtab'},
    {label:'취소 정리',parent:'cleanup',targetId:'zrCancelCleanupSubtab'},
    {label:'정리 내역',parent:'cleanup',targetId:'zrCleanupHistorySubtab'}
  ],
  customer:[
    {label:'문의 현황',parent:'inquiries',targetId:'zrInquiryReplyInquirySubtab'},
    {label:'답변 예시',parent:'inquiries',targetId:'zrInquiryReplyExampleSubtab'},
    {label:'사전답사 현황',parent:'previewVisit',targetId:'zrPreviewNotifyVisitSubtab'},
    {label:'확정문자 예시',parent:'previewVisit',targetId:'zrPreviewNotifyTemplateSubtab'},
    {label:'이용 안내',parent:'guide',targetId:'zrGuideInfoSubtabV1'},
    {label:'가이드맵',parent:'guide',targetId:'zrGuideMapSubtabV1'},
    {label:'주차 안내',parent:'guide',targetId:'zrGuideParkingSubtabV1'}
  ],
  sales:[
    {label:'월매출 현황',parent:'salesDashboard',salesMode:'monthly'},
    {label:'전월매출 현황',parent:'salesDashboard',salesMode:'prev'},
    {label:'전년매출 현황',parent:'salesDashboard',salesMode:'year'},
    {label:'단체 카페매출',parent:'salesDashboard',salesMode:'cafe'},
    {label:'재방문율',parent:'salesDashboard',salesMode:'revisit'},
    {label:'아웃소싱 결제대금',parent:'outsourcing'},
    {label:'카페 메뉴 관리',parent:'menuadmin'}
  ],
  settings:[
    {label:'예약 운영',parent:'settings',targetId:'zrSettingsOperationSubtabV1'},
    {label:'스케줄 알림 문자',parent:'settings',targetId:'zrSettingsScheduleSmsSubtabV1'},
    {label:'아웃소싱 업체 설정',parent:'settings',targetId:'zrSettingsOutsourceSubtabV1'},
    {label:'예약 확정 문자',parent:'settings',targetId:'zrSettingsConfirmSmsSubtabV1'}
  ]
};
const LABELS={operation:'운영',reservation:'예약',customer:'고객',sales:'매출',settings:'설정'};
const mobile=()=>window.matchMedia(`(max-width:${MAX_MOBILE}px)`).matches;
const wait=ms=>new Promise(r=>setTimeout(r,ms));

function quick(){return document.getElementById('zrAdminMobileQuickV1')}
function railButton(id){return document.querySelector(`#zrAdminShellRail [data-zr-admin-item="${CSS.escape(id)}"]`)}
function closeOtherOverlays(){
  document.getElementById('zrAdminMobileAlertsV1')?.classList.remove('is-open');
  document.getElementById('zrAdminMobileBell')?.classList.remove('is-open');
  document.getElementById('zrAdminMobileDrawerV1')?.classList.remove('is-open');
  document.getElementById('zrAdminMobileDrawerBackdropV1')?.classList.remove('is-open');
  document.getElementById('zrAdminMobileMenuTrigger')?.classList.remove('is-open');
  document.documentElement.classList.remove('zr-admin-mobile-overlay-open');
}
function closeQuick(){const q=quick();if(q){q.classList.remove('is-open');q.dataset.group=''}}
function openQuick(group){
  const q=quick(),items=LEAVES[group];if(!q||!items)return;
  closeOtherOverlays();
  const already=q.classList.contains('is-open')&&q.dataset.group===group;
  if(already){closeQuick();return}
  q.dataset.group=group;
  q.innerHTML=`<div class="zr-admin-mobile-quick-head"><b>${LABELS[group]||''} 메뉴</b><span>마지막 작업 메뉴 바로가기</span></div><div class="zr-admin-mobile-quick-list">${items.map((x,i)=>`<button type="button" class="zr-admin-mobile-quick-row" data-zr-mobile-repair-group="${group}" data-zr-mobile-repair-index="${i}">${x.label}</button>`).join('')}</div>`;
  q.classList.add('is-open');
}
async function clickWhenReady(selector,attempts=36){
  for(let i=0;i<attempts;i++){
    const el=document.querySelector(selector);
    if(el){el.click();return true}
    await wait(50);
  }
  return false;
}
async function activate(group,index){
  const leaf=LEAVES[group]?.[Number(index)];if(!leaf)return;
  closeQuick();
  const parent=railButton(leaf.parent);if(!parent)return;
  if(!parent.classList.contains('is-active'))parent.click();
  if(leaf.targetId){
    await clickWhenReady(`#${CSS.escape(leaf.targetId)}`);
  }else if(leaf.salesMode){
    await clickWhenReady(`#tab-sales-dashboard [data-zr-sales-mode="${CSS.escape(leaf.salesMode)}"]`,44);
  }
}

/*
  iOS Safari repair: handle the bottom navigation one level before the older
  document-capture listener so opening a quick menu never blocks its buttons.
*/
window.addEventListener('click',e=>{
  if(!mobile())return;
  const bottom=e.target?.closest?.('#zrAdminMobileBottomV1 [data-mobile-group]');
  if(bottom){
    e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
    openQuick(bottom.dataset.mobileGroup||'');
    return;
  }
  const leaf=e.target?.closest?.('#zrAdminMobileQuickV1 [data-zr-mobile-repair-group]');
  if(leaf){
    e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
    activate(leaf.dataset.zrMobileRepairGroup||'',leaf.dataset.zrMobileRepairIndex||'0');
  }
},true);
})();