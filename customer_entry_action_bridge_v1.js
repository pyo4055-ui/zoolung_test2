(()=>{
'use strict';
if(window.__ZR_CUSTOMER_ENTRY_ACTION_BRIDGE_V1)return;
window.__ZR_CUSTOMER_ENTRY_ACTION_BRIDGE_V1=true;

const $=id=>document.getElementById(id);
const ROOT=document.documentElement;
const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
const tel=v=>String(v||'').replace(/\D/g,'').slice(0,11);
const toast=msg=>{try{window.toast?.(msg)}catch{}};

function installStyle(){
  if($('zrCustomerEntryActionBridgeV1Style'))return;
  const s=document.createElement('style');
  s.id='zrCustomerEntryActionBridgeV1Style';
  s.textContent=`
  /* The customer landing sits at a very high z-index. Any customer modal opened
     from that landing must sit above it, otherwise the click works but looks dead. */
  body>#inquiryModal,
  body>.modal:not(#adminLoginModal),
  body>.zr-customer-info-modal,
  body>.zr-customer-zoom,
  body>.zrgm32,
  body>.zrfinal31,
  body>.zr-guide-modal,
  body>.zr14-modal,
  body>#zrCustomerReturnHomeModal,
  body>#zrCustomerGroupGuideV2{
    z-index:2147483300!important;
  }

  #zrCustomerEntryOverlayV3 #zrCustomerEntryResultsV2{display:none!important}
  html.zr-customer-entry-v2.zr-customer-entry-v2-active.zr-customer-entry-lookup-open #zrCustomerEntryOverlayV3 #zrCustomerEntryResultsV2{
    display:block!important;box-sizing:border-box!important;background:rgba(255,253,249,.985)!important;
    border:1px solid rgba(91,52,36,.12)!important;box-shadow:0 24px 68px rgba(26,14,9,.24)!important;
  }
  @media(min-width:901px){
    html.zr-customer-entry-v2.zr-customer-entry-v2-active.zr-customer-entry-lookup-open #zrCustomerEntryOverlayV3 #zrCustomerEntryResultsV2{
      position:absolute!important;z-index:6!important;right:clamp(30px,4.2vw,84px)!important;top:50%!important;
      transform:translateY(-50%)!important;width:min(720px,45vw)!important;max-height:calc(100svh - 56px)!important;
      margin:0!important;padding:24px!important;overflow:auto!important;border-radius:26px!important;-webkit-overflow-scrolling:touch;
    }
  }
  @media(max-width:900px){
    html.zr-customer-entry-v2.zr-customer-entry-v2-active.zr-customer-entry-lookup-open #zrCustomerEntryOverlayV3{
      overflow-y:auto!important;overflow-x:hidden!important;background:#f7f3ee!important;-webkit-overflow-scrolling:touch;
    }
    html.zr-customer-entry-v2.zr-customer-entry-v2-active.zr-customer-entry-lookup-open #zrCustomerEntryOverlayV3>#zrCustomerEntryHeroV2{
      position:relative!important;inset:auto!important;width:100%!important;height:100svh!important;min-height:100svh!important;
    }
    html.zr-customer-entry-v2.zr-customer-entry-v2-active.zr-customer-entry-lookup-open #zrCustomerEntryOverlayV3 #zrCustomerEntryResultsV2{
      position:relative!important;z-index:6!important;width:min(calc(100% - 24px),720px)!important;max-height:none!important;
      margin:12px auto 0!important;padding:18px!important;overflow:visible!important;border-radius:20px!important;transform:none!important;
    }
  }
  `;
  document.head.appendChild(s);
}

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
  if(!v)return;
  const name=$('startManager'),phone=$('startContact');
  if(name){name.value=v.name||'';name.dispatchEvent(new Event('input',{bubbles:true}));name.dispatchEvent(new Event('change',{bubbles:true}))}
  if(phone){phone.value=v.phone||'';phone.dispatchEvent(new Event('input',{bubbles:true}));phone.dispatchEvent(new Event('change',{bubbles:true}))}
}
function ensureResultsRegion(){
  const start=$('startView'),overlay=$('zrCustomerEntryOverlayV3');
  let region=$('zrCustomerEntryResultsV2');
  if(!region){region=document.createElement('section');region.id='zrCustomerEntryResultsV2'}
  ['existingActions','newBookingActions','existingBookingList'].forEach(id=>{
    const el=$(id);if(el&&el.parentElement!==region)region.appendChild(el);
  });
  const host=overlay||start;
  if(host&&region.parentElement!==host)host.appendChild(region);
  return region;
}
function syncLookupState(){
  const region=ensureResultsRegion();if(!region)return false;
  const existing=$('existingActions'),list=$('existingBookingList');
  const has=visible(existing)||visible(list);
  ROOT.classList.toggle('zr-customer-entry-lookup-open',has);
  $('startView')?.classList.toggle('zr-v2-has-results',has);
  if(has){
    $('newBookingActions')?.classList.add('hidden');
    try{window.__ZR_MODAL_UX_SYNC_HEADERS?.()}catch{}
    if(innerWidth<=900)setTimeout(()=>{try{region.scrollIntoView({behavior:'smooth',block:'start'})}catch{}},40);
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
    if(check&&!checkClicked){checkClicked=true;try{check.click()}catch{}}
    syncLookupState();
  };
  [20,70,150,280,500,850,1300].forEach(ms=>setTimeout(step,ms));
  setTimeout(()=>{
    if(syncLookupState())return;
    let count=0;
    try{
      const list=JSON.parse(localStorage.getItem('zr_bookings')||'[]');
      count=(Array.isArray(list)?list:[]).filter(b=>b&&!b.__availabilityOnly&&norm(b.managerName)===v.name&&tel(b.contact)===v.phone&&String(b.status||'')!=='rejected').length;
    }catch{}
    toast(count?'예약 내역을 불러오는 중입니다. 잠시 후 다시 눌러주세요.':'일치하는 예약 내역이 없습니다.');
  },1550);
}
function surfaceInquiryModal(v){
  const modal=$('inquiryModal');if(!modal)return false;
  if(modal.parentElement!==document.body)document.body.appendChild(modal);
  modal.style.setProperty('z-index','2147483300','important');
  modal.classList.remove('hidden');modal.removeAttribute('hidden');
  modal.style.visibility='visible';modal.style.pointerEvents='auto';
  try{if(getComputedStyle(modal).display==='none')modal.style.display='flex'}catch{modal.style.display='flex'}
  const name=$('inqName'),mobile=$('inqMobile');
  if(v?.name&&name&&!name.value){name.value=v.name;name.dispatchEvent(new Event('input',{bubbles:true}))}
  if(/^010\d{8}$/.test(v?.phone||'')&&mobile&&!mobile.value){mobile.value=v.phone;mobile.dispatchEvent(new Event('input',{bubbles:true}))}
  try{window.__ZR_MODAL_UX_SYNC_HEADERS?.()}catch{}
  setTimeout(()=>{try{window.__ZR_MODAL_UX_SYNC_HEADERS?.()}catch{}},70);
  return true;
}
function runInquiry(){
  const v={name:norm($('zrCustomerEntryNameV2')?.value),phone:tel($('zrCustomerEntryPhoneV2')?.value)};
  syncNative(v);
  const old=$('inquiryBtn');
  if(old){try{old.click()}catch{}}
  [0,30,90].forEach(ms=>setTimeout(()=>surfaceInquiryModal(v),ms));
  setTimeout(()=>{if(!surfaceInquiryModal(v)&&!old)toast('1:1 문의 화면을 준비하지 못했습니다. 새로고침 후 다시 시도해주세요.')},150);
}

function bindButtons(){
  const lookup=$('zrCustomerEntryLookupV2'),inq=$('zrCustomerEntryInquiryV2');
  if(lookup&&!lookup.dataset.zrActionBridge){
    lookup.dataset.zrActionBridge='1';
    lookup.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();runLookup()},true);
  }
  if(inq&&!inq.dataset.zrActionBridge){
    inq.dataset.zrActionBridge='1';
    inq.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();runInquiry()},true);
  }
  return !!lookup&&!!inq;
}

installStyle();
bindButtons();
requestAnimationFrame(bindButtons);
[80,180,350,700,1200,2000].forEach(ms=>setTimeout(bindButtons,ms));
document.addEventListener('zr:customer-entry-v2-ready',bindButtons);
})();
