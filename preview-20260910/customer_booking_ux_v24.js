(()=>{
'use strict';
if(window.__ZR_CUSTOMER_BOOKING_UX_V24)return;
window.__ZR_CUSTOMER_BOOKING_UX_V24=true;

const $=id=>document.getElementById(id);
const toast=s=>{try{window.toast?.(s)}catch{}};
const PRIVACY_TEXT='단체예약 접수 및 관리, 예약 확인·변경·취소, 이용 안내를 위해 단체명, 예약자명, 연락처, 이메일(선택), 예약 관련 요청사항 등 예약 과정에서 입력한 정보를 수집·이용합니다. 수집된 개인정보는 이용 목적 달성 후 지체 없이 파기하며, 관계 법령에 따라 보관이 필요한 경우에는 해당 기간 동안 안전하게 보관합니다.';
const SPECIAL_TEXT='간식시간 등 별도 시간 조정이 필요하거나, 예약 시 전달할 사항이 있다면 작성해주세요.';
const SPECIAL_EXAMPLE='예) 14:00~14:30 간식시간 필요';
const OLD_PROGRAM_TEXT='동물원 프로그램 시간은 방문 전주 스케줄을 통해 안내됩니다.';
const NEW_PROGRAM_HTML='동물원 관람 및 체험 일정은 <b>방문 전주</b>에 예약확인 페이지에서 안내됩니다.';

function phone(){return $('startContact')}
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
  const root=$('customerView');if(!root)return;
  const heading=[...root.querySelectorAll('h2,h3,h4,strong,b,label,div')].find(el=>(el.textContent||'').trim()==='개인정보 수집 및 이용 안내');
  const privacy=$('privacy');
  const scope=heading?.closest('.calc,.card,.box,.field,.form-group')||privacy?.closest('.calc,.card,.box,.field,.form-group')||privacy?.parentElement;
  if(!scope)return;
  let help=[...scope.querySelectorAll('.help,small,p')].find(el=>el.id!=='zrSpecialRequestHelp'&&/(개인정보|단체예약 접수|브라우저에만 저장|입력 정보를 수집)/.test((el.textContent||'').trim()));
  if(!help){
    help=document.createElement('div');
    help.id='zrPrivacyHelpV36';
    help.className='help';
    help.style.marginTop='6px';
    if(heading)heading.insertAdjacentElement('afterend',help);else scope.insertBefore(help,scope.firstChild);
  }
  if(help.textContent!==PRIVACY_TEXT)help.textContent=PRIVACY_TEXT;
}
function applySpecialRequestText(){
  const root=$('customerView');if(!root)return;
  const label=[...root.querySelectorAll('label')].find(x=>/^특이사항\s*\*?$/.test((x.textContent||'').replace(/\s+/g,' ').trim()));
  if(!label)return;
  const holder=label.parentElement;
  const ta=holder?.querySelector?.('textarea')||((label.nextElementSibling?.matches?.('textarea'))?label.nextElementSibling:null);
  if(!ta)return;
  ta.placeholder=SPECIAL_EXAMPLE;
  let help=$('zrSpecialRequestHelp');
  if(!help){
    help=document.createElement('div');
    help.id='zrSpecialRequestHelp';
    help.className='help';
    help.style.marginTop='6px';
    ta.insertAdjacentElement('afterend',help);
  }
  if(help.textContent!==SPECIAL_TEXT)help.textContent=SPECIAL_TEXT;
}
function applyProgramScheduleText(){
  const root=$('customerView');if(!root)return;
  const all=[...root.querySelectorAll('p,div,span,small,.help')];
  const el=all.find(x=>(x.textContent||'').includes(OLD_PROGRAM_TEXT)&&![...x.children].some(c=>(c.textContent||'').includes(OLD_PROGRAM_TEXT)));
  if(el&&el.innerHTML!==NEW_PROGRAM_HTML)el.innerHTML=NEW_PROGRAM_HTML;
}
function applyStartUi(){
  const btn=$('lookupBooking');
  if(btn&&btn.textContent!=='예약 / 조회')btn.textContent='예약 / 조회';
  preparePhone();
  applySpecialRequestText();
  applyPrivacyText();
  applyProgramScheduleText();
}
function boot(){
  applyStartUi();
  const el=phone();
  if(el){
    el.addEventListener('input',sanitizePhone);
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
  setTimeout(()=>clearInterval(t),20000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
