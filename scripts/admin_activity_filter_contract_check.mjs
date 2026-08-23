import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const file='admin_activity_filter_fix_v1.js';
const s=fs.readFileSync(file,'utf8');
try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});ok(`syntax ${file}`)}catch(e){fail(`syntax ${file}: ${e.stderr?.toString()||e.message}`)}

for(const needle of [
  "$('activityDateBasis')?.value",
  "mode==='reservation'?String(b.date||''):seoulDate(b.createdAt)",
  "timeZone:'Asia/Seoul'",
  "$('activityStart')?.value||''",
  "$('activityEnd')?.value||''",
  "if(q)return readBookings().filter",
  "b&&!b.__availabilityOnly",
  "window.activityFilteredBookings=filteredBookings",
  "window.renderActivity=renderDateFiltered",
  "window.renderActivity.__zrOrgSearchV2",
  "list.filter(b=>b.status==='confirmed'&&!isSettled(b)).length",
  "list.filter(b=>b.status==='pending').length",
  "list.filter(b=>b.status==='cancelled').length",
  "const settled=list.filter(isSettled).length",
  "setTimeout(renderDateFiltered,0)"
])if(!s.includes(needle))fail(`activity filter contract missing: ${needle}`);

for(const forbidden of [
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
])if(s.includes(forbidden))fail(`activity filter fix must stay display/filter only: ${forbidden}`);

const loader=fs.readFileSync('admin_features_v2_loader.js','utf8');
for(const needle of ['zrAdminActivityFilterFixV1','./admin_activity_filter_fix_v1.js?v=1'])if(!loader.includes(needle))fail(`activity filter loader missing: ${needle}`);

if(failed)process.exit(1);
ok('activity reservation/reception date filtering is deterministic and write-free');
