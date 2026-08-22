import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const read=p=>fs.readFileSync(p,'utf8');
const loader=read('admin_features_v2_loader.js');
const exitGuard=read('customer_time_guide_guard_v2.js');

for(const file of ['admin_features_v2_loader.js','customer_time_guide_guard_v2.js']){
  try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'})}
  catch(e){fail(`${file} syntax: ${e.stderr?.toString()||e.message}`)}
}

for(const needle of [
  'installLegacyGuideGuards()',
  "['zrCustomerVisitGuideV16','zrCustomerVisitGuideFixV20']",
  "guard.dataset.zrLegacyGuideGuard='1'",
  'await new Promise(resolve=>setTimeout(resolve,0))',
  "return el.id==='entryTime';",
  "const final=document.getElementById('zrFinalGuideModalV31');if(final&&!final.classList.contains('hidden'))return;",
  "document.getElementById('zrGuideModal')?.classList.add('hidden')",
  "id!=='playStart'&&id!=='playDuration'",
  "const finalBindNeedle=\"function bindFinal(){\\n  window.addEventListener('click',e=>{\"",
  "parking=parking.replace(finalBindNeedle,\"function bindFinal(){\\n  document.addEventListener('click',e=>{\")",
  'await loadParkingInfo()'
])if(!loader.includes(needle))fail(`ordered guide runtime contract missing: ${needle}`);

for(const forbidden of [
  'customer_visit_guide_v19.js',
  '},45);',
  'customer_guide_transition_v3.js',
  'zr-play-guide-transition',
  "if(!document.getElementById('zrFinalGuideModalV31')?.classList.contains('hidden'))return;"
])if(loader.includes(forbidden))fail(`obsolete or unsafe guide transition behavior still present in active loader: ${forbidden}`);

for(const needle of ["el?.id==='exitTime'",'exitGuardUntil','queueMicrotask(closeZooGuide)','zrGuideModal','MutationObserver(closeZooGuide)'])if(!exitGuard.includes(needle))fail(`exit time guard contract missing: ${needle}`);
for(const forbidden of ['stopPropagation','stopImmediatePropagation','preventDefault'])if(exitGuard.includes(forbidden))fail(`exit time guard must not block booking behavior: ${forbidden}`);

if(fs.existsSync('customer_guide_transition_v3.js'))fail('broken customer_guide_transition_v3.js must stay removed');
if(failed){console.error('\nCustomer guide ordering contract failed.');process.exit(1)}
console.log('Customer guide ordering contract passed.');
