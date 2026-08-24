(()=>{
'use strict';
if(window.__ZR_ADMIN_BOOKING_HOLD_V1)return;
window.__ZR_ADMIN_BOOKING_HOLD_V1=true;

const HOLD='hold',KEY='zr_bookings',FILTER_KEY='zr_activity_status_filter_v1';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tel=s=>String(s||'').replace(/\D/g,'');
let holdId='',detailId='',detailWrap=null,dayWrap=null,badgeWrap=null,activeWrap=null,activityWrap=null;

function all(){try{const x=typeof window.bookings==='function'?window.bookings():JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x.filter(Boolean):[]}catch{return[]}}
function full(){return all().filter(b=>!b.__availabilityOnly)}
function byId(id){return full().find(b=>String(b.id)===String(id))||null}
function save(list){if(typeof window.setStore==='function')window.setStore(KEY,list);else localStorage.setItem(KEY,JSON.stringify(list))}
function msg(s){try{window.toast?.(s)}catch{}}
function complete(b){return !!(b?.status==='confirmed'&&b?.settlement?.savedAt)}
function adminOk(){try{if(typeof window.adminGuard==='function')return !!window.adminGuard(false)}catch{}return !!window.zrReservationFirebase?.isStaff?.()}
function seoulDate(v=new Date()){
  try{const p=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(v instanceof Date?v:new Date(v));const g=t=>p.find(x=>x.type===t)?.value||'';return `${g('year')}-${g('month')}-${g('day')}`}catch{return String(v||'').slice(0,10)}
}

function style(){if($('zrBookingHoldStyle'))return;const s=document.createElement('style');s.id='zrBookingHoldStyle';s.textContent=`
.status.zr-hold-status{background:#f1ebff!important;border-color:#d7c7f5!important;color:#65459a!important;font-weight:900!important}
#existingBookingList .zr-hold-emphasis{display:flex;align-items:center;margin:0 0 12px;padding:11px 12px;border:1px solid #d7c7f5;border-radius:11px;background:#f5f0ff;color:#60418f;font-size:14px;font-weight:900;line-height:1.5}`;document.head.appendChild(s)}
function modal(){if($('zrBookingHoldConfirmModal'))return;const m=document.createElement('div');m.id='zrBookingHoldConfirmModal';m.className='modal hidden';m.innerHTML='<div class="modal-card"><h2>예약 보류</h2><div class="help" style="font-size:14px;line-height:1.65">이 예약을 보류 상태로 변경할까요?<br>예약정보와 만들어둔 스케줄은 삭제되지 않습니다.</div><div class="modal-actions"><button class="btn-gray" id="zrHoldNo">아니오</button><button class="btn-soft" id="zrHoldYes">예약 보류</button></div></div>';document.body.appendChild(m);$('zrHoldNo').onclick=closeHold;$('zrHoldYes').onclick=applyHold}
function openHold(id){holdId=String(id||'');modal();if(typeof window.openModal==='function')window.openModal('zrBookingHoldConfirmModal');else $('zrBookingHoldConfirmModal')?.classList.remove('hidden')}
function closeHold(){if(typeof window.closeModal==='function')window.closeModal('zrBookingHoldConfirmModal');else $('zrBookingHoldConfirmModal')?.classList.add('hidden');holdId=''}
function refresh(id,date){try{window.renderAdmin?.()}catch{}try{window.renderActivity?.()}catch{}setTimeout(()=>{if(date&&!$('dayDetailModal')?.classList.contains('hidden'))window.openDay?.(date);if(id&&!$('adminBookingDetailModal')?.classList.contains('hidden'))window.openAdminBookingDetail?.(id);decorateCustomer()},80)}
function applyHold(){if(!holdId||!adminOk())return;const list=full(),b=list.find(x=>String(x.id)===holdId);if(!b)return msg('예약 정보를 찾지 못했습니다.');if(complete(b))return msg('정산 완료 예약은 보류로 변경할 수 없습니다.');if(!['pending','confirmed'].includes(b.status))return msg('접수 또는 확정 예약만 보류할 수 있습니다.');b.status=HOLD;b.statusUpdatedAt=new Date().toISOString();save(list);try{window.addActivity?.('hold',b,'예약 보류')}catch{}const id=b.id,date=b.date;closeHold();msg('예약을 보류 상태로 변경했습니다.');refresh(id,date)}
function existingStatus(id,status){const b=byId(id);if(!b||b.status!==HOLD)return;const fn=window.requestBookingStatus;if(typeof fn!=='function')return msg('기존 예약 상태 변경 기능을 불러오지 못했습니다.');fn(id,status)}
window.zrRequestBookingHold=openHold;
window.zrConfirmHeldBooking=id=>existingStatus(id,'confirmed');
window.zrCancelHeldBooking=id=>existingStatus(id,'cancelled');

function holdBtn(id){const b=document.createElement('button');b.type='button';b.className='btn-soft zr-hold-btn';b.textContent='예약 보류';b.onclick=()=>openHold(id);return b}
function decorateActions(root,b,margin='14px'){
  if(!root||!b)return;const badge=root.querySelector('.row .status');if(b.status===HOLD&&badge){badge.textContent='보류';badge.className='status zr-hold-status'}
  root.querySelectorAll('.zr-hold-btn').forEach(x=>x.remove());let actions=root.querySelector(':scope > .top-actions');
  if((b.status==='pending'||b.status==='confirmed')&&!complete(b)){
    if(!actions)return;const h=holdBtn(b.id),cancel=[...actions.querySelectorAll('button')].find(x=>/취소|거절/.test(x.textContent||''));cancel?actions.insertBefore(h,cancel):actions.appendChild(h);return;
  }
  if(b.status!==HOLD)return;actions?.remove();actions=document.createElement('div');actions.className='top-actions';actions.style.marginTop=margin;actions.innerHTML='<button class="btn-primary" data-hold-confirm>예약 확정</button><button class="btn-soft" data-hold-edit>예약 수정</button><button class="btn-danger" data-hold-cancel>예약 취소 처리</button>';root.appendChild(actions);actions.querySelector('[data-hold-confirm]').onclick=()=>existingStatus(b.id,'confirmed');actions.querySelector('[data-hold-edit]').onclick=()=>window.openAdminEditBooking?.(b.id);actions.querySelector('[data-hold-cancel]').onclick=()=>existingStatus(b.id,'cancelled')
}
function decorateDetail(id=detailId){const root=$('adminBookingDetailContent'),b=byId(id);if(root&&b){detailId=String(id);decorateActions(root,b)}}
function decorateDay(date){const root=$('dayDetailContent');if(!root)return;const bs=full().filter(b=>String(b.date||'')===String(date)),items=[...root.querySelectorAll(':scope > .booking-item')];items.forEach((item,i)=>decorateActions(item,bs[i],'12px'))}

function match(card,list){const t=String(card?.textContent||'').replace(/\s+/g,' ');return list.find(b=>t.includes(String(b.orgName||''))&&t.includes(String(b.date||'')))||list.find(b=>b.orgName&&t.includes(String(b.orgName)))||null}
function heldForCustomer(){const n=String($('startManager')?.value||'').trim(),p=tel($('startContact')?.value||'');if(!n||!p)return[];return full().filter(b=>b.status===HOLD&&String(b.managerName||'').trim()===n&&tel(b.contact)===p)}
function decorateCustomer(){const root=$('existingBookingList');if(!root)return;const hs=heldForCustomer();root.querySelectorAll('.existing-card:not(.zr-cancelled-record)').forEach(card=>{const b=match(card,hs),old=card.querySelector(':scope > .zr-hold-emphasis');if(!b){old?.remove();return}card.querySelector(':scope > .zr-received-emphasis')?.remove();card.querySelector(':scope > .zr-confirmed-emphasis')?.remove();card.querySelector(':scope > .zr-cancelled-emphasis')?.remove();const badge=card.querySelector('.status');if(badge){badge.textContent='보류';badge.className='status zr-hold-status'}let banner=old;if(!banner){banner=document.createElement('div');banner.className='zr-hold-emphasis';card.prepend(banner)}banner.textContent='본 예약은 보류 상태입니다.'})}

function filterSelect(){const s=$('zrActivityStatusFilter');if(!s)return null;if(![...s.options].some(o=>o.value===HOLD)){const o=document.createElement('option');o.value=HOLD;o.textContent='보류';const at=[...s.options].find(x=>x.value==='cancelled');at?s.insertBefore(o,at):s.appendChild(o)}if(localStorage.getItem(FILTER_KEY)===HOLD)s.value=HOLD;if(s.dataset.zrHoldBound!=='1'){s.dataset.zrHoldBound='1';s.addEventListener('change',()=>{if(s.value===HOLD)setTimeout(()=>localStorage.setItem(FILTER_KEY,HOLD),0)},true)}return s}
function heldActivity(){const start=$('activityStart')?.value||$('activityStartDate')?.value||'',end=$('activityEnd')?.value||$('activityEndDate')?.value||'',reservation=$('activityDateBasis')?.value==='reservation';return full().filter(b=>{if(b.status!==HOLD)return false;const k=reservation?String(b.date||''):seoulDate(b.createdAt);return k&&(!start||k>=start)&&(!end||k<=end)}).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))}
function renderHeld(){const root=$('activityList');if(!root)return;const list=heldActivity(),set=(id,n)=>{const e=$(id);if(e)e.textContent=`${n}건`};set('activityKpiTotal',list.length);set('activityKpiConfirmed',0);set('activityKpiPending',0);set('activityKpiCancelled',0);set('activityKpiCompleted',0);root.innerHTML=list.length?list.map(b=>`<div class="booking-item"><div class="zr4-badges"><span class="status zr-hold-status">보류</span></div><div class="row" style="margin-top:7px"><div><b>${esc(b.orgName)}</b><div class="help">접수 ${esc(seoulDate(b.createdAt)||'-')} · 예약일 ${esc(b.date||'-')}</div></div></div><div class="detail-grid"><div><b>예약자</b><br>${esc(b.managerName||'-')}</div><div><b>연락처</b><br>${esc(b.contact||'-')}</div><div><b>방문시간</b><br>${esc(b.entryTime||'--:--')} ~ ${esc(b.exitTime||'--:--')}</div><div><b>인원</b><br>유료 ${Number(b.paidCount||0)} / 인솔 ${Number(b.chaperoneCount||0)}</div></div><div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn-soft" onclick="openAdminBookingDetail('${esc(b.id)}')">자세히</button></div></div>`).join(''):'<div class="help">선택한 조회 조건에 보류 예약이 없습니다.</div>'}

