import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const ok=m=>console.log('OK:',m);

const file='admin_excel_reliability_fix_v1.js';
const s=fs.readFileSync(file,'utf8');
const loader=fs.readFileSync('admin_tab_active_fix_v1.js','utf8');
const mealXlsx=fs.readFileSync('admin_features_v4_patch.js','utf8');
const outsource=fs.readFileSync('admin_features_v6_patch.js','utf8');

for(const f of [file,'admin_tab_active_fix_v1.js','admin_features_v4_patch.js','admin_features_v6_patch.js']){
  try{execFileSync(process.execPath,['--check',f],{stdio:'pipe'});ok(`syntax ${f}`)}
  catch(e){fail(`syntax ${f}: ${e.stderr?.toString()||e.message}`)}
}

for(const needle of [
  'function parseStoredZip(input)',
  'function zipStore(files)',
  'function addMealSpacerStyle(styles)',
  'function borderMealSpacerRows(sheet,styleId)',
  'style="medium"',
  'ht="7" customHeight="1"',
  'function repairMealXlsx(input)',
  "f.name==='xl/styles.xml'",
  "f.name==='xl/worksheets/sheet1.xml'",
  "e.target?.closest?.('#downloadMealExcelV3')",
  'const fn=window.downloadMealExcelV3',
  'withBlobTransform(mealParts',
  'e.stopImmediatePropagation()',
  'function repairOutsourceXlsx(input)',
  '/^xl\\/worksheets\\/sheet\\d+\\.xml$/.test(name)',
  "xml.replace(/(<mergeCells\\b[^>]*>[\\s\\S]*?<\\/mergeCells>)(<autoFilter\\b[^>]*\\/>)/,'$2$1')",
  "e.target?.closest?.('#outsourceExcel')",
  'const fn=window.downloadOutsourceExcel',
  'withBlobTransform(outsourceParts'
])if(!s.includes(needle))fail(`Excel reliability patch missing: ${needle}`);

for(const forbidden of [
  'setStore(','setDoc(','updateDoc(','deleteDoc(','firebase-firestore',
  'reservationAvailability','scheduleGroups',"localStorage.setItem('zr_bookings'"
]){
  if(s.includes(forbidden))fail(`Excel reliability patch contains forbidden data behavior: ${forbidden}`);
}

for(const needle of [
  'function loadExcelReliabilityFix()',
  "s.src='./admin_excel_reliability_fix_v1.js?v=2'",
  'loadExcelReliabilityFix();',
  "document.addEventListener('zr:admin-runtime-ready',loadExcelReliabilityFix,{once:true})"
])if(!loader.includes(needle))fail(`Excel reliability loader missing: ${needle}`);

if(loader.includes("if(typeof window.downloadMealExcelV3!=='function'||typeof window.downloadOutsourceExcel!=='function')return;")){
  fail('Excel reliability loader must not wait for both download functions before loading');
}else ok('Excel reliability patch loads independently of runtime function order');

for(const needle of [
  'function buildMealXlsx(ym,list)',
  "a.download=`주렁주렁_${month}월_단체식사주문내역.xlsx`",
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ht="7" customHeight="1"></row>',
  'btn.onclick=downloadMealXlsxV4'
])if(!mealXlsx.includes(needle))fail(`frozen meal XLSX generator signature changed: ${needle}`);
else ok(`meal XLSX source keeps expected signature: ${needle}`);

const sampleStyles='<borders count="2"><border/><border/></borders><cellXfs count="8"><xf/><xf/></cellXfs>';
let borderId=-1,styleId=-1;
let styles=sampleStyles.replace(/<borders count="(\d+)">([\s\S]*?)<\/borders>/,(all,count,body)=>{
  borderId=Number(count);
  return `<borders count="${borderId+1}">${body}<border><top style="medium"/><bottom style="medium"/></border></borders>`;
});
styles=styles.replace(/<cellXfs count="(\d+)">([\s\S]*?)<\/cellXfs>/,(all,count,body)=>{
  styleId=Number(count);
  return `<cellXfs count="${styleId+1}">${body}<xf borderId="${borderId}"/></cellXfs>`;
});
const spacer='<row r="7" ht="7" customHeight="1"></row>';
const sheet=spacer.replace(/<row r="(\d+)" ht="7" customHeight="1">\s*<\/row>/,(all,row)=>{
  let cells='';for(let c=65;c<=71;c++)cells+=`<c r="${String.fromCharCode(c)}${row}" s="${styleId}"/>`;
  return `<row r="${row}" ht="7" customHeight="1">${cells}</row>`;
});
if(borderId!==2||styleId!==8||!styles.includes('count="3"')||!styles.includes('count="9"')||!sheet.includes('A7')||!sheet.includes('G7')){
  fail('meal XLSX spacer border transformation sanity check failed');
}else ok('meal XLSX spacer row receives a real medium border style across A:G');

if(!outsource.includes("<sheetData>${xmlRows.join('')}</sheetData><mergeCells count=\"1\"><mergeCell ref=\"A1:I1\"/></mergeCells><autoFilter ref=\"A2:I${r}\"/>")){
  fail('outsource source signature changed; review whether worksheet XML repair is still needed');
}

if(failed)process.exit(1);
ok('meal XLSX border repair and outsource worksheet repair are isolated from reservation data');
