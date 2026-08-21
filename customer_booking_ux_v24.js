(()=>{
'use strict';
if(window.__ZR_CUSTOMER_BOOKING_UX_V24)return;
window.__ZR_CUSTOMER_BOOKING_UX_V24=true;

const $=id=>document.getElementById(id);
const toast=s=>{try{window.toast?.(s)}catch{}};
const PRIVACY_TEXT='단체예약 접수 및 관리, 예약 확인·변경·취소, 이용 안내를 위해 단체명, 예약자명, 연락처, 이메일(선택), 예약 관련 요청사항 등 예약 과정에서 입력한 정보를 수집·이용합니다. 수집된 개인정보는 이용 목적 달성 후 지체 없이 파기하며, 관계 법령에 따라 보관이 필요한 경우에는 해당 기간 동안 안전하게 보관합니다.';
const SPECIAL_TEXT='간식시간 등 별도 시간 조정이 필요하거나, 예약 시 전달할 사항이 있다면 작성해주세요.';
const SPECIAL_EXAMPLE='예) 14:00~14:30 간식시간 필요';

function phone(){
  return $('startContact');
}
function preparePhone(){
  const el=phone();if(!el)return;
  el.setAttribute('inputmode','numeric');
  el.setAttribute('autocomplete','tel');
  el.setAttribute('maxlength','11');
  el.setAttribute('pattern','010[0-9]{8}');
  el.placeholder='01012345678';
}
function sanitizePhone(){
  const el=phone();if(!el)return '';
  preparePhone();
  const v=String(el.value||'').replace(/\D/g,'').slice(0,11);
  if(el.value!==v)el.value=v;
  return v;
}
function validPhone(show=false){
  const el=phone();if(!el)return true;
  const ok=/^010\d{8}$/.test(sanitizePhone());
  const msg=ok?'':'연락처는 010으로 시작하는 11자리 숫자로 입력해주세요.';
  try{el.setCustomValidity(msg)}catch{}
  if(!ok&&show){
    try{el.reportValidity?.()}catch{}
    try{el.focus()}catch{}
    toast(msg);
  }
  return ok;
}
function applyPrivacyText(){
  const privacy=$('privacy');
  const box=privacy?.closest?.('.calc');
  const help=box?.querySelector?.('.help');
  if(help&&help.textContent!==PRIVACY_TEXT)help.textContent=PRIVACY_TEXT;
}
function applySpecialRequestText(){
  const root=$('customerView');if(!root)return;
  const areas=[...root.querySelectorAll('textarea')];
  const ta=areas.find(x=>/특이사항/.test((x.closest('.card,.calc,.box,.field,.form-group')?.textContent||x.parentElement?.textContent||'')))
    ||areas.find(x=>/이동\s*관련|요청사항/.test(String(x.placeholder||'')));
  if(!ta)return;
  ta.placeholder=SPECIAL_EXAMPLE;
  const scope=ta.closest('.card,.calc,.box,.field,.form-group')||ta.parentElement;
  if(!scope)return;
  const help=[...scope.querySelectorAll('.help,small,p')].find(x=>/이동\s*관련|요청사항|특이사항|전달.*사항/.test((x.textContent||'').trim()));
  if(help)help.textContent=`${SPECIAL_TEXT} ${SPECIAL_EXAMPLE}`;
}
function installExitGuideGuard(){
  if(window.__ZR_EXIT_GUIDE_VISUAL_GUARD_V28)return;
  window.__ZR_EXIT_GUIDE_VISUAL_GUARD_V28=true;
  const style=document.createElement('style');
  style.id='zrExitGuideGuardStyleV28';
  style.textContent='html.zr-exit-guide-suppress #zrGuideModal{display:none!important}';
  document.head.appendChild(style);
  let token=0;
  window.addEventListener('change',e=>{
    const id=e.target?.id||'';
    if(id==='entryTime'){
      token++;
      document.documentElement.classList.remove('zr-exit-guide-suppress');
      return;
    }
    if(id!=='exitTime')return;
    const mine=++token;
    document.documentElement.classList.add('zr-exit-guide-suppress');
    setTimeout(()=>{
      if(mine!==token)return;
      const modal=$('zrGuideModal');
      if(modal)modal.classList.add('hidden');
      document.documentElement.classList.remove('zr-exit-guide-suppress');
    },180);
  },true);
}
function installFinalOnlyGuard(){
  if(window.__ZR_FINAL_ONLY_GUARD_V32)return;
  window.__ZR_FINAL_ONLY_GUARD_V32=true;
  const customerVisible=()=>{const v=$('customerView');return !!v&&!v.classList.contains('hidden')&&getComputedStyle(v).display!=='none'};
  const bookingButton=b=>{const t=(b?.textContent||b?.value||'').replace(/\s+/g,'');return !!b&&/(예약.*(신청|완료|하기)|신청하기|예약하기)/.test(t)&&!/예약확인|추가예약/.test(t)};
  const hideLegacy=()=>['zrGuideModal','zrPlayGuideModal','zrFinalGuideModal','zrFinalGuideModalV30'].forEach(id=>$(id)?.classList.add('hidden'));
  window.addEventListener('click',e=>{
    if(e.target?.closest?.('#zrFinalBackV31')){window.__ZR_FINAL_DIRECT_SUBMIT=false;return;}
    const b=e.target?.closest?.('button,input[type="submit"],a');
    if(!customerVisible()||!bookingButton(b))return;
    if(b?.closest?.('#zrFinalGuideModalV31,#zrGuideModal,#zrPlayGuideModal'))return;
    window.__ZR_FINAL_DIRECT_SUBMIT=true;
    hideLegacy();
    queueMicrotask(hideLegacy);
    setTimeout(hideLegacy,0);
    setTimeout(hideLegacy,80);
  },true);
}
function applyStartUi(){
  const btn=$('lookupBooking');
  if(btn&&btn.textContent!=='예약 / 조회')btn.textContent='예약 / 조회';
  preparePhone();
  applyPrivacyText();
  applySpecialRequestText();
}
function boot(){
  installExitGuideGuard();
  installFinalOnlyGuard();
  applyStartUi();
  const el=phone();
  if(el){
    el.addEventListener('input',()=>sanitizePhone());
    el.addEventListener('blur',()=>{if(String(el.value||'').trim())validPhone(false)});
  }
  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('#lookupBooking');
    if(!btn)return;
    if(validPhone(true))return;
    e.preventDefault();
    e.stopImmediatePropagation();
  },true);
  const t=setInterval(applyStartUi,500);
  setTimeout(()=>clearInterval(t),15000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
