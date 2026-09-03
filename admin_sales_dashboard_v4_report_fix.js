(()=>{
'use strict';
if(window.__ZR_ADMIN_SALES_DASHBOARD_V4_REPORT_FIX)return;
window.__ZR_ADMIN_SALES_DASHBOARD_V4_REPORT_FIX=true;

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
const CHART_PALETTE=['#8f5a32','#f06423','#f58b3a','#f7ad66','#f8c98f','#c77b43','#e39a58','#f6bb79','#a96a3b','#f9d7ac'];
let revisitBaseYear=new Date().getFullYear();
let revisitCompareYear=revisitBaseYear-1;
let bound=false;

function allBookings(){
  try{
    const list=typeof window.bookings==='function'?window.bookings():JSON.parse(localStorage.getItem('zr_bookings')||'[]');
    return Array.isArray(list)?list.filter(Boolean):[];
  }catch{return []}
}
function normOrg(v){return String(v||'').toLowerCase().replace(/\s+/g,'').replace(/[()\[\]{}._-]/g,'').trim()}
function groupName(b){return String(b?.groupType||'미분류').trim()||'미분류'}
function visitRows(){
  const today=new Date();today.setHours(23,59,59,999);
  return allBookings().filter(b=>{
    if(!b?.date||!normOrg(b.orgName))return false;
    if(['cancelled','rejected'].includes(String(b.status||'')))return false;
    if(String(b.status||'')!=='confirmed'&&!b?.settlement?.savedAt)return false;
    const d=new Date(String(b.date)+'T00:00:00');
    return !Number.isNaN(d.getTime())&&d<=today;
  }).map(b=>({date:String(b.date),org:normOrg(b.orgName),label:String(b.orgName||'').trim()||'-',group:groupName(b)})).sort((a,b)=>a.date.localeCompare(b.date));
}
function periodStats(start,end){
  const rows=visitRows(),first=new Map();
  rows.forEach(r=>{if(!first.has(r.org)||r.date<first.get(r.org))first.set(r.org,r.date)});
  const orgs=new Map();
  rows.forEach(r=>{
    if(r.date<start||r.date>end)return;
    let x=orgs.get(r.org);
    if(!x){x={org:r.org,label:r.label,group:r.group,visits:0};orgs.set(r.org,x)}
    x.visits++;
  });
  const groups=new Map();let revisit=0,newCount=0;
  orgs.forEach(x=>{
    const isRevisit=(first.get(x.org)||'9999-99-99')<start;
    if(isRevisit)revisit++;else newCount++;
    const g=groups.get(x.group)||{name:x.group,unique:0,revisit:0,newCount:0,rate:0};
    g.unique++;if(isRevisit)g.revisit++;else g.newCount++;groups.set(x.group,g);
  });
  groups.forEach(g=>{g.rate=g.unique?g.revisit/g.unique*100:0});
  return {unique:orgs.size,revisit,newCount,rate:orgs.size?revisit/orgs.size*100:0,visits:[...orgs.values()].reduce((s,x)=>s+x.visits,0),groups:[...groups.values()]};
}
function monthEnd(y,m){return new Date(y,m,0).getDate()}
function monthStats(year){
  const y=Number(year);
  return Array.from({length:12},(_,i)=>{
    const m=i+1,s=`${y}-${String(m).padStart(2,'0')}-01`,e=`${y}-${String(m).padStart(2,'0')}-${String(monthEnd(y,m)).padStart(2,'0')}`;
    return {month:m,...periodStats(s,e)};
  });
}
function yearStats(year){return periodStats(`${year}-01-01`,`${year}-12-31`)}
function pct(v){return `${Number(v||0).toFixed(1)}%`}
function pp(v){const n=Number(v||0);return `${n>0?'+':''}${n.toFixed(1)}%p`}
function signedCount(v){const n=Number(v||0);return `${n>0?'+':''}${n.toLocaleString('ko-KR')}개`}
function currentMode(){return $('tab-sales-dashboard')?.querySelector('[data-zr-sales-mode].active')?.dataset?.zrSalesMode||'monthly'}

function injectStyle(){
  if($('zrAdminSalesDashboardV4ReportFixStyle'))return;
  const s=document.createElement('style');s.id='zrAdminSalesDashboardV4ReportFixStyle';s.textContent=`
    /* 매출 본문은 기존 관리자 탭과 같은 중립 UI로 복귀 */
    #tab-sales-dashboard .zr-sales-title{color:#211f1c!important}
    #tab-sales-dashboard .zr-sales-subtitle{color:#778078!important}
    #tab-sales-dashboard .zr-sales-kpi{border-color:#e0e5e1!important;background:#fff!important;box-shadow:0 2px 8px rgba(30,50,36,.035)!important}
    #tab-sales-dashboard .zr-sales-kpi span{color:#7b827d!important}
    #tab-sales-dashboard .zr-sales-kpi strong{color:#24352b!important}
    #tab-sales-dashboard .zr-sales-card{border-color:#e0e5e1!important;background:#fff!important}
    #tab-sales-dashboard .zr-sales-card h3{color:#29372f!important}
    #tab-sales-dashboard .zr-sales-filter{border-color:#e1e6e2!important;background:#fff!important}
    #tab-sales-dashboard .zr-sales-filter label{color:#566159!important}
    #tab-sales-dashboard .zr-sales-note{background:#f6f8f6!important;color:#778078!important}
    #tab-sales-dashboard thead th{background:#f7f9f7!important;color:#66736b!important}
    #tab-sales-dashboard .zr-sales-legend-row b{color:#5e685f!important}
    #tab-sales-dashboard .zr-sales-compare-table .up{color:#25704c!important}
    #tab-sales-dashboard .zr-sales-compare-table .down{color:#a84c45!important}
    #zrSalesDashboardRailWrap{--zr-sub-color:var(--zr-sales)!important;--zr-sub-soft:var(--zr-sales-soft)!important}
    #zrSalesDashboardRailWrap .zr-admin-shell-submenu-inner{border-left-color:color-mix(in srgb,var(--zr-sub-color) 24%,transparent)!important}
    #zrSalesDashboardRailWrap .zr-admin-shell-subitem:before{background:var(--zr-sub-color)!important}
    #zrSalesDashboardRailWrap .zr-admin-shell-subitem:hover,#zrSalesDashboardRailWrap .zr-admin-shell-subitem.is-active{background:var(--zr-sub-soft)!important;color:var(--zr-sub-color)!important}

    /* 연도 변경은 기존 관리자 화살표 버튼 톤으로, hover는 해당 버튼만 */
    .zr-sales-year-stepper{isolation:isolate}
    .zr-sales-year-stepper button{background:#fff!important;border-color:#2f6b4f!important;color:#2f6b4f!important;box-shadow:none!important;transition:background .12s ease,color .12s ease!important}
    .zr-sales-year-stepper button:hover{background:#eef6f1!important;color:#24573f!important}
    .zr-sales-year-stepper:has(button:hover) button:not(:hover){background:#fff!important;color:#2f6b4f!important}
    .zr-sales-year-value{background:#fff!important;border-color:#cfd8d2!important;color:#29372f!important}

    #zrSalesRevisitPanel .zr-sales-revisit-compare-head{display:flex;align-items:end;gap:12px;flex-wrap:wrap;margin-bottom:14px;padding:14px;border:1px solid #e1e6e2;border-radius:14px;background:#fff}
    #zrSalesRevisitPanel .zr-sales-revisit-yearbox{display:flex;flex-direction:column;gap:5px;font-size:12px;font-weight:800;color:#566159}
    #zrSalesRevisitPanel .zr-sales-revisit-yearctl{display:grid;grid-template-columns:44px 94px 44px;gap:6px;align-items:center}
    #zrSalesRevisitPanel .zr-sales-revisit-yearctl button{height:42px;padding:0!important;border:1px solid #2f6b4f!important;border-radius:10px!important;background:#fff!important;color:#2f6b4f!important;font-size:23px!important;font-weight:900!important;box-shadow:none!important}
    #zrSalesRevisitPanel .zr-sales-revisit-yearctl button:hover{background:#eef6f1!important}
    #zrSalesRevisitPanel .zr-sales-revisit-yearctl:has(button:hover) button:not(:hover){background:#fff!important;color:#2f6b4f!important}
    #zrSalesRevisitPanel .zr-sales-revisit-year{height:42px;display:flex;align-items:center;justify-content:center;border:1px solid #cfd8d2;border-radius:10px;background:#fff;font-size:16px;font-weight:900;color:#29372f}
    #zrSalesRevisitPanel .zr-sales-revisit-grid-v4{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.35fr);gap:12px}
    #zrSalesRevisitPanel .zr-sales-revisit-table-v4{width:100%;border-collapse:separate;border-spacing:0;font-size:12px}
    #zrSalesRevisitPanel .zr-sales-revisit-table-v4 th,#zrSalesRevisitPanel .zr-sales-revisit-table-v4 td{padding:10px;border-bottom:1px solid #edf0ee;text-align:right;white-space:nowrap}
    #zrSalesRevisitPanel .zr-sales-revisit-table-v4 th:first-child,#zrSalesRevisitPanel .zr-sales-revisit-table-v4 td:first-child{text-align:left}
    #zrSalesRevisitPanel .zr-sales-rate-bar{background:#f4eee8!important}
    #zrSalesRevisitPanel .zr-sales-rate-bar>i{background:linear-gradient(90deg,#f7ad66,#f06423)!important}
    #zrSalesRevisitPanel .zr-revisit-up{color:#25704c;font-weight:900}.zr-revisit-down{color:#a84c45;font-weight:900}
    @media(max-width:900px){#zrSalesRevisitPanel .zr-sales-revisit-grid-v4{grid-template-columns:1fr}}
    @media(max-width:620px){#zrSalesRevisitPanel .zr-sales-revisit-yearctl{grid-template-columns:42px 88px 42px}}
  `;document.head.appendChild(s);
}

function applyChartPalette(){
  document.querySelectorAll('#tab-sales-dashboard .zr-sales-pie').forEach(p=>{
    const bg=p.style.background||'';if(!bg.includes('conic-gradient'))return;
    const segs=bg.match(/#[0-9a-fA-F]{6}\s+[^,\)]+/g);if(!segs?.length)return;
    let next=bg;
    segs.forEach((seg,i)=>{next=next.replace(seg,seg.replace(/#[0-9a-fA-F]{6}/,CHART_PALETTE[i%CHART_PALETTE.length]))});
    p.style.background=next;
    const root=p.closest('.zr-sales-card')||p.parentElement;
    root?.querySelectorAll('.zr-sales-dot').forEach((dot,i)=>dot.style.background=CHART_PALETTE[i%CHART_PALETTE.length]);
  });
}

function yearControl(key,label,value){
  return `<div class="zr-sales-revisit-yearbox"><span>${esc(label)}</span><div class="zr-sales-revisit-yearctl"><button type="button" data-zr-revisit-step="${key}" data-delta="-1" aria-label="${esc(label)} 이전 연도">‹</button><div class="zr-sales-revisit-year">${value}년</div><button type="button" data-zr-revisit-step="${key}" data-delta="1" aria-label="${esc(label)} 다음 연도">›</button></div></div>`;
}
function renderRevisitV4(){
  if(currentMode()!=='revisit')return;
  const panel=$('zrSalesRevisitPanel');if(!panel)return;
  const base=yearStats(revisitBaseYear),comp=yearStats(revisitCompareYear),months=monthStats(revisitBaseYear);
  const byBase=new Map(base.groups.map(x=>[x.name,x])),byComp=new Map(comp.groups.map(x=>[x.name,x]));
  const names=[...new Set([...byBase.keys(),...byComp.keys()])].sort((a,b)=>((byBase.get(b)?.unique||0)+(byComp.get(b)?.unique||0))-((byBase.get(a)?.unique||0)+(byComp.get(a)?.unique||0))||a.localeCompare(b,'ko'));
  const monthRows=months.map(x=>`<tr><td>${x.month}월</td><td>${x.unique}개</td><td>${x.revisit}개</td><td>${x.newCount}개</td><td><div style="display:flex;align-items:center;gap:8px;justify-content:flex-end"><div class="zr-sales-rate-bar"><i style="width:${Math.min(100,x.rate)}%"></i></div><b>${pct(x.rate)}</b></div></td></tr>`).join('');
  const groupRows=names.map(name=>{
    const a=byBase.get(name)||{unique:0,revisit:0,rate:0},b=byComp.get(name)||{unique:0,revisit:0,rate:0},diff=a.rate-b.rate,cls=diff>0?'zr-revisit-up':diff<0?'zr-revisit-down':'';
    return `<tr><td>${esc(name)}</td><td>${a.revisit}/${a.unique}</td><td>${pct(a.rate)}</td><td>${b.revisit}/${b.unique}</td><td>${pct(b.rate)}</td><td class="${cls}">${pp(diff)}</td></tr>`;
  }).join('');
  const rateDiff=base.rate-comp.rate,countDiff=base.revisit-comp.revisit,rateCls=rateDiff>0?'zr-revisit-up':rateDiff<0?'zr-revisit-down':'',countCls=countDiff>0?'zr-revisit-up':countDiff<0?'zr-revisit-down':'';
  panel.dataset.zrV4='1';
  panel.innerHTML=`<input type="hidden" id="zrSalesRevisitYear" value="${revisitBaseYear}"><div class="zr-sales-revisit-compare-head">${yearControl('base','기준 연도',revisitBaseYear)}${yearControl('compare','비교 연도',revisitCompareYear)}<span class="help">고유 단체 기준 · 해당 연도 이전 방문 이력이 있으면 재방문으로 집계합니다.</span></div>
  <div class="zr-sales-kpis" style="grid-template-columns:repeat(4,minmax(0,1fr))">
    <div class="zr-sales-kpi"><span>${revisitBaseYear}년 재방문율</span><strong>${pct(base.rate)}</strong><small>${base.revisit}/${base.unique}개 단체</small></div>
    <div class="zr-sales-kpi"><span>${revisitCompareYear}년 재방문율</span><strong>${pct(comp.rate)}</strong><small>${comp.revisit}/${comp.unique}개 단체</small></div>
    <div class="zr-sales-kpi"><span>재방문율 증감</span><strong class="${rateCls}">${pp(rateDiff)}</strong><small>${revisitCompareYear}년 대비 ${revisitBaseYear}년</small></div>
    <div class="zr-sales-kpi"><span>재방문 단체 증감</span><strong class="${countCls}">${signedCount(countDiff)}</strong><small>${comp.revisit}개 → ${base.revisit}개</small></div>
  </div>
  <div class="zr-sales-revisit-grid-v4">
    <div class="zr-sales-card"><h3>${revisitBaseYear}년 월별 재방문율</h3><div class="help">각 월의 고유 방문 단체 중 이전 방문 이력이 있는 단체 비율</div><div class="zr-sales-table-scroll" style="max-height:none"><table class="zr-sales-revisit-table-v4"><thead><tr><th>월</th><th>고유 단체</th><th>재방문</th><th>신규</th><th>재방문율</th></tr></thead><tbody>${monthRows}</tbody></table></div></div>
    <div class="zr-sales-card"><h3>단체 종류별 재방문율 증감</h3><div class="help">${revisitCompareYear}년 대비 ${revisitBaseYear}년 · 재방문/고유단체 및 재방문율 비교</div><div class="zr-sales-table-scroll" style="max-height:none"><table class="zr-sales-revisit-table-v4"><thead><tr><th>단체 종류</th><th>${revisitBaseYear} 재방문</th><th>${revisitBaseYear} 비율</th><th>${revisitCompareYear} 재방문</th><th>${revisitCompareYear} 비율</th><th>증감</th></tr></thead><tbody>${groupRows||'<tr><td colspan="6" style="text-align:center;color:#8a918c">비교할 재방문 데이터가 없습니다.</td></tr>'}</tbody></table></div></div>
  </div>
  <div class="zr-sales-note">재방문율 = 해당 기간의 고유 방문 단체 중 그 기간 시작일 이전에 방문 이력이 있는 단체 비율입니다. 단체 종류 비교는 한 단체가 해당 연도에 처음 방문한 예약의 단체 유형을 기준으로 분류합니다. 취소·거절 예약은 제외하고 확정 예약 또는 실제결제 저장 건만 집계합니다.</div>`;
}

function finish(){
  injectStyle();applyChartPalette();
  if(currentMode()==='revisit')renderRevisitV4();
  setTimeout(applyChartPalette,30);
}
function bind(){
  if(bound)return;bound=true;
  document.addEventListener('click',e=>{
    const step=e.target?.closest?.('[data-zr-revisit-step]');
    if(step){
      e.preventDefault();e.stopPropagation();
      const delta=Number(step.dataset.delta||0),key=step.dataset.zrRevisitStep;
      if(key==='base')revisitBaseYear=Math.max(2000,Math.min(2100,revisitBaseYear+delta));
      if(key==='compare')revisitCompareYear=Math.max(2000,Math.min(2100,revisitCompareYear+delta));
      renderRevisitV4();return;
    }
    if(e.target?.closest?.('#tab-sales-dashboard,#zrSalesDashboardRailWrap,#zrAdminSalesDashboardRailV1'))setTimeout(finish,80);
  },true);
  document.addEventListener('change',e=>{if(e.target?.closest?.('#tab-sales-dashboard'))setTimeout(finish,80)},true);
}
function boot(){
  injectStyle();bind();let tries=0,stable=0;
  const t=setInterval(()=>{
    tries++;const ready=!!$('tab-sales-dashboard');if(ready){finish();stable++}else stable=0;
    if(stable>=4||tries>=80)clearInterval(t);
  },140);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,60),{once:true});
})();