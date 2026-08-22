import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const read=p=>fs.readFileSync(p,'utf8');
const v2=read('customer_time_guide_guard_v2.js');
const v3=read('customer_guide_transition_v3.js');
try{execFileSync(process.execPath,['--check','customer_time_guide_guard_v2.js'],{stdio:'pipe'})}catch(e){fail(`exit guard syntax: ${e.stderr?.toString()||e.message}`)}
try{execFileSync(process.execPath,['--check','customer_guide_transition_v3.js'],{stdio:'pipe'})}catch(e){fail(`guide transition syntax: ${e.stderr?.toString()||e.message}`)}
for(const needle of ["el?.id==='exitTime'",'exitGuardUntil','queueMicrotask(closeZooGuide)','customer_guide_transition_v3.js?v=3','zrCustomerGuideTransitionV3'])if(!v2.includes(needle))fail(`v2 exit guard contract missing: ${needle}`);
for(const forbidden of ['preventDefault(','stopPropagation(','stopImmediatePropagation(','setDoc(','setStore('])if(v2.includes(forbidden))fail(`exit guard must not block or persist booking behavior: ${forbidden}`);
for(const needle of ['zr-play-guide-transition','#zrGuideModal{display:none!important}','playStart','playDuration','예약 전 최종 확인','확인 후 예약 신청','zrPlayGuideModal','MutationObserver(syncTransitions)'])if(!v3.includes(needle))fail(`v3 transition contract missing: ${needle}`);
for(const forbidden of ['preventDefault(','stopPropagation(','stopImmediatePropagation(','setDoc(','setStore(','localStorage.setItem(','reservationAvailability','scheduleGroups'])if(v3.includes(forbidden))fail(`guide transition must remain display-only: ${forbidden}`);
if(failed){console.error('\nCustomer guide transition contract failed.');process.exit(1)}
console.log('Customer guide transition contract passed.');
