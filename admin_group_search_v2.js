(()=>{
'use strict';
if(window.__ZR_ADMIN_GROUP_SEARCH_V2)return;
window.__ZR_ADMIN_GROUP_SEARCH_V2=true;

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v??'').trim().toLocaleLowerCase('ko-KR').replace(/\s+/g,'');
const dateOnly=v=>{const s=String(v||'');const m=s.match(/\d{4}-\d{2}-\d{2}/);return m?m[0]:s.slice(0,10)};
const money=v=>`${Math.round(Number(v||0)).toLocaleString('ko-KR')}원`;
const matchesOrg=(b,q)=>norm(b?.orgName).includes(norm(q));
let activityBaseRender=null;
let outsourceBaseRender=null;
let installedActivity=false;
let installedOutsource=false;

function readBookings(){
  try{
    const list=JSON.parse(localStorage.getItem('zr_bookings')||'[]');
    return Array.isArray(list)?list.filter(b=>b&&!b.__availabilityOnly):[];
  }catch{return []}
}
function activityQuery(){return String($('zrActivityOrgSearch')?.value||'').trim()}
function outsourceQuery(){return String($('zrOutsourceOrgSearch')?.value||'').trim()}

function injectStyle(){
  if($('zrAdminGroupSearchV2Style'))return;
  const s=document.createElement('style');s.id='zrAdminGroupSearchV2Style';s.textContent=`
  #tab-activity #zr11ActivityToolbar{display:grid!important;grid-template-columns:repeat(12,minmax(0,1fr))!important;gap:10px 12px!important;align-items:end!important;margin:12px 0 10px!important}
  #zr11ActivityToolbar .zr-act-start{grid-column:1/4;grid-row:1;min-width:0;margin:0!important}
  #zr11ActivityToolbar .zr-act-end{grid-column:4/7;grid-row:1;min-width:0;margin:0!important}
  #zr11ActivityToolbar #activityDateBasisWrap{grid-column:7/9;grid-row:1;min-width:0!important;margin:0!important}
  #zr11ActivityToolbar #zrActivityOrgSearchWrap{grid-column:9/13;grid-row:1;min-width:0;margin:0!important}
  #zr11ActivityToolbar #zrActivityOrgSearchHint{grid-column:1/7;grid-row:2;align-self:center;margin:0!important}
  #zr11ActivityToolbar .zr-act-search-btn{grid-column:7/9;grid-row:2}
  #zr11ActivityToolbar .zr-act-today-btn{grid-column:9/11;grid-row:2}
  #zr11ActivityToolbar .zr-act-excel-btn{grid-column:11/13;grid-row:2}
  #zr11ActivityToolbar .zr-act-search-btn,#zr11ActivityToolbar .zr-act-today-btn,#zr11ActivityToolbar .zr-act-excel-btn{width:100%!important;min-width:0!important;height:40px!important;margin:0!important;white-space:nowrap}
  #zr11ActivityToolbar input,#zr11ActivityToolbar select{width:100%!important;min-width:0!important;min-height:40px!important}
  #zr11ActivityToolbar .zr-search-ignored{opacity:.5}
  .zr-admin-org-search{display:flex;flex-direction:column;gap:5px;min-width:0;margin:0!important;font-size:12px;font-weight:700}
  .zr-admin-search-hint{font-size:11px;font-weight:650;line-height:1.45;color:#748078}
  .zr-search-result-note{margin:0 0 10px;padding:8px 10px;border:1px solid #dbe8df;border-radius:9px;background:#f5faf7;color:#40604e;font-size:11px;font-weight:750;line-height:1.45}
  #activityList .zr-search-activity-card .detail-grid{margin-top:10px}
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

function activityStatus(b){
  if(b?.status==='cancelled')return {key:'cancelled',text:'취소',cls:'rejected'};
  if(b?.status==='rejected')return {key:'cancelled',text:'거절',cls:'rejected'};
  if(b?.settlement?.savedAt)return {key:'complete',text:'완료',cls:'confirmed'};
  if(b?.status==='pending')return {key:'pending',text:'접수 대기',cls:'pending'};
  return {key:'confirmed',text:'확정',cls:'confirmed'};
}
function mealText(b){
  if(b?.mealType==='lunchbox')return b.mealStart?`도시락 · ${b.mealStart}~${b.mealEnd||''}`:'도시락';
  if(b?.mealType==='cafe')return b.mealStart?`카페 주문 · ${b.mealStart}~${b.mealEnd||''}`:'카페 주문';
  return '식사 없음';
}
function setActivityKpi(label,value){
  const tab=$('tab-activity');if(!tab)return;
  const boxes=[...tab.querySelectorAll('.kpi .box,.activity-kpi .box')];
  const box=boxes.find(x=>{
    const t=String(x.querySelector('.help,span')?.textContent||x.textContent||'').replace(/\s+/g,' ').trim();
    return t.startsWith(label);
  });
  const b=box?.querySelector('b');if(b)b.textContent=`${value}건`;
}
function renderActivityDirect(q){
  const root=$('activityList');if(!root)return;
  const list=readBookings().filter(b=>matchesOrg(b,q)).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
  const counts={total:list.length,confirmed:0,pending:0,cancelled:0,complete:0};
  list.forEach(b=>{counts[activityStatus(b).key]++});
  setActivityKpi('조회 예약',counts.total);setActivityKpi('확정',counts.confirmed);setActivityKpi('접수 대기',counts.pending);setActivityKpi('취소',counts.cancelled);setActivityKpi('완료',counts.complete);
  const note=`<div class="zr-search-result-note">단체명 ‘${esc(q)}’ 검색 결과 ${list.length}건 · 조회 시작일·종료일·조회 기준은 적용하지 않았습니다.</div>`;
  const cards=list.map(b=>{
    const st=activityStatus(b);
    return `<div class="booking-item zr-search-activity-card"><div class="row"><div><b>${esc(b.orgName||'')}</b><div class="help">예약번호 ${esc(b.id||'-')} · 접수 ${esc(dateOnly(b.createdAt)||'-')} · 방문 ${esc(b.date||'-')}</div></div><span class="status ${st.cls}">${st.text}</span></div><div class="detail-grid"><div><b>예약자</b><br>${esc(b.managerName||'-')}<br>${esc(b.contact||'-')}</div><div><b>인원</b><br>유료 ${Number(b.paidCount||0)} / 인솔 ${Number(b.chaperoneCount||0)}</div><div><b>동물원</b><br>${esc(b.entryTime||'--:--')}~${esc(b.exitTime||'--:--')}</div><div><b>식사</b><br>${esc(mealText(b))}</div></div><div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn-soft" onclick="openAdminBookingDetail('${esc(b.id||'')}')">자세히</button></div></div>`;
  }).join('');
  root.innerHTML=note+(cards||`<div class="help">‘${esc(q)}’ 단체명을 포함한 예약이 없습니다.</div>`);
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
  const q=activityQuery();syncActivityIgnoredUi();
  if(!q)return activityBaseRender?.();
  renderActivityDirect(q);
}

