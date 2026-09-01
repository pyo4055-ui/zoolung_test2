import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const file='modal_ux_consistency_v1.js';
const s=fs.readFileSync(file,'utf8');

for(const f of [file,'customer_return_home_v1.js']){
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
  'function proxyButton()',
  "btn.id='zrModalUxPinnedClose'",
  'function pickPinnedSource(overlay)',
  'function syncPinnedClose()',
  'function placePinnedClose(overlay,source,proxy=proxyButton())',
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
  'requestBookingStatus(',
  'window.location.reload()'
])if(s.includes(forbidden))fail(`modal UX layer must not touch business/data behavior: ${forbidden}`);

const bootstrap=fs.readFileSync('customer_return_home_v1.js','utf8');
for(const needle of [
  'function ensureModalUxConsistency()',
  "s.id='zrModalUxConsistencyV1'",
  "s.src='./modal_ux_consistency_v1.js?v=1'",
  'ensureModalUxConsistency();'
])if(!bootstrap.includes(needle))fail(`modal UX bootstrap missing: ${needle}`);

const onsite=fs.readFileSync('schedule.html','utf8');
for(const needle of [
  '<script src="./modal_ux_consistency_v1.js?v=2"></script>',
  '<button class="gray" id="contentCancel">닫기</button>',
  '<button class="danger cancelToggle" id="cancelToggle">당일취소</button>'
])if(!onsite.includes(needle))fail(`onsite modal UX integration missing: ${needle}`);

if(failed)process.exit(1);
ok('popup-only dismiss controls are normalized to close, pinned at the popup top, and destructive cancellation actions stay separate');
