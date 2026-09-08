import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const file='customer_reservation_firebase_bridge_v1.js';
const s=fs.readFileSync(file,'utf8');
let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'})}catch(e){fail(`syntax ${file}: ${e.stderr?.toString()||e.message}`)}
for(const needle of [
  'function patchSetStore()',
  'const r=originalSetStore.apply(this,arguments)',
  'if(k===BOOKING_KEY&&!applyingRemote){',
  'try{queueBookingSync(before,v)}',
  "console.error('customer reservation firebase sync queue',e)",
  '공용 DB 동기화 준비에 실패했습니다.',
  'return r;'
])if(!s.includes(needle))fail(`missing customer storage safety contract: ${needle}`);
if(s.includes("if(k===BOOKING_KEY&&!applyingRemote)queueBookingSync(before,v);"))fail('Firebase queue preparation must not be able to abort the original customer reservation/cancellation UI flow');
if(failed)process.exit(1);
console.log('OK: customer local reservation flow survives synchronous Firebase queue-preparation failures while shared-write errors remain observable.');
