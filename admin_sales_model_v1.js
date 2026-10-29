// Sales data model. Views own markup, colors, navigation and printing.
(()=>{
'use strict';
if(window.ZRSalesModel)return;
function create(readBookings,now=()=>new Date()){
function allBookings(includeAvailability=false){try{const list=readBookings();return Array.isArray(list)?list.filter(b=>b&&(includeAvailability||!b.__availabilityOnly)):[]}catch{return []}}
function extraBreakdown(st={}){
  if(Array.isArray(st.additionalSales)){
    const out={shop:0,passport:0,canoe:0,other:0,feed:0,cafeExtra:0,total:0,hasField:true};
    const keys={shop:'shop',feed:'feed',passport:'passport',canoe:'canoe',cafe:'cafeExtra',other:'other'};
    for(const row of st.additionalSales){const key=keys[row?.category],amount=Number(row?.amount);if(!key||!Number.isFinite(amount)||amount<0)continue;out[key]+=amount;out.total+=amount}
    return out;
  }
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
function aggregateRows(rows){
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
function settledInYear(year){
  const y=String(year||'');
  return allBookings().filter(b=>b?.settlement?.savedAt&&!['cancelled','rejected'].includes(String(b.status||''))&&String(b.date||'').slice(0,4)===y);
}
function settledInMonth(ym){
  return allBookings().filter(b=>b?.settlement?.savedAt&&!['cancelled','rejected'].includes(String(b.status||''))&&String(b.date||'').slice(0,7)===ym);
}
function extra(st={}){return extraBreakdown(st).total}
function aggregateBookings(bookings){
  return bookings.reduce((a,b)=>{
    const st=b.settlement||{},ticket=Math.max(0,Number(st.ticketAmount||0)),cafe=Math.max(0,Number(st.actualCafeAmount||0)),add=extra(st);
    a.ticket+=ticket;a.cafe+=cafe;a.extra+=add;a.total+=ticket+cafe+add;a.count++;
    return a;
  },{ticket:0,cafe:0,extra:0,total:0,count:0});
}
function normOrg(v){return String(v||'').toLowerCase().replace(/\s+/g,'').replace(/[()\[\]{}._-]/g,'').trim()}
function visitRows(){
  const today=now();today.setHours(23,59,59,999);
  return allBookings(true).filter(b=>{
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
  const out=['월','화','수','목','금','토','일'].map(label=>({label,amount:0,count:0}));
  rows.forEach(r=>{
    const d=new Date(`${r.date}T12:00:00`);if(Number.isNaN(d.getTime()))return;
    const idx=(d.getDay()+6)%7;out[idx].amount+=r.amount;out[idx].count++;
  });
  return out;
}
return Object.freeze({allBookings,extraBreakdown,salesRow,rowsForMonth,aggregateRows,groupShares,vendorShares,settledInYear,settledInMonth,extra,aggregateBookings,normOrg,visitRows,statsForPeriod,monthEnd,monthStats,yearStats,rowOf,monthRows,daysInMonth,dailyData,weekdayData});
}
window.ZRSalesModel=Object.freeze({create});
})();
