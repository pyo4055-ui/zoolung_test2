import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);
const file='admin_excel_reliability_fix_v1.js';
const s=fs.readFileSync(file,'utf8');
const loader=fs.readFileSync('admin_tab_active_fix_v1.js','utf8');
const outsource=fs.readFileSync('admin_features_v6_patch.js','utf8');
const meal=fs.readFileSync('admin_features_v3_excel_fix.js','utf8');

for(const f of [file,'admin_tab_active_fix_v1.js','admin_features_v6_patch.js','admin_features_v3_excel_fix.js']){
  try{execFileSync(process.execPath,['--check',f],{stdio:'pipe'});ok(`syntax ${f}`)}
  catch(e){fail(`syntax ${f}: ${e.stderr?.toString()||e.message}`)}
}
for(const needle of [
  'function repairOutsourceXlsx(input)',
  '/^xl\\/worksheets\\/sheet\\d+\\.xml$/.test(name)',
  "xml.replace(/(<mergeCells\\b[^>]*>[\\s\\S]*?<\\/mergeCells>)(<autoFilter\\b[^>]*\\/>)/,'$2$1')",
  'const crc=crc32(bytes);put32(a,i+14,crc);crcByName.set(name,crc)',
  'if(crc!==undefined)put32(a,i+16,crc)',
  'window.downloadOutsourceExcel=outsourceDownload',
  "const renderOut=window.renderOutsourcingPayments",
  'setTimeout(bind,0)'
])if(!s.includes(needle))fail(`Excel reliability patch missing: ${needle}`);
for(const forbidden of ['MEAL_SPACER','MEAL_GROUP_STYLES','emphasizeMealGroups','mealParts','mealDownload','window.downloadMealExcelV3=mealDownload','dosStamp','stamp.time','stamp.date','setStore(','setDoc(','updateDoc(','deleteDoc(','firebase-firestore','reservationAvailability','scheduleGroups',"localStorage.setItem('zr_bookings'"]){
  if(s.includes(forbidden))fail(`Excel reliability patch contains forbidden/obsolete behavior: ${forbidden}`);
}
for(const needle of [
  'function loadExcelReliabilityFix()',
  "s.src='./admin_excel_reliability_fix_v1.js?v=1'",
  "document.addEventListener('zr:admin-runtime-ready',loadExcelReliabilityFix,{once:true})",
  'window.__ZR_ADMIN_REFACTOR_READY'
])if(!loader.includes(needle))fail(`Excel reliability loader missing: ${needle}`);

for(const needle of [
  'ss:ID="GroupCell"',
  'ss:ID="GroupMoney"',
  'ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"',
  'const groupStart=gi>0&&i===0',
  "cellStyle=groupStart?'GroupCell':'Cell'",
  "moneyStyle=groupStart?'GroupMoney':'Money'",
  "c(krDate(g.b.date),cellStyle,'String',md)",
  "c(Number(it.amount||0),moneyStyle,'Number')"
])if(!meal.includes(needle))fail(`meal Excel direct group styling missing: ${needle}`);
if(meal.includes('<Row ss:Height="8"><Cell/><Cell/><Cell/><Cell/><Cell/><Cell/><Cell/></Row>'))fail('meal Excel must not generate spacer rows between groups');
else ok('meal Excel no longer generates spacer rows');

const badOrder='<sheetData></sheetData><mergeCells count="1"><mergeCell ref="A1:I1"/></mergeCells><autoFilter ref="A2:I5"/>';
const repaired=badOrder.replace(/(<mergeCells\b[^>]*>[\s\S]*?<\/mergeCells>)(<autoFilter\b[^>]*\/>)/,'$2$1');
if(!(repaired.indexOf('<autoFilter')<repaired.indexOf('<mergeCells')))fail('worksheet repair must move autoFilter before mergeCells');
else ok('worksheet XML order repair puts autoFilter before mergeCells');

if(!outsource.includes('<sheetData>${xmlRows.join(\'\')}</sheetData><mergeCells count="1"><mergeCell ref="A1:I1"/></mergeCells><autoFilter ref="A2:I${r}"/>'))fail('outsource source signature changed; review whether runtime XML repair is still needed');

if(failed)process.exit(1);
ok('meal group spacing/borders are generated directly and outsource worksheet XML is repaired without changing reservation data');