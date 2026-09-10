(()=>{
'use strict';
if(window.__ZR_ADMIN_SALES_DASHBOARD_V3_FINISH)return;
window.__ZR_ADMIN_SALES_DASHBOARD_V3_FINISH=true;

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]||c));
const SUB={mode:'revisit',label:'재방문율'};
let bound=false;

function allBookings(){
  try{
    const list=typeof window.bookings==='function'?window.bookings():JSON.parse(localStorage.getItem('zr_bookings')||'[]');
    return Array.isArray(list)?list.filter(Boolean):[];
  }catch{return []}
}
function normOrg(v){return String(v||'').toLowerCase().replace(/\s+/g,'').replace(/[()\[\]{}._-]/g,'').trim()}
function visitRows(){
  const today=new Date();today.setHours(23,59,59,999);
  return allBookings().filter(b=>{
    if(!b?.date||!normOrg(b.orgName))return false;
    if(['cancelled','rejected'].includes(String(b.status||'')))return false;
    if(String(b.status||'')!=='confirmed'&&!b?.settlement?.savedAt)return false;
    const d=new Date(String(b.date)+'T00:00:00');return !Number.isNaN(d.getTime())&&d<=today;
  }).map(b=>({booking:b,date:String(b.date),org:normOrg(b.orgName),orgLabel:String(b.orgName||'').trim()||'-'})).sort((a,b)=>a.date.localeCompare(b.date));
}
function statsForPeriod(start,end){
  const rows=visitRows(),first=new Map();
  rows.forEach(r=>{if(!first.has(r.org)||r.date<first.get(r.org))first.set(r.org,r.date)});
  const inPeriod=rows.filter(r=>r.date>=start&&r.date<=end),orgMap=new Map();
  inPeriod.forEach(r=>{const x=orgMap.get(r.org)||{org:r.org,label:r.orgLabel,visits:0};x.visits++;orgMap.set(r.org,x)});
  const orgs=[...orgMap.values()];
  let revisit=0,newCount=0;
  orgs.forEach(x=>{if((first.get(x.org)||'9999-99-99')<start)revisit++;else newCount++});
  const rate=orgs.length?revisit/orgs.length*100:0;
  return {unique:orgs.length,revisit,newCount,rate,visits:inPeriod.length,orgs};
}
function monthEnd(y,m){return new Date(y,m,0).getDate()}
function monthStats(year){
  const y=Number(year);return Array.from({length:12},(_,i)=>{const m=i+1,s=`${y}-${String(m).padStart(2,'0')}-01`,e=`${y}-${String(m).padStart(2,'0')}-${String(monthEnd(y,m)).padStart(2,'0')}`;return {month:m,...statsForPeriod(s,e)}})
}
function yearStats(year){return statsForPeriod(`${year}-01-01`,`${year}-12-31`)}
function pct(v){return `${Number(v||0).toFixed(1)}%`}
function metric(label,value,sub=''){return `<div class="zr-sales-kpi"><span>${esc(label)}</span><strong>${esc(value)}</strong>${sub?`<small>${esc(sub)}</small>`:''}</div>`}

