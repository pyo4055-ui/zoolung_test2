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
  '.modal,.zr-customer-info-modal,.zrgm32,.zrfinal31,.zr-guide-modal,.zr14-modal,#zrCustomerReturnHomeModal',
  '.modal-card,.zr-customer-info-sheet,.zrgm32-sheet,.zrfinal31-sheet,.zr-guide-sheet,.zr14-modal-card,.zr-return-sheet',
  'function blockBackdrop(e)',
  'if(!visibleOverlay(e.target))return;',
  'e.preventDefault();',
  'e.stopImmediatePropagation();',
  "document.addEventListener('pointerdown',blockBackdrop,true)",
  "document.addEventListener('click',blockBackdrop,true)",
  'overscroll-behavior:contain!important',
  'overscroll-behavior-y:contain!important',
  'function overlayForTarget(target)',
  'function scrollContainerFor(target,overlay,deltaY=0)',
  'function guardTouchStart(e)',
  'function guardTouchMove(e)',
  'function guardWheel(e)',
  "document.addEventListener('touchstart',guardTouchStart,{capture:true,passive:true})",
  "document.addEventListener('touchmove',guardTouchMove,{capture:true,passive:false})",
  "document.addEventListener('wheel',guardWheel,{capture:true,passive:false})",
  "text==='닫기'",
  'function isCloseControl(el)',
  "!/(cancel|취소|back|뒤로|다시)/i.test(meta)",
  "top:14px!important;right:14px!important",
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

if(failed)process.exit(1);
ok('modal backdrop dismissal and background scroll chaining are blocked while popup content remains independently scrollable');
