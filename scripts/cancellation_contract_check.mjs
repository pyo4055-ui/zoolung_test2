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

const ops=fs.readFileSync('admin_ops_v10.js','utf8');
must(ops,'admin_ops_v10.js',["cancelled?2:0","cancelText(b)"]);

if(failed){console.error('\nCancellation contract failed.');process.exit(1)}
console.log('Cancellation visibility contract passed.');
