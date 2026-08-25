(()=>{
'use strict';
if(window.__ZR_ADMIN_EXCEL_RELIABILITY_FIX_V1)return;
window.__ZR_ADMIN_EXCEL_RELIABILITY_FIX_V1=true;

const $=id=>document.getElementById(id);
const NativeBlob=window.Blob;
const MEAL_SPACER='<Row ss:Height="8"><Cell/><Cell/><Cell/><Cell/><Cell/><Cell/><Cell/></Row>';

function withBlobTransform(transform,run){
  const Prev=window.Blob;
  function PatchedBlob(parts,options){return new NativeBlob(transform(Array.from(parts||[])),options)}
  PatchedBlob.prototype=NativeBlob.prototype;
  try{window.Blob=PatchedBlob;return run()}finally{window.Blob=Prev}
}
function mealParts(parts){
  return parts.map(p=>typeof p==='string'?p.split(MEAL_SPACER).join(''):p);
}
function dosStamp(d=new Date()){
  const y=Math.max(1980,Math.min(2107,d.getFullYear()));
  return {time:(d.getHours()<<11)|(d.getMinutes()<<5)|Math.floor(d.getSeconds()/2),date:((y-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate()};
}
function put16(a,i,n){a[i]=n&255;a[i+1]=(n>>>8)&255}
function fixedZipBytes(input){
  if(!(input instanceof Uint8Array))return input;
  const a=new Uint8Array(input),stamp=dosStamp();
  for(let i=0;i+15<a.length;i++){
    if(a[i]!==0x50||a[i+1]!==0x4b)continue;
    if(a[i+2]===0x03&&a[i+3]===0x04){put16(a,i+10,stamp.time);put16(a,i+12,stamp.date);i+=29;continue}
    if(a[i+2]===0x01&&a[i+3]===0x02){put16(a,i+12,stamp.time);put16(a,i+14,stamp.date);i+=45}
  }
  return a;
}
function outsourceParts(parts){return parts.map(fixedZipBytes)}

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
  if(typeof baseMeal==='function'){
    window.downloadMealExcelV3=mealDownload;
    try{downloadMealExcelV3=mealDownload}catch{}
    const b=$('downloadMealExcelV3');if(b)b.onclick=mealDownload;
  }
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
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-tab],#outsourceTabBtn'))setTimeout(bind,30)},false);
bind();
})();
