import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const read=p=>fs.readFileSync(p,'utf8');
const syntax=file=>{try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});ok(`syntax ${file}`)}catch(e){fail(`syntax ${file}: ${e.stderr?.toString()||e.message}`)}};

const file='admin_schedule_customer_notify_v1.js';
const publishFile='admin_schedule_publish_sync_v1.js';
const s=read(file);
const p=read(publishFile);
syntax(file);
syntax(publishFile);

for(const needle of [
  "const SETTING_FIELD='scheduleCustomerNotifyMessage'",
  "const BOOKING_KEY='zr_bookings'",
  "document.getElementById('saveSmsSettings')",
  "window.saveSettings(s)",
  '스케줄 알림 문자 설정',
  '스케줄 알림 문구 저장',
  'data-zr-schedule-notify',
  "booking?.schedulePublished",
  "button.disabled=!published",
  "button.textContent=done?'✓ 알림완료':'고객 알림'",
  "booking.customerSchedule={...booking.customerSchedule,notifiedAt:new Date().toISOString()}",
  "window.setStore(BOOKING_KEY,list)",
  "actions.insertBefore(button,apply)",
  "window.location.href=`sms:",
  "s.src='./admin_schedule_publish_sync_v1.js?v=1'",
  "grid-template-columns:minmax(0,1fr) minmax(0,1fr)",
  "listObserver.observe(list,{childList:true})",
  '단체명:',
  '방문일:',
  '예약 조회:'
])if(!s.includes(needle))fail(`schedule customer notify contract missing: ${needle}`);

for(const forbidden of [
  'navigator.clipboard',
  'setDoc(',
  'updateDoc(',
  'addDoc(',
  'deleteDoc(',
  'scheduleGroups',
  'reservationAvailability',
  'localStorage.setItem(',
  'sessionStorage.setItem(',
  "querySelectorAll('#tab-schedule [data-apply]').forEach",
  "querySelectorAll('#tab-schedule [data-publish]').forEach"
])if(s.includes(forbidden))fail(`schedule customer notify helper violated scope: ${forbidden}`);

for(const needle of [
  'window.__ZR_ADMIN_SCHEDULE_PUBLISH_SYNC_V1=true',
  "const STAFF_EMAIL='zoolung09@zoolungzoolung.com'",
  "FS.doc(db,'reservations',String(id))",
  'schedulePublished:target',
  'if(target&&b.customerSchedule)patch.customerSchedule=b.customerSchedule',
  'FS.serverTimestamp()',
  "await FS.setDoc(FS.doc(db,'reservations',String(id)),patch,{merge:true})",
  "list.querySelectorAll('[data-publish]').forEach",
  "btn.addEventListener('click'",
  'waitAndSync(id,!before)',
  "listObserver.observe(list,{childList:true})"
])if(!p.includes(needle))fail(`schedule publish sync contract missing: ${needle}`);

for(const forbidden of [
  'localStorage.setItem(',
  'window.setStore(',
  'reservationAvailability',
  "FS.doc(db,'scheduleGroups'",
  'observe(document.body',
  "document.addEventListener('click'",
  'preventDefault(',
  'stopPropagation(',
  'stopImmediatePropagation('
])if(p.includes(forbidden))fail(`schedule publish sync must stay narrow: ${forbidden}`);

const loader='admin_tab_active_fix_v1.js';
const l=read(loader);
syntax(loader);
for(const needle of [
  'loadScheduleCustomerNotify',
  'zrAdminScheduleCustomerNotifyV1',
  './admin_schedule_customer_notify_v1.js?v=1'
])if(!l.includes(needle))fail(`schedule customer notify loader missing: ${needle}`);

if(failed)process.exit(1);
ok('schedule confirmation publishes immediately and customer SMS state stays separate');
