(()=>{
'use strict';
if(window.__ZR_CUSTOMER_ENTRY_VISUAL_V2_FIX_V1)return;
window.__ZR_CUSTOMER_ENTRY_VISUAL_V2_FIX_V1=true;

const $=id=>document.getElementById(id);
const tel=v=>String(v||'').replace(/\D/g,'').slice(0,11);
const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
const toast=msg=>{try{window.toast?.(msg)}catch{}};

function isVisible(el){
  if(!el||el.classList?.contains('hidden'))return false;
  try{const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&el.getClientRects().length>0}catch{return true}
}
function matchingBookings(name,phone){
  try{
    const list=JSON.parse(localStorage.getItem('zr_bookings')||'[]');
    return (Array.isArray(list)?list:[]).filter(b=>b&&!b.__availabilityOnly&&norm(b.managerName)===name&&tel(b.contact)===phone&&String(b.status||'')!=='rejected');
  }catch{return []}
}
function entryValues(show=true){
  const name=$('zrCustomerEntryNameV2'),phone=$('zrCustomerEntryPhoneV2');
  const n=norm(name?.value),p=tel(phone?.value);
  if(name)name.value=n;if(phone)phone.value=p;
  if(!n){if(show){const e=$('zrCustomerEntryErrorV2');if(e)e.textContent='예약자 이름을 입력해주세요.';toast('예약자 이름을 입력해주세요.');name?.focus?.()}return null}
  if(!/^010\d{8}$/.test(p)){if(show){const e=$('zrCustomerEntryErrorV2');if(e)e.textContent='연락처는 010으로 시작하는 숫자 11자리로 입력해주세요.';toast('연락처는 010으로 시작하는 숫자 11자리로 입력해주세요.');phone?.focus?.()}return null}
  const e=$('zrCustomerEntryErrorV2');if(e)e.textContent='';
  return {name:n,phone:p};
}
function syncNative(v){
  if(!v)return;
  const n=$('startManager'),p=$('startContact');
  if(n){n.value=v.name;n.dispatchEvent(new Event('input',{bubbles:true}));n.dispatchEvent(new Event('change',{bubbles:true}))}
  if(p){p.value=v.phone;p.dispatchEvent(new Event('input',{bubbles:true}));p.dispatchEvent(new Event('change',{bubbles:true}))}
}
function hasNativeResponse(){
  return isVisible($('customerView'))||isVisible($('existingBookingList'))||isVisible($('existingActions'))||isVisible($('newBookingActions'));
}
function moveResultsIntoState(){
  const start=$('startView'),region=$('zrCustomerEntryResultsV2');if(!start||!region)return;
  const has=[...region.children].some(isVisible);
  start.classList.toggle('zr-v2-has-results',has);
}
function forceLookup(v){
  if(hasNativeResponse())return;
  syncNative(v);
  const existing=$('existingActions'),newActions=$('newBookingActions'),check=$('checkExisting');
  if(existing)existing.classList.remove('hidden');
  if(newActions)newActions.classList.remove('hidden');
  try{check?.click()}catch{}
  setTimeout(()=>{
    moveResultsIntoState();
    if(isVisible($('existingBookingList'))){$('existingBookingList')?.scrollIntoView?.({behavior:'smooth',block:'start'});return}
    if(hasNativeResponse())return;
    const count=matchingBookings(v.name,v.phone).length;
    toast(count?'예약 내역을 불러오는 중입니다. 잠시 후 다시 눌러주세요.':'일치하는 예약 내역이 없습니다.');
  },180);
}
function prefillCustomerForm(v){
  const root=$('customerView');if(!root)return;
  const inputs=[...root.querySelectorAll('input')];
  const findByLabel=re=>{
    for(const input of inputs){
      const id=input.id;const label=id?root.querySelector(`label[for="${CSS.escape(id)}"]`):null;
      const holder=input.closest('.field,.form-group,.calc,.row,div');
      const t=norm(label?.textContent||holder?.querySelector?.('label')?.textContent||'');
      if(re.test(t))return input;
    }
    return null;
  };
  const name=findByLabel(/예약자|담당자.*이름|담당자명/),phone=findByLabel(/연락처|전화번호|휴대폰/);
  if(name&&!name.value){name.value=v.name;name.dispatchEvent(new Event('input',{bubbles:true}));name.dispatchEvent(new Event('change',{bubbles:true}))}
  if(phone&&!phone.value){phone.value=v.phone;phone.dispatchEvent(new Event('input',{bubbles:true}));phone.dispatchEvent(new Event('change',{bubbles:true}))}
}
function forceApply(v){
  if(isVisible($('customerView')))return;
  syncNative(v);
  const scope=$('newBookingActions');
  scope?.classList.remove('hidden');
  const candidates=[...(scope?.querySelectorAll?.('button,input[type="button"],input[type="submit"],a')||[])];
  const next=candidates.find(el=>/(새\s*예약|신규\s*예약|추가\s*예약|예약\s*(신청|접수|하기))/.test(norm(el.textContent||el.value))&&!/(조회|확인|취소|문의)/.test(norm(el.textContent||el.value)));
  try{next?.click()}catch{}
  setTimeout(()=>{
    if(isVisible($('customerView')))return;
    const customer=$('customerView'),start=$('startView');
    if(!customer){toast('예약 접수 화면을 준비하지 못했습니다. 새로고침 후 다시 시도해주세요.');return}
    start?.classList.add('hidden');
    customer.classList.remove('hidden');
    customer.style.removeProperty('display');
    prefillCustomerForm(v);
    try{window.renderVisitDays?.()}catch{}
    try{window.refreshPlayStarts?.()}catch{}
    window.scrollTo?.({top:0,behavior:'smooth'});
  },220);
}
function installActionRecovery(){
  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('#zrCustomerEntryApplyV2,#zrCustomerEntryLookupV2');if(!btn)return;
    const v=entryValues(true);if(!v)return;
    syncNative(v);
    setTimeout(()=>{
      if(btn.id==='zrCustomerEntryLookupV2')forceLookup(v);else forceApply(v);
    },260);
  });
  document.addEventListener('keydown',e=>{
    if(e.key!=='Enter'||!e.target?.matches?.('#zrCustomerEntryNameV2,#zrCustomerEntryPhoneV2'))return;
    e.preventDefault();$('zrCustomerEntryLookupV2')?.click();
  });
  const nodes=[$('zrCustomerEntryResultsV2'),$('existingBookingList'),$('existingActions'),$('newBookingActions')].filter(Boolean);
  if(nodes.length){
    const ob=new MutationObserver(()=>requestAnimationFrame(moveResultsIntoState));
    nodes.forEach(n=>ob.observe(n,{attributes:true,attributeFilter:['class','style','hidden'],childList:true,subtree:true}));
  }
}

