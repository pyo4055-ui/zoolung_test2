(()=>{
'use strict';
if(window.__ZR_ADMIN_OPS_V11_PATCH)return;
window.__ZR_ADMIN_OPS_V11_PATCH=true;
const $=id=>document.getElementById(id);
let arranging=false;
function injectStyle(){
 if($('zrOpsV11Style'))return;
 const s=document.createElement('style');s.id='zrOpsV11Style';s.textContent=`
 #tab-activity .zr11-activity-toolbar{display:grid;grid-template-columns:230px 230px 122px auto auto auto;gap:10px;align-items:end;margin-top:10px;margin-bottom:10px}
 #tab-activity .zr11-activity-toolbar>div,#tab-activity .zr11-activity-toolbar>label{min-width:0;margin:0!important}
 #tab-activity .zr11-activity-toolbar input,#tab-activity .zr11-activity-toolbar select{width:100%!important;min-width:0!important}
 #tab-activity .zr11-activity-toolbar button{height:40px;white-space:nowrap;align-self:end}
 #tab-outsourcing.zr-outsourcing-preparing{visibility:hidden!important}
 @media(max-width:900px){#tab-activity .zr11-activity-toolbar{grid-template-columns:1fr 1fr 122px auto}}
 @media(max-width:620px){#tab-activity .zr11-activity-toolbar{grid-template-columns:1fr 1fr}#tab-activity .zr11-activity-toolbar button{width:100%}}
 `;document.head.appendChild(s);
}
function arrangeActivityToolbar(){
 if(arranging)return;arranging=true;
 try{
  const tab=$('tab-activity'),start=$('activityStart'),end=$('activityEnd'),basis=$('activityDateBasisWrap');if(!tab||!start||!end||!basis)return;
  const search=[...tab.querySelectorAll('button')].find(b=>(b.textContent||'').trim()==='조회하기');
  const excel=[...tab.querySelectorAll('button')].find(b=>(b.textContent||'').includes('엑셀'));
  const today=[...tab.querySelectorAll('button')].find(b=>(b.textContent||'').trim()==='오늘');
  if(!search||!excel||!today)return;
  let row=$('zr11ActivityToolbar');
  if(!row){row=document.createElement('div');row.id='zr11ActivityToolbar';row.className='zr11-activity-toolbar';const card=search.closest('.card')||tab;const firstHelp=[...card.querySelectorAll('.help')].find(x=>(x.textContent||'').includes('기준으로 조회'));if(firstHelp)firstHelp.insertAdjacentElement('beforebegin',row);else card.prepend(row)}
  const sp=start.closest('div'),ep=end.closest('div');
  [sp,ep,basis,search,excel,today].forEach(x=>{if(x&&x.parentElement!==row)row.appendChild(x)});
 }finally{arranging=false}
}
function stripCafeItemsDuring(fn){
 if(typeof fn!=='function')return;
 const key='zr_bookings',raw=localStorage.getItem(key);
 if(raw==null)return fn();
 let list;try{list=JSON.parse(raw)}catch{return fn()}
 const modified=Array.isArray(list)?list.map(b=>{const x={...b};if(b?.cafe)x.cafe={...b.cafe,items:[]};return x}):list;
 try{localStorage.setItem(key,JSON.stringify(modified));return fn()}
 finally{localStorage.setItem(key,raw)}
}
function hookExcel(){
 const v10=window.downloadActivityExcelV10;if(typeof v10!=='function')return false;
 if(window.downloadActivityExcelV11)return true;
 const v11=()=>stripCafeItemsDuring(v10);
 window.downloadActivityExcelV11=v11;window.downloadActivityExcel=v11;try{downloadActivityExcel=v11}catch{}
 return true;
}
function bindExcelButtons(){
 const tab=$('tab-activity');if(!tab||!hookExcel())return;
 [...tab.querySelectorAll('button')].filter(b=>(b.textContent||'').includes('엑셀')).forEach(b=>b.onclick=window.downloadActivityExcelV11);
}
function bindOutsourceNoFlash(){
 const btn=$('outsourceTabBtn'),tab=$('tab-outsourcing');
 if(!btn||!tab||btn.dataset.zrOutsourceNoFlash==='1')return false;
 btn.dataset.zrOutsourceNoFlash='1';
 btn.addEventListener('click',()=>{
  /* Legacy outsourcing paints a temporary 0-count empty state first, then V10
     replaces it with the real data. Keep that intermediate frame invisible. */
  tab.classList.add('zr-outsourcing-preparing');
  requestAnimationFrame(()=>{
   try{$('outsourceSearch')?.click()}catch{}
   setTimeout(()=>tab.classList.remove('zr-outsourcing-preparing'),70);
  });
 },true);
 return true;
}
function apply(){injectStyle();arrangeActivityToolbar();bindExcelButtons();bindOutsourceNoFlash()}
function boot(){
 const t=setInterval(()=>{apply();if($('tab-activity')&&$('activityDateBasisWrap')&&$('outsourceTabBtn'))clearInterval(t)},250);setTimeout(()=>clearInterval(t),15000);
 const root=$('adminView')||document.body;new MutationObserver(()=>setTimeout(apply,0)).observe(root,{childList:true,subtree:true});
 document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>setTimeout(apply,80)));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
