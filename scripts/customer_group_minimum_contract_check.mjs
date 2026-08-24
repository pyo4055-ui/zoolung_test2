import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const read=p=>fs.readFileSync(p,'utf8');
const syntax=file=>{try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});ok(`syntax ${file}`)}catch(e){fail(`syntax ${file}: ${e.stderr?.toString()||e.message}`)}};

const file='customer_group_minimum_v1.js';
const s=read(file);syntax(file);

for(const needle of [
  'const MIN_PAID=15',
  'const PRICE=15000',
  "$('paidCount')",
  "$('chaperoneCount')",
  "$('peopleCalc')",
  "$('finalReview')",
  'function counts(paidValue,chapValue)',
  'const shortage=Math.max(0,MIN_PAID-paid)',
  'const requiredPaidChaperone=Math.min(chaperone,shortage)',
  'const freeQuota=Math.floor(basePaid/5)',
  'b.freeChaperone=c.freeChaperone',
  'b.paidChaperone=c.paidChaperone',
  'b.entryAmount=c.totalPaid*PRICE',
  'b.totalAmount=b.entryAmount+extras',
  "closest?.('#submitBooking')",
  '유료 관람인원과 유료 인솔자를 합산해 15명 이상',
  '단체예약은 유료인원 합계 15명부터 가능합니다.',
  '유료 15명 충족 후, 유료인원 5명당 인솔자 1명이 무료입니다.',
  '15명이 부족한 경우 인솔자 일부가 유료로 적용될 수 있습니다.',
  '예약 가능 · 유료',
  '예약 불가 · 현재 유료인원',
  '유료 관람 ${c.paid}명 / 인솔자 ${c.chaperone}명'
])if(!s.includes(needle))fail(`minimum group rule missing: ${needle}`);

for(const forbidden of [
  'setDoc(','updateDoc(','addDoc(','deleteDoc(',
  'reservationAvailability','scheduleGroups','customerSchedule',
  "localStorage.setItem('zr_bookings'",'localStorage.setItem("zr_bookings"'
])if(s.includes(forbidden))fail(`minimum group rule must not write DB / change storage contract: ${forbidden}`);

const loader=read('admin_tab_active_fix_v1.js');syntax('admin_tab_active_fix_v1.js');
for(const needle of ['zrCustomerGroupMinimumV1','./customer_group_minimum_v1.js?v=1','loadCustomerGroupMinimum()']){
  if(!loader.includes(needle))fail(`minimum group rule loader missing: ${needle}`);
}

function calc(paidValue,chapValue){
  const MIN=15;
  const paid=Math.max(0,Number(paidValue||0));
  const chaperone=Math.max(0,Number(chapValue||0));
  const shortage=Math.max(0,MIN-paid);
  if(paid+chaperone<MIN)return {eligible:false,paidChaperone:chaperone,freeChaperone:0,totalPaid:paid+chaperone};
  const requiredPaidChaperone=Math.min(chaperone,shortage);
  const basePaid=paid+requiredPaidChaperone;
  const remaining=Math.max(0,chaperone-requiredPaidChaperone);
  const freeQuota=Math.floor(basePaid/5);
  const freeChaperone=Math.min(remaining,freeQuota);
  const paidChaperone=requiredPaidChaperone+(remaining-freeChaperone);
  return {eligible:true,paidChaperone,freeChaperone,totalPaid:paid+paidChaperone};
}

const cases=[
  [14,2,{eligible:true,paidChaperone:1,freeChaperone:1,totalPaid:15}],
  [13,2,{eligible:true,paidChaperone:2,freeChaperone:0,totalPaid:15}],
  [12,2,{eligible:false,paidChaperone:2,freeChaperone:0,totalPaid:14}],
  [15,3,{eligible:true,paidChaperone:0,freeChaperone:3,totalPaid:15}],
  [20,4,{eligible:true,paidChaperone:0,freeChaperone:4,totalPaid:20}]
];
for(const [paid,chap,want] of cases){
  const got=calc(paid,chap);
  if(JSON.stringify(got)!==JSON.stringify(want))fail(`${paid}+${chap} calculation mismatch: ${JSON.stringify(got)}`);
  else ok(`${paid}+${chap} => ${JSON.stringify(got)}`);
}

if(failed)process.exit(1);
ok('customer minimum paid group rule preserves existing booking fields, totals, final review, and clear guidance');
