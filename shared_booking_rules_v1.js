// Shared pure booking primitives. Preserve legacy coercion and boundary behavior.
// DOM, storage, authentication and page rendering belong to the page adapters.
(()=>{
  'use strict';
  function toMin(t){if(!t)return null;let [h,m]=t.split(":").map(Number);return h*60+m}
  function toTime(m){if(m==null)return "";let h=Math.floor(m/60),mm=m%60;return String(h).padStart(2,"0")+":"+String(mm).padStart(2,"0")}
  function totalPeople(b){return [b?.paidCount,b?.chaperoneCount].reduce((sum,value)=>sum+(Number.isFinite(Number(value))?Number(value):0),0)}
  function validDateStr(y,m,d){return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`}
  function sameIntervalOverlap(s1,e1,s2,e2){return Math.max(s1,s2)<Math.min(e1,e2)}
  function calculatePeople(paidCount,chaperoneCount,price){
    const p=Number(paidCount||0),c=Number(chaperoneCount||0);
    const free=Math.min(c,Math.floor(p/5)),paidChap=Math.max(0,c-free),amount=(p+paidChap)*price;
    return {p,c,free,paidChap,amount};
  }
  function minimumPeople(paidValue,chapValue){
    const paid=Math.max(0,Number(paidValue||0)),chaperone=Math.max(0,Number(chapValue||0));
    const shortage=Math.max(0,15-paid);
    if(paid+chaperone<15)return {paid,chaperone,requiredPaidChaperone:chaperone,freeChaperone:0,paidChaperone:chaperone,totalPaid:paid+chaperone,eligible:false};
    const requiredPaidChaperone=Math.min(chaperone,shortage),basePaid=paid+requiredPaidChaperone;
    const freeChaperone=Math.min(Math.max(0,chaperone-requiredPaidChaperone),Math.floor(basePaid/5));
    const paidChaperone=chaperone-freeChaperone;
    return {paid,chaperone,requiredPaidChaperone,freeChaperone,paidChaperone,totalPaid:paid+paidChaperone,eligible:true};
  }
  function changeOrder(order,menus,general,mealType){
    const paid=Number(order?.paidCount),chap=Number(order?.chaperoneCount),quantity=general?Number(order?.feedQuantity||0):0;
    if(!Number.isSafeInteger(paid)||!Number.isSafeInteger(chap)||paid<0||chap<0||paid+chap<15)throw Error('인원은 합계 15명 이상의 정수로 입력해주세요.');
    if(!Number.isSafeInteger(quantity)||quantity<0||!Number.isSafeInteger(quantity*10000))throw Error('먹이 수량을 확인해주세요.');
    const items=[],seen=new Set();
    if(!general&&mealType==='cafe'){
      if(!Array.isArray(order.cafeItems))throw Error('카페 메뉴를 선택해주세요.');
      for(const row of order.cafeItems){
        const qty=Number(row.qty),id=String(row.id||''),menu=menus.find(m=>String(m.id)===id&&m.active!==false);
        if(!Number.isSafeInteger(qty)||qty<0||seen.has(id))throw Error('카페 주문 수량을 확인해주세요.');
        seen.add(id);if(!qty)continue;
        if(!menu)throw Error('변경되거나 판매가 종료된 카페 메뉴를 다시 선택해주세요.');
        const price=Number(menu.price);if(!Number.isFinite(price)||price<0||!Number.isSafeInteger(price*qty))throw Error('카페 메뉴 금액을 확인해주세요.');
        items.push({id,name:String(menu.name||''),category:menu.category,qty,price,subtotal:price*qty});
      }
      if(!items.length)throw Error('카페 메뉴를 1개 이상 선택해주세요.');
    }
    const people=minimumPeople(paid,chap),entryAmount=people.totalPaid*15000,cafe={items,amount:items.reduce((sum,item)=>sum+item.subtotal,0)};
    if(!Number.isSafeInteger(entryAmount+cafe.amount+quantity*10000))throw Error('예약 금액을 확인해주세요.');
    return {paidCount:paid,chaperoneCount:chap,freeChaperone:people.freeChaperone,paidChaperone:people.paidChaperone,entryAmount,cafe,feedOrder:{kind:'12-species',quantity,unitPrice:10000,amount:quantity*10000},totalAmount:entryAmount+cafe.amount+quantity*10000};
  }
  function endTime(start,duration){
    const s=toMin(start),d=Number(duration||0);
    return s!=null&&d?toTime(s+d):'';
  }
  function durationLabel(entry,exit){
    const a=toMin(entry),b=toMin(exit);if(a==null||b==null)return '-';
    const m=b-a;return `${Math.floor(m/60)}시간${m%60?` ${m%60}분`:''}`;
  }
  function defaultVendors(){
    return [
      {id:'vendor1',name:'정명익',groupPrice:15000,ticketFeeType:'flat',ticketFeeValue:0,cafeFeeType:'flat',cafeFeeValue:0},
      {id:'vendor2',name:'굿모닝',groupPrice:15000,ticketFeeType:'flat',ticketFeeValue:0,cafeFeeType:'flat',cafeFeeValue:0},
      {id:'vendor3',name:'HK',groupPrice:13000,ticketFeeType:'flat',ticketFeeValue:0,cafeFeeType:'flat',cafeFeeValue:0},
      {id:'vendor4',name:'EGL',groupPrice:13000,ticketFeeType:'flat',ticketFeeValue:0,cafeFeeType:'flat',cafeFeeValue:0},
      ...Array.from({length:6},(_,i)=>({id:'vendor'+(i+5),name:'',groupPrice:15000,ticketFeeType:'flat',ticketFeeValue:0,cafeFeeType:'flat',cafeFeeValue:0}))
    ];
  }

  function normalizeSettings(s){
    if(!Number.isFinite(Number(s.autoCloseLimit)))s.autoCloseLimit=s.autoClose===false?0:4;
    s.autoCloseLimit=Math.max(0,Math.min(30,Number(s.autoCloseLimit)||0));
    s.autoClose=s.autoCloseLimit>0;
    if(s.playgroundLimitEnabled===undefined)s.playgroundLimitEnabled=true;
    if(!Array.isArray(s.outsourcingVendors))s.outsourcingVendors=defaultVendors();
    while(s.outsourcingVendors.length<10){
      const n=s.outsourcingVendors.length+1;
      s.outsourcingVendors.push({id:'vendor'+n,name:'',groupPrice:15000,ticketFeeType:'flat',ticketFeeValue:0,cafeFeeType:'flat',cafeFeeValue:0});
    }
    s.outsourcingVendors=s.outsourcingVendors.slice(0,10).map((v,i)=>({
      id:v.id||('vendor'+(i+1)),name:String(v.name||''),groupPrice:Math.max(0,Number(v.groupPrice||0)),
      ticketFeeType:v.ticketFeeType==='percent'?'percent':'flat',ticketFeeValue:Math.max(0,Number(v.ticketFeeValue||0)),
      cafeFeeType:v.cafeFeeType==='percent'?'percent':'flat',cafeFeeValue:Math.max(0,Number(v.cafeFeeValue||0))
    }));
    return s;
  }
  function dateClosure(s,date,count){
    const limit=Number(s.autoCloseLimit||0),index=s.autoCloseOverrideOpen.indexOf(date);
    const clearOverride=limit>0&&count<limit&&index>=0;
    const autoClosed=limit>0&&count>=limit&&!s.autoCloseOverrideOpen.includes(date);
    return {closed:s.manualClosed.includes(date)||autoClosed,clearOverride,index};
  }
  function bookingLeadDays(s={}){return Math.max(1,Math.min(30,Math.trunc(Number(s.bookingLeadDays)||1)))}
  function koreaDate(now=new Date()){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const v=type=>parts.find(p=>p.type===type).value;return `${v('year')}-${v('month')}-${v('day')}`}
  function earliestBookingDate(s={},now=new Date()){const d=new Date(koreaDate(now)+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+bookingLeadDays(s));return d.toISOString().slice(0,10)}
  function bookingBlockReason(s,date,now=new Date()){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return '';
    const within=rows=>Array.isArray(rows)&&rows.some(r=>r?.start&&r?.end&&date>=r.start&&date<=r.end);
    if(within(s.regularClosurePeriods))return '정기휴무';
    if(within(s.peakSeasonPeriods))return '성수기';
    return date<earliestBookingDate(s,now)?'예약 마감':'';
  }
  function groupProgram(group,date,entry){const d=new Date(date+'T12:00:00+09:00'),day=d.getUTCDay(),t=toMin(entry);return ['유치원, 어린이집','유치원/어린이집','유치원','어린이집'].includes(group)&&Number.isFinite(d.getTime())&&day>=1&&day<=5&&t!==null&&t<720}
  function programBookingCount(rows,date,excludeId){return rows.filter(b=>b.date===date&&(!excludeId||b.id!==excludeId)&&!['cancelled','rejected'].includes(b.status)&&!b.__changePlayHold&&(b.__availabilityOnly?b.programCapacity!==false:groupProgram(b.groupType,b.date,b.entryTime))).length}
  function bookingCapacityClosed(s,rows,b){
    if((s.manualClosed||[]).includes(b.date))return true;
    if(!groupProgram(b.groupType,b.date,b.entryTime))return false;
    const limit=Number(s.autoCloseLimit||0);
    return limit>0&&programBookingCount(rows,b.date,b.id)>=limit&&!(s.autoCloseOverrideOpen||[]).includes(b.date);
  }
  function normalizeGroupBooking(b){
    if(!b.groupType||!b.date||!b.entryTime)return b;
    const program=groupProgram(b.groupType,b.date,b.entryTime);
    const wasGeneral=b.groupBookingMode==='general';
    b.groupBookingMode=program?'program':'general';
    if(!program)b.mealLoc='자리배정 없음';
    else if(wasGeneral&&b.mealLoc==='자리배정 없음')b.mealLoc='';
    if(!program){b.mealType='none';b.mealStart='';b.mealEnd='';b.mealDuration=0;b.playUse='no';b.playStart='';b.playEnd='';b.playDuration=0;b.cafe={items:[],amount:0};b.schedulePublished=false;b.customerSchedule=null}
    const quantity=program?0:Number(b.feedOrder?.quantity||0);
    if(!Number.isSafeInteger(quantity)||quantity<0||!Number.isSafeInteger(quantity*10000))throw Error('먹이 세트 수량을 확인해주세요.');
    b.feedOrder={kind:'12-species',quantity,unitPrice:10000,amount:quantity*10000};
    if(Number.isFinite(Number(b.entryAmount)))b.totalAmount=Number(b.entryAmount)+(b.mealType==='cafe'?Number(b.cafe?.amount||0):0)+b.feedOrder.amount;
    return b;
  }
  function requiresProgramSchedule(b){if(b?.groupBookingMode==='general')return false;if(!b?.groupType||!b?.entryTime||!b?.date)return true;return groupProgram(b.groupType,b.date,b.entryTime)}
  function canDirectEdit(b,now=new Date()){
    if(!b||!['pending','confirmed'].includes(b.status))return false;
    const days=(Date.parse(String(b.date)+'T00:00:00Z')-Date.parse(koreaDate(now)+'T00:00:00Z'))/86400000;
    return Number.isInteger(days)&&days>7;
  }
  window.ZRBookingRules=Object.freeze({canDirectEdit,minimumPeople,changeOrder,toMin,toTime,totalPeople,validDateStr,sameIntervalOverlap,calculatePeople,endTime,durationLabel,normalizeSettings,dateClosure,bookingLeadDays,koreaDate,earliestBookingDate,bookingBlockReason,groupProgram,programBookingCount,bookingCapacityClosed,normalizeGroupBooking,requiresProgramSchedule});
})();
