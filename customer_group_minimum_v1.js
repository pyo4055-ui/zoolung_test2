(()=>{
'use strict';
if(window.__ZR_CUSTOMER_GROUP_MINIMUM_V1)return;
window.__ZR_CUSTOMER_GROUP_MINIMUM_V1=true;

const MIN_PAID=15;
const PRICE=15000;
const $=id=>document.getElementById(id);
const money=n=>Number(n||0).toLocaleString('ko-KR')+'원';

function counts(paidValue,chapValue){
  const paid=Math.max(0,Number(paidValue||0));
  const chaperone=Math.max(0,Number(chapValue||0));
  const shortage=Math.max(0,MIN_PAID-paid);

  if(paid+chaperone<MIN_PAID){
    return {
      paid,chaperone,requiredPaidChaperone:chaperone,
      freeChaperone:0,paidChaperone:chaperone,
      totalPaid:paid+chaperone,eligible:false
    };
  }

  const requiredPaidChaperone=Math.min(chaperone,shortage);
  const basePaid=paid+requiredPaidChaperone;
  const remaining=Math.max(0,chaperone-requiredPaidChaperone);
  const freeQuota=Math.floor(basePaid/5);
  const freeChaperone=Math.min(remaining,freeQuota);
  const paidChaperone=requiredPaidChaperone+(remaining-freeChaperone);

  return {
    paid,chaperone,requiredPaidChaperone,freeChaperone,paidChaperone,
    totalPaid:paid+paidChaperone,eligible:true
  };
}

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
  help.innerHTML='<b>단체예약은 유료인원 합계 15명부터 가능합니다.</b><br>유료 15명 충족 후, 유료인원 5명당 인솔자 1명이 무료입니다.<br>15명이 부족한 경우 인솔자 일부가 유료로 적용될 수 있습니다.';
}

function renderPeopleGuide(){
  const box=$('peopleCalc'),paidEl=$('paidCount'),chapEl=$('chaperoneCount');
  if(!box||!paidEl||!chapEl)return;
  const c=currentCounts();
  if(!c.paid){box.innerHTML='';return}

  if(!c.eligible){
    box.innerHTML=`<b class="danger">예약 불가 · 현재 유료인원 ${c.totalPaid}명</b><br><span class="help">단체예약은 유료인원 합계 15명부터 가능합니다. 유료 관람인원 또는 인솔자 수를 확인해주세요.</span>`;
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

function legacyTotalPaid(c){
  const oldFree=Math.min(Math.floor(Math.max(0,c.paid)/5),Math.max(0,c.chaperone));
  return c.paid+(c.chaperone-oldFree);
}
function adjustVisibleTotal(){
  const c=currentCounts(),total=$('sumTotal');if(!c||!total)return;
  const baseAmount=Number(String(total.textContent||'').replace(/[^0-9]/g,''));
  if(!Number.isFinite(baseAmount))return;
  const delta=c.totalPaid-legacyTotalPaid(c);
  if(delta)total.textContent=money(Math.max(0,baseAmount+delta*PRICE));
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
    b.entryAmount=c.totalPaid*PRICE;
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
    if(c.paid>0&&!c.eligible)return '단체예약은 유료인원 합계 15명부터 가능합니다. 유료 관람인원 또는 인솔자 수를 확인해주세요.';
    const el=$('paidCount');
    if(c.eligible&&c.paid<MIN_PAID&&el){
      const original=el.value;
      const has15=[...el.options].some(o=>String(o.value)===String(MIN_PAID));
      if(has15)el.value=String(MIN_PAID);
      try{return base.apply(this,arguments)}finally{el.value=original}
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
  const wrapped=function(){const out=base.apply(this,arguments);renderPeopleGuide();adjustVisibleTotal();return out};
  wrapped.__zrGroupMinimumV1=true;wrapped.__zrBase=base;
  window.refreshSummary=wrapped;try{refreshSummary=wrapped}catch{}
  return true;
}

function refresh(){
  ensurePaidOptions();ensureRuleHelp();patchBookingData();patchValidateBooking();patchRefreshSummary();renderPeopleGuide();
}

function boot(){
  refresh();
  window.addEventListener('change',e=>{
    if(!customerFormVisible())return;
    if(e.target?.id==='paidCount'||e.target?.id==='chaperoneCount')setTimeout(()=>{refresh();try{window.refreshSummary?.()}catch{}},0);
  },true);
  window.addEventListener('click',e=>{
    if(!customerFormVisible())return;
    const b=e.target?.closest?.('#submitBooking');if(!b)return;
    const c=currentCounts();
    if(c.eligible)return;
    e.preventDefault();e.stopImmediatePropagation();
    try{window.toast?.('단체예약은 유료인원 합계 15명부터 가능합니다. 인원 수를 확인해주세요.')}catch{}
    try{$('paidCount')?.scrollIntoView({behavior:'smooth',block:'center'})}catch{}
  },true);
  const t=setInterval(refresh,300);setTimeout(()=>clearInterval(t),20000);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
