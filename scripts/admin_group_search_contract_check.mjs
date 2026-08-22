import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const read=p=>fs.readFileSync(p,'utf8');
const loader=read('admin_features_v2_loader.js');
const search=read('admin_group_search_v1.js');

try{execFileSync(process.execPath,['--check','admin_group_search_v1.js'],{stdio:'pipe'})}
catch(e){fail(`admin_group_search_v1.js syntax: ${e.stderr?.toString()||e.message}`)}

for(const needle of [
  "s.src='./admin_group_search_v1.js?v=1'",
  'loadAdminSearchEnhancements()',
])if(!loader.includes(needle))fail(`admin search loader contract missing: ${needle}`);

for(const needle of [
  'zrActivityOrgSearch','zrOutsourceOrgSearch','단체명 검색',
  "withOrgScope(q,['activityStart','activityEnd','activityStartDate','activityEndDate'],activityBaseRender)",
  "withOrgScope(q,['outsourceStart','outsourceEnd'],outsourceBaseRender)",
  "withOrgScope(activityQuery(),['activityStart','activityEnd','activityStartDate','activityEndDate'],fn,stripCafeItems)",
  "dates.forEach(x=>x.el.value='')",
  'dates.forEach(x=>x.el.value=x.value)',
  'window.bookings=temp','if(binding.win)window.bookings=binding.win',
  'window.renderActivity=wrapped','window.renderOutsourcingPayments=wrapped',
  '!window.__ZR_ADMIN_OPS_V10','!window.__ZR_ADMIN_V9_INSTALLED',
  'downloadActivityExcelV11','stripCafeItems',
  'refreshOutsourcePeopleForSearch','actualPaidCount','actualPaidChaperone','actualFreeChaperone',
  '검색어가 있으면 조회 시작일·종료일을 무시합니다.',
  '검색어가 있으면 방문일 시작·종료를 무시합니다.',
  'zr11ActivityToolbar','zr-outsource-query-grid','makeActivityToolbar','zr-outsource-actions'
])if(!search.includes(needle))fail(`admin group search contract missing: ${needle}`);

for(const forbidden of [
  "localStorage.setItem('zr_bookings'",'setStore(','setDoc(','getFirestore','firebase-firestore','reservationAvailability','scheduleGroups'
])if(search.includes(forbidden))fail(`admin group search must stay display/filter-only: ${forbidden}`);

if(!search.includes('finally{'))fail('admin group search must restore temporary date/booking bindings in finally');
if(fs.existsSync('scripts/inspect_admin_search_temp.mjs'))fail('temporary admin search inspector must be removed');

if(failed){console.error('\nAdmin group search contract failed.');process.exit(1)}
console.log('Admin group search contract passed.');
