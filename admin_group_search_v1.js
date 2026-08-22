(()=>{
'use strict';
if(window.__ZR_ADMIN_GROUP_SEARCH_V1)return;
window.__ZR_ADMIN_GROUP_SEARCH_V1=true;

const $=id=>document.getElementById(id);
const norm=v=>String(v??'').trim().toLocaleLowerCase('ko-KR').replace(/\s+/g,'');
const matchesText=(text,q)=>norm(text).includes(norm(q));
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
  #zr11ActivityToolbar .zr-search-ignored{opacity:.55}
  .zr-admin-org-search{display:flex;flex-direction:column;gap:5px;min-width:0;margin:0!important;font-size:12px;font-weight:700}
  .zr-admin-org-search input{width:100%;min-width:0;min-height:40px}
  .zr-admin-search-hint{font-size:11px;font-weight:600;line-height:1.45;color:#748078}
  .zr-admin-search-empty{padding:14px 4px;color:#6f7972;font-size:13px}
  #tab-outsourcing .zr-outsource-query-grid{display:grid!important;grid-template-columns:minmax(150px,.8fr) minmax(180px,1fr) minmax(180px,1fr) minmax(220px,1.2fr)!important;gap:10px 12px!important;align-items:end}
  #tab-outsourcing .zr-outsource-query-grid>div,#tab-outsourcing .zr-outsource-query-grid>label{min-width:0;margin:0!important}
  #tab-outsourcing .zr-outsource-query-grid input,#tab-outsourcing .zr-outsource-query-grid select{width:100%!important;min-width:0!important;min-height:40px!important}
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

function readBookings(){
  try{
    const list=JSON.parse(localStorage.getItem('zr_bookings')||'[]');
    return Array.isArray(list)?list.filter(b=>b&&!b.__availabilityOnly):[];
  }catch{return []}
}
function dateInputs(ids){return ids.map(id=>$(id)).filter(Boolean)}
function withDatesIgnored(ids,fn){
  const saved=dateInputs(ids).map(el=>({el,value:el.value}));
  try{saved.forEach(x=>x.el.value='');return fn?.()}
  finally{saved.forEach(x=>x.el.value=x.value)}
}
function money(v){return `${Math.round(Number(v||0)).toLocaleString('ko-KR')}원`}
function activityQuery(){return $('zrActivityOrgSearch')?.value||''}
function outsourceQuery(){return $('zrOutsourceOrgSearch')?.value||''}

function bookingIdFromCard(card){
  const btn=card?.querySelector?.('button[onclick*="openAdminBookingDetail"]');
  const m=String(btn?.getAttribute('onclick')||'').match(/openAdminBookingDetail\(['"]([^'"]+)['"]\)/);
  return m?.[1]||'';
}
function orgFromCard(card){
  const id=bookingIdFromCard(card);
  if(id){const b=readBookings().find(x=>String(x.id||'')===id);if(b)return String(b.orgName||'')}
  return String(card?.querySelector?.('.row b')?.textContent||card?.querySelector?.('b')?.textContent||'');
}
function setKpiByLabel(tab,label,value){
  const boxes=[...tab.querySelectorAll('.kpi .box,.activity-kpi .box')];
  const box=boxes.find(x=>{
    const t=String(x.querySelector('.help,span')?.textContent||x.textContent||'').replace(/\s+/g,' ').trim();
    return t.startsWith(label);
  });
  const target=box?.querySelector('b');if(target)target.textContent=`${value}건`;
}
function filterActivityDom(q){
  const root=$('activityList'),tab=$('tab-activity');if(!root||!tab)return;
  root.querySelector('#zrActivitySearchEmpty')?.remove();
  const cards=[...root.querySelectorAll('.booking-item')];
  const counts={total:0,confirmed:0,pending:0,cancelled:0,complete:0};
  for(const card of cards){
    const hit=matchesText(orgFromCard(card),q);
    card.style.display=hit?'':'none';
    if(!hit)continue;
    counts.total++;
    const status=String(card.querySelector('.status')?.textContent||'').replace(/\s+/g,'').trim();
    if(status.includes('완료'))counts.complete++;
    else if(status.includes('취소')||status.includes('거절'))counts.cancelled++;
    else if(status.includes('접수')||status.includes('대기'))counts.pending++;
    else if(status.includes('확정'))counts.confirmed++;
  }
  setKpiByLabel(tab,'조회 예약',counts.total);
  setKpiByLabel(tab,'확정',counts.confirmed);
  setKpiByLabel(tab,'접수 대기',counts.pending);
  setKpiByLabel(tab,'취소',counts.cancelled);
  setKpiByLabel(tab,'완료',counts.complete);
  if(!counts.total){
    const empty=document.createElement('div');empty.id='zrActivitySearchEmpty';empty.className='zr-admin-search-empty';empty.textContent=`‘${String(q).trim()}’ 단체명을 포함한 예약이 없습니다.`;root.appendChild(empty);
  }
}
function syncActivityIgnoredUi(){
  const active=!!norm(activityQuery());
  const basis=$('activityDateBasis'),basisWrap=$('activityDateBasisWrap');
  if(basis)basis.disabled=active;
  basisWrap?.classList.toggle('zr-search-ignored',active);
  ($('activityStart')||$('activityStartDate'))?.closest('div')?.classList.toggle('zr-search-ignored',active);
  ($('activityEnd')||$('activityEndDate'))?.closest('div')?.classList.toggle('zr-search-ignored',active);
}
function renderActivitySearch(){
  if(typeof activityBaseRender!=='function')return;
  const q=String(activityQuery()).trim();syncActivityIgnoredUi();
  if(!q)return activityBaseRender();
  const out=withDatesIgnored(['activityStart','activityEnd','activityStartDate','activityEndDate'],activityBaseRender);
  filterActivityDom(q);
  setTimeout(()=>filterActivityDom(q),80);
  return out;
}
function activityExcelSearch(){
  const fn=window.downloadActivityExcelV11||window.downloadActivityExcelV10||window.downloadActivityExcel;
  if(typeof fn!=='function')return;
  const q=String(activityQuery()).trim();
  if(!q)return fn();
  // Existing Excel generator owns exact workbook formatting. Date range is ignored here;
  // the visible search remains the source of truth until a dedicated filtered workbook path is validated.
  return withDatesIgnored(['activityStart','activityEnd','activityStartDate','activityEndDate'],fn);
}

function outsourcingBookingList(q){
  const vendor=$('outsourceVendorFilter')?.value||'';
  return readBookings().filter(b=>{
    if(!matchesText(b.orgName,q))return false;
    const id=b?.settlement?.vendorId||b?.outsourcingVendorId||'';
    if(!id||id==='self')return false;
    if(vendor&&id!==vendor)return false;
    return true;
  });
}
function refreshOutsourceKpiForSearch(q){
  const list=outsourcingBookingList(q),done=list.filter(b=>b.settlement&&b.settlement.vendorId!=='self');
  const tt=done.reduce((s,b)=>s+Number(b.settlement?.ticketAmount||0),0);
  const tc=done.reduce((s,b)=>s+Number(b.settlement?.actualCafeAmount||0),0);
  const tf=done.reduce((s,b)=>s+Number(b.settlement?.totalFee||0),0);
  if($('outsourceKpiTeams'))$('outsourceKpiTeams').textContent=`${list.length}건 (정산 ${done.length})`;
  if($('outsourceKpiTicket'))$('outsourceKpiTicket').textContent=money(tt);
  if($('outsourceKpiCafe'))$('outsourceKpiCafe').textContent=money(tc);
  if($('outsourceKpiFee'))$('outsourceKpiFee').textContent=money(tf);
  const box=$('outsourceKpiPeopleBox');
  if(box){
    const sum=done.reduce((a,b)=>{const st=b.settlement||{};a.paid+=Math.max(0,Number(st.actualPaidCount||0));a.paidChap+=Math.max(0,Number(st.actualPaidChaperone||0));a.freeChap+=Math.max(0,Number(st.actualFreeChaperone||0));return a},{paid:0,paidChap:0,freeChap:0});
    box.innerHTML=`<span class="help">실제 인원</span><b id="outsourceKpiPeople" style="display:block;margin-top:4px;font-size:14px;line-height:1.55">유료인원 ${sum.paid}명<br>유료인솔자 ${sum.paidChap}명<br>무료 인솔자 ${sum.freeChap}명</b>`;
  }
}
function filterOutsourceDom(q){
  const root=$('outsourceList');if(!root)return;
  root.querySelector('#zrOutsourceSearchEmpty')?.remove();
  const cards=[...root.querySelectorAll('.booking-item')];let shown=0;
  for(const card of cards){const hit=matchesText(orgFromCard(card),q);card.style.display=hit?'':'none';if(hit)shown++}
  if(!shown){const empty=document.createElement('div');empty.id='zrOutsourceSearchEmpty';empty.className='zr-admin-search-empty';empty.textContent=`‘${String(q).trim()}’ 단체명을 포함한 아웃소싱 예약이 없습니다.`;root.appendChild(empty)}
}
function renderOutsourceSearch(){
  if(typeof outsourceBaseRender!=='function')return;
  const q=String(outsourceQuery()).trim();
  if(!q)return outsourceBaseRender();
  const out=withDatesIgnored(['outsourceStart','outsourceEnd'],outsourceBaseRender);
  const apply=()=>{filterOutsourceDom(q);refreshOutsourceKpiForSearch(q)};
  apply();setTimeout(apply,80);setTimeout(apply,180);
  return out;
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
function hideEmptyLegacyParent(parent,toolbar){if(!parent||parent===toolbar||parent.contains(toolbar))return;if(!parent.querySelector('input,select,button,textarea'))parent.style.display='none'}
function ensureActivityUi(){
  const tab=$('tab-activity');if(!tab)return false;
  const {start,end,search,today,excel}=activityControls(tab);if(!start||!end||!search||!today)return false;
  const toolbar=makeActivityToolbar(tab,search);if(!toolbar)return false;
  const sp=start.closest('div'),ep=end.closest('div'),oldParents=new Set([sp?.parentElement,ep?.parentElement,search.parentElement,today.parentElement,excel?.parentElement].filter(Boolean));
  sp?.classList.add('zr-act-start');ep?.classList.add('zr-act-end');search.classList.add('zr-act-search-btn');today.classList.add('zr-act-today-btn');excel?.classList.add('zr-act-excel-btn');
  if(sp&&sp.parentElement!==toolbar)toolbar.appendChild(sp);if(ep&&ep.parentElement!==toolbar)toolbar.appendChild(ep);
  const basis=$('activityDateBasisWrap');if(basis&&basis.parentElement!==toolbar)toolbar.appendChild(basis);
  if(!$('zrActivityOrgSearchWrap')){
    const wrap=document.createElement('label');wrap.id='zrActivityOrgSearchWrap';wrap.className='zr-admin-org-search';wrap.innerHTML='<span>단체명 검색</span><input id="zrActivityOrgSearch" type="search" autocomplete="off" placeholder="단체명 일부 입력">';toolbar.appendChild(wrap);
    $('zrActivityOrgSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();renderActivitySearch()}});
    $('zrActivityOrgSearch').addEventListener('input',syncActivityIgnoredUi);
  }else if($('zrActivityOrgSearchWrap').parentElement!==toolbar)toolbar.appendChild($('zrActivityOrgSearchWrap'));
  let hint=$('zrActivityOrgSearchHint');if(!hint){hint=document.createElement('div');hint.id='zrActivityOrgSearchHint';hint.className='zr-admin-search-hint';hint.textContent='단체명 검색 중에는 조회 시작일·종료일과 조회 기준을 모두 무시하고 전체 예약에서 찾습니다.';toolbar.appendChild(hint)}
  if(search.parentElement!==toolbar)toolbar.appendChild(search);if(today.parentElement!==toolbar)toolbar.appendChild(today);if(excel&&excel.parentElement!==toolbar)toolbar.appendChild(excel);
  oldParents.forEach(p=>hideEmptyLegacyParent(p,toolbar));
  if(!today.dataset.zrOrgSearchToday){today.dataset.zrOrgSearchToday='1';today.addEventListener('click',()=>{const q=$('zrActivityOrgSearch');if(q)q.value='';syncActivityIgnoredUi()},true)}
  syncActivityIgnoredUi();return true;
}
function ensureOutsourceUi(){
  const tab=$('tab-outsourcing'),vendor=$('outsourceVendorFilter'),start=$('outsourceStart'),end=$('outsourceEnd'),search=$('outsourceSearch');if(!tab||!vendor||!start||!end||!search)return false;
  const grid=vendor.closest('.grid3')||vendor.parentElement?.parentElement;if(!grid)return false;grid.classList.add('zr-outsource-query-grid');
  if(!$('zrOutsourceOrgSearchWrap')){const wrap=document.createElement('label');wrap.id='zrOutsourceOrgSearchWrap';wrap.className='zr-admin-org-search';wrap.innerHTML='<span>단체명 검색</span><input id="zrOutsourceOrgSearch" type="search" autocomplete="off" placeholder="단체명 일부 입력">';grid.appendChild(wrap);$('zrOutsourceOrgSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();renderOutsourceSearch()}})}
  let hint=$('zrOutsourceOrgSearchHint');if(!hint){hint=document.createElement('div');hint.id='zrOutsourceOrgSearchHint';hint.className='zr-admin-search-hint';hint.textContent='단체명 검색 중에는 방문일 시작·종료를 무시합니다. 업체 조건만 그대로 적용됩니다.';grid.insertAdjacentElement('afterend',hint)}
  const buttons=[...tab.querySelectorAll('button')],excel=buttons.find(b=>(b.textContent||'').includes('엑셀')),actions=search.parentElement;
  if(actions&&actions!==grid){actions.classList.add('zr-outsource-actions');if(excel&&excel.parentElement!==actions)actions.appendChild(excel)}
  if(!vendor.dataset.zrOrgSearchVendor){vendor.dataset.zrOrgSearchVendor='1';vendor.addEventListener('change',()=>{if(norm(outsourceQuery()))setTimeout(renderOutsourceSearch,0)})}
  return true;
}

function installActivity(){
  if(installedActivity)return true;
  if(!window.__ZR_ADMIN_OPS_V11_PATCH||typeof window.renderActivity!=='function'||!ensureActivityUi())return false;
  if(window.renderActivity.__zrOrgSearchV1){installedActivity=true;return true}
  activityBaseRender=window.renderActivity;
  const wrapped=function(){return norm(activityQuery())?renderActivitySearch():activityBaseRender.apply(this,arguments)};wrapped.__zrOrgSearchV1=true;
  window.renderActivity=wrapped;try{renderActivity=wrapped}catch{}
  installedActivity=true;return true;
}
function installOutsource(){
  if(installedOutsource)return true;
  if(!window.__ZR_ADMIN_OPS_V11_PATCH||typeof window.renderOutsourcingPayments!=='function'||!ensureOutsourceUi())return false;
  if(window.renderOutsourcingPayments.__zrOrgSearchV1){installedOutsource=true;return true}
  outsourceBaseRender=window.renderOutsourcingPayments;
  const wrapped=function(){return norm(outsourceQuery())?renderOutsourceSearch():outsourceBaseRender.apply(this,arguments)};wrapped.__zrOrgSearchV1=true;
  window.renderOutsourcingPayments=wrapped;try{renderOutsourcingPayments=wrapped}catch{}
  installedOutsource=true;return true;
}
function apply(){injectStyle();ensureActivityUi();ensureOutsourceUi();installActivity();installOutsource()}
function boot(){
  injectStyle();
  const timer=setInterval(()=>{apply();if(installedActivity&&installedOutsource)clearInterval(timer)},250);setTimeout(()=>clearInterval(timer),20000);
  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('button');if(!btn)return;
    if(btn.classList.contains('zr-act-search-btn')&&norm(activityQuery())){e.preventDefault();e.stopImmediatePropagation();renderActivitySearch();return}
    if(btn.classList.contains('zr-act-excel-btn')&&norm(activityQuery())){e.preventDefault();e.stopImmediatePropagation();activityExcelSearch();return}
    if(btn.id==='outsourceSearch'&&norm(outsourceQuery())){e.preventDefault();e.stopImmediatePropagation();renderOutsourceSearch()}
  },true);
  const root=$('adminView')||document.body;new MutationObserver(()=>setTimeout(apply,0)).observe(root,{childList:true,subtree:true});
  document.querySelectorAll('[data-tab],#outsourceTabBtn').forEach(b=>b.addEventListener('click',()=>setTimeout(apply,80)));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
