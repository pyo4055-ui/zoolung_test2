import fs from 'node:fs';

const admin=fs.readFileSync('admin.html','utf8');
const submenu=fs.readFileSync('admin_shell_submenus_v1.js','utf8');
const guard=fs.readFileSync('admin_shell_submenu_customer_guard_v1.js','utf8');

function need(ok,message){
  if(!ok){console.error(message);process.exit(1)}
}

need(admin.includes('admin_shell_submenus_v1.js?v=1'),'admin entry must load sidebar section submenus after the main shell.');
need(admin.includes('admin_shell_submenu_customer_guard_v1.js?v=1'),'admin entry must load the customer-modal collision guard after sidebar submenus.');

for(const required of [
  'const HOVER_OPEN_DELAY_MS=1000;',
  "cleanup:[",
  "inquiries:[",
  "previewVisit:[",
  "guide:[",
  "settings:[",
  "label:'예약 정리'",
  "label:'취소 정리'",
  "label:'정리 내역'",
  "label:'문의 현황'",
  "label:'답변 예시'",
  "label:'사전답사 현황'",
  "label:'확정문자 예시'",
  "label:'이용 안내'",
  "label:'가이드맵'",
  "label:'주차 안내'",
  "label:'예약 운영'",
  "label:'스케줄 알림 문자'",
  "label:'아웃소싱 업체 설정'",
  "label:'예약 확정 문자'",
  "targetId:'zrCleanupSubtab'",
  "targetId:'zrCancelCleanupSubtab'",
  "targetId:'zrCleanupHistorySubtab'",
  "targetId:'zrInquiryReplyInquirySubtab'",
  "targetId:'zrInquiryReplyExampleSubtab'",
  "targetId:'zrPreviewNotifyVisitSubtab'",
  "targetId:'zrPreviewNotifyTemplateSubtab'",
  "targetId:'zrGuideInfoSubtabV1'",
  "targetId:'zrGuideMapSubtabV1'",
  "targetId:'zrGuideParkingSubtabV1'",
  "targetId:'zrSettingsOperationSubtabV1'",
  "targetId:'zrSettingsScheduleSmsSubtabV1'",
  "targetId:'zrSettingsOutsourceSubtabV1'",
  "targetId:'zrSettingsConfirmSmsSubtabV1'",
  "const openIds=new Set();",
  "openIds.add(parentId)",
  "if(openIds.has(parentId))openIds.delete(parentId);else openIds.add(parentId);",
  "const open=!collapsed&&openIds.has(parentId);",
  "wrap.addEventListener('mouseenter',()=>scheduleHover(parentId,wrap))",
  "wrap.addEventListener('mouseleave',()=>cancelHover(parentId))",
  "wrap.addEventListener('focusin',()=>cancelHover());",
  'hoverTimer=setTimeout',
  '},HOVER_OPEN_DELAY_MS);',
  "parent.addEventListener('click'",
  'if(!suppressParentToggle)toggleSubmenu(parentId);\n  },true);',
  'async function activateSubitem(parentId,sub)',
  "const alreadyActive=parent.classList.contains('is-active');",
  'suppressParentToggle=true;',
  'try{parent.click()}finally{suppressParentToggle=false}',
  'let target=$(sub.targetId);',
  'if(target){',
  'target.click();',
  "className='zr-admin-shell-subitem'",
  "classList.contains('zr-admin-shell-collapsed')",
  'overflow-y:auto!important',
  'overscroll-behavior-y:contain',
  'scrollbar-gutter:stable',
  'var(--zr-reservation)',
  'var(--zr-customer)',
  'var(--zr-settings)'
])need(submenu.includes(required),`admin sidebar submenu contract missing: ${required}`);

need(!submenu.includes("wrap.addEventListener('focusin',()=>{cancelHover();openSubmenu(parentId)});"),'focusing a parent must not pre-open and then immediately re-toggle the submenu before the first click.');
need(!submenu.includes('peekId'),'admin sidebar submenu expansion must no longer be limited to one transient peek menu.');
need(!submenu.includes('await wait(90);'),'admin sidebar submenu must not pause after opening a parent tab when the target already exists; that pause causes visible default-subtab flashing.');

for(const required of [
  'data-zr-admin-subitem="guide-map"',
  "setAttribute('aria-label','가이드맵')",
  "textContent='가이드맵\\u200B'"
])need(guard.includes(required),`admin sidebar guide-map guard missing: ${required}`);

for(const source of [submenu,guard])for(const forbidden of [
  'setDoc(',
  'updateDoc(',
  'deleteDoc(',
  'writeBatch(',
  'setStore(',
  'localStorage.setItem(',
  'sessionStorage.setItem(',
  'zr_bookings',
  'reservations',
  'reservationAvailability'
])need(!source.includes(forbidden),`admin sidebar navigation helpers must remain navigation-only: ${forbidden}`);

console.log('OK: sidebar owns preview-visit subtabs as well as the existing nested sections, switches hidden original controls without default-tab flash, preserves delayed hover/multi-open behavior, and performs no data writes.');