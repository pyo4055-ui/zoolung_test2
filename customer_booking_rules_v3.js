(()=>{
'use strict';
if(window.__ZR_CUSTOMER_BOOKING_RULES_V3)return;
window.__ZR_CUSTOMER_BOOKING_RULES_V3=true;
const $=id=>document.getElementById(id),pad=n=>String(n).padStart(2,'0');
const today=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
function customerVisible(){const v=$('customerView');return !!v&&!v.classList.contains('hidden')&&getComputedStyle(v).display!=='none'}
function apply(){
  const day=$('visitDay');if(!day)return;
  const td=today();
  [...day.options].forEach(o=>{
    if(!/^\d{4}-\d{2}-\d{2}$/.test(o.value||''))return;
    if(o.value<=td){o.disabled=true;if(o.value===td&&!o.textContent.includes('당일예약 불가'))o.textContent+=' (당일예약 불가)'}
  });
  if(day.value&&day.value<=td){day.value='';try{day.dispatchEvent(new Event('change',{bubbles:true}))}catch{}}
  if(!$('zrSameDayNotice')){const n=document.createElement('div');n.id='zrSameDayNotice';n.className='help';n.style.marginTop='6px';n.textContent='당일 예약은 불가하며 익일부터 예약할 수 있습니다.';day.insertAdjacentElement('afterend',n)}
}
function hookRender(){
  if(typeof window.renderVisitDays!=='function'||window.renderVisitDays.__zrNoSameDay)return false;
  const base=window.renderVisitDays;
  const wrapped=function(){const out=base.apply(this,arguments);if(customerVisible())setTimeout(apply,0);return out};
  wrapped.__zrNoSameDay=true;window.renderVisitDays=wrapped;try{renderVisitDays=wrapped}catch{};return true;
}
function boot(){
  const t=setInterval(()=>{hookRender();if(customerVisible())apply();if($('visitDay')&&typeof window.renderVisitDays==='function')clearInterval(t)},250);setTimeout(()=>clearInterval(t),15000);
  document.addEventListener('change',e=>{if((e.target?.id==='visitMonth'||e.target?.id==='visitDay')&&customerVisible())setTimeout(apply,0)},true);
  const day=$('visitDay');if(day)new MutationObserver(()=>{if(customerVisible())apply()}).observe(day,{childList:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
