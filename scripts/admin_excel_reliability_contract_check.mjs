import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const file='admin_excel_reliability_fix_v1.js';
const s=fs.readFileSync(file,'utf8');
const loader=fs.readFileSync('admin_tab_active_fix_v1.js','utf8');

for(const f of [file,'admin_tab_active_fix_v1.js']){
  try{execFileSync(process.execPath,['--check',f],{stdio:'pipe'});ok(`syntax ${f}`)}
  catch(e){fail(`syntax ${f}: ${e.stderr?.toString()||e.message}`)}
}
for(const needle of [
  'MEAL_SPACER',
  'ss:Height="8"',
  "p.split(MEAL_SPACER).join('')",
  'dosStamp',
  '((y-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate()',
  'put16(a,i+10,stamp.time)',
  'put16(a,i+12,stamp.date)',
  'put16(a,i+14,stamp.date)',
  'window.downloadMealExcelV3=mealDownload',
  'window.downloadOutsourceExcel=outsourceDownload',
  "const renderOut=window.renderOutsourcingPayments",
  'setTimeout(bind,0)'
])if(!s.includes(needle))fail(`Excel reliability patch missing: ${needle}`);
for(const forbidden of ['setStore(','setDoc(','updateDoc(','deleteDoc(','firebase-firestore','reservationAvailability','scheduleGroups',"localStorage.setItem('zr_bookings'"]){
  if(s.includes(forbidden))fail(`Excel reliability patch must not write reservation data: ${forbidden}`);
}
for(const needle of [
  'function loadExcelReliabilityFix()',
  "s.src='./admin_excel_reliability_fix_v1.js?v=1'",
  "document.addEventListener('zr:admin-runtime-ready',loadExcelReliabilityFix,{once:true})",
  'window.__ZR_ADMIN_REFACTOR_READY'
])if(!loader.includes(needle))fail(`Excel reliability loader missing: ${needle}`);

const oldMeal=fs.readFileSync('admin_features_v3_excel_fix.js','utf8');
if(!oldMeal.includes('<Row ss:Height="8"><Cell/><Cell/><Cell/><Cell/><Cell/><Cell/><Cell/></Row>'))fail('meal source spacer signature changed unexpectedly');

if(failed)process.exit(1);
ok('meal spacer is removed only at download time and outsource XLSX ZIP timestamps are normalized without changing data contracts');
