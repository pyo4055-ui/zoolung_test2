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
  "['pending','hold'].includes(status)",
  "diff<=-PREP_DAYS&&!settlementDone(b)",
  "b.schedulePublished",
  "customerSchedule?.notifiedAt",
  "customerSchedule?.segments",
  "function scheduleConflicts(b)",
  "type==='meal'",
  "type==='play'",
  "'4F 베이직'",
  "'5F 워터가든'",
  "'예약 미확정'",
  "'고객 알림 미완료'",
  "'스케줄 시간 겹침'",
  "settlement?.savedAt",
  "settlementCompletedAt",
  "btn.textContent='경고'",
  "sec.id='tab-warning'",
  "data-zr-warning-filter=\"booking\"",
  "data-zr-warning-filter=\"schedule\"",
  "data-zr-warning-filter=\"notify\"",
  "data-zr-warning-filter=\"conflict\"",
  "data-zr-warning-filter=\"settlement\"",
  "data-zr-warning-detail",
  "data-zr-warning-settlement",
  "data-zr-warning-page",
  "id=\"zrWarningPagination\"",
  "window.zrOpenSettlementWorkspace",
  "window.openAdminBookingDetail",
  "방문 D-5부터 예약 미확정·스케줄 미확정·고객 알림 미완료·확정 스케줄 시간 겹침",
  "실제결제 미입력은 방문 D+5부터 표시합니다.",
  "별도 경고 데이터는 저장하지 않습니다."
])if(!warning.includes(needle))fail(`warning tab contract missing: ${needle}`);

for(const removed of [
  'mealNeedsTime','playNeedsTime','식사시간 없음','놀이터시간 없음',
  'customerViewedParkingAt','customerViewedGuideMapAt','customerViewedScheduleAt','고객 미확인'
])if(warning.includes(removed))fail(`obsolete warning must stay removed: ${removed}`);

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
