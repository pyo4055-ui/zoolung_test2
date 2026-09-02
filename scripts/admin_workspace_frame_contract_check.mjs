import fs from 'node:fs';

const admin=fs.readFileSync('admin.html','utf8');
const titles=fs.readFileSync('admin_section_subtab_title_fix_v1.js','utf8');
const frame=fs.readFileSync('admin_workspace_frame_fix_v1.js','utf8');
const bootstrap=fs.readFileSync('admin_entry_bootstrap_v1.js','utf8');

function need(ok,message){if(!ok){console.error(message);process.exit(1)}}

for(const file of ['admin_section_subtab_title_fix_v1.js?v=1','admin_workspace_frame_fix_v1.js?v=1'])need(admin.includes(file),`admin entry missing final workspace module: ${file}`);
for(const title of ['예약 정리','취소 정리','정리 내역','문의 현황','답변 예시','이용 안내','가이드맵','주차 안내','예약 운영','스케줄 알림 문자','아웃소싱 업체 설정','예약 확정 문자'])need(titles.includes(`title:'${title}'`),`active subtab title missing: ${title}`);
for(const target of ['zrCleanupSubtab','zrCancelCleanupSubtab','zrCleanupHistorySubtab','zrInquiryReplyInquirySubtab','zrInquiryReplyExampleSubtab','zrGuideInfoSubtabV1','zrGuideMapSubtabV1','zrGuideParkingSubtabV1','zrSettingsOperationSubtabV1','zrSettingsScheduleSmsSubtabV1','zrSettingsOutsourceSubtabV1','zrSettingsConfirmSmsSubtabV1'])need(titles.includes(`targetId:'${target}'`),`subtab target missing: ${target}`);
need(titles.includes("if(sec.firstElementChild!==head)sec.prepend(head)"),'section title must stay at the top even when legacy subpanels reorder content.');
need(titles.includes("e.stopImmediatePropagation();showHelp(activeMeta(group))"),'subtab help button must show help for the active subtab.');

for(const required of ['position:fixed!important','overflow-y:auto!important','overflow:hidden!important','top:calc(var(--zr-shell-gap) + var(--zr-admin-header-height) + var(--zr-shell-gap))!important','bottom:var(--zr-shell-gap)!important','right:calc(var(--zr-admin-smart-width) + (var(--zr-shell-gap) * 2))!important'])need(frame.includes(required),`fixed three-panel workspace contract missing: ${required}`);
for(const required of ['zr-admin-login-clean','zr-admin-login-legacy-hidden','maskSiblingsAlongModalPath','clearLoginSiblingMask','html.zr-admin-login-clean #adminLoginModal{background:#fff!important}'])need(bootstrap.includes(required),`clean dedicated login contract missing: ${required}`);

for(const text of [titles,frame,bootstrap])for(const forbidden of ['setDoc(','updateDoc(','deleteDoc(','writeBatch(','setStore('])need(!text.includes(forbidden),`workspace UI module must not write reservation data: ${forbidden}`);

console.log('OK: active subtab names drive visible section headers/help, login background is isolated, and desktop body scroll is replaced by a fixed center workspace scroller.');
