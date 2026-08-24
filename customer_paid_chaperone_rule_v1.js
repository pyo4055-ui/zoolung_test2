(()=>{
'use strict';
if(window.__ZR_CUSTOMER_PAID_CHAPERONE_RULE_V1)return;
window.__ZR_CUSTOMER_PAID_CHAPERONE_RULE_V1=true;

const KEY='zr_bookings';
const PRICE=15000;
const $=id=>document.getElementById(id);
let pendingPeople=null;
let storeInstalled=false;
let formHooked=false;

// ZR_PEOPLE_CALC_START
function calculate(paid,chap){
  paid=Math.max(0,Number(paid)||0);
  chap=Math.max(0,Number(chap)||0);
  const mandatoryPaidChap=Math.min(chap,Math.max(0,15-paid));
  const paidBase=paid+mandatoryPaidChap;
  const freeQuota=Math.floor(paidBase/5);
  const remainingChap=Math.max(0,chap-mandatoryPaidChap);
  const freeChap=Math.min(remainingChap,freeQuota);
  const paidChap=chap-freeChap;
  const effectivePaid=paid+paidChap;
  return {paid,chap,mandatoryPaidChap,freeQuota,freeChap,paidChap,effectivePaid,eligible:effectivePaid>=15};
}
// ZR_PEOPLE_CALC_END

function toast(text){try{window.toast?.(text)}catch{}}
function customerVisible(){
  const v=$('customerView');
  return !!v&&!v.classList.contains('hidden')&&getComputedStyle(v).display!=='none';
}
function inputs(){return {paid:$('paidCount'),chap:$('chaperoneCount'),calc:$('peopleCalc')}}
function current(){
  const {paid,chap}=inputs();
  if(!paid||!chap)return null;
  return calculate(paid.value,chap.value);
}
function bookingIds(){
  try{return new Set((JSON.parse(localStorage.getItem(KEY)||'[]')||[]).filter(x=>x?.id).map(x=>String(x.id)))}catch{return new Set()}
}
function ensurePaidOptions(){
  const el=$('paidCount');if(!el||el.tagName!=='SELECT')return false;
  const values=new Set([...el.options].map(o=>Number(o.value)).filter(Number.isFinite));
  const firstText=[...el.options].find(o=>Number.isFinite(Number(o.value)))?.textContent||'';
  const suffix=/명\s*$/.test(firstText)?'명':'';
  const ref=[...el.options].find(o=>Number(o.value)>=15)||el.firstChild;
  for(let n=14;n>=1;n--){
    if(values.has(n))continue;
    const o=document.createElement('option');o.value=String(n);o.textContent=`${n}${suffix}`;el.insertBefore(o,ref||null);
  }
  return true;
}
function replaceOldGuidance(){
  const root=$('customerView');if(!root)return;
  root.querySelectorAll('.help,small,p').forEach(el=>{
    const t=(el.textContent||'').replace(/\s+/g,' ').trim();
    if(/유료인원만\s*15명\s*이상/.test(t)||(/유료인원/.test(t)&&/15명\s*이상이어야\s*예약/.test(t))){
      el.textContent='유료 관람인원과 인솔자 수를 실제 인원대로 입력해주세요.';
    }
  });
}
function injectStyle(){
  if($('zrPeopleRuleV1Style'))return;
  const s=document.createElement('style');s.id='zrPeopleRuleV1Style';s.textContent=`
#zrPeopleRuleV1{margin:10px 0 8px;padding:12px 13px;border:1px solid #dfe6e1;border-radius:12px;background:#f8faf8;color:#3f4b44;font-size:12px;line-height:1.65}
#zrPeopleRuleV1 b{color:#26352c}
#zrPeopleResultV1{margin:8px 0 10px;padding:12px 13px;border-radius:12px;font-size:13px;line-height:1.55}
#zrPeopleResultV1.zr-people-ok{background:#f0f8f3;border:1px solid #cfe3d6;color:#24573d}
#zrPeopleResultV1.zr-people-no{background:#fff4f3;border:1px solid #efd5d2;color:#93433d}
#zrPeopleResultV1 .zr-people-main{font-size:15px;font-weight:900}
#zrPeopleResultV1 .zr-people-sub{margin-top:4px;font-size:12px;color:#5c6861}
`;
  document.head.appendChild(s);
}
function ensureGuide(){
  const calc=$('peopleCalc');if(!calc?.parentElement)return false;
  injectStyle();
  let rule=$('zrPeopleRuleV1');
  if(!rule){
    rule=document.createElement('div');rule.id='zrPeopleRuleV1';
    rule.innerHTML='<b>단체예약은 유료인원 합계 15명부터 가능합니다.</b><br>유료 15명 충족 후, 유료인원 5명당 인솔자 1명이 무료입니다.<br>15명이 부족한 경우 인솔자 일부가 유료로 적용될 수 있습니다.';
    calc.insertAdjacentElement('beforebegin',rule);
  }
  let result=$('zrPeopleResultV1');
  if(!result){result=document.createElement('div');result.id='zrPeopleResultV1';rule.insertAdjacentElement('afterend',result)}
  return true;
}
function render(){
  ensurePaidOptions();replaceOldGuidance();if(!ensureGuide())return;
  const c=current(),old=$('peopleCalc'),box=$('zrPeopleResultV1');if(!c||!old||!box)return;
  if(c.paid<15)old.style.display='none';else old.style.display='';
  if(c.eligible){
    box.className='zr-people-ok';
    let sub='';
    if(c.paid<15&&c.mandatoryPaidChap>0){
      sub=`인솔자 ${c.mandatoryPaidChap}명은 최소 유료인원 15명 충족을 위해 유료 적용됩니다.`;
      if(c.freeChap>0)sub+=` 나머지 중 ${c.freeChap}명은 무료 인솔자로 적용됩니다.`;
    }else if(c.paidChap>0){
      sub=`유료 인솔자 ${c.paidChap}명 · 무료 인솔자 ${c.freeChap}명으로 계산됩니다.`;
    }else{
      sub=`무료 인솔자 ${c.freeChap}명으로 계산됩니다.`;
    }
    box.innerHTML=`<div class="zr-people-main">예약 가능 · 유료 ${c.effectivePaid}명 / 무료 인솔 ${c.freeChap}명</div><div class="zr-people-sub">${sub}</div>`;
  }else{
    box.className='zr-people-no';
    const lack=Math.max(0,15-c.effectivePaid);
    box.innerHTML=`<div class="zr-people-main">예약 불가 · 유료인원 ${c.effectivePaid}명</div><div class="zr-people-sub">단체예약은 유료인원 15명부터 가능합니다. 현재 ${lack}명이 부족합니다.</div>`;
  }
}
function patchCreatedBooking(list,snap){
  if(!Array.isArray(list)||!snap)return false;
  const b=list.find(x=>x?.id&&!x.__availabilityOnly&&!snap.beforeIds.has(String(x.id)));
  if(!b)return false;
  const oldEntry=Math.max(0,Number(b.entryAmount)||0);
  const oldTotal=Math.max(0,Number(b.totalAmount)||0);
  const extras=Math.max(0,oldTotal-oldEntry);
  b.paidCount=snap.paid;
  b.chaperoneCount=snap.chap;
  b.freeChaperone=snap.freeChap;
  b.paidChaperone=snap.paidChap;
  b.entryAmount=snap.effectivePaid*PRICE;
  b.totalAmount=b.entryAmount+extras;
  return true;
}
function installStorePatch(){
  if(storeInstalled)return true;
  if(typeof window.setStore!=='function')return false;
  const base=window.setStore;
  const wrapped=function(k,v){
    if(k===KEY&&pendingPeople&&Date.now()<=pendingPeople.expiresAt){
      if(patchCreatedBooking(v,pendingPeople))pendingPeople=null;
    }
    return base.apply(this,arguments);
  };
  wrapped.__zrCustomerPaidChaperoneRuleV1=true;
  if(base.__zrFirebaseBridge)wrapped.__zrFirebaseBridge=true;
  window.setStore=wrapped;
  try{setStore=wrapped}catch{}
  storeInstalled=true;
  return true;
}
function armSubmit(){
  const c=current();if(!c)return {ok:true};
  render();
  if(!c.eligible){
    toast(`단체예약은 유료인원 15명부터 가능합니다. 현재 ${15-c.effectivePaid}명이 부족합니다.`);
    return {ok:false,c};
  }
  pendingPeople={...c,beforeIds:bookingIds(),expiresAt:Date.now()+15000};
  const paid=$('paidCount');
  if(c.paid<15&&paid){
    const actual=String(c.paid);paid.value='15';
    setTimeout(()=>{if(paid&&paid.value==='15'){paid.value=actual;render()}},0);
  }
  return {ok:true,c};
}
function bindSubmitGuard(){
  if(window.__ZR_CUSTOMER_PAID_CHAPERONE_CLICK_GUARD_V1)return;
  window.__ZR_CUSTOMER_PAID_CHAPERONE_CLICK_GUARD_V1=true;
  window.addEventListener('click',e=>{
    const btn=e.target?.closest?.('#submitBooking');
    if(!btn||!customerVisible())return;
    const r=armSubmit();
    if(r.ok)return;
    e.preventDefault();e.stopImmediatePropagation();
  },true);
}
function bindForm(){
  if(formHooked)return;
  const btn=$('submitBooking'),form=btn?.closest?.('form');if(!form)return;
  formHooked=true;
  form.addEventListener('submit',e=>{
    if(!customerVisible())return;
    const r=armSubmit();if(r.ok)return;
    e.preventDefault();e.stopImmediatePropagation();
  },true);
}
function bindInputs(){
  for(const id of ['paidCount','chaperoneCount']){
    const el=$(id);if(!el||el.dataset.zrPeopleRuleV1==='1')continue;
    el.dataset.zrPeopleRuleV1='1';
    el.addEventListener('change',()=>setTimeout(render,0));
    el.addEventListener('input',()=>setTimeout(render,0));
  }
}
function boot(){
  bindSubmitGuard();
  const t=setInterval(()=>{
    ensurePaidOptions();bindInputs();bindForm();installStorePatch();render();
    if($('paidCount')&&$('chaperoneCount')&&$('peopleCalc')&&storeInstalled&&formHooked)clearInterval(t);
  },120);
  setTimeout(()=>clearInterval(t),20000);
  ensurePaidOptions();bindInputs();bindForm();installStorePatch();render();
}
window.zrCustomerPaidChaperoneRuleV1={calculate};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
