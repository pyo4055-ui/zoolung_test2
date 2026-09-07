import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const read=p=>fs.readFileSync(p,'utf8');
const syntax=file=>{try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});ok(`syntax ${file}`)}catch(e){fail(`syntax ${file}: ${e.stderr?.toString()||e.message}`)}};

const uiFile='customer_reservation_change_request_v1.js';
const tagFile='customer_reservation_change_request_tag_v1.js';
const adminFile='admin_reservation_change_requests_shared_v1.js';
const adminBridgeFile='reservation_firebase_bridge.js';
const customerBridgeFile='customer_reservation_firebase_bridge_v1.js';
const ui=read(uiFile),tag=read(tagFile),admin=read(adminFile),adminBridge=read(adminBridgeFile),customerBridge=read(customerBridgeFile);
[uiFile,tagFile,adminFile,adminBridgeFile,customerBridgeFile].forEach(syntax);

for(const needle of [
  '__ZR_RESERVATION_CHANGE_DEDICATED_V1',
  'zrReservationChangeModalV1','zrReservationChangeForm','zrReservationChangeReview','zrReservationChangeComplete',
  '예약 변경 요청이 접수됐습니다.',
  'zrChangeVisitMonth','zrChangeVisitDay','zrChangeEntryTime','zrChangeExitTime',
  'zrChangeMealMode','zrChangeMealStart','zrChangeMealDuration','zrChangeMealEnd',
  '<option value="30">30분</option><option value="45">45분</option><option value="60">60분</option>',
  'zrChangePlayMode','zrChangePlayStart','zrChangePlayDuration','zrChangePlayEnd',
  'playgroundOccupancies','playSlotState','m>=entry&&m<exit',
  "state.reason==='full'?' (마감)'",
  'requestedDate:x.date,requestedTime:x.entry,requestedExitTime:x.exit',
  'changePlay:true','changeMeal:true','booking.reservationChangeRequest={',
  'window.setStore(BOOKING_KEY,list)','waitForReservationBridge','waitForSavedRequest',
  'zr:reservation-change-request-shared','zr-change-invalid','scrollIntoView',
  '식사하지 않는 단체는 최대 3시간까지 이용할 수 있습니다.',
  '식사 이용 단체는 최대 4시간까지 이용할 수 있습니다.',
  'zrReservationChangeSelectV1','zrReservationChangeSelectList','zr-change-select-item','data-zr-change-select',
  'openChangeSelect','closeChangeSelect','changeChoiceHtml','이 예약 변경하기','2. 예약 변경하기',
  'openNotice(id)','openChangeModal(bookingId)','zrChangeTargetBooking',
  'background:#fff;color:#38271e;border-bottom:1px solid #e9e1dc',
  'zr-change-modal-head:has(.zr-modal-ux-title-source){display:none!important}'
])if(!ui.includes(needle))fail(`dedicated customer change flow missing: ${needle}`);

for(const forbidden of [
  'submitInquiry','inquiryModal','inqVisitTime','inqVisitDate','type="time"','collection(db','setDoc(','updateDoc(','addDoc(','deleteDoc(',
  'zrChangeBookingSelect','populateBookingSelector','변경할 예약을 선택해주세요',
  'zr-change-card-button','dataset.zrChangeBookingId','decorateChangeCards','bookingForCard','#changeExisting{display:none!important}'
]){
  if(ui.includes(forbidden))fail(`${uiFile} must stay independent from inquiry/native-time/direct-Firestore/duplicate-card-selection flow: ${forbidden}`);
}
if(ui.includes('<option value="keep">현재 예약 유지</option>'))fail('dedicated change flow must expose actual values, not a keep placeholder');
if(ui.includes('const saved=readBookings().find'))fail('reservation change must not fail on one immediate synchronous storage verification');

for(const needle of [
  'requestedExitTime','changeRequestedExitTime','changePlay','changeMeal',
  'booking.reservationChangeRequest={','attachBookingRequest(ctx'
])if(!tag.includes(needle))fail(`legacy change migration compatibility missing: ${needle}`);

for(const needle of [
  "requestedExit:String(r.requestedExitTime||'')",'zrSharedChangeApplyExit','legacyExitTime',
  'booking.entryTime=entry;booking.exitTime=exit','appliedExitTime:exit',
  'r.changePlay===true','r.changeMeal===true',
  'booking.playUse=appliedPlayUse','booking.playStart=appliedPlayStart','booking.playEnd=appliedPlayEnd','booking.playDuration=appliedPlayDuration',
  'booking.mealType=appliedMealType','booking.mealStart=appliedMealStart','booking.mealEnd=appliedMealEnd',
  'pendingPlayRange','playgroundConflict','validatePlayAgainstVisit','clearChangePlayHold','releaseChangePlayHold',
  "holdFs.setDoc(holdFs.doc(z.db,'reservationAvailability',String(bookingId))",'changePlayHoldActive:false'
])if(!admin.includes(needle))fail(`admin change apply/hold lifecycle missing: ${needle}`);

for(const needle of [
  'function changePlayHold(b)','changePlayHoldActive','changePlayHoldRequestId','changePlayHoldDate',
  'changePlayHoldStart','changePlayHoldEnd','changePlayHoldDuration','function changePlayHoldPlaceholder(a)',
  '__changePlayHold:true','sourceBookingId:sourceId','const holds=allAvailability.map(changePlayHoldPlaceholder).filter(Boolean)',
  'playUse:b.playUse','playStart:b.playStart','playEnd:b.playEnd',"['cancelled','rejected'].includes(String(b?.status||''))"
])if(!customerBridge.includes(needle))fail(`${customerBridgeFile} playground hold contract missing: ${needle}`);

for(const forbidden of ['collection(db','setDoc(','updateDoc(','addDoc(','deleteDoc('])if(tag.includes(forbidden))fail(`${tagFile} must use the existing reservation bridge, not direct Firestore writes: ${forbidden}`);
for(const forbidden of ['collection(z.db','collection(db','updateDoc(','addDoc(','deleteDoc('])if(admin.includes(forbidden))fail(`${adminFile} may only merge-clear the existing reservationAvailability hold document: ${forbidden}`);
if(!adminBridge.includes("const AVAIL_COLLECTION='reservationAvailability';"))fail('frozen reservation bridge availability contract missing');
if(adminBridge.includes('changePlayHoldActive'))fail('frozen reservation bridge must not absorb playground change hold logic');

if(failed)process.exit(1);
ok('reservation change keeps the global step-2 action, opens a cancellation-style booking picker, then notice + dedicated booking-style editor, writes resiliently, keeps shared playground holds, and stays independent from 1:1 inquiry');