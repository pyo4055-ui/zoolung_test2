import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const frozen = {
  'index.html':'3d92d7e08b85eb2326aeba0d0def53659dac0ec9',
  'firestore.rules':'cc28cd06415bd2da6d6d407026a3191a67e11c8d',
  'admin_features.js':'92b56752200626496fedb9816b880414a74c571c',
  'admin2_part1.txt':'118b334e77bf168659a1f9d9f3b83282f04c730c',
  'admin2_part2.txt':'5e0d2acd06f6b1b417d42c29da488c03811fd0fb',
  'admin2_part3.txt':'0c7ae5706c190a0c8f941114b95c501c3977fb8f',
  'admin2_part4.txt':'30a836a742a6a5196b75a1d75020831c7ac7b593',
  'admin_features_v3_patch.js':'fd7e81ec6a021bfbef587a244f5b268bb1740542',
  'admin_features_v3_excel_fix.js':'fb1dbf3aaf3a58da7fbb185d8e885aa8efcc5adf',
  'admin_features_v4_patch.js':'1fb5e7aacae1c36d14cd1d4b1333d3965a0955b4',
  'admin_features_v5_patch.js':'10ad21bc0e7d5d3ef19301660dc3722b8447399d',
  'admin_features_v6_patch.js':'1624f8aae6ba2226ecdb70fc4586099f23023f2d',
  'admin_features_v7_patch.js':'8c76a8adaca91ab0ebe5ec161017941acc90e91a1',
  'admin_features_v8_patch.js':'7f17bd1780c25e86ce03bf9553caaa6e4c7d1b3f',
  'admin_features_v9_patch.js':'a8299bf9ab52a91ab6efacb9a83c61ec814d6165',
  'admin_ops_v10.js':'9f945bc144662dfa061e705b711db97d43da20c2',
  'admin_ops_v11_patch.js':'c360527fb732bbca32145217dc2e041879d8578b',
  'admin_schedule_tab_v14.js':'f9789332ad5f3e565d98e43abdf1a8b59b9e81be',
  'admin_schedule_excel_v3.js':'e9f557afc87d50c03821d6496c0fe9719a26974e',
  'customer_booking_rules_v3.js':'2086a3f1c1bc9facc77015625b40e06f8e241746',
  'customer_booking_ux_v24.js':'26e33dc4dd7cc209ce70797dcc4757f61c7310ba',
  'customer_schedule_view_v3.js':'92f8d7f68b294f78a06b731558e4fe5c18ddb561',
  'customer_visit_guide_v16.js':'7dcaeb0b3c104db5610783dd89deb4a99f3e3e54',
  'customer_visit_guide_fix_v20.js':'ae24df945d6adfd21644f2d0442c4910238d9b28',
  'reservation_firebase_bridge.js':'45a64b680d371eca97026de652c30dce0940bf43',
  'reservation_staff_login_fix_v14.js':'d30e7203f2ed3b2e7ddb122cb6f665300cca70a2',
  'parking_info_v31.js':'185b857d2369ae44bfbbd63bbd0c3e182ec0c472',
  'schedule_v6.js':'fc7f94d1d237cbee78723f994665ba4903ae8767',
  'schedule_display_v8.js':'c7927cb4b2aeeb124fb39617b8215c1f1cdad1a3',
  'schedule_shared_memo_unlock_v10.js':'8a27ef346b36546a35455e04f70469777825dc3f',
  'legacy/admin_features_v2_loader.js':'9c6e29c1e03182d160c9489d9dcfdb344860cf99'
};

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const read=p=>fs.readFileSync(p,'utf8');
const syntax=file=>{try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});ok(`syntax ${file}`)}catch(e){fail(`syntax ${file}: ${e.stderr?.toString()||e.message}`)}};
const textHealth=(file,text)=>{
  if(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(text))fail(`control character found: ${file}`);
  if(text.includes('\uFFFD'))fail(`replacement character found: ${file}`);
  const mojibake=(text.match(/[ìëíêð]/g)||[]).length;
  if(mojibake>=6)fail(`possible UTF-8 mojibake: ${file} (${mojibake} suspicious chars)`);
};

for(const [file,sha] of Object.entries(frozen)){
  if(!fs.existsSync(file)){fail(`frozen file missing: ${file}`);continue}
  const actual=execFileSync('git',['hash-object',file],{encoding:'utf8'}).trim();
  if(actual!==sha)fail(`frozen behavior file changed: ${file} (${actual} != ${sha})`);
  else ok(`frozen ${file}`);
}

