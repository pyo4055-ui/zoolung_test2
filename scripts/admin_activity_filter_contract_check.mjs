import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const file='admin_activity_filter_fix_v1.js';
const s=fs.readFileSync(file,'utf8');
try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});ok(`syntax ${file}`)}catch(e){fail(`syntax ${file}: ${e.stderr?.toString()||e.message}`)}

for(const needle of [
  "let applied=null",
  "function readControls(){return {start:$('activityStart')?.value||'',end:$('activityEnd')?.value||'',mode:controlBasis()}}",
  "mode==='reservation'?String(b?.date||''):seoulDate(b?.createdAt)",
  "timeZone:'Asia/Seoul'",
  "if(s.start&&key<s.start)return false",
  "if(s.end&&key>s.end)return false",
  "function applyFromControls()",
  "applied={...next}",
  "window.activityFilteredBookings=()=>filterByState(applied||readControls())",
  "window.renderActivity=renderMain",
  "basis.onchange=()=>localStorage.setItem(ACTIVITY_BASIS_KEY,controlBasis())",
  "e.stopImmediatePropagation();applyFromControls()",
  "e.stopImmediatePropagation();applyToday()",
  "zrActivityOrgModalBtn",
  "zrActivityOrgSearchModal",
  "날짜 조회와 별개로 전체 예약에서 단체명을 찾습니다.",
  "readBookings().filter(b=>norm(b.orgName).includes(nq))",
  "q.disabled=true",
  "basis.disabled=false",
  "zr-activity-inline-search-disabled",
  "list.filter(b=>b.status==='confirmed'&&!isSettled(b)).length",
  "list.filter(b=>b.status==='pending').length",
  "list.filter(b=>b.status==='cancelled'||b.status==='rejected').length",
  "const settled=list.filter(isSettled).length"
])if(!s.includes(needle))fail(`activity filter contract missing: ${needle}`);

for(const forbidden of [
  'if(q)return readBookings().filter',
  'setStore(',
  'setDoc(',
  'updateDoc(',
  'deleteDoc(',
  'firebase-firestore',
  'scheduleGroups',
  'adminCalendar',
  'dayDetailContent',
  'function downloadActivity',
  'buildActivityXlsx'
])if(s.includes(forbidden))fail(`activity filter fix must stay isolated/display-only: ${forbidden}`);

const loader=fs.readFileSync('admin_features_v2_loader.js','utf8');
for(const needle of ['zrAdminActivityFilterFixV1','./admin_activity_filter_fix_v1.js?v=2'])if(!loader.includes(needle))fail(`activity filter loader missing: ${needle}`);

if(failed)process.exit(1);
ok('activity date filters are applied only on query action and group-name search is isolated in a modal');
