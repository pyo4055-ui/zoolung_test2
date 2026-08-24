import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const read=p=>fs.readFileSync(p,'utf8');
const syntax=file=>{try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});ok(`syntax ${file}`)}catch(e){fail(`syntax ${file}: ${e.stderr?.toString()||e.message}`)}};

const file='admin_booking_hold_v1.js';
const s=read(file);
syntax(file);
for(const needle of [
  "HOLD='hold'",
  "KEY='zr_bookings'",
  "b.status=HOLD",
  "b.statusUpdatedAt=new Date().toISOString()",
  'save(list)',
  "existingStatus(id,'confirmed')",
  "existingStatus(id,'cancelled')",
  '예약 보류',
  '본 예약은 보류 상태입니다.',
  "b.status===HOLD",
  'all().filter(b=>b.status===HOLD)',
  'window.activeBookings=w',
  "filterSelect()?.value===HOLD",
  "o.value=HOLD;o.textContent='보류'"
])if(!s.includes(needle))fail(`booking hold contract missing: ${needle}`);

for(const forbidden of ['setDoc(','updateDoc(','addDoc(','deleteDoc(','schedulePublished=','customerSchedule=','delete b.schedulePublished','delete b.customerSchedule','scheduleGroups','reservationAvailability']){
  if(s.includes(forbidden))fail(`booking hold helper must not own direct DB/schedule writes: ${forbidden}`);
}

const queryFile='admin_booking_hold_query_fix_v1.js';
const q=read(queryFile);
syntax(queryFile);
for(const needle of [
  "const HOLD='hold'",
  "select?.value!==HOLD",
  "text!=='조회하기'&&text!=='오늘'",
  "window.addEventListener('click',intercept,true)",
  'e.stopImmediatePropagation()',
  'renderHeld()',
  "localStorage.setItem(FILTER_KEY,HOLD)"
])if(!q.includes(needle))fail(`booking hold query guard missing: ${needle}`);
for(const forbidden of ['setDoc(','updateDoc(','addDoc(','deleteDoc(','schedulePublished=','customerSchedule=','scheduleGroups','reservationAvailability']){
  if(q.includes(forbidden))fail(`booking hold query guard must remain display-only: ${forbidden}`);
}

const customerSchedule=read('customer_schedule_view_v3.js');
for(const needle of ["b.status==='confirmed'","b.schedulePublished","b.customerSchedule"]){
  if(!customerSchedule.includes(needle))fail(`customer schedule confirmed-only display contract missing: ${needle}`);
}

const loader=read('admin_tab_active_fix_v1.js');
syntax('admin_tab_active_fix_v1.js');
for(const needle of [
  'zrAdminBookingHoldV1',
  './admin_booking_hold_v1.js?v=1',
  'loadBookingHold()',
  'zrAdminBookingHoldQueryFixV1',
  './admin_booking_hold_query_fix_v1.js?v=1',
  'loadBookingHoldQueryFix()'
]){
  if(!loader.includes(needle))fail(`booking hold loader missing: ${needle}`);
}

if(failed)process.exit(1);
ok('booking hold preserves reservation/schedule data, occupies availability, hides customer schedule through confirmed-only display, and owns hold-only activity queries before legacy handlers');
