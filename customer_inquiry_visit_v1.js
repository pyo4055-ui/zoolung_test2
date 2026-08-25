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

function installStyle(){
  if(document.getElementById('zrInquiryVisitStyleV2'))return;
  const style=document.createElement('style');
  style.id='zrInquiryVisitStyleV2';
  style.textContent=`
    #zrInquiryVisitFields .zr-inquiry-visit-grid{display:grid;grid-template-columns:max-content max-content;gap:12px;margin-bottom:12px;align-items:start}
    #zrInquiryVisitFields #inqVisitDate{width:170px;max-width:100%;box-sizing:border-box}
    #zrInquiryVisitFields #inqVisitTime{width:160px;max-width:100%;box-sizing:border-box}
    #zrInquiryVisitFields .zr-inquiry-people{width:calc(50% - 6px);margin-bottom:12px}
    #inquiryModal .zr-inquiry-contact-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-areas:"name phone" "org email";gap:12px}
    #inquiryModal .zr-inquiry-name{grid-area:name}
    #inquiryModal .zr-inquiry-phone{grid-area:phone}
    #inquiryModal .zr-inquiry-org{grid-area:org}
    #inquiryModal .zr-inquiry-email{grid-area:email}
    @media(max-width:800px){
      #zrInquiryVisitFields .zr-inquiry-visit-grid{grid-template-columns:max-content max-content;gap:10px}
      #zrInquiryVisitFields #inqVisitDate{width:155px}
      #zrInquiryVisitFields #inqVisitTime{width:145px}
      #zrInquiryVisitFields .zr-inquiry-people{width:100%}
      #inquiryModal .zr-inquiry-contact-grid{grid-template-columns:1fr;grid-template-areas:"name" "org" "phone" "email"}
    }
    @media(max-width:360px){
      #zrInquiryVisitFields .zr-inquiry-visit-grid{grid-template-columns:1fr}
      #zrInquiryVisitFields #inqVisitDate{width:155px}
      #zrInquiryVisitFields #inqVisitTime{width:145px}
    }`;
  document.head.appendChild(style);
}

function install(){
  const modal=document.getElementById('inquiryModal');
  const submit=document.getElementById('submitInquiry');
  const content=document.getElementById('inqContent');
  if(!modal||!submit||!content)return false;

  installStyle();

  let fields=document.getElementById('zrInquiryVisitFields');
  const contactGrid=modal.querySelector('.modal-card > .grid2');
  if(!contactGrid)return false;

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
      <div class="zr-inquiry-visit-grid">
        <div>
          <label class="req">방문 희망일</label>
          <input id="inqVisitDate" type="date">
        </div>
        <div>
          <label class="req">방문 희망시간</label>
          <input id="inqVisitTime" type="time" step="1800">
          <div class="help">30분 단위로 입력해주세요.</div>
        </div>
      </div>
      <div class="zr-inquiry-people">
        <label class="req" id="inqPeopleLabel">인원</label>
        <input id="inqPeople" type="number" min="1" step="1" inputmode="numeric" placeholder="ex) 3">
      </div>`;
    contactGrid.before(fields);

    const intro=modal.querySelector('.modal-card > h2 + .help');
    if(intro)intro.textContent='사전답사 또는 단체 관련 문의를 남겨주세요.';
  }

  contactGrid.classList.add('zr-inquiry-contact-grid');
  const name=document.getElementById('inqName');
  const phone=document.getElementById('inqPhone');
  const email=document.getElementById('inqEmail');
  const nameWrap=name?.parentElement;
  const phoneWrap=phone?.parentElement;
  const emailWrap=email?.parentElement;
  if(nameWrap)nameWrap.classList.add('zr-inquiry-name');
  if(phoneWrap)phoneWrap.classList.add('zr-inquiry-phone');
  if(emailWrap){
    emailWrap.classList.add('zr-inquiry-email');
    const label=emailWrap.querySelector('label');
    if(label){label.classList.remove('req');label.textContent='이메일 (선택)';}
    email.required=false;
    email.removeAttribute('aria-required');
  }

  let org=document.getElementById('inqOrgName');
  if(!org){
    const wrap=document.createElement('div');
    wrap.className='zr-inquiry-org';
    wrap.innerHTML='<label class="req">단체명</label><input id="inqOrgName" placeholder="ex) 주렁유치원">';
    contactGrid.appendChild(wrap);
    org=wrap.querySelector('#inqOrgName');
  }

  const type=document.getElementById('inqType');
  const visitDate=document.getElementById('inqVisitDate');
  const visitTime=document.getElementById('inqVisitTime');
  const people=document.getElementById('inqPeople');
  const peopleLabel=document.getElementById('inqPeopleLabel');
  if(!type||!visitDate||!visitTime||!people||!peopleLabel||!org||!name)return false;

  function syncVisitFieldHeight(){
    const refHeight=Math.round(name.getBoundingClientRect().height);
    if(!refHeight)return;
    for(const el of [visitDate,visitTime]){
      el.style.setProperty('height',`${refHeight}px`,'important');
      el.style.setProperty('min-height',`${refHeight}px`,'important');
      el.style.setProperty('max-height',`${refHeight}px`,'important');
      el.style.setProperty('box-sizing','border-box','important');
    }
  }

  function updatePeopleLabel(){
    peopleLabel.textContent=type.value==='preview'?'사전답사 인원':type.value==='group'?'단체 인원':'인원';
  }

  function resetVisitFields(){
    type.value='';
    visitDate.value='';
    visitTime.value='';
    people.value='';
    org.value='';
    visitDate.min=localToday();
    updatePeopleLabel();
    requestAnimationFrame(syncVisitFieldHeight);
  }

  function setGroupInquiry(){
    resetVisitFields();
    type.value='group';
    updatePeopleLabel();
  }

  visitDate.min=localToday();
  requestAnimationFrame(syncVisitFieldHeight);
  if(!window.__ZR_INQUIRY_VISIT_HEIGHT_SYNC_V1){
    window.__ZR_INQUIRY_VISIT_HEIGHT_SYNC_V1=true;
    window.addEventListener('resize',()=>requestAnimationFrame(syncVisitFieldHeight),{passive:true});
  }
  if(type.dataset.zrInquiryVisitBound!=='1'){
    type.dataset.zrInquiryVisitBound='1';
    type.addEventListener('change',updatePeopleLabel);
  }
  updatePeopleLabel();

  if(submit.dataset.zrInquiryVisitBound!=='1'){
    submit.dataset.zrInquiryVisitBound='1';
    submit.addEventListener('click',e=>{
      const inquiryType=type.value;
      const orgName=org.value.trim();
      const date=visitDate.value;
      const time=visitTime.value;
      const count=Math.trunc(Number(people.value));

      if(!inquiryType||!orgName||!date||!time||!Number.isFinite(count)||count<1){
        e.preventDefault();
        e.stopImmediatePropagation();
        showToast('문의 유형, 단체명, 방문일, 방문시간, 인원을 확인해주세요.');
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
      const prefix=`[${typeLabel}]\n단체명: ${orgName}\n방문 희망일: ${date}\n방문 희망시간: ${time}\n${countLabel}: ${count}명`;
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
