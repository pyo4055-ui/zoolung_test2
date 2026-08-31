import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const read=p=>fs.readFileSync(p,'utf8');
const syntax=file=>{try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'})}catch(e){fail(`${file} syntax: ${e.stderr?.toString()||e.message}`)}};

for(const file of ['customer_schedule_ui_v5.js','admin_time_15min_v1.js','admin_section_subtabs_v1.js','admin_tab_active_fix_v1.js','admin_inquiry_reply_layout_v1.js','admin_preview_cafe_ui_v1.js'])syntax(file);
const schedule=read('customer_schedule_ui_v5.js');
const times=read('admin_time_15min_v1.js');
const subtabs=read('admin_section_subtabs_v1.js');
const loader=read('admin_tab_active_fix_v1.js');
const inquiry=read('admin_inquiry_reply_layout_v1.js');
const previewCafe=read('admin_preview_cafe_ui_v1.js');

for(const needle of [
  'function zoomAxisForBooking(b,bounds)',
  'b?.entryTime||b?.customerSchedule?.entryTime',
  'b?.exitTime||b?.customerSchedule?.exitTime',
  'function patchZoom(id)',
  "$('zrCustomerZoomRuler')",
  'ruler.innerHTML=rulerFor(axis)',
  'grid.style.backgroundSize=',
  "document.addEventListener('click',e=>{const btn=e.target?.closest?.('[data-zr-zoom]')",
  '예약시간 ${timeText(axis.start)}~${timeText(axis.end)} 범위로 크게 표시됩니다.'
])if(!schedule.includes(needle))fail(`customer zoom refinement missing: ${needle}`);

for(const needle of [
  'window.__ZR_ADMIN_TIME_15MIN_V1=true',
  "const TARGETS=['zr2eEntry','zr2eExit','zr2eMealStart','zr2ePlayStart','zr2qEntry','zr2qExit','zr2qMealStart','zr2qPlayStart']",
  'for(let m=0;m<24*60;m+=15)',
  "select.dataset.zr15AdminTime='1'",
  "observeBody('zr2EditBody')",
  "observeBody('zr2QuickBody')",
  'new MutationObserver(()=>apply(root))'
])if(!times.includes(needle))fail(`15-minute admin time refinement missing: ${needle}`);
for(const forbidden of ['setStore(','localStorage.setItem(','setDoc(','updateDoc(','deleteDoc(','writeBatch('])if(times.includes(forbidden))fail(`15-minute time UI must not write business data: ${forbidden}`);

for(const needle of [
  'window.__ZR_ADMIN_SECTION_SUBTABS_V1=true',
  "button('zrGuideInfoSubtabV1','이용 안내','guide')",
  "button('zrGuideMapSubtabV1','가이드맵','map')",
  "button('zrGuideParkingSubtabV1','주차 안내','parking')",
  "button('zrSettingsOperationSubtabV1','예약운영','operation')",
  "button('zrSettingsScheduleSmsSubtabV1','스케줄알림문자','scheduleSms')",
  "button('zrSettingsOutsourceSubtabV1','아웃소싱업체설정','outsourcing')",
  "button('zrSettingsConfirmSmsSubtabV1','예약확정문자','confirmSms')",
  "card.id==='zrScheduleCustomerNotifySettingsV1'",
  "card.querySelector('#vendorSettingsRows,#saveVendorSettings')",
  "card.querySelector('#saveSmsSettings')",
  'function restoreGuideUrlFields()',
  "document.querySelectorAll('#zrGuideAdminContents [data-k=\"imageUrl\"]')",
  "const mapInput=$('zrGuideMapImageUrl')",
  "settingsObserver.observe(sec,{childList:true,subtree:true})",
  'classList.toggle(\'hidden\'',
  'white-space:nowrap!important',
  '.zr-admin-subtabs,#zrCleanupInnerTabs{',
  '.zr-admin-subtabs button,#zrCleanupInnerTabs button{',
  '.zr-admin-subtabs button.zr-subtab-active,#zrCleanupInnerTabs button.btn-primary{',
  '.zr-admin-subtabs button:hover,#zrCleanupInnerTabs button:hover{background:#f8faf8!important;color:#2f6b4f!important}',
  'border-color:#bad1c1!important',
  'box-shadow:0 2px 6px rgba(30,50,36,.08)!important'
])if(!subtabs.includes(needle))fail(`admin section subtab refinement missing: ${needle}`);
for(const forbidden of ['setStore(','localStorage.setItem(','setDoc(','updateDoc(','deleteDoc(','writeBatch('])if(subtabs.includes(forbidden))fail(`admin subtabs must stay UI-only: ${forbidden}`);

for(const needle of [
  '#zrInquiryReplyInnerTabs button.btn-primary{background:#fff!important;color:#2f6b4f!important;border-color:#bad1c1!important;box-shadow:0 2px 6px rgba(30,50,36,.08)!important}',
  '#zrInquiryReplyInnerTabs button:hover{background:#f8faf8!important;color:#2f6b4f!important}'
])if(!inquiry.includes(needle))fail(`1:1 inquiry reference subtab style missing: ${needle}`);

for(const needle of [
  'window.__ZR_ADMIN_PREVIEW_CAFE_UI_V1=true',
  '#zrPreviewNotifyInnerTabs button:hover{background:#f8faf8!important;color:#2f6b4f!important}',
  'const PAGE_SIZE=8',
  "const direct=$('tab-menuadmin');if(direct)return direct;",
  "includes('카페메뉴')",
  "function primaryRows(sec){return [...(sec?.querySelectorAll('.menu-row')||[])]}",
  'function inferredRoot(sec)',
  '[onclick*="editCafeMenu"],[data-menu-id],[data-cafe-menu-id]',
  'function pageNumbers(current,pages)',
  'function controlsHtml(pages)',
  'id="zrCafeMenuPagination"',
  'data-zr-cafe-page=',
  "button('이전'",
  "button('다음'",
  'function paginate()',
  "row.dataset.zrCafePageHidden='1'",
  "root.insertAdjacentHTML('afterend',controlsHtml(pages))",
  'display:flex!important',
  'new MutationObserver(m=>{if(rowMutation(m))schedule({delay:0})})'
])if(!previewCafe.includes(needle))fail(`preview/cafe UI refinement missing: ${needle}`);
for(const forbidden of ['setStore(','localStorage.setItem(','setDoc(','updateDoc(','deleteDoc(','writeBatch(','tabs.appendChild(btn)','openCafeMenu()'])if(previewCafe.includes(forbidden))fail(`preview/cafe UI adapter must stay pagination/UI-only: ${forbidden}`);

for(const needle of [
  'function loadAdminTime15Min()',
  "s.src='./admin_time_15min_v1.js?v=1'",
  'function loadAdminSectionSubtabs()',
  "s.src='./admin_section_subtabs_v1.js?v=1'",
  'function loadAdminPreviewCafeUi()',
  "s.src='./admin_preview_cafe_ui_v1.js?v=1'",
  'loadAdminTime15Min',
  'loadAdminSectionSubtabs',
  'loadAdminPreviewCafeUi'
])if(!loader.includes(needle))fail(`admin refinement loader missing: ${needle}`);

if(failed){console.error('\nAdmin UI refinement contract failed.');process.exit(1)}
console.log('Admin UI refinement contract passed.');
