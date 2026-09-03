(()=>{
'use strict';
if(window.__ZR_ADMIN_SALES_DAILY_CHART_V1)return;
window.__ZR_ADMIN_SALES_DAILY_CHART_V1=true;

const $=id=>document.getElementById(id);
const BROWN='#8f5a32',ORANGE='#f06423',GRID='#eee6df',ZERO='#e8e2dc';
const PIE=['#5c0910','#8f5a32','#f06423','#f28a35','#f6b16d','#c97a40','#ad6840','#e29a5b'];
const WEEK=['월','화','수','목','금','토','일'];

function allBookings(){
  try{
    const list=typeof window.bookings==='function'?window.bookings():JSON.parse(localStorage.getItem('zr_bookings')||'[]');
    return Array.isArray(list)?list.filter(b=>b&&!b.__availabilityOnly):[];
  }catch{return[]}
}
function extra(st={}){
  const groups=[['actualShopAmount','shopAmount','productAmount'],['actualPassportAmount','passportAmount'],['actualCanoeAmount','canoeAmount'],['actualOtherAmount','otherAmount','extraAmount','additionalAmount']];
  return groups.reduce((sum,keys)=>{const key=keys.find(k=>Object.prototype.hasOwnProperty.call(st,k));return sum+(key?Math.max(0,Number(st[key]||0)):0)},0);
}
function rowOf(b){
  const st=b?.settlement||{},ticket=Math.max(0,Number(st.ticketAmount||0)),cafe=Math.max(0,Number(st.actualCafeAmount||0));
  const vendorId=String(st.vendorId||b?.outsourcingVendorId||'self');
  const vendorName=vendorId==='self'?'자체':String(st?.vendorSnapshot?.name||b?.outsourcingVendorSnapshot?.name||'미분류').trim()||'미분류';
  return {booking:b,date:String(b?.date||''),amount:ticket+cafe+extra(st),vendorId,vendorName};
}
function monthRows(ym){
  return allBookings().filter(b=>{
    if(!b?.settlement?.savedAt)return false;
    if(['cancelled','rejected'].includes(String(b.status||'')))return false;
    return String(b.date||'').slice(0,7)===ym;
  }).map(rowOf);
}
function daysInMonth(ym){
  const m=String(ym||'').match(/^(\d{4})-(\d{2})$/);if(!m)return 31;
  return new Date(Number(m[1]),Number(m[2]),0).getDate();
}
function dailyData(ym,rows){
  const days=daysInMonth(ym),out=Array.from({length:days},(_,i)=>({label:String(i+1),day:i+1,amount:0,count:0}));
  rows.forEach(r=>{const day=Number(r.date.slice(8,10));if(!day||!out[day-1])return;out[day-1].amount+=r.amount;out[day-1].count++});
  return out;
}
function weekdayData(rows){
  const out=WEEK.map(label=>({label,amount:0,count:0}));
  rows.forEach(r=>{
    const d=new Date(`${r.date}T12:00:00`);if(Number.isNaN(d.getTime()))return;
    const idx=(d.getDay()+6)%7;out[idx].amount+=r.amount;out[idx].count++;
  });
  return out;
}
function money(v){return `${Math.round(Number(v||0)).toLocaleString('ko-KR')}원`}
function shortMoney(v){
  const n=Math.round(Number(v||0));
  if(n>=100000000)return `${(n/100000000).toFixed(n>=1000000000?0:1)}억`;
  if(n>=10000)return `${Math.round(n/10000).toLocaleString('ko-KR')}만`;
  return n?`${n.toLocaleString('ko-KR')}`:'0';
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function vendorShares(rows){
  const m=new Map();rows.forEach(r=>m.set(r.vendorName,(m.get(r.vendorName)||0)+Math.max(0,r.amount)));
  return [...m.entries()].map(([name,value])=>({name,value})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value);
}
function vendorPie(rows){
  const data=vendorShares(rows),total=data.reduce((s,x)=>s+x.value,0);
  if(!total)return '<div class="zr-sales-empty-pie"><div class="zr-sales-pie zr-sales-pie-empty"></div><div class="help">해당 월 매출 데이터가 없습니다.</div></div>';
  let acc=0;const parts=data.map((x,i)=>{const s=acc/total*100;acc+=x.value;return `${PIE[i%PIE.length]} ${s}% ${acc/total*100}%`});
  const legend=data.map((x,i)=>`<div class="zr-sales-legend-row"><span class="zr-sales-dot" style="background:${PIE[i%PIE.length]}"></span><span>${esc(x.name)}</span><b>${(x.value/total*100).toFixed(1)}%</b><small>${money(x.value)}</small></div>`).join('');
  return `<div class="zr-sales-pie-wrap"><div class="zr-sales-pie" style="background:conic-gradient(${parts.join(',')})"></div><div class="zr-sales-legend">${legend}</div></div>`;
}
function injectStyle(){
  if($('zrAdminSalesDailyChartV1Style'))return;
  const s=document.createElement('style');s.id='zrAdminSalesDailyChartV1Style';s.textContent=`
    #tab-sales-dashboard .zr-sales-daily-section{margin-top:12px}
    #tab-sales-dashboard .zr-sales-daily-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    #tab-sales-dashboard .zr-sales-daily-card{padding:16px;border:1px solid #e0e5e1;border-radius:12px;background:#fff;min-width:0;overflow:hidden}
    #tab-sales-dashboard .zr-sales-daily-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}
    #tab-sales-dashboard .zr-sales-daily-head h3{margin:0;font-size:15px;color:#302c29}
    #tab-sales-dashboard .zr-sales-daily-head span{font-size:10px;color:#8b8179;text-align:right;white-space:nowrap}
    #tab-sales-dashboard .zr-sales-daily-scroll{overflow-x:auto;padding-bottom:2px}
    #tab-sales-dashboard .zr-sales-daily-bars{height:190px;display:grid;grid-template-columns:repeat(var(--zr-bars),minmax(14px,1fr));gap:3px;align-items:end;min-width:620px;padding:12px 4px 0;background:repeating-linear-gradient(to top,transparent 0,transparent 44px,${GRID} 45px)}
    #tab-sales-dashboard .zr-sales-daily-bars.week{grid-template-columns:repeat(7,minmax(38px,1fr));min-width:360px}
    #tab-sales-dashboard .zr-sales-day{height:178px;display:grid;grid-template-rows:18px 1fr 18px;align-items:end;min-width:0;text-align:center}
    #tab-sales-dashboard .zr-sales-day-value{font-size:8px;font-weight:850;color:#776c64;white-space:nowrap;overflow:hidden;line-height:16px}
    #tab-sales-dashboard .zr-sales-day-track{height:140px;display:flex;align-items:flex-end;justify-content:center;border-bottom:1px solid #d8cfc7}
    #tab-sales-dashboard .zr-sales-day-bar{width:min(16px,78%);min-height:3px;border-radius:4px 4px 1px 1px;display:block;transition:opacity .12s ease}
    #tab-sales-dashboard .zr-sales-daily-bars.week .zr-sales-day-bar{width:min(34px,60%)}
    #tab-sales-dashboard .zr-sales-day:hover .zr-sales-day-bar{opacity:.78}
    #tab-sales-dashboard .zr-sales-day-label{font-size:8px;color:#81776f;line-height:17px}
    #tab-sales-dashboard .zr-sales-daily-card.amount .zr-sales-day-bar{background:${BROWN}}
    #tab-sales-dashboard .zr-sales-daily-card.count .zr-sales-day-bar{background:${ORANGE}}
    #tab-sales-dashboard .zr-sales-day.is-zero .zr-sales-day-bar{background:${ZERO}!important;height:3px!important}
    @media(max-width:1000px){#tab-sales-dashboard .zr-sales-daily-grid{grid-template-columns:1fr}}
    @media print{
      #tab-sales-dashboard .zr-sales-daily-section{margin-top:2mm!important}
      #tab-sales-dashboard .zr-sales-daily-grid{grid-template-columns:1fr 1fr!important;gap:2mm!important}
      #tab-sales-dashboard .zr-sales-daily-card{padding:2mm!important;border-radius:2mm!important;break-inside:avoid!important}
      #tab-sales-dashboard .zr-sales-daily-scroll{overflow:visible!important}
      #tab-sales-dashboard .zr-sales-daily-bars{height:29mm!important;min-width:0!important;grid-template-columns:repeat(var(--zr-bars),minmax(0,1fr))!important;gap:.35mm!important;padding:.8mm 0 0!important}
      #tab-sales-dashboard .zr-sales-daily-bars.week{grid-template-columns:repeat(7,minmax(0,1fr))!important}
      #tab-sales-dashboard .zr-sales-day{height:27mm!important;grid-template-rows:3mm 1fr 3mm!important;min-width:0!important}
      #tab-sales-dashboard .zr-sales-day-track{height:20mm!important}
      #tab-sales-dashboard .zr-sales-day-bar,#tab-sales-dashboard .zr-sales-daily-bars.week .zr-sales-day-bar{width:2.2mm!important;min-height:.5mm!important}
      #tab-sales-dashboard .zr-sales-day-value,#tab-sales-dashboard .zr-sales-day-label{font-size:4.5pt!important;line-height:2.6mm!important}
      #tab-sales-dashboard .zr-sales-daily-head{margin-bottom:1mm!important}#tab-sales-dashboard .zr-sales-daily-head h3{font-size:7.5pt!important}#tab-sales-dashboard .zr-sales-daily-head span{font-size:5pt!important}
    }
  `;document.head.appendChild(s);
}
function barItems(data,key,unit){
  const max=Math.max(1,...data.map(x=>Number(x[key]||0)));
  return data.map(x=>{
    const value=Number(x[key]||0),pct=value?Math.max(4,Math.round(value/max*100)):0;
    const display=key==='amount'?(value?shortMoney(value):''):(value?`${value}건`:'');
    const title=key==='amount'?`${x.label} · ${money(value)}`:`${x.label} · ${value}건`;
    return `<div class="zr-sales-day ${value?'':'is-zero'}" title="${esc(title)}"><div class="zr-sales-day-value">${display}</div><div class="zr-sales-day-track"><i class="zr-sales-day-bar" style="height:${value?pct:0}%"></i></div><div class="zr-sales-day-label">${esc(x.label)}</div></div>`;
  }).join('');
}
function chartCard(cls,title,summary,data,key,isWeek=false){
  return `<div class="zr-sales-daily-card ${cls}"><div class="zr-sales-daily-head"><h3>${title}</h3><span>${summary}</span></div><div class="zr-sales-daily-scroll"><div class="zr-sales-daily-bars ${isWeek?'week':''}" style="--zr-bars:${data.length}">${barItems(data,key)}</div></div></div>`;
}
function replaceVendorPie(body,rows){
  const card=body.querySelector('.zr-sales-grid2 .zr-sales-card:nth-child(2)');if(!card)return;
  const h=card.querySelector('h3');if(h)h.textContent='예약경로별 매출 비율';
  const help=card.querySelector('.help');if(help)help.textContent='자체 예약 + 아웃소싱 업체의 실제 총매출 기준';
  [...card.children].forEach((el,i)=>{if(i>1)el.remove()});
  card.insertAdjacentHTML('beforeend',vendorPie(rows));
}
function render(){
  injectStyle();
  const body=$('zrSalesMonthlyBody'),month=$('zrSalesMonth');if(!body||!month)return false;
  const ym=month.value||'',rows=monthRows(ym),daily=dailyData(ym,rows),week=weekdayData(rows);
  const maxAmount=daily.reduce((a,b)=>b.amount>a.amount?b:a,{label:'-',amount:0}),maxCount=daily.reduce((a,b)=>b.count>a.count?b:a,{label:'-',count:0});
  const weekAmount=week.reduce((a,b)=>b.amount>a.amount?b:a,{label:'-',amount:0}),weekCount=week.reduce((a,b)=>b.count>a.count?b:a,{label:'-',count:0});
  replaceVendorPie(body,rows);
  let host=$('zrSalesDailyCharts');
  if(!host){host=document.createElement('div');host.id='zrSalesDailyCharts';host.className='zr-sales-daily-section';const note=body.querySelector('.zr-sales-note');note?body.insertBefore(host,note):body.appendChild(host)}
  host.innerHTML=`<div class="zr-sales-daily-grid">
    ${chartCard('amount','날짜별 매출금액',maxAmount.amount?`최고 ${maxAmount.label}일 · ${money(maxAmount.amount)}`:'정산 데이터 없음',daily,'amount')}
    ${chartCard('count','날짜별 정산 건수',maxCount.count?`최다 ${maxCount.label}일 · ${maxCount.count}건`:'정산 데이터 없음',daily,'count')}
    ${chartCard('amount','요일별 매출금액',weekAmount.amount?`최고 ${weekAmount.label}요일 · ${money(weekAmount.amount)}`:'정산 데이터 없음',week,'amount',true)}
    ${chartCard('count','요일별 정산 건수',weekCount.count?`최다 ${weekCount.label}요일 · ${weekCount.count}건`:'정산 데이터 없음',week,'count',true)}
  </div>`;
  return true;
}
function schedule(){setTimeout(render,35)}
function bind(){
  document.addEventListener('change',e=>{if(e.target?.id==='zrSalesMonth')schedule()},true);
  document.addEventListener('click',e=>{if(e.target?.closest?.('[data-zr-sales-mode="monthly"],[data-zr-sales-rail-mode="monthly"],#zrAdminSalesDashboardRailV1'))schedule()},true);
}
function boot(){
  bind();injectStyle();let tries=0;const t=setInterval(()=>{tries++;if(render()||tries>60)clearInterval(t)},100);[180,500,1000].forEach(ms=>setTimeout(render,ms));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(render,60));
})();
