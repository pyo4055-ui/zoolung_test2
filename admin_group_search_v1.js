(()=>{
'use strict';
if(window.__ZR_ADMIN_GROUP_SEARCH_V1)return;
window.__ZR_ADMIN_GROUP_SEARCH_V1=true;

const $=id=>document.getElementById(id);
const norm=v=>String(v??'').trim().toLocaleLowerCase('ko-KR').replace(/\s+/g,'');
const matchesOrg=(b,q)=>norm(b?.orgName).includes(norm(q));
let activityBaseRender=null;
let outsourceBaseRender=null;
let installedActivity=false;
let installedOutsource=false;

function injectStyle(){
  if($('zrAdminGroupSearchV1Style'))return;
  const s=document.createElement('style');s.id='zrAdminGroupSearchV1Style';s.textContent=`
  #tab-activity #zr11ActivityToolbar{display:grid!important;grid-template-columns:repeat(12,minmax(0,1fr))!important;gap:10px 12px!important;align-items:end!important;margin:12px 0 10px!important}
  #zr11ActivityToolbar .zr-act-start{grid-column:1/4;grid-row:1}
  #zr11ActivityToolbar .zr-act-end{grid-column:4/7;grid-row:1}
  #zr11ActivityToolbar #activityDateBasisWrap{grid-column:7/9;grid-row:1;min-width:0!important}
  #zr11ActivityToolbar #zrActivityOrgSearchWrap{grid-column:9/13;grid-row:1}
  #zr11ActivityToolbar .zr-act-search-btn{grid-column:1/3;grid-row:2;justify-self:start}
  #zr11ActivityToolbar .zr-act-today-btn{grid-column:3/5;grid-row:2;justify-self:start}
  #zr11ActivityToolbar .zr-act-excel-btn{grid-column:5/8;grid-row:2;justify-self:start}
  #zr11ActivityToolbar .zr-act-search-btn,#zr11ActivityToolbar .zr-act-today-btn,#zr11ActivityToolbar .zr-act-excel-btn{width:auto!important;min-width:112px;height:40px!important;margin:0!important}
  #zr11ActivityToolbar .zr-act-excel-btn{min-width:142px}
  .zr-admin-org-search{display:flex;flex-direction:column;gap:5px;min-width:0;margin:0!important;font-size:12px;font-weight:700}
  .zr-admin-org-search input{width:100%;min-width:0;min-height:40px}
  .zr-admin-org-search small{font-size:10px;font-weight:600;line-height:1.25;color:#7a847d}
  #tab-outsourcing .zr-outsource-query-grid{grid-template-columns:minmax(140px,.8fr) minmax(175px,1fr) minmax(175px,1fr) minmax(220px,1.2fr)!important;gap:10px 12px!important;align-items:end}
  #tab-outsourcing #zrOutsourceOrgSearchWrap{min-width:0}
  @media(max-width:900px){
    #tab-activity #zr11ActivityToolbar{grid-template-columns:repeat(12,minmax(0,1fr))!important}
    #zr11ActivityToolbar .zr-act-start{grid-column:1/7;grid-row:1}
    #zr11ActivityToolbar .zr-act-end{grid-column:7/13;grid-row:1}
    #zr11ActivityToolbar #activityDateBasisWrap{grid-column:1/5;grid-row:2}
    #zr11ActivityToolbar #zrActivityOrgSearchWrap{grid-column:5/13;grid-row:2}
    #zr11ActivityToolbar .zr-act-search-btn{grid-column:1/5;grid-row:3}
    #zr11ActivityToolbar .zr-act-today-btn{grid-column:5/9;grid-row:3}
    #zr11ActivityToolbar .zr-act-excel-btn{grid-column:9/13;grid-row:3}
    #zr11ActivityToolbar .zr-act-search-btn,#zr11ActivityToolbar .zr-act-today-btn,#zr11ActivityToolbar .zr-act-excel-btn{width:100%!important;min-width:0}
    #tab-outsourcing .zr-outsource-query-grid{grid-template-columns:1fr 1fr!important}
  }
  @media(max-width:560px){
    #zr11ActivityToolbar .zr-act-start{grid-column:1/13;grid-row:1}
    #zr11ActivityToolbar .zr-act-end{grid-column:1/13;grid-row:2}
    #zr11ActivityToolbar #activityDateBasisWrap{grid-column:1/13;grid-row:3}
    #zr11ActivityToolbar #zrActivityOrgSearchWrap{grid-column:1/13;grid-row:4}
    #zr11ActivityToolbar .zr-act-search-btn{grid-column:1/7;grid-row:5}
    #zr11ActivityToolbar .zr-act-today-btn{grid-column:7/13;grid-row:5}
    #zr11ActivityToolbar .zr-act-excel-btn{grid-column:1/13;grid-row:6}
    #tab-outsourcing .zr-outsource-query-grid{grid-template-columns:1fr!important}
  }
  `;document.head.appendChild(s);
}

function getBookingsBinding(){
  let lexical=null;
  try{if(typeof bookings==='function')lexical=bookings}catch{}
  return {win:typeof window.bookings==='function'?window.bookings:null,lexical};
}
function dateInputs(ids){return ids.map(id=>$(id)).filter(Boolean)}
function withOrgScope(query,dateIds,fn){
  const q=norm(query);if(!q||typeof fn!=='function')return fn?.();
  const binding=getBookingsBinding(),source=binding.win||binding.lexical;
  if(typeof source!=='function')return fn();
  let all=[];try{const v=source();all=Array.isArray(v)?v:[]}catch{return fn()}
  const scoped=all.filter(b=>matchesOrg(b,q)),temp=()=>scoped;
  const dates=dateInputs(dateIds).map(el=>({el,value:el.value}));
  try{
    dates.forEach(x=>x.el.value='');
    window.bookings=temp;
    try{bookings=temp}catch{}
    return fn();
  }finally{
    if(binding.win)window.bookings=binding.win;else try{delete window.bookings}catch{}
    try{if(binding.lexical)bookings=binding.lexical}catch{}
    dates.forEach(x=>x.el.value=x.value);
  }
}

function activityQuery(){return $('zrActivityOrgSearch')?.value||''}
function outsourceQuery(){return $('zrOutsourceOrgSearch')?.value||''}
function renderActivitySearch(){
  if(typeof activityBaseRender!=='function')return;
  const q=activityQuery();
  return q?withOrgScope(q,['activityStart','activityEnd','activityStartDate','activityEndDate'],activityBaseRender):activityBaseRender();
}
function renderOutsourceSearch(){
  if(typeof outsourceBaseRender!=='function')return;
  const q=outsourceQuery();
  return q?withOrgScope(q,['outsourceStart','outsourceEnd'],outsourceBaseRender):outsourceBaseRender();
}
function activityExcelSearch(){
  const fn=window.downloadActivityExcelV11||window.downloadActivityExcelV10||window.downloadActivityExcel;
  if(typeof fn!=='function')return;
  return withOrgScope(activityQuery(),['activityStart','activityEnd','activityStartDate','activityEndDate'],fn);
}

function markActivityControls(tab,toolbar){
  const start=$('activityStart')||$('activityStartDate'),end=$('activityEnd')||$('activityEndDate');
  start?.closest('div')?.classList.add('zr-act-start');
  end?.closest('div')?.classList.add('zr-act-end');
  const buttons=[...tab.querySelectorAll('button')];
  buttons.find(b=>(b.textContent||'').trim()==='조회하기')?.classList.add('zr-act-search-btn');
  buttons.find(b=>(b.textContent||'').trim()==='오늘')?.classList.add('zr-act-today-btn');
  buttons.find(b=>(b.textContent||'').includes('엑셀'))?.classList.add('zr-act-excel-btn');
  return {start,end,buttons};
}
function ensureActivityUi(){
  const tab=$('tab-activity'),toolbar=$('zr11ActivityToolbar');if(!tab||!toolbar)return false;
  const {buttons}=markActivityControls(tab,toolbar);
  if(!$('zrActivityOrgSearchWrap')){
    const wrap=document.createElement('label');wrap.id='zrActivityOrgSearchWrap';wrap.className='zr-admin-org-search';
    wrap.innerHTML='<span>단체명 검색</span><input id="zrActivityOrgSearch" type="search" autocomplete="off" placeholder="단체명 일부 입력"><small>검색어가 있으면 조회 시작일·종료일을 무시합니다.</small>';
    toolbar.appendChild(wrap);
    $('zrActivityOrgSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();renderActivitySearch()}});
  }
  const search=buttons.find(b=>(b.textContent||'').trim()==='조회하기');
  const today=buttons.find(b=>(b.textContent||'').trim()==='오늘');
  const excel=buttons.find(b=>(b.textContent||'').includes('엑셀'));
  if(search&&!search.dataset.zrOrgSearchCapture){search.dataset.zrOrgSearchCapture='1'}
  if(today&&!today.dataset.zrOrgSearchToday){today.dataset.zrOrgSearchToday='1';today.addEventListener('click',()=>{const q=$('zrActivityOrgSearch');if(q)q.value=''},true)}
  if(excel&&!excel.dataset.zrOrgSearchExcel){excel.dataset.zrOrgSearchExcel='1'}
  return true;
}
function ensureOutsourceUi(){
  const tab=$('tab-outsourcing'),vendor=$('outsourceVendorFilter'),start=$('outsourceStart'),end=$('outsourceEnd'),search=$('outsourceSearch');
  if(!tab||!vendor||!start||!end||!search)return false;
  const grid=vendor.closest('.grid3')||vendor.parentElement?.parentElement;grid?.classList.add('zr-outsource-query-grid');
  if(!$('zrOutsourceOrgSearchWrap')){
    const wrap=document.createElement('label');wrap.id='zrOutsourceOrgSearchWrap';wrap.className='zr-admin-org-search';
    wrap.innerHTML='<span>단체명 검색</span><input id="zrOutsourceOrgSearch" type="search" autocomplete="off" placeholder="단체명 일부 입력"><small>검색어가 있으면 방문일 시작·종료를 무시합니다.</small>';
    grid?.appendChild(wrap);
    $('zrOutsourceOrgSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();renderOutsourceSearch()}});
  }
  if(!vendor.dataset.zrOrgSearchVendor){vendor.dataset.zrOrgSearchVendor='1';vendor.addEventListener('change',()=>{if(norm(outsourceQuery()))setTimeout(renderOutsourceSearch,0)})}
  return true;
}

function installActivity(){
  if(installedActivity)return true;
  if(!window.__ZR_ADMIN_OPS_V11_PATCH||typeof window.renderActivity!=='function'||!ensureActivityUi())return false;
  activityBaseRender=window.renderActivity;
  const wrapped=()=>renderActivitySearch();wrapped.__zrOrgSearchV1=true;
  window.renderActivity=wrapped;try{renderActivity=wrapped}catch{}
  installedActivity=true;
  return true;
}
function installOutsource(){
  if(installedOutsource)return true;
  if(!window.__ZR_ADMIN_OPS_V11_PATCH||typeof window.renderOutsourcingPayments!=='function'||!ensureOutsourceUi())return false;
  outsourceBaseRender=window.renderOutsourcingPayments;
  const wrapped=()=>renderOutsourceSearch();wrapped.__zrOrgSearchV1=true;
  window.renderOutsourcingPayments=wrapped;try{renderOutsourcingPayments=wrapped}catch{}
  installedOutsource=true;
  return true;
}
function apply(){injectStyle();ensureActivityUi();ensureOutsourceUi();installActivity();installOutsource()}

function boot(){
  injectStyle();
  const timer=setInterval(()=>{apply();if(installedActivity&&installedOutsource)clearInterval(timer)},250);setTimeout(()=>clearInterval(timer),20000);
  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('button');if(!btn)return;
    if(btn.classList.contains('zr-act-search-btn')&&norm(activityQuery())){
      e.preventDefault();e.stopImmediatePropagation();renderActivitySearch();return;
    }
    if(btn.classList.contains('zr-act-excel-btn')&&norm(activityQuery())){
      e.preventDefault();e.stopImmediatePropagation();activityExcelSearch();return;
    }
    if(btn.id==='outsourceSearch'&&norm(outsourceQuery())){
      e.preventDefault();e.stopImmediatePropagation();renderOutsourceSearch();
    }
  },true);
  const root=$('adminView')||document.body;
  new MutationObserver(()=>setTimeout(apply,0)).observe(root,{childList:true,subtree:true});
  document.querySelectorAll('[data-tab],#outsourceTabBtn').forEach(b=>b.addEventListener('click',()=>setTimeout(apply,80)));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
