(()=>{
'use strict';
if(window.__ZR_CANCEL_REVIEW_STATE_V1)return;
window.__ZR_CANCEL_REVIEW_STATE_V1=true;

const KEY='zr_bookings';
const PAGE_SIZE=8;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
let customerCancelTarget='';
let detailId='';
let smartObserver=null;
let cancelPage=1;
let cancelApplied={start:'',end:'',basis:'cancel',status:'pending'};

function readBookings(){
  try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}
  catch{return[]}
}
function writeBookings(list){
  if(typeof window.setStore==='function')window.setStore(KEY,list);
  else localStorage.setItem(KEY,JSON.stringify(list));
}
function staffName(){
  try{return String(window.zrReservationFirebase?.auth?.currentUser?.email||'admin')}
  catch{return'admin'}
}
function bookingById(id){return readBookings().find(b=>String(b?.id||'')===String(id))||null}
function reviewState(b){return b?.cancelReviewed===false?'pending':'done'}
function pendingCount(){return readBookings().filter(b=>String(b?.status||'')==='cancelled'&&b?.cancelReviewed===false).length}
function markCancelledUnreviewed(id){
  if(!id)return false;
  const list=readBookings(),b=list.find(x=>String(x?.id||'')===String(id));
  if(!b||String(b.status||'')!=='cancelled')return false;
  if(b.cancelReviewed===false)return true;
  b.cancelReviewed=false;
  delete b.cancelReviewedAt;delete b.cancelReviewedBy;
  writeBookings(list);
  changed(id,false);
  return true;
}
function markReviewed(id){
  const list=readBookings(),b=list.find(x=>String(x?.id||'')===String(id));
  if(!b||String(b.status||'')!=='cancelled')return false;
  b.cancelReviewed=true;
  b.cancelReviewedAt=new Date().toISOString();
  b.cancelReviewedBy=staffName();
  writeBookings(list);
  changed(id,true);
  try{window.toast?.('예약 취소 확인을 완료했습니다.')}catch{}
  return true;
}
function changed(id,reviewed){
  try{document.dispatchEvent(new CustomEvent('zr:cancel-review-updated',{detail:{id:String(id||''),reviewed:!!reviewed}}))}catch{}
  setTimeout(syncAll,0);setTimeout(syncAll,120);
}

function installCustomerHook(){
  const base=window.openCustomerCancel;
  if(typeof base!=='function'||base.__zrCancelReviewV1)return false;
  const wrapped=function(id){customerCancelTarget=String(id||'');return base.apply(this,arguments)};
  wrapped.__zrCancelReviewV1=true;wrapped.__zrBase=base;
  window.openCustomerCancel=wrapped;
  try{openCustomerCancel=wrapped}catch{}
  return true;
}
function installAdminCancelHook(){
  const base=window.setBookingStatus;
  if(typeof base!=='function'||base.__zrCancelReviewV1)return false;
  const wrapped=function(id,status){
    const out=base.apply(this,arguments);
    if(String(status||'')==='cancelled'){
      const bid=String(id||'');
      [30,120,320].forEach(ms=>setTimeout(()=>markCancelledUnreviewed(bid),ms));
    }
    return out;
  };
  wrapped.__zrCancelReviewV1=true;wrapped.__zrBase=base;
  window.setBookingStatus=wrapped;
  try{setBookingStatus=wrapped}catch{}
  return true;
}

function seoulDate(value){
  const raw=String(value||'').trim();if(!raw)return'';
  if(/^\d{4}-\d{2}-\d{2}$/.test(raw))return raw;
  const d=new Date(raw);if(Number.isNaN(d.getTime()))return raw.slice(0,10);
  try{
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
    const get=t=>parts.find(x=>x.type===t)?.value||'';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }catch{return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
}
function todaySeoul(){return seoulDate(new Date().toISOString())}
function dateTimeText(v){
  if(!v)return'-';
  const d=v?.toDate?.()||((v&&typeof v.seconds==='number')?new Date(v.seconds*1000):new Date(v));
  if(Number.isNaN(d?.getTime?.()))return String(v);
  try{return new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(d).replace(/\. /g,'.').replace(/\.$/,'')}
  catch{return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`}
}
function cancelSource(b){
  try{return typeof window.cancellationSourceText==='function'?window.cancellationSourceText(b):(String(b?.cancelledBy||'')==='customer'?'고객 취소':String(b?.cancelledBy||'')==='admin'?'관리자 취소':'취소')}
  catch{return'취소'}
}
function cancelRows(){return readBookings().filter(b=>b&&!b.__availabilityOnly&&String(b.status||'')==='cancelled')}
function keyForCancel(b,basis){return basis==='reservation'?String(b?.date||''):seoulDate(b?.cancelledAt)}
function filteredCancelRows(){
  const s=cancelApplied||{start:'',end:'',basis:'cancel',status:'pending'};
  return cancelRows().filter(b=>{
    const key=keyForCancel(b,s.basis);if(!key)return false;
    if(s.start&&key<s.start)return false;
    if(s.end&&key>s.end)return false;
    const state=reviewState(b);
    if(s.status!=='all'&&state!==s.status)return false;
    return true;
  }).sort((a,b)=>String(b.cancelledAt||b.createdAt||'').localeCompare(String(a.cancelledAt||a.createdAt||''))||String(b.date||'').localeCompare(String(a.date||'')));
}
function pageNumbers(current,pages){
  if(pages<=7)return Array.from({length:pages},(_,i)=>i+1);
  const keep=new Set([1,pages,current-1,current,current+1]),valid=[...keep].filter(n=>n>=1&&n<=pages).sort((a,b)=>a-b),out=[];let prev=0;
  for(const n of valid){if(prev&&n-prev>1)out.push('…');out.push(n);prev=n}
  return out;
}
function pagerHtml(current,pages){
  if(pages<=1)return'';
  const nums=pageNumbers(current,pages).map(n=>n==='…'?'<span class="zr-cancel-page-gap">…</span>':`<button type="button" class="${n===current?'btn-primary':'btn-soft'} zr-cancel-page-btn" data-zr-cancel-page="${n}" ${n===current?'aria-current="page"':''}>${n}</button>`).join('');
  return `<div class="zr-cancel-pagination"><button type="button" class="btn-soft zr-cancel-page-btn" data-zr-cancel-page="prev" ${current<=1?'disabled':''}>이전</button>${nums}<button type="button" class="btn-soft zr-cancel-page-btn" data-zr-cancel-page="next" ${current>=pages?'disabled':''}>다음</button></div>`;
}
function cancelCard(b){
  const state=reviewState(b),need=state==='pending',reason=String(b.cancelReason||'').trim()||'취소 사유 미기록';
  const stateBadge=need?'<span class="status rejected zr-cancel-review-status-badge">확인 필요</span>':'<span class="status confirmed zr-cancel-review-status-badge done">확인 완료</span>';
  const reviewMeta=b.cancelReviewedAt?`<div><b>확인 일시</b><br>${esc(dateTimeText(b.cancelReviewedAt))}</div>`:'';
  return `<div class="booking-item zr-cancel-workspace-card" data-zr-cancel-booking="${esc(b.id)}">
    <div class="zr4-badges"><span class="status rejected">예약 취소</span>${stateBadge}</div>
    <div class="row" style="margin-top:7px"><div><b>${esc(b.orgName||'단체명 미입력')}</b><div class="help">접수 ${esc(dateTimeText(b.createdAt))} · 예약일 ${esc(b.date||'-')}</div></div></div>
    <div class="detail-grid">
      <div><b>예약자</b><br>${esc(b.managerName||'-')}</div><div><b>연락처</b><br>${esc(b.contact||'-')}</div>
      <div><b>방문시간</b><br>${esc(b.entryTime||'--:--')} ~ ${esc(b.exitTime||'--:--')}</div><div><b>인원</b><br>유료 ${Number(b.paidCount||0)} / 인솔 ${Number(b.chaperoneCount||0)}</div>
      <div><b>취소 구분</b><br>${esc(cancelSource(b))}</div><div><b>취소 일시</b><br>${esc(dateTimeText(b.cancelledAt))}</div>${reviewMeta}
    </div>
    <div class="zr-cancel-workspace-reason"><b>취소 사유</b><br>${esc(reason)}</div>
    <div class="zr-cancel-workspace-actions"><button type="button" class="btn-soft" data-zr-cancel-detail="${esc(b.id)}">자세히</button>${need?`<button type="button" class="btn-primary" data-zr-cancel-review="${esc(b.id)}">확인완료</button>`:''}</div>
  </div>`;
}

function reviewActionHtml(b,id){
  if(String(b?.status||'')!=='cancelled'||b?.cancelReviewed===undefined)return'';
  if(b.cancelReviewed===false)return `<div class="zr-cancel-review-box"><span class="zr-cancel-review-state need">취소 확인 필요</span><button type="button" class="btn-primary zr-cancel-review-btn" data-zr-cancel-review="${esc(id)}">확인완료</button></div>`;
  const when=String(b.cancelReviewedAt||'').trim();
  return `<div class="zr-cancel-review-box reviewed"><span class="zr-cancel-review-state done">확인완료</span>${when?`<small>${esc(dateTimeText(when))}</small>`:''}</div>`;
}
function decorateDetail(){
  const body=$('adminBookingDetailContent');if(!body||!detailId)return;
  const b=bookingById(detailId);let box=body.querySelector('.zr-cancel-review-box');
  const html=reviewActionHtml(b,detailId);
  if(!html){box?.remove();return}
  if(box&&box.outerHTML===html)return;
  const holder=document.createElement('div');holder.innerHTML=html;const next=holder.firstElementChild;
  if(box)box.replaceWith(next);else body.appendChild(next);
}

function ensureWorkspace(){
  const tab=$('tab-activity');if(!tab)return false;
  installStyle();
  let tabs=$('zrActivityModeTabsV1'),workspace=$('zrActivityCancelWorkspaceV1');
  if(!tabs){
    tabs=document.createElement('div');tabs.id='zrActivityModeTabsV1';tabs.className='zr-admin-subtabs zr-activity-mode-tabs';
    tabs.innerHTML='<button type="button" id="zrActivityMainSubtabV1" class="zr-subtab-active">예약현황</button><button type="button" id="zrActivityCancelSubtabV1">예약취소</button>';
    tab.prepend(tabs);
  }
  if(!workspace){
    workspace=document.createElement('section');workspace.id='zrActivityCancelWorkspaceV1';workspace.className='hidden';
    workspace.innerHTML=`
      <div class="card zr-cancel-workspace-head">
        <div class="zr-cancel-workspace-title"><div><h3>예약취소 조회</h3><p class="help">취소된 예약을 확인하고 처리 여부를 관리합니다.</p></div><div class="zr-cancel-kpis"><span>전체 <b id="zrCancelKpiAll">0</b></span><span>확인 필요 <b id="zrCancelKpiPending">0</b></span><span>확인 완료 <b id="zrCancelKpiDone">0</b></span></div></div>
        <div id="zrCancelReviewToolbarV1" class="zr-cancel-toolbar">
          <label class="zr-cancel-start"><span>시작일</span><input type="date" id="zrCancelReviewStartV1"></label>
          <label class="zr-cancel-end"><span>종료일</span><input type="date" id="zrCancelReviewEndV1"></label>
          <label class="zr-cancel-basis"><span>조회 기준</span><select id="zrCancelReviewBasisV1"><option value="cancel">취소일 기준</option><option value="reservation">예약일 기준</option></select></label>
          <label class="zr-cancel-status"><span>확인 상태</span><select id="zrCancelReviewStatusV1"><option value="pending">확인 필요</option><option value="done">확인 완료</option><option value="all">전체</option></select></label>
          <button type="button" class="btn-primary zr-cancel-search" id="zrCancelReviewSearchV1">조회하기</button>
          <button type="button" class="btn-soft zr-cancel-today" id="zrCancelReviewTodayV1">오늘</button>
        </div>
      </div>
      <div id="zrCancelReviewListV1" class="zr-cancel-workspace-list"></div>
      <div id="zrCancelReviewPagerV1"></div>`;
    tab.appendChild(workspace);
  }
  if(tabs.dataset.zrBound!=='1'){
    tabs.dataset.zrBound='1';
    $('zrActivityMainSubtabV1')?.addEventListener('click',showMainWorkspace);
    $('zrActivityCancelSubtabV1')?.addEventListener('click',()=>showCancelWorkspace());
  }
  if(workspace.dataset.zrBound!=='1'){
    workspace.dataset.zrBound='1';
    $('zrCancelReviewSearchV1')?.addEventListener('click',applyCancelControls);
    $('zrCancelReviewTodayV1')?.addEventListener('click',applyCancelToday);
  }
  syncCancelControls();
  return true;
}
function syncCancelControls(){
  const s=cancelApplied||{};
  if($('zrCancelReviewStartV1'))$('zrCancelReviewStartV1').value=s.start||'';
  if($('zrCancelReviewEndV1'))$('zrCancelReviewEndV1').value=s.end||'';
  if($('zrCancelReviewBasisV1'))$('zrCancelReviewBasisV1').value=s.basis||'cancel';
  if($('zrCancelReviewStatusV1'))$('zrCancelReviewStatusV1').value=s.status||'pending';
}
function applyCancelControls(){
  const next={start:$('zrCancelReviewStartV1')?.value||'',end:$('zrCancelReviewEndV1')?.value||'',basis:$('zrCancelReviewBasisV1')?.value==='reservation'?'reservation':'cancel',status:['pending','done','all'].includes($('zrCancelReviewStatusV1')?.value)?$('zrCancelReviewStatusV1').value:'pending'};
  if(next.start&&next.end&&next.start>next.end){try{window.toast?.('조회 시작일은 종료일보다 늦을 수 없습니다.')}catch{}return false}
  cancelApplied=next;cancelPage=1;renderCancelWorkspace();return true;
}
function applyCancelToday(){
  const d=todaySeoul();cancelApplied={start:d,end:d,basis:'cancel',status:$('zrCancelReviewStatusV1')?.value||'pending'};cancelPage=1;syncCancelControls();renderCancelWorkspace();
}
function setTextIfChanged(el,value){const text=String(value);if(el&&el.textContent!==text)el.textContent=text}
const renderedHtml=new WeakMap();
function setHtmlIfChanged(el,html){
  if(!el)return;
  const previous=renderedHtml.get(el);
  if(previous?.source===html&&previous.dom===el.innerHTML)return;
  el.innerHTML=html;
  renderedHtml.set(el,{source:html,dom:el.innerHTML});
}
function renderCancelWorkspace(){
  if(!$('zrActivityCancelWorkspaceV1'))return;
  const all=cancelRows(),pending=all.filter(b=>reviewState(b)==='pending').length,done=all.length-pending;
  setTextIfChanged($('zrCancelKpiAll'),all.length);
  setTextIfChanged($('zrCancelKpiPending'),pending);
  setTextIfChanged($('zrCancelKpiDone'),done);
  const rows=filteredCancelRows(),pages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));cancelPage=Math.max(1,Math.min(cancelPage,pages));
  const shown=rows.slice((cancelPage-1)*PAGE_SIZE,cancelPage*PAGE_SIZE);
  const listHtml=shown.length?shown.map(cancelCard).join(''):'<div class="card zr-cancel-workspace-empty"><b>조회 조건에 맞는 취소 예약이 없습니다.</b><span>확인 상태 또는 조회 기간을 변경해보세요.</span></div>';
  setHtmlIfChanged($('zrCancelReviewListV1'),listHtml);
  setHtmlIfChanged($('zrCancelReviewPagerV1'),pagerHtml(cancelPage,pages));
}
function showMainWorkspace(){
  if(!ensureWorkspace())return;
  $('tab-activity')?.classList.remove('zr-cancel-workspace-active');
  $('zrActivityCancelWorkspaceV1')?.classList.add('hidden');
  $('zrActivityMainSubtabV1')?.classList.add('zr-subtab-active');$('zrActivityCancelSubtabV1')?.classList.remove('zr-subtab-active');
}
function showCancelWorkspace(options={}){
  if(!ensureWorkspace())return;
  if(options.forcePending){cancelApplied={start:'',end:'',basis:'cancel',status:'pending'};cancelPage=1;syncCancelControls()}
  $('tab-activity')?.classList.add('zr-cancel-workspace-active');
  $('zrActivityCancelWorkspaceV1')?.classList.remove('hidden');
  $('zrActivityMainSubtabV1')?.classList.remove('zr-subtab-active');$('zrActivityCancelSubtabV1')?.classList.add('zr-subtab-active');
  renderCancelWorkspace();
}

function ensureSmartRow(){
  const list=document.querySelector('#zrAdminSmartPanelV1 .zr-admin-smart-pending');if(!list)return false;
  if(list.querySelector('[data-zr-cancel-review-open]'))return true;
  const row=document.createElement('button');row.type='button';row.className='zr-admin-smart-pending-row';row.dataset.kind='cancel';row.dataset.zrCancelReviewOpen='1';
  row.innerHTML='<span>예약 취소</span><strong id="zrSmartCancelReview">0</strong>';
  const reservation=list.querySelector('[data-kind="reservation"]');
  if(reservation?.nextSibling)list.insertBefore(row,reservation.nextSibling);else list.appendChild(row);
  return true;
}
function ensureMobileRow(){
  const list=document.querySelector('#zrAdminMobileAlertsV1 .zr-admin-mobile-alert-list');if(!list)return false;
  if(list.querySelector('[data-zr-cancel-review-open]'))return true;
  const row=document.createElement('button');row.type='button';row.className='zr-admin-mobile-alert-row';row.dataset.zrCancelReviewOpen='1';
  row.innerHTML='<span class="zr-admin-mobile-alert-dot"></span><span>예약 취소</span><strong data-mobile-count="zrSmartCancelReview">0</strong>';
  const reservation=list.querySelector('[data-mobile-go="activity"]');
  if(reservation?.nextSibling)list.insertBefore(row,reservation.nextSibling);else list.prepend(row);
  return true;
}
function setCount(el,n){if(el&&el.textContent!==String(n))el.textContent=String(n)}
function syncBellBadge(){
  const badge=$('zrAdminMobileBellBadge');if(!badge)return;
  let total=0;document.querySelectorAll('#zrAdminMobileAlertsV1 [data-mobile-count]').forEach(el=>{const n=parseInt(String(el.textContent||'0').replace(/[^0-9-]/g,''),10);if(Number.isFinite(n)&&n>0)total+=n});
  const text=total>99?'99+':String(total);if(badge.textContent!==text)badge.textContent=text;badge.hidden=total===0;
}
function syncNotifications(){
  ensureSmartRow();ensureMobileRow();const n=pendingCount();
  setCount($('zrSmartCancelReview'),n);
  setCount(document.querySelector('#zrAdminMobileAlertsV1 [data-mobile-count="zrSmartCancelReview"]'),n);
  syncBellBadge();
}
function closeMobileAlerts(){
  $('zrAdminMobileAlertsV1')?.classList.remove('is-open');$('zrAdminMobileBell')?.classList.remove('is-open');$('zrAdminMobileBell')?.setAttribute('aria-expanded','false');
}
function openCancelReview(attempt=0){
  closeMobileAlerts();
  const rail=document.querySelector('#zrAdminShellRail [data-zr-admin-item="activity"]');
  const fallback=document.querySelector('[data-tab="activity"]');
  if(rail)rail.click();else fallback?.click?.();
  if(ensureWorkspace()){setTimeout(()=>{showCancelWorkspace({forcePending:true});window.scrollTo({top:0,behavior:'auto'})},60);return true}
  if(attempt<20)setTimeout(()=>openCancelReview(attempt+1),80);
  return false;
}
window.zrOpenCancelReviewV1=openCancelReview;

function installStyle(){
  if($('zrCancelReviewStateV1Style'))return;
  const s=document.createElement('style');s.id='zrCancelReviewStateV1Style';s.textContent=`
  #zrActivityModeTabsV1{display:inline-flex;align-items:center;gap:4px;margin:0 0 14px;padding:4px;background:#eef3ef;border:1px solid #d7e1da;border-radius:12px;max-width:100%;overflow-x:auto}#zrActivityModeTabsV1 button{position:relative;min-width:108px;height:38px;padding:0 16px!important;border:1px solid transparent!important;border-radius:9px!important;background:transparent!important;color:#66736b!important;box-shadow:none!important;font-size:13px!important;font-weight:800!important;white-space:nowrap!important}#zrActivityModeTabsV1 button.zr-subtab-active{background:#fff!important;color:#2f6b4f!important;border-color:#bad1c1!important;box-shadow:0 2px 6px rgba(30,50,36,.08)!important}#zrActivityModeTabsV1 button.zr-subtab-active:after{content:'';position:absolute;left:18px;right:18px;bottom:4px;height:2px;border-radius:999px;background:#2f6b4f}
  #tab-activity.zr-cancel-workspace-active>:not(#zrActivityModeTabsV1):not(#zrActivityCancelWorkspaceV1){display:none!important}#zrActivityCancelWorkspaceV1.hidden{display:none!important}.zr-cancel-workspace-head{margin-bottom:12px}.zr-cancel-workspace-title{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px}.zr-cancel-workspace-title h3{margin:0 0 4px}.zr-cancel-workspace-title p{margin:0}.zr-cancel-kpis{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.zr-cancel-kpis span{display:inline-flex;align-items:center;gap:4px;padding:6px 9px;border:1px solid #e1e6e2;border-radius:999px;background:#fafbfa;color:#667169;font-size:11px;font-weight:800}.zr-cancel-kpis b{color:#9a4141;font-size:12px}.zr-cancel-toolbar{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:10px 12px;align-items:end}.zr-cancel-toolbar label{display:flex;flex-direction:column;gap:5px;font-size:12px;font-weight:700;min-width:0}.zr-cancel-toolbar input,.zr-cancel-toolbar select{min-height:40px;width:100%;box-sizing:border-box}.zr-cancel-start{grid-column:1/4}.zr-cancel-end{grid-column:4/7}.zr-cancel-basis{grid-column:7/10}.zr-cancel-status{grid-column:10/13}.zr-cancel-search{grid-column:7/10}.zr-cancel-today{grid-column:10/13}.zr-cancel-workspace-list{display:grid;gap:10px}.zr-cancel-workspace-card{border-color:#e0caca!important;background:#fffafa!important}.zr-cancel-workspace-reason{margin-top:10px;padding:9px 10px;border:1px solid #ead0d0;border-radius:9px;background:#fff0f0;color:#704242;font-size:12px;line-height:1.55;white-space:pre-wrap}.zr-cancel-workspace-actions{display:flex;justify-content:flex-end;gap:7px;margin-top:10px}.zr-cancel-workspace-actions button{min-width:92px}.zr-cancel-review-status-badge.done{background:#edf5f0!important;color:#2f6b4f!important;border-color:#cfe1d6!important}.zr-cancel-workspace-empty{display:grid;gap:4px;text-align:center;padding:28px 18px!important;color:#59645d}.zr-cancel-workspace-empty span{font-size:12px;color:#7a837d}.zr-cancel-pagination{display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:6px;margin:16px 0 2px}.zr-cancel-page-btn{min-width:40px;min-height:36px;padding:7px 10px!important}.zr-cancel-page-gap{display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:36px;color:#6b7280;font-weight:700}
  .zr-cancel-review-box{margin-top:10px;padding:9px 10px;border:1px solid #efc5c5;border-radius:10px;background:#fff7f7;display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}.zr-cancel-review-box.reviewed{border-color:#d8e2dc;background:#f8faf9}.zr-cancel-review-state{margin-right:auto;font-size:12px;font-weight:900}.zr-cancel-review-state.need{color:#a33f3f}.zr-cancel-review-state.done{color:#4e6859}.zr-cancel-review-box small{font-size:10px;color:#788179}.zr-cancel-review-btn{min-height:38px!important;padding:7px 13px!important}#zrAdminSmartPanelV1 [data-kind="cancel"]{--zr-row-color:#b94c4c}.zr-admin-mobile-alert-row[data-zr-cancel-review-open] .zr-admin-mobile-alert-dot{background:#b94c4c!important}
  @media(max-width:900px){#zrActivityModeTabsV1{display:flex;width:100%;box-sizing:border-box}#zrActivityModeTabsV1 button{flex:1;min-width:0;height:40px;padding:0 10px!important}.zr-cancel-workspace-title{display:grid;gap:10px}.zr-cancel-kpis{justify-content:flex-start}.zr-cancel-toolbar{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:9px}.zr-cancel-start,.zr-cancel-end,.zr-cancel-basis,.zr-cancel-status,.zr-cancel-search,.zr-cancel-today{grid-column:auto}.zr-cancel-toolbar input[type="date"]{width:calc(100% - 8px)!important;max-width:calc(100% - 8px)!important}.zr-cancel-workspace-actions{display:grid;grid-template-columns:1fr 1fr}.zr-cancel-workspace-actions button{width:100%!important;min-width:0!important;min-height:44px!important}.zr-cancel-workspace-actions button:only-child{grid-column:1/3}.zr-cancel-review-box{align-items:stretch;flex-direction:column}.zr-cancel-review-state{margin-right:0}.zr-cancel-review-btn{width:100%!important;min-height:46px!important;font-size:14px!important}}
  `;document.head.appendChild(s);
}
function attachSmartObserver(){
  const updated=$('zrSmartUpdated');
  if(updated&&!smartObserver){smartObserver=new MutationObserver(()=>{syncNotifications();if($('tab-activity')?.classList.contains('zr-cancel-workspace-active'))renderCancelWorkspace()});smartObserver.observe(updated,{childList:true,characterData:true,subtree:true})}
}
function syncAll(){
  installStyle();installCustomerHook();installAdminCancelHook();ensureWorkspace();attachSmartObserver();syncNotifications();decorateDetail();
  if($('tab-activity')?.classList.contains('zr-cancel-workspace-active'))renderCancelWorkspace();
}
function scheduleBootSync(){[0,80,220,600,1400,3000,6000].forEach(ms=>setTimeout(syncAll,ms))}

document.addEventListener('click',e=>{
  const review=e.target?.closest?.('[data-zr-cancel-review]');
  if(review){e.preventDefault();e.stopPropagation();markReviewed(review.dataset.zrCancelReview||'');return}
  const detail=e.target?.closest?.('[data-zr-cancel-detail]');
  if(detail){e.preventDefault();detailId=detail.dataset.zrCancelDetail||'';try{window.openAdminBookingDetail?.(detailId)}catch{}setTimeout(decorateDetail,40);setTimeout(decorateDetail,140);return}
  if(e.target?.closest?.('[data-zr-cancel-review-open]')){e.preventDefault();e.stopImmediatePropagation();openCancelReview();return}
  const normalDetail=e.target?.closest?.('button[onclick*="openAdminBookingDetail"]');
  if(normalDetail){const m=String(normalDetail.getAttribute('onclick')||'').match(/openAdminBookingDetail\(['"]([^'"]+)['"]\)/);detailId=m?.[1]||'';setTimeout(decorateDetail,50);setTimeout(decorateDetail,140)}
  if(e.target?.closest?.('#confirmCustomerCancel')){
    const id=customerCancelTarget;[40,140,360].forEach(ms=>setTimeout(()=>markCancelledUnreviewed(id),ms));
  }
  const page=e.target?.closest?.('[data-zr-cancel-page]');
  if(page){
    const rows=filteredCancelRows(),pages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE)),v=page.dataset.zrCancelPage;
    if(v==='prev')cancelPage=Math.max(1,cancelPage-1);else if(v==='next')cancelPage=Math.min(pages,cancelPage+1);else cancelPage=Math.max(1,Math.min(pages,Number(v)||1));
    renderCancelWorkspace();$('zrActivityCancelWorkspaceV1')?.scrollIntoView?.({block:'start'});return;
  }
  if(e.target?.closest?.('#zrAdminShellRail [data-zr-admin-item="activity"], [data-tab="activity"]'))setTimeout(()=>{if(!$('zrActivityCancelSubtabV1')?.matches(':active'))showMainWorkspace()},0);
},true);
document.addEventListener('zr:admin-runtime-ready',scheduleBootSync);
document.addEventListener('zr:customer-runtime-ready',scheduleBootSync);
document.addEventListener('zr:admin-firebase-staff-ready',syncAll);
document.addEventListener('zr:cancel-review-updated',()=>{syncNotifications();renderCancelWorkspace();decorateDetail()});
window.addEventListener('storage',e=>{if(e.key===KEY)syncAll()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleBootSync,{once:true});else scheduleBootSync();
})();