function injectStyle(){
  if($('zrAdminSalesDashboardV3FinishStyle'))return;
  const s=document.createElement('style');s.id='zrAdminSalesDashboardV3FinishStyle';s.textContent=`
    #tab-sales-dashboard{--zr-sales-brown:#8b5a2b;--zr-sales-orange:#e98a2e;--zr-sales-orange2:#f3aa57;--zr-sales-soft:#fff2e3;--zr-sales-soft2:#fff8f0;--zr-sales-line:#efd5b9}
    #tab-sales-dashboard .zr-sales-title{color:#6f451f!important}
    #tab-sales-dashboard .zr-sales-subtitle{color:#9a7657!important}
    #tab-sales-dashboard .zr-sales-kpi{border-color:var(--zr-sales-line)!important;background:linear-gradient(180deg,#fffdf9 0%,var(--zr-sales-soft2) 100%)!important;box-shadow:0 2px 8px rgba(139,90,43,.06)!important}
    #tab-sales-dashboard .zr-sales-kpi span{color:#9a7657!important}
    #tab-sales-dashboard .zr-sales-kpi strong{color:#744820!important}
    #tab-sales-dashboard .zr-sales-card{border-color:var(--zr-sales-line)!important;background:#fffdf9!important}
    #tab-sales-dashboard .zr-sales-card h3{color:#744820!important}
    #tab-sales-dashboard .zr-sales-filter{border-color:var(--zr-sales-line)!important;background:var(--zr-sales-soft2)!important}
    #tab-sales-dashboard .zr-sales-filter label{color:#80562f!important}
    #tab-sales-dashboard .zr-sales-note{background:var(--zr-sales-soft)!important;color:#8a6849!important}
    #tab-sales-dashboard thead th{background:#fff4e7!important;color:#8b6543!important}
    #tab-sales-dashboard .zr-sales-legend-row b{color:#b9661f!important}
    #tab-sales-dashboard .zr-sales-compare-table .up{color:#c66a1d!important}.zr-sales-compare-table .down{color:#aa5045!important}
    #zrSalesDashboardRailWrap{--zr-sub-color:#c96f23!important;--zr-sub-soft:#fff0df!important}
    #zrSalesDashboardRailWrap .zr-admin-shell-submenu-inner{border-left-color:#e9b47f!important}
    #zrSalesDashboardRailWrap .zr-admin-shell-subitem:before{background:#dc7b27!important}
    #zrSalesDashboardRailWrap .zr-admin-shell-subitem:hover,#zrSalesDashboardRailWrap .zr-admin-shell-subitem.is-active{background:#fff0df!important;color:#a85a19!important}
    #tab-sales-dashboard .zr-sales-pie{filter:saturate(1.06)}
    .zr-sales-year-stepper{display:grid;grid-template-columns:46px minmax(92px,1fr) 46px;align-items:center;gap:6px;min-width:200px}
    .zr-sales-year-stepper button{height:44px!important;padding:0!important;border:1px solid #e2b787!important;border-radius:11px!important;background:#fff8f0!important;color:#a85a19!important;font-size:25px!important;font-weight:900!important;line-height:1!important;box-shadow:none!important}
    .zr-sales-year-stepper button:hover{background:#ffe8cc!important}
    .zr-sales-year-value{height:44px;display:flex;align-items:center;justify-content:center;border:1px solid #e2b787;border-radius:11px;background:#fff;color:#6f451f;font-size:17px;font-weight:950;letter-spacing:-.02em}
    .zr-sales-revisit-grid{display:grid;grid-template-columns:1fr 1.25fr;gap:12px}
    .zr-sales-revisit-table{width:100%;border-collapse:separate;border-spacing:0;font-size:12px}
    .zr-sales-revisit-table th,.zr-sales-revisit-table td{padding:10px;border-bottom:1px solid #f2e3d4;text-align:right;white-space:nowrap}
    .zr-sales-revisit-table th:first-child,.zr-sales-revisit-table td:first-child{text-align:left}
    .zr-sales-rate-bar{height:9px;border-radius:999px;background:#f7e7d5;overflow:hidden;min-width:100px}
    .zr-sales-rate-bar>i{display:block;height:100%;background:linear-gradient(90deg,#f3aa57,#d97322);border-radius:inherit}
    @media(max-width:800px){.zr-sales-revisit-grid{grid-template-columns:1fr}.zr-sales-year-stepper{min-width:180px}}
  `;document.head.appendChild(s);
}
function recolorCharts(){
  const palette=['#d96f21','#ed8b32','#f2a75b','#f7c184','#c98752','#a9693e','#e6a05f','#f1b777','#bb7544','#f6d0a3'];
  document.querySelectorAll('#tab-sales-dashboard .zr-sales-pie').forEach(p=>{
    const bg=p.style.background||'';if(!bg.includes('conic-gradient'))return;
    const segs=bg.match(/#[0-9a-fA-F]{6}\s+[^,\)]+/g);if(!segs?.length)return;
    let next=bg;segs.forEach((seg,i)=>{next=next.replace(seg,seg.replace(/#[0-9a-fA-F]{6}/,palette[i%palette.length]))});p.style.background=next;
  });
  document.querySelectorAll('#tab-sales-dashboard .zr-sales-dot').forEach((d,i)=>d.style.background=palette[i%palette.length]);
}
function makeStepper(input,label){
  if(!input||input.dataset.zrYearStepper==='1')return;
  input.dataset.zrYearStepper='1';input.type='hidden';
  const wrap=document.createElement('div');wrap.className='zr-sales-year-stepper';
  const prev=document.createElement('button');prev.type='button';prev.textContent='‹';prev.setAttribute('aria-label',label+' 이전 연도');
  const value=document.createElement('div');value.className='zr-sales-year-value';
  const next=document.createElement('button');next.type='button';next.textContent='›';next.setAttribute('aria-label',label+' 다음 연도');
  const sync=()=>value.textContent=`${input.value}년`;
  const step=delta=>{input.value=String(Math.max(2000,Math.min(2100,Number(input.value||new Date().getFullYear())+delta)));sync();input.dispatchEvent(new Event('change',{bubbles:true}))};
  prev.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));
  wrap.append(prev,value,next);input.insertAdjacentElement('afterend',wrap);sync();
}
function enhanceYearControls(){
  const base=$('zrSalesAnnualBase'),comp=$('zrSalesAnnualCompare');
  if(base)makeStepper(base,'기준 연도');if(comp)makeStepper(comp,'비교 연도');
}
function currentMode(){return $('tab-sales-dashboard')?.querySelector('[data-zr-sales-mode].active')?.dataset?.zrSalesMode||'monthly'}
function selectMode(mode){
  const btn=$('tab-sales-dashboard')?.querySelector(`[data-zr-sales-mode="${mode}"]`);if(btn&&!btn.classList.contains('active'))btn.click();
  setTimeout(()=>{renderRevisit();syncRail();recolorCharts()},20);
}
function ensureRevisitPanel(){
  const sec=$('tab-sales-dashboard');if(!sec)return false;
  const tabs=sec.querySelector('.zr-sales-subtabs');if(!tabs)return false;
  if(!tabs.querySelector('[data-zr-sales-mode="revisit"]')){
    const b=document.createElement('button');b.type='button';b.dataset.zrSalesMode='revisit';b.textContent='재방문율';b.addEventListener('click',()=>setTimeout(renderRevisit,0));tabs.appendChild(b);
  }
  if(!$('zrSalesRevisitPanel')){const p=document.createElement('div');p.id='zrSalesRevisitPanel';p.className='zr-sales-panel';sec.appendChild(p)}
  return true;
}
function renderRevisit(){
  if(currentMode()!=='revisit')return;
  const p=$('zrSalesRevisitPanel');if(!p)return;
  if(!p.dataset.ready){
    const y=new Date().getFullYear();
    p.innerHTML=`<div class="zr-sales-filter"><label>기준 연도<input type="hidden" id="zrSalesRevisitYear" value="${y}"><div id="zrSalesRevisitYearHost"></div></label><span class="help">고유 단체 기준 · 해당 기간 이전 방문 이력이 있으면 재방문으로 집계합니다.</span></div><div id="zrSalesRevisitBody"></div>`;p.dataset.ready='1';
    const input=$('zrSalesRevisitYear');const host=$('zrSalesRevisitYearHost');
    if(input&&host){const fake=document.createElement('input');fake.type='hidden';fake.id='zrSalesRevisitYearFake';fake.value=input.value;host.appendChild(fake);makeStepper(fake,'재방문 기준 연도');fake.addEventListener('change',()=>{input.value=fake.value;renderRevisit()})}
  }
  const year=Number($('zrSalesRevisitYear')?.value||new Date().getFullYear()),annual=yearStats(year),months=monthStats(year),body=$('zrSalesRevisitBody');if(!body)return;
  const monthRows=months.map(x=>`<tr><td>${x.month}월</td><td>${x.unique}개</td><td>${x.revisit}개</td><td>${x.newCount}개</td><td><div style="display:flex;align-items:center;gap:8px;justify-content:flex-end"><div class="zr-sales-rate-bar"><i style="width:${Math.min(100,x.rate)}%"></i></div><b>${pct(x.rate)}</b></div></td></tr>`).join('');
  const repeatTop=annual.orgs.filter(x=>x.visits>=2).sort((a,b)=>b.visits-a.visits).slice(0,10).map(x=>`<tr><td>${esc(x.label)}</td><td>${x.visits}회</td></tr>`).join('');
  body.innerHTML=`<div class="zr-sales-kpis" style="grid-template-columns:repeat(4,minmax(0,1fr))">${metric(`${year}년 재방문율`,pct(annual.rate),'고유 단체 기준')}${metric('재방문 단체',`${annual.revisit}개`,'해당 연도 이전 방문 이력')}${metric('신규 단체',`${annual.newCount}개`,'해당 연도 첫 방문')}${metric('총 방문 건수',`${annual.visits}건`,`${annual.unique}개 고유 단체`)}</div>
  <div class="zr-sales-revisit-grid"><div class="zr-sales-card"><h3>${year}년 월별 재방문율</h3><div class="help">각 월 방문 단체 중 이전 방문 이력이 있는 단체 비율</div><div class="zr-sales-table-scroll" style="max-height:none"><table class="zr-sales-revisit-table"><thead><tr><th>월</th><th>고유 단체</th><th>재방문</th><th>신규</th><th>재방문율</th></tr></thead><tbody>${monthRows}</tbody></table></div></div><div class="zr-sales-card"><h3>연내 2회 이상 방문 단체</h3><div class="help">선택 연도 내 방문 횟수 기준 상위 10개</div><div class="zr-sales-table-scroll" style="max-height:none"><table class="zr-sales-revisit-table"><thead><tr><th>단체명</th><th>방문 횟수</th></tr></thead><tbody>${repeatTop||'<tr><td colspan="2" style="text-align:center;color:#9b8068">해당 데이터가 없습니다.</td></tr>'}</tbody></table></div></div></div>
  <div class="zr-sales-note">재방문율 = 해당 기간의 고유 방문 단체 중 그 기간 시작일 이전에 방문 이력이 있는 단체 비율입니다. 취소·거절 예약은 제외하고, 확정 예약 또는 실제결제 저장 건만 집계합니다.</div>`;
  recolorCharts();
}
function syncRail(){
  const wrap=$('zrSalesDashboardRailWrap');if(!wrap)return;
  if(!wrap.querySelector('[data-zr-sales-rail-mode="revisit"]')){
    const inner=wrap.querySelector('.zr-admin-shell-submenu-inner');if(inner){const b=document.createElement('button');b.type='button';b.className='zr-admin-shell-subitem';b.dataset.zrSalesRailMode='revisit';b.textContent='재방문율';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if($('tab-sales-dashboard')?.classList.contains('hidden'))$('zrAdminSalesDashboardRailV1')?.click();setTimeout(()=>selectMode('revisit'),20)});inner.appendChild(b)}
  }
  const mode=currentMode();wrap.querySelectorAll('[data-zr-sales-rail-mode]').forEach(b=>b.classList.toggle('is-active',b.dataset.zrSalesRailMode===mode));
  if(mode==='revisit'&&!$('tab-sales-dashboard')?.classList.contains('hidden')){const path=$('zrAdminShellPath');if(path)path.textContent='매출 / 매출 현황 / 재방문율'}
}
function activatePanels(){
  const sec=$('tab-sales-dashboard');if(!sec)return;
  const original=sec.querySelector('.zr-sales-subtabs');if(!original||original.dataset.zrV3Bound==='1')return;original.dataset.zrV3Bound='1';
  original.addEventListener('click',e=>{const b=e.target.closest('[data-zr-sales-mode]');if(!b)return;setTimeout(()=>{
    const mode=b.dataset.zrSalesMode;sec.querySelectorAll('[data-zr-sales-mode]').forEach(x=>x.classList.toggle('active',x.dataset.zrSalesMode===mode));
    const ids={monthly:'zrSalesMonthlyPanel',prev:'zrSalesPrevPanel',year:'zrSalesYearPanel',cafe:'zrSalesCafePanel',revisit:'zrSalesRevisitPanel'};
    Object.entries(ids).forEach(([k,id])=>$(id)?.classList.toggle('active',k===mode));if(mode==='revisit')renderRevisit();if(mode==='year')enhanceYearControls();syncRail();recolorCharts();
  },0)});
}
function refresh(){injectStyle();if(!ensureRevisitPanel())return false;activatePanels();enhanceYearControls();syncRail();recolorCharts();if(currentMode()==='revisit')renderRevisit();return true}
function bind(){if(bound)return;bound=true;document.addEventListener('click',e=>{if(e.target?.closest?.('#zrAdminSalesDashboardRailV1,[data-zr-sales-rail-mode]'))setTimeout(refresh,50)},true);document.addEventListener('change',e=>{if(e.target?.closest?.('#tab-sales-dashboard'))setTimeout(()=>{enhanceYearControls();recolorCharts()},20)},true)}
function boot(){bind();let tries=0;const t=setInterval(()=>{tries++;if(refresh()&&tries>4)clearInterval(t);if(tries>100)clearInterval(t)},120)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,50),{once:true});
})();