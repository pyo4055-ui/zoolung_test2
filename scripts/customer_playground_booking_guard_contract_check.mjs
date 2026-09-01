import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const file='customer_playground_booking_guard_v1.js';
const s=fs.readFileSync(file,'utf8');

for(const f of [file,'admin_features_v2_loader.js','customer_features_loader_v1.js']){
  try{execFileSync(process.execPath,['--check',f],{stdio:'pipe'});ok(`syntax ${f}`)}
  catch(e){fail(`syntax ${f}: ${e.stderr?.toString()||e.message}`)}
}

for(const needle of [
  "$('visitDay')",
  "String($('playUse')?.value||'')==='yes'",
  "function playStart(){return $('playStart')}",
  "function playDuration(){return $('playDuration')}",
  "function playEnd(){return $('playEnd')}",
  "if(noDate&&requested){lockControl(playStart());lockControl(playDuration())}",
  "el.disabled=true",
  "el.disabled=el.dataset.zrVisitDateWasDisabled==='1'",
  '방문 희망일을 먼저 선택하면 놀이터 예약 가능 시간을 확인할 수 있습니다.',
  '다른 단체 예약으로 인해 이 시간대는 최대 30분 이용 가능합니다.',
  '60분 이용을 원하시면 다른 입장시간을 선택해주세요.',
  '이 놀이터 입장시간은 30분 또는 60분 이용이 가능합니다.',
  "const OVERLAP_ATTR='zrOverlapDisabled'",
  "const ENTRY_START_ATTR='zrEntryLinkDisabled'",
  "const ENTRY_DURATION_ATTR='zrEntryDurationDisabled'",
  "const ENTRY_RULE_SUFFIX=' (입장 직전만 가능)'",
  "const ENTRY_OVERLAP_SUFFIX=' (60분 마감)'",
  'function controlsRow()',
  "row.insertAdjacentElement('afterend',n)",
  'white-space:nowrap',
  'function syncEntryStartLimit()',
  "const entry=timeMinutes($('entryTime')?.value||'')",
  'if(gap!==30&&gap!==60){disableEntryStartOption',
  "if(!next||baseDisabled.get(next))disableEntryStartOption(o,'overlap')",
  "start.dispatchEvent(new Event('change',{bubbles:true}))",
  'function sixtyMinutesFit()',
  "const nextOption=[...start.options].find",
  'if(!nextOption||nextOption.disabled)return false',
  "o60.disabled=true;o60.dataset[OVERLAP_ATTR]='1'",
  'if(selected===60&&o30&&!o30.disabled)',
  "duration.dispatchEvent(new Event('change',{bubbles:true}))",
  'function syncEntryDurationLimit()',
  'if((mins===30||mins===60)&&mins!==required)disableEntryDurationOption(o)',
  'syncEntryStartLimit();',
  'syncDurationLimit();',
  'syncEntryDurationLimit();',
  '동물원 입장 전 놀이터는 입장시간 바로 직전 30분 또는 60분만 이용할 수 있습니다.',
  '다른 단체와 한 구간이라도 겹치면 예약할 수 없습니다.',
  'function preEntryValidationMessage()',
  "return '동물원 입장 전 놀이터는 입장시간 바로 직전 30분 또는 60분으로만 예약할 수 있습니다.'",
  "return '선택한 놀이터 시간은 다른 단체 예약과 겹쳐 이용할 수 없습니다. 다른 시간을 선택해주세요.'",
  "if(e.target?.closest?.('#submitBooking'))guardSubmit(e)",
  "['visitMonth','visitDay','playUse','playStart','playDuration','entryTime','exitTime']"
])if(!s.includes(needle))fail(`playground booking guard contract missing: ${needle}`);

for(const forbidden of [
  'setStore(',
  'setDoc(',
  'updateDoc(',
  'deleteDoc(',
  'firebase-firestore',
  'reservationAvailability',
  'scheduleGroups',
  "localStorage.setItem('zr_bookings'"
])if(s.includes(forbidden))fail(`playground booking guard must stay display/input-only: ${forbidden}`);

const adminLoader=fs.readFileSync('admin_features_v2_loader.js','utf8');
if(!adminLoader.includes("['zrCustomerPlaygroundBookingGuardV1','./customer_playground_booking_guard_v1.js?v=1']"))fail('playground booking guard is not loaded by active admin compatibility loader');
const customerLoader=fs.readFileSync('customer_features_loader_v1.js','utf8');
if(!customerLoader.includes("['zrCustomerPlaygroundBookingGuardV1','./customer_playground_booking_guard_v1.js?v=1']"))fail('playground booking guard is not loaded by dedicated customer runtime');

if(failed)process.exit(1);
ok('customer playground booking keeps pre-entry use contiguous, preserves overlap blocking, limits durations and stays write-free');
