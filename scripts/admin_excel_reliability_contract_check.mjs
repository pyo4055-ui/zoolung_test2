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
  'const MEAL_BODY_STYLE=3',
  'function parseStoredZip(input)',
  'function zipStore(files)',
  'function addMealSpacerStyle(styles)',
  'function borderMealSpacerRows(sheet,styleId)',
  'function fillMealMergedCells(sheet)',
  'style="medium"',
  'ht="7" customHeight="1"',
  '<mergeCell ref="([A-C])(\\d+):\\1(\\d+)"\\/>',
  'if(!exists)add+=`<c r="${ref}" s="${MEAL_BODY_STYLE}"/>`',
  'fixedSheet=fillMealMergedCells(fixedSheet)',
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
  "s.src='./admin_excel_reliability_fix_v1.js?v=3'",
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
  'btn.onclick=downloadMealXlsxV4',
  'merges.push(`A${start}:A${end}`,`B${start}:B${end}`,`C${start}:C${end}`)'
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

function fillMergedSample(sheetXml){
  const byRow=new Map();
  sheetXml.replace(/<mergeCell ref="([A-C])(\d+):\1(\d+)"\/>/g,(all,col,start,end)=>{
    start=Number(start);end=Number(end);
    for(let row=start+1;row<=end;row++){
      if(!byRow.has(row))byRow.set(row,new Set());
      byRow.get(row).add(col);
    }
    return all;
  });
  return sheetXml.replace(/<row r="(\d+)"([^>]*)>([\s\S]*?)<\/row>/g,(all,row,attrs,inner)=>{
    const cols=byRow.get(Number(row));if(!cols)return all;
    let add='';
    [...cols].sort().forEach(col=>{
      const ref=`${col}${row}`;
      if(!new RegExp(`<c\\b[^>]*\\br="${ref}"(?:\\s|/|>)`).test(inner))add+=`<c r="${ref}" s="3"/>`;
    });
    return add?`<row r="${row}"${attrs}>${add}${inner}</row>`:all;
  });
}
const mergedSample='<worksheet><sheetData><row r="5"><c r="A5" s="3"/><c r="B5" s="3"/><c r="C5" s="3"/><c r="D5" s="3"/></row><row r="6"><c r="D6" s="3"/></row><row r="7"><c r="D7" s="3"/></row></sheetData><mergeCells><mergeCell ref="A5:A7"/><mergeCell ref="B5:B7"/><mergeCell ref="C5:C7"/></mergeCells></worksheet>';
const mergedFixed=fillMergedSample(mergedSample);
for(const ref of ['A6','B6','C6','A7','B7','C7'])if(!mergedFixed.includes(`<c r="${ref}" s="3"/>`))fail(`meal merged-border repair missing continuation cell ${ref}`);
if((mergedFixed.match(/<c r="D6"/g)||[]).length!==1)fail('meal merged-border repair must not duplicate existing menu cells');
else ok('meal vertical merged cells A:C receive continuation cells so thin borders render continuously');

if(!outsource.includes("<sheetData>${xmlRows.join('')}</sheetData><mergeCells count=\"1\"><mergeCell ref=\"A1:I1\"/></mergeCells><autoFilter ref=\"A2:I${r}\"/>")){
  fail('outsource source signature changed; review whether worksheet XML repair is still needed');
}

if(failed)process.exit(1);
ok('meal XLSX separator and merged-cell border repairs stay isolated from reservation data');
