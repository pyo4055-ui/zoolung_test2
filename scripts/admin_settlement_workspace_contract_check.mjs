import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const read=p=>fs.readFileSync(p,'utf8');
const file='admin_settlement_workspace_v1.js';
const s=read(file);
try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});ok(`syntax ${file}`)}catch(e){fail(`syntax ${file}: ${e.stderr?.toString()||e.message}`)}

for(const needle of [
  "KEY='zr_bookings'",
  "BASE_PRICE=15000",
  'window.zrOpenSettlementWorkspace=openSettlement',
  "m.id='zrSettlementWorkspaceModal'",
  "pay.textContent='실제결제'",
  "b.outsourcingVendorId=vendorSnap.id",
  'b.outsourcingVendorSnapshot=vendorSnap',
  'b.settlement={vendorId:vendorSnap.id',
  'actualPaidCount:c.paid',
  'actualFreeChaperone:c.free',
  'actualPaidChaperone:c.paidChap',
  'actualCafeAmount:c.cafe',
  'ticketUnitPrice:c.unit',
  'ticketAmount:c.ticket',
  'totalActualSales:c.total',
  'ticketFee:c.ticketFee',
  'cafeFee:c.cafeFee',
  'totalFee:c.totalFee',
  'savedAt:now',
  "b.settlementStatus='completed'",
  'b.settlementCompletedAt=now',
  "window.addActivity?.('settlement'",
  'feeAmount(ticket,vendor.ticketFeeType,vendor.ticketFeeValue,admissions)',
  'feeAmount(cafe,vendor.cafeFeeType,vendor.cafeFeeValue,1)',
  "root.querySelectorAll(':scope > .zr2-vendor,:scope > .zr2-settle,:scope > .zr-settlement-editor')",
  "row.querySelector('.zr-settle-open')",
  'decorateActivityCards()',
  'cleanupDetail()',
  'cleanupDay()',
  "render.__zrHold",
  "detail.__zrReservationDetailStatusSelect",
  "day.__zrCalendarStatusSelect",
  "w.__zrSettlementWorkspaceV1=true;w.__zrHold=true",
  "done.textContent='실제결제 완료'",
  "if(b?.status===HOLD)return '예약보류'"
])if(!s.includes(needle))fail(`settlement workspace missing: ${needle}`);

for(const forbidden of [
  'setDoc(','updateDoc(','addDoc(','deleteDoc(','firebase-firestore',
  'reservationAvailability','scheduleGroups','schedulePublished','customerSchedule',
  "b.status='confirmed'","b.status='hold'","b.status='cancelled'"
])if(s.includes(forbidden))fail(`settlement workspace must not own reservation status/DB schema: ${forbidden}`);

const loader=read('admin_tab_active_fix_v1.js');
for(const needle of ['function loadSettlementWorkspace()',"s.src='./admin_settlement_workspace_v1.js?v=1'",'loadSettlementWorkspace();'])if(!loader.includes(needle))fail(`settlement workspace loader missing: ${needle}`);

if(failed)process.exit(1);
ok('actual-payment workspace is status-independent and preserves existing outsourcing/settlement fields without direct Firestore ownership');