const loader=read('admin_features_v2_loader.js');
textHealth('admin_features_v2_loader.js',loader);syntax('admin_features_v2_loader.js');
const ordered=[
  'admin_features_v3_patch.js?v=3','admin_features_v3_excel_fix.js?v=31','admin_features_v4_patch.js?v=4',
  'admin_features_v5_patch.js?v=5','admin_features_v6_patch.js?v=6','admin_features_v7_patch.js?v=7',
  'admin_features_v8_patch.js?v=8','admin_features_v9_patch.js?v=9'
];
let last=-1;
for(const item of ordered){const at=loader.indexOf(item);if(at<0)fail(`admin loader missing ${item}`);else if(at<=last)fail(`admin loader order changed at ${item}`);last=at}
for(const needle of [
  'customer_booking_ux_v24.js?v=31','customer_visit_guide_v16.js?v=31','customer_visit_guide_fix_v20.js?v=31','parking_info_v31.js?v=31','admin_schedule_tab.js?v=1',
  'customer_lookup_actions_v1.js?v=2','customer_info_tabs_v1.js?v=2','loadCustomerQuickTools()',
  "return el.id==='entryTime';",
  "function openCustomerGuide(control){if(control?.id!=='entryTime')return;",
  'function interceptBooking(ev){if(window.__ZR_FINAL_DIRECT_SUBMIT)return;',
  'function interceptSubmit(ev){if(window.__ZR_FINAL_DIRECT_SUBMIT)return;',
  'function playAcknowledged(){if(window.__ZR_FINAL_DIRECT_SUBMIT)return true;',
  'zrRefactorBootShield',"document.getElementById('zrPreBootStyle')?.remove()","requestAnimationFrame(()=>requestAnimationFrame(()=>{document.getElementById('zrPreBootStyle')?.remove();removeBootShield()}))"
])if(!loader.includes(needle))fail(`admin loader behavior transform missing: ${needle}`);

const bridge=read('reservation_firebase_bridge.js');
for(const needle of ["BOOKING_KEY='zr_bookings'","FULL_COLLECTION='reservations'","AVAIL_COLLECTION='reservationAvailability'","writeChain=Promise.resolve()","window.setStore=wrapped"]){if(!bridge.includes(needle))fail(`reservation DB contract missing: ${needle}`)}

const adminSchedule=read('admin_schedule_tab_v14.js');
for(const needle of ["'scheduleGroups'","schedulePublished=true","customerSchedule={reservationId:String(b.id)","{merge:true}"]){if(!adminSchedule.includes(needle))fail(`admin schedule contract missing: ${needle}`)}

const customerSchedule=read('customer_schedule_view_v3.js');
for(const needle of ["b.status==='confirmed'","b.schedulePublished","b.customerSchedule"]){if(!customerSchedule.includes(needle))fail(`customer schedule visibility contract missing: ${needle}`)}

const scheduleUiFix=read('schedule_ui_fix_v4.js');
textHealth('schedule_ui_fix_v4.js',scheduleUiFix);syntax('schedule_ui_fix_v4.js');
if(!scheduleUiFix.includes('./customer_schedule_ui_v5.js?v=5'))fail('customer schedule UI v5 is not loaded by schedule UI fix');
const customerScheduleUi=read('customer_schedule_ui_v5.js');
textHealth('customer_schedule_ui_v5.js',customerScheduleUi);syntax('customer_schedule_ui_v5.js');
for(const needle of ['확정 일정','오전 10:30 이전에 도착하셔도 동물 관람은 10:30부터 가능합니다.','zr-customer-notice','MutationObserver(patch).observe(document.body'])if(!customerScheduleUi.includes(needle))fail(`customer schedule UI contract missing: ${needle}`);
if(customerScheduleUi.includes('loadCustomerModules'))fail('customer quick tools must not depend on customer schedule UI');

const customerLookup=read('customer_lookup_actions_v1.js');
textHealth('customer_lookup_actions_v1.js',customerLookup);syntax('customer_lookup_actions_v1.js');
for(const needle of ['3. 예약 취소하기','이 예약 취소하기','취소하실 예약의 ‘이 예약 취소하기’ 버튼을 눌러주세요.','취소 사유를 입력해주세요.','cancelReason=reason','본 예약은 담당자로부터 예약확정 되었습니다.','본 예약은 취소 되었습니다.','cancelSuccessView','window.openCustomerCancel=wrapped','confirmCustomerCancel','zrCancelledBookingRecordsV2','예약번호','취소일시','취소구분','cancellableCustomerBookings()'])if(!customerLookup.includes(needle))fail(`customer lookup actions contract missing: ${needle}`);

