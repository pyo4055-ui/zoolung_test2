// Settlement calculations only. No DOM, storage, or network access.
// syncToCurrentRules updates the supplied booking in place and reports changes;
// callers retain responsibility for selecting current vendors and persisting the list.
(()=>{
'use strict';
if(window.ZRSettlementRules)return;
  const assignedVendorId=b=>b?.settlement?.vendorId||b?.outsourcingVendorId||'';
  const fallbackVendor=b=>b?.settlement?.vendorSnapshot||b?.outsourcingVendorSnapshot||null;
  const paidAdmissions=st=>Math.max(0,Number(st?.actualPaidCount||0))+Math.max(0,Number(st?.actualPaidChaperone||0));
  const feeAmount=(amount,type,value,multiplier=1)=>{
    amount=Math.max(0,Number(amount||0));value=Math.max(0,Number(value||0));
    if(type==='percent')return Math.round(amount*value/100);
    return Math.round(value*Math.max(0,Number(multiplier||0)));
  };
  function syncToCurrentRules(b,currentVendor){
    const st=b?.settlement;if(!st||!st.savedAt||st.preserveHistoricalAmounts)return false;
    const id=assignedVendorId(b);if(!id||id==='self')return false;
    const cur=currentVendor(id),old=fallbackVendor(b)||{};
    const rule=cur||old;if(!rule)return false;
    const paid=paidAdmissions(st),ticket=Math.max(0,Number(st.ticketAmount||0)),cafe=Math.max(0,Number(st.actualCafeAmount||0));
    const ticketType=rule.ticketFeeType==='percent'?'percent':'flat',ticketValue=Math.max(0,Number(rule.ticketFeeValue||0));
    const cafeType=rule.cafeFeeType==='percent'?'percent':'flat',cafeValue=Math.max(0,Number(rule.cafeFeeValue||0));
    const ticketFee=feeAmount(ticket,ticketType,ticketValue,paid);
    const cafeFee=cafe<=0?0:feeAmount(cafe,cafeType,cafeValue,1);
    const snap={
      ...(st.vendorSnapshot||old),
      id,
      name:cur?.name||old.name||id,
      groupPrice:Number(st.ticketUnitPrice??old.groupPrice??cur?.groupPrice??0),
      ticketFeeType:ticketType,ticketFeeValue:ticketValue,
      cafeFeeType:cafeType,cafeFeeValue:cafeValue
    };
    const before=JSON.stringify([st.ticketFee,st.cafeFee,st.totalFee,st.vendorSnapshot]);
    st.vendorSnapshot=snap;
    st.ticketFee=ticketFee;st.cafeFee=cafeFee;st.totalFee=ticketFee+cafeFee;
    return before!==JSON.stringify([st.ticketFee,st.cafeFee,st.totalFee,st.vendorSnapshot]);
  }
function vendorSnapshot(v){return {id:v.id,name:v.name,groupPrice:Number(v.groupPrice||0),ticketFeeType:v.ticketFeeType==='percent'?'percent':'flat',ticketFeeValue:Number(v.ticketFeeValue||0),cafeFeeType:v.cafeFeeType==='percent'?'percent':'flat',cafeFeeValue:Number(v.cafeFeeValue||0)}}
function paymentError(c){if(!c.vendor)return 'vendor';if(c.unit<=0)return 'unit';return ''}
const extraCategories=Object.freeze({shop:'상품샵',feed:'먹이',passport:'여권',canoe:'카누',cafe:'카페',other:'기타'});
function normalizeExtras(rows){
  if(!Array.isArray(rows))return [];
  return rows.map(row=>{const amount=Number(row.amount??0);if(!Object.hasOwn(extraCategories,row.category)||!Number.isSafeInteger(amount)||amount<0)throw Error('부가매출 항목과 금액을 확인해주세요.');const result={category:row.category,amount};if(row.category==='other')result.label=String(row.label??'').trim().slice(0,50);if(['passport','feed'].includes(row.category)&&row.quantity!==''&&row.quantity!=null){const quantity=Number(row.quantity);if(!Number.isSafeInteger(quantity)||quantity<0)throw Error('수량은 0 이상의 정수로 입력해주세요.');result.quantity=quantity;}return result});
}
function extraTotal(rows){return normalizeExtras(rows).reduce((sum,row)=>sum+row.amount,0)}
function applyPayment(b,c,now){
  const vendorSnap=vendorSnapshot(c.vendor);
  b.outsourcingVendorId=vendorSnap.id;b.outsourcingVendorSnapshot=vendorSnap;
  b.settlement={adminEditMeta:window.ZRAdminEditMeta?.make()||null,vendorId:vendorSnap.id,vendorSnapshot:vendorSnap,actualPaidCount:c.paid,actualFreeChaperone:c.free,actualPaidChaperone:c.paidChap,actualCafeAmount:c.cafe,ticketUnitPrice:c.unit,ticketAmount:c.ticket,totalActualSales:c.total,ticketFee:c.ticketFee,cafeFee:c.cafeFee,totalFee:c.totalFee,savedAt:now};
  b.settlementStatus='completed';b.settlementCompletedAt=now;
  if(Array.isArray(c.additionalSales)){b.settlement.additionalSales=normalizeExtras(c.additionalSales);b.settlement.totalActualSales=c.ticket+c.cafe+extraTotal(c.additionalSales)}
  return vendorSnap;
}
  function normalizeLegacySettlement(b,markNow,vendorFor,nowIso){
    if(!b?.settlement||b.settlement.preserveHistoricalAmounts)return false;
    const st=b.settlement,snap=vendorFor(b)||st.vendorSnapshot||{};
    const vendorId=st.vendorId||b.outsourcingVendorId||snap.id||'self';
    const paid=paidAdmissions(st),unit=Math.max(0,Number(st.ticketUnitPrice??snap.groupPrice??0));
    const ticket=Math.round(paid*unit),cafe=Math.max(0,Number(st.actualCafeAmount||0));
    const isSelf=vendorId==='self';
    const ticketFee=isSelf?0:feeAmount(ticket,snap.ticketFeeType,snap.ticketFeeValue,paid);
    const cafeFee=isSelf||cafe<=0?0:feeAmount(cafe,snap.cafeFeeType,snap.cafeFeeValue,1);
    const before=JSON.stringify({ticketAmount:st.ticketAmount,totalActualSales:st.totalActualSales,ticketFee:st.ticketFee,cafeFee:st.cafeFee,totalFee:st.totalFee,status:b.settlementStatus});
    st.ticketAmount=ticket;
    st.totalActualSales=ticket+cafe+extraTotal(st.additionalSales);
    st.ticketFee=ticketFee;
    st.cafeFee=cafeFee;
    st.totalFee=ticketFee+cafeFee;
    b.settlementStatus='completed';
    if(markNow){
      const now=nowIso();
      st.savedAt=now;b.settlementCompletedAt=now;
    }else if(!b.settlementCompletedAt)b.settlementCompletedAt=st.savedAt||nowIso();
    return before!==JSON.stringify({ticketAmount:st.ticketAmount,totalActualSales:st.totalActualSales,ticketFee:st.ticketFee,cafeFee:st.cafeFee,totalFee:st.totalFee,status:b.settlementStatus});
  }
function withFeedQuantity(rows,b){return rows.map(row=>row.category==='feed'&&row.quantity==null?{...row,quantity:Number(b.feedOrder?.quantity||0)}:{...row})}
function savedExtras(st,b={}){
  if(Array.isArray(st.additionalSales))return withFeedQuantity(st.additionalSales,b);
  if(Array.isArray(b.additionalSales))return withFeedQuantity(b.additionalSales,b);
  const rows=[['shop',st.actualShopAmount??st.shopAmount??st.productAmount],['passport',st.actualPassportAmount??st.passportAmount],['canoe',st.actualCanoeAmount??st.canoeAmount],['other',st.actualOtherAmount??st.otherAmount??st.extraAmount??st.additionalAmount]].filter(([,v])=>Number(v)>0).map(([category,amount])=>({category,amount:Number(amount)}));
  const feed=Number(b.feedOrder?.amount||0);
  if(!st.savedAt&&!b.settlementCompletedAt&&Number.isSafeInteger(feed)&&feed>0)rows.push({category:'feed',amount:feed,quantity:Number(b.feedOrder?.quantity||0)});
  return rows;
}
  window.ZRSettlementRules=Object.freeze({normalizeLegacySettlement,feeAmount,assignedVendorId,fallbackVendor,paidAdmissions,syncToCurrentRules,vendorSnapshot,paymentError,applyPayment,extraCategories,normalizeExtras,extraTotal,savedExtras});
})();
