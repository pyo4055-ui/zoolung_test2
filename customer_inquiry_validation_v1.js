(()=>{
'use strict';
if(window.__ZR_CUSTOMER_INQUIRY_VALIDATION_V1)return;
window.__ZR_CUSTOMER_INQUIRY_VALIDATION_V1=true;

const $=id=>document.getElementById(id);
const INVALID='zr-inquiry-invalid-v1';
const ERROR='zr-inquiry-field-error-v1';
const norm=v=>String(v||'').trim();

function installStyle(){
  if($('zrCustomerInquiryValidationV1Style'))return;
  const s=document.createElement('style');
  s.id='zrCustomerInquiryValidationV1Style';
  s.textContent=`
  #inquiryModal .${INVALID}{
    border-color:#d93838!important;
    box-shadow:0 0 0 3px rgba(217,56,56,.12)!important;
    background-color:#fff9f9!important;
  }
  #inquiryModal .zr-inquiry-date-selects.${INVALID}{
    border:1px solid #d93838!important;border-radius:11px!important;padding:3px!important;
    box-shadow:0 0 0 3px rgba(217,56,56,.12)!important;background:#fff9f9!important;
  }
  #inquiryModal .zr-inquiry-date-selects.${INVALID} select{border-color:#e7a2a2!important;background:#fff!important}
  #inquiryModal .${ERROR}{
    margin:6px 0 0!important;padding:8px 10px!important;border:1px solid #f0b4b4!important;border-radius:9px!important;
    background:#fff0f0!important;color:#a62525!important;font-size:12.5px!important;font-weight:850!important;line-height:1.45!important;
    word-break:keep-all!important;
  }
  #inquiryModal #zrInquiryPrivacySection.${INVALID}{border-color:#d93838!important;box-shadow:0 0 0 3px rgba(217,56,56,.10)!important;background:#fff9f9!important}
  `;
  document.head.appendChild(s);
}

function clearOne(target){
  if(!target)return;
  target.classList?.remove(INVALID);
  const id=target.dataset?.zrInquiryValidationErrorId;
  if(id){$(id)?.remove();delete target.dataset.zrInquiryValidationErrorId}
}
function addError(target,message,key){
  if(!target)return;
  clearOne(target);
  target.classList.add(INVALID);
  const note=document.createElement('div');
  note.className=ERROR;note.id=`zrInquiryValidationError_${key}`;note.setAttribute('role','alert');note.textContent=message;
  target.dataset.zrInquiryValidationErrorId=note.id;
  target.insertAdjacentElement('afterend',note);
}
function clearAll(){
  document.querySelectorAll(`#inquiryModal .${INVALID}`).forEach(el=>el.classList.remove(INVALID));
  document.querySelectorAll(`#inquiryModal .${ERROR}`).forEach(el=>el.remove());
  document.querySelectorAll('#inquiryModal [data-zr-inquiry-validation-error-id]').forEach(el=>delete el.dataset.zrInquiryValidationErrorId);
}
function formVisible(){
  const stage=$('zrInquiryFormStage');
  if(!stage||stage.classList.contains('hidden'))return false;
  const modal=$('inquiryModal');
  return !!modal&&!modal.classList.contains('hidden');
}
function dateTarget(){return $('inqVisitMonth')?.closest('.zr-inquiry-date-selects')||$('inqVisitMonth')}
function privacyTarget(){return $('inqPrivacy')?.closest('#zrInquiryPrivacySection')||$('inqPrivacy')?.closest('.calc')||$('inqPrivacy')}
function contentTarget(){return $('inqContent')}
function issue(target,control,message,key){return {target,control,message,key}}

function collectIssues(){
  const out=[];
  const type=$('inqType'),month=$('inqVisitMonth'),day=$('inqVisitDay'),time=$('inqVisitTime'),people=$('inqPeople');
  const org=$('inqOrgName'),name=$('inqName'),mobile=$('inqMobile'),content=$('inqContent'),privacy=$('inqPrivacy');
  const changeSelect=$('zrChangeBookingSelect');
  if(changeSelect&&!changeSelect.closest('.hidden')&&!changeSelect.disabled&&!norm(changeSelect.value))out.push(issue(changeSelect,changeSelect,'변경할 예약을 선택해주세요.','changeBooking'));
  if(!norm(type?.value))out.push(issue(type,type,'문의 유형을 선택해주세요.','type'));
  if(!norm(month?.value)||!norm(day?.value))out.push(issue(dateTarget(),!norm(month?.value)?month:day,'방문 희망일을 선택해주세요.','date'));
  if(!norm(time?.value))out.push(issue(time,time,'방문 희망시간을 선택해주세요.','time'));
  const count=Math.trunc(Number(people?.value));if(!Number.isFinite(count)||count<1)out.push(issue(people,people,'인원을 입력해주세요.','people'));
  if(!norm(name?.value))out.push(issue(name,name,'문의자명을 입력해주세요.','name'));
  if(!norm(org?.value))out.push(issue(org,org,'단체명을 입력해주세요.','org'));
  const mobileNo=String(mobile?.value||'').replace(/\D/g,'');
  if(!/^010\d{8}$/.test(mobileNo))out.push(issue(mobile,mobile,'휴대폰번호는 010으로 시작하는 숫자 11자리로 입력해주세요.','mobile'));
  if(!norm(content?.value))out.push(issue(contentTarget(),content,'문의 내용을 입력해주세요.','content'));
  if(!privacy?.checked)out.push(issue(privacyTarget(),privacy,'개인정보 수집·이용에 동의해주세요.','privacy'));
  return out;
}
function focusIssue(x){
  if(!x)return;
  try{x.target?.scrollIntoView?.({behavior:'smooth',block:'center'})}catch{}
  setTimeout(()=>{try{x.control?.focus?.({preventScroll:true})}catch{try{x.control?.focus?.()}catch{}}},260);
}
function validate(e){
  const submit=e.target?.closest?.('#submitInquiry');
  if(!submit||!formVisible())return;
  clearAll();
  const issues=collectIssues();
  if(!issues.length)return;
  e.preventDefault();e.stopImmediatePropagation();
  issues.forEach(x=>addError(x.target,x.message,x.key));
  focusIssue(issues[0]);
}
function clearEdited(e){
  if(!e.target?.closest?.('#inquiryModal'))return;
  const ids=['inqType','inqVisitMonth','inqVisitDay','inqVisitTime','inqPeople','inqOrgName','inqName','inqMobile','inqContent','inqPrivacy','zrChangeBookingSelect'];
  if(!ids.includes(e.target.id))return;
  if(['inqVisitMonth','inqVisitDay'].includes(e.target.id))clearOne(dateTarget());
  else if(e.target.id==='inqPrivacy')clearOne(privacyTarget());
  else clearOne(e.target);
}
function boot(){
  installStyle();
  document.addEventListener('click',validate,true);
  document.addEventListener('input',clearEdited,true);
  document.addEventListener('change',clearEdited,true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();