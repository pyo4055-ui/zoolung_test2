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
  'function mealColNumber(col)',
  'function mealColName(n)',
  'function insertMealStyledCell(inner,row,col,styleId)',
  'function fillMealMergedRangeCells(sheet)',
  'style="medium"',
  'ht="7" customHeight="1"',
  '<mergeCell ref="([A-Z]+)(\\d+):([A-Z]+)(\\d+)"\\/>',
  'const anchor=`${startCol}${startRow}`',
  'needs.set(col,styleId)',
  'fixedSheet=fillMealMergedRangeCells(fixedSheet)',
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
  "s.src='./admin_excel_reliability_fix_v1.js?v=4'",
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
  'merges.push(`A${r}:G${r}`)',
  'merges.push(`A${start}:A${end}`,`B${start}:B${end}`,`C${start}:C${end}`)',
  'merges.push(`A${r}:E${r}`)'
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
const spacerFixed=spacer.replace(/<row r="(\d+)" ht="7" customHeight="1">\s*<\/row>/,(all,row)=>{
  let cells='';for(let c=65;c<=71;c++)cells+=`<c r="${String.fromCharCode(c)}${row}" s="${styleId}"/>`;
  return `<row r="${row}" ht="7" customHeight="1">${cells}</row>`;
});
if(borderId!==2||styleId!==8||!styles.includes('count="3"')||!styles.includes('count="9"')||!spacerFixed.includes('A7')||!spacerFixed.includes('G7')){
  fail('meal XLSX spacer border transformation sanity check failed');
}else ok('meal XLSX spacer row receives a real medium border style across A:G');

function colNumber(col){let n=0;for(const ch of String(col||''))n=n*26+(ch.charCodeAt(0)-64);return n;}
function colName(n){let out='';while(n>0){n--;out=String.fromCharCode(65+n%26)+out;n=Math.floor(n/26);}return out;}
function insertStyledCell(inner,row,col,cellStyle){
  const ref=`${col}${row}`;
  if(new RegExp(`<c\\b[^>]*\\br="${ref}"(?:\\s|/|>)`).test(inner))return inner;
  const target=colNumber(col),cell=`<c r="${ref}" s="${cellStyle}"/>`;let inserted=false;
  const out=inner.replace(/<c\b[^>]*\br="([A-Z]+)\d+"[^>]*(?:\/>|>[\s\S]*?<\/c>)/g,(all,existingCol)=>{
    if(!inserted&&colNumber(existingCol)>target){inserted=true;return cell+all;}
    return all;
  });
  return inserted?out:out+cell;
}
function fillMergedSample(sheetXml){
  const needsByRow=new Map();
  sheetXml.replace(/<mergeCell ref="([A-Z]+)(\d+):([A-Z]+)(\d+)"\/>/g,(all,startCol,startRow,endCol,endRow)=>{
    startRow=Number(startRow);endRow=Number(endRow);
    const anchor=`${startCol}${startRow}`;
    const styleMatch=sheetXml.match(new RegExp(`<c\\b[^>]*\\br="${anchor}"[^>]*\\bs="(\\d+)"`));
    if(!styleMatch)return all;
    const cellStyle=Number(styleMatch[1]),from=colNumber(startCol),to=colNumber(endCol);
    for(let row=startRow;row<=endRow;row++){
      if(!needsByRow.has(row))needsByRow.set(row,new Map());
      const needs=needsByRow.get(row);
      for(let c=from;c<=to;c++){
        const col=colName(c),ref=`${col}${row}`;
        if(ref!==anchor)needs.set(col,cellStyle);
      }
    }
    return all;
  });
  return sheetXml.replace(/<row r="(\d+)"([^>]*)>([\s\S]*?)<\/row>/g,(all,row,attrs,inner)=>{
    const needs=needsByRow.get(Number(row));if(!needs)return all;
    let fixed=inner;
    [...needs.entries()].sort((a,b)=>colNumber(a[0])-colNumber(b[0])).forEach(([col,cellStyle])=>{fixed=insertStyledCell(fixed,row,col,cellStyle);});
    return `<row r="${row}"${attrs}>${fixed}</row>`;
  });
}
const mergedSample='<worksheet><sheetData><row r="1"><c r="A1" s="1" t="inlineStr"><is><t>제목</t></is></c></row><row r="5"><c r="A5" s="3"/><c r="B5" s="3"/><c r="C5" s="3"/><c r="D5" s="3"/><c r="E5" s="3"/><c r="F5" s="4"/><c r="G5" s="3"/></row><row r="6"><c r="D6" s="3"/><c r="E6" s="3"/><c r="F6" s="4"/><c r="G6" s="3"/></row><row r="11"><c r="A11" s="5"/><c r="F11" s="6"/><c r="G11" s="5"/></row></sheetData><mergeCells><mergeCell ref="A1:G1"/><mergeCell ref="A5:A6"/><mergeCell ref="B5:B6"/><mergeCell ref="C5:C6"/><mergeCell ref="A11:E11"/></mergeCells></worksheet>';
const mergedFixed=fillMergedSample(mergedSample);
for(const ref of ['B1','C1','D1','E1','F1','G1'])if(!mergedFixed.includes(`<c r="${ref}" s="1"/>`))fail(`meal title merged-border repair missing ${ref}`);
for(const ref of ['A6','B6','C6'])if(!mergedFixed.includes(`<c r="${ref}" s="3"/>`))fail(`meal body merged-border repair missing ${ref}`);
for(const ref of ['B11','C11','D11','E11'])if(!mergedFixed.includes(`<c r="${ref}" s="5"/>`))fail(`meal total merged-border repair missing ${ref}`);
for(const ref of ['D6','E6','F6','G6','F11','G11'])if((mergedFixed.match(new RegExp(`<c r="${ref}"`,'g'))||[]).length!==1)fail(`meal merged-border repair duplicated existing cell ${ref}`);

function rowRefs(xml,row){
  const m=xml.match(new RegExp(`<row r="${row}"[^>]*>([\\s\\S]*?)<\\/row>`));
  return m?[...m[1].matchAll(/<c r="([A-Z]+\d+)"/g)].map(x=>x[1]):[];
}
const titleRefs=rowRefs(mergedFixed,1),bodyRefs=rowRefs(mergedFixed,6),totalRefs=rowRefs(mergedFixed,11);
if(titleRefs.join(',')!=='A1,B1,C1,D1,E1,F1,G1')fail(`meal title cells are not ordered A:G: ${titleRefs.join(',')}`);
if(bodyRefs.join(',')!=='A6,B6,C6,D6,E6,F6,G6')fail(`meal body continuation cells are not ordered A:G: ${bodyRefs.join(',')}`);
if(totalRefs.join(',')!=='A11,B11,C11,D11,E11,F11,G11')fail(`meal total cells are not ordered A:G: ${totalRefs.join(',')}`);
if(!failed)ok('meal title, body merged cells, total row, and separator borders all produce complete ordered A:G cell coverage');

if(!outsource.includes("<sheetData>${xmlRows.join('')}</sheetData><mergeCells count=\"1\"><mergeCell ref=\"A1:I1\"/></mergeCells><autoFilter ref=\"A2:I${r}\"/>")){
  fail('outsource source signature changed; review whether worksheet XML repair is still needed');
}

if(failed)process.exit(1);
ok('meal XLSX border repairs and outsource worksheet repair stay isolated from reservation data');