const customerInfoTabs=read('customer_info_tabs_v1.js');
textHealth('customer_info_tabs_v1.js',customerInfoTabs);syntax('customer_info_tabs_v1.js');
for(const needle of ['가이드맵','주차 및 인솔','zrParkingInfoCard','zrpk31-map','./customer_guide_map_v1.js?v=2','guideMapUrl()','bookingCardTarget()','zr-has-info-tabs',"const list=$('existingBookingList')",'if(!visible(list))'])if(!customerInfoTabs.includes(needle))fail(`customer info tabs contract missing: ${needle}`);

const customerGuideMap=read('customer_guide_map_v1.js');
textHealth('customer_guide_map_v1.js',customerGuideMap);syntax('customer_guide_map_v1.js');
for(const needle of ["COLLECTION='customerGuides'","DOC_ID='main'",'guideMapImageUrl','zrGuideAdminSection','가이드맵 이미지 URL','FS.serverTimestamp()','{merge:true}','zr:guide-map-updated'])if(!customerGuideMap.includes(needle))fail(`customer guide map contract missing: ${needle}`);

const scheduleHtml=read('schedule.html');
if(!scheduleHtml.includes('./schedule_refactor/app.js?v=1'))fail('schedule.html is not using refactored runtime');
for(const old of ['schedule_v6.js?v=8','schedule_display_v8.js?v=12','schedule_shared_memo_unlock_v10.js?v=1'])if(scheduleHtml.includes(old))fail(`schedule.html still loads legacy runtime: ${old}`);

const scheduleFiles=['schedule_refactor/core.js','schedule_refactor/display.js','schedule_refactor/detail.js','schedule_refactor/content.js','schedule_refactor/app.js'];
let scheduleBundle='';
for(const file of scheduleFiles){
  const text=read(file);scheduleBundle+='\n'+text;textHealth(file,text);syntax(file);
}

const exportedByFile=new Map();
for(const file of scheduleFiles){
  const names=new Set();
  for(const m of read(file).matchAll(/export\s+(?:async\s+)?(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g))names.add(m[1]);
  exportedByFile.set(path.normalize(file),names);
}
for(const file of scheduleFiles){
  const text=read(file);
  for(const m of text.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"](\.\/[^'"]+)['"]/g)){
    const target=path.normalize(path.join(path.dirname(file),m[2]));
    if(!exportedByFile.has(target)){fail(`local import target missing: ${file} -> ${target}`);continue}
    const available=exportedByFile.get(target);
    for(const raw of m[1].split(',')){
      const imported=raw.trim().split(/\s+as\s+/)[0].trim();
      if(imported&&!available.has(imported))fail(`missing export: ${file} imports ${imported} from ${target}`);
    }
  }
}

const scheduleCore=read('schedule_refactor/core.js');
for(const needle of [
  '4F 베이직','5F 워터가든','식사','놀이터','자율관람',
  '● ','저장 중','실시간 연결됨','저장 오류','저장에 실패했습니다. Firebase 설정을 확인해주세요.',
  'scheduleGroups','updatedAt:F.serverTimestamp()'
])if(!scheduleCore.includes(needle))fail(`schedule core contract missing: ${needle}`);

const scheduleApp=read('schedule_refactor/app.js');
for(const needle of [
  'scheduleGroups','scheduleSharedMemos','__content_catalog__',
  '수정 잠금과 관계없이 공용 메모를 수정할 수 있습니다.',
  '공용 메모 저장에 실패했습니다.'
])if(!scheduleApp.includes(needle))fail(`schedule app contract missing: ${needle}`);
if((scheduleApp.match(/state\.unsubGroups=F\.onSnapshot\(q/g)||[]).length!==1)fail('scheduleGroups realtime listener must be exactly one in refactored app');
if(read('schedule_refactor/display.js').includes('onSnapshot'))fail('display module must not create a second Firestore listener');
for(const forbidden of ["'reservations'",'"reservations"',"'reservationAvailability'",'"reservationAvailability"'])if(scheduleBundle.includes(forbidden))fail(`onsite schedule must not reverse-sync reservation data: ${forbidden}`);

const detail=read('schedule_refactor/detail.js');
for(const needle of [
  '"org","res","tea","actualPaid","actualChap","ps","pe","eta","aend","meal","mealLoc","cafeDetail","memo","appearance"',
  '"pay","book","cancelled","cancelledAt"',
  'segments:segs(["f4","meal","play","f5"])'
])if(!detail.includes(needle))fail(`onsite detail field contract missing: ${needle}`);

if(failed){console.error('\nRefactor contract check failed. Do not merge.');process.exit(1)}
console.log('\nRefactor contract check passed.');
