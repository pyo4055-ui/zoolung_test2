(()=>{
'use strict';
if(window.__ZR_ADMIN_SALES_DAILY_CHART_V1)return;
window.__ZR_ADMIN_SALES_DAILY_CHART_V1=true;

const $=id=>document.getElementById(id);
const BROWN='#8f5a32',ORANGE='#f06423',GRID='#eee6df',ZERO='#e8e2dc';

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
function monthRows(ym){
  return allBookings().filter(b=>{
    if(!b?.settlement?.savedAt)return false;
    if(['cancelled','rejected'].includes(String(b.status||'')))return false;
    return String(b.date||'').slice(0,7)===ym;
  });
}
function daysInMonth(ym){
  const m=String(ym||'').match(/^(\d{4})-(\d{2})$/);if(!m)return 31;
  return new Date(Number(m[1]),Number(m[2]),0).getDate();
}
function dailyData(ym){
  const days=daysInMonth(ym),out=Array.from({length:days},(_,i)=>({day:i+1,amount:0,count:0}));
  monthRows(ym).forEach(b=>{
    const day=Number(String(b.date||'').slice(8,10));if(!day||!out[day-1])return;
    const st=b.settlement||{},ticket=Math.max(0,Number(st.ticketAmount||0)),cafe=Math.max(0,Number(st.actualCafeAmount||0));
    out[day-1].amount+=ticket+cafe+extra(st);out[day-1].count++;
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
    #tab-sales-dashboard .zr-sales-daily-bars{height:190px;display:grid;grid-template-columns:repeat(var(--zr-days),minmax(14px,1fr));gap:3px;align-items:end;min-width:620px;padding:12px 4px 0;background:repeating-linear-gradient(to top,transparent 0,transparent 44px,${GRID} 45px)}
    #tab-sales-dashboard .zr-sales-day{height:178px;display:grid;grid-template-rows:18px 1fr 18px;align-items:end;min-width:0;text-align:center}
    #tab-sales-dashboard .zr-sales-day-value{font-size:8px;font-weight:850;color:#776c64;white-space:nowrap;overflow:hidden;text-overflow:clip;line-height:16px}
    #tab-sales-dashboard .zr-sales-day-track{height:140px;display:flex;align-items:flex-end;justify-content:center;border-bottom:1px solid #d8cfc7}
    #tab-sales-dashboard .zr-sales-day-bar{width:min(16px,78%);min-height:3px;border-radius:4px 4px 1px 1px;display:block;transition:opacity .12s ease}
    #tab-sales-dashboard .zr-sales-day:hover .zr-sales-day-bar{opacity:.78}
    #tab-sales-dashboard .zr-sales-day-label{font-size:8px;color:#81776f;line-height:17px}
    #tab-sales-dashboard .zr-sales-daily-card.amount .zr-sales-day-bar{background:${BROWN}}
    #tab-sales-dashboard .zr-sales-daily-card.count .zr-sales-day-bar{background:${ORANGE}}
    #tab-sales-dashboard .zr-sales-day.is-zero .zr-sales-day-bar{background:${ZERO}!important;height:3px!important}
    @media(max-width:1000px){#tab-sales-dashboard .zr-sales-daily-grid{grid-template-columns:1fr}}
    @media print{
      #tab-sales-dashboard .zr-sales-daily-section{margin-top:3mm!important}
      #tab-sales-dashboard .zr-sales-daily-grid{grid-template-columns:1fr 1fr!important;gap:3mm!important}
      #tab-sales-dashboard .zr-sales-daily-card{padding:2.5mm!important;border-radius:2mm!important;break-inside:avoid!important}
      #tab-sales-dashboard .zr-sales-daily-scroll{overflow:visible!important}
      #tab-sales-dashboard .zr-sales-daily-bars{height:34mm!important;min-width:0!important;gap:.5mm!important;padding:1mm 0 0!important}
      #tab-sales-dashboard .zr-sales-day{height:32mm!important;grid-template-rows:3.5mm 1fr 3.5mm!important}
      #tab-sales-dashboard .zr-sales-day-track{height:24mm!important}
      #tab-sales-dashboard .zr-sales-day-bar{width:2.4mm!important;min-height:.6mm!important}
      #tab-sales-dashboard .zr-sales-day-value,#tab-sales-dashboard .zr-sales-day-label{font-size:4.8pt!important;line-height:3mm!important}
    }
  `;document.head.appendChild(s);
}
function barItems(data,key,colorType){
  const max=Math.max(1,...data.map(x=>Number(x[key]||0)));
  return data.map(x=>{
    const value=Number(x[key]||0),pct=value?Math.max(4,Math.round(value/max*100)):0;
    const display=key==='amount'?(value?shortMoney(value):''):(value?`${value}건`:'');
    const title=key==='amount'?`${x.day}일 · ${money(value)}`:`${x.day}일 · ${value}건`;
    return `<div class="zr-sales-day ${value?'':'is-zero'}" title="${title}"><div class="zr-sales-day-value">${display}</div><div class="zr-sales-day-track"><i class="zr-sales-day-bar" style="height:${value?pct:0}%"></i></div><div class="zr-sales-day-label">${x.day}</div></div>`;
  }).join('');
}
function render(){
  injectStyle();
  const body=$('zrSalesMonthlyBody'),month=$('zrSalesMonth');if(!body||!month)return false;
  const ym=month.value||'',data=dailyData(ym),maxAmount=data.reduce((a,b)=>b.amount>a.amount?b:a,{day:0,amount:0}),maxCount=data.reduce((a,b)=>b.count>a.count?b:a,{day:0,count:0});
  let host=$('zrSalesDailyCharts');
  if(!host){
    host=document.createElement('div');host.id='zrSalesDailyCharts';host.className='zr-sales-daily-section';
    const note=body.querySelector('.zr-sales-note');note?body.insertBefore(host,note):body.appendChild(host);
  }
  host.innerHTML=`<div class="zr-sales-daily-grid">
    <div class="zr-sales-daily-card amount"><div class="zr-sales-daily-head"><h3>날짜별 매출금액</h3><span>${maxAmount.amount?`최고 ${maxAmount.day}일 · ${money(maxAmount.amount)}`:'정산 데이터 없음'}</span></div><div class="zr-sales-daily-scroll"><div class="zr-sales-daily-bars" style="--zr-days:${data.length}">${barItems(data,'amount','amount')}</div></div></div>
    <div class="zr-sales-daily-card count"><div class="zr-sales-daily-head"><h3>날짜별 정산 건수</h3><span>${maxCount.count?`최다 ${maxCount.day}일 · ${maxCount.count}건`:'정산 데이터 없음'}</span></div><div class="zr-sales-daily-scroll"><div class="zr-sales-daily-bars" style="--zr-days:${data.length}">${barItems(data,'count','count')}</div></div></div>
  </div>`;
  return true;
}
function schedule(){setTimeout(render,30)}
function bind(){
  document.addEventListener('change',e=>{if(e.target?.id==='zrSalesMonth')schedule()},true);
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('[data-zr-sales-mode="monthly"],[data-zr-sales-rail-mode="monthly"],#zrAdminSalesDashboardRailV1'))schedule();
  },true);
}
function boot(){
  bind();injectStyle();
  let tries=0;const t=setInterval(()=>{tries++;if(render()||tries>60)clearInterval(t)},100);
  [180,500,1000].forEach(ms=>setTimeout(render,ms));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(render,60));
})();
