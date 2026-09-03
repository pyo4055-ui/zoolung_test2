(()=>{
'use strict';
if(window.__ZR_CUSTOMER_RESERVATION_CHANGE_REQUEST_TAG_V1)return;
window.__ZR_CUSTOMER_RESERVATION_CHANGE_REQUEST_TAG_V1=true;

const INQUIRY_KEY='zr_inquiries';
const BOOKING_KEY='zr_bookings';
const $=id=>document.getElementById(id);
const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
const tel=v=>String(v||'').replace(/\D/g,'');

function readList(key){try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:[]}catch{return[]}}
function writeList(key,list){
  try{
    if(typeof window.setStore==='function')window.setStore(key,list);
    else localStorage.setItem(key,JSON.stringify(list));
  }catch{}
}
function writeInquiries(list){writeList(INQUIRY_KEY,list)}
function writeBookings(list){writeList(BOOKING_KEY,list)}
function contentKey(item){for(const k of ['content','message','inquiry','text'])if(Object.prototype.hasOwnProperty.call(item||{},k))return k;return 'content'}
function contentOf(item){return String(item?.[contentKey(item)]??'')}
function mobileOf(item){for(const k of ['mobile','mobilePhone','cellphone','cellPhone','hp','inqMobile','contact','phone','inqPhone','tel','telephone']){const v=tel(item?.[k]);if(v)return v}return''}
function isChangeMode(){return !!$('inquiryModal')?.classList.contains('zr-reservation-change-mode')}
function selectedBooking(){
  const id=String($('zrChangeBookingSelect')?.value||'');
  if(!id)return null;
  return readList(BOOKING_KEY).find(b=>b&&!b.__availabilityOnly&&String(b.id||'')===id)||null;
}
function requestDate(){return String($('inqVisitDate')?.value||($('inqVisitMonth')?.value&&$('inqVisitDay')?.value?`${$('inqVisitMonth').value}-${$('inqVisitDay').value}`:''))}
function lineValue(text,label){
  const target=`${label}:`;
  const line=String(text||'').split(/\r?\n/).find(x=>x.trim().startsWith(target));
  return line?line.trim().slice(target.length).trim():'';
}
function taggedBody(text){
  const q=String(text||'').replace(/\r\n/g,'\n');
  const marker=q.match(/\n단체 인원:\s*\d+명\n\n/);
  return marker?q.slice((marker.index||0)+marker[0].length).trim():q.replace(/^\[[^\]]+\]\s*/,'').trim();
}

