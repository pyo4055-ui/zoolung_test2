import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const read=p=>fs.readFileSync(p,'utf8');
const syntax=file=>{try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'})}catch(e){fail(`${file} syntax: ${e.stderr?.toString()||e.message}`)}};

for(const file of ['customer_schedule_ui_v5.js','admin_time_15min_v1.js','admin_section_subtabs_v1.js','admin_tab_active_fix_v1.js'])syntax(file);
const schedule=read('customer_schedule_ui_v5.js');
const times=read('admin_time_15min_v1.js');
const subtabs=read('admin_section_subtabs_v1.js');
const loader=read('admin_tab_active_fix_v1.js');

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
  "button('zrSettingsOperationSubtabV1','예약 운영','operation')",
  "button('zrSettingsOutsourceSubtabV1','아웃소싱','outsourcing')",
  "button('zrSettingsSmsSubtabV1','문자 안내','sms')",
  "$('zrGuideMapAdminSection')",
  "$('zrParkingAdminSection')",
  "card.querySelector('#vendorSettingsRows,#saveVendorSettings')",
  "card.querySelector('#saveSmsSettings')",
  'classList.toggle(\'hidden\'',
  'white-space:nowrap!important'
])if(!subtabs.includes(needle))fail(`admin section subtab refinement missing: ${needle}`);
for(const forbidden of ['setStore(','localStorage.setItem(','setDoc(','updateDoc(','deleteDoc(','writeBatch('])if(subtabs.includes(forbidden))fail(`admin subtabs must stay UI-only: ${forbidden}`);

for(const needle of [
  'function loadAdminTime15Min()',
  "s.src='./admin_time_15min_v1.js?v=1'",
  'function loadAdminSectionSubtabs()',
  "s.src='./admin_section_subtabs_v1.js?v=1'",
  'loadAdminTime15Min',
  'loadAdminSectionSubtabs'
])if(!loader.includes(needle))fail(`admin refinement loader missing: ${needle}`);

if(failed){console.error('\nAdmin UI refinement contract failed.');process.exit(1)}
console.log('Admin UI refinement contract passed.');
