// New reservation form adapter. Existing saved reservations are never rewritten here.
(()=>{
'use strict';
const $=id=>document.getElementById(id);
function general(){
  const group=$('groupType')?.value,date=$('visitDay')?.value,entry=$('entryTime')?.value;
  if(!group)return false;
  if(!['유치원','어린이집','유치원, 어린이집','유치원/어린이집'].includes(group))return true;
  return !!(date&&entry&&!window.ZRBookingRules.groupProgram(group,date,entry));
}
function order(){
  const purchase=general()&&$('feedPurchase')?.value==='yes';
  const quantity=purchase?Number($('feedQuantity')?.value):0;
  if(!Number.isSafeInteger(quantity)||quantity<0||(purchase&&quantity<1)||!Number.isSafeInteger(quantity*10000))throw Error('먹이 세트 수량은 1개 이상의 정수로 입력해주세요.');
  return {kind:'12-species',quantity,unitPrice:10000,amount:quantity*10000};
}
function amount(){try{return order().amount}catch{return 0}}
function fields(){return {groupBookingMode:general()?'general':'program',mealLoc:general()?'자리배정 없음':'',feedOrder:order()}}
function presentation(){
  const isGeneral=general(),title=$('mealType')?.closest('section')?.querySelector?.('h2');
  if(title){const text=[...title.childNodes].find(n=>n.nodeType===3);if(text)text.textContent=isGeneral?'방문시간':'식사 및 방문시간'}
  for(const id of ['sumMeal','sumPlay']){const row=$(id);row?.classList.toggle('hidden',isGeneral);row?.previousElementSibling?.classList.toggle('hidden',isGeneral)}
  if(isGeneral&&$('visitTimeHelp'))$('visitTimeHelp').textContent='직원 인솔이나 별도 스케줄 없이 자율 관람합니다. 최대 이용시간은 3시간이며, 퇴장은 18:00까지 가능합니다.';
  const entrySelect=$('entryTime'),rules=window.ZRBookingRules;
  if(entrySelect?.options&&typeof window.settings==='function'&&typeof window.bookings==='function'){
    const state=window.settings(),rows=window.bookings(),date=$('visitDay')?.value;
    for(const option of entrySelect.options){
      if(!option.value)continue;
      const closed=!!date&&rules.bookingCapacityClosed(state,rows,{id:window.zrEditingBookingId?.(),date,groupType:$('groupType')?.value,entryTime:option.value});
      option.disabled=closed;option.textContent=option.value+(closed?' (예약 마감)':'');
    }
  }
  let step=0;
  document.querySelectorAll('#customerView .section-no').forEach(number=>{const section=number.closest('section');if(section&&!section.classList.contains('hidden'))number.textContent=String(++step)});
}
function sync(){
  const isGeneral=general(),meal=$('mealType'),play=$('playUse');if(!meal||!play)return false;
  meal.parentElement.classList.toggle('hidden',isGeneral);
  play.closest('section').classList.toggle('hidden',isGeneral);
  $('generalGroupSection')?.classList.toggle('hidden',!isGeneral);
  $('feedQuantityRow')?.classList.toggle('hidden',$('feedPurchase')?.value!=='yes');
  const notice=$('finalReview')?.parentElement.querySelector('.notice');if(notice)notice.classList.toggle('hidden',isGeneral);
  let changed=false;
  if(isGeneral){
    changed=meal.value!=='none';meal.value='none';play.value='no';
    for(const id of ['mealStart','mealDuration','mealEnd','playStart','playDuration','playEnd'])if($(id))$(id).value='';
    for(const id of ['cafeSection','mealTimeSection','playTimeFields'])$(id)?.classList.add('hidden');
    document.querySelectorAll('#customerCafeMenus input[id^="qty_"]').forEach(el=>{if(Number(el.value))el.value='0'});
  }
  const summary=$('feedOrderSummary');if(summary)summary.textContent=amount().toLocaleString('ko-KR')+'원';
  window.ZRParkingGuide?.refresh();
  return changed;
}
window.ZRGroupBooking=Object.freeze({general,order,amount,fields,sync,presentation});
})();
