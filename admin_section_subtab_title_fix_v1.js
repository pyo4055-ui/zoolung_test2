(()=>{
'use strict';
if(window.__ZR_ADMIN_SECTION_SUBTAB_TITLE_FIX_V1)return;
window.__ZR_ADMIN_SECTION_SUBTAB_TITLE_FIX_V1=true;

const $=id=>document.getElementById(id);
const GROUPS=[
  {sectionId:'tab-preview-visit',items:[
    {targetId:'zrPreviewNotifyVisitSubtab',title:'사전답사 현황',help:['사전답사 요청을 확인하고 방문 일정을 확정합니다.']},
    {targetId:'zrPreviewNotifyTemplateSubtab',title:'사전답사 확정문자',help:['사전답사 확정 안내에 사용할 문구를 저장합니다.']}
  ]},
  {sectionId:'tab-activity',items:[
    {targetId:'zrActivityMainSubtabV1',title:'예약현황',help:['예약을 조회하고 상세 내용과 처리 상태를 확인합니다.']},
    {targetId:'zrActivityCancelSubtabV1',title:'예약취소',help:['취소일 또는 예약일로 취소 예약을 조회합니다.','취소 내용을 확인한 뒤 확인완료로 표시합니다.']}
  ]},
  {sectionId:'tab-cleanup',items:[
    {targetId:'zrCleanupSubtab',title:'예약 정리',help:['방문이 끝난 예약을 조회하고 필요한 예약을 과거 기록으로 정리합니다.','정리 전 대상과 날짜를 다시 확인한 뒤 처리하고, 처리 결과는 정리 내역에서 확인할 수 있습니다.']},
    {targetId:'zrCancelCleanupSubtab',title:'취소 정리',help:['취소된 예약 중 정리가 필요한 기록을 모아서 확인하고 정리합니다.','취소 사유와 예약 정보를 확인한 뒤 정리하며, 필요한 기록은 정리 내역에서 다시 확인할 수 있습니다.']},
    {targetId:'zrCleanupHistorySubtab',title:'정리 내역',help:['과거 예약 정리와 취소 정리에서 처리한 기록을 확인합니다.','정리된 날짜와 예약 정보를 기준으로 이전 처리 내역을 찾아볼 수 있습니다.']}
  ]},
  {sectionId:'tab-inquiry-reply-v1',items:[
    {targetId:'zrReservationChangeAdminRequestSubtab',title:'예약변경 요청',help:['변경 요청을 검토한 뒤 예약에 반영합니다.','확정문자 연결과 처리완료는 별도로 진행합니다.']},
    {targetId:'zrReservationChangeAdminSmsSubtab',title:'예약변경 확정문자',help:['예약변경 확정문자의 기본 문구를 저장합니다.']},
    {targetId:'zrInquiryReplyInquirySubtab',title:'문의 현황',help:['고객이 남긴 1:1 문의를 확인하고 답변을 작성·관리합니다.','미답변 문의를 우선 확인하고 문의내용을 본 뒤 필요한 답변을 등록하면 됩니다.']},
    {targetId:'zrInquiryReplyExampleSubtab',title:'단체문의 답변예시',help:['자주 사용하는 1:1 문의 답변 문구를 확인하는 화면입니다.','문의 답변 작성 시 상황에 맞는 예시를 참고해 필요한 내용만 조정해서 사용할 수 있습니다.']}
  ]},
  {sectionId:'zrGuideAdminSection',items:[
    {targetId:'zrGuideInfoSubtabV1',title:'이용 안내',help:['고객 예약조회 화면에 노출되는 방문 이용 안내 내용을 관리합니다.','내용을 수정한 뒤 저장하면 고객이 예약을 조회할 때 같은 안내가 표시됩니다.']},
    {targetId:'zrGuideMapSubtabV1',title:'가이드맵',help:['고객에게 보여줄 주렁주렁 가이드맵을 관리합니다.','등록된 이미지와 미리보기를 확인한 뒤 필요한 경우 가이드맵 이미지를 변경해 저장합니다.']},
    {targetId:'zrGuideParkingSubtabV1',title:'주차 안내',help:['고객 예약조회 화면에 노출되는 승하차 위치와 버스 주차 안내를 관리합니다.','현장 동선에 맞는 안내 내용과 이미지를 확인한 뒤 변경사항을 저장합니다.']}
  ]},
  {sectionId:'tab-settings',items:[
    {targetId:'zrSettingsHolidaySubtabV1',title:'공휴일 설정',help:['연도별 공휴일 날짜를 관리합니다.','공휴일 예약 허용 여부는 예약 운영에서 설정합니다.']},
    {targetId:'zrSettingsClosureSubtabV1',title:'정기휴무 설정',help:['정기휴무 날짜 또는 기간을 지정해 고객 예약을 차단합니다.','시작일과 종료일을 포함하며, 저장 후 고객 날짜 목록에 정기휴무로 표시됩니다.']},
    {targetId:'zrSettingsPeakSubtabV1',title:'성수기 설정',help:['단체 예약을 받지 않는 성수기 날짜 또는 기간을 지정합니다.','저장한 기간은 고객 날짜 목록에 성수기로 표시되며 기존 예약은 변경하지 않습니다.']},
    {targetId:'zrSettingsOperationSubtabV1',title:'예약 운영',help:['고객 예약 가능 기간, 공휴일 예약 여부, 자동 마감 등 기본 예약 운영 기준을 설정합니다.','변경한 설정은 고객 예약 가능 여부에 직접 반영되므로 저장 전 기간과 제한 값을 확인합니다.']},
    {targetId:'zrSettingsScheduleSmsSubtabV1',title:'스케줄 알림문자',help:['확정 스케줄 안내에 사용할 문자 문구를 관리합니다.','고객에게 전달되는 내용이므로 변수와 안내 문구를 확인한 뒤 저장합니다.']},
    {targetId:'zrSettingsOutsourceSubtabV1',title:'아웃소싱 업체 설정',help:['예약 및 현장 결제에서 사용하는 아웃소싱 업체 구분을 관리합니다.','업체명을 추가·수정할 때 기존 예약에서 사용하는 구분과 혼동되지 않도록 확인합니다.']},
    {targetId:'zrSettingsConfirmSmsSubtabV1',title:'예약 확정문자',help:['예약이 확정될 때 사용할 고객 안내 문자 문구를 관리합니다.','예약 정보와 안내 문구가 자연스럽게 표시되는지 확인한 뒤 저장합니다.']}
  ]}
];
let observer=null,scheduled=false;

function isActive(button){
  if(!button)return false;
  return button.classList.contains('btn-primary')||button.classList.contains('zr-subtab-active')||button.classList.contains('active')||button.getAttribute('aria-selected')==='true';
}
function activeMeta(group){
  for(const item of group.items){if(isActive($(item.targetId)))return item}
  return group.items.find(item=>$(item.targetId))||group.items[0];
}
function groupForHead(head){
  if(!head)return null;
  return GROUPS.find(group=>$(group.sectionId)?.contains(head))||null;
}
function syncGroup(group){
  const sec=$(group.sectionId);if(!sec)return;
  const head=sec.querySelector(':scope > .zr-admin-section-head');if(!head)return;
  if(sec.firstElementChild!==head)sec.prepend(head);
  const meta=activeMeta(group),title=head.querySelector('.zr-admin-section-head-title'),help=head.querySelector('.zr-admin-section-help');
  if(title&&title.textContent!==meta.title)title.textContent=meta.title;
  window.ZRAdminHelp?.tidy(sec);
  window.ZRAdminHelp?.refreshSummary?.(sec);
  sec.querySelectorAll('h2,h3').forEach(h=>{if(!h.classList.contains('zr-admin-legacy-intro-hidden')&&!h.closest('.modal,[role="dialog"]')&&h.textContent.trim().replace(/\s/g,'').replace(/조회$|관리$|설정$/g,'')===meta.title.replace(/\s/g,'').replace(/조회$|관리$|설정$/g,''))h.classList.add('zr-admin-legacy-intro-hidden')});
  if(help){
    help.dataset.zrSubtabHelpTarget=meta.targetId;
    help.setAttribute('aria-label',`${meta.title} 도움말`);
    help.title=`${meta.title} 도움말`;
  }
}
function sync(){scheduled=false;GROUPS.forEach(syncGroup)}
window.ZRAdminSectionTitles={sync};
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(sync)}
function showHelp(meta){
  const modal=$('zrAdminSectionHelpModalV1'),title=$('zrAdminHelpTitle'),body=$('zrAdminHelpBody');
  if(!modal||!title||!body)return false;
  title.textContent=`${meta.title} 도움말`;body.textContent='';
  for(const line of [...new Set([...meta.help,...(window.ZRAdminHelp?.moved(document.getElementById(GROUPS.find(g=>g.items.includes(meta))?.sectionId))||[])])]){const row=document.createElement('div');row.className='zr-admin-help-line';row.textContent=line;body.appendChild(row)}
  modal.hidden=false;setTimeout(()=>$('zrAdminHelpClose')?.focus?.(),0);return true;
}
function boot(){
  sync();
  const admin=$('adminView');
  if(admin&&!observer){observer=new MutationObserver(schedule);observer.observe(admin,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-selected','style']})}
  document.addEventListener('click',e=>{
    const help=e.target?.closest?.('.zr-admin-section-help');
    if(help){
      const group=groupForHead(help.closest('.zr-admin-section-head'));
      if(group){e.preventDefault();e.stopImmediatePropagation();showHelp(activeMeta(group));return}
    }
    if(e.target?.closest?.('[data-zr-admin-subitem],#zrCleanupInnerTabs button,#zrInquiryReplyInnerTabs button,#zrGuideSubtabsV1 button,#zrSettingsSubtabsV1 button')){
      setTimeout(schedule,0);setTimeout(schedule,80);setTimeout(schedule,180);
    }
  },true);
  let tries=0;const t=setInterval(()=>{sync();if(++tries>100)clearInterval(t)},150);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,0),{once:true});
})();
