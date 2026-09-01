import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const file='modal_ux_consistency_v1.js';
const customerPinFile='customer_modal_title_pin_v1.js';
const s=fs.readFileSync(file,'utf8');
const customerPin=fs.readFileSync(customerPinFile,'utf8');

for(const f of [file,'customer_return_home_v1.js',customerPinFile]){
  try{execFileSync(process.execPath,['--check',f],{stdio:'pipe'});ok(`syntax ${f}`)}
  catch(e){fail(`syntax ${f}: ${e.stderr?.toString()||e.message}`)}
}

for(const needle of [
  '.modal,.zr-customer-info-modal,.zr-customer-zoom,.zrgm32,.zrfinal31,.zr-guide-modal,.zr14-modal,#zrCustomerReturnHomeModal',
  '.modal-card,.sheet,.zr-customer-info-sheet,.zr-customer-zoom-card,.zrgm32-sheet,.zrfinal31-sheet,.zr-guide-sheet,.zr14-modal-card,.zr-return-sheet',
  'function blockBackdrop(e)',
  'if(!visibleOverlay(e.target))return;',
  'e.preventDefault();',
  'e.stopImmediatePropagation();',
  "document.addEventListener('pointerdown',blockBackdrop,true)",
  "document.addEventListener('click',blockBackdrop,true)",
  'overscroll-behavior:contain!important',
  'overscroll-behavior-y:contain!important',
  'function overlayForTarget(target)',
  'function topVisibleOverlay()',
  'function scrollContainerFor(target,overlay,deltaY=0)',
  'function guardTouchStart(e)',
  'function guardTouchMove(e)',
  'function guardWheel(e)',
  "if(Math.abs(dx)>Math.abs(deltaY))return;",
  "document.addEventListener('touchstart',guardTouchStart,{capture:true,passive:true})",
  "document.addEventListener('touchmove',guardTouchMove,{capture:true,passive:false})",
  "document.addEventListener('wheel',guardWheel,{capture:true,passive:false})",
  'function isDangerousCancel(el)',
  'function isDismissCancel(el)',
  "return textOf(el)==='취소'",
  'function renameDismissCancel(el)',
  "el.value='닫기'",
  "el.textContent='닫기'",
  'function isCloseControl(el)',
  'cancelToggle|bookingCancel|cancelBooking|reservationCancel|cancelReservation|statusCancel',
  'function titleForSource(btn)',
  'function proxyButton()',
  "btn.id='zrModalUxPinnedClose'",
  'function proxyTitle()',
  "title.id='zrModalUxPinnedTitle'",
  'function pickPinnedSource(overlay)',
  'function syncPinnedTitle(source)',
  'function syncPinnedClose()',
  'function placePinnedHeader(overlay,source,closeProxy=proxyButton(),titleProxy=proxyTitle())',
  'zr-modal-ux-proxied-title',
  '#zrModalUxPinnedTitle{position:fixed!important',
  'top:var(--zr-modal-title-top,14px)!important',
  'left:var(--zr-modal-title-left,14px)!important',
  'width:var(--zr-modal-title-width,180px)!important',
  'position:fixed!important',
  'top:var(--zr-modal-close-top,14px)!important',
  'right:var(--zr-modal-close-right,14px)!important',
  'zr-modal-ux-proxied-source',
  "document.addEventListener('scroll',schedulePosition,true)",
  "window.addEventListener('resize',schedulePosition)",
  'zr-modal-ux-close',
  'zr-modal-ux-shell',
  'zr-modal-ux-title'
])if(!s.includes(needle))fail(`modal UX contract missing: ${needle}`);

for(const needle of [
  "const OVERLAY_SELECTOR='.zr-customer-info-modal,.zr-customer-zoom,.zrgm32,.zrfinal31,.zr-guide-modal,.zr14-modal,#zrCustomerReturnHomeModal'",
  'function topOverlay()',
  'function shellFor(overlay)',
  'function labelledTitle(overlay,shell)',
  "getAttribute?.('aria-labelledby')",
  'function titleFor(overlay)',
  '.zr-guide-head h1,.zr-guide-head h2,.zr-guide-head h3',
  "el.id='zrCustomerModalPinnedTitle'",
  'function commonCloseRect()',
  "document.getElementById('zrModalUxPinnedClose')",
  'function place(overlay,titleProxy=proxy())',
  'function sync()',
  "document.body.classList.add('zr-customer-modal-title-pin-active')",
  'body.zr-customer-modal-title-pin-active #zrModalUxPinnedTitle{display:none!important}',
  '.zr-customer-modal-title-source{visibility:hidden!important;pointer-events:none!important}',
  '#zrCustomerModalPinnedTitle{position:fixed!important',
  'top:var(--zr-customer-modal-title-top,14px)!important',
  'left:var(--zr-customer-modal-title-left,14px)!important',
  'width:var(--zr-customer-modal-title-width,180px)!important',
  "document.addEventListener('scroll',schedulePosition,true)",
  "window.addEventListener('resize',schedulePosition)"
])if(!customerPin.includes(needle))fail(`customer popup title pin contract missing: ${needle}`);

for(const [label,source] of [['modal UX layer',s],['customer popup title layer',customerPin]]){
  for(const forbidden of [
    'MutationObserver',
    'setStore(',
    'setDoc(',
    'updateDoc(',
    'deleteDoc(',
    'reservationAvailability',
    'scheduleGroups',
    "localStorage.setItem('zr_bookings'",
    'openAdminBookingDetail(',
    'requestBookingStatus('
  ])if(source.includes(forbidden))fail(`${label} must not touch business/data behavior: ${forbidden}`);
}
if(s.includes('window.location.reload()'))fail('modal UX layer must not reload the page');

const bootstrap=fs.readFileSync('customer_return_home_v1.js','utf8');
for(const needle of [
  'function ensureModalUxConsistency()',
  "s.id='zrModalUxConsistencyV1'",
  "s.src='./modal_ux_consistency_v1.js?v=1'",
  'ensureModalUxConsistency();',
  'function ensureCustomerModalTitlePin()',
  "s.id='zrCustomerModalTitlePinV1'",
  "s.src='./customer_modal_title_pin_v1.js?v=1'",
  'ensureCustomerModalTitlePin();'
])if(!bootstrap.includes(needle))fail(`modal UX bootstrap missing: ${needle}`);

const guide=fs.readFileSync('customer_visit_guide_v16.js','utf8');
for(const needle of [
  "m.className='zr-guide-modal hidden'",
  'aria-labelledby="zrGuideTitle"',
  '<h2 id="zrGuideTitle">방문 전 꼭 확인해주세요</h2>'
])if(!guide.includes(needle))fail(`customer guide popup title source missing: ${needle}`);

const onsite=fs.readFileSync('schedule.html','utf8');
for(const needle of [
  '<script src="./modal_ux_consistency_v1.js?v=2"></script>',
  '<button class="gray" id="contentCancel">닫기</button>',
  '<button class="danger cancelToggle" id="cancelToggle">당일취소</button>'
])if(!onsite.includes(needle))fail(`onsite modal UX integration missing: ${needle}`);

if(failed)process.exit(1);
ok('customer booking popup titles stay pinned even when a popup has no close button, while existing popup close and destructive actions remain unchanged');
