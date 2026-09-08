import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const checkSyntax=file=>{try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'})}catch(e){fail(`syntax ${file}: ${e.stderr?.toString()||e.message}`)}};
const must=(text,file,items)=>items.forEach(x=>{if(!text.includes(x))fail(`${file} missing: ${x}`)});

const loader=fs.readFileSync('admin_features_v2_loader.js','utf8');
must(loader,'admin_features_v2_loader.js',['customer_lookup_actions_v1.js?v=2','admin_cancel_visibility_v1.js?v=1']);

const customer=fs.readFileSync('customer_lookup_actions_v1.js','utf8');
checkSyntax('customer_lookup_actions_v1.js');
must(customer,'customer_lookup_actions_v1.js',[
  "return includeCancelled?status!=='rejected':!['cancelled','rejected'].includes(status)",
  'function syncLookupActions()',
  "const all=customerBookings(true),active=cancellableCustomerBookings()",
  "existing?.classList.remove('hidden')",
  "$('changeExisting')?.classList.toggle('hidden',active.length===0)",
  "$('cancelExisting')?.classList.toggle('hidden',active.length===0)",
  "list.classList.remove('hidden')",
  'zrCancelledBookingRecordsV2',
  '본 예약은 취소 되었습니다.',
  '취소일시','취소구분','취소 사유',
  "const matches=cancellableCustomerBookings()"
]);

const admin=fs.readFileSync('admin_cancel_visibility_v1.js','utf8');
checkSyntax('admin_cancel_visibility_v1.js');
must(admin,'admin_cancel_visibility_v1.js',[
  'activityList','adminBookingDetailContent','openAdminBookingDetail','cancelReason','취소 사유','취소 사유 미기록','zr-admin-cancelled'
]);
for(const bad of ['setStore(','setDoc(','getFirestore(','firebase-firestore'])if(admin.includes(bad))fail(`admin cancellation visibility must stay display-only: ${bad}`);

const reviewFile='cancel_review_state_v1.js';
const review=fs.readFileSync(reviewFile,'utf8');
checkSyntax(reviewFile);
must(review,reviewFile,[
  '__ZR_CANCEL_REVIEW_STATE_V1',
  "String(b?.status||'')==='cancelled'&&b?.cancelReviewed===false",
  "function reviewState(b){return b?.cancelReviewed===false?'pending':'done'}",
  'function markCancelledUnreviewed(id)',
  'b.cancelReviewed=false',
  'function markReviewed(id)',
  'b.cancelReviewed=true',
  'b.cancelReviewedAt=new Date().toISOString()',
  'b.cancelReviewedBy=staffName()',
  'window.openCustomerCancel=wrapped',
  'window.setBookingStatus=wrapped',
  "String(status||'')==='cancelled'",
  'zrActivityModeTabsV1','zrActivityMainSubtabV1','zrActivityCancelSubtabV1',
  '예약취소 조회','확인 필요','확인 완료','전체',
  'zrCancelReviewBasisV1','취소일 기준','예약일 기준','zrCancelReviewStatusV1',
  'booking-item zr-cancel-workspace-card','PAGE_SIZE=8',
  'showCancelWorkspace({forcePending:true})',
  'zrSmartCancelReview','data-zr-cancel-review-open','zrOpenCancelReviewV1',
  '@media(max-width:900px)',
  "window.setStore(KEY,list)"
]);
for(const bad of ['setDoc(','updateDoc(','deleteDoc(','firebase-firestore'])if(review.includes(bad))fail(`${reviewFile} must use the existing reservation bridge instead of direct Firestore writes: ${bad}`);
if(review.includes("b?.cancelReviewed!==true"))fail('legacy cancellations without review state must not be retroactively counted as unread');
if(review.includes("status.value='cancelled'"))fail('notification shortcut must open the dedicated cancellation review workspace, not the general cancelled filter');
if(review.includes('setInterval('))fail('cancellation review workflow must not add a permanent polling interval');

const adminEntry=fs.readFileSync('admin.html','utf8');
const customerEntry=fs.readFileSync('customer.html','utf8');
must(adminEntry,'admin.html',['cancel_review_state_v1.js?v=2']);
must(customerEntry,'customer.html',['cancel_review_state_v1.js?v=2']);

const ops=fs.readFileSync('admin_ops_v10.js','utf8');
must(ops,'admin_ops_v10.js',["cancelled?2:0","cancelText(b)"]);

if(failed){console.error('\nCancellation contract failed.');process.exit(1)}
console.log('Cancellation visibility and dedicated review workspace contract passed.');
