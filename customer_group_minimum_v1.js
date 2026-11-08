(()=>{
'use strict';
if(window.__ZR_CUSTOMER_GROUP_MINIMUM_V1)return;
window.__ZR_CUSTOMER_GROUP_MINIMUM_V1=true;

const MIN_PAID=15;

const $=id=>document.getElementById(id);
const money=n=>Number(n||0).toLocaleString('ko-KR')+'원';

function counts(paidValue,chapValue){return window.ZRBookingRules.minimumPeople(paidValue,chapValue)}

function ruleText(){const p=window.ZRBookingRules.groupPricing();return p.eventEnabled===true?'단체예약은 관람인원과 인솔자 합계 '+(Number(p.eventMinimum)||15)+'명부터 가능하며, 인솔자는 전원 무료입니다.':'단체예약은 유료인원 합계 15명부터 가능합니다. 유료인원 '+(Number(p.freePerPaid)||5)+'명당 인솔자 1명이 무료입니다.'}
function currentCounts(){return counts($('paidCount')?.value,$('chaperoneCount')?.value)}
function customerFormVisible(){
  const v=$('customerView');
  return !!v&&!v.classList.contains('hidden')&&getComputedStyle(v).display!=='none';
}

function ensurePaidOptions(){
  const sel=$('paidCount');if(!sel)return false;
  const cur=String(sel.value||'');
  const existing=new Set([...sel.options].map(o=>String(o.value)));
  const before=[...sel.options].find(o=>Number(o.value)>=MIN_PAID)||null;
  for(let n=1;n<MIN_PAID;n++){
    if(existing.has(String(n)))continue;
    const o=document.createElement('option');o.value=String(n);o.textContent=`${n}명`;
    before?sel.insertBefore(o,before):sel.appendChild(o);
  }
  if(cur&&[...sel.options].some(o=>o.value===cur))sel.value=cur;
  return true;
}

function ensureTopNotice(){
  const notice=$('customerView')?.querySelector(':scope > .notice');
  if(!notice)return;
  const old='※ 단체 예약은 <b>유료인원 15명 이상</b>부터 가능합니다. 결제는 현장에서 진행됩니다.';
  const next='※ 단체 예약은 <b>유료 관람인원과 유료 인솔자를 합산해 15명 이상</b>부터 가능합니다. 결제는 현장에서 진행됩니다.';
  const message='※ '+ruleText()+' 결제는 현장에서 진행됩니다.';if(notice.textContent!==message)notice.textContent=message;
}

function ensureRuleHelp(){
  const sel=$('paidCount');if(!sel)return;
  const holder=sel.parentElement;if(!holder)return;
  const label=holder.querySelector('label');
  if(label&&/유료인원/.test((label.textContent||'').replace(/\s+/g,'')))label.textContent='유료 관람인원';
  let help=$('zrGroupMinimumRuleV1');
  if(!help){
    const old=[...holder.querySelectorAll('.help,small')].find(x=>/15명|유료인원/.test((x.textContent||'')));
    help=document.createElement('div');help.id='zrGroupMinimumRuleV1';help.className='help';help.style.marginTop='6px';
    old?old.replaceWith(help):sel.insertAdjacentElement('afterend',help);
  }
  const message=ruleText();if(help.textContent!==message)help.textContent=message;
}

function renderPeopleGuide(){
  const box=$('peopleCalc'),paidEl=$('paidCount'),chapEl=$('chaperoneCount');
  if(!box||!paidEl||!chapEl)return;
  const c=currentCounts();
  if(!c.paid){box.innerHTML='<b>인원을 선택해주세요.</b><br><span class="help">유료 관람인원과 인솔자 수를 선택하면 예약 가능 여부와 무료 인솔 인원을 확인할 수 있습니다.</span>';return}

  if(!c.eligible){
    box.innerHTML=`<b class="danger">예약 인원 확인 · 관람 ${c.paid}명 / 인솔 ${c.chaperone}명</b><br><span class="help">${ruleText()}</span>`;
  }else{
    let reason='';
    if(c.requiredPaidChaperone>0){
      reason=`<br><span class="help">인솔자 ${c.requiredPaidChaperone}명은 최소 유료인원 15명 충족을 위해 유료로 적용됩니다.</span>`;
    }
    box.innerHTML=`<b style="color:#2f6b4f">예약 가능 · 유료 ${c.totalPaid}명 / 무료 인솔 ${c.freeChaperone}명</b><br><span class="help">유료 관람인원 ${c.paid}명 · 유료 인솔 ${c.paidChaperone}명 · 무료 인솔 ${c.freeChaperone}명</span>${reason}`;
  }

  const sum=$('sumPeople');
  if(sum)sum.textContent=`유료 ${c.totalPaid}명 / 무료 인솔 ${c.freeChaperone}명`;
}

function adjustFinalReview(){
  const c=currentCounts(),review=$('finalReview');if(!review||!c.paid)return;
  const people=`<b>인원</b> 유료 관람 ${c.paid}명 / 인솔자 ${c.chaperone}명 (무료 ${c.freeChaperone}명, 유료 ${c.paidChaperone}명)<br>`;
  review.innerHTML=review.innerHTML.replace(/<b>인원<\/b>[\s\S]*?<br>/,people);
  const totalText=String($('sumTotal')?.textContent||'').trim();
  const total=review.querySelector('.money');
  if(total&&totalText)total.textContent=totalText;
}

function patchBookingData(){
  const cur=typeof window.bookingData==='function'?window.bookingData:(typeof bookingData==='function'?bookingData:null);
  if(typeof cur!=='function')return false;
  if(cur.__zrGroupMinimumV1)return true;
  const base=cur;
  const wrapped=function(){
    const b=base.apply(this,arguments);
    if(!b||typeof b!=='object')return b;
    const c=counts(b.paidCount,b.chaperoneCount);
    const oldEntry=Number(b.entryAmount);
    const oldTotal=Number(b.totalAmount);
    const extras=Number.isFinite(oldEntry)&&Number.isFinite(oldTotal)?Math.max(0,oldTotal-oldEntry):Math.max(0,Number(b.cafe?.amount||0));
    b.freeChaperone=c.freeChaperone;
    b.paidChaperone=c.paidChaperone;
    b.entryAmount=c.totalPaid*window.ZRBookingRules.unitPrice();
    b.totalAmount=b.entryAmount+extras;
    return b;
  };
  wrapped.__zrGroupMinimumV1=true;wrapped.__zrBase=base;
  window.bookingData=wrapped;try{bookingData=wrapped}catch{}
  return true;
}

function patchValidateBooking(){
  const cur=typeof window.validateBooking==='function'?window.validateBooking:(typeof validateBooking==='function'?validateBooking:null);
  if(typeof cur!=='function')return false;
  if(cur.__zrGroupMinimumV1)return true;
  const base=cur;
  const wrapped=function(){
    const c=currentCounts();
    if(c.paid>0&&!c.eligible)return ruleText();
    const el=$('paidCount');
    if(c.eligible&&c.paid<MIN_PAID&&el){
      const original=el.value;
      const has15=[...el.options].some(o=>String(o.value)===String(MIN_PAID));
      if(has15)el.value=String(MIN_PAID);
      try{return base.apply(this,arguments)}finally{el.value=original;renderPeopleGuide()}
    }
    return base.apply(this,arguments);
  };
  wrapped.__zrGroupMinimumV1=true;wrapped.__zrBase=base;
  window.validateBooking=wrapped;try{validateBooking=wrapped}catch{}
  return true;
}

function patchRefreshSummary(){
  const cur=typeof window.refreshSummary==='function'?window.refreshSummary:(typeof refreshSummary==='function'?refreshSummary:null);
  if(typeof cur!=='function')return false;
  if(cur.__zrGroupMinimumV1)return true;
  const base=cur;
  const wrapped=function(){
    const out=base.apply(this,arguments);
    renderPeopleGuide();adjustFinalReview();
    return out;
  };
  wrapped.__zrGroupMinimumV1=true;wrapped.__zrBase=base;
  window.refreshSummary=wrapped;try{refreshSummary=wrapped}catch{}
  return true;
}

window.ZRGroupMinimum=Object.freeze({renderPeople:renderPeopleGuide});
function refresh(){
  const label=$('groupUnitPriceLabel');
  if(label)label.value='1명당 '+money(window.ZRBookingRules.unitPrice())+' (VAT 포함)';
  ensurePaidOptions();ensureTopNotice();ensureRuleHelp();patchBookingData();patchValidateBooking();patchRefreshSummary();renderPeopleGuide();
}

document.addEventListener('zr:reservation-settings-synced',()=>{refresh();window.refreshSummary?.()});
function boot(){
  refresh();
  window.addEventListener('change',e=>{
    if(!customerFormVisible())return;
    if(e.target?.id==='paidCount'||e.target?.id==='chaperoneCount')setTimeout(()=>{refresh();try{window.refreshSummary?.()}catch{}},0);
  },true);
  window.addEventListener('click',e=>{
    if(!customerFormVisible())return;
    const b=e.target?.closest?.('#submitBooking');if(!b)return;
    const paid=$('paidCount'),chap=$('chaperoneCount');
    if(!paid?.value||chap?.value==='')return;
    const c=currentCounts();
    if(c.eligible)return;
    e.preventDefault();e.stopImmediatePropagation();
    try{window.toast?.(ruleText())}catch{}
    try{paid.scrollIntoView({behavior:'smooth',block:'center'})}catch{}
  },true);
  const t=setInterval(refresh,300);setTimeout(()=>clearInterval(t),20000);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
