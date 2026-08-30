import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const read=p=>fs.readFileSync(p,'utf8');
const syntax=file=>{try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'})}catch(e){fail(`${file} syntax: ${e.stderr?.toString()||e.message}`)}};

for(const file of ['admin_today_tab_v1.js','customer_view_tracking_v1.js','admin_tab_active_fix_v1.js'])syntax(file);

const today=read('admin_today_tab_v1.js');
const tracking=read('customer_view_tracking_v1.js');
const loader=read('admin_tab_active_fix_v1.js');

for(const needle of [
  'window.__ZR_ADMIN_TODAY_TAB_V1=true',
  "btn.textContent='Today'",
  "sec.id='tab-today'",
  "String(b.status||'')==='confirmed'",
  "String(b.date||'')===date",
  "FS.collection(db,'scheduleGroups')",
  "FS.where('date','==',date)",
  'FS.onSnapshot',
  'customerViewedParkingAt',
  'customerViewedGuideMapAt',
  'customerViewedScheduleAt',
  "Array.isArray(b?.cafe?.items)",
  '스케줄 관리 · 현장스케줄과 동일 데이터',
  '@page{size:A4 landscape',
  'data-team-count',
  'dataset.teamCount',
  'tabsObserver.observe(tabs,{childList:true})'
])if(!today.includes(needle))fail(`Today contract missing: ${needle}`);

for(const forbidden of [
  'setStore(', 'FS.setDoc(', 'FS.updateDoc(', 'FS.deleteDoc(', 'localStorage.setItem(',
  "collection(db,'reservations')", "collection(db,'reservationAvailability')",
  'observe(document.body', "document.addEventListener('click'"
])if(today.includes(forbidden))fail(`Today must remain read-only/narrow: ${forbidden}`);

for(const needle of [
  'window.__ZR_CUSTOMER_VIEW_TRACKING_V1=true',
  'window.zrCustomerViewTrackingV1={disabled:true',
  "reason:'mobile-popup-regression-check'"
])if(!tracking.includes(needle))fail(`disabled tracking contract missing: ${needle}`);

for(const forbidden of [
  'addEventListener(', 'MutationObserver', 'IntersectionObserver', 'setStore(',
  'localStorage.setItem(', 'FS.', "collection(db,'", 'updateDoc(', 'setDoc(', 'deleteDoc('
])if(tracking.includes(forbidden))fail(`disabled tracking must be inert: ${forbidden}`);

for(const forbidden of [
  'loadCustomerViewTracking()',
  "s.src='./customer_view_tracking_v1.js?v=1'",
  'loadAdminToday()',
  "s.src='./admin_today_tab_v1.js?v=1'",
  'zrTodayTabBtn'
])if(loader.includes(forbidden))fail(`customer-runtime isolation failed: ${forbidden}`);

if(failed){console.error('\nToday/customer-runtime isolation contract failed.');process.exit(1)}
console.log('Today/customer-runtime isolation contract passed.');
