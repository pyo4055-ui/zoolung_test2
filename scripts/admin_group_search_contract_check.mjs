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
  "withDatesIgnored(['activityStart','activityEnd','activityStartDate','activityEndDate'],activityBaseRender)",
  "withDatesIgnored(['outsourceStart','outsourceEnd'],outsourceBaseRender)",
  "saved.forEach(x=>x.el.value='')",
  'saved.forEach(x=>x.el.value=x.value)',
  "JSON.parse(localStorage.getItem('zr_bookings')||'[]')",
  'filterActivityDom(q)','filterOutsourceDom(q)','refreshOutsourceKpiForSearch(q)',
  'basis.disabled=active','zr-search-ignored',
  'window.renderActivity=wrapped','window.renderOutsourcingPayments=wrapped',
  '!window.__ZR_ADMIN_OPS_V11_PATCH',
  'downloadActivityExcelV11','actualPaidCount','actualPaidChaperone','actualFreeChaperone',
  '조회 시작일·종료일과 조회 기준을 모두 무시하고 전체 예약에서 찾습니다.',
  '방문일 시작·종료를 무시합니다. 업체 조건만 그대로 적용됩니다.',
  'zr11ActivityToolbar','zr-outsource-query-grid','makeActivityToolbar','zr-outsource-actions'
])if(!search.includes(needle))fail(`admin group search contract missing: ${needle}`);

for(const forbidden of [
  "localStorage.setItem('zr_bookings'",'setStore(','setDoc(','getFirestore','firebase-firestore','reservationAvailability','scheduleGroups',
  'window.bookings=temp','bookings=temp'
])if(search.includes(forbidden))fail(`admin group search must stay display/filter-only and avoid booking rebinding: ${forbidden}`);

if(!search.includes('finally{'))fail('admin group search must restore temporary date inputs in finally');
if(fs.existsSync('scripts/inspect_admin_search_temp.mjs'))fail('temporary admin search inspector must be removed');

if(failed){console.error('\nAdmin group search contract failed.');process.exit(1)}
console.log('Admin group search contract passed.');
