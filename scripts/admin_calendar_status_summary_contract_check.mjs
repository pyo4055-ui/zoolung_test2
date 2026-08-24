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
  "b.status==='confirmed'&&!isComplete(b)",
  "b.status==='cancelled'",
  '접수 ${pending}',
  '확정 ${confirmed}',
  '완료 ${completed}',
  '취소 ${cancelled}',
  '.status.pending',
  'zr-cal-status-summary',
  'min-height:132px!important',
  'max-height:31px',
  'flex-wrap:wrap',
  "day.querySelector(':scope > .meta')",
  "meta.insertAdjacentElement('afterend',summary)",
  "let renderedYm=''",
  'isCalendarRenderMutation',
  'if(records.some(isCalendarRenderMutation))renderedYm=selectedYm()'
])if(!s.includes(needle))fail(`calendar summary contract missing: ${needle}`);
if(s.includes("$('adminMonth')?.addEventListener('change'"))fail('changing month select alone must not rewrite visible calendar summaries');
if(s.includes('dayDetailContent')||s.includes('openDay('))fail('calendar summary must not modify day detail rendering');

const todayFile='admin_today_group_summary_v1.js';
const today=read(todayFile);
syntax(todayFile);
for(const needle of [
  "timeZone:'Asia/Seoul'",
  "typeof window.bookings==='function'",
  "b.date===date&&(b.status==='pending'||b.status==='confirmed')",
  'b.paidCount',
  'b.entryTime',
  'b.exitTime',
  'b.mealType',
  'b.playUse',
  '오늘 단체 요약',
  '예상 유료인원',
  '첫 입장',
  '마지막 퇴장',
  '식사 ${meal} · 놀이터 ${play}',
  'data-booking-id',
  "typeof window.openAdminBookingDetail==='function'",
  "cal.parentElement?.insertBefore(root,cal)"
])if(!today.includes(needle))fail(`today group summary contract missing: ${needle}`);
for(const forbidden of ['setDoc(','updateDoc(','addDoc(','deleteDoc(','localStorage.setItem(','sessionStorage.setItem(']){
  if(today.includes(forbidden))fail(`today group summary must remain display-only: ${forbidden}`);
}
if(today.includes('window.setStore')||today.includes('reservationAvailability')||today.includes('scheduleGroups'))fail('today group summary must not own reservation or schedule persistence');

const tabFix=read('admin_tab_active_fix_v1.js');
syntax('admin_tab_active_fix_v1.js');
for(const needle of [
  'zrAdminCalendarStatusSummaryV1',
  './admin_calendar_status_summary_v1.js?v=2',
  'zrAdminTodayGroupSummaryV1Script',
  './admin_today_group_summary_v1.js?v=1'
])if(!tabFix.includes(needle))fail(`calendar summary loader missing: ${needle}`);

if(failed)process.exit(1);
ok('calendar status summary and read-only today group summary preserve existing booking behavior');
