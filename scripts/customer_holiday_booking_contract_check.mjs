import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const file='customer_holiday_booking_setting_v1.js';
const s=fs.readFileSync(file,'utf8');

for(const f of [file,'admin_features_v2_loader.js']){
  try{execFileSync(process.execPath,['--check',f],{stdio:'pipe'});ok(`syntax ${f}`)}
  catch(e){fail(`syntax ${f}: ${e.stderr?.toString()||e.message}`)}
}

for(const needle of [
  "holidayBookingAllowed!==false",
  "'2026-09-24','2026-09-25','2026-09-26'",
  "'2026-10-03','2026-10-05','2026-10-09'",
  "FIXED_HOLIDAY_MD",
  "zrHolidayBookingSettingWrap",
  "zrHolidayBookingAllowed",
  "공휴일 예약 가능 여부",
  ">예약 가능<",
  ">예약 불가<",
  "$('saveBookingPeriod')",
  "holidayBookingAllowed:sel.value!=='no'",
  "writeSettings(s)",
  "wrapped.__zrHolidayBookingSetting=true",
  "window.renderVisitDays=wrapped",
  "o.dataset.zrHolidayWasDisabled=o.disabled?'1':'0'",
  "o.disabled=o.dataset.zrHolidayWasDisabled==='1'",
  "HOLIDAY_SUFFIX=' (공휴일 예약 불가)'",
  "공휴일 예약이 현재 설정에서 허용되지 않습니다."
])if(!s.includes(needle))fail(`holiday booking contract missing: ${needle}`);

for(const forbidden of [
  'setStore(',
  'setDoc(',
  'updateDoc(',
  'deleteDoc(',
  'firebase-firestore',
  'reservationAvailability',
  'scheduleGroups',
  "localStorage.setItem('zr_bookings'",
  'openAdminQuickBooking=function'
])if(s.includes(forbidden))fail(`holiday booking setting must stay isolated from booking/schedule writes: ${forbidden}`);

const loader=fs.readFileSync('admin_features_v2_loader.js','utf8');
if(!loader.includes("['zrCustomerHolidayBookingSettingV1','./customer_holiday_booking_setting_v1.js?v=1']"))fail('holiday booking setting is not loaded by active loader');

const admin=fs.readFileSync('admin2_part1.txt','utf8');
for(const date of ['2026-08-17','2026-09-24','2026-09-25','2026-09-26','2026-10-05']){
  if(!admin.includes(`'${date}'`)||!s.includes(`'${date}'`))fail(`holiday list mismatch for ${date}`);
}

if(failed)process.exit(1);
ok('configurable holiday booking stays customer-date-only and preserves pre-existing disabled dates');
