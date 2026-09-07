import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const read=p=>fs.readFileSync(p,'utf8');
const syntax=file=>{try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});ok(`syntax ${file}`)}catch(e){fail(`syntax ${file}: ${e.stderr?.toString()||e.message}`)}};

const uiFile='customer_reservation_change_request_v1.js';
const inquiryFile='customer_inquiry_visit_v1.js';
const tagFile='customer_reservation_change_request_tag_v1.js';
const adminFile='admin_reservation_change_requests_shared_v1.js';
const adminBridgeFile='reservation_firebase_bridge.js';
const customerBridgeFile='customer_reservation_firebase_bridge_v1.js';
const ui=read(uiFile),inquiry=read(inquiryFile),tag=read(tagFile),admin=read(adminFile),adminBridge=read(adminBridgeFile),customerBridge=read(customerBridgeFile);

[uiFile,inquiryFile,tagFile,adminFile,adminBridgeFile,customerBridgeFile].forEach(syntax);

for(const needle of [
  'zrChangePlayMode','zrChangePlayStart','zrChangePlayDuration',
  'zrChangeMealMode','zrChangeMealStart','zrChangeMealEnd',
  'zrChangeExitTime','변경 퇴장시간','validateVisitRange','퇴장시간은 입장시간보다 늦어야 합니다.',
  'changePlay:true','changeMeal:true','현재 예약의 놀이터·식사 값이 기본으로 표시됩니다.',
  'validateExtraChanges','놀이터 시작시간과 이용시간을 확인해주세요.','식사 시작·종료시간을 확인해주세요.',
  'nativePlayTimes','playgroundOccupancies','playSlotState','syncChangePlayAvailability',
  'zr:reservation-availability-updated',' (마감)','선택한 놀이터 시간은 이미 마감되었습니다.'
])if(!ui.includes(needle))fail(`customer change UI missing: ${needle}`);
if(ui.includes('<option value="keep">현재 예약 유지</option>'))fail('customer change UI must not expose current-reservation-keep options');

for(const needle of [
  '#inquiryModal.zr-reservation-change-mode #zrChangeExitTime','max-height:50px!important','min-width:0!important',
  'zr-inquiry-invalid-target','zr-inquiry-invalid-section','markInvalid(elements,message)',
  "modal.classList.contains('zr-reservation-change-mode')&&phone&&!phone.value.trim()",
  "phone.value=mobile.value.trim()",'const waits=[40,100,180,300,500,800]',
  '빨간색으로 표시된 필수 입력 항목을 확인해주세요.','입력 내용은 정상인데 접수가 완료되지 않았습니다.'
])if(!inquiry.includes(needle))fail(`customer inquiry/change submit guard missing: ${needle}`);

for(const needle of [
  'requestedExitTime','changeRequestedExitTime','zrChangeExitTime',
  'changePlay:true','changeMeal:true','playUse','playStart','playEnd','playDuration',
  'mealType','mealStart','mealEnd','booking.reservationChangeRequest={','structuredContent(ctx)','attachBookingRequest(ctx',
  "sameRequest?String(existing?.status||'pending'):'pending'"
])if(!tag.includes(needle))fail(`customer change persistence missing: ${needle}`);

for(const needle of [
  'requestedExit:String(r.requestedExitTime||\'\')','zrSharedChangeApplyExit','legacyExitTime',
  'booking.entryTime=entry;booking.exitTime=exit','appliedExitTime:exit',
  'r.changePlay===true','r.changeMeal===true',
  'booking.playUse=appliedPlayUse','booking.playStart=appliedPlayStart','booking.playEnd=appliedPlayEnd','booking.playDuration=appliedPlayDuration',
  'booking.mealType=appliedMealType','booking.mealStart=appliedMealStart','booking.mealEnd=appliedMealEnd',
  "booking.cafe={...booking.cafe,items:[]}",
  'zrSharedChangeApplyPlayWrap','zrSharedChangeApplyMealWrap','예약 변경 내용을 반영했습니다.',
  'pendingPlayRange','playgroundConflict','validatePlayAgainstVisit','clearChangePlayHold','releaseChangePlayHold',
  "holdFs.setDoc(holdFs.doc(z.db,'reservationAvailability',String(bookingId))",'changePlayHoldActive:false'
])if(!admin.includes(needle))fail(`admin change apply/hold lifecycle missing: ${needle}`);

for(const needle of [
  'function changePlayHold(b)','changePlayHoldActive','changePlayHoldRequestId','changePlayHoldDate',
  'changePlayHoldStart','changePlayHoldEnd','changePlayHoldDuration','function changePlayHoldPlaceholder(a)',
  '__changePlayHold:true','sourceBookingId:sourceId','const holds=allAvailability.map(changePlayHoldPlaceholder).filter(Boolean)',
  'playUse:b.playUse','playStart:b.playStart','playEnd:b.playEnd',"['cancelled','rejected'].includes(String(b?.status||''))"
])if(!customerBridge.includes(needle))fail(`${customerBridgeFile} playground hold contract missing: ${needle}`);

for(const [name,source] of [[uiFile,ui],[tagFile,tag]])for(const forbidden of ['collection(db','setDoc(','updateDoc(','addDoc(','deleteDoc('])if(source.includes(forbidden))fail(`${name} must use the existing reservation bridge, not direct Firestore writes: ${forbidden}`);
for(const forbidden of ['collection(z.db','collection(db','updateDoc(','addDoc(','deleteDoc('])if(admin.includes(forbidden))fail(`${adminFile} may only merge-clear the existing reservationAvailability hold document: ${forbidden}`);
if(!adminBridge.includes("const AVAIL_COLLECTION='reservationAvailability';"))fail('frozen reservation bridge availability contract missing');
if(adminBridge.includes('changePlayHoldActive'))fail('frozen reservation bridge must not absorb playground change hold logic');

if(failed)process.exit(1);
ok('reservation change defaults are explicit, exit time is requestable, mobile validation is visible, playground holds remain shared, and admin applies the full requested visit range');