function wrap(){
  const active=window.activeBookings;if(typeof active==='function'&&active!==activeWrap&&!active.__zrHold){const base=active,w=function(){const out=base.apply(this,arguments),r=Array.isArray(out)?[...out]:[],seen=new Set(r.map(x=>String(x?.id||'')));all().filter(b=>b.status===HOLD).forEach(b=>{const id=String(b.id||'');if(id&&!seen.has(id)){r.push(b);seen.add(id)}});return r};w.__zrHold=true;window.activeBookings=w;try{activeBookings=w}catch{}activeWrap=w}
  const badge=window.adminStatusBadge;if(typeof badge==='function'&&badge!==badgeWrap&&!badge.__zrHold){const base=badge,w=function(v){return v===HOLD?'<span class="status zr-hold-status">보류</span>':base.apply(this,arguments)};w.__zrHold=true;window.adminStatusBadge=w;try{adminStatusBadge=w}catch{}badgeWrap=w}
  const detail=window.openAdminBookingDetail;if(typeof detail==='function'&&detail!==detailWrap&&!detail.__zrHold){const base=detail,w=function(id){detailId=String(id||'');const out=base.apply(this,arguments);setTimeout(()=>decorateDetail(id),30);return out};w.__zrHold=true;window.openAdminBookingDetail=w;try{openAdminBookingDetail=w}catch{}detailWrap=w}
  const day=window.openDay;if(typeof day==='function'&&day!==dayWrap&&!day.__zrHold){const base=day,w=function(date){const out=base.apply(this,arguments);setTimeout(()=>decorateDay(date),30);return out};w.__zrHold=true;window.openDay=w;try{openDay=w}catch{}dayWrap=w}
  const activity=window.renderActivity;if(typeof activity==='function'&&activity!==activityWrap&&!activity.__zrHold){const base=activity,w=function(){if(filterSelect()?.value===HOLD){renderHeld();return}return base.apply(this,arguments)};w.__zrHold=true;window.renderActivity=w;try{renderActivity=w}catch{}activityWrap=w}
}
function boot(){style();modal();wrap();filterSelect();decorateCustomer();const timer=setInterval(()=>{wrap();filterSelect()},350);setTimeout(()=>clearInterval(timer),20000);['lookupBooking','checkExisting'].forEach(id=>$(id)?.addEventListener('click',()=>[80,250,700].forEach(ms=>setTimeout(decorateCustomer,ms))));document.addEventListener('click',e=>{const s=filterSelect(),b=e.target?.closest?.('#tab-activity button');if(!b||s?.value!==HOLD)return;const t=String(b.textContent||'').trim();if(t!=='조회하기'&&t!=='오늘')return;e.preventDefault();e.stopImmediatePropagation();if(t==='오늘'){const d=seoulDate(),a=$('activityStart')||$('activityStartDate'),z=$('activityEnd')||$('activityEndDate');if(a)a.value=d;if(z)z.value=d}localStorage.setItem(FILTER_KEY,HOLD);renderHeld()},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
