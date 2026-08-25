(()=>{
'use strict';
if(window.__ZR_CUSTOMER_INQUIRY_VISIT_V1)return;
window.__ZR_CUSTOMER_INQUIRY_VISIT_V1=true;

function localToday(){
  const d=new Date();
  const p=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
}

function showToast(message){
  try{
    if(typeof toast==='function'){toast(message);return;}
  }catch{}
  alert(message);
}

function install(){
  const modal=document.getElementById('inquiryModal');
  const submit=document.getElementById('submitInquiry');
  const content=document.getElementById('inqContent');
  if(!modal||!submit||!content)return false;

  let fields=document.getElementById('zrInquiryVisitFields');
  if(!fields){
    fields=document.createElement('div');
    fields.id='zrInquiryVisitFields';
    fields.innerHTML=`
      <div style="margin-bottom:12px">
        <label class="req">문의 유형</label>
        <select id="inqType">
          <option value="">선택해주세요</option>
          <option value="preview">사전답사 문의</option>
          <option value="group">단체 문의</option>
        </select>
      </div>
      <div class="grid3" style="margin-bottom:12px">
        <div>
          <label class="req">방문 희망일</label>
          <input id="inqVisitDate" type="date">
        </div>
        <div>
          <label class="req">방문 희망시간</label>
          <input id="inqVisitTime" type="time" step="1800">
          <div class="help">30분 단위로 입력해주세요.</div>
        </div>
        <div>
          <label class="req" id="inqPeopleLabel">인원</label>
          <input id="inqPeople" type="number" min="1" step="1" inputmode="numeric" placeholder="ex) 3">
        </div>
      </div>`;

    const contactGrid=modal.querySelector('.modal-card > .grid2');
    if(!contactGrid)return false;
    contactGrid.before(fields);

    const intro=modal.querySelector('.modal-card > h2 + .help');
    if(intro)intro.textContent='사전답사 또는 단체 관련 문의를 남겨주세요.';
  }

  const type=document.getElementById('inqType');
  const visitDate=document.getElementById('inqVisitDate');
  const visitTime=document.getElementById('inqVisitTime');
  const people=document.getElementById('inqPeople');
  const peopleLabel=document.getElementById('inqPeopleLabel');
  if(!type||!visitDate||!visitTime||!people||!peopleLabel)return false;

  function updatePeopleLabel(){
    peopleLabel.textContent=type.value==='preview'?'사전답사 인원':type.value==='group'?'단체 인원':'인원';
  }

  function resetVisitFields(){
    type.value='';
    visitDate.value='';
    visitTime.value='';
    people.value='';
    visitDate.min=localToday();
    updatePeopleLabel();
  }

  function setGroupInquiry(){
    resetVisitFields();
    type.value='group';
    updatePeopleLabel();
  }

  visitDate.min=localToday();
  if(type.dataset.zrInquiryVisitBound!=='1'){
    type.dataset.zrInquiryVisitBound='1';
    type.addEventListener('change',updatePeopleLabel);
  }
  updatePeopleLabel();

  if(submit.dataset.zrInquiryVisitBound!=='1'){
    submit.dataset.zrInquiryVisitBound='1';
    submit.addEventListener('click',e=>{
      const inquiryType=type.value;
      const date=visitDate.value;
      const time=visitTime.value;
      const count=Math.trunc(Number(people.value));

      if(!inquiryType||!date||!time||!Number.isFinite(count)||count<1){
        e.preventDefault();
        e.stopImmediatePropagation();
        showToast('문의 유형, 방문일, 방문시간, 인원을 확인해주세요.');
        return;
      }

      const match=/^(\d{2}):(\d{2})$/.exec(time);
      if(!match||!['00','30'].includes(match[2])){
        e.preventDefault();
        e.stopImmediatePropagation();
        showToast('방문시간은 30분 단위로 선택해주세요.');
        return;
      }

      const original=content.value;
      const typeLabel=inquiryType==='preview'?'사전답사 문의':'단체 문의';
      const countLabel=inquiryType==='preview'?'사전답사 인원':'단체 인원';
      const prefix=`[${typeLabel}]\n방문 희망일: ${date}\n방문 희망시간: ${time}\n${countLabel}: ${count}명`;
      content.value=`${prefix}\n\n${original}`;

      setTimeout(()=>{
        if(!modal.classList.contains('hidden')){
          content.value=original;
          return;
        }
        resetVisitFields();
      },0);
    },true);
  }

  const inquiryBtn=document.getElementById('inquiryBtn');
  if(inquiryBtn&&inquiryBtn.dataset.zrInquiryVisitBound!=='1'){
    inquiryBtn.dataset.zrInquiryVisitBound='1';
    inquiryBtn.addEventListener('click',()=>setTimeout(resetVisitFields,0));
  }

  const changeExisting=document.getElementById('changeExisting');
  if(changeExisting&&changeExisting.dataset.zrInquiryVisitBound!=='1'){
    changeExisting.dataset.zrInquiryVisitBound='1';
    changeExisting.addEventListener('click',()=>setTimeout(setGroupInquiry,0));
  }

  modal.querySelectorAll('[data-close="inquiryModal"]').forEach(btn=>{
    if(btn.dataset.zrInquiryVisitBound==='1')return;
    btn.dataset.zrInquiryVisitBound='1';
    btn.addEventListener('click',()=>setTimeout(resetVisitFields,0));
  });

  return true;
}

if(!install()){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else setTimeout(install,0);
}
document.addEventListener('zr:admin-runtime-ready',install,{once:true});
})();
