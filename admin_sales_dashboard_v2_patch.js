(()=>{
'use strict';
if(window.__ZR_ADMIN_SALES_DASHBOARD_V2_PATCH)return;
window.__ZR_ADMIN_SALES_DASHBOARD_V2_PATCH=true;

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>`${Math.round(Number(v||0)).toLocaleString('ko-KR')}원`;
const PALETTE=['#2f6b4f','#6f9b7c','#9db8a5','#c2d3c7','#9b725e','#c4a58f','#806b5d','#8e9c93','#b8aa88','#6e8174'];
const SUBS=[
  {mode:'monthly',label:'월매출 현황'},
  {mode:'prev',label:'전월매출 현황'},
  {mode:'year',label:'전년매출 현황'},
  {mode:'cafe',label:'단체 카페매출'}
];
let bound=false;

function allBookings(){
  try{
    const list=typeof window.bookings==='function'?window.bookings():JSON.parse(localStorage.getItem('zr_bookings')||'[]');
    return Array.isArray(list)?list.filter(b=>b&&!b.__availabilityOnly):[];
  }catch{return []}
}
function settledInYear(year){
  const y=String(year||'');
  return allBookings().filter(b=>b?.settlement?.savedAt&&!['cancelled','rejected'].includes(String(b.status||''))&&String(b.date||'').slice(0,4)===y);
}
function settledInMonth(ym){
  return allBookings().filter(b=>b?.settlement?.savedAt&&!['cancelled','rejected'].includes(String(b.status||''))&&String(b.date||'').slice(0,7)===ym);
}
function extra(st={}){
  const groups=[['actualShopAmount','shopAmount','productAmount'],['actualPassportAmount','passportAmount'],['actualCanoeAmount','canoeAmount'],['actualOtherAmount','otherAmount','extraAmount','additionalAmount']];
  return groups.reduce((sum,keys)=>{const k=keys.find(x=>Object.prototype.hasOwnProperty.call(st,x));return sum+(k?Math.max(0,Number(st[k]||0)):0)},0);
}
function aggregate(bookings){
  return bookings.reduce((a,b)=>{
    const st=b.settlement||{},ticket=Math.max(0,Number(st.ticketAmount||0)),cafe=Math.max(0,Number(st.actualCafeAmount||0)),add=extra(st);
    a.ticket+=ticket;a.cafe+=cafe;a.extra+=add;a.total+=ticket+cafe+add;a.count++;
    return a;
  },{ticket:0,cafe:0,extra:0,total:0,count:0});
}
function currentMode(){return $('tab-sales-dashboard')?.querySelector('[data-zr-sales-mode].active')?.dataset?.zrSalesMode||'monthly'}
function changeText(cur,base,isMoney=true){
  const diff=cur-base;
  if(base===0)return {diff:isMoney?money(diff):`${diff.toLocaleString('ko-KR')}건`,rate:cur===0?'0.0%':'신규',cls:diff>0?'up':diff<0?'down':''};
  const rate=diff/base*100;
  return {diff:`${diff>0?'+':''}${isMoney?money(diff):`${diff.toLocaleString('ko-KR')}건`}`,rate:`${rate>0?'+':''}${rate.toFixed(1)}%`,cls:rate>0?'up':rate<0?'down':''};
}
function compareRow(label,cur,base,isMoney=true){const c=changeText(cur,base,isMoney);return `<tr><th>${esc(label)}</th><td>${isMoney?money(cur):`${cur.toLocaleString('ko-KR')}건`}</td><td>${isMoney?money(base):`${base.toLocaleString('ko-KR')}건`}</td><td class="${c.cls}">${esc(c.diff)}</td><td class="${c.cls}">${esc(c.rate)}</td></tr>`}
function metric(label,value,sub=''){return `<div class="zr-sales-kpi"><span>${esc(label)}</span><strong>${esc(value)}</strong>${sub?`<small>${esc(sub)}</small>`:''}</div>`}
function pie(data,empty){
  const total=data.reduce((s,x)=>s+Number(x.value||0),0);
  if(!total)return `<div class="zr-sales-empty-pie"><div class="zr-sales-pie zr-sales-pie-empty"></div><div class="help">${esc(empty)}</div></div>`;
  let acc=0;const parts=[];
  data.forEach((x,i)=>{const start=acc/total*100;acc+=Number(x.value||0);parts.push(`${PALETTE[i%PALETTE.length]} ${start}% ${acc/total*100}%`)});
  const legend=data.map((x,i)=>`<div class="zr-sales-legend-row"><span class="zr-sales-dot" style="background:${PALETTE[i%PALETTE.length]}"></span><span>${esc(x.name)}</span><b>${(x.value/total*100).toFixed(1)}%</b><small>${money(x.value)}</small></div>`).join('');
  return `<div class="zr-sales-pie-wrap"><div class="zr-sales-pie" style="background:conic-gradient(${parts.join(',')})"></div><div class="zr-sales-legend">${legend}</div></div>`;
}
function injectStyle(){
  if($('zrAdminSalesDashboardV2PatchStyle'))return;
  const s=document.createElement('style');s.id='zrAdminSalesDashboardV2PatchStyle';s.textContent=`
    @media(min-width:901px){#tab-sales-dashboard .zr-sales-subtabs{display:none!important}}
    @media(max-width:900px){#tab-sales-dashboard .zr-sales-subtabs{display:flex!important;width:100%;box-sizing:border-box}}
    #zrSalesDashboardRailWrap[hidden]{display:none!important}
    #zrSalesDashboardRailWrap.is-submenu-open .zr-admin-shell-submenu{grid-template-rows:1fr;opacity:1;margin-top:2px;margin-bottom:6px}
  `;document.head.appendChild(s);
}
function syncRail(){
  const wrap=$('zrSalesDashboardRailWrap');if(!wrap)return;
  const active=currentMode();wrap.querySelectorAll('[data-zr-sales-rail-mode]').forEach(b=>b.classList.toggle('is-active',b.dataset.zrSalesRailMode===active));
  const sec=$('tab-sales-dashboard'),on=sec&&!sec.classList.contains('hidden');wrap.classList.toggle('is-submenu-open',!!on);wrap.querySelector(':scope > .zr-admin-shell-item')?.setAttribute('aria-expanded',on?'true':'false');
  if(on){const path=$('zrAdminShellPath'),sub=SUBS.find(x=>x.mode===active);if(path)path.textContent=`매출 / 매출 현황 / ${sub?.label||'월매출 현황'}`}
}
function clickMode(mode){
  const btn=$('tab-sales-dashboard')?.querySelector(`[data-zr-sales-mode="${mode}"]`);if(!btn)return;
  btn.click();setTimeout(()=>{if(mode==='year')renderAnnual();if(mode==='cafe')renderCafeMenu();syncRail()},20);
}
function ensureRailSubmenu(){
  const parent=$('zrAdminSalesDashboardRailV1');if(!parent)return false;
  let wrap=$('zrSalesDashboardRailWrap');if(wrap){syncRail();return true}
  const host=parent.parentElement;if(!host)return false;
  wrap=document.createElement('div');wrap.id='zrSalesDashboardRailWrap';wrap.className='zr-admin-shell-item-wrap';wrap.dataset.group='sales';
  host.insertBefore(wrap,parent);wrap.appendChild(parent);parent.setAttribute('aria-haspopup','true');parent.setAttribute('aria-expanded','false');
  const chevron=document.createElement('span');chevron.className='zr-admin-shell-submenu-chevron';chevron.setAttribute('aria-hidden','true');chevron.textContent='⌄';parent.appendChild(chevron);
  const menu=document.createElement('div');menu.className='zr-admin-shell-submenu';const inner=document.createElement('div');inner.className='zr-admin-shell-submenu-inner';
  SUBS.forEach(sub=>{const b=document.createElement('button');b.type='button';b.className='zr-admin-shell-subitem';b.dataset.zrSalesRailMode=sub.mode;b.textContent=sub.label;b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if($('tab-sales-dashboard')?.classList.contains('hidden'))parent.click();setTimeout(()=>clickMode(sub.mode),20)});inner.appendChild(b)});
  menu.appendChild(inner);wrap.appendChild(menu);
  parent.addEventListener('click',()=>setTimeout(syncRail,30));syncRail();return true;
}
function yearInputs(){
  const panel=$('zrSalesYearPanel');if(!panel)return null;
  let base=$('zrSalesAnnualBase'),comp=$('zrSalesAnnualCompare');
  if(!base||!comp){
    const y=new Date().getFullYear();
    panel.innerHTML=`<div class="zr-sales-filter"><label>기준 연도<input type="number" id="zrSalesAnnualBase" min="2000" max="2100" step="1" value="${y}"></label><label>비교 연도<input type="number" id="zrSalesAnnualCompare" min="2000" max="2100" step="1" value="${y-1}"></label><span class="help">선택한 연도 전체의 실제결제 매출을 비교합니다.</span></div><div id="zrSalesAnnualBody"></div>`;
    base=$('zrSalesAnnualBase');comp=$('zrSalesAnnualCompare');
    [base,comp].forEach(el=>el?.addEventListener('change',renderAnnual));
  }
  return {base,comp,body:$('zrSalesAnnualBody')};
}
function renderAnnual(){
  if(currentMode()!=='year')return;
  const refs=yearInputs();if(!refs?.body)return;
  const y=new Date().getFullYear(),base=Math.max(2000,Number(refs.base?.value||y)),comp=Math.max(2000,Number(refs.comp?.value||y-1));
  const a=aggregate(settledInYear(base)),b=aggregate(settledInYear(comp));
  refs.body.innerHTML=`<div class="zr-sales-grid2" style="margin-bottom:12px">
    <div class="zr-sales-card"><h3>${base}년</h3><div class="help">기준 연도</div><div class="zr-sales-kpis" style="grid-template-columns:1fr 1fr;margin:0">${metric('총매출',money(a.total))}${metric('건수',`${a.count}건`)}</div></div>
    <div class="zr-sales-card"><h3>${comp}년</h3><div class="help">비교 연도</div><div class="zr-sales-kpis" style="grid-template-columns:1fr 1fr;margin:0">${metric('총매출',money(b.total))}${metric('건수',`${b.count}건`)}</div></div>
  </div>
  <div class="zr-sales-card"><h3>연도별 전년 매출 비교</h3><div class="help">1월~12월 전체 실제결제 매출 기준</div><div class="zr-sales-table-scroll" style="max-height:none"><table class="zr-sales-compare-table"><thead><tr><th>항목</th><th>${base}년</th><th>${comp}년</th><th>증감</th><th>증감률</th></tr></thead><tbody>${compareRow('총매출',a.total,b.total)}${compareRow('매표매출',a.ticket,b.ticket)}${compareRow('카페매출',a.cafe,b.cafe)}${compareRow('부가매출',a.extra,b.extra)}${compareRow('정산 건수',a.count,b.count,false)}</tbody></table></div></div>
  <div class="zr-sales-note">선택한 두 연도의 실제결제 저장 데이터를 연도 전체로 합산합니다. 진행 중인 연도는 현재까지 저장된 데이터까지만 집계됩니다.</div>`;
}
function rawCafeItems(b){
  const list=Array.isArray(b?.cafe?.items)?b.cafe.items:[];
  return list.map(item=>{
    const qty=Math.max(0,Number(item?.qty??item?.quantity??item?.count??0));
    const name=String(item?.name??item?.menuName??item?.title??'미분류').trim()||'미분류';
    const line=Math.max(0,Number(item?.totalAmount??item?.totalPrice??item?.lineAmount??item?.amount??0));
    const unit=Math.max(0,Number(item?.price??item?.unitPrice??item?.menuPrice??item?.salePrice??0));
    return {name,qty,weight:line>0?line:(unit>0&&qty>0?unit*qty:qty)};
  }).filter(x=>x.qty>0||x.weight>0);
}
function menuShares(bookings){
  const map=new Map();
  const add=(name,value,qty)=>{const x=map.get(name)||{name,value:0,qty:0};x.value+=Math.max(0,Number(value||0));x.qty+=Math.max(0,Number(qty||0));map.set(name,x)};
  bookings.forEach(b=>{
    const amount=Math.max(0,Number(b?.settlement?.actualCafeAmount||0));if(!amount)return;
    const items=rawCafeItems(b);if(!items.length){add('메뉴 미분류',amount,0);return}
    const totalWeight=items.reduce((s,x)=>s+x.weight,0);if(totalWeight<=0){add('메뉴 미분류',amount,items.reduce((s,x)=>s+x.qty,0));return}
    let remain=amount;
    items.forEach((item,i)=>{const part=i===items.length-1?remain:Math.max(0,Math.round(amount*item.weight/totalWeight));remain=Math.max(0,remain-part);add(item.name,part,item.qty)});
  });
  return [...map.values()].filter(x=>x.value>0).sort((a,b)=>b.value-a.value);
}
function renderCafeMenu(){
  if(currentMode()!=='cafe')return;
  const ym=$('zrSalesCafeMonth')?.value||(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`})();
  const bookings=settledInMonth(ym).filter(b=>Number(b?.settlement?.actualCafeAmount||0)>0),menus=menuShares(bookings),sum=bookings.reduce((s,b)=>s+Math.max(0,Number(b?.settlement?.actualCafeAmount||0)),0),avg=bookings.length?Math.round(sum/bookings.length):0,body=$('zrSalesCafeBody');if(!body)return;
  const total=menus.reduce((s,x)=>s+x.value,0),menuRows=menus.map(x=>`<tr><td>${esc(x.name)}</td><td>${Math.round(x.qty).toLocaleString('ko-KR')}</td><td>${total?`${(x.value/total*100).toFixed(1)}%`:'0.0%'}</td><td>${money(x.value)}</td></tr>`).join('');
  const orgRows=bookings.sort((a,b)=>Number(b.settlement.actualCafeAmount||0)-Number(a.settlement.actualCafeAmount||0)).map(b=>`<tr><td>${esc(String(b.date||''))}</td><td>${esc(b.orgName||'-')}</td><td>${esc(b.groupType||'미분류')}</td><td>${esc(b?.settlement?.vendorSnapshot?.name||b?.outsourcingVendorSnapshot?.name||'자체')}</td><td>${money(b.settlement.actualCafeAmount)}</td></tr>`).join('');
  body.innerHTML=`<div class="zr-sales-kpis" style="grid-template-columns:repeat(4,minmax(0,1fr))">
    ${metric('단체 카페매출',money(sum),ym)}${metric('카페 이용 단체',`${bookings.length}건`,'실제 카페 결제 1원 이상')}${metric('단체당 평균',money(avg),'카페 이용 단체 기준')}${metric('매출 1위 메뉴',menus[0]?.name||'-',menus[0]?money(menus[0].value):'집계 없음')}
  </div>
  <div class="zr-sales-grid2">
    <div class="zr-sales-card"><h3>메뉴별 카페매출 비율</h3><div class="help">실제 카페 총매출을 예약 메뉴 구성 비율로 배분</div>${pie(menus,'해당 월 메뉴별 카페매출 데이터가 없습니다.')}</div>
    <div class="zr-sales-card"><h3>메뉴별 매출 상세</h3><div class="help">메뉴별 매출 비율과 주문수량</div><div class="zr-sales-table-scroll"><table class="zr-sales-cafe-table"><thead><tr><th>메뉴</th><th>수량</th><th>비율</th><th>배분 매출</th></tr></thead><tbody>${menuRows||'<tr><td colspan="4" style="text-align:center;color:#8a918c">메뉴 데이터가 없습니다.</td></tr>'}</tbody></table></div></div>
  </div>
  <div class="zr-sales-card" style="margin-top:12px"><h3>단체별 카페매출</h3><div class="help">카페 실제 결제금액이 큰 순서</div><div class="zr-sales-table-scroll"><table class="zr-sales-cafe-table"><thead><tr><th>방문일</th><th>단체명</th><th>단체유형</th><th>결제구분</th><th>카페매출</th></tr></thead><tbody>${orgRows||'<tr><td colspan="5" style="text-align:center;color:#8a918c">카페매출 데이터가 없습니다.</td></tr>'}</tbody></table></div></div>
  <div class="zr-sales-note">현재 실제결제에는 카페 총액만 저장되므로 메뉴별 매출은 예약에 저장된 메뉴 구성으로 총액을 배분합니다. 메뉴 가격 정보가 있으면 금액비중, 없으면 수량비중을 사용하며 메뉴 정보가 없는 기존 건은 ‘메뉴 미분류’로 표시합니다.</div>`;
}
function refreshMode(){const m=currentMode();if(m==='year')renderAnnual();if(m==='cafe')renderCafeMenu();syncRail()}
function bindEvents(){
  if(bound)return;bound=true;
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#tab-sales-dashboard [data-zr-sales-mode]'))setTimeout(refreshMode,25);
    const other=e.target?.closest?.('#zrAdminShellRail .zr-admin-shell-item');if(other&&other.id!=='zrAdminSalesDashboardRailV1')setTimeout(syncRail,25);
  },true);
  document.addEventListener('change',e=>{if(e.target?.closest?.('#tab-sales-dashboard'))setTimeout(refreshMode,25)},true);
}
function boot(){
  injectStyle();bindEvents();let tries=0;
  const t=setInterval(()=>{
    tries++;const ready=!!$('tab-sales-dashboard')&&ensureRailSubmenu();
    if(ready){refreshMode();if(tries>3)clearInterval(t)}
    if(tries>100)clearInterval(t);
  },120);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,50),{once:true});
})();
