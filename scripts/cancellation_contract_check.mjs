import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const checkSyntax=file=>{try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'})}catch(e){fail(`syntax ${file}: ${e.stderr?.toString()||e.message}`)}};
const must=(text,file,items)=>items.forEach(x=>{if(!text.includes(x))fail(`${file} missing: ${x}`)});

const loader=fs.readFileSync('admin_features_v2_loader.js','utf8');
must(loader,'admin_features_v2_loader.js',['customer_lookup_actions_v1.js?v=2','admin_cancel_visibility_v1.js?v=1']);

const customerLoader=fs.readFileSync('customer_features_loader_v1.js','utf8');
checkSyntax('customer_features_loader_v1.js');
must(customerLoader,'customer_features_loader_v1.js',["['zrCustomerLookupActionsV1','./customer_lookup_actions_v1.js?v=2']","['zrCustomerCancelCommitV1','./customer_cancel_commit_v1.js?v=2']"]);

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
  'activityList','adminBookingDetailContent','openAdminBookingDetail','cancelReason','취소 사유','취소 사유 미기록','zr-admin-cancelled',
  'function setHtmlIfChanged(el,html){if(el&&el.innerHTML!==html)el.innerHTML=html}',
  'setHtmlIfChanged(box,`<b>취소 사유</b><br>${esc(reason)}`)'
]);
for(const bad of ['setStore(','setDoc(','getFirestore(','firebase-firestore'])if(admin.includes(bad))fail(`admin cancellation visibility must stay display-only: ${bad}`);
if((admin.match(/box\.innerHTML=/g)||[]).length)fail('admin cancellation visibility must not rewrite cancellation DOM on every observer pass');

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
  'function setTextIfChanged(el,value)',
  'function setHtmlIfChanged(el,html)',
  "setTextIfChanged($('zrCancelKpiAll'),all.length)",
  "setHtmlIfChanged($('zrCancelReviewListV1'),listHtml)",
  "setHtmlIfChanged($('zrCancelReviewPagerV1'),pagerHtml(cancelPage,pages))",
  '@media(max-width:900px)',
  "window.setStore(KEY,list)"
]);
for(const bad of ['setDoc(','updateDoc(','deleteDoc(','firebase-firestore'])if(review.includes(bad))fail(`${reviewFile} must use the existing reservation bridge instead of direct Firestore writes: ${bad}`);
if(review.includes("b?.cancelReviewed!==true"))fail('legacy cancellations without review state must not be retroactively counted as unread');
if(review.includes("status.value='cancelled'"))fail('notification shortcut must open the dedicated cancellation review workspace, not the general cancelled filter');
if(review.includes('setInterval('))fail('cancellation review workflow must not add a permanent polling interval');
if(review.includes("$('zrCancelReviewListV1').innerHTML="))fail('cancellation workspace list must not rewrite identical DOM during smart-panel observer refreshes');
if(review.includes("$('zrCancelReviewPagerV1').innerHTML="))fail('cancellation workspace pager must not rewrite identical DOM during smart-panel observer refreshes');