function syncInquiryType(){
  const type=$('inqType');if(!type)return;
  const group=[...type.options].find(o=>o.value==='group');
  if(isChangeMode()){
    if(group)group.textContent='예약 변경 요청';
    if(type.value!=='group'){type.value='group';type.dispatchEvent(new Event('change',{bubbles:true}))}
    type.disabled=true;type.setAttribute('aria-disabled','true');
  }else{
    if(group)group.textContent='단체 문의';
    type.disabled=false;type.removeAttribute('aria-disabled');
  }
}
function syncReviewType(){
  if(!isChangeMode())return;
  const card=$('zrInquiryReviewCard');if(!card)return;
  for(const row of card.querySelectorAll('.zr-review-row')){
    const label=norm(row.querySelector('.zr-review-label')?.textContent);
    if(label==='문의 유형'){
      const value=row.querySelector('.zr-review-value');if(value)value.textContent='예약 변경 요청';
    }
  }
}
function contextSnapshot(){
  const booking=selectedBooking();
  return {
    booking,
    requestId:`cr_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    org:norm($('inqOrgName')?.value||booking?.orgName),
    requestedDate:requestDate(),
    requestedTime:String($('inqVisitTime')?.value||''),
    people:Math.trunc(Number($('inqPeople')?.value||0)),
    body:String($('inqContent')?.value||'').trim(),
    name:norm($('inqName')?.value),
    mobile:tel($('inqMobile')?.value)
  };
}
function newInquiryIndex(before,after,ctx){
  const beforeSignatures=new Set(before.map(x=>JSON.stringify(x)));
  let index=after.findIndex(x=>!beforeSignatures.has(JSON.stringify(x)));
  if(index>=0)return index;
  for(let i=after.length-1;i>=0;i--){
    const item=after[i],text=contentOf(item);
    if(!/^\[단체 문의\]/.test(text))continue;
    if(ctx.body&&!text.includes(ctx.body))continue;
    const m=mobileOf(item);if(ctx.mobile&&m&&ctx.mobile!==m)continue;
    return i;
  }
  return -1;
}
function structuredContent(ctx){
  const b=ctx.booking||{};
  return [
    '[예약 변경 요청]',
    `단체명: ${ctx.org||b.orgName||'-'}`,
    `변경 대상 예약번호: ${b.id||'-'}`,
    `기존 예약일: ${b.date||'-'}`,
    `기존 예약시간: ${b.entryTime||'--:--'} ~ ${b.exitTime||'--:--'}`,
    `예약변경날짜: ${ctx.requestedDate||'-'}`,
    `예약변경시간: ${ctx.requestedTime||'--:--'}`,
    `단체 인원: ${Number.isFinite(ctx.people)&&ctx.people>0?ctx.people:0}명`,
    '',
    ctx.body||''
  ].join('\n').trimEnd();
}
function attachBookingRequest(ctx){
  const b=ctx.booking;if(!b?.id)return false;
  const list=readList(BOOKING_KEY),index=list.findIndex(x=>x&&!x.__availabilityOnly&&String(x.id||'')===String(b.id));
  if(index<0)return false;
  const booking=list[index],now=new Date().toISOString();
  booking.reservationChangeRequest={
    id:String(ctx.requestId||`cr_${Date.now()}`),status:'pending',
    oldDate:String(b.date||booking.date||''),oldEntryTime:String(b.entryTime||booking.entryTime||''),oldExitTime:String(b.exitTime||booking.exitTime||''),
    requestedDate:String(ctx.requestedDate||''),requestedTime:String(ctx.requestedTime||''),
    orgName:String(ctx.org||booking.orgName||''),requesterName:String(ctx.name||booking.managerName||''),requesterMobile:String(ctx.mobile||booking.contact||''),
    people:Number.isFinite(ctx.people)&&ctx.people>0?ctx.people:Number(booking.paidCount||0)+Number(booking.chaperoneCount||0),
    body:String(ctx.body||''),createdAt:now,updatedAt:now
  };
  writeBookings(list);
  try{document.dispatchEvent(new CustomEvent('zr:reservation-change-request-shared',{detail:{bookingId:String(b.id),requestId:booking.reservationChangeRequest.id}}))}catch{}
  return true;
}
function tagSavedInquiry(before,ctx){
  const list=readList(INQUIRY_KEY);if(list.length<=before.length)return false;
  const index=newInquiryIndex(before,list,ctx);if(index<0)return false;
  const item=list[index];if(!item)return false;
  const key=contentKey(item),b=ctx.booking||{};
  if(item.changeRequest!==true&&!/^\[예약 변경 요청\]/.test(contentOf(item)))item[key]=structuredContent(ctx);
  item.changeRequest=true;
  item.changeRequestId=String(ctx.requestId||item.changeRequestId||'');
  item.changeRequestStatus='pending';
  item.changeBookingId=String(b.id||'');
  item.changeOldDate=String(b.date||'');
  item.changeOldEntryTime=String(b.entryTime||'');
  item.changeOldExitTime=String(b.exitTime||'');
  item.changeRequestedDate=String(ctx.requestedDate||'');
  item.changeRequestedTime=String(ctx.requestedTime||'');
  item.changeRequestOrgName=String(ctx.org||b.orgName||'');
  item.changeRequestUpdatedAt=new Date().toISOString();
  writeInquiries(list);
  attachBookingRequest(ctx);
  try{document.dispatchEvent(new CustomEvent('zr:reservation-change-request-tagged',{detail:{index,bookingId:item.changeBookingId}}))}catch{}
  return true;
}
function scheduleTag(before,ctx){
  let done=false;
  for(const ms of [20,80,180,360,700])setTimeout(()=>{if(!done)done=tagSavedInquiry(before,ctx)},ms);
}

function migrateLegacyLocalRequest(){
  const inquiries=readList(INQUIRY_KEY),bookings=readList(BOOKING_KEY);
  for(let i=inquiries.length-1;i>=0;i--){
    const item=inquiries[i],text=contentOf(item);
    if(!item||!(item.changeRequest===true||/^\[예약 변경 요청\]/.test(text)))continue;
    const bookingId=String(item.changeBookingId||lineValue(text,'변경 대상 예약번호')||'');if(!bookingId)continue;
    const booking=bookings.find(b=>b&&!b.__availabilityOnly&&String(b.id||'')===bookingId);if(!booking||booking.reservationChangeRequest)continue;
    const ctx={
      booking,requestId:String(item.changeRequestId||`cr_legacy_${Date.now()}_${i}`),
      org:String(item.changeRequestOrgName||lineValue(text,'단체명')||booking.orgName||''),
      requestedDate:String(item.changeRequestedDate||lineValue(text,'예약변경날짜')||''),
      requestedTime:String(item.changeRequestedTime||lineValue(text,'예약변경시간')||''),
      people:Number(lineValue(text,'단체 인원').replace(/[^0-9]/g,''))||Number(booking.paidCount||0)+Number(booking.chaperoneCount||0),
      body:taggedBody(text),name:String(item.name||item.customerName||item.managerName||item.inqName||booking.managerName||''),mobile:mobileOf(item)||tel(booking.contact)
    };
    attachBookingRequest(ctx);break;
  }
}
function install(){
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#zrReservationChangeNoticeConfirm,#changeExisting')){
      for(const ms of [0,40,120,240])setTimeout(syncInquiryType,ms);
      return;
    }
    if(e.target?.closest?.('#inquiryBtn,#zrCustomerEntryInquiryV2')){
      setTimeout(syncInquiryType,0);return;
    }
    if(e.target?.closest?.('#submitInquiry')&&isChangeMode()){
      for(const ms of [0,30,90])setTimeout(syncReviewType,ms);
      return;
    }
    if(e.target?.closest?.('#zrInquiryReviewSubmit')&&isChangeMode()){
      syncReviewType();
      const ctx=contextSnapshot(),before=readList(INQUIRY_KEY);
      scheduleTag(before,ctx);
      return;
    }
    if(e.target?.closest?.('[data-close="inquiryModal"]'))setTimeout(syncInquiryType,0);
  },true);
  document.addEventListener('change',e=>{
    if(e.target?.id==='zrChangeBookingSelect'&&isChangeMode())setTimeout(syncInquiryType,0);
  },true);
  syncInquiryType();
  [0,500,1500].forEach(ms=>setTimeout(migrateLegacyLocalRequest,ms));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
document.addEventListener('zr:customer-runtime-ready',()=>{syncInquiryType();setTimeout(syncInquiryType,80);[100,700,1800].forEach(ms=>setTimeout(migrateLegacyLocalRequest,ms))},{once:true});
})();