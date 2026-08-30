import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const read=p=>fs.readFileSync(p,'utf8');
const syntax=file=>{try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'})}catch(e){fail(`${file} syntax: ${e.stderr?.toString()||e.message}`)}};

for(const file of ['admin_warning_tab_v1.js','admin_tab_active_fix_v1.js'])syntax(file);

const warning=read('admin_warning_tab_v1.js');
const loader=read('admin_tab_active_fix_v1.js');

for(const needle of [
  'window.__ZR_ADMIN_WARNING_TAB_V1=true',
  "const PREP_DAYS=5",
  "const PAGE_SIZE=8",
  "String(b?.status||'')==='confirmed'",
  "diff<=-PREP_DAYS&&!settlementDone(b)",
  "b.schedulePublished",
  "mealNeedsTime(b)",
  "playNeedsTime(b)",
  "settlement?.savedAt",
  "settlementCompletedAt",
  "btn.textContent='경고'",
  "sec.id='tab-warning'",
  "data-zr-warning-filter",
  "data-zr-warning-detail",
  "data-zr-warning-settlement",
  "data-zr-warning-page",
  "id=\"zrWarningPagination\"",
  "window.zrOpenSettlementWorkspace",
  "window.openAdminBookingDetail",
  "방문 후 5일이 지난 확정 예약",
  "별도 경고 데이터는 저장하지 않습니다."
])if(!warning.includes(needle))fail(`warning tab contract missing: ${needle}`);

for(const removed of [
  'customerViewedParkingAt','customerViewedGuideMapAt','customerViewedScheduleAt','고객 미확인'
])if(warning.includes(removed))fail(`customer view status must not be a warning: ${removed}`);

for(const forbidden of [
  'setStore(','localStorage.setItem(','setDoc(','updateDoc(','deleteDoc(','addDoc(',
  'fetch(','XMLHttpRequest','MutationObserver',"document.addEventListener('click'",
  "collection(db,'", 'reservationAvailability','scheduleGroups'
])if(warning.includes(forbidden))fail(`warning tab must remain read-only/narrow: ${forbidden}`);

for(const needle of [
  'loadAdminWarning()',
  "s.src='./admin_warning_tab_v1.js?v=1'",
  "if(clicked.id!=='zrWarningTabBtn')",
  "gray('zrWarningTabBtn')",
  "document.getElementById('tab-warning')?.classList.add('hidden')"
])if(!loader.includes(needle))fail(`warning loader contract missing: ${needle}`);

if(failed){console.error('\nAdmin warning contract failed.');process.exit(1)}
console.log('Admin warning contract passed.');
