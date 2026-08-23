import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const read=p=>fs.readFileSync(p,'utf8');
const syntax=file=>{try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});ok(`syntax ${file}`)}catch(e){fail(`syntax ${file}: ${e.stderr?.toString()||e.message}`)}};

const file='admin_calendar_status_summary_v1.js';
const s=read(file);
syntax(file);
for(const needle of [
  "b.status==='pending'",
  "b.status==='confirmed'&&b.settlement&&b.settlement.savedAt",
  "b.status==='cancelled'",
  '접수 ${pending}',
  '완료 ${completed}',
  '취소 ${cancelled}',
  '.status.pending',
  'zr-cal-status-summary'
])if(!s.includes(needle))fail(`calendar summary contract missing: ${needle}`);
if(s.includes('dayDetailContent')||s.includes('openDay('))fail('calendar summary must not modify day detail rendering');

const tabFix=read('admin_tab_active_fix_v1.js');
syntax('admin_tab_active_fix_v1.js');
for(const needle of ['zrAdminCalendarStatusSummaryV1','./admin_calendar_status_summary_v1.js?v=1'])if(!tabFix.includes(needle))fail(`calendar summary loader missing: ${needle}`);

if(failed)process.exit(1);
ok('compact calendar status summary preserves detail view');
