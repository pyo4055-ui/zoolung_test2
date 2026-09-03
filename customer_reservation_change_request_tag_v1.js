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
function writeInquiries(list){
  try{
    if(typeof window.setStore==='function')window.setStore(INQUIRY_KEY,list);
    else localStorage.setItem(INQUIRY_KEY,JSON.stringify(list));
  }catch{}
}
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
function tagSavedInquiry(before,ctx){
  const list=readList(INQUIRY_KEY);if(list.length<=before.length)return false;
  const index=newInquiryIndex(before,list,ctx);if(index<0)return false;
  const item=list[index];if(!item||item.changeRequest===true||/^\[예약 변경 요청\]/.test(contentOf(item)))return true;
  const key=contentKey(item),b=ctx.booking||{};
  item[key]=structuredContent(ctx);
  item.changeRequest=true;
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
  try{document.dispatchEvent(new CustomEvent('zr:reservation-change-request-tagged',{detail:{index,bookingId:item.changeBookingId}}))}catch{}
  return true;
}
function scheduleTag(before,ctx){
  let done=false;
  for(const ms of [20,80,180,360])setTimeout(()=>{if(!done)done=tagSavedInquiry(before,ctx)},ms);
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
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
document.addEventListener('zr:customer-runtime-ready',()=>{syncInquiryType();setTimeout(syncInquiryType,80)},{once:true});
})();