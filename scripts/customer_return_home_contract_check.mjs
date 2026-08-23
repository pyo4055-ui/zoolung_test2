import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const file='customer_return_home_v1.js';
const s=fs.readFileSync(file,'utf8');

for(const f of [file,'admin_features_v2_loader.js']){
  try{execFileSync(process.execPath,['--check',f],{stdio:'pipe'});ok(`syntax ${f}`)}
  catch(e){fail(`syntax ${f}: ${e.stderr?.toString()||e.message}`)}
}

for(const needle of [
  "normalizedText(el)==='예약신청하기'",
  "zrCustomerReturnHomeBtn",
  "처음 화면으로 돌아가기",
  "입력한 예약정보가 초기화됩니다.",
  "zrCustomerReturnHomeNo",
  "zrCustomerReturnHomeYes",
  "window.location.reload()",
  "e.key!=='Escape'",
  "e.preventDefault();e.stopImmediatePropagation();",
  "modal.addEventListener('click',e=>{e.stopPropagation()})",
  "modal.addEventListener('pointerdown',e=>{e.stopPropagation()})"
])if(!s.includes(needle))fail(`return-home contract missing: ${needle}`);

for(const forbidden of [
  'setStore(',
  'setDoc(',
  'updateDoc(',
  'deleteDoc(',
  'reservationAvailability',
  'scheduleGroups',
  "localStorage.setItem('zr_bookings'",
  'requestBookingStatus(',
  'submitBooking(',
  'confirmBooking('
])if(s.includes(forbidden))fail(`return-home module must not touch booking writes: ${forbidden}`);

const loader=fs.readFileSync('admin_features_v2_loader.js','utf8');
if(!loader.includes("['zrCustomerReturnHomeV1','./customer_return_home_v1.js?v=1']"))fail('return-home module is not loaded by active loader');

if(failed)process.exit(1);
ok('customer return-home flow is isolated from reservation writes and requires explicit confirmation');
