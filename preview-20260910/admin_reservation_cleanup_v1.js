(()=>{
'use strict';
if(window.__ZR_ADMIN_RESERVATION_CLEANUP_V1)return;
window.__ZR_ADMIN_RESERVATION_CLEANUP_V1=true;

const FV='12.17.1';
const STAFF_EMAIL='zoolung09@zoolungzoolung.com';
const KEY='zr_bookings';
const PAGE_SIZE=8;
const HISTORY_PAGE_SIZE=15;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
let installed=false,F=null,db=null,auth=null,historyUnsub=null,historyRows=[];
let mode='cleanup',page=1,historyPage=1,selected=new Set();

function toast(msg){try{if(typeof window.toast==='function')return window.toast(msg)}catch{}alert(msg)}
function readBookings(){
  try{
    const list=typeof window.bookings==='function'?window.bookings():JSON.parse(localStorage.getItem(KEY)||'[]');
    return Array.isArray(list)?list.filter(b=>b&&!b.__availabilityOnly&&!b.__legacyLocal):[];
  }catch{return []}
}
function today(){const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function monthsAgo(dateStr,months){
  const d=new Date(String(dateStr)+'T12:00:00');if(Number.isNaN(d.getTime()))return'';
  const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()-months);
  const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function settlementDone(b){return !!String(b?.settlement?.savedAt||b?.settlementCompletedAt||'').trim()}
function settlementAt(b){return String(b?.settlement?.savedAt||b?.settlementCompletedAt||'')}
function cleanupCutoff(){return monthsAgo(today(),6)}
function eligible(b){return String(b?.status||'')==='confirmed'&&!!String(b?.date||'')&&b.date<=cleanupCutoff()&&settlementDone(b)}
function dateLabel(v){
  if(!v)return'-';const d=new Date(String(v)+'T12:00:00');if(Number.isNaN(d.getTime()))return String(v);
  return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}`;
}
function stampLabel(v){
  if(!v)return'-';const d=v?.toDate?.()||new Date(v);if(Number.isNaN(d.getTime()))return'-';
  return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function filters(){return {start:$('zrCleanupStart')?.value||'',end:$('zrCleanupEnd')?.value||''}}
function historyFilters(){return {start:$('zrCleanupHistoryStart')?.value||'',end:$('zrCleanupHistoryEnd')?.value||''}}
function cleanupRows(){
  const f=filters();return readBookings().filter(eligible).filter(b=>!(f.start&&b.date<f.start)&&!(f.end&&b.date>f.end))
    .sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(a.orgName||'').localeCompare(String(b.orgName||''),'ko'));
}
function filteredHistory(){
  const f=historyFilters();return historyRows.filter(x=>{
    const d=String(x.cleanupDate||'');if(f.start&&(!d||d<f.start))return false;if(f.end&&(!d||d>f.end))return false;return true;
  }).sort((a,b)=>String(b.cleanupIso||'').localeCompare(String(a.cleanupIso||'')));
}
function pageNumbers(current,pages){
  if(pages<=7)return Array.from({length:pages},(_,i)=>i+1);
  const keep=new Set([1,pages,current-1,current,current+1]),valid=[...keep].filter(n=>n>=1&&n<=pages).sort((a,b)=>a-b),out=[];let prev=0;
  for(const n of valid){if(prev&&n-prev>1)out.push('…');out.push(n);prev=n}return out;
}
function pagerHtml(kind,current,pages){
  const attr=kind==='history'?'data-zr-cleanup-history-page':'data-zr-cleanup-page';
  const nums=pageNumbers(current,pages).map(n=>n==='…'?'<span class="zr-cleanup-page-gap">…</span>':`<button type="button" class="${n===current?'btn-primary':'btn-soft'}" ${attr}="${n}" ${n===current?'aria-current="page"':''}>${n}</button>`).join('');
  return `<div class="zr-cleanup-pagination"><button type="button" class="btn-soft" ${attr}="prev" ${current<=1?'disabled':''}>이전</button>${nums}<button type="button" class="btn-soft" ${attr}="next" ${current>=pages?'disabled':''}>다음</button></div>`;
}
function cardHtml(b){
  const id=String(b.id),paid=Number(b.paidCount||0),chap=Number(b.chaperoneCount||0),checked=selected.has(id);
  return `<article class="zr-cleanup-card" data-booking="${esc(id)}">
    <label class="zr-cleanup-check"><input type="checkbox" data-zr-cleanup-select="${esc(id)}" ${checked?'checked':''}><span></span></label>
    <div class="zr-cleanup-main"><div class="zr-cleanup-title"><b>${esc(b.orgName||'단체명 미입력')}</b><span>방문 ${esc(dateLabel(b.date))}</span></div>
      <div class="zr-cleanup-meta"><span>유료 ${paid}명</span><span>인솔 ${chap}명</span><span>총 ${paid+chap}명</span><span>실제결제 저장 ${esc(stampLabel(settlementAt(b)))}</span><span>예약번호 ${esc(id)}</span></div>
    </div><button type="button" class="btn-gray" data-zr-cleanup-one="${esc(id)}">정리</button>
  </article>`;
}
function historyHtml(x){
  const total=Number(x.paidCount||0)+Number(x.chaperoneCount||0);
  return `<article class="zr-cleanup-history-card"><div class="zr-cleanup-history-date"><b>${esc(stampLabel(x.cleanupAt||x.cleanupIso))}</b><span>${esc(x.cleanupMode||'정리')}</span></div><div class="zr-cleanup-history-main"><div><b>${esc(x.orgName||'단체명 미입력')}</b><span>방문 ${esc(dateLabel(x.visitDate))}</span></div><small>총 ${total}명 · 예약번호 ${esc(x.reservationId||x.id||'-')} · 처리 ${esc(x.cleanedBy||'-')}</small></div></article>`;
}
function renderCleanup(){
  const rows=cleanupRows(),pages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));page=Math.min(Math.max(1,page),pages);
  const ids=new Set(rows.map(x=>String(x.id)));selected=new Set([...selected].filter(id=>ids.has(id)));
  const start=(page-1)*PAGE_SIZE,shown=rows.slice(start,start+PAGE_SIZE),root=$('zrCleanupList');
  if($('zrCleanupCount'))$('zrCleanupCount').textContent=`정리 대상 ${rows.length}건 · 선택 ${selected.size}건`;
  if($('zrCleanupCutoff'))$('zrCleanupCutoff').textContent=`${dateLabel(cleanupCutoff())} 이전 방문 + 실제결제 완료`;
  if(root)root.innerHTML=shown.length?shown.map(cardHtml).join(''):'<div class="zr-cleanup-empty"><b>현재 정리 가능한 예약이 없습니다.</b><span>방문 후 6개월이 지나고 실제결제가 저장된 확정 예약만 표시합니다.</span></div>';
  if($('zrCleanupPager'))$('zrCleanupPager').innerHTML=pagerHtml('cleanup',page,pages);
  if($('zrCleanupSelected'))$('zrCleanupSelected').disabled=!selected.size;
  if($('zrCleanupAllResult'))$('zrCleanupAllResult').disabled=!rows.length;
  const pageIds=shown.map(x=>String(x.id)),allChecked=pageIds.length&&pageIds.every(id=>selected.has(id));
  if($('zrCleanupSelectPage')){$('zrCleanupSelectPage').checked=!!allChecked;$('zrCleanupSelectPage').disabled=!pageIds.length}
}
function renderHistory(){
  const rows=filteredHistory(),pages=Math.max(1,Math.ceil(rows.length/HISTORY_PAGE_SIZE));historyPage=Math.min(Math.max(1,historyPage),pages);
  const start=(historyPage-1)*HISTORY_PAGE_SIZE,shown=rows.slice(start,start+HISTORY_PAGE_SIZE),root=$('zrCleanupHistoryList');
  if($('zrCleanupHistoryCount'))$('zrCleanupHistoryCount').textContent=`정리 내역 ${rows.length}건`;
  if(root)root.innerHTML=shown.length?shown.map(historyHtml).join(''):'<div class="zr-cleanup-empty"><b>정리 내역이 없습니다.</b><span>과거 예약을 정리하면 최소 확인 정보만 여기에 남습니다.</span></div>';
  if($('zrCleanupHistoryPager'))$('zrCleanupHistoryPager').innerHTML=pagerHtml('history',historyPage,pages);
}
function setMode(next){
  mode=next==='history'?'history':'cleanup';
  $('zrCleanupPanel')?.classList.toggle('hidden',mode!=='cleanup');$('zrCleanupHistoryPanel')?.classList.toggle('hidden',mode!=='history');
  if($('zrCleanupSubtab'))$('zrCleanupSubtab').className=mode==='cleanup'?'btn-primary':'btn-gray';
  if($('zrCleanupHistorySubtab'))$('zrCleanupHistorySubtab').className=mode==='history'?'btn-primary':'btn-gray';
  if(mode==='cleanup')renderCleanup();else{startHistory();renderHistory()}
}
function bridge(){return window.zrReservationFirebase||null}
function isStaff(){const z=bridge();return !!z?.isStaff?.()&&String(z.auth?.currentUser?.email||'').toLowerCase()===STAFF_EMAIL.toLowerCase()}
async function ensureFirebase(){
  if(F&&db&&auth)return true;const z=bridge();if(!z?.db||!z?.auth)return false;
  F=await import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`);db=z.db;auth=z.auth;return true;
}
async function startHistory(){
  if(historyUnsub||!await ensureFirebase()||!isStaff())return;
  try{
    const q=F.query(F.collection(db,'scheduleGroups'),F.where('archived','==',true));
    historyUnsub=F.onSnapshot(q,snap=>{
      historyRows=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.archiveType==='reservationCleanup');renderHistory();
    },e=>{console.error('cleanup history',e);toast('정리 내역 DB 연결을 확인해주세요.')});
  }catch(e){console.error(e)}
}
function stopHistory(){if(historyUnsub){historyUnsub();historyUnsub=null}}
function localRemove(ids){
  const set=new Set(ids.map(String)),next=readBookings().filter(b=>!set.has(String(b.id)));
  try{if(typeof window.setStore==='function')window.setStore(KEY,next)}catch(e){console.debug('cleanup local sync',e)}
}
function confirmCleanup(count){
  if(!confirm(`${count}건의 과거 예약을 영구 정리합니다.\n엑셀 백업 여부를 먼저 확인해주세요.\n\n계속하시겠습니까?`))return false;
  return confirm(`마지막 확인입니다.\n예약 본문과 예약 가능 데이터는 삭제되며 되돌릴 수 없습니다.\n정리 내역에는 최소 정보만 남습니다.\n\n${count}건을 정리할까요?`);
}
async function cleanupMany(bookings,cleanupMode){
  const items=(Array.isArray(bookings)?bookings:[]).filter(eligible);if(!items.length)return toast('정리 가능한 예약이 없습니다.');
  if(!confirmCleanup(items.length))return;
  if(!await ensureFirebase()||!isStaff())return toast('관리자 DB 로그인이 필요합니다. 관리자에서 한 번 다시 로그인해주세요.');
  const buttons=[...document.querySelectorAll('#tab-cleanup button')];buttons.forEach(b=>b.disabled=true);
  try{
    const chunks=[];for(let i=0;i<items.length;i+=100)chunks.push(items.slice(i,i+100));
    for(const chunk of chunks){
      const batch=F.writeBatch(db),iso=new Date().toISOString(),date=iso.slice(0,10),cleanedBy=String(auth.currentUser?.email||STAFF_EMAIL);
      chunk.forEach(b=>{
        const id=String(b.id),history={archived:true,archiveType:'reservationCleanup',reservationId:id,orgName:String(b.orgName||''),visitDate:String(b.date||''),paidCount:Number(b.paidCount||0),chaperoneCount:Number(b.chaperoneCount||0),settlementSavedAt:settlementAt(b),cleanupMode:String(cleanupMode||'정리'),cleanupDate:date,cleanupIso:iso,cleanupAt:F.serverTimestamp(),cleanedBy};
        batch.set(F.doc(db,'scheduleGroups',id),history);
        batch.delete(F.doc(db,'reservations',id));
        batch.delete(F.doc(db,'reservationAvailability',id));
      });
      await batch.commit();
    }
    localRemove(items.map(x=>String(x.id)));selected.clear();page=1;renderCleanup();startHistory();toast(`${items.length}건의 과거 예약을 정리했습니다.`);
  }catch(e){console.error('reservation cleanup',e);toast('예약 정리에 실패했습니다. DB 권한 또는 연결 상태를 확인해주세요. 데이터는 화면에서 임의로 삭제하지 않았습니다.');renderCleanup()}
  finally{buttons.forEach(b=>b.disabled=false);renderCleanup()}
}
function setPage(next){const rows=cleanupRows(),pages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));if(next==='prev')page=Math.max(1,page-1);else if(next==='next')page=Math.min(pages,page+1);else page=Math.min(pages,Math.max(1,Number(next)||1));renderCleanup();$('zrCleanupList')?.scrollIntoView?.({block:'start'})}
function setHistoryPage(next){const rows=filteredHistory(),pages=Math.max(1,Math.ceil(rows.length/HISTORY_PAGE_SIZE));if(next==='prev')historyPage=Math.max(1,historyPage-1);else if(next==='next')historyPage=Math.min(pages,historyPage+1);else historyPage=Math.min(pages,Math.max(1,Number(next)||1));renderHistory();$('zrCleanupHistoryList')?.scrollIntoView?.({block:'start'})}
function openTab(){
  document.querySelectorAll('#adminView section[id^="tab-"]').forEach(s=>s.classList.add('hidden'));
  document.querySelectorAll('#adminView .admin-tabs button').forEach(b=>b.className='btn-gray');
  $('tab-cleanup')?.classList.remove('hidden');if($('zrCleanupTabBtn'))$('zrCleanupTabBtn').className='btn-primary';setMode('cleanup');
}
function installStyle(){
  if($('zrCleanupStyleV1'))return;const s=document.createElement('style');s.id='zrCleanupStyleV1';s.textContent=`
#tab-cleanup{margin-top:14px;color:var(--text,#1f2a23)}#zrCleanupInnerTabs{display:inline-flex;align-items:center;gap:4px;margin:0 0 14px;padding:4px;background:#eef3ef;border:1px solid #d7e1da;border-radius:12px;box-shadow:inset 0 1px 2px rgba(30,50,36,.04)}#zrCleanupInnerTabs button{position:relative;min-width:108px;height:38px;padding:0 16px!important;border:1px solid transparent!important;border-radius:9px!important;background:transparent!important;color:#66736b!important;box-shadow:none!important;font-size:13px!important;font-weight:800!important;line-height:1!important}#zrCleanupInnerTabs button.btn-primary{background:#fff!important;color:#2f6b4f!important;border-color:#bad1c1!important;box-shadow:0 2px 6px rgba(30,50,36,.08)!important}#zrCleanupInnerTabs button.btn-primary::after{content:'';position:absolute;left:18px;right:18px;bottom:4px;height:2px;border-radius:999px;background:#2f6b4f}
.zr-cleanup-panel{border:1px solid var(--line,#dfe5df);border-radius:16px;background:#fff;padding:20px 22px 18px;box-shadow:0 4px 16px rgba(30,50,36,.04)}.zr-cleanup-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:18px}.zr-cleanup-head h2{margin:0 0 5px;font-size:22px}.zr-cleanup-help,.zr-cleanup-head span{font-size:12px;color:var(--muted,#6d756f);line-height:1.5}.zr-cleanup-filters{display:grid;grid-template-columns:1fr 1fr auto;gap:10px;align-items:end;margin-bottom:10px}.zr-cleanup-field{display:flex;flex-direction:column;gap:5px}.zr-cleanup-field label{font-size:12px;font-weight:800}.zr-cleanup-field input{height:44px;box-sizing:border-box}.zr-cleanup-filters>button{height:44px;min-width:130px}.zr-cleanup-tools{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:12px 0}.zr-cleanup-selectall{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:800}.zr-cleanup-toolbuttons{display:flex;gap:7px;flex-wrap:wrap}.zr-cleanup-list,.zr-cleanup-history-list{display:grid;gap:8px}.zr-cleanup-card{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;border:1px solid var(--line,#dfe5df);border-radius:14px;padding:12px 13px;background:#fff}.zr-cleanup-check input{width:18px;height:18px}.zr-cleanup-title{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.zr-cleanup-title>b{font-size:15px}.zr-cleanup-title>span{font-size:11px;color:var(--muted,#6d756f)}.zr-cleanup-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:7px}.zr-cleanup-meta span{padding:5px 7px;border:1px solid #e2e8e3;background:#f6f8f6;border-radius:9px;font-size:10.5px;color:#56645c}.zr-cleanup-empty{padding:34px 12px;text-align:center;border:1px dashed var(--line,#dfe5df);border-radius:14px;color:var(--muted,#6d756f)}.zr-cleanup-empty b,.zr-cleanup-empty span{display:block}.zr-cleanup-empty span{margin-top:5px;font-size:11px}.zr-cleanup-pagination{display:flex;justify-content:center;align-items:center;gap:6px;flex-wrap:wrap;margin:16px 0 4px}.zr-cleanup-pagination button{min-width:38px;height:38px;padding:0 11px}.zr-cleanup-pagination button:disabled{opacity:.45;cursor:default}.zr-cleanup-page-gap{display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:38px;color:var(--muted,#6d756f);font-weight:800}.zr-cleanup-history-card{display:grid;grid-template-columns:170px minmax(0,1fr);gap:14px;border:1px solid var(--line,#dfe5df);border-radius:14px;padding:12px 13px}.zr-cleanup-history-date{display:flex;flex-direction:column;gap:4px}.zr-cleanup-history-date b{font-size:12px}.zr-cleanup-history-date span{font-size:10px;color:#2f6b4f;font-weight:900}.zr-cleanup-history-main>div{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.zr-cleanup-history-main>div b{font-size:14px}.zr-cleanup-history-main>div span,.zr-cleanup-history-main small{font-size:11px;color:var(--muted,#6d756f)}.zr-cleanup-history-main small{display:block;margin-top:6px}
@media(max-width:720px){#zrCleanupInnerTabs{display:grid;grid-template-columns:1fr 1fr;width:100%;box-sizing:border-box}#zrCleanupInnerTabs button{width:100%;min-width:0}.zr-cleanup-panel{padding:16px 14px}.zr-cleanup-filters{grid-template-columns:1fr}.zr-cleanup-filters>button{width:100%}.zr-cleanup-card{grid-template-columns:auto minmax(0,1fr)}.zr-cleanup-card>button{grid-column:1/3;width:100%}.zr-cleanup-history-card{grid-template-columns:1fr}.zr-cleanup-tools{align-items:stretch;flex-direction:column}.zr-cleanup-toolbuttons{display:grid;grid-template-columns:1fr 1fr}.zr-cleanup-toolbuttons button{width:100%}}
`;document.head.appendChild(s);
}
function ensureUi(){
  if(installed)return true;const tabs=document.querySelector('#adminView .admin-tabs'),admin=$('adminView');if(!tabs||!admin)return false;installStyle();
  let btn=$('zrCleanupTabBtn');if(!btn){btn=document.createElement('button');btn.id='zrCleanupTabBtn';btn.className='btn-gray';btn.textContent='과거 예약 정리';const activity=[...tabs.querySelectorAll('button')].find(x=>(x.textContent||'').trim()==='예약 현황');activity?.after(btn);if(!activity)tabs.appendChild(btn)}
  let sec=$('tab-cleanup');if(!sec){sec=document.createElement('section');sec.id='tab-cleanup';sec.className='hidden';sec.innerHTML=`
    <div id="zrCleanupInnerTabs"><button type="button" class="btn-primary" id="zrCleanupSubtab">예약 정리</button><button type="button" class="btn-gray" id="zrCleanupHistorySubtab">정리 내역</button></div>
    <div class="zr-cleanup-panel" id="zrCleanupPanel"><div class="zr-cleanup-head"><div><h2>과거 예약 정리</h2><div class="zr-cleanup-help">방문일 기준 6개월이 지나고 실제결제가 저장된 확정 예약만 정리할 수 있습니다.<br>엑셀 백업을 확인한 뒤 사용해주세요.</div></div><span id="zrCleanupCount">정리 대상 0건 · 선택 0건</span></div>
      <div class="zr-cleanup-filters"><div class="zr-cleanup-field"><label>방문일 시작</label><input type="date" id="zrCleanupStart"></div><div class="zr-cleanup-field"><label>방문일 종료</label><input type="date" id="zrCleanupEnd"></div><button type="button" class="btn-primary" id="zrCleanupApply">조회하기</button></div><div class="zr-cleanup-help">정리 가능 기준: <b id="zrCleanupCutoff"></b></div>
      <div class="zr-cleanup-tools"><label class="zr-cleanup-selectall"><input type="checkbox" id="zrCleanupSelectPage"> 현재 페이지 전체 선택</label><div class="zr-cleanup-toolbuttons"><button type="button" class="btn-gray" id="zrCleanupSelected" disabled>선택 정리</button><button type="button" class="btn-soft" id="zrCleanupAllResult" disabled>조회 결과 전체 정리</button></div></div><div class="zr-cleanup-list" id="zrCleanupList"></div><div id="zrCleanupPager"></div>
    </div>
    <div class="zr-cleanup-panel hidden" id="zrCleanupHistoryPanel"><div class="zr-cleanup-head"><div><h2>정리 내역</h2><div class="zr-cleanup-help">영구 정리된 예약의 최소 확인 정보만 보관합니다. 연락처·문의내용 등 개인정보는 남기지 않습니다.</div></div><span id="zrCleanupHistoryCount">정리 내역 0건</span></div>
      <div class="zr-cleanup-filters"><div class="zr-cleanup-field"><label>정리일 시작</label><input type="date" id="zrCleanupHistoryStart"></div><div class="zr-cleanup-field"><label>정리일 종료</label><input type="date" id="zrCleanupHistoryEnd"></div><button type="button" class="btn-primary" id="zrCleanupHistoryApply">조회하기</button></div><div class="zr-cleanup-history-list" id="zrCleanupHistoryList"></div><div id="zrCleanupHistoryPager"></div>
    </div>`;admin.appendChild(sec)}
  btn.onclick=openTab;$('zrCleanupSubtab').onclick=()=>setMode('cleanup');$('zrCleanupHistorySubtab').onclick=()=>setMode('history');
  $('zrCleanupApply').onclick=()=>{page=1;selected.clear();renderCleanup()};$('zrCleanupHistoryApply').onclick=()=>{historyPage=1;renderHistory()};
  $('zrCleanupSelectPage').onchange=e=>{const rows=cleanupRows(),start=(page-1)*PAGE_SIZE,ids=rows.slice(start,start+PAGE_SIZE).map(x=>String(x.id));ids.forEach(id=>e.target.checked?selected.add(id):selected.delete(id));renderCleanup()};
  $('zrCleanupSelected').onclick=()=>cleanupMany(cleanupRows().filter(b=>selected.has(String(b.id))),'선택 정리');$('zrCleanupAllResult').onclick=()=>cleanupMany(cleanupRows(),'조회 결과 전체 정리');
  $('zrCleanupList').onclick=e=>{const btn=e.target?.closest?.('[data-zr-cleanup-one]');if(btn){const b=cleanupRows().find(x=>String(x.id)===String(btn.dataset.zrCleanupOne));if(b)cleanupMany([b],'개별 정리')}};
  $('zrCleanupList').onchange=e=>{const box=e.target?.closest?.('[data-zr-cleanup-select]');if(!box)return;const id=String(box.dataset.zrCleanupSelect||'');box.checked?selected.add(id):selected.delete(id);renderCleanup()};
  $('zrCleanupPager').onclick=e=>{const b=e.target?.closest?.('[data-zr-cleanup-page]');if(b&&!b.disabled)setPage(b.dataset.zrCleanupPage)};$('zrCleanupHistoryPager').onclick=e=>{const b=e.target?.closest?.('[data-zr-cleanup-history-page]');if(b&&!b.disabled)setHistoryPage(b.dataset.zrCleanupHistoryPage)};
  window.addEventListener('storage',e=>{if(e.key===KEY&&!$('tab-cleanup')?.classList.contains('hidden'))renderCleanup()});
  installed=true;renderCleanup();return true;
}
function boot(){if(ensureUi())return;let tries=0;const timer=setInterval(()=>{if(ensureUi()||++tries>80)clearInterval(timer)},150)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',boot,{once:true});
})();