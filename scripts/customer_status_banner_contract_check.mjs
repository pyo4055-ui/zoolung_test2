import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const file='customer_status_banner_v1.js';
const text=fs.readFileSync(file,'utf8');
try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'})}catch(e){fail(`syntax: ${e.stderr?.toString()||e.message}`)}
for(const needle of [
  '예약 신청이 정상적으로 접수되었습니다. 담당자 확인 후 예약이 최종 확정됩니다.',
  '본 예약은 담당자 확인을 거쳐 최종 확정되었습니다.',
  'zr-received-emphasis',
  '/접수/.test(text)',
  '/확정/.test(text)',
  '/취소/.test(text)',
  'MutationObserver(sync)'
])if(!text.includes(needle))fail(`status banner contract missing: ${needle}`);
for(const forbidden of ['setStore(','localStorage.setItem(','setDoc(','preventDefault(','stopImmediatePropagation('])if(text.includes(forbidden))fail(`status banner must remain display-only: ${forbidden}`);
if(failed){console.error('\nCustomer status banner contract failed.');process.exit(1)}
console.log('Customer status banner contract passed.');