const commitFile='customer_cancel_commit_v1.js';
const cancelCommit=fs.readFileSync(commitFile,'utf8');
checkSyntax(commitFile);
must(cancelCommit,commitFile,[
  '__ZR_CUSTOMER_CANCEL_COMMIT_V1',
  'confirmCustomerCancel',
  'window.openCustomerCancel=wrapped',
  'function armConfirmButton()',
  'if(!busy)btn.disabled=false',
  "btn.style.setProperty('pointer-events','auto','important')",
  "actions.style.setProperty('z-index','5','important')",
  'function activeBookings()',
  'function targetFromVisibleModal()',
  "text.includes(String(b.id))",
  "e.target?.closest?.('[data-zr-cancel-select]')",
  "targetId=String(selected.dataset.zrCancelSelect||'')",
  "b.status='cancelled'",
  'b.cancelledAt=new Date().toISOString()',
  "b.cancelledBy='customer'",
  'b.cancelReason=reason',
  'b.cancelReviewed=false',
  'delete b.cancelReviewedAt;delete b.cancelReviewedBy',
  'window.setStore(KEY,list)',
  'await bridge.waitForWrites()',
  "typeof bridge.clearChangePlayHold==='function'",
  '예약 취소가 완료되었습니다.',
  '취소 내역은 예약 조회에서 다시 확인할 수 있습니다.',
  '취소 사유를 입력해주세요.',
  "if(b.__legacyLocal)throw new Error('legacy-local')",
  'owner-mismatch',
  'function handleConfirmClick(e)',
  "e.target?.closest?.('#confirmCustomerCancel')",
  "document.addEventListener('click',handleConfirmClick,true)",
  'if(busy){e.preventDefault();e.stopImmediatePropagation();return}'
]);
for(const bad of ['setDoc(','updateDoc(','deleteDoc(','firebase-firestore','initializeApp('])if(cancelCommit.includes(bad))fail(`${commitFile} must commit through the existing customer reservation bridge only: ${bad}`);
if(cancelCommit.includes("btn.addEventListener('click',onConfirm,true)"))fail('customer cancellation must use delegated binding so dynamically-created modal buttons still work');
if(cancelCommit.indexOf('await bridge.waitForWrites()')>cancelCommit.indexOf('showSuccess();')&&cancelCommit.includes('showSuccess();'))fail('customer cancellation success UI must only appear after shared Firebase writes finish');

const shell=fs.readFileSync('admin_shell_submenus_v1.js','utf8');
checkSyntax('admin_shell_submenus_v1.js');
must(shell,'admin_shell_submenus_v1.js',[
  "activity:[",
  "{id:'activity-list',label:'예약현황',targetId:'zrActivityMainSubtabV1'}",
  "{id:'activity-cancel',label:'예약취소',targetId:'zrActivityCancelSubtabV1'}",
  '#zrActivityModeTabsV1{display:none!important}',
  "parentId==='activity'&&sub.id==='activity-cancel'&&typeof window.zrOpenCancelReviewV1==='function'",
  'try{window.zrOpenCancelReviewV1()}finally{suppressParentToggle=false}'
]);

const mobile=fs.readFileSync('admin_mobile_subnav_v3.js','utf8');
checkSyntax('admin_mobile_subnav_v3.js');
must(mobile,'admin_mobile_subnav_v3.js',[
  "{label:'예약 현황',parent:'activity',children:[",
  "{label:'예약현황',targetId:'zrActivityMainSubtabV1'}",
  "{label:'예약취소',targetId:'zrActivityCancelSubtabV1'}",
  'function targetActive(target)',
  'const activeIndex=children.findIndex',
  '#zrActivityModeTabsV1',
  "const directCancel=child?.targetId==='zrActivityCancelSubtabV1'&&typeof window.zrOpenCancelReviewV1==='function'",
  'window.zrOpenCancelReviewV1();'
]);

const adminEntry=fs.readFileSync('admin.html','utf8');
const customerEntry=fs.readFileSync('customer.html','utf8');
must(adminEntry,'admin.html',['admin_shell_submenus_v1.js?v=2','admin_mobile_subnav_v3.js?v=5','cancel_review_state_v1.js?v=2']);
must(customerEntry,'customer.html',['cancel_review_state_v1.js?v=2','customer_cancel_commit_v1.js?v=1']);

const ops=fs.readFileSync('admin_ops_v10.js','utf8');
must(ops,'admin_ops_v10.js',["cancelled?2:0","cancelText(b)"]);

if(failed){console.error('\nCancellation contract failed.');process.exit(1)}
console.log('Cancellation visibility, runtime-loaded shared customer commit, reliable target resolution, armed dynamic cancel binding, observer-loop protection and nested review submenu contract passed.');
