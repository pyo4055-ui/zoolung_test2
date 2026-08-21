(()=>{
'use strict';
if(window.__ZR_CUSTOMER_BOOKING_UX_V22)return;
window.__ZR_CUSTOMER_BOOKING_UX_V22=true;

const $=id=>document.getElementById(id);
const toast=s=>{try{window.toast?.(s)}catch{}};

function customerVisible(){
  const v=$('customerView');
  return !!v&&!v.classList.contains('hidden')&&getComputedStyle(v).display!=='none';
}
function visible(el){
  return !!el&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden'&&el.getClientRects().length>0;
}
function localText(el){
  let out='';
  if(el?.id){
    try{document.querySelectorAll(`label[for="${CSS.escape(el.id)}"]`).forEach(l=>out+=' '+l.textContent)}catch{}
  }
  const own=el?.closest?.('label');if(own)out+=' '+own.textContent;
  const prev=el?.previousElementSibling;
  if(prev&&!prev.matches?.('input,select,textarea,button'))out+=' '+(prev.textContent||'');
  const p=el?.parentElement;
  if(p){
    [...p.children].forEach(ch=>{
      if(ch===el||ch.querySelector?.('input,select,textarea'))return;
      if(ch.matches?.('label,.label,.field-label,.form-label,strong,b,span'))out+=' '+(ch.textContent||'');
    });
  }
  return out.replace(/\s+/g,' ').trim();
}
function isPhoneInput(el){
  if(!el?.matches?.('input')||el.closest('#adminView'))return false;
  const key=`${el.type||''} ${el.id||''} ${el.name||''} ${el.placeholder||''} ${el.getAttribute('aria-label')||''}`.toLowerCase();
  const txt=localText(el).replace(/\s/g,'');
  return el.type==='tel'||/(phone|mobile|tel|contact)/.test(key)||/(연락처|휴대폰|전화번호)/.test(txt);
}
function preparePhone(el){
  if(!isPhoneInput(el))return;
  el.setAttribute('inputmode','numeric');
  el.setAttribute('autocomplete','tel');
  el.setAttribute('maxlength','11');
  el.setAttribute('pattern','010[0-9]{8}');
}
function sanitizePhone(el){
  preparePhone(el);
  const next=String(el.value||'').replace(/\D/g,'').slice(0,11);
  if(el.value!==next)el.value=next;
  return next;
}
function setPhoneValidity(el,show=false){
  const v=sanitizePhone(el);
  const ok=/^010\d{8}$/.test(v);
  const msg=ok?'':'연락처는 010으로 시작하는 11자리 숫자로 입력해주세요.';
  try{el.setCustomValidity(msg)}catch{}
  if(!ok&&show){
    try{el.reportValidity?.()}catch{}
    try{el.focus({preventScroll:false})}catch{try{el.focus()}catch{}}
    toast(msg);
  }
  return ok;
}
function findVisiblePhone(){
  const root=$('customerView');if(!root)return null;
  return [...root.querySelectorAll('input')].find(el=>isPhoneInput(el)&&visible(el))||null;
}
function validateCustomerPhone(){
  const el=findVisiblePhone();
  if(!el)return true;
  return setPhoneValidity(el,true);
}
function isBookingAction(target){
  const btn=target?.closest?.('button,input[type="submit"],input[type="button"],a');
  if(!btn||btn.closest('#zrGuideModal'))return false;
  const txt=(btn.textContent||btn.value||'').replace(/\s+/g,'');
  return /(예약.*(신청|완료|하기)|신청하기|예약하기)/.test(txt)&&!/예약확인|추가예약/.test(txt);
}

function setSimpleText(el,text){
  if(el.matches?.('input')){if(el.value!==text)el.value=text;return;}
  const direct=[...el.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE&&String(n.nodeValue||'').trim());
  if(direct.length){
    direct[0].nodeValue=text;
    for(let i=1;i<direct.length;i++)direct[i].nodeValue='';
    return;
  }
  const label=el.querySelector?.('[data-label],.btn-label,.label,span,strong');
  if(label&&!label.children.length){label.textContent=text;return;}
  el.textContent=text;
}
function simplifyStartLabels(){
  const root=$('startView');if(!root)return;
  root.querySelectorAll('button,a,input[type="button"],input[type="submit"],[role="button"]').forEach(el=>{
    const txt=(el.textContent||el.value||'').replace(/\s+/g,'');
    if(/^(예약조회|예약조회하기|조회하기)$/.test(txt))setSimpleText(el,'조회');
    else if(/^(예약시작하기|새예약시작하기|시작하기)$/.test(txt))setSimpleText(el,'예약');
  });
}
function prepareAllPhones(){
  const root=$('customerView');if(!root)return;
  root.querySelectorAll('input').forEach(preparePhone);
}
function boot(){
  simplifyStartLabels();prepareAllPhones();
  document.addEventListener('input',e=>{if(isPhoneInput(e.target))sanitizePhone(e.target)},true);
  document.addEventListener('blur',e=>{if(isPhoneInput(e.target)&&String(e.target.value||'').trim())setPhoneValidity(e.target,false)},true);
  document.addEventListener('click',e=>{
    if(!customerVisible()||!isBookingAction(e.target))return;
    if(validateCustomerPhone())return;
    e.preventDefault();e.stopImmediatePropagation();
  },true);
  document.addEventListener('submit',e=>{
    if(!customerVisible()||validateCustomerPhone())return;
    e.preventDefault();e.stopImmediatePropagation();
  },true);
  const t=setInterval(()=>{simplifyStartLabels();prepareAllPhones()},500);
  setTimeout(()=>clearInterval(t),12000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