function vendorInfo(b){
  const st=b?.settlement||{},snap=st.vendorSnapshot||b?.outsourcingVendorSnapshot||{};
  const id=st.vendorId||b?.outsourcingVendorId||snap.id||'self';
  const name=snap.name||b?.outsourcingVendorSnapshot?.name||(id==='self'?'자체':id);
  return {id,name,snap};
}
function outsourceListForQuery(q){
  const f=$('outsourceVendorFilter')?.value||'';
  return readBookings().filter(b=>{
    if(!(b.status==='confirmed'||b.status==='cancelled'||b.settlement?.savedAt))return false;
    if(!matchesOrg(b,q))return false;
    const v=vendorInfo(b);if(f&&v.id!==f)return false;
    return true;
  }).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.orgName||'').localeCompare(String(b.orgName||''),'ko'));
}
function renderOutsourcePeople(list){
  const fee=$('outsourceKpiFee'),kpi=document.querySelector('#tab-outsourcing .kpi.activity-kpi')||fee?.closest('.kpi');if(!kpi)return;
  let box=$('outsourceKpiPeopleBox');if(!box){box=document.createElement('div');box.className='box';box.id='outsourceKpiPeopleBox';kpi.appendChild(box)}
  const sum=list.filter(b=>b.settlement?.savedAt).reduce((a,b)=>{const st=b.settlement||{};a.paid+=Number(st.actualPaidCount||0);a.paidChap+=Number(st.actualPaidChaperone||0);a.free+=Number(st.actualFreeChaperone||0);return a},{paid:0,paidChap:0,free:0});
  box.innerHTML=`<span class="help">실제 인원</span><b style="display:block;margin-top:4px;font-size:14px;line-height:1.55">유료인원 ${sum.paid}명<br>유료인솔자 ${sum.paidChap}명<br>무료 인솔자 ${sum.free}명</b>`;
}
function renderOutsourceDirect(q){
  const list=outsourceListForQuery(q),done=list.filter(b=>b.settlement?.savedAt);
  const tt=done.reduce((s,b)=>s+Number(b.settlement?.ticketAmount||0),0),tc=done.reduce((s,b)=>s+Number(b.settlement?.actualCafeAmount||0),0),tf=done.reduce((s,b)=>s+Number(b.settlement?.totalFee||0),0);
  if($('outsourceKpiTeams'))$('outsourceKpiTeams').textContent=`${list.length}건 (정산 ${done.length})`;
  if($('outsourceKpiTicket'))$('outsourceKpiTicket').textContent=money(tt);
  if($('outsourceKpiCafe'))$('outsourceKpiCafe').textContent=money(tc);
  if($('outsourceKpiFee'))$('outsourceKpiFee').textContent=money(tf);
  renderOutsourcePeople(list);
  const root=$('outsourceList');if(!root)return;
  const cards=list.map(b=>{
    const v=vendorInfo(b),st=b.settlement,done=!!st?.savedAt,cancelled=b.status==='cancelled';
    const head=`<div class="row"><div><b>${esc(b.orgName||'')}</b><div class="help">접수 ${esc(dateOnly(b.createdAt)||'-')} · 방문 ${esc(b.date||'-')}</div></div><span class="status ${done?'confirmed':'pending'}">${esc(v.name)} · ${done?'실제결제 입력':'실제결제 미입력'}</span></div>`;
    const action=`<div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn-soft" onclick="openAdminBookingDetail('${esc(b.id||'')}')">${done?'결제 수정':'결제 입력'}</button></div>`;
    if(!done)return `<div class="booking-item">${head}<div class="help" style="margin-top:8px">${cancelled?'예약 취소 건입니다.':'실제 인원과 결제금액을 입력하면 매출에 반영됩니다.'}</div>${action}</div>`;
    const snap=st.vendorSnapshot||v.snap||{},isSelf=v.id==='self';
    const tr=isSelf?'수수료 없음':snap.ticketFeeType==='percent'?`${Number(snap.ticketFeeValue||0)}%`:`유료 1인당 ${money(snap.ticketFeeValue||0)}`;
    const cr=isSelf?'수수료 없음':snap.cafeFeeType==='percent'?`${Number(snap.cafeFeeValue||0)}%`:`건당 ${money(snap.cafeFeeValue||0)}`;
    return `<div class="booking-item">${head}<div class="detail-grid"><div><b>실제 인원</b><br>유료 ${Number(st.actualPaidCount||0)} / 무료인솔 ${Number(st.actualFreeChaperone||0)} / 유료인솔 ${Number(st.actualPaidChaperone||0)}</div><div><b>적용 단체가</b><br>${money(st.ticketUnitPrice||0)}</div><div><b>매표 매출</b><br>${money(st.ticketAmount||0)}</div><div><b>매표 수수료</b><br>${money(st.ticketFee||0)}<br><span class="help">${esc(tr)}</span></div><div><b>카페 매출</b><br>${money(st.actualCafeAmount||0)}</div><div><b>카페 수수료</b><br>${money(st.cafeFee||0)}<br><span class="help">${esc(cr)}</span></div></div><div class="calc" style="margin-top:10px"><b>${isSelf?'실제 총매출':'총 수수료 지급액 '+money(st.totalFee||0)+' · 실제 총매출'} ${money(st.totalActualSales||0)}</b>${cancelled?' · 예약취소':''}</div>${action}</div>`;
  }).join('');
  root.innerHTML=`<div class="zr-search-result-note">단체명 ‘${esc(q)}’ 검색 결과 ${list.length}건 · 방문일 시작·종료는 적용하지 않았습니다.</div>`+(cards||`<div class="help">‘${esc(q)}’ 단체명을 포함한 결제대금 예약이 없습니다.</div>`);
}
function renderOutsourceSearch(){
  const q=outsourceQuery();
  if(!q)return outsourceBaseRender?.();
  renderOutsourceDirect(q);
}

