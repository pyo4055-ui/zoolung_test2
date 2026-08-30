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
  "COLLECTION='reservations'",
  "guide:'customerViewedGuideMapAt'",
  "parking:'customerViewedParkingAt'",
  "schedule:'customerViewedScheduleAt'",
  "guide:'zrGuideMapModalV32'",
  "parking:'zrCustomerParkingQuickV1'",
  "schedule:'zrCustomerScheduleZoom'",
  "const remoteDone=new Set()",
  "const inflight=new Set()",
  "root.addEventListener('pointerup',onPointerUp,{passive:true})",
  "root.addEventListener('keydown',onKeyDown)",
  "if(!remoteDone.has(`${id}|${FIELDS[kind]}`)&&!inflight.has(`${id}|${FIELDS[kind]}`)&&modalOpen(modalId))persistView(id,kind)",
  "await FS.updateDoc(FS.doc(db,COLLECTION,String(id)),{[field]:stamp})",
  "remoteDone.add(key)",
  "const localOk=remoteOk?false:fallbackOwnerSync(id,field,stamp)",
  "window.setStore(KEY,list)",
  "showStatus(`${label} · 서버 확인 기록 성공`,'ok')",
  "showStatus(`${label} · Firebase 권한 거부 (permission-denied)`,'err')",
  "showStatus(`${label} · Firebase 연결 확인 필요`,'warn')",
  "showStatus('확인 기록 대상 예약을 찾지 못했습니다.','err')"
])if(!tracking.includes(needle))fail(`customer view tracking contract missing: ${needle}`);

for(const forbidden of [
  'MutationObserver', 'IntersectionObserver', 'localStorage.setItem(', 'FS.setDoc(', 'FS.deleteDoc(',
  "collection(db,'reservationAvailability')", "document.addEventListener('click'", "document.addEventListener('pointerup'",
  'preventDefault(', 'stopPropagation(', 'stopImmediatePropagation('
])if(tracking.includes(forbidden))fail(`customer view tracking must stay mobile-safe/narrow: ${forbidden}`);

for(const needle of [
  'loadCustomerViewTracking()',
  "s.src='./customer_view_tracking_v1.js?v=1'",
  'loadAdminToday()',
  "s.src='./admin_today_tab_v1.js?v=1'",
  "if(clicked.id!=='zrTodayTabBtn')gray('zrTodayTabBtn')"
])if(!loader.includes(needle))fail(`Today/customer view loader contract missing: ${needle}`);

if(failed){console.error('\nToday/customer-view contract failed.');process.exit(1)}
console.log('Today/customer-view contract passed.');
