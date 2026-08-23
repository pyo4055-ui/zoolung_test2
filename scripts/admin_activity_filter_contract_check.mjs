import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const file='admin_activity_filter_fix_v1.js';
const s=fs.readFileSync(file,'utf8');
try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});ok(`syntax ${file}`)}catch(e){fail(`syntax ${file}: ${e.stderr?.toString()||e.message}`)}

for(const needle of [
  "const ACTIVITY_BASIS_KEY='zr_activity_date_basis_v10'",
  "start:$('activityStart')?.value||''",
  "end:$('activityEnd')?.value||''",
  "basis:selectedBasis()",
  "mode==='reservation'?String(b?.date||''):seoulDate(b?.createdAt)",
  "timeZone:'Asia/Seoul'",
  "if(state.start&&key<state.start)return false",
  "if(state.end&&key>state.end)return false",
  "if(next.start&&next.end&&next.start>next.end)",
  "applied={...next}",
  "localStorage.setItem(ACTIVITY_BASIS_KEY,next.basis)",
  "if(e.target?.id!=='activityDateBasis')return",
  "e.stopImmediatePropagation()",
  "if(text==='조회하기')",
  "if(norm(orgQuery()))return",
  "applyFromControls()",
  "if(text==='오늘')",
  "applyToday()",
  "window.activityFilteredBookings=()=>listForApplied()",
  "window.renderActivity=renderActivityOwned",
  "list.filter(b=>b.status==='confirmed'&&!isSettled(b)).length",
  "list.filter(b=>b.status==='pending').length",
  "list.filter(b=>b.status==='cancelled').length",
  "const settled=list.filter(isSettled).length"
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
if(!loader.includes('zrAdminActivityFilterFixV1'))fail('activity filter loader id missing');
if(!loader.includes('./admin_activity_filter_fix_v1.js?v=1')&&!loader.includes('./admin_activity_filter_fix_v1.js?v=2'))fail('activity filter loader path missing');

if(failed)process.exit(1);
ok('activity query applies selected reception/reservation basis with inclusive start/end dates and owns conflicting legacy handlers');
