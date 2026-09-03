(()=>{
'use strict';
if(window.__ZR_CUSTOMER_ENTRY_ACTION_BRIDGE_V1)return;
window.__ZR_CUSTOMER_ENTRY_ACTION_BRIDGE_V1=true;

const $=id=>document.getElementById(id);
const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
const tel=v=>String(v||'').replace(/\D/g,'').slice(0,11);
const toast=msg=>{try{window.toast?.(msg)}catch{}};

function visible(el){
  if(!el||el.classList?.contains('hidden'))return false;
  try{
    const s=getComputedStyle(el);
    return s.display!=='none'&&s.visibility!=='hidden'&&el.getClientRects().length>0;
  }catch{return true}
}
function entryValues(){
  const name=$('zrCustomerEntryNameV2'),phone=$('zrCustomerEntryPhoneV2'),err=$('zrCustomerEntryErrorV2');
  const n=norm(name?.value),p=tel(phone?.value);
  if(name)name.value=n;if(phone)phone.value=p;
  if(!n){if(err)err.textContent='예약자 이름을 입력해주세요.';toast('예약자 이름을 입력해주세요.');name?.focus?.();return null}
  if(!/^010\d{8}$/.test(p)){if(err)err.textContent='연락처는 010으로 시작하는 숫자 11자리로 입력해주세요.';toast('연락처는 010으로 시작하는 숫자 11자리로 입력해주세요.');phone?.focus?.();return null}
  if(err)err.textContent='';
  return {name:n,phone:p};
}
function syncNative(v){
  const name=$('startManager'),phone=$('startContact');
  if(name){name.value=v.name;name.dispatchEvent(new Event('input',{bubbles:true}));name.dispatchEvent(new Event('change',{bubbles:true}))}
  if(phone){phone.value=v.phone;phone.dispatchEvent(new Event('input',{bubbles:true}));phone.dispatchEvent(new Event('change',{bubbles:true}))}
}
function ensureResultsRegion(){
  const start=$('startView');if(!start)return null;
  let region=$('zrCustomerEntryResultsV2');
  if(!region){region=document.createElement('section');region.id='zrCustomerEntryResultsV2';start.appendChild(region)}
  ['existingActions','newBookingActions','existingBookingList'].forEach(id=>{
    const el=$(id);if(el&&el.parentElement!==region)region.appendChild(el);
  });
  return region;
}
function syncLookupState(){
  const start=$('startView');if(!start)return false;
  ensureResultsRegion();
  const existing=$('existingActions'),list=$('existingBookingList');
  const has=visible(existing)||visible(list);
  start.classList.toggle('zr-v2-has-results',has);
  if(has){
    $('newBookingActions')?.classList.add('hidden');
    try{window.__ZR_MODAL_UX_SYNC_HEADERS?.()}catch{}
  }
  return has;
}
function runLookup(){
  const v=entryValues();if(!v)return;
  syncNative(v);ensureResultsRegion();
  const lookup=$('lookupBooking');
  if(!lookup){toast('예약 조회 화면을 준비하지 못했습니다. 새로고침 후 다시 시도해주세요.');return}
  try{lookup.click()}catch{}

  let checkClicked=false;
  const step=()=>{
    ensureResultsRegion();
    $('newBookingActions')?.classList.add('hidden');
    const check=$('checkExisting');
    if(check&&!checkClicked){
      checkClicked=true;
      try{check.click()}catch{}
    }
    syncLookupState();
  };
  [30,100,220,450,800,1250].forEach(ms=>setTimeout(step,ms));
  setTimeout(()=>{
    if(syncLookupState())return;
    let count=0;
    try{
      const list=JSON.parse(localStorage.getItem('zr_bookings')||'[]');
      count=(Array.isArray(list)?list:[]).filter(b=>b&&!b.__availabilityOnly&&norm(b.managerName)===v.name&&tel(b.contact)===v.phone&&String(b.status||'')!=='rejected').length;
    }catch{}
    toast(count?'예약 내역을 불러오는 중입니다. 잠시 후 예약 조회를 한 번 더 눌러주세요.':'일치하는 예약 내역이 없습니다.');
  },1500);
}
function showInquiryModal(v){
  let modal=$('inquiryModal');
  if(!modal)return false;
  if(modal.closest('#startView'))document.body.appendChild(modal);
  try{if(typeof window.openModal==='function')window.openModal('inquiryModal')}catch{}
  modal.classList.remove('hidden');
  modal.removeAttribute('hidden');
  modal.style.visibility='visible';
  modal.style.pointerEvents='auto';
  try{if(getComputedStyle(modal).display==='none')modal.style.display='flex'}catch{}

  const name=$('inqName'),mobile=$('inqMobile');
  if(v.name&&name&&!name.value){name.value=v.name;name.dispatchEvent(new Event('input',{bubbles:true}))}
  if(/^010\d{8}$/.test(v.phone)&&mobile&&!mobile.value){mobile.value=v.phone;mobile.dispatchEvent(new Event('input',{bubbles:true}))}
  try{window.__ZR_MODAL_UX_SYNC_HEADERS?.()}catch{}
  setTimeout(()=>{try{window.__ZR_MODAL_UX_SYNC_HEADERS?.()}catch{}},60);
  return true;
}
function runInquiry(){
  const v={name:norm($('zrCustomerEntryNameV2')?.value),phone:tel($('zrCustomerEntryPhoneV2')?.value)};
  syncNative(v);
  if(showInquiryModal(v))return;
  const old=$('inquiryBtn');
  if(!old){toast('1:1 문의 화면을 준비하지 못했습니다. 새로고침 후 다시 시도해주세요.');return}
  try{old.click()}catch{}
  setTimeout(()=>{if(!showInquiryModal(v))toast('1:1 문의 화면을 준비하지 못했습니다. 새로고침 후 다시 시도해주세요.')},40);
}

/* Capture only the two actions that stopped working after the viewport landing
   was isolated. Reservation reception keeps using its existing handler. */
document.addEventListener('click',e=>{
  const btn=e.target?.closest?.('#zrCustomerEntryLookupV2,#zrCustomerEntryInquiryV2');
  if(!btn)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  if(btn.id==='zrCustomerEntryLookupV2')runLookup();else runInquiry();
},true);
})();
