(()=>{
'use strict';
if(window.__ZR_ADMIN_ACTIVITY_FILTER_FIX_V1)return;
window.__ZR_ADMIN_ACTIVITY_FILTER_FIX_V1=true;

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').trim().toLocaleLowerCase('ko-KR').replace(/\s+/g,'');
const ACTIVITY_BASIS_KEY='zr_activity_date_basis_v10';
const VENDOR_COLOR_KEY='zr_vendor_colors';
const SELF_COLOR='#ECEFF1';
let installed=false;
let applied=null;

const startControl=()=>$('activityStart')||$('activityStartDate');
const endControl=()=>$('activityEnd')||$('activityEndDate');

function readBookings(){
  try{
    const list=typeof window.bookings==='function'?window.bookings():(typeof bookings==='function'?bookings():[]);
    return Array.isArray(list)?list.filter(b=>b&&!b.__availabilityOnly):[];
  }catch{return []}
}
function seoulDate(value){
  const raw=String(value||'').trim();if(!raw)return '';
  if(/^\d{4}-\d{2}-\d{2}$/.test(raw))return raw;
  const d=new Date(raw);
  if(Number.isFinite(d.getTime())){
    try{
      const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
      const get=t=>parts.find(x=>x.type===t)?.value||'';
      const y=get('year'),m=get('month'),day=get('day');
      if(y&&m&&day)return `${y}-${m}-${day}`;
    }catch{}
  }
  const m=raw.match(/\d{4}-\d{2}-\d{2}/);return m?m[0]:'';
}
function todaySeoul(){return seoulDate(new Date().toISOString())}
function controlBasis(){return $('activityDateBasis')?.value==='reservation'?'reservation':'reception'}
function readControls(){return {start:startControl()?.value||'',end:endControl()?.value||'',mode:controlBasis()}}
function validateState(s){return !(s.start&&s.end&&s.start>s.end)}
function keyFor(b,mode){return mode==='reservation'?String(b?.date||''):seoulDate(b?.createdAt)}
function filterByState(state){
  const s=state||readControls();
  return readBookings().filter(b=>{
    const key=keyFor(b,s.mode);if(!key)return false;
    if(s.start&&key<s.start)return false;
    if(s.end&&key>s.end)return false;
    return true;
  }).sort((a,b)=>{
    const ak=keyFor(a,s.mode),bk=keyFor(b,s.mode);
    return bk.localeCompare(ak)||String(b.createdAt||'').localeCompare(String(a.createdAt||''));
  });
}
function isSettled(b){return !!(b?.status==='confirmed'&&b?.settlement?.savedAt)}
function statusBadge(b){
  if(isSettled(b))return '<span class="status zr4-complete">정산완료</span>';
  if(b?.status==='pending')return '<span class="status pending">접수 대기</span>';
  if(b?.status==='confirmed')return '<span class="status confirmed">예약 확정</span>';
  if(b?.status==='cancelled')return '<span class="status rejected">예약 취소</span>';
  if(b?.status==='rejected')return '<span class="status rejected">예약 거절</span>';
  return `<span class="status">${esc(b?.status||'-')}</span>`;
}
function vendorColors(){try{const x=JSON.parse(localStorage.getItem(VENDOR_COLOR_KEY)||'{}');return x&&typeof x==='object'?x:{}}catch{return {}}}
function vendorInfo(b){
  const st=b?.settlement||{},snap=st.vendorSnapshot||b?.outsourcingVendorSnapshot||{};
  const id=st.vendorId||b?.outsourcingVendorId||snap.id||'self';
  if(id==='self')return {id,name:'자체',color:SELF_COLOR};
  let current=null;try{current=(settings().outsourcingVendors||[]).find(v=>v.id===id)||null}catch{}
  return {id,name:snap.name||current?.name||id,color:vendorColors()[id]||'#E8ECEF'};
}
function vendorBadge(b){const v=vendorInfo(b);return `<span class="status zr4-vendor" style="background:${esc(v.color)};border-color:${esc(v.color)};color:#25312a">${esc(v.name)}</span>`}
function dateTime(v){try{return typeof dateTimeText==='function'?dateTimeText(v):String(v||'-')}catch{return String(v||'-')}}
function moneyText(v){try{return typeof money==='function'?money(v):`${Math.round(Number(v||0)).toLocaleString('ko-KR')}원`}catch{return `${Math.round(Number(v||0)).toLocaleString('ko-KR')}원`}}
function cancelSource(b){try{return typeof cancellationSourceText==='function'?cancellationSourceText(b):'취소'}catch{return '취소'}}
function setKpis(list){
  const settled=list.filter(isSettled).length;
  const set=(id,n)=>{const el=$(id);if(el)el.textContent=`${n}건`};
  set('activityKpiTotal',list.length);
  set('activityKpiConfirmed',list.filter(b=>b.status==='confirmed'&&!isSettled(b)).length);
  set('activityKpiPending',list.filter(b=>b.status==='pending').length);
  set('activityKpiCancelled',list.filter(b=>b.status==='cancelled'||b.status==='rejected').length);
  set('activityKpiCompleted',settled);
}
function bookingCard(b){
  const st=b.settlement||{};
  return `<div class="booking-item">
    <div class="zr4-badges">${statusBadge(b)}${vendorBadge(b)}</div>
    <div class="row" style="margin-top:7px"><div><b>${esc(b.orgName)}</b><div class="help">접수 ${esc(dateTime(b.createdAt))} · 예약일 ${esc(b.date||'-')}</div></div></div>
    <div class="detail-grid">
      <div><b>예약자</b><br>${esc(b.managerName||'-')}</div><div><b>연락처</b><br>${esc(b.contact||'-')}</div>
      <div><b>방문시간</b><br>${esc(b.entryTime||'--:--')} ~ ${esc(b.exitTime||'--:--')}</div><div><b>인원</b><br>유료 ${Number(b.paidCount||0)} / 인솔 ${Number(b.chaperoneCount||0)}</div>
      ${isSettled(b)?`<div><b>실제 매표</b><br>${esc(moneyText(st.ticketAmount||0))}</div><div><b>실제 카페</b><br>${esc(moneyText(st.actualCafeAmount||0))}</div>`:''}
      ${b.status==='cancelled'?`<div><b>취소 구분</b><br>${esc(cancelSource(b))}</div><div><b>취소 일시</b><br>${esc(dateTime(b.cancelledAt))}</div>`:''}
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn-soft" onclick="openAdminBookingDetail('${esc(b.id)}')">자세히</button></div>
  </div>`;
}
function renderMain(){
  const root=$('activityList');if(!root)return;
  const state=applied||readControls(),list=filterByState(state);setKpis(list);
  root.innerHTML=list.length?list.map(bookingCard).join(''):'<div class="help">선택한 조회 조건에 예약 내역이 없습니다.</div>';
}
function applyFromControls(){
  const next=readControls();
  if(!validateState(next)){try{toast('조회 시작일은 종료일보다 늦을 수 없습니다.')}catch{}return false}
  applied={...next};
  localStorage.setItem(ACTIVITY_BASIS_KEY,applied.mode);
  renderMain();
  return true;
}
function applyToday(){
  const d=todaySeoul(),s=startControl(),e=endControl();if(s)s.value=d;if(e)e.value=d;
  applyFromControls();
}
function mainSearchButton(){
  const tab=$('tab-activity');if(!tab)return null;
  return [...tab.querySelectorAll('button')].find(b=>(b.textContent||'').trim()==='조회하기')||null;
}
function todayButton(){
  const tab=$('tab-activity');if(!tab)return null;
  return [...tab.querySelectorAll('button')].find(b=>(b.textContent||'').trim()==='오늘')||null;
}
function neutralizeInlineOrgSearch(){
  const q=$('zrActivityOrgSearch');if(q){q.value='';q.disabled=true}
  $('zrActivityOrgSearchWrap')?.classList.add('zr-activity-inline-search-disabled');
  $('zrActivityOrgSearchHint')?.classList.add('zr-activity-inline-search-disabled');
  const basis=$('activityDateBasis');if(basis){basis.disabled=false;basis.onchange=()=>localStorage.setItem(ACTIVITY_BASIS_KEY,controlBasis())}
  for(const el of [startControl(),endControl()]){if(el){el.disabled=false;el.closest('div')?.classList.remove('zr-search-ignored')}}
  $('activityDateBasisWrap')?.classList.remove('zr-search-ignored');
}
function bindMainControls(){
  const search=mainSearchButton(),today=todayButton(),basis=$('activityDateBasis'),start=startControl(),end=endControl();
  if(search){
    search.dataset.zrActivityDateOwner='1';
    search.onclick=e=>{e?.preventDefault?.();e?.stopPropagation?.();applyFromControls();return false};
  }
  if(today){
    today.dataset.zrActivityDateOwner='1';
    today.onclick=e=>{e?.preventDefault?.();e?.stopPropagation?.();applyToday();return false};
  }
  if(basis){basis.disabled=false;basis.onchange=()=>localStorage.setItem(ACTIVITY_BASIS_KEY,controlBasis())}
  if(start)start.disabled=false;if(end)end.disabled=false;
}
function injectUi(){
  if(!$('zrActivityFilterFixStyle')){
    const style=document.createElement('style');style.id='zrActivityFilterFixStyle';style.textContent=`
      #tab-activity .zr-activity-inline-search-disabled{display:none!important}
      #zr11ActivityToolbar #zrActivityOrgModalBtn{grid-column:9/13;grid-row:1;width:100%!important;min-height:40px!important;margin:0!important}
      #zrActivityOrgSearchModal .modal-card{position:relative;width:min(760px,calc(100vw - 28px));max-height:82vh;overflow:auto;padding-top:24px}
      #zrActivityOrgSearchModal .zr-org-modal-head{padding-right:86px}
      #zrActivityOrgSearchModal #zrActivityOrgModalClose{position:absolute;top:14px;right:14px;z-index:2;min-width:68px;margin:0}
      #zrActivityOrgSearchModal .zr-org-search-row{display:flex;gap:8px;margin:16px 0 12px;align-items:center}
      #zrActivityOrgSearchModal .zr-org-search-row input{flex:1;min-width:0}
      #zrActivityOrgSearchModal .zr-org-search-results{display:flex;flex-direction:column;gap:10px}
      @media(max-width:900px){#zr11ActivityToolbar #zrActivityOrgModalBtn{grid-column:1/13;grid-row:3}#zr11ActivityToolbar #zrActivityOrgSearchHint{display:none!important}}
      @media(max-width:560px){#zr11ActivityToolbar #zrActivityOrgModalBtn{grid-column:1/13;grid-row:5}}
    `;document.head.appendChild(style);
  }
  const tab=$('tab-activity'),toolbar=$('zr11ActivityToolbar');
  if(tab&&!$('zrActivityOrgModalBtn')){
    const btn=document.createElement('button');btn.type='button';btn.id='zrActivityOrgModalBtn';btn.className='btn-soft';btn.textContent='단체명 검색';
    (toolbar||mainSearchButton()?.parentElement||tab).appendChild(btn);
  }
  if(!$('zrActivityOrgSearchModal')){
    const modal=document.createElement('div');modal.id='zrActivityOrgSearchModal';modal.className='modal hidden';
    modal.innerHTML=`<div class="modal-card"><button type="button" class="btn-gray" id="zrActivityOrgModalClose">닫기</button><div class="zr-org-modal-head"><h2 style="margin:0">단체명 검색</h2><div class="help" style="margin-top:4px">날짜 조회와 별개로 전체 예약에서 단체명을 찾습니다.</div></div><div class="zr-org-search-row"><input id="zrActivityOrgModalInput" type="search" autocomplete="off" placeholder="단체명 일부 입력"><button type="button" class="btn-primary" id="zrActivityOrgModalSearch">검색</button></div><div id="zrActivityOrgModalCount" class="help" style="margin-bottom:10px">단체명을 입력해주세요.</div><div id="zrActivityOrgModalResults" class="zr-org-search-results"></div></div>`;
    document.body.appendChild(modal);
  }
}
function openOrgModal(){
  neutralizeInlineOrgSearch();bindMainControls();injectUi();
  const modal=$('zrActivityOrgSearchModal');modal?.classList.remove('hidden');
  const input=$('zrActivityOrgModalInput');if(input){input.value='';setTimeout(()=>input.focus(),0)}
  if($('zrActivityOrgModalCount'))$('zrActivityOrgModalCount').textContent='단체명을 입력해주세요.';
  if($('zrActivityOrgModalResults'))$('zrActivityOrgModalResults').innerHTML='';
}
function closeOrgModal(){$('zrActivityOrgSearchModal')?.classList.add('hidden');bindMainControls()}
function renderOrgModal(){
  const input=$('zrActivityOrgModalInput'),q=String(input?.value||'').trim(),root=$('zrActivityOrgModalResults'),count=$('zrActivityOrgModalCount');if(!root||!count)return;
  if(!q){count.textContent='단체명을 입력해주세요.';root.innerHTML='';return}
  const nq=norm(q),list=readBookings().filter(b=>norm(b.orgName).includes(nq)).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
  count.textContent=`‘${q}’ 검색 결과 ${list.length}건`;
  root.innerHTML=list.length?list.map(bookingCard).join(''):'<div class="help">해당 단체명을 포함한 예약이 없습니다.</div>';
}
function bindUi(){
  injectUi();neutralizeInlineOrgSearch();bindMainControls();
  const input=$('zrActivityOrgModalInput');if(input&&!input.dataset.zrBound){input.dataset.zrBound='1';input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();renderOrgModal()}})}
  const modal=$('zrActivityOrgSearchModal');if(modal&&!modal.dataset.zrBackdrop){modal.dataset.zrBackdrop='1';modal.addEventListener('click',e=>{if(e.target===modal)closeOrgModal()})}
}
function install(){
  if(installed){bindUi();return true}
  const ready=window.__ZR_ADMIN_OPS_V11_PATCH&&$('tab-activity')&&$('activityDateBasis')&&startControl()&&endControl()&&typeof window.renderActivity==='function'&&window.renderActivity.__zrOrgSearchV2;
  if(!ready)return false;
  const saved=localStorage.getItem(ACTIVITY_BASIS_KEY);if(saved==='reservation'||saved==='reception')$('activityDateBasis').value=saved;
  neutralizeInlineOrgSearch();bindUi();
  applied=readControls();
  window.activityFilteredBookings=()=>filterByState(applied||readControls());try{activityFilteredBookings=window.activityFilteredBookings}catch{}
  window.renderActivity=renderMain;try{renderActivity=renderMain}catch{}
  bindMainControls();installed=true;
  if(!$('tab-activity')?.classList.contains('hidden'))renderMain();
  return true;
}
function boot(){
  const timer=setInterval(()=>{install();bindUi();if(installed)clearInterval(timer)},120);setTimeout(()=>clearInterval(timer),20000);
  document.addEventListener('click',e=>{
    const target=e.target;
    if(target?.closest?.('#zrActivityOrgModalBtn')){e.preventDefault();e.stopImmediatePropagation();openOrgModal();return}
    if(target?.closest?.('#zrActivityOrgModalClose')){e.preventDefault();e.stopImmediatePropagation();closeOrgModal();return}
    if(target?.closest?.('#zrActivityOrgModalSearch')){e.preventDefault();e.stopImmediatePropagation();renderOrgModal();return}
    if(!installed)return;
    const search=mainSearchButton(),today=todayButton(),button=target?.closest?.('button');
    if(search&&button===search){e.preventDefault();e.stopImmediatePropagation();applyFromControls();return}
    if(today&&button===today){e.preventDefault();e.stopImmediatePropagation();applyToday();return}
    const tab=target?.closest?.('#adminView .admin-tabs button,[data-tab]');if(tab)setTimeout(()=>{bindUi();if(!$('tab-activity')?.classList.contains('hidden'))renderMain()},80);
  },true);
  const root=$('adminView')||document.body;new MutationObserver(()=>{if(installed){neutralizeInlineOrgSearch();injectUi();bindMainControls()}else install()}).observe(root,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
