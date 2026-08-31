import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const file='customer_holiday_booking_setting_v1.js';
const syncFile='reservation_settings_firebase_sync_v1.js';
const s=fs.readFileSync(file,'utf8');
const sync=fs.readFileSync(syncFile,'utf8');

for(const f of [file,syncFile,'admin_features_v2_loader.js']){
  try{execFileSync(process.execPath,['--check',f],{stdio:'pipe'});ok(`syntax ${f}`)}
  catch(e){fail(`syntax ${f}: ${e.stderr?.toString()||e.message}`)}
}

for(const needle of [
  "holidayBookingAllowed!==false",
  "'2026-05-01'",
  "'2026-07-17'",
  "'2026-09-24','2026-09-25','2026-09-26'",
  "'2026-10-03','2026-10-05','2026-10-09'",
  "KR_HOLIDAYS_2027",
  "'2027-02-06','2027-02-07','2027-02-08','2027-02-09'",
  "'2027-05-01','2027-05-03','2027-05-05','2027-05-13'",
  "'2027-07-17','2027-07-19'",
  "'2027-08-15','2027-08-16'",
  "'2027-09-14','2027-09-15','2027-09-16'",
  "'2027-10-03','2027-10-04','2027-10-09','2027-10-11'",
  "'2027-12-25','2027-12-27'",
  "FIXED_HOLIDAY_MD",
  "'05-01'",
  "'07-17'",
  "zrHolidayBookingSettingWrap",
  "zrHolidayBookingAllowed",
  "공휴일 예약 가능 여부",
  ">예약 가능<",
  ">예약 불가<",
  "$('saveBookingPeriod')",
  "holidayBookingAllowed:sel.value!=='no'",
  "writeSettings(s)",
  "function loadSharedReservationSettings()",
  "s.src='./reservation_settings_firebase_sync_v1.js?v=1'",
  "document.addEventListener('zr:reservation-settings-synced'",
  "for(const key of Object.keys(base))",
  "wrapped[key]=base[key]",
  "wrapped.__zrHolidayBookingSetting=true",
  "window.renderVisitDays=wrapped",
  "const hooked=hookVisitDays()",
  "setInterval(refreshHooks,500)",
  "if(e.target?.id==='visitMonth')",
  "o.dataset.zrHolidayWasDisabled=o.disabled?'1':'0'",
  "o.disabled=o.dataset.zrHolidayWasDisabled==='1'",
  "HOLIDAY_SUFFIX=' (공휴일 예약 불가)'",
  "function localToday()",
  "function isPastOrToday(date)",
  "function removePastAndTodayOptions(day)",
  "value<=td)o.remove()",
  "const removedSelected=removePastAndTodayOptions(day)",
  "당일 예약은 불가합니다. 익일부터 예약해주세요.",
  "공휴일 예약이 현재 설정에서 허용되지 않습니다."
])if(!s.includes(needle))fail(`holiday booking contract missing: ${needle}`);

for(const forbidden of [
  'MutationObserver',
  'setInterval(apply,',
  "id==='visitDay')setTimeout(applyCustomerHolidayAvailability",
  'setStore(',
  'setDoc(',
  'updateDoc(',
  'deleteDoc(',
  'firebase-firestore',
  'reservationAvailability',
  'scheduleGroups',
  "localStorage.setItem('zr_bookings'",
  'openAdminQuickBooking=function'
])if(s.includes(forbidden))fail(`holiday booking setting performance/safety contract violated: ${forbidden}`);

for(const needle of [
  "window.__ZR_RESERVATION_SETTINGS_FIREBASE_SYNC_V1=true",
  "const COLLECTION='customerGuides'",
  "const DOC_ID='main'",
  "const STAFF_EMAIL='zoolung09@zoolungzoolung.com'",
  'reservationSettings:payload',
  'reservationSettingsVersion:1',
  'reservationSettingsUpdatedAt:F.serverTimestamp()',
  '},{merge:true})',
  'F.onSnapshot(F.doc(z.db,COLLECTION,DOC_ID)',
  'if(data.reservationSettings&&typeof data.reservationSettings===\'object\')setRemote(data.reservationSettings)',
  'if(remoteReady&&!isStaff())',
  'if(isStaff())queueWrite(value)',
  'function bootstrapIfNeeded()',
  'if(remoteReady||bootstrapPending||!F||!bridge()?.db||!isStaff())return',
  "document.dispatchEvent(new CustomEvent('zr:reservation-settings-synced'",
  "window.settings=settingsWrapper",
  "window.saveSettings=saveWrapper"
])if(!sync.includes(needle))fail(`shared reservation settings contract missing: ${needle}`);
for(const forbidden of [
  "const COLLECTION='reservations'",
  "const COLLECTION='reservationAvailability'",
  "const COLLECTION='scheduleGroups'",
  "localStorage.setItem('zr_bookings'",
  'deleteDoc(',
  'writeBatch('
])if(sync.includes(forbidden))fail(`shared settings sync must not alter reservation data contract: ${forbidden}`);

const loader=fs.readFileSync('admin_features_v2_loader.js','utf8');
if(!loader.includes("['zrCustomerHolidayBookingSettingV1','./customer_holiday_booking_setting_v1.js?v=1']"))fail('holiday booking setting is not loaded by active loader');

const admin=fs.readFileSync('admin2_part1.txt','utf8');
for(const date of ['2026-08-17','2026-09-24','2026-09-25','2026-09-26','2026-10-05']){
  if(!admin.includes(`'${date}'`)||!s.includes(`'${date}'`))fail(`holiday list mismatch for ${date}`);
}

if(failed)process.exit(1);
ok('customer booking shares reservation settings across devices, covers 2027 holidays, preserves configurable holiday behavior, and avoids reservation-data writes');