function activityControls(tab){
  const start=$('activityStart')||$('activityStartDate'),end=$('activityEnd')||$('activityEndDate');
  const buttons=[...tab.querySelectorAll('button')];
  return {start,end,search:buttons.find(b=>(b.textContent||'').trim()==='조회하기'),today:buttons.find(b=>(b.textContent||'').trim()==='오늘'),excel:buttons.find(b=>(b.textContent||'').includes('엑셀'))};
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
  const toolbar=makeActivityToolbar(tab,search);const oldParents=new Set([start.closest('div')?.parentElement,end.closest('div')?.parentElement,search.parentElement,today.parentElement,excel?.parentElement].filter(Boolean));
  const sp=start.closest('div'),ep=end.closest('div');sp?.classList.add('zr-act-start');ep?.classList.add('zr-act-end');search.classList.add('zr-act-search-btn');today.classList.add('zr-act-today-btn');excel?.classList.add('zr-act-excel-btn');
  [sp,ep,$('activityDateBasisWrap')].forEach(x=>{if(x&&x.parentElement!==toolbar)toolbar.appendChild(x)});
  if(!$('zrActivityOrgSearchWrap')){const wrap=document.createElement('label');wrap.id='zrActivityOrgSearchWrap';wrap.className='zr-admin-org-search';wrap.innerHTML='<span>단체명 검색</span><input id="zrActivityOrgSearch" type="search" autocomplete="off" placeholder="단체명 일부 입력">';toolbar.appendChild(wrap);$('zrActivityOrgSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();renderActivitySearch()}})}
  else if($('zrActivityOrgSearchWrap').parentElement!==toolbar)toolbar.appendChild($('zrActivityOrgSearchWrap'));
  let hint=$('zrActivityOrgSearchHint');if(!hint){hint=document.createElement('div');hint.id='zrActivityOrgSearchHint';hint.className='zr-admin-search-hint';hint.textContent='단체명 검색 중에는 조회 시작일·종료일과 조회 기준을 모두 무시하고 전체 예약에서 찾습니다.';toolbar.appendChild(hint)}
  [search,today,excel].forEach(x=>{if(x&&x.parentElement!==toolbar)toolbar.appendChild(x)});oldParents.forEach(p=>hideEmptyLegacyParent(p,toolbar));
  if(!today.dataset.zrOrgSearchV2){today.dataset.zrOrgSearchV2='1';today.addEventListener('click',()=>{const q=$('zrActivityOrgSearch');if(q)q.value='';setTimeout(()=>{syncActivityIgnoredUi();activityBaseRender?.()},0)},true)}
  return true;
}
function ensureOutsourceUi(){
  const tab=$('tab-outsourcing'),vendor=$('outsourceVendorFilter'),start=$('outsourceStart'),end=$('outsourceEnd'),search=$('outsourceSearch');if(!tab||!vendor||!start||!end||!search)return false;
  const grid=vendor.closest('.grid3')||vendor.parentElement?.parentElement;if(!grid)return false;grid.classList.add('zr-outsource-query-grid');
  if(!$('zrOutsourceOrgSearchWrap')){const wrap=document.createElement('label');wrap.id='zrOutsourceOrgSearchWrap';wrap.className='zr-admin-org-search';wrap.innerHTML='<span>단체명 검색</span><input id="zrOutsourceOrgSearch" type="search" autocomplete="off" placeholder="단체명 일부 입력">';grid.appendChild(wrap);$('zrOutsourceOrgSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();renderOutsourceSearch()}})}
  let hint=$('zrOutsourceOrgSearchHint');if(!hint){hint=document.createElement('div');hint.id='zrOutsourceOrgSearchHint';hint.className='zr-admin-search-hint';hint.textContent='단체명 검색 중에는 방문일 시작·종료를 무시합니다. 업체 조건만 그대로 적용됩니다.';grid.insertAdjacentElement('afterend',hint)}
  const excel=[...tab.querySelectorAll('button')].find(b=>(b.textContent||'').includes('엑셀'));const actions=search.parentElement;if(actions&&actions!==grid){actions.classList.add('zr-outsource-actions');if(excel&&excel.parentElement!==actions)actions.appendChild(excel)}
  if(!vendor.dataset.zrOrgSearchV2){vendor.dataset.zrOrgSearchV2='1';vendor.addEventListener('change',()=>{if(outsourceQuery())renderOutsourceSearch()})}
  return true;
}
function installActivity(){
  if(installedActivity)return true;
  if(!window.__ZR_ADMIN_OPS_V11_PATCH||typeof window.renderActivity!=='function'||!ensureActivityUi())return false;
  activityBaseRender=window.renderActivity;const wrapped=function(){return activityQuery()?renderActivityDirect(activityQuery()):activityBaseRender.apply(this,arguments)};wrapped.__zrOrgSearchV2=true;window.renderActivity=wrapped;try{renderActivity=wrapped}catch{};installedActivity=true;return true;
}
function installOutsource(){
  if(installedOutsource)return true;
  if(!window.__ZR_ADMIN_OPS_V10||typeof window.renderOutsourcingPayments!=='function'||!ensureOutsourceUi())return false;
  outsourceBaseRender=window.renderOutsourcingPayments;const wrapped=function(){return outsourceQuery()?renderOutsourceDirect(outsourceQuery()):outsourceBaseRender.apply(this,arguments)};wrapped.__zrOrgSearchV2=true;window.renderOutsourcingPayments=wrapped;try{renderOutsourcingPayments=wrapped}catch{};installedOutsource=true;return true;
}
function apply(){injectStyle();ensureActivityUi();ensureOutsourceUi();installActivity();installOutsource()}
function boot(){
  injectStyle();const t=setInterval(()=>{apply();if(installedActivity&&installedOutsource)clearInterval(t)},200);setTimeout(()=>clearInterval(t),20000);
  document.addEventListener('click',e=>{const btn=e.target?.closest?.('button');if(!btn)return;if(btn.classList.contains('zr-act-search-btn')&&activityQuery()){e.preventDefault();e.stopImmediatePropagation();renderActivitySearch();return}if(btn.id==='outsourceSearch'&&outsourceQuery()){e.preventDefault();e.stopImmediatePropagation();renderOutsourceSearch()}},true);
  const root=$('adminView')||document.body;new MutationObserver(()=>setTimeout(apply,0)).observe(root,{childList:true,subtree:true});
  document.querySelectorAll('[data-tab],#outsourceTabBtn').forEach(b=>b.addEventListener('click',()=>setTimeout(apply,80)));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
