import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const read=p=>fs.readFileSync(p,'utf8');
const syntax=file=>{try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});ok(`syntax ${file}`)}catch(e){fail(`syntax ${file}: ${e.stderr?.toString()||e.message}`)}};

const file='admin_calendar_status_select_v1.js';
const s=read(file);syntax(file);
for(const needle of [
  "$('dayDetailContent')",
  'zr-cal-state-select',
  '<option value="confirmed">예약 확정</option>',
  '<option value="hold">예약 보류</option>',
  '<option value="cancelled">예약 취소</option>',
  "saveBtn.textContent='저장'",
  "edit.textContent='예약 수정'",
  'function directHold(id)',
  'function directConfirmed(id)',
  "window.setBookingStatus==='function'",
  "fn(id,'cancelled')",
  "restoreCancelled(id,'confirmed')",
  'restoreCancelled(id,HOLD)',
  'delete b.cancelReason',
  'delete b.cancelledAt',
  'delete b.cancelledBy',
  'wrapped.__zrCalendarStatusSelect=true',
  "badge.textContent='보류'"
])if(!s.includes(needle))fail(`calendar status selector missing: ${needle}`);

for(const forbidden of [
  'adminBookingDetailContent','activityList','existingBookingList',
  'setDoc(','updateDoc(','addDoc(','deleteDoc(',
  'reservationAvailability','scheduleGroups','schedulePublished=','customerSchedule='
])if(s.includes(forbidden))fail(`calendar status selector must stay calendar-only / indirect DB: ${forbidden}`);

const loader=read('admin_tab_active_fix_v1.js');syntax('admin_tab_active_fix_v1.js');
for(const needle of ['zrAdminCalendarStatusSelectV1','./admin_calendar_status_select_v1.js?v=1','loadCalendarStatusSelect()']){
  if(!loader.includes(needle))fail(`calendar status selector loader missing: ${needle}`);
}

if(failed)process.exit(1);
ok('calendar-only booking status selector keeps other admin/customer screens unchanged');
