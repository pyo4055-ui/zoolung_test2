(()=>{
'use strict';
if(window.__ZR_ADMIN_EXCEL_RELIABILITY_FIX_V1)return;
window.__ZR_ADMIN_EXCEL_RELIABILITY_FIX_V1=true;

const NativeBlob=window.Blob;
const MEAL_BODY_STYLE=3;
const td=new TextDecoder('utf-8');
const te=new TextEncoder();
const crcTable=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c>>>0;}return t;})();
const crc32=bytes=>{let c=0xFFFFFFFF;for(const b of bytes)c=crcTable[(c^b)&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0;};
const read16=(a,i)=>a[i]|(a[i+1]<<8);
const read32=(a,i)=>(a[i]|(a[i+1]<<8)|(a[i+2]<<16)|(a[i+3]<<24))>>>0;
const put32=(a,i,n)=>{a[i]=n&255;a[i+1]=(n>>>8)&255;a[i+2]=(n>>>16)&255;a[i+3]=(n>>>24)&255};
const u16=n=>[n&255,(n>>>8)&255];
const u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];
function concatBytes(parts){const len=parts.reduce((s,p)=>s+p.length,0),out=new Uint8Array(len);let o=0;for(const p of parts){out.set(p,o);o+=p.length;}return out;}

function withBlobTransform(transform,run){
  const Prev=window.Blob;
  function PatchedBlob(parts,options){return new NativeBlob(transform(Array.from(parts||[])),options)}
  PatchedBlob.prototype=NativeBlob.prototype;
  try{window.Blob=PatchedBlob;return run()}finally{window.Blob=Prev}
}

function parseStoredZip(input){
  if(!(input instanceof Uint8Array)||input.length<30)return null;
  const a=input,files=[];let i=0;
  while(i+30<=a.length&&read32(a,i)===0x04034b50){
    const method=read16(a,i+8),size=read32(a,i+18),nameLen=read16(a,i+26),extraLen=read16(a,i+28);
    if(method!==0)return null;
    const nameStart=i+30,dataStart=nameStart+nameLen+extraLen,dataEnd=dataStart+size;
    if(dataEnd>a.length)return null;
    const name=td.decode(a.subarray(nameStart,nameStart+nameLen));
    files.push({name,data:a.slice(dataStart,dataEnd)});
    i=dataEnd;
  }
  return files.length?files:null;
}
function zipStore(files){
  const locals=[],centrals=[];let offset=0;
  for(const f of files){
    const name=te.encode(f.name),data=f.data instanceof Uint8Array?f.data:te.encode(String(f.data??'')),crc=crc32(data),flags=0x0800;
    const local=new Uint8Array([0x50,0x4b,0x03,0x04,...u16(20),...u16(flags),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...name]);
    locals.push(local,data);
    const central=new Uint8Array([0x50,0x4b,0x01,0x02,...u16(20),...u16(20),...u16(flags),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...name]);
    centrals.push(central);offset+=local.length+data.length;
  }
  const centralSize=centrals.reduce((s,p)=>s+p.length,0);
  const eocd=new Uint8Array([0x50,0x4b,0x05,0x06,...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(centralSize),...u32(offset),...u16(0)]);
  return concatBytes([...locals,...centrals,eocd]);
}

