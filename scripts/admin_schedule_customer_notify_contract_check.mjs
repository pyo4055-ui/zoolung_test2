import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const read=p=>fs.readFileSync(p,'utf8');
const syntax=file=>{try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});ok(`syntax ${file}`)}catch(e){fail(`syntax ${file}: ${e.stderr?.toString()||e.message}`)}};

const file='admin_schedule_customer_notify_v1.js';
const s=read(file);
syntax(file);

for(const needle of [
  "const SETTING_FIELD='scheduleCustomerNotifyMessage'",
  "document.getElementById('saveSmsSettings')",
  "window.saveSettings(s)",
  '스케줄 알림 문자 설정',
  '스케줄 알림 문구 저장',
  'data-zr-schedule-notify',
  "booking?.schedulePublished",
  "button.disabled=!published",
  "button.textContent='고객 알림'",
  "actions.insertBefore(button,apply)",
  "window.location.href=`sms:",
  'navigator.clipboard?.writeText',
  "grid-template-columns:minmax(0,1fr) minmax(0,1fr)",
  "listObserver.observe(list,{childList:true})",
  '단체명:',
  '방문일:',
  '예약 조회:'
])if(!s.includes(needle))fail(`schedule customer notify contract missing: ${needle}`);

for(const forbidden of [
  'setDoc(',
  'updateDoc(',
  'addDoc(',
  'deleteDoc(',
  'scheduleGroups',
  'reservationAvailability',
  'window.setStore',
  'localStorage.setItem(',
  'sessionStorage.setItem(',
  "querySelectorAll('#tab-schedule [data-apply]').forEach",
  "querySelectorAll('#tab-schedule [data-publish]').forEach"
])if(s.includes(forbidden))fail(`schedule customer notify helper must not own existing persistence/actions: ${forbidden}`);

const loader='admin_tab_active_fix_v1.js';
const l=read(loader);
syntax(loader);
for(const needle of [
  'loadScheduleCustomerNotify',
  'zrAdminScheduleCustomerNotifyV1',
  './admin_schedule_customer_notify_v1.js?v=1'
])if(!l.includes(needle))fail(`schedule customer notify loader missing: ${needle}`);

if(failed)process.exit(1);
ok('manual schedule customer notification stays separate from schedule publish/apply persistence');
