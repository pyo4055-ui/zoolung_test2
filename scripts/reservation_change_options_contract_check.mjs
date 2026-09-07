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
const mobileAlertFile='admin_mobile_reservation_change_alert_v1.js';
const adminEntryFile='admin.html';
const ui=read(uiFile),tag=read(tagFile),admin=read(adminFile),adminBridge=read(adminBridgeFile),customerBridge=read(customerBridgeFile),mobileAlert=read(mobileAlertFile),adminEntry=read(adminEntryFile);
[uiFile,tagFile,adminFile,adminBridgeFile,customerBridgeFile,mobileAlertFile].forEach(syntax);

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
  'structuredContent','waitForChangeBridge','window.zrReservationFirebase.submitChangeRequest(payload)',
  'changeRequest:true','changeRequestId:requestId',"changeRequestStatus:'pending'",'changeBookingId:String(booking.id||\'\')',
  'changeRequestedDate:x.date','changeRequestedTime:x.entry','changeRequestedExitTime:x.exit',
  'changePlay:true','changeMeal:true','zr:reservation-change-request-shared','zr-change-invalid','scrollIntoView',
  '식사하지 않는 단체는 최대 3시간까지 이용할 수 있습니다.',
  '식사 이용 단체는 최대 4시간까지 이용할 수 있습니다.',
  'zrReservationChangeSelectV1','zrReservationChangeSelectList','zr-change-select-item','data-zr-change-select',
  'openChangeSelect','closeChangeSelect','changeChoiceHtml','이 예약 변경하기','2. 예약 변경하기',
  'openNotice(id)','openChangeModal(bookingId)','zrChangeTargetBooking',
  '#zrReservationChangeSelectV1 .zr-change-select-head','background:#fc5404;color:#fff',
  '#zrReservationChangeSelectV1 .zr-modal-ux-header{display:none!important}',
  '#zrReservationChangeNoticeV1 .zr-change-notice-head',
  'function localTomorrow()','minDate=localTomorrow()',"String(o.value)>=minDate",
  'function isWeekendDate(date)','day===0||day===6',
  'function holidayBookingAllowed()',"s?.holidayBookingAllowed!==false",
  'function isBlockedHoliday(date)','window.zrHolidayBookingSettingV1Api?.isHoliday?.(date)===true',
  'function changeDateUnavailable(date,nativeOption=null)',
  'disabled:changeDateUnavailable(full,o)','disabled:changeDateUnavailable(full)',
  "if(isWeekendDate(date))return failForm('주말은 예약변경 날짜로 선택할 수 없습니다.'",
  "if(isBlockedHoliday(date))return failForm('공휴일 예약이 현재 설정에서 허용되지 않습니다.'",
  "document.addEventListener('zr:reservation-settings-synced'",
  '#zrReservationChangeComplete .zr-change-actions{display:flex!important;justify-content:center!important',
  '#zrReservationChangeComplete .zr-change-actions button{width:min(260px,100%)!important}'
])if(!ui.includes(needle))fail(`dedicated customer change flow missing: ${needle}`);

for(const forbidden of [
  'submitInquiry','inquiryModal','inqVisitTime','inqVisitDate','type="time"','collection(db','setDoc(','updateDoc(','addDoc(','deleteDoc(',
  'zrChangeBookingSelect','populateBookingSelector','변경할 예약을 선택해주세요',
  'zr-change-card-button','dataset.zrChangeBookingId','decorateChangeCards','bookingForCard','#changeExisting{display:none!important}',
  'waitForSavedRequest','waitForReservationBridge','window.zrReservationFirebase.waitForWrites()',
  'window.setStore(BOOKING_KEY,list)','booking.reservationChangeRequest={'
]){
  if(ui.includes(forbidden))fail(`${uiFile} must stay independent from inquiry/native-time/direct-Firestore/duplicate-card/customer-reservation-write flow: ${forbidden}`);
}
if(ui.includes('<option value="keep">현재 예약 유지</option>'))fail('dedicated change flow must expose actual values, not a keep placeholder');

for(const needle of [
  'requestedExitTime','changeRequestedExitTime','changePlay','changeMeal',
  'booking.reservationChangeRequest={','attachBookingRequest(ctx'
])if(!tag.includes(needle))fail(`legacy change migration compatibility missing: ${needle}`);