function addMealSpacerStyle(styles){
  let borderId=-1,styleId=-1;
  styles=styles.replace(/<borders count="(\d+)">([\s\S]*?)<\/borders>/,(all,count,body)=>{
    borderId=Number(count);
    const border='<border><left/><right/><top style="medium"><color auto="1"/></top><bottom style="medium"><color auto="1"/></bottom><diagonal/></border>';
    return `<borders count="${borderId+1}">${body}${border}</borders>`;
  });
  if(borderId<0)return null;
  styles=styles.replace(/<cellXfs count="(\d+)">([\s\S]*?)<\/cellXfs>/,(all,count,body)=>{
    styleId=Number(count);
    const xf=`<xf numFmtId="0" fontId="0" fillId="0" borderId="${borderId}" xfId="0" applyBorder="1"/>`;
    return `<cellXfs count="${styleId+1}">${body}${xf}</cellXfs>`;
  });
  return styleId<0?null:{styles,styleId};
}
function borderMealSpacerRows(sheet,styleId){
  return sheet.replace(/<row r="(\d+)" ht="7" customHeight="1">\s*<\/row>/g,(all,row)=>{
    let cells='';
    for(let c=65;c<=71;c++)cells+=`<c r="${String.fromCharCode(c)}${row}" s="${styleId}"/>`;
    return `<row r="${row}" ht="7" customHeight="1">${cells}</row>`;
  });
}
function fillMealMergedCells(sheet){
  const byRow=new Map();
  sheet.replace(/<mergeCell ref="([A-C])(\d+):\1(\d+)"\/>/g,(all,col,start,end)=>{
    start=Number(start);end=Number(end);
    for(let row=start+1;row<=end;row++){
      if(!byRow.has(row))byRow.set(row,new Set());
      byRow.get(row).add(col);
    }
    return all;
  });
  if(!byRow.size)return sheet;
  return sheet.replace(/<row r="(\d+)"([^>]*)>([\s\S]*?)<\/row>/g,(all,row,attrs,inner)=>{
    const cols=byRow.get(Number(row));if(!cols)return all;
    let add='';
    [...cols].sort().forEach(col=>{
      const ref=`${col}${row}`;
      const exists=new RegExp(`<c\\b[^>]*\\br="${ref}"(?:\\s|/|>)`).test(inner);
      if(!exists)add+=`<c r="${ref}" s="${MEAL_BODY_STYLE}"/>`;
    });
    return add?`<row r="${row}"${attrs}>${add}${inner}</row>`:all;
  });
}
function repairMealXlsx(input){
  const files=parseStoredZip(input);if(!files)return input;
  const stylesFile=files.find(f=>f.name==='xl/styles.xml'),sheetFile=files.find(f=>f.name==='xl/worksheets/sheet1.xml');
  if(!stylesFile||!sheetFile)return input;
  const styled=addMealSpacerStyle(td.decode(stylesFile.data));if(!styled)return input;
  const originalSheet=td.decode(sheetFile.data);
  let fixedSheet=borderMealSpacerRows(originalSheet,styled.styleId);
  fixedSheet=fillMealMergedCells(fixedSheet);
  if(fixedSheet===originalSheet)return input;
  stylesFile.data=te.encode(styled.styles);
  sheetFile.data=te.encode(fixedSheet);
  return zipStore(files);
}
function mealParts(parts){return parts.map(p=>p instanceof Uint8Array?repairMealXlsx(p):p)}

function repairOutsourceXlsx(input){
  if(!(input instanceof Uint8Array)||input.length<30)return input;
  const a=new Uint8Array(input),crcByName=new Map();let i=0;
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
function outsourceParts(parts){return parts.map(p=>p instanceof Uint8Array?repairOutsourceXlsx(p):p)}

document.addEventListener('click',e=>{
  const mealBtn=e.target?.closest?.('#downloadMealExcelV3');
  if(mealBtn){
    const fn=window.downloadMealExcelV3;
    if(typeof fn==='function'){
      e.preventDefault();
      e.stopImmediatePropagation();
      withBlobTransform(mealParts,()=>fn.call(mealBtn,e));
      return;
    }
  }
  const outsourceBtn=e.target?.closest?.('#outsourceExcel');
  if(outsourceBtn){
    const fn=window.downloadOutsourceExcel;
    if(typeof fn==='function'){
      e.preventDefault();
      e.stopImmediatePropagation();
      withBlobTransform(outsourceParts,()=>fn.call(outsourceBtn,e));
    }
  }
},true);
})();
