import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const read=p=>fs.readFileSync(p,'utf8');
const syntax=file=>{try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});ok(`syntax ${file}`)}catch(e){fail(`syntax ${file}: ${e.stderr?.toString()||e.message}`)}};

const adminFile='admin_finish_low_risk_v1.js';
const customerFile='customer_finish_low_risk_v1.js';
const admin=read(adminFile),customer=read(customerFile);
const adminEntry=read('admin.html'),customerEntry=read('customer.html');
syntax(adminFile);syntax(customerFile);

for(const needle of [
  'admin_finish_low_risk_v1.js?v=1',
])if(!adminEntry.includes(needle))fail(`admin entry missing: ${needle}`);
for(const needle of [
  'customer_finish_low_risk_v1.js?v=1',
])if(!customerEntry.includes(needle))fail(`customer entry missing: ${needle}`);

for(const needle of [
  'zrAdminMobileMenuTrigger',
  '공용 운영 메모',
  'zrAdminDailyMemoV1',
  'data-kind="reservation"',
  'data-mobile-go="activity"',
  "start.value=''",
  "end.value=''",
  "status.value='pending'",
  "norm(b.textContent)==='조회하기'"
])if(!admin.includes(needle))fail(`admin low-risk batch missing: ${needle}`);

for(const needle of [
  "['privacy','inqPrivacy']",
  'zr-final-privacy-invalid',
  '현재 예약하신 내역이 없습니다.',
  'zrCustomerEntryResultsV2',
  '일치하는 예약 내역이 없습니다.',
  '유료인원 합계 15명 이상',
  '15명 충족 후 유료인원 5명당 인솔자 1명이 무료입니다.'
])if(!customer.includes(needle))fail(`customer low-risk batch missing: ${needle}`);

for(const [name,source] of [[adminFile,admin],[customerFile,customer]]){
  for(const forbidden of ['setDoc(','updateDoc(','addDoc(','deleteDoc(','localStorage.setItem(','sessionStorage.setItem(']){
    if(source.includes(forbidden))fail(`${name} must stay UI/routing-only: ${forbidden}`);
  }
}

const minimum=read('customer_group_minimum_v1.js');
for(const needle of [
  'const MIN_PAID=15',
  'const requiredPaidChaperone=Math.min(chaperone,shortage)',
  'const freeQuota=Math.floor(basePaid/5)',
  'b.freeChaperone=c.freeChaperone',
  'b.paidChaperone=c.paidChaperone'
])if(!minimum.includes(needle))fail(`minimum calculation contract changed unexpectedly: ${needle}`);

if(failed)process.exit(1);
ok('final low-risk UX batch keeps data contracts intact while adding mobile memo, privacy emphasis, empty lookup surface, concise minimum copy, and pending-only routing');
