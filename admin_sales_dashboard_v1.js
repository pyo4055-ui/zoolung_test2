(()=>{
'use strict';
if(window.__ZR_ADMIN_SALES_DASHBOARD_V1)return;
window.__ZR_ADMIN_SALES_DASHBOARD_V1=true;

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>`${Math.round(Number(v||0)).toLocaleString('ko-KR')}원`;
const PALETTE=['#2f6b4f','#6f9b7c','#9db8a5','#c2d3c7','#9b725e','#c4a58f','#806b5d','#8e9c93','#b8aa88','#6e8174'];
const KNOWN_SECTIONS=['tab-today','tab-calendar','tab-schedule','tab-warning','tab-activity','tab-meals','tab-cleanup','tab-inquiries','tab-preview-visit','zrGuideAdminSection','tab-outsourcing','tab-menuadmin','tab-settings'];
let mode='monthly';

function allBookings(){
  try{
    const list=typeof window.bookings==='function'?window.bookings():JSON.parse(localStorage.getItem('zr_bookings')||'[]');
    return Array.isArray(list)?list.filter(b=>b&&!b.__availabilityOnly):[];
  }catch{return []}
}
function currentMonth(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function shiftMonth(ym,delta){
  const m=String(ym||'').match(/^(\d{4})-(\d{2})$/);if(!m)return currentMonth();
  const d=new Date(Number(m[1]),Number(m[2])-1+delta,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function monthLabel(ym){const m=String(ym||'').match(/^(\d{4})-(\d{2})$/);return m?`${m[1]}년 ${Number(m[2])}월`:String(ym||'-')}
function extraBreakdown(st={}){
  const picks=[
    ['상품샵',['actualShopAmount','shopAmount','productAmount']],
    ['여권',['actualPassportAmount','passportAmount']],
    ['카누',['actualCanoeAmount','canoeAmount']],
    ['기타',['actualOtherAmount','otherAmount','extraAmount','additionalAmount']]
  ];
  const out={shop:0,passport:0,canoe:0,other:0,total:0,hasField:false};
  const map={상품샵:'shop',여권:'passport',카누:'canoe',기타:'other'};
  picks.forEach(([label,keys])=>{
    const key=keys.find(k=>Object.prototype.hasOwnProperty.call(st,k));
    if(!key)return;out.hasField=true;const v=Math.max(0,Number(st[key]||0));out[map[label]]=v;out.total+=v;
  });
  return out;
}
function salesRow(b){
  const st=b?.settlement||{};const ex=extraBreakdown(st);
  const ticket=Math.max(0,Number(st.ticketAmount||0)),cafe=Math.max(0,Number(st.actualCafeAmount||0));
  const total=ticket+cafe+ex.total;
  return {booking:b,st,date:String(b?.date||''),ticket,cafe,extra:ex.total,total,extraMeta:ex,
    group:String(b?.groupType||'미분류').trim()||'미분류',
    vendorId:String(st.vendorId||b?.outsourcingVendorId||'self'),
    vendorName:String(st?.vendorSnapshot?.name||b?.outsourcingVendorSnapshot?.name||(st.vendorId==='self'?'자체':'미분류')).trim()||'미분류'};
}
function rowsForMonth(ym){
  return allBookings().filter(b=>{
    if(!b?.settlement?.savedAt)return false;
    if(['cancelled','rejected'].includes(String(b.status||'')))return false;
    return String(b.date||'').slice(0,7)===ym;
  }).map(salesRow);
}
function aggregate(rows){
  return rows.reduce((a,r)=>{a.total+=r.total;a.ticket+=r.ticket;a.cafe+=r.cafe;a.extra+=r.extra;a.count++;a.paid+=Math.max(0,Number(r.st.actualPaidCount||0))+Math.max(0,Number(r.st.actualPaidChaperone||0));a.hasExtra=a.hasExtra||r.extraMeta.hasField;return a},{total:0,ticket:0,cafe:0,extra:0,count:0,paid:0,hasExtra:false});
}
function groupShares(rows,valueFn=()=>1){
  const m=new Map();rows.forEach(r=>m.set(r.group,(m.get(r.group)||0)+Math.max(0,Number(valueFn(r)||0))));
  return [...m.entries()].map(([name,value])=>({name,value})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value);
}
function vendorShares(rows){
  const m=new Map();rows.filter(r=>r.vendorId&&r.vendorId!=='self').forEach(r=>m.set(r.vendorName,(m.get(r.vendorName)||0)+r.total));
  return [...m.entries()].map(([name,value])=>({name,value})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value);
}
function pie(data,empty='집계 데이터가 없습니다.'){
  const total=data.reduce((s,x)=>s+x.value,0);
  if(!total)return `<div class="zr-sales-empty-pie"><div class="zr-sales-pie zr-sales-pie-empty"></div><div class="help">${esc(empty)}</div></div>`;
  let acc=0;const parts=[];
  data.forEach((x,i)=>{const start=acc/total*100;acc+=x.value;const end=acc/total*100;parts.push(`${PALETTE[i%PALETTE.length]} ${start}% ${end}%`)});
  const legend=data.map((x,i)=>{const pct=x.value/total*100;return `<div class="zr-sales-legend-row"><span class="zr-sales-dot" style="background:${PALETTE[i%PALETTE.length]}"></span><span>${esc(x.name)}</span><b>${pct.toFixed(1)}%</b><small>${Number.isInteger(x.value)?`${x.value.toLocaleString('ko-KR')}`:money(x.value)}</small></div>`}).join('');
  return `<div class="zr-sales-pie-wrap"><div class="zr-sales-pie" style="background:conic-gradient(${parts.join(',')})"></div><div class="zr-sales-legend">${legend}</div></div>`;
}
function metricCard(label,value,sub=''){return `<div class="zr-sales-kpi"><span>${esc(label)}</span><strong>${esc(value)}</strong>${sub?`<small>${esc(sub)}</small>`:''}</div>`}
function changeText(cur,base,isMoney=true){
  const diff=cur-base;if(base===0)return {diff:isMoney?money(diff):`${diff.toLocaleString('ko-KR')}건`,rate:cur===0?'0.0%':'신규',cls:diff>0?'up':diff<0?'down':''};
  const rate=diff/base*100;return {diff:`${diff>0?'+':''}${isMoney?money(diff):`${diff.toLocaleString('ko-KR')}건`}`,rate:`${rate>0?'+':''}${rate.toFixed(1)}%`,cls:rate>0?'up':rate<0?'down':''};
}
function compareRow(label,cur,base,isMoney=true){const c=changeText(cur,base,isMoney);return `<tr><th>${esc(label)}</th><td>${isMoney?money(cur):`${cur.toLocaleString('ko-KR')}건`}</td><td>${isMoney?money(base):`${base.toLocaleString('ko-KR')}건`}</td><td class="${c.cls}">${esc(c.diff)}</td><td class="${c.cls}">${esc(c.rate)}</td></tr>`}

function injectStyle(){
  if($('zrAdminSalesDashboardV1Style'))return;
  const s=document.createElement('style');s.id='zrAdminSalesDashboardV1Style';s.textContent=`
  #tab-sales-dashboard{box-sizing:border-box;min-height:100%;padding:0 0 24px}
  #tab-sales-dashboard.hidden{display:none!important}
  #tab-sales-dashboard .zr-sales-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:14px}
  #tab-sales-dashboard .zr-sales-title{font-size:28px;font-weight:950;letter-spacing:-.04em;color:#211f1c}
  #tab-sales-dashboard .zr-sales-subtitle{margin-top:5px;font-size:12px;color:#778078}
  #tab-sales-dashboard .zr-sales-subtabs{display:inline-flex;align-items:center;gap:4px;margin:0 0 14px;padding:4px;background:#eef3ef;border:1px solid #d7e1da;border-radius:12px;max-width:100%;overflow-x:auto}
  #tab-sales-dashboard .zr-sales-subtabs button{position:relative;min-width:122px;height:38px;padding:0 16px;border:1px solid transparent;border-radius:9px;background:transparent;color:#66736b;box-shadow:none;font-size:13px;font-weight:850;white-space:nowrap}
  #tab-sales-dashboard .zr-sales-subtabs button.active{background:#fff;color:#2f6b4f;border-color:#bad1c1;box-shadow:0 2px 6px rgba(30,50,36,.08)}
  #tab-sales-dashboard .zr-sales-subtabs button.active:after{content:'';position:absolute;left:18px;right:18px;bottom:4px;height:2px;border-radius:999px;background:#2f6b4f}
  #tab-sales-dashboard .zr-sales-panel{display:none}#tab-sales-dashboard .zr-sales-panel.active{display:block}
  #tab-sales-dashboard .zr-sales-filter{display:flex;align-items:end;gap:10px;flex-wrap:wrap;margin-bottom:14px;padding:14px;border:1px solid #e1e6e2;border-radius:14px;background:#fff}
  #tab-sales-dashboard .zr-sales-filter label{display:flex;flex-direction:column;gap:5px;font-size:12px;font-weight:800;color:#566159}
  #tab-sales-dashboard .zr-sales-filter input{min-height:40px;box-sizing:border-box}
  #tab-sales-dashboard .zr-sales-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:14px}
  #tab-sales-dashboard .zr-sales-kpi{min-height:98px;padding:16px;border:1px solid #e0e5e1;border-radius:15px;background:#fff;box-sizing:border-box;box-shadow:0 2px 8px rgba(30,50,36,.035)}
  #tab-sales-dashboard .zr-sales-kpi span{display:block;font-size:12px;font-weight:800;color:#7b827d}
  #tab-sales-dashboard .zr-sales-kpi strong{display:block;margin-top:7px;font-size:20px;line-height:1.15;color:#24352b;letter-spacing:-.03em}
  #tab-sales-dashboard .zr-sales-kpi small{display:block;margin-top:6px;font-size:10px;color:#8a918c;line-height:1.4}
  #tab-sales-dashboard .zr-sales-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  #tab-sales-dashboard .zr-sales-card{padding:16px;border:1px solid #e0e5e1;border-radius:15px;background:#fff;min-width:0}
  #tab-sales-dashboard .zr-sales-card h3{margin:0 0 4px;font-size:15px;color:#29372f}
  #tab-sales-dashboard .zr-sales-card .help{margin-bottom:12px}
  #tab-sales-dashboard .zr-sales-pie-wrap{display:grid;grid-template-columns:minmax(150px,190px) 1fr;gap:18px;align-items:center}
  #tab-sales-dashboard .zr-sales-pie{width:170px;aspect-ratio:1;border-radius:50%;margin:auto;position:relative}
  #tab-sales-dashboard .zr-sales-pie:after{content:'';position:absolute;inset:31%;border-radius:50%;background:#fff;box-shadow:0 0 0 1px rgba(30,50,36,.04)}
  #tab-sales-dashboard .zr-sales-pie-empty{background:#edf1ee}
  #tab-sales-dashboard .zr-sales-empty-pie{text-align:center;padding:8px}
  #tab-sales-dashboard .zr-sales-legend{display:flex;flex-direction:column;gap:7px;min-width:0}
  #tab-sales-dashboard .zr-sales-legend-row{display:grid;grid-template-columns:10px minmax(75px,1fr) 54px minmax(55px,auto);gap:7px;align-items:center;font-size:11px;color:#4f5a53}
  #tab-sales-dashboard .zr-sales-legend-row b{text-align:right;color:#2f6b4f}.zr-sales-legend-row small{text-align:right;color:#8a918c}
  #tab-sales-dashboard .zr-sales-dot{width:9px;height:9px;border-radius:50%}
  #tab-sales-dashboard .zr-sales-compare-table,#tab-sales-dashboard .zr-sales-cafe-table{width:100%;border-collapse:separate;border-spacing:0;font-size:12px}
  #tab-sales-dashboard table th,#tab-sales-dashboard table td{padding:11px 10px;border-bottom:1px solid #edf0ee;text-align:right;white-space:nowrap}
  #tab-sales-dashboard table th:first-child,#tab-sales-dashboard table td:first-child{text-align:left}
  #tab-sales-dashboard thead th{background:#f7f9f7;color:#66736b;font-size:11px;font-weight:850}
  #tab-sales-dashboard tbody th{color:#4c5750}.zr-sales-compare-table .up{color:#25704c;font-weight:850}.zr-sales-compare-table .down{color:#a84c45;font-weight:850}
  #tab-sales-dashboard .zr-sales-table-scroll{overflow:auto;max-height:470px;border:1px solid #e5e9e6;border-radius:12px}
  #tab-sales-dashboard .zr-sales-note{margin-top:12px;padding:10px 12px;border-radius:10px;background:#f6f8f6;color:#778078;font-size:11px;line-height:1.55}
  @media(max-width:1100px){#tab-sales-dashboard .zr-sales-kpis{grid-template-columns:repeat(3,1fr)}}
  @media(max-width:800px){#tab-sales-dashboard .zr-sales-grid2{grid-template-columns:1fr}#tab-sales-dashboard .zr-sales-pie-wrap{grid-template-columns:1fr}.zr-sales-pie{width:150px!important}}
  @media(max-width:620px){#tab-sales-dashboard .zr-sales-kpis{grid-template-columns:1fr 1fr}#tab-sales-dashboard .zr-sales-title{font-size:24px}#tab-sales-dashboard .zr-sales-subtabs{display:flex;width:100%;box-sizing:border-box}#tab-sales-dashboard .zr-sales-subtabs button{min-width:max-content}#tab-sales-dashboard .zr-sales-legend-row{grid-template-columns:10px 1fr 48px 58px}}
  `;document.head.appendChild(s);
}
function ensureSection(){
  if($('tab-sales-dashboard'))return $('tab-sales-dashboard');
  const admin=$('adminView');if(!admin)return null;injectStyle();
  const sec=document.createElement('section');sec.id='tab-sales-dashboard';sec.className='hidden';
  sec.innerHTML=`<div class="zr-sales-head"><div><div class="zr-sales-title">매출 현황</div><div class="zr-sales-subtitle">실제결제 저장완료 · 방문일 기준 월간 매출 리포트</div></div></div>
  <div class="zr-sales-subtabs">
    <button type="button" class="active" data-zr-sales-mode="monthly">월매출 현황</button>
    <button type="button" data-zr-sales-mode="prev">전월매출 현황</button>
    <button type="button" data-zr-sales-mode="year">전년매출 현황</button>
    <button type="button" data-zr-sales-mode="cafe">단체 카페매출</button>
  </div>
  <div id="zrSalesMonthlyPanel" class="zr-sales-panel active"></div>
  <div id="zrSalesPrevPanel" class="zr-sales-panel"></div>
  <div id="zrSalesYearPanel" class="zr-sales-panel"></div>
  <div id="zrSalesCafePanel" class="zr-sales-panel"></div>`;
  const anchor=$('tab-outsourcing');if(anchor?.parentElement)anchor.parentElement.insertBefore(sec,anchor);else admin.appendChild(sec);
  sec.querySelector('.zr-sales-subtabs').addEventListener('click',e=>{const b=e.target.closest('[data-zr-sales-mode]');if(!b)return;mode=b.dataset.zrSalesMode;selectMode(mode)});
  return sec;
}
function ensureInputs(){
  const ym=currentMonth();
  const monthly=$('zrSalesMonthlyPanel');if(monthly&&!$('zrSalesMonth'))monthly.innerHTML=`<div class="zr-sales-filter"><label>기준 월<input type="month" id="zrSalesMonth" value="${ym}"></label></div><div id="zrSalesMonthlyBody"></div>`;
  const prev=$('zrSalesPrevPanel');if(prev&&!$('zrSalesPrevBase'))prev.innerHTML=`<div class="zr-sales-filter"><label>기준 월<input type="month" id="zrSalesPrevBase" value="${ym}"></label><label>비교 월<input type="month" id="zrSalesPrevCompare" value="${shiftMonth(ym,-1)}"></label><span class="help">기본값은 직전 월이며 원하는 두 달로 자유롭게 변경할 수 있습니다.</span></div><div id="zrSalesPrevBody"></div>`;
  const year=$('zrSalesYearPanel');if(year&&!$('zrSalesYearBase'))year.innerHTML=`<div class="zr-sales-filter"><label>기준 월<input type="month" id="zrSalesYearBase" value="${ym}"></label><label>비교 월<input type="month" id="zrSalesYearCompare" value="${shiftMonth(ym,-12)}"></label><span class="help">기본값은 전년 동월이며 원하는 두 달로 자유롭게 변경할 수 있습니다.</span></div><div id="zrSalesYearBody"></div>`;
  const cafe=$('zrSalesCafePanel');if(cafe&&!$('zrSalesCafeMonth'))cafe.innerHTML=`<div class="zr-sales-filter"><label>기준 월<input type="month" id="zrSalesCafeMonth" value="${ym}"></label></div><div id="zrSalesCafeBody"></div>`;
  ['zrSalesMonth','zrSalesPrevBase','zrSalesPrevCompare','zrSalesYearBase','zrSalesYearCompare','zrSalesCafeMonth'].forEach(id=>{const el=$(id);if(el&&!el.dataset.bound){el.dataset.bound='1';el.addEventListener('change',renderAll)}});
}
function renderMonthly(){
  const ym=$('zrSalesMonth')?.value||currentMonth(),rows=rowsForMonth(ym),a=aggregate(rows),body=$('zrSalesMonthlyBody');if(!body)return;
  body.innerHTML=`<div class="zr-sales-kpis">
    ${metricCard('총매출',money(a.total),`${monthLabel(ym)} 실제결제 기준`)}
    ${metricCard('매표매출',money(a.ticket),`실제 유료 ${a.paid.toLocaleString('ko-KR')}명`)}
    ${metricCard('카페매출',money(a.cafe),`${rows.filter(r=>r.cafe>0).length.toLocaleString('ko-KR')}개 단체 이용`)}
    ${metricCard('부가매출',money(a.extra),a.hasExtra?'저장된 부가매출 합계':'현재 별도 입력 데이터 없음')}
    ${metricCard('정산 건수',`${a.count.toLocaleString('ko-KR')}건`,'실제결제 저장완료')}
  </div>
  <div class="zr-sales-grid2">
    <div class="zr-sales-card"><h3>단체 유형 비율</h3><div class="help">정산 건수 기준 · 유치원, 어린이집, 학교, 학원 등</div>${pie(groupShares(rows),'해당 월 정산 데이터가 없습니다.')}</div>
    <div class="zr-sales-card"><h3>아웃소싱별 매출 비율</h3><div class="help">아웃소싱 예약의 실제 총매출 기준 · 자체 예약 제외</div>${pie(vendorShares(rows),'해당 월 아웃소싱 정산 데이터가 없습니다.')}</div>
  </div>
  <div class="zr-sales-note">매출은 예약의 방문일을 기준으로 해당 월에 포함하며, 실제결제가 저장된 건만 집계합니다. 취소·거절 예약은 제외합니다. 부가매출은 기존 저장 데이터에 별도 부가매출 필드가 있을 때만 합산됩니다.</div>`;
}
function renderCompare(kind){
  const isPrev=kind==='prev';const base=$(isPrev?'zrSalesPrevBase':'zrSalesYearBase')?.value||currentMonth();const comp=$(isPrev?'zrSalesPrevCompare':'zrSalesYearCompare')?.value||shiftMonth(base,isPrev?-1:-12);
  const a=aggregate(rowsForMonth(base)),b=aggregate(rowsForMonth(comp)),body=$(isPrev?'zrSalesPrevBody':'zrSalesYearBody');if(!body)return;
  body.innerHTML=`<div class="zr-sales-grid2" style="margin-bottom:12px">
    <div class="zr-sales-card"><h3>${esc(monthLabel(base))}</h3><div class="help">기준 월</div><div class="zr-sales-kpis" style="grid-template-columns:1fr 1fr;margin:0">${metricCard('총매출',money(a.total))}${metricCard('건수',`${a.count}건`)}</div></div>
    <div class="zr-sales-card"><h3>${esc(monthLabel(comp))}</h3><div class="help">비교 월</div><div class="zr-sales-kpis" style="grid-template-columns:1fr 1fr;margin:0">${metricCard('총매출',money(b.total))}${metricCard('건수',`${b.count}건`)}</div></div>
  </div>
  <div class="zr-sales-card"><h3>${isPrev?'전월':'전년'} 매출 비교</h3><div class="help">비교 월은 직접 변경 가능하며, 증감액과 증감률을 함께 표시합니다.</div><div class="zr-sales-table-scroll" style="max-height:none"><table class="zr-sales-compare-table"><thead><tr><th>항목</th><th>${esc(monthLabel(base))}</th><th>${esc(monthLabel(comp))}</th><th>증감</th><th>증감률</th></tr></thead><tbody>${compareRow('총매출',a.total,b.total)}${compareRow('매표매출',a.ticket,b.ticket)}${compareRow('카페매출',a.cafe,b.cafe)}${compareRow('부가매출',a.extra,b.extra)}${compareRow('정산 건수',a.count,b.count,false)}</tbody></table></div></div>
  <div class="zr-sales-note">기준 월과 비교 월을 자유롭게 선택할 수 있어 특정 월끼리 회사 보고용 비교가 가능합니다.</div>`;
}
function renderCafe(){
  const ym=$('zrSalesCafeMonth')?.value||currentMonth(),rows=rowsForMonth(ym).filter(r=>r.cafe>0),sum=rows.reduce((s,r)=>s+r.cafe,0),avg=rows.length?Math.round(sum/rows.length):0,body=$('zrSalesCafeBody');if(!body)return;
  const groups=groupShares(rows,r=>r.cafe);const top=groups[0]?.name||'-';
  const table=rows.sort((a,b)=>b.cafe-a.cafe||a.date.localeCompare(b.date)).map(r=>`<tr><td>${esc(r.date)}</td><td>${esc(r.booking?.orgName||'-')}</td><td>${esc(r.group)}</td><td>${esc(r.vendorName)}</td><td>${money(r.cafe)}</td></tr>`).join('');
  body.innerHTML=`<div class="zr-sales-kpis" style="grid-template-columns:repeat(4,minmax(0,1fr))">
    ${metricCard('단체 카페매출',money(sum),monthLabel(ym))}
    ${metricCard('카페 이용 단체',`${rows.length.toLocaleString('ko-KR')}건`,'실제 카페 결제 1원 이상')}
    ${metricCard('단체당 평균',money(avg),'카페 이용 단체 기준')}
    ${metricCard('매출 1위 유형',top,groups[0]?money(groups[0].value):'집계 없음')}
  </div>
  <div class="zr-sales-grid2">
    <div class="zr-sales-card"><h3>단체 유형별 카페매출 비율</h3><div class="help">카페 실제 결제금액 기준</div>${pie(groups,'해당 월 카페매출 데이터가 없습니다.')}</div>
    <div class="zr-sales-card"><h3>단체별 카페매출</h3><div class="help">금액이 큰 순서로 표시합니다.</div><div class="zr-sales-table-scroll"><table class="zr-sales-cafe-table"><thead><tr><th>방문일</th><th>단체명</th><th>단체유형</th><th>결제구분</th><th>카페매출</th></tr></thead><tbody>${table||'<tr><td colspan="5" style="text-align:center;color:#8a918c">카페매출 데이터가 없습니다.</td></tr>'}</tbody></table></div></div>
  </div>`;
}
function renderAll(){renderMonthly();renderCompare('prev');renderCompare('year');renderCafe()}
function selectMode(next){
  mode=next||'monthly';const sec=ensureSection();if(!sec)return;
  sec.querySelectorAll('[data-zr-sales-mode]').forEach(b=>b.classList.toggle('active',b.dataset.zrSalesMode===mode));
  const map={monthly:'zrSalesMonthlyPanel',prev:'zrSalesPrevPanel',year:'zrSalesYearPanel',cafe:'zrSalesCafePanel'};
  Object.entries(map).forEach(([k,id])=>$(id)?.classList.toggle('active',k===mode));renderAll();
}
function hideKnownSections(){KNOWN_SECTIONS.forEach(id=>$(id)?.classList.add('hidden'))}
function openDashboard(){
  const sec=ensureSection();if(!sec)return;ensureInputs();hideKnownSections();sec.classList.remove('hidden');
  document.querySelectorAll('#zrAdminShellRail [data-zr-admin-item]').forEach(b=>b.classList.remove('is-active'));
  $('zrAdminSalesDashboardRailV1')?.classList.add('is-active');
  const title=$('zrAdminShellPageTitle'),path=$('zrAdminShellPath');if(title)title.textContent='매출 현황';if(path)path.textContent='매출 / 매출 현황';
  selectMode(mode);
}
function ensureRailItem(){
  const group=document.querySelector('#zrAdminShellRail .zr-admin-shell-group[data-group="sales"]');if(!group)return false;
  if($('zrAdminSalesDashboardRailV1'))return true;
  const b=document.createElement('button');b.type='button';b.id='zrAdminSalesDashboardRailV1';b.className='zr-admin-shell-item';b.dataset.zrAdminItem='salesDashboard';b.dataset.group='sales';
  b.innerHTML='<span class="zr-admin-shell-item-dot" aria-hidden="true"></span><span class="zr-admin-shell-item-label">매출 현황</span>';b.addEventListener('click',openDashboard);
  const title=group.querySelector('.zr-admin-shell-group-title');if(title?.nextSibling)group.insertBefore(b,title.nextSibling);else group.appendChild(b);return true;
}
function installExitGuard(){
  if(document.documentElement.dataset.zrSalesExitGuard==='1')return;document.documentElement.dataset.zrSalesExitGuard='1';
  document.addEventListener('click',e=>{
    const sec=$('tab-sales-dashboard');if(!sec||sec.classList.contains('hidden'))return;
    const rail=e.target?.closest?.('#zrAdminShellRail .zr-admin-shell-item');if(rail&&rail.id!=='zrAdminSalesDashboardRailV1'){sec.classList.add('hidden');return}
    const old=e.target?.closest?.('#adminView .admin-tabs button');if(old)sec.classList.add('hidden');
    if(e.target?.closest?.('[data-zr-settle-save]'))setTimeout(()=>{if(!sec.classList.contains('hidden'))renderAll()},300);
  },true);
}
function boot(){
  injectStyle();installExitGuard();let tries=0,stable=0;const t=setInterval(()=>{tries++;const ok=!!ensureSection()&&ensureRailItem();if(ok){ensureInputs();renderAll();stable++}else stable=0;if(stable>=3||tries>=80)clearInterval(t)},150);
  document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(()=>{ensureSection();ensureRailItem();ensureInputs();renderAll()},80),{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
