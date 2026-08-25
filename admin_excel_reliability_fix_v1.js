(()=>{
'use strict';
if(window.__ZR_ADMIN_EXCEL_RELIABILITY_FIX_V1)return;
window.__ZR_ADMIN_EXCEL_RELIABILITY_FIX_V1=true;

const $=id=>document.getElementById(id);
const NativeBlob=window.Blob;
const MEAL_SPACER='<Row ss:Height="8"><Cell/><Cell/><Cell/><Cell/><Cell/><Cell/><Cell/></Row>';
const MEAL_GROUP_STYLES='<Style ss:ID="GroupMerged"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/></Borders></Style><Style ss:ID="GroupTop"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/></Borders></Style><Style ss:ID="GroupTopMoney"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><NumberFormat ss:Format="#,##0"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/></Borders></Style><Style ss:ID="GroupBottom"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style><Style ss:ID="GroupBottomMoney"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><NumberFormat ss:Format="#,##0"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style><Style ss:ID="GroupSingle"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/></Borders></Style><Style ss:ID="GroupSingleMoney"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><NumberFormat ss:Format="#,##0"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/></Borders></Style>';
const td=new TextDecoder('utf-8');
const te=new TextEncoder();
const crcTable=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c>>>0;}return t;})();
const crc32=bytes=>{let c=0xFFFFFFFF;for(const b of bytes)c=crcTable[(c^b)&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0;};
const read16=(a,i)=>a[i]|(a[i+1]<<8);
const read32=(a,i)=>(a[i]|(a[i+1]<<8)|(a[i+2]<<16)|(a[i+3]<<24))>>>0;
const put32=(a,i,n)=>{a[i]=n&255;a[i+1]=(n>>>8)&255;a[i+2]=(n>>>16)&255;a[i+3]=(n>>>24)&255};

function withBlobTransform(transform,run){
  const Prev=window.Blob;
  function PatchedBlob(parts,options){return new NativeBlob(transform(Array.from(parts||[])),options)}
  PatchedBlob.prototype=NativeBlob.prototype;
  try{window.Blob=PatchedBlob;return run()}finally{window.Blob=Prev}
}
function styleMealRow(row,kind){
  const total=(row.match(/ss:StyleID="(?:Cell|Money)"/g)||[]).length;
  let seen=0;
  const merged=kind==='top'&&row.includes('ss:MergeDown=');
  return row.replace(/ss:StyleID="(Cell|Money)"/g,(all,base)=>{
    const index=seen++;
    if(kind==='single')return `ss:StyleID="${base==='Money'?'GroupSingleMoney':'GroupSingle'}"`;
    if(kind==='top'){
      if(merged&&index<3)return 'ss:StyleID="GroupMerged"';
      return `ss:StyleID="${base==='Money'?'GroupTopMoney':'GroupTop'}"`;
    }
    if(kind==='bottom')return `ss:StyleID="${base==='Money'?'GroupBottomMoney':'GroupBottom'}"`;
    return all;
  });
}
function outlineMealGroups(xml){
  if(typeof xml!=='string'||!xml.includes(MEAL_SPACER))return xml;
  let out=xml.includes('ss:ID="GroupMerged"')?xml:xml.replace('</Styles>',MEAL_GROUP_STYLES+'</Styles>');
  const chunks=out.split(MEAL_SPACER);
  return chunks.map(chunk=>{
    const rows=chunk.match(/<Row ss:Height="24">[\s\S]*?<\/Row>/g)||[];
    if(!rows.length)return chunk;
    let i=0;
    return chunk.replace(/<Row ss:Height="24">[\s\S]*?<\/Row>/g,row=>{
      const first=i===0,last=i===rows.length-1;i++;
      if(first&&last)return styleMealRow(row,'single');
      if(first)return styleMealRow(row,'top');
      if(last)return styleMealRow(row,'bottom');
      return row;
    });
  }).join(MEAL_SPACER);
}
function mealParts(parts){return parts.map(p=>typeof p==='string'?outlineMealGroups(p):p)}

function repairOutsourceXlsx(input){
  if(!(input instanceof Uint8Array)||input.length<30)return input;
  const a=new Uint8Array(input),crcByName=new Map();
  let i=0;
  while(i+30<=a.length){
    const sig=read32(a,i);
    if(sig===0x04034b50){
      const method=read16(a,i+8),size=read32(a,i+18),nameLen=read16(a,i+26),extraLen=read16(a,i+28);
      const nameStart=i+30,dataStart=nameStart+nameLen+extraLen,dataEnd=dataStart+size;
      if(dataEnd>a.length)break;
      const name=td.decode(a.subarray(nameStart,nameStart+nameLen));
      if(method===0&&/^xl\/worksheets\/sheet\d+\.xml$/.test(name)){
        const src=a.subarray(dataStart,dataEnd),xml=td.decode(src);
        const fixed=xml.replace(/(<mergeCells\b[^>]*>[\s\S]*?<\/mergeCells>)(<autoFilter\b[^>]*\/>)/,'$2$1');
        if(fixed!==xml){
          const bytes=te.encode(fixed);
          if(bytes.length!==src.length)throw new Error('아웃소싱 시트 XML 보정 길이가 달라졌습니다.');
          a.set(bytes,dataStart);
          const crc=crc32(bytes);put32(a,i+14,crc);crcByName.set(name,crc);
        }
      }
      i=dataEnd;continue;
    }
    if(sig===0x02014b50||sig===0x06054b50)break;
    i++;
  }
  while(i+46<=a.length&&read32(a,i)===0x02014b50){
    const nameLen=read16(a,i+28),extraLen=read16(a,i+30),commentLen=read16(a,i+32),nameStart=i+46;
    const name=td.decode(a.subarray(nameStart,nameStart+nameLen)),crc=crcByName.get(name);
    if(crc!==undefined)put32(a,i+16,crc);
    i=nameStart+nameLen+extraLen+commentLen;
  }
  return a;
}
function outsourceParts(parts){return parts.map(repairOutsourceXlsx)}

const baseMeal=window.downloadMealExcelV3;
const baseOutsource=window.downloadOutsourceExcel;
function mealDownload(){
  if(typeof baseMeal!=='function')return;
  const self=this,args=arguments;
  return withBlobTransform(mealParts,()=>baseMeal.apply(self,args));
}
function outsourceDownload(){
  if(typeof baseOutsource!=='function')return;
  const self=this,args=arguments;
  return withBlobTransform(outsourceParts,()=>baseOutsource.apply(self,args));
}
function bind(){
  if(typeof baseMeal==='function')window.downloadMealExcelV3=mealDownload;
  if(typeof baseOutsource==='function'){
    window.downloadOutsourceExcel=outsourceDownload;
    try{downloadOutsourceExcel=outsourceDownload}catch{}
    const b=$('outsourceExcel');if(b){b.onclick=outsourceDownload;b.textContent='엑셀 내려받기'}
  }
}
const renderOut=window.renderOutsourcingPayments;
if(typeof renderOut==='function'&&!renderOut.__zrExcelReliabilityFixV1){
  const wrapped=function(){const out=renderOut.apply(this,arguments);setTimeout(bind,0);return out};
  wrapped.__zrExcelReliabilityFixV1=true;
  window.renderOutsourcingPayments=wrapped;
  try{renderOutsourcingPayments=wrapped}catch{}
}
document.addEventListener('click',e=>{
  const mealBtn=e.target?.closest?.('#downloadMealExcelV3');
  if(mealBtn&&typeof baseMeal==='function'){
    e.preventDefault();
    e.stopImmediatePropagation();
    mealDownload.call(mealBtn,e);
    return;
  }
  if(e.target?.closest?.('[data-tab],#outsourceTabBtn'))setTimeout(bind,30);
},true);
bind();
})();