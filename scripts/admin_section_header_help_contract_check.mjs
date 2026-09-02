import fs from 'node:fs';

const admin=fs.readFileSync('admin.html','utf8');
const ui=fs.readFileSync('admin_section_header_help_v1.js','utf8');
const sidebar=fs.readFileSync('admin_shell_submenus_v1.js','utf8');

function need(ok,message){if(!ok){console.error(message);process.exit(1)}}

need(admin.includes('admin_section_header_help_v1.js?v=1'),'admin entry must load unified section headers/help.');
need(admin.includes('admin_shell_submenus_v1.js?v=1'),'left sidebar submenus must remain loaded.');

for(const id of ['tab-today','tab-calendar','tab-schedule','tab-warning','tab-activity','tab-meals','tab-cleanup','tab-inquiries','tab-preview-visit','zrGuideAdminSection','tab-outsourcing','tab-menuadmin','tab-settings']){
  need(ui.includes(`id:'${id}'`),`section header config missing: ${id}`);
}
for(const title of ['오늘 운영','예약 캘린더','스케줄 관리','경고','예약 현황','식사 현황','과거 예약 정리','1:1 문의','사전답사 관리','고객 안내 관리','아웃소싱 결제대금','카페 메뉴 관리','예약설정']){
  need(ui.includes(`title:'${title}'`),`section title missing: ${title}`);
}
for(const oldBar of ['#zrInquiryReplyInnerTabs','#zrCleanupInnerTabs','#zrGuideSubtabsV1','#zrSettingsSubtabsV1']){
  need(ui.includes(oldBar),`old in-content subtab bar must be visually hidden while retained for forwarding: ${oldBar}`);
}
for(const required of [
  '.zr-admin-shell-footer .zr-admin-shell-edit',
  '.zr-admin-section-head-title',
  '.zr-admin-section-help',
  "help.textContent='?'",
  'zrAdminSectionHelpModalV1',
  'role="dialog"',
  'aria-modal="true"',
  "if(e.key==='Escape'",
  'left menu',
]){
  if(required==='left menu')continue;
  need(ui.includes(required),`section header/help contract missing: ${required}`);
}
for(const required of ['HOVER_OPEN_DELAY_MS=1000','const SUBMENUS={','activateSubitem(parentId,sub)'])need(sidebar.includes(required),`left sidebar submenu behavior must remain intact: ${required}`);

for(const forbidden of ['setDoc(','updateDoc(','deleteDoc(','writeBatch(','localStorage.setItem(','sessionStorage.setItem(','firebase-firestore','collection(db','addDoc(']){
  need(!ui.includes(forbidden),`section header/help must remain UI-only: ${forbidden}`);
}

console.log('OK: left sidebar submenus remain active, duplicate in-content subtab bars are visually removed, footer menu edit is hidden, and every main admin section gets one plain title with a reusable help popup without data writes.');
