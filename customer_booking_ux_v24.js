(()=>{
'use strict';
if(window.__ZR_CUSTOMER_BOOKING_UX_V24)return;
window.__ZR_CUSTOMER_BOOKING_UX_V24=true;

const $=id=>document.getElementById(id);
const toast=s=>{try{window.toast?.(s)}catch{}};

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
function applyStartUi(){
  const btn=$('lookupBooking');
  if(btn&&btn.textContent!=='예약 / 조회')btn.textContent='예약 / 조회';
  preparePhone();
}
function boot(){
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
  setTimeout(()=>clearInterval(t),10000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