for(const needle of [
  "const INQUIRY_KEY='zr_inquiries'",'function readInquiries()','function inquiryRequest(item)','function syncInquiryRequestsToBookings()',
  'changeRequestId','changeBookingId','booking.reservationChangeRequest={','syncInquiryRequestsToBookings();',
  'zr:inquiry-shared-updated','zr:inquiry-replies-changed',
  "requestedExit:String(r.requestedExitTime||'')",'zrSharedChangeApplyExit','legacyExitTime',
  'booking.entryTime=entry;booking.exitTime=exit','appliedExitTime:exit',
  'r.changePlay===true','r.changeMeal===true',
  'booking.playUse=appliedPlayUse','booking.playStart=appliedPlayStart','booking.playEnd=appliedPlayEnd','booking.playDuration=appliedPlayDuration',
  'booking.mealType=appliedMealType','booking.mealStart=appliedMealStart','booking.mealEnd=appliedMealEnd',
  'pendingPlayRange','playgroundConflict','validatePlayAgainstVisit','clearChangePlayHold','releaseChangePlayHold',
  'changePlayHoldSourceBookingId',"holdFs.where('changePlayHoldSourceBookingId','==',String(bookingId))",'changePlayHoldActive:false'
])if(!admin.includes(needle))fail(`admin change ingest/apply/hold lifecycle missing: ${needle}`);

for(const needle of [
  "const INQUIRY_COLLECTION='customerInquiries'",'function changeHoldDocId','async function clearOwnChangePlayHold','async function submitSharedChangeRequest',
  'changePlayHoldDedicated:true','changePlayHoldSourceBookingId:bookingId',
  'F.setDoc(F.doc(db,INQUIRY_COLLECTION,inquiryId)','changeRequest:true','submitChangeRequest:submitSharedChangeRequest','clearChangePlayHold:clearOwnChangePlayHold',
  "sourceBookingId:String(a.sourceBookingId||a.changePlayHoldSourceBookingId||'')",'x.changePlayHoldDedicated!==true',
  'function changePlayHold(b)','changePlayHoldActive','changePlayHoldRequestId','changePlayHoldDate',
  'changePlayHoldStart','changePlayHoldEnd','changePlayHoldDuration','function changePlayHoldPlaceholder(a)',
  '__changePlayHold:true','const holds=allAvailability.map(changePlayHoldPlaceholder).filter(Boolean)',
  'lastWriteError','async function waitForWrites()'
])if(!customerBridge.includes(needle))fail(`${customerBridgeFile} shared-request/playground-hold contract missing: ${needle}`);

for(const needle of [
  'function allBookings()',
  "typeof window.bookings==='function'?window.bookings()",
  'function localPendingChange()',
  "const pendingChange=localPendingChange()",
  'function ensureAlertCountObserver()',
  "alertCountObserver.observe(list,{subtree:true,childList:true,characterData:true})",
  "document.querySelectorAll('#zrAdminMobileAlertsV1 [data-mobile-count]')",
  '#zrReservationChangeAdminList .zr-cr-meta{display:grid!important',
  '#zrReservationChangeAdminList .zr-cr-body{white-space:normal!important',
  '#zrReservationChangeAdminList .zr-cr-actions{display:grid!important',
  "F.collection(bridge.db,'customerInquiries'),()=>sync()",
  'x.changePlayHoldDedicated!==true',
  "document.addEventListener('zr:inquiry-shared-updated'",
  "window.addEventListener('storage',e=>{if(e.key==='zr_bookings'||e.key==='zr_inquiries')"
])if(!mobileAlert.includes(needle))fail(`mobile reservation-change alert/layout contract missing: ${needle}`);
for(const forbidden of ['recomputeSharedChangeCount','sharedReservationChanges=new Map()','sharedInquiryChanges=new Map()'])if(mobileAlert.includes(forbidden))fail(`mobile reservation-change alert must not independently deduplicate desktop pending requests: ${forbidden}`);

if(adminEntry.includes('admin_booking_cache_boot_guard_v1.js'))fail('admin entry must not load the unrelated stale-booking cache guard');
if(!adminEntry.includes('admin_mobile_reservation_change_alert_v1.js?v=5'))fail('admin entry must bust cache for corrected mobile reservation-change alert/layout');

for(const forbidden of ['collection(db','setDoc(','updateDoc(','addDoc(','deleteDoc('])if(tag.includes(forbidden))fail(`${tagFile} must use the existing reservation bridge, not direct Firestore writes: ${forbidden}`);
for(const forbidden of ['updateDoc(','addDoc(','deleteDoc('])if(admin.includes(forbidden))fail(`${adminFile} may only use staff reads and merge writes needed for existing reservationAvailability hold cleanup: ${forbidden}`);
if(!adminBridge.includes("const AVAIL_COLLECTION='reservationAvailability';"))fail('frozen reservation bridge availability contract missing');
if(adminBridge.includes('changePlayHoldActive'))fail('frozen reservation bridge must not absorb playground change hold logic');

if(failed)process.exit(1);
ok('reservation change keeps customer date/play/meal rules, mobile change cards wrap instead of clipping, the bell total follows every visible pending row including reservation changes, and the frozen reservation bridge stays unchanged');
