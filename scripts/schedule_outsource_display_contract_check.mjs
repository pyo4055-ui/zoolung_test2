import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const file='schedule_refactor/outsource_display.js';
const s=fs.readFileSync(file,'utf8');
const page=fs.readFileSync('schedule.html','utf8');
const display=fs.readFileSync('schedule_refactor/display.js','utf8');

for(const f of [file]){
  try{execFileSync(process.execPath,['--check',f],{stdio:'pipe'});ok(`syntax ${f}`)}
  catch(e){fail(`syntax ${f}: ${e.stderr?.toString()||e.message}`)}
}

for(const needle of [
  "F.collection(db,'reservations')",
  "F.where('date','==',date)",
  'b?.outsourcingVendorId',
  'b?.outsourcingVendorSnapshot',
  'st.vendorId',
  'st.vendorSnapshot',
  "F.getDoc(F.doc(db,'customerGuides','main'))",
  "snap.data()?.reservationSettings?.outsourcingVendors",
  "const editable=!reservationInfo",
  "g.reservationId?'미지정':'현장추가'",
  "pay.insertAdjacentElement('beforebegin',badge)",
  "badge.disabled=!editable||!state.editMode",
  "savePatch(g.id,{onsitePaymentVendorId:id,onsitePaymentVendorName:name})",
  "F.onAuthStateChanged(auth",
  "observer.observe(list,{childList:true})"
])if(!s.includes(needle))fail(`onsite outsourcing display missing: ${needle}`);

for(const forbidden of [
  'updateDoc(',
  'deleteDoc(',
  "localStorage.setItem('zr_bookings'",
  "F.collection(db,'scheduleGroups')",
  "F.setDoc(F.doc(db,'reservations'",
  "savePatch(g.id,{outsourcingVendorId",
  "observer.observe(list,{childList:true,subtree:true})",
  '외주 · ${info.name}',
  "pay.insertAdjacentElement('afterend',badge)"
])if(s.includes(forbidden))fail(`onsite outsourcing display must not write reservation data or regress placement/loop safety: ${forbidden}`);

if(!page.includes('<script type="module" src="./schedule_refactor/outsource_display.js?v=1"></script>'))fail('schedule page does not load outsourcing display module');
if(!display.includes('data-c="pay"')||!display.includes('${g.pay?"✓ ":""}결제'))fail('existing onsite payment toggle must remain intact');

if(failed)process.exit(1);
ok('onsite payment vendor is shown left of payment; linked reservations are locked, while onsite/unmatched groups can store a schedule-only vendor choice');
