import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const read=p=>fs.readFileSync(p,'utf8');
const syntax=file=>{try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'})}catch(e){fail(`${file} syntax: ${e.stderr?.toString()||e.message}`)}};

for(const file of ['admin_reservation_cleanup_v1.js','admin_reservation_cleanup_reliability_v1.js','admin_reservation_cleanup_cancel_v1.js','admin_tab_active_fix_v1.js'])syntax(file);
const cleanup=read('admin_reservation_cleanup_v1.js');
const reliability=read('admin_reservation_cleanup_reliability_v1.js');
const cancelCleanup=read('admin_reservation_cleanup_cancel_v1.js');
const loader=read('admin_tab_active_fix_v1.js');
const rules=read('firestore.rules');

for(const needle of [
  'window.__ZR_ADMIN_RESERVATION_CLEANUP_V1=true',
  "const KEY='zr_bookings'",
  'monthsAgo(today(),6)',
  "String(b?.status||'')==='confirmed'",
  'settlementDone(b)',
  "btn.textContent='과거 예약 정리'",
  'id="zrCleanupSubtab">예약 정리',
  'id="zrCleanupHistorySubtab">정리 내역',
  'id="zrCleanupSelectPage"',
  'id="zrCleanupSelected"',
  'id="zrCleanupAllResult"',
  'data-zr-cleanup-one',
  'data-zr-cleanup-page',
  'data-zr-cleanup-history-page',
  'confirmCleanup(items.length)',
  'if(!confirm(',
  'return confirm(',
  "F.doc(db,'reservations',id)",
  "F.doc(db,'reservationAvailability',id)",
  "F.doc(db,'scheduleGroups',id)",
  "archiveType:'reservationCleanup'",
  'archived:true',
  'visitDate:String(b.date||\'\')',
  'cleanupDate:date',
  'cleanupAt:F.serverTimestamp()',
  "F.where('archived','==',true)",
  "x.archiveType==='reservationCleanup'",
  '연락처·문의내용 등 개인정보는 남기지 않습니다.',
  '엑셀 백업'
])if(!cleanup.includes(needle))fail(`cleanup contract missing: ${needle}`);

for(const forbidden of [
  "localStorage.setItem('",
  'delete(F.doc(db,\'scheduleGroups\'',
  "batch.delete(F.doc(db,'scheduleGroups'",
  'contact:String(b.',
  'managerName:String(b.',
  'notes:String(b.'
])if(cleanup.includes(forbidden))fail(`cleanup must not introduce forbidden storage/history detail: ${forbidden}`);

for(const needle of [
  'window.__ZR_ADMIN_RESERVATION_CLEANUP_RELIABILITY_V1=true',
  "const BUSY=new Set()",
  'auth.currentUser?.getIdToken?.(true)',
  'F.enableNetwork(db)',
  "batch.set(F.doc(db,'scheduleGroups',id),history)",
  "batch.delete(F.doc(db,'reservations',id))",
  "batch.delete(F.doc(db,'reservationAvailability',id))",
  "el.textContent='정리 중…'",
  'errorLabel(e)',
  'e.stopImmediatePropagation()',
  "document.addEventListener('click',intercept,true)",
  "$('zrCleanupApply')?.click?.()",
  'function phoneLast4(b)',
  'function confirmationPreview(items)',
  '연락처 뒤 4자리',
  '연락처는 정리 내역에 저장하지 않습니다.',
  'if(!confirmCleanup(valid))return;',
  'function loadCancelCleanup()',
  "s.src='./admin_reservation_cleanup_cancel_v1.js?v=1'",
  'loadCancelCleanup();'
])if(!reliability.includes(needle))fail(`cleanup reliability contract missing: ${needle}`);
for(const forbidden of [
  "document.querySelectorAll('#tab-cleanup button')",
  'buttons.forEach(b=>b.disabled=true)',
  "batch.delete(F.doc(db,'scheduleGroups'",
  'contact:String(b.',
  'phone:String(b.',
  'phoneNumber:String(b.',
  'contactPhone:String(b.',
  'managerName:String(b.',
  'notes:String(b.'
])if(reliability.includes(forbidden))fail(`cleanup reliability must stay targeted/minimal: ${forbidden}`);

for(const needle of [
  'window.__ZR_ADMIN_RESERVATION_CLEANUP_CANCEL_V1=true',
  "String(b?.status||'')==='cancelled'",
  'cancelDateKey(b)',
  'monthsAgo(today(),6)',
  "sub.textContent='취소 정리'",
  'id="zrCancelCleanupPanel"',
  'id="zrCancelCleanupSelectPage"',
  'id="zrCancelCleanupSelected"',
  'id="zrCancelCleanupAll"',
  'data-zr-cancel-cleanup-one',
  'data-zr-cancel-cleanup-page',
  '취소일 기준 6개월',
  '연락처 뒤 4자리',
  '연락처와 취소 사유는 정리 내역에 저장하지 않습니다.',
  "cleanupMode:'취소 정리'",
  "archiveType:'reservationCleanup'",
  "batch.set(F.doc(db,'scheduleGroups',id),history)",
  "batch.delete(F.doc(db,'reservations',id))",
  "batch.delete(F.doc(db,'reservationAvailability',id))",
  "$('zrCleanupApply')?.click?.()",
  '.zr-cleanup-selectall',
  'white-space:nowrap!important',
  '#tab-cleanup [data-zr-cleanup-one]',
  'background:#fff1f1!important',
  'grid-template-columns:repeat(3,minmax(0,1fr))!important'
])if(!cancelCleanup.includes(needle))fail(`cancel cleanup contract missing: ${needle}`);
for(const forbidden of [
  "batch.delete(F.doc(db,'scheduleGroups'",
  'cancelReason:String(b.',
  'contact:String(b.',
  'phone:String(b.',
  'phoneNumber:String(b.',
  'contactPhone:String(b.',
  'managerName:String(b.',
  'notes:String(b.'
])if(cancelCleanup.includes(forbidden))fail(`cancel cleanup must not persist personal/cancel detail: ${forbidden}`);

for(const needle of [
  'function loadReservationCleanup()',
  "s.src='./admin_reservation_cleanup_v1.js?v=1'",
  'loadReservationCleanup();',
  'function loadReservationCleanupReliability()',
  "s.src='./admin_reservation_cleanup_reliability_v1.js?v=1'",
  'loadReservationCleanupReliability();',
  "if(clicked.id!=='zrCleanupTabBtn'",
  "gray('zrCleanupTabBtn')",
  "document.getElementById('tab-cleanup')?.classList.add('hidden')",
  "document.addEventListener('zr:admin-runtime-ready',loadReservationCleanup,{once:true})",
  "document.addEventListener('zr:admin-runtime-ready',loadReservationCleanupReliability,{once:true})"
])if(!loader.includes(needle))fail(`cleanup loader contract missing: ${needle}`);

for(const needle of [
  "request.auth.token.email == 'zoolung09@zoolungzoolung.com'",
  'match /reservations/{reservationId}',
  'match /reservationAvailability/{reservationId}',
  'allow delete: if isScheduleStaff();',
  'resource.data.ownerUid == request.auth.uid',
  'request.resource.data.ownerUid == request.auth.uid',
  'allow read: if request.auth != null;',
  'match /scheduleGroups/{groupId}',
  'match /scheduleSharedMemos/{dateId}',
  'match /customerGuides/{guideId}',
  'match /{document=**}',
  'allow read, write: if false;',
  'allow delete: if false;'
])if(!rules.includes(needle))fail(`cleanup Firestore rule contract missing: ${needle}`);

if((rules.match(/allow delete: if isScheduleStaff\(\);/g)||[]).length!==2)fail('staff delete permission must be limited to reservations and reservationAvailability');
if((rules.match(/allow delete: if false;/g)||[]).length<3)fail('schedule, memo, and customer guide deletes must remain blocked');

if(failed){console.error('\nAdmin reservation cleanup contract failed.');process.exit(1)}
console.log('Admin reservation cleanup contract passed.');
