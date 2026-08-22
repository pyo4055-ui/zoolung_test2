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
  #zr11ActivityToolbar .zr-act-start{grid-column:1/4;grid-row:1;min-width:0;margin:0!important}
  #zr11ActivityToolbar .zr-act-end{grid-column:4/7;grid-row:1;min-width:0;margin:0!important}
  #zr11ActivityToolbar #activityDateBasisWrap{grid-column:7/9;grid-row:1;min-width:0!important;margin:0!important}
  #zr11ActivityToolbar #zrActivityOrgSearchWrap{grid-column:9/13;grid-row:1;min-width:0;margin:0!important}
  #zr11ActivityToolbar #zrActivityOrgSearchHint{grid-column:1/7;grid-row:2;align-self:center;margin:0!important}
  #zr11ActivityToolbar .zr-act-search-btn{grid-column:7/9;grid-row:2}
  #zr11ActivityToolbar .zr-act-today-btn{grid-column:9/11;grid-row:2}
  #zr11ActivityToolbar .zr-act-excel-btn{grid-column:11/13;grid-row:2}
  #zr11ActivityToolbar .zr-act-search-btn,#zr11ActivityToolbar .zr-act-today-btn,#zr11ActivityToolbar .zr-act-excel-btn{width:100%!important;min-width:0!important;height:40px!important;margin:0!important;justify-self:stretch;align-self:end;white-space:nowrap}
  #zr11ActivityToolbar input,#zr11ActivityToolbar select{width:100%!important;min-width:0!important;min-height:40px!important}
  .zr-admin-org-search{display:flex;flex-direction:column;gap:5px;min-width:0;margin:0!important;font-size:12px;font-weight:700}
  .zr-admin-org-search input{width:100%;min-width:0;min-height:40px}
  .zr-admin-search-hint{font-size:11px;font-weight:600;line-height:1.45;color:#748078}
  #tab-outsourcing .zr-outsource-query-grid{display:grid!important;grid-template-columns:minmax(150px,.8fr) minmax(180px,1fr) minmax(180px,1fr) minmax(220px,1.2fr)!important;gap:10px 12px!important;align-items:end}
  #tab-outsourcing .zr-outsource-query-grid>div,#tab-outsourcing .zr-outsource-query-grid>label{min-width:0;margin:0!important}
  #tab-outsourcing .zr-outsource-query-grid input,#tab-outsourcing .zr-outsource-query-grid select{width:100%!important;min-width:0!important;min-height:40px!important}
  #tab-outsourcing #zrOutsourceOrgSearchWrap{min-width:0}
  #tab-outsourcing #zrOutsourceOrgSearchHint{margin:8px 0 0!important}
  #tab-outsourcing .zr-outsource-actions{display:flex!important;justify-content:flex-end!important;align-items:center!important;gap:10px!important;flex-wrap:wrap!important;margin-top:10px!important}
  #tab-outsourcing .zr-outsource-actions button{margin:0!important;min-height:40px!important}
  @media(max-width:900px){
    #zr11ActivityToolbar .zr-act-start{grid-column:1/7;grid-row:1}
    #zr11ActivityToolbar .zr-act-end{grid-column:7/13;grid-row:1}
    #zr11ActivityToolbar #activityDateBasisWrap{grid-column:1/5;grid-row:2}
    #zr11ActivityToolbar #zrActivityOrgSearchWrap{grid-column:5/13;grid-row:2}
    #zr11ActivityToolbar #zrActivityOrgSearchHint{grid-column:1/13;grid-row:3}
    #zr11ActivityToolbar .zr-act-search-btn{grid-column:1/5;grid-row:4}
    #zr11ActivityToolbar .zr-act-today-btn{grid-column:5/9;grid-row:4}
    #zr11ActivityToolbar .zr-act-excel-btn{grid-column:9/13;grid-row:4}
    #tab-outsourcing .zr-outsource-query-grid{grid-template-columns:1fr 1fr!important}
  }
  @media(max-width:560px){
    #zr11ActivityToolbar .zr-act-start{grid-column:1/13;grid-row:1}
    #zr11ActivityToolbar .zr-act-end{grid-column:1/13;grid-row:2}
    #zr11ActivityToolbar #activityDateBasisWrap{grid-column:1/13;grid-row:3}
    #zr11ActivityToolbar #zrActivityOrgSearchWrap{grid-column:1/13;grid-row:4}
    #zr11ActivityToolbar #zrActivityOrgSearchHint{grid-column:1/13;grid-row:5}
    #zr11ActivityToolbar .zr-act-search-btn{grid-column:1/7;grid-row:6}
    #zr11ActivityToolbar .zr-act-today-btn{grid-column:7/13;grid-row:6}
    #zr11ActivityToolbar .zr-act-excel-btn{grid-column:1/13;grid-row:7}
    #tab-outsourcing .zr-outsource-query-grid{grid-template-columns:1fr!important}
    #tab-outsourcing .zr-outsource-actions button{flex:1 1 130px}
  }
  `;document.head.appendChild(s);
}

function getBookingsBinding(){
  let lexical=null;
  try{if(typeof bookings==='function')lexical=bookings}catch{}
  return {win:typeof window.bookings==='function'?window.bookings:null,lexical};
}
function currentBookings(){
  const binding=getBookingsBinding(),source=binding.win||binding.lexical;
  if(typeof source!=='function')return [];
  try{const out=source();return Array.isArray(out)?out:[]}catch{return []}
}
function dateInputs(ids){return ids.map(id=>$(id)).filter(Boolean)}
function withOrgScope(query,dateIds,fn,transform=null){
  const q=norm(query);if(!q||typeof fn!=='function')return fn?.();
  const binding=getBookingsBinding(),source=binding.win||binding.lexical;
  if(typeof source!=='function')return fn();
  let all=[];try{const v=source();all=Array.isArray(v)?v:[]}catch{return fn()}
  let scoped=all.filter(b=>matchesOrg(b,q));
  if(typeof transform==='function')scoped=scoped.map(transform);
  const temp=()=>scoped;
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
function renderBinding(name){
  let lexical=null;
  try{
    if(name==='activity'&&typeof renderActivity==='function')lexical=renderActivity;
    if(name==='outsource'&&typeof renderOutsourcingPayments==='function')lexical=renderOutsourcingPayments;
  }catch{}
  const win=name==='activity'?window.renderActivity:window.renderOutsourcingPayments;
  return {win:typeof win==='function'?win:null,lexical};
}

function activityQuery(){return $('zrActivityOrgSearch')?.value||''}
function outsourceQuery(){return $('zrOutsourceOrgSearch')?.value||''}
function renderActivitySearch(){
  if(typeof activityBaseRender!=='function')return;
  const q=activityQuery();
  return q?withOrgScope(q,['activityStart','activityEnd','activityStartDate','activityEndDate'],activityBaseRender):activityBaseRender();
}
function refreshOutsourcePeopleForSearch(){
  const q=norm(outsourceQuery()),box=$('outsourceKpiPeopleBox');if(!q||!box)return;
  const vendor=$('outsourceVendorFilter')?.value||'';
  const list=currentBookings().filter(b=>{
    if(!matchesOrg(b,q))return false;
    const id=b?.settlement?.vendorId||b?.outsourcingVendorId||'';
    if(!id||id==='self'||(vendor&&id!==vendor))return false;
    return !!b?.settlement?.savedAt;
  });
  const sum=list.reduce((a,b)=>{
    const st=b.settlement||{};
    a.paid+=Math.max(0,Number(st.actualPaidCount||0));
    a.paidChap+=Math.max(0,Number(st.actualPaidChaperone||0));
    a.freeChap+=Math.max(0,Number(st.actualFreeChaperone||0));
    return a;
  },{paid:0,paidChap:0,freeChap:0});
  box.innerHTML=`<span class="help">실제 인원</span><b id="outsourceKpiPeople" style="display:block;margin-top:4px;font-size:14px;line-height:1.55">유료인원 ${sum.paid}명<br>유료인솔자 ${sum.paidChap}명<br>무료 인솔자 ${sum.freeChap}명</b>`;
}
function renderOutsourceSearch(){
  if(typeof outsourceBaseRender!=='function')return;
  const q=outsourceQuery();
  const out=q?withOrgScope(q,['outsourceStart','outsourceEnd'],outsourceBaseRender):outsourceBaseRender();
  if(norm(q)){setTimeout(refreshOutsourcePeopleForSearch,10);setTimeout(refreshOutsourcePeopleForSearch,100)}
  return out;
}
function activityExcelSearch(){
  const fn=window.downloadActivityExcelV11||window.downloadActivityExcelV10||window.downloadActivityExcel;
  if(typeof fn!=='function')return;
  const stripCafeItems=b=>b?.cafe?{...b,cafe:{...b.cafe,items:[]}}:b;
  return withOrgScope(activityQuery(),['activityStart','activityEnd','activityStartDate','activityEndDate'],fn,stripCafeItems);
}

function activityControls(tab){
  const start=$('activityStart')||$('activityStartDate'),end=$('activityEnd')||$('activityEndDate');
  const buttons=[...tab.querySelectorAll('button')];
  const search=buttons.find(b=>(b.textContent||'').trim()==='조회하기');
  const today=buttons.find(b=>(b.textContent||'').trim()==='오늘');
  const excel=buttons.find(b=>(b.textContent||'').includes('엑셀'));
  return {start,end,search,today,excel};
}
function makeActivityToolbar(tab,search){
  let toolbar=$('zr11ActivityToolbar');if(toolbar)return toolbar;
  toolbar=document.createElement('div');toolbar.id='zr11ActivityToolbar';toolbar.className='zr11-activity-toolbar';
  const card=search?.closest('.card')||tab;
  const firstHelp=[...card.querySelectorAll('.help')].find(x=>(x.textContent||'').includes('기준으로 조회'));
  if(firstHelp)firstHelp.insertAdjacentElement('beforebegin',toolbar);else card.prepend(toolbar);
  return toolbar;
}
function hideEmptyLegacyParent(parent,toolbar){
  if(!parent||parent===toolbar||parent.contains(toolbar))return;
  if(!parent.querySelector('input,select,button,textarea'))parent.style.display='none';
}
function ensureActivityUi(){
  const tab=$('tab-activity');if(!tab)return false;
  const {start,end,search,today,excel}=activityControls(tab);if(!start||!end||!search||!today)return false;
  const toolbar=makeActivityToolbar(tab,search);if(!toolbar)return false;
  const sp=start.closest('div'),ep=end.closest('div'),oldParents=new Set([sp?.parentElement,ep?.parentElement,search.parentElement,today.parentElement,excel?.parentElement].filter(Boolean));
  sp?.classList.add('zr-act-start');ep?.classList.add('zr-act-end');
  search.classList.add('zr-act-search-btn');today.classList.add('zr-act-today-btn');excel?.classList.add('zr-act-excel-btn');
  if(sp&&sp.parentElement!==toolbar)toolbar.appendChild(sp);
  if(ep&&ep.parentElement!==toolbar)toolbar.appendChild(ep);
  const basis=$('activityDateBasisWrap');if(basis&&basis.parentElement!==toolbar)toolbar.appendChild(basis);
  if(!$('zrActivityOrgSearchWrap')){
    const wrap=document.createElement('label');wrap.id='zrActivityOrgSearchWrap';wrap.className='zr-admin-org-search';
    wrap.innerHTML='<span>단체명 검색</span><input id="zrActivityOrgSearch" type="search" autocomplete="off" placeholder="단체명 일부 입력">';
    toolbar.appendChild(wrap);
    $('zrActivityOrgSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();renderActivitySearch()}});
  }else if($('zrActivityOrgSearchWrap').parentElement!==toolbar)toolbar.appendChild($('zrActivityOrgSearchWrap'));
  let hint=$('zrActivityOrgSearchHint');
  if(!hint){hint=document.createElement('div');hint.id='zrActivityOrgSearchHint';hint.className='zr-admin-search-hint';hint.textContent='검색어가 있으면 조회 시작일·종료일을 무시합니다. 전체 예약에서 단체명을 찾습니다.';toolbar.appendChild(hint)}
  if(search.parentElement!==toolbar)toolbar.appendChild(search);
  if(today.parentElement!==toolbar)toolbar.appendChild(today);
  if(excel&&excel.parentElement!==toolbar)toolbar.appendChild(excel);
  oldParents.forEach(p=>hideEmptyLegacyParent(p,toolbar));
  if(!today.dataset.zrOrgSearchToday){today.dataset.zrOrgSearchToday='1';today.addEventListener('click',()=>{const q=$('zrActivityOrgSearch');if(q)q.value=''},true)}
  return true;
}
function ensureOutsourceUi(){
  const tab=$('tab-outsourcing'),vendor=$('outsourceVendorFilter'),start=$('outsourceStart'),end=$('outsourceEnd'),search=$('outsourceSearch');
  if(!tab||!vendor||!start||!end||!search)return false;
  const grid=vendor.closest('.grid3')||vendor.parentElement?.parentElement;if(!grid)return false;
  grid.classList.add('zr-outsource-query-grid');
  if(!$('zrOutsourceOrgSearchWrap')){
    const wrap=document.createElement('label');wrap.id='zrOutsourceOrgSearchWrap';wrap.className='zr-admin-org-search';
    wrap.innerHTML='<span>단체명 검색</span><input id="zrOutsourceOrgSearch" type="search" autocomplete="off" placeholder="단체명 일부 입력">';
    grid.appendChild(wrap);
    $('zrOutsourceOrgSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();renderOutsourceSearch()}});
  }
  let hint=$('zrOutsourceOrgSearchHint');
  if(!hint){hint=document.createElement('div');hint.id='zrOutsourceOrgSearchHint';hint.className='zr-admin-search-hint';hint.textContent='검색어가 있으면 방문일 시작·종료를 무시합니다. 업체 조건은 그대로 적용됩니다.';grid.insertAdjacentElement('afterend',hint)}
  const buttons=[...tab.querySelectorAll('button')],excel=buttons.find(b=>(b.textContent||'').includes('엑셀'));
  const actions=search.parentElement;
  if(actions&&actions!==grid){actions.classList.add('zr-outsource-actions');if(excel&&excel.parentElement!==actions)actions.appendChild(excel)}
  if(!vendor.dataset.zrOrgSearchVendor){vendor.dataset.zrOrgSearchVendor='1';vendor.addEventListener('change',()=>{if(norm(outsourceQuery()))setTimeout(renderOutsourceSearch,0)})}
  return true;
}

function installActivity(){
  if(installedActivity)return true;
  if(!window.__ZR_ADMIN_OPS_V10||!ensureActivityUi())return false;
  const binding=renderBinding('activity'),base=binding.win||binding.lexical;if(typeof base!=='function')return false;
  activityBaseRender=base;
  const wrapped=()=>renderActivitySearch();wrapped.__zrOrgSearchV1=true;
  window.renderActivity=wrapped;try{renderActivity=wrapped}catch{}
  installedActivity=true;
  return true;
}
function installOutsource(){
  if(installedOutsource)return true;
  if(!window.__ZR_ADMIN_V9_INSTALLED||!ensureOutsourceUi())return false;
  const binding=renderBinding('outsource'),base=binding.win||binding.lexical;if(typeof base!=='function')return false;
  outsourceBaseRender=base;
  const wrapped=()=>renderOutsourceSearch();wrapped.__zrOrgSearchV1=true;
  window.renderOutsourcingPayments=wrapped;try{renderOutsourcingPayments=wrapped}catch{}
  installedOutsource=true;
  return true;
}
function apply(){injectStyle();ensureActivityUi();ensureOutsourceUi();installActivity();installOutsource()}

function boot(){
  injectStyle();
  const timer=setInterval(()=>{apply();if(installedActivity&&installedOutsource)clearInterval(timer)},250);setTimeout(()=>clearInterval(timer),30000);
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