function install(){
  if(!document.getElementById('zrCustomerEntryVisualV2FixV1Style')){
    const s=document.createElement('style');
    s.id='zrCustomerEntryVisualV2FixV1Style';
    s.textContent=`
    /* Keep the approved V2 landing page as the only first-screen surface. */
    html.zr-customer-entry-v2.zr-customer-entry-v2-active #startView > *:not(#zrCustomerEntryHeroV2):not(#zrCustomerEntryResultsV2){display:none!important}
    html.zr-customer-entry-v2.zr-customer-entry-v2-active #startView{position:relative!important}
    html.zr-customer-entry-v2.zr-customer-entry-v2-active #startView:not(.zr-v2-has-results){height:100vh!important;height:100svh!important;min-height:100vh!important;min-height:100svh!important;overflow:hidden!important}
    html.zr-customer-entry-v2.zr-customer-entry-v2-active #startView:not(.zr-v2-has-results) #zrCustomerEntryResultsV2{display:none!important}
    html.zr-customer-entry-v2.zr-customer-entry-v2-active #zrCustomerEntryHeroV2{height:100vh!important;height:100svh!important;min-height:100vh!important;min-height:100svh!important}

    /* Larger, easier-to-read reservation card. */
    html.zr-customer-entry-v2 #zrCustomerEntryCardV2{width:min(500px,calc(100vw - 48px))!important;min-height:650px!important;padding:54px 46px 38px!important;border-radius:32px!important}
    html.zr-customer-entry-v2 .zr-entry-logo-v2{width:174px!important;max-height:72px!important;margin-bottom:17px!important}
    html.zr-customer-entry-v2 .zr-entry-title-v2{font-size:32px!important}
    html.zr-customer-entry-v2 .zr-entry-sub-v2{margin-top:8px!important;margin-bottom:20px!important;font-size:13px!important}
    html.zr-customer-entry-v2 #zrCustomerGroupGuideOpenV2{min-height:46px!important;margin-bottom:20px!important;font-size:14px!important}
    html.zr-customer-entry-v2 .zr-entry-field-v2{margin-bottom:12px!important}
    html.zr-customer-entry-v2 .zr-entry-field-v2 input{height:56px!important;min-height:56px!important;padding-left:46px!important;font-size:16px!important}
    html.zr-customer-entry-v2 #zrCustomerEntryErrorV2{min-height:20px!important;font-size:13px!important;font-weight:900!important}
    html.zr-customer-entry-v2 .zr-entry-actions-v2{gap:10px!important}
    html.zr-customer-entry-v2 .zr-entry-actions-v2 button{min-height:56px!important;font-size:15px!important}
    html.zr-customer-entry-v2 #zrCustomerEntryInquiryV2{min-height:50px!important}
    html.zr-customer-entry-v2 .zr-entry-foot-v2{padding-top:26px!important;font-size:12px!important}

    /* Desktop: lookup results appear beside the reservation card. */
    @media(min-width:901px){
      html.zr-customer-entry-v2.zr-customer-entry-v2-active #startView.zr-v2-has-results{height:100vh!important;height:100svh!important;min-height:100vh!important;min-height:100svh!important;overflow:hidden!important}
      html.zr-customer-entry-v2.zr-customer-entry-v2-active #startView.zr-v2-has-results #zrCustomerEntryResultsV2{
        display:block!important;position:absolute!important;z-index:4!important;right:clamp(30px,4.2vw,84px)!important;top:50%!important;transform:translateY(-50%)!important;
        width:min(720px,45vw)!important;max-height:calc(100svh - 56px)!important;margin:0!important;padding:24px!important;overflow:auto!important;box-sizing:border-box!important;
        border:1px solid rgba(91,52,36,.12)!important;border-radius:26px!important;background:rgba(255,253,249,.975)!important;box-shadow:0 24px 68px rgba(26,14,9,.24)!important;-webkit-overflow-scrolling:touch;
      }
      html.zr-customer-entry-v2.zr-customer-entry-v2-active #startView.zr-v2-has-results #zrCustomerEntryResultsV2:empty{display:none!important}
    }

    /* Mobile/tablet: keep native vertical flow below the intro screen. */
    @media(max-width:900px){
      html.zr-customer-entry-v2 #zrCustomerEntryCardV2{width:calc(100vw - 28px)!important;min-height:0!important;max-height:calc(100svh - 28px)!important;padding:36px 28px 28px!important;border-radius:26px!important}
      html.zr-customer-entry-v2 .zr-entry-logo-v2{width:158px!important;margin-bottom:12px!important}
      html.zr-customer-entry-v2 .zr-entry-title-v2{font-size:29px!important}
      html.zr-customer-entry-v2 .zr-entry-sub-v2{margin-bottom:16px!important}
      html.zr-customer-entry-v2 #zrCustomerGroupGuideOpenV2{margin-bottom:16px!important}
      html.zr-customer-entry-v2.zr-customer-entry-v2-active #startView.zr-v2-has-results{height:auto!important;min-height:100svh!important;overflow:visible!important;background:#f7f3ee!important}
      html.zr-customer-entry-v2.zr-customer-entry-v2-active #startView.zr-v2-has-results #zrCustomerEntryResultsV2{position:static!important;transform:none!important;width:min(100% - 24px,720px)!important;max-height:none!important;margin:0 auto!important;padding:18px 0 54px!important;overflow:visible!important;background:transparent!important}
    }
    @media(max-height:720px) and (min-width:901px){
      html.zr-customer-entry-v2 #zrCustomerEntryCardV2{min-height:0!important;max-height:calc(100svh - 28px)!important;padding-top:34px!important;padding-bottom:28px!important}
      html.zr-customer-entry-v2 .zr-entry-logo-v2{width:154px!important;margin-bottom:10px!important}
      html.zr-customer-entry-v2 .zr-entry-title-v2{font-size:29px!important}
      html.zr-customer-entry-v2 .zr-entry-sub-v2{margin-bottom:14px!important}
      html.zr-customer-entry-v2 #zrCustomerGroupGuideOpenV2{margin-bottom:14px!important}
      html.zr-customer-entry-v2 .zr-entry-foot-v2{padding-top:16px!important}
    }
    `;
    document.head.appendChild(s);
  }
  installActionRecovery();
  moveResultsIntoState();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
