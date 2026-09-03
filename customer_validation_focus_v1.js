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
  #${ROOT_ID} .${ERROR_CLASS}{
    margin:6px 0 0!important;padding:8px 10px!important;border:1px solid #f0b4b4!important;border-radius:9px!important;
    background:#fff0f0!important;color:#a62525!important;font-size:13px!important;font-weight:800!important;line-height:1.45!important;
    word-break:keep-all!important;
  }
  #zrCustomerValidationSummaryV1{
    margin:0 0 18px!important;padding:14px 15px!important;border:1px solid #efaaaa!important;border-radius:14px!important;
    background:#fff0f0!important;color:#8f2020!important;box-shadow:0 7px 20px rgba(137,31,31,.07)!important;
  }
  #zrCustomerValidationSummaryV1 strong{display:block;margin-bottom:7px!important;font-size:15px!important;color:#8f2020!important}
  #zrCustomerValidationSummaryV1 ul{margin:0!important;padding-left:20px!important;font-size:13px!important;line-height:1.65!important}
  #zrCustomerValidationSummaryV1 li{margin:0!important}
  #zrCustomerValidationSummaryV1 button{
    margin-top:10px!important;min-height:38px!important;padding:0 13px!important;border:1px solid #d93838!important;border-radius:9px!important;
    background:#d93838!important;color:#fff!important;font-size:13px!important;font-weight:900!important;cursor:pointer!important;
  }
  `;
  document.head.appendChild(s);
}

function norm(v){return String(v||'').replace(/\s+/g,' ').trim()}
function visible(el){
  if(!el||el.disabled||el.type==='hidden')return false;
  try{const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&el.getClientRects().length>0}catch{return true}
}
function labelText(el,root){
  if(!el)return '필수 항목';
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
  return norm(el.getAttribute('aria-label')||el.placeholder||el.name||el.id)||'필수 항목';
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
  if(el.validity?.patternMismatch)return `${label} 형식을 확인해주세요.`;
  if(el.validity?.rangeUnderflow||el.validity?.rangeOverflow)return `${label} 값을 확인해주세요.`;
  if(el.type==='checkbox'||el.type==='radio')return `${label}을(를) 확인해주세요.`;
  if(el.tagName==='SELECT')return `${label}을(를) 선택해주세요.`;
  return `${label}을(를) 입력해주세요.`;
}
function clearField(el){
  if(!el)return;
  el.classList.remove(INVALID_CLASS);
  const id=el.dataset.zrValidationErrorId;
  if(id){document.getElementById(id)?.remove();delete el.dataset.zrValidationErrorId}
}
function errorAnchor(el){
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
  const anchor=errorAnchor(el);
  anchor.insertAdjacentElement('afterend',note);
}
function clearSummary(){
  $('zrCustomerValidationSummaryV1')?.remove();
}
function summaryHost(root){
  const firstCard=root.querySelector(':scope > .card,:scope > .calc,.card,.calc');
  return firstCard||root;
}
function showSummary(root,issues){
  clearSummary();
  const box=document.createElement('div');
  box.id='zrCustomerValidationSummaryV1';box.setAttribute('role','alert');
  const items=issues.slice(0,6).map(x=>`<li>${String(x.message).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</li>`).join('');
  box.innerHTML=`<strong>예약 신청 전 확인해주세요</strong><ul>${items}</ul><button type="button">첫 번째 미입력 항목으로 이동</button>`;
  const host=summaryHost(root);
  host.insertAdjacentElement('afterbegin',box);
  box.querySelector('button')?.addEventListener('click',()=>focusIssue(issues[0]));
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
        const first=group[0],label=labelText(first,root);issues.push({el:first,message:`${label}을(를) 선택해주세요.`});
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
  try{target.scrollIntoView({behavior:'smooth',block:'center'})}catch{try{target.scrollIntoView()}catch{}}
  setTimeout(()=>{try{issue.el.focus({preventScroll:true})}catch{try{issue.el.focus()}catch{}}},280);
}
function handleAttempt(e){
  const root=$(ROOT_ID);if(!root||!root.contains(e.target))return;
  const btn=e.target.closest?.('button,input[type="submit"],input[type="button"]');
  if(!btn)return;
  const text=norm(btn.textContent||btn.value).replace(/\s+/g,'');
  if(text!=='예약신청하기')return;
  const issues=collectIssues(root);
  if(!issues.length){clearSummary();return}
  e.preventDefault();e.stopImmediatePropagation();
  issues.forEach((issue,i)=>markField(issue.el,issue.message,i));
  showSummary(root,issues);
  focusIssue(issues[0]);
}
function clearOnEdit(e){
  const root=$(ROOT_ID);if(!root||!root.contains(e.target))return;
  if(!e.target.matches?.('input,select,textarea'))return;
  if(!invalid(e.target))clearField(e.target);
  const remaining=[...root.querySelectorAll(`.${INVALID_CLASS}`)];
  if(!remaining.length)clearSummary();
}
function boot(){
  installStyle();
  document.addEventListener('click',handleAttempt,true);
  document.addEventListener('input',clearOnEdit,true);
  document.addEventListener('change',clearOnEdit,true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
