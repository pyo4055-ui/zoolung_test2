(()=>{
'use strict';
if(window.__ZR_ADMIN_SALES_COMPARE_CHART_V1)return;
window.__ZR_ADMIN_SALES_COMPARE_CHART_V1=true;

const $=id=>document.getElementById(id);
let observer=null,timer=null;
const POS='#f06423',NEG='#8f5a32',ZERO='#d9c6b8';

function injectStyle(){
  if($('zrAdminSalesCompareChartV1Style'))return;
  const s=document.createElement('style');
  s.id='zrAdminSalesCompareChartV1Style';
  s.textContent=`
    #tab-sales-dashboard .zr-sales-change-chart{margin-top:12px;padding:15px;border:1px solid #e2d9d0;border-radius:11px;background:#fff;box-sizing:border-box;overflow:hidden}
    #tab-sales-dashboard .zr-sales-change-chart-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
    #tab-sales-dashboard .zr-sales-change-chart-head h3{margin:0;font-size:15px;color:#302c29}
    #tab-sales-dashboard .zr-sales-change-chart-legend{display:flex;align-items:center;gap:12px;font-size:11px;color:#766d66;white-space:nowrap}
    #tab-sales-dashboard .zr-sales-change-chart-legend span{display:inline-flex;align-items:center;gap:5px}
    #tab-sales-dashboard .zr-sales-change-chart-legend i{width:9px;height:9px;border-radius:2px;display:inline-block}
    #tab-sales-dashboard .zr-sales-change-chart-scroll{overflow-x:auto;padding:2px 0 0}
    #tab-sales-dashboard .zr-sales-change-bars{display:grid;grid-template-columns:repeat(5,minmax(92px,1fr));gap:12px;min-width:540px;align-items:end}
    #tab-sales-dashboard .zr-sales-change-item{text-align:center;min-width:0}
    #tab-sales-dashboard .zr-sales-change-value{height:20px;font-size:11px;font-weight:900;color:#5c514a;line-height:20px;white-space:nowrap}
    #tab-sales-dashboard .zr-sales-change-plot{height:150px;position:relative;margin:0 8px}
    #tab-sales-dashboard .zr-sales-change-zero{position:absolute;left:0;right:0;top:50%;height:1px;background:#ddcfc4}
    #tab-sales-dashboard .zr-sales-change-zero:after{content:'0%';position:absolute;right:0;top:-14px;font-size:9px;color:#a09187}
    #tab-sales-dashboard .zr-sales-change-bar{position:absolute;left:50%;width:38px;max-width:70%;transform:translateX(-50%);display:block}
    #tab-sales-dashboard .zr-sales-change-bar.is-up{bottom:50%;background:${POS};border-radius:7px 7px 2px 2px}
    #tab-sales-dashboard .zr-sales-change-bar.is-down{top:50%;background:${NEG};border-radius:2px 2px 7px 7px}
    #tab-sales-dashboard .zr-sales-change-bar.is-zero{bottom:calc(50% - 2px);height:4px!important;background:${ZERO};border-radius:999px}
    #tab-sales-dashboard .zr-sales-change-label{margin-top:5px;font-size:11px;font-weight:850;color:#4e4844;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    @media(max-width:700px){#tab-sales-dashboard .zr-sales-change-chart-head{align-items:flex-start;flex-direction:column}.zr-sales-change-chart-legend{font-size:10px!important}}
    @media print{
      #tab-sales-dashboard .zr-sales-change-chart{margin-top:3mm!important;padding:3mm!important;break-inside:avoid-page!important;page-break-inside:avoid!important}
      #tab-sales-dashboard .zr-sales-change-chart-scroll{overflow:visible!important}
      #tab-sales-dashboard .zr-sales-change-bars{min-width:0!important;gap:2mm!important}
      #tab-sales-dashboard .zr-sales-change-plot{height:34mm!important}
      #tab-sales-dashboard .zr-sales-change-bar{width:8mm!important}
    }
  `;
  document.head.appendChild(s);
}

function rateInfo(text,currentText,baseText){
  const raw=String(text||'').trim();
  if(raw.includes('신규'))return {kind:'up',rate:null,rateLabel:'신규',newItem:true};
  const n=parseFloat(raw.replace(/[^0-9+\-.]/g,''));
  if(Number.isFinite(n))return {kind:n>0?'up':n<0?'down':'zero',rate:n,rateLabel:`${n>0?'+':''}${n.toFixed(1)}%`,newItem:false};
  const cur=Number(String(currentText||'').replace(/[^0-9.-]/g,''))||0;
  const base=Number(String(baseText||'').replace(/[^0-9.-]/g,''))||0;
  if(base===0&&cur>0)return {kind:'up',rate:null,rateLabel:'신규',newItem:true};
  return {kind:'zero',rate:0,rateLabel:'0.0%',newItem:false};
}

function tableData(table){
  return [...table.querySelectorAll('tbody tr')].map(row=>{
    const cells=[...row.children];if(cells.length<5)return null;
    return {
      name:String(cells[0].textContent||'').trim(),
      ...rateInfo(cells[4].textContent,cells[1].textContent,cells[2].textContent)
    };
  }).filter(Boolean).slice(0,5);
}

function chartHtml(data,title){
  const finite=data.map(x=>Math.abs(Number(x.rate))).filter(Number.isFinite);
  const maxRate=Math.max(10,...finite, data.some(x=>x.newItem)?100:0);
  const items=data.map(x=>{
    const magnitude=x.newItem?maxRate:Math.abs(Number(x.rate||0));
    const h=x.kind==='zero'?4:Math.max(14,Math.min(70,Math.round(magnitude/maxRate*70)));
    const cls=x.kind==='up'?'is-up':x.kind==='down'?'is-down':'is-zero';
    return `<div class="zr-sales-change-item"><div class="zr-sales-change-value">${x.rateLabel}</div><div class="zr-sales-change-plot"><div class="zr-sales-change-zero"></div><i class="zr-sales-change-bar ${cls}" style="height:${h}px"></i></div><div class="zr-sales-change-label" title="${x.name}">${x.name}</div></div>`;
  }).join('');
  return `<div class="zr-sales-change-chart-head"><h3>${title}</h3><div class="zr-sales-change-chart-legend"><span><i style="background:${POS}"></i>증가</span><span><i style="background:${NEG}"></i>감소</span></div></div><div class="zr-sales-change-chart-scroll"><div class="zr-sales-change-bars">${items}</div></div>`;
}

function enhanceTable(table){
  if(!table?.classList?.contains('zr-sales-compare-table'))return;
  const panel=table.closest('.zr-sales-panel');if(!panel)return;
  const id=String(panel.id||'');
  if(!/prev|year/i.test(id))return;
  const data=tableData(table);if(!data.length)return;
  const sig=JSON.stringify(data.map(x=>[x.name,x.rateLabel,x.rate,x.kind,x.newItem]));
  const card=table.closest('.zr-sales-card');if(!card)return;
  let chart=card.nextElementSibling;
  if(!chart?.classList?.contains('zr-sales-change-chart')){
    chart=document.createElement('div');chart.className='zr-sales-change-chart';card.insertAdjacentElement('afterend',chart);
  }
  if(chart.dataset.sig===sig)return;
  chart.dataset.sig=sig;
  chart.innerHTML=chartHtml(data,/year/i.test(id)?'전년 대비 항목별 증감률':'전월 대비 항목별 증감률');
}

function refresh(){
  injectStyle();
  document.querySelectorAll('#tab-sales-dashboard .zr-sales-compare-table').forEach(enhanceTable);
}
function schedule(){clearTimeout(timer);timer=setTimeout(refresh,20)}
function observe(){
  const root=$('tab-sales-dashboard');if(!root)return false;
  if(observer)return true;
  observer=new MutationObserver(schedule);observer.observe(root,{childList:true,subtree:true});return true;
}
function bind(){
  document.addEventListener('click',e=>{if(e.target?.closest?.('#tab-sales-dashboard,#zrSalesDashboardRailWrap'))setTimeout(refresh,30)},true);
  document.addEventListener('change',e=>{if(e.target?.closest?.('#tab-sales-dashboard'))setTimeout(refresh,30)},true);
}
function boot(){
  bind();refresh();
  if(!observe()){
    let n=0;const t=setInterval(()=>{n++;refresh();if(observe()||n>60)clearInterval(t)},100);
  }
  [120,350,800].forEach(ms=>setTimeout(refresh,ms));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(refresh,30));
})();
