(()=>{
'use strict';
if(window.__ZR_CUSTOMER_VALIDATION_FOCUS_V1)return;
window.__ZR_CUSTOMER_VALIDATION_FOCUS_V1=true;

const $=id=>document.getElementById(id);
const ROOT_ID='customerView';
const ERROR_CLASS='zr-customer-field-error-v1';
const INVALID_CLASS='zr-customer-invalid-v1';

function installStyle(){
  if($('zrCustomerValidationFocusV1Style'))return;
  const s=document.createElement('style');
  s.id='zrCustomerValidationFocusV1Style';
  s.textContent=`
  #${ROOT_ID} .${INVALID_CLASS}{
    border-color:#d93838!important;
    box-shadow:0 0 0 3px rgba(217,56,56,.12)!important;
    background-color:#fff9f9!important;
  }
  #${ROOT_ID} .zr-participant-age-row input{min-width:64px!important;font-size:16px!important;scroll-margin-top:90px}
  #${ROOT_ID} .zr-participant-age-row + .${ERROR_CLASS}{width:100%;box-sizing:border-box}
  #${ROOT_ID} .${ERROR_CLASS}{
    margin:6px 0 0!important;padding:8px 10px!important;border:1px solid #f0b4b4!important;border-radius:9px!important;
    background:#fff0f0!important;color:#a62525!important;font-size:13px!important;font-weight:800!important;line-height:1.45!important;
    word-break:keep-all!important;
  }
  `;
  document.head.appendChild(s);
}

function norm(v){return String(v||'').replace(/\s+/g,' ').trim()}
function visible(el){
  if(!el||el.disabled||el.type==='hidden')return false;
  try{const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&el.getClientRects().length>0}catch{return true}
}
const FIELD_LABELS={groupType:'단체 유형',paidCount:'유료 관람인원',chaperoneCount:'인솔자 수',participantAgeMin:'참가자 최소 만 나이',participantAgeMax:'참가자 최대 만 나이',visitMonth:'방문 월',visitDay:'방문 일자',mealType:'식사 여부',entryTime:'입장시간',exitTime:'퇴장시간',mealStart:'식사 시작시간',mealDuration:'식사 이용시간',playUse:'놀이터 이용 여부',playStart:'놀이터 입장시간',playDuration:'놀이터 이용시간',feedPurchase:'먹이 세트 구매 여부',feedQuantity:'먹이 세트 수량',orgName:'단체명',managerName:'예약자명',contact:'연락처',email:'이메일',notes:'특이사항',privacy:'개인정보 수집 및 이용 동의'};
function labelText(el,root){
  if(!el)return '필수 항목';
  if(FIELD_LABELS[el.id])return FIELD_LABELS[el.id];
  if(el.id){
    const direct=root.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    const t=norm(direct?.textContent).replace(/\s*\*+\s*$/,'');
    if(t)return t;
  }
  let holder=el.closest('.field,.form-group,.calc,.row,.grid2>div,.grid>div');
  for(let i=0;i<3&&holder;i++,holder=holder.parentElement){
    const label=holder.querySelector?.(':scope > label,:scope > .label,:scope > b,:scope > strong');
    const t=norm(label?.textContent).replace(/\s*\*+\s*$/,'');
    if(t)return t;
  }
  if(el.name){
    const groupLabel=root.querySelector(`label[for="${CSS.escape(el.name)}"]`);
    const t=norm(groupLabel?.textContent).replace(/\s*\*+\s*$/,'');
    if(t)return t;
  }
  return norm(el.getAttribute('aria-label')||el.placeholder)||'필수 항목';
}
function requiredByLabel(el){
  if(el.required||el.getAttribute('aria-required')==='true')return true;
  const holder=el.closest('.field,.form-group,.calc,.row,.grid2>div,.grid>div,div');
  const label=holder?.querySelector?.('label.req,label.required,.req');
  return !!label;
}
function empty(el){
  if(el.type==='checkbox'||el.type==='radio')return !el.checked;
  return !norm(el.value);
}
function invalid(el){
  if(!visible(el))return false;
  if(requiredByLabel(el)&&empty(el))return true;
  try{return !el.checkValidity()}catch{return false}
}
function messageFor(el,label){
  if(['participantAgeMin','participantAgeMax'].includes(el.id)&&el.validity?.rangeOverflow&&el.max==='7')return '유치원·어린이집은 참가자 나이를 만 7세까지 입력할 수 있습니다. 입력한 나이나 단체 유형을 수정해주세요.';
  if(el.validity?.typeMismatch&&el.type==='email')return '이메일 주소를 확인해주세요. (예: name@example.com)';
  if(el.validity?.stepMismatch)return `${label}: 소수점 없이 정수로 입력해주세요.`;
  if(el.validity?.patternMismatch)return `${label} 형식을 확인해주세요.`;
  if(el.validity?.rangeUnderflow)return `${label}: ${el.min} 이상으로 입력해주세요.`;
  if(el.validity?.rangeOverflow)return `${label}: ${el.max} 이하로 입력해주세요.`;
  if(el.type==='checkbox'||el.type==='radio')return `${label}: 확인해주세요.`;
  if(el.tagName==='SELECT')return `${label}: 선택해주세요.`;
  return `${label}: 입력해주세요.`;
}
function clearField(el){
  if(!el)return;
  el.classList.remove(INVALID_CLASS);
  const id=el.dataset.zrValidationErrorId;
  if(id){document.getElementById(id)?.remove();delete el.dataset.zrValidationErrorId}
}
function errorAnchor(el){
  if(['participantAgeMin','participantAgeMax'].includes(el.id))return el.closest('.zr-participant-age-row')||el.parentElement;
  if(el.type==='checkbox'||el.type==='radio')return el.closest('label,.check,.checkbox,.radio,.calc,.field,.form-group')||el.parentElement||el;
  return el;
}
function markField(el,msg,index){
  clearField(el);
  el.classList.add(INVALID_CLASS);
  const id=`zrCustomerFieldErrorV1_${index}`;
  const note=document.createElement('div');
  note.id=id;note.className=ERROR_CLASS;note.setAttribute('role','alert');note.textContent=`⚠ ${msg}`;
  el.dataset.zrValidationErrorId=id;
  errorAnchor(el).insertAdjacentElement('afterend',note);
}
function collectIssues(root){
  const controls=[...root.querySelectorAll('input,select,textarea')];
  const issues=[];
  const seenRadio=new Set();
  for(const el of controls){
    clearField(el);
    if(!visible(el))continue;
    if(el.type==='radio'&&el.name){
      if(seenRadio.has(el.name))continue;
      seenRadio.add(el.name);
      const group=controls.filter(x=>x.type==='radio'&&x.name===el.name&&visible(x));
      const required=group.some(requiredByLabel);
      if(required&&!group.some(x=>x.checked)){
        const first=group[0],label=labelText(first,root);issues.push({el:first,message:`${label}: 선택해주세요.`});
      }
      continue;
    }
    if(!invalid(el))continue;
    const label=labelText(el,root);
    issues.push({el,message:messageFor(el,label)});
  }
  return issues;
}
function focusIssue(issue){
  if(!issue?.el)return;
  const target=errorAnchor(issue.el);
  try{target.scrollIntoView({behavior:'auto',block:'center'})}catch{try{target.scrollIntoView()}catch{}}
  try{issue.el.focus({preventScroll:true})}catch{try{issue.el.focus()}catch{}};
}
function handleAttempt(e){
  const root=$(ROOT_ID);if(!root||!root.contains(e.target))return;
  const btn=e.target.closest?.('button,input[type="submit"],input[type="button"]');
  if(!btn)return;
  const text=norm(btn.textContent||btn.value).replace(/\s+/g,'');
  if(text!=='예약신청하기')return;
  const issues=collectIssues(root);
  if(!issues.length)return;
  e.preventDefault();e.stopImmediatePropagation();
  issues.forEach((issue,i)=>markField(issue.el,issue.message,i));
  focusIssue(issues[0]);
}
function clearOnEdit(e){
  const root=$(ROOT_ID);if(!root||!root.contains(e.target))return;
  if(!e.target.matches?.('input,select,textarea'))return;
  if(!invalid(e.target))clearField(e.target);
  if(e.target.id==='groupType')for(const id of ['participantAgeMin','participantAgeMax']){const input=$(id);if(input)clearField(input);}
}
function boot(){
  installStyle();
  document.addEventListener('click',handleAttempt,true);
  document.addEventListener('input',clearOnEdit,true);
  document.addEventListener('change',clearOnEdit,true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();