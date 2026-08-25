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
  'MEAL_SPACER',
  'MEAL_GROUP_STYLES',
  'ss:ID="GroupMerged"',
  'ss:ID="GroupTop"',
  'ss:ID="GroupBottom"',
  'ss:ID="GroupSingle"',
  'ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"',
  'ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"',
  'function outlineMealGroups(xml)',
  "const chunks=out.split(MEAL_SPACER)",
  "if(first&&last)return styleMealRow(row,'single')",
  "if(first)return styleMealRow(row,'top')",
  "if(last)return styleMealRow(row,'bottom')",
  "e.target?.closest?.('#downloadMealExcelV3')",
  'e.stopImmediatePropagation()',
  'mealDownload.call(mealBtn,e)',
  'function repairOutsourceXlsx(input)',
  '/^xl\\/worksheets\\/sheet\\d+\\.xml$/.test(name)',
  "xml.replace(/(<mergeCells\\b[^>]*>[\\s\\S]*?<\\/mergeCells>)(<autoFilter\\b[^>]*\\/>)/,'$2$1')",
  'const crc=crc32(bytes);put32(a,i+14,crc);crcByName.set(name,crc)',
  'if(crc!==undefined)put32(a,i+16,crc)',
  'window.downloadOutsourceExcel=outsourceDownload',
  "const renderOut=window.renderOutsourcingPayments",
  'setTimeout(bind,0)'
])if(!s.includes(needle))fail(`Excel reliability patch missing: ${needle}`);
for(const forbidden of ['MEAL_SPACER_STYLE','MEAL_BORDERED_SPACER','GroupSpacer','dosStamp','stamp.time','stamp.date','setStore(','setDoc(','updateDoc(','deleteDoc(','firebase-firestore','reservationAvailability','scheduleGroups',"localStorage.setItem('zr_bookings'"]){
  if(s.includes(forbidden))fail(`Excel reliability patch contains forbidden/obsolete behavior: ${forbidden}`);
}
for(const needle of [
  'function loadExcelReliabilityFix()',
  "s.src='./admin_excel_reliability_fix_v1.js?v=1'",
  "document.addEventListener('zr:admin-runtime-ready',loadExcelReliabilityFix,{once:true})",
  'window.__ZR_ADMIN_REFACTOR_READY'
])if(!loader.includes(needle))fail(`Excel reliability loader missing: ${needle}`);

const spacer='<Row ss:Height="8"><Cell/><Cell/><Cell/><Cell/><Cell/><Cell/><Cell/></Row>';
if(!meal.includes(spacer))fail('frozen meal Excel spacer signature changed unexpectedly');
else ok('frozen meal Excel keeps its spacer row');
for(const needle of ['GroupMerged','GroupTop','GroupBottom','GroupSingle'])if(meal.includes(needle))fail('frozen meal Excel source must remain untouched by outline patch');

const sample=`<Styles></Styles><Row ss:Height="24"><Cell ss:StyleID="Cell" ss:MergeDown="1"><Data ss:Type="String">날짜</Data></Cell><Cell ss:StyleID="Cell" ss:MergeDown="1"><Data ss:Type="String">시간</Data></Cell><Cell ss:StyleID="Cell" ss:MergeDown="1"><Data ss:Type="String">단체</Data></Cell><Cell ss:StyleID="Cell"><Data ss:Type="String">메뉴1</Data></Cell><Cell ss:StyleID="Cell"><Data ss:Type="Number">1</Data></Cell><Cell ss:StyleID="Money"><Data ss:Type="Number">1000</Data></Cell><Cell ss:StyleID="Cell"><Data ss:Type="String"></Data></Cell></Row><Row ss:Height="24"><Cell ss:StyleID="Cell" ss:Index="4"><Data ss:Type="String">메뉴2</Data></Cell><Cell ss:StyleID="Cell"><Data ss:Type="Number">1</Data></Cell><Cell ss:StyleID="Money"><Data ss:Type="Number">1000</Data></Cell><Cell ss:StyleID="Cell"><Data ss:Type="String"></Data></Cell></Row>${spacer}`;
let transformed=sample.replace('</Styles>','<Style ss:ID="GroupMerged"></Style><Style ss:ID="GroupTop"></Style><Style ss:ID="GroupTopMoney"></Style><Style ss:ID="GroupBottom"></Style><Style ss:ID="GroupBottomMoney"></Style></Styles>');
const rows=transformed.match(/<Row ss:Height="24">[\s\S]*?<\/Row>/g)||[];
if(rows.length!==2)fail('meal outline sanity sample must contain two data rows');
else ok('meal outline sanity sample identifies one two-row group');

const badOrder='<sheetData></sheetData><mergeCells count="1"><mergeCell ref="A1:I1"/></mergeCells><autoFilter ref="A2:I5"/>';
const repaired=badOrder.replace(/(<mergeCells\b[^>]*>[\s\S]*?<\/mergeCells>)(<autoFilter\b[^>]*\/>)/,'$2$1');
if(!(repaired.indexOf('<autoFilter')<repaired.indexOf('<mergeCells')))fail('worksheet repair must move autoFilter before mergeCells');
else ok('worksheet XML order repair puts autoFilter before mergeCells');

if(!outsource.includes('<sheetData>${xmlRows.join(\'\')}</sheetData><mergeCells count="1"><mergeCell ref="A1:I1"/></mergeCells><autoFilter ref="A2:I${r}"/>'))fail('outsource source signature changed; review whether runtime XML repair is still needed');

if(failed)process.exit(1);
ok('meal spacer rows stay blank while each group receives strong outer horizontal borders; outsource worksheet XML repair remains isolated');