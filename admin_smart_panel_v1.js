(()=>{
'use strict';
if(window.__ZR_ADMIN_SMART_PANEL_V1)return;
window.__ZR_ADMIN_SMART_PANEL_V1=true;

const INQUIRY_KEY='zr_inquiries';
const REPLY_MARKER='\n\n[관리자 답변]\n';
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
let panel=null,timer=null,observer=null;

function today(){const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function allBookings(){
  try{
    const list=typeof window.bookings==='function'?window.bookings():JSON.parse(localStorage.getItem('zr_bookings')||'[]');
    return Array.isArray(list)?list.filter(b=>b&&!b.__availabilityOnly):[];
  }catch{return []}
}
function inquiryList(){
  try{const v=JSON.parse(localStorage.getItem(INQUIRY_KEY)||'[]');return Array.isArray(v)?v:[]}
  catch{return []}
}
function contentOf(item){for(const k of ['content','message','inquiry','text'])if(Object.prototype.hasOwnProperty.call(item||{},k))return String(item?.[k]??'');return ''}
function isPreview(text){return /^\[(사전답사 문의|사전답사 확정)\]/.test(String(text||''))}
function isChangeInquiry(item,text=contentOf(item)){return item?.changeRequest===true||/^\[예약 변경 요청\]/.test(String(text||''))||String(text||'').includes('\n[예약 변경 정보]\n')}
function hasReply(text){return String(text||'').lastIndexOf(REPLY_MARKER)>=0}
function isChangePending(status){return !['done','rejected'].includes(String(status||'pending'))}
function pendingChangeCount(all,inquiries){
  const shared=all.map(b=>b?.reservationChangeRequest).filter(r=>r&&typeof r==='object');
  if(shared.length)return shared.filter(r=>isChangePending(r.status)).length;
  return inquiries.filter(item=>isChangeInquiry(item)&&isChangePending(item?.changeRequestStatus)).length;
}
function cafeOrdered(b){return String(b?.mealType||'')==='cafe'||(Array.isArray(b?.cafe?.items)&&b.cafe.items.some(x=>Number(x?.qty||0)>0))}
function paymentDone(b){return !!(b?.settlement?.savedAt||b?.settlementStatus==='completed'||b?.settlementCompletedAt)}
function groupType(b){return String(b?.groupType||b?.organizationType||b?.orgType||'기타단체').trim()||'기타단체'}
function typeCounts(rows){
  const map=new Map();
  rows.forEach(b=>{const key=groupType(b);map.set(key,(map.get(key)||0)+1)});
  return [...map.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'ko'));
}
function counts(){
  const date=today(),all=allBookings();
  const rows=all.filter(b=>String(b.status||'')==='confirmed'&&String(b.date||'')===date);
  const inquiries=inquiryList();
  return {
    confirmedTeams:rows.length,
    groupTypes:typeCounts(rows),
    visitors:rows.reduce((sum,b)=>sum+Math.max(0,Number(b.paidCount||0))+Math.max(0,Number(b.chaperoneCount||0)),0),
    cafeTeams:rows.filter(cafeOrdered).length,
    paidTeams:rows.filter(paymentDone).length,
    pendingInquiry:inquiries.filter(x=>{const t=contentOf(x);return !isPreview(t)&&!isChangeInquiry(x,t)&&!hasReply(t)}).length,
    pendingChange:pendingChangeCount(all,inquiries),
    pendingPreview:inquiries.filter(x=>/^\[사전답사 문의\]/.test(contentOf(x))).length,
    pendingReservation:all.filter(b=>String(b.status||'')==='pending').length
  };
}
function injectStyle(){
  if($('zrAdminSmartPanelStyleV1'))return;
  const style=document.createElement('style');style.id='zrAdminSmartPanelStyleV1';
  style.textContent=`
    :root{--zr-admin-smart-width:292px}
    .zr-admin-smart-panel{display:none;position:fixed;inset:0 0 0 auto;z-index:64;width:var(--zr-admin-smart-width);box-sizing:border-box;background:#fff;border-left:1px solid var(--zr-brand-line);box-shadow:-3px 0 18px rgba(28,43,34,.04);font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif;overflow:hidden}
    html.zr-admin-shell-mounted .zr-admin-smart-panel{display:flex;flex-direction:column}
    .zr-admin-smart-head{min-height:var(--zr-admin-header-height);box-sizing:border-box;display:flex;align-items:center;gap:10px;padding:12px;border-bottom:1px solid var(--zr-brand-line);white-space:nowrap}
    .zr-admin-smart-copy{min-width:0;flex:1;overflow:hidden}.zr-admin-smart-title{font-size:15px;font-weight:950;color:var(--zr-brand-ink);line-height:1.2}.zr-admin-smart-sub{font-size:10px;color:#69736d;margin-top:4px;font-weight:650}
    .zr-admin-smart-body{padding:13px 12px 18px;display:grid;gap:12px;overflow:auto;scrollbar-width:thin;overscroll-behavior:contain}
    .zr-admin-smart-section{border:1px solid #e3e8e4;border-radius:15px;background:#fff;padding:13px 13px 12px}
    .zr-admin-smart-section-title{font-size:14px;font-weight:950;color:#202a24;margin-bottom:10px}.zr-admin-smart-section-help{font-size:10px;color:#667169;margin:-5px 0 10px;line-height:1.4;font-weight:650}
    .zr-admin-smart-summary{display:grid;gap:8px}.zr-admin-smart-summary-card{border:1px solid #ddd8d2;border-radius:12px;background:#fffdfb;padding:10px 11px}.zr-admin-smart-summary-row{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px;color:#414b45;font-weight:750}.zr-admin-smart-summary-row strong{font-size:14px;color:#1f2923;font-weight:950;white-space:nowrap}
    .zr-admin-smart-type-list{display:grid;gap:5px;margin-top:9px;padding-top:8px;border-top:1px dashed #d7d0c9}.zr-admin-smart-type-row{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11px;color:#5f5751;font-weight:650}.zr-admin-smart-type-row b{font-size:11px;color:#3f3935;font-weight:900}.zr-admin-smart-type-empty{font-size:10.5px;color:#6d655f;font-weight:650}
    .zr-admin-smart-pending{display:grid;gap:7px}.zr-admin-smart-pending-row{--zr-row-color:var(--zr-customer);width:100%;border:1px solid #e4e9e5!important;border-radius:10px!important;background:#fafbfa!important;box-shadow:none!important;min-height:43px;padding:8px 10px!important;display:flex!important;align-items:center!important;gap:8px!important;text-align:left!important;color:#435048!important;font-size:11px!important;font-weight:850!important}
    .zr-admin-smart-pending-row:before{content:"";width:7px;height:7px;border-radius:50%;background:var(--zr-row-color);flex:none}.zr-admin-smart-pending-row strong{margin-left:auto;font-size:16px;font-weight:950;color:var(--zr-row-color)}
    .zr-admin-smart-pending-row[data-kind="change"]{--zr-row-color:#a74412}.zr-admin-smart-pending-row[data-kind="preview"]{--zr-row-color:var(--zr-sales)}.zr-admin-smart-pending-row[data-kind="reservation"]{--zr-row-color:var(--zr-reservation)}
    .zr-admin-smart-pending-row:hover{background:#fff!important;transform:translateY(-1px)}
    .zr-admin-smart-quick{display:grid;grid-template-columns:1fr 1fr;gap:7px}.zr-admin-smart-quick button{min-height:39px;border:1px solid #e1e7e2!important;border-radius:10px!important;background:#fff!important;color:#435048!important;box-shadow:none!important;padding:7px 8px!important;font-size:10px!important;font-weight:850!important;line-height:1.3!important}.zr-admin-smart-quick button:hover{background:var(--zr-operation-soft)!important;color:var(--zr-operation)!important}.zr-admin-smart-quick button:first-child{grid-column:1/3}
    .zr-admin-smart-foot{margin-top:auto;padding:9px 12px 10px;border-top:1px solid #edf0ed;font-size:9px;color:#727b75;display:flex;justify-content:space-between;gap:8px;white-space:nowrap}
    @media(min-width:1101px){html.zr-admin-shell-mounted .zr-admin-shell-header{right:var(--zr-admin-smart-width)}html.zr-admin-shell-mounted #adminView{padding-right:calc(var(--zr-admin-smart-width) + 18px)!important;transition:padding-left .18s ease,padding-right .18s ease}}
    @media(max-width:1100px){.zr-admin-smart-panel{display:none!important}html.zr-admin-shell-mounted #adminView{padding-right:18px!important}.zr-admin-shell-header{right:0!important}}
    @media(prefers-reduced-motion:reduce){html.zr-admin-shell-mounted #adminView,.zr-admin-shell-header{transition:none!important}.zr-admin-smart-pending-row:hover{transform:none}}
  `;
  document.head.appendChild(style);
}
function navButton(id){return document.querySelector(`#zrAdminShellRail [data-zr-admin-item="${CSS.escape(id)}"]`)}
function go(id){
  const button=navButton(id);if(button){button.click();return true}
  if(id==='reservationChange'){const target=$('zrReservationChangeAdminRequestSubtab');if(target){target.click();return true}}
  return false;
}
function setText(id,value,unit){const el=$(id);if(el)el.textContent=`${value}${unit||''}`}
function renderTypes(items){
  const root=$('zrSmartGroupTypes');if(!root)return;
  root.innerHTML=items.length?items.map(([name,count])=>`<div class="zr-admin-smart-type-row"><span>${String(name).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</span><b>${count}팀</b></div>`).join(''):'<div class="zr-admin-smart-type-empty">오늘 확정된 단체가 없습니다.</div>';
}
function render(){
  if(!panel)return;const c=counts();
  setText('zrSmartConfirmedTeams',c.confirmedTeams,'팀');renderTypes(c.groupTypes);setText('zrSmartVisitors',c.visitors,'명');setText('zrSmartCafeTeams',c.cafeTeams,'팀');setText('zrSmartPaidTeams',c.paidTeams,'팀');
  setText('zrSmartInquiry',c.pendingInquiry,'');setText('zrSmartReservationChange',c.pendingChange,'');setText('zrSmartPreview',c.pendingPreview,'');setText('zrSmartPendingReservation',c.pendingReservation,'');
  const now=new Date(),time=$('zrSmartUpdated');if(time)time.textContent=`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
function build(){
  if($('zrAdminSmartPanelV1')){panel=$('zrAdminSmartPanelV1');return true}
  if(!$('zrAdminShellRail')||!$('adminView'))return false;
  injectStyle();
  panel=document.createElement('aside');panel.id='zrAdminSmartPanelV1';panel.className='zr-admin-smart-panel';panel.setAttribute('aria-label','오른쪽 운영 요약');
  panel.innerHTML=`<div class="zr-admin-smart-head"><div class="zr-admin-smart-copy"><div class="zr-admin-smart-title">운영 요약</div><div class="zr-admin-smart-sub">오늘 운영과 처리대기 현황</div></div></div><div class="zr-admin-smart-body"><section class="zr-admin-smart-section"><div class="zr-admin-smart-section-title">오늘 운영 요약</div><div class="zr-admin-smart-summary"><div class="zr-admin-smart-summary-card"><div class="zr-admin-smart-summary-row"><span>총 예약 확정 팀</span><strong id="zrSmartConfirmedTeams">0팀</strong></div><div class="zr-admin-smart-type-list" id="zrSmartGroupTypes"></div></div><div class="zr-admin-smart-summary-card"><div class="zr-admin-smart-summary-row"><span>총 방문 인원</span><strong id="zrSmartVisitors">0명</strong></div></div><div class="zr-admin-smart-summary-card"><div class="zr-admin-smart-summary-row"><span>카페 주문 단체</span><strong id="zrSmartCafeTeams">0팀</strong></div></div><div class="zr-admin-smart-summary-card"><div class="zr-admin-smart-summary-row"><span>결제 완료 팀</span><strong id="zrSmartPaidTeams">0팀</strong></div></div></div></section><section class="zr-admin-smart-section"><div class="zr-admin-smart-section-title">처리 대기 현황</div><div class="zr-admin-smart-section-help">아직 확인하거나 처리할 항목입니다.</div><div class="zr-admin-smart-pending"><button type="button" class="zr-admin-smart-pending-row" data-smart-go="inquiries" data-kind="inquiry"><span>1:1 문의</span><strong id="zrSmartInquiry">0</strong></button><button type="button" class="zr-admin-smart-pending-row" data-smart-go="reservationChange" data-kind="change"><span>예약변경요청</span><strong id="zrSmartReservationChange">0</strong></button><button type="button" class="zr-admin-smart-pending-row" data-smart-go="previewVisit" data-kind="preview"><span>사전답사 문의</span><strong id="zrSmartPreview">0</strong></button><button type="button" class="zr-admin-smart-pending-row" data-smart-go="activity" data-kind="reservation"><span>예약 대기</span><strong id="zrSmartPendingReservation">0</strong></button></div></section><section class="zr-admin-smart-section"><div class="zr-admin-smart-section-title">빠른 실행</div><div class="zr-admin-smart-quick"><button type="button" data-smart-schedule>현장스케줄 열기 ↗</button><button type="button" data-smart-go="activity">예약현황</button><button type="button" data-smart-go="meals">식사현황</button><button type="button" data-smart-go="calendar">예약 캘린더</button><button type="button" data-smart-go="schedule">스케줄 관리</button></div></section></div><div class="zr-admin-smart-foot"><span>자동 갱신</span><span id="zrSmartUpdated">--:--:--</span></div>`;
  document.body.appendChild(panel);document.documentElement.classList.add('zr-admin-smart-open');
  panel.addEventListener('click',e=>{const b=e.target.closest('[data-smart-go]');if(b){go(b.dataset.smartGo||'');return}if(e.target.closest('[data-smart-schedule]'))window.open('./schedule.html','_blank','noopener')});
  render();return true;
}
function observe(){
  if(observer)return;observer=new MutationObserver(render);observer.observe($('adminView'),{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-team-count']});
  document.addEventListener('zr:inquiry-replies-changed',render);document.addEventListener('zr:preview-visits-changed',render);document.addEventListener('zr:reservation-change-request-admin-updated',render);window.addEventListener('storage',e=>{if([INQUIRY_KEY,'zr_bookings'].includes(e.key||''))render()});
}
function ensureTimer(){if(!timer)timer=setInterval(render,3000)}
function boot(){
  ensureTimer();
  if(!build()){
    let tries=0;const wait=setInterval(()=>{if(build()||++tries>120){clearInterval(wait);if(panel)observe()}},100);return;
  }
  observe();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,0),{once:true});ensureTimer();
})();
