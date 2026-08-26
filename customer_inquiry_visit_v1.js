(()=>{
'use strict';
if(window.__ZR_CUSTOMER_INQUIRY_VISIT_V1)return;
window.__ZR_CUSTOMER_INQUIRY_VISIT_V1=true;

const BOOKING_PRIVACY_TEXT='단체예약 접수 및 관리, 예약 확인·변경·취소, 이용 안내를 위해 단체명, 예약자명, 연락처, 이메일(선택), 예약 관련 요청사항 등 예약 과정에서 입력한 정보를 수집·이용합니다. 수집된 개인정보는 이용 목적 달성 후 지체 없이 파기하며, 관계 법령에 따라 보관이 필요한 경우에는 해당 기간 동안 안전하게 보관합니다.';
const STORE_KEY='zr_inquiries';
const OPTIONAL_EMAIL_SENTINEL='zr-inquiry-optional@local.invalid';

function localToday(){
  const d=new Date();
  const p=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function showToast(message){
  try{if(typeof window.toast==='function'){window.toast(message);return}}catch{}
  alert(message);
}
function readInquiries(){
  try{const v=JSON.parse(localStorage.getItem(STORE_KEY)||'[]');return Array.isArray(v)?v:[]}
  catch{return []}
}
function writeInquiries(list){
  try{
    if(typeof window.setStore==='function')window.setStore(STORE_KEY,list);
    else localStorage.setItem(STORE_KEY,JSON.stringify(list));
  }catch{}
}
function clearOptionalEmailSentinel(){
  const list=readInquiries();let changed=false;
  for(let i=list.length-1;i>=0;i--){
    const item=list[i];if(!item||typeof item!=='object')continue;
    for(const key of ['email','inqEmail']){
      if(String(item[key]??'')===OPTIONAL_EMAIL_SENTINEL){item[key]='';changed=true;break}
    }
    if(changed)break;
  }
  if(changed)writeInquiries(list);
}

function installStyle(){
  if(document.getElementById('zrInquiryVisitStyleV3'))return;
  const style=document.createElement('style');
  style.id='zrInquiryVisitStyleV3';
  style.textContent=`
    #inquiryModal .modal-card{width:min(720px,100%)}
    #zrInquiryFormStage .zr-inquiry-section{border:1px solid var(--line,#dfe5df);border-radius:14px;padding:16px;margin:0 0 12px;background:#fff}
    #zrInquiryFormStage .zr-inquiry-section-title{display:flex;align-items:center;gap:8px;margin:0 0 13px;font-size:15px;font-weight:900;color:var(--text,#1f2a23)}
    #zrInquiryFormStage .zr-inquiry-section-title .section-no{display:inline-flex;width:28px;height:28px;align-items:center;justify-content:center;border-radius:50%;background:var(--green2,#e9f3ed);color:var(--green,#2f6b4f);font-size:13px;font-weight:900;flex:0 0 auto}
    #zrInquiryVisitFields{margin:0!important}
    #zrInquiryVisitFields .zr-inquiry-visit-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;margin-bottom:12px;align-items:start;width:100%}
    #zrInquiryVisitFields #inqVisitDate,#zrInquiryVisitFields #inqVisitTime{width:100%;max-width:100%;box-sizing:border-box}
    #zrInquiryVisitFields .zr-inquiry-people{width:100%;margin-bottom:0}
    #inquiryModal .zr-inquiry-contact-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-areas:"name phone" "org email" "mobile mobile";gap:12px}
    #inquiryModal .zr-inquiry-name{grid-area:name}
    #inquiryModal .zr-inquiry-phone{grid-area:phone}
    #inquiryModal .zr-inquiry-org{grid-area:org}
    #inquiryModal .zr-inquiry-email{grid-area:email}
    #inquiryModal .zr-inquiry-mobile{grid-area:mobile}
    #zrInquiryReviewStage,#zrInquiryCompleteStage{padding:2px 0}
    #zrInquiryReviewStage h2,#zrInquiryCompleteStage h2{margin:0 0 8px}
    #zrInquiryReviewStage .zr-review-help,#zrInquiryCompleteStage .zr-review-help{font-size:13px;line-height:1.65;color:var(--muted,#6d756f);margin-bottom:16px}
    #zrInquiryReviewStage .zr-review-card{border:1px solid var(--line,#dfe5df);border-radius:14px;background:#fafcf9;padding:15px 16px}
    #zrInquiryReviewStage .zr-review-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 18px}
    #zrInquiryReviewStage .zr-review-row{padding:10px 0;border-bottom:1px solid #e7ece8;min-width:0}
    #zrInquiryReviewStage .zr-review-row.full{grid-column:1/-1}
    #zrInquiryReviewStage .zr-review-row:last-child{border-bottom:0}
    #zrInquiryReviewStage .zr-review-label{display:block;font-size:11px;font-weight:800;color:var(--muted,#6d756f);margin-bottom:4px}
    #zrInquiryReviewStage .zr-review-value{font-size:14px;font-weight:800;line-height:1.55;word-break:break-word;white-space:pre-wrap}
    #zrInquiryReviewStage .zr-review-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
    #zrInquiryCompleteStage{text-align:center;padding:26px 4px 8px}
    #zrInquiryCompleteStage .zr-complete-mark{display:flex;width:54px;height:54px;border-radius:50%;align-items:center;justify-content:center;margin:0 auto 14px;background:var(--green2,#e9f3ed);color:var(--green,#2f6b4f);font-size:26px;font-weight:900}
    #zrInquiryCompleteStage .zr-complete-actions{display:flex;justify-content:center;margin-top:20px}
    #zrInquiryCompleteStage .zr-complete-actions button{min-width:170px}
    @media(max-width:800px){
      #zrInquiryFormStage .zr-inquiry-section{padding:14px 13px}
      #zrInquiryVisitFields .zr-inquiry-visit-grid{grid-template-columns:max-content max-content;gap:10px;width:auto}
      #zrInquiryVisitFields #inqVisitDate{width:155px}
      #zrInquiryVisitFields #inqVisitTime{width:160px}
      #inquiryModal .zr-inquiry-contact-grid{grid-template-columns:1fr;grid-template-areas:"name" "org" "phone" "email" "mobile"}
      #zrInquiryReviewStage .zr-review-grid{grid-template-columns:1fr}
      #zrInquiryReviewStage .zr-review-row.full{grid-column:auto}
    }
    @media(max-width:360px){
      #zrInquiryVisitFields .zr-inquiry-visit-grid{grid-template-columns:1fr}
      #zrInquiryVisitFields #inqVisitDate{width:155px}
      #zrInquiryVisitFields #inqVisitTime{width:160px}
    }`;
  document.head.appendChild(style);
}

function applyInquiryPrivacyText(modal){
  const heading=[...modal.querySelectorAll('b,strong,h3,h4')].find(el=>(el.textContent||'').trim()==='개인정보 수집 및 이용 안내');
  const scope=heading?.closest('.calc')||document.getElementById('inqPrivacy')?.closest('.calc');
  const help=scope?.querySelector('.help');
  if(help&&help.textContent!==BOOKING_PRIVACY_TEXT)help.textContent=BOOKING_PRIVACY_TEXT;
}
function sectionTitle(no,title){return `<div class="zr-inquiry-section-title"><span class="section-no">${no}</span>${title}</div>`}
function ensureWrappedSection(node,id,no,title){
  if(!node)return null;
  let section=document.getElementById(id);
  if(section)return section;
  section=document.createElement('section');section.id=id;section.className='zr-inquiry-section';section.innerHTML=sectionTitle(no,title);
  node.before(section);section.appendChild(node);return section;
}
function ensureStages(modal){
  const card=modal.querySelector('.modal-card');if(!card)return null;
  let form=document.getElementById('zrInquiryFormStage');
  if(!form){
    form=document.createElement('div');form.id='zrInquiryFormStage';
    [...card.childNodes].forEach(n=>form.appendChild(n));
    card.appendChild(form);
  }
  let review=document.getElementById('zrInquiryReviewStage');
  if(!review){
    review=document.createElement('div');review.id='zrInquiryReviewStage';review.className='hidden';
    review.innerHTML=`<h2>문의 내용 확인</h2><div class="zr-review-help">입력한 내용을 확인해주세요. 수정이 필요하면 수정하기를 눌러 돌아갈 수 있습니다.</div><div class="zr-review-card" id="zrInquiryReviewCard"></div><div class="zr-review-actions"><button type="button" class="btn-gray" id="zrInquiryReviewEdit">수정하기</button><button type="button" class="btn-primary" id="zrInquiryReviewSubmit">문의하기</button></div>`;
    card.appendChild(review);
  }
  let complete=document.getElementById('zrInquiryCompleteStage');
  if(!complete){
    complete=document.createElement('div');complete.id='zrInquiryCompleteStage';complete.className='hidden';
    complete.innerHTML=`<div class="zr-complete-mark">✓</div><h2>문의하기가 완료됐습니다.</h2><div class="zr-review-help">문의 내용을 확인한 후 입력하신 연락처로 안내드리겠습니다.</div><div class="zr-complete-actions"><button type="button" class="btn-primary" id="zrInquiryCompleteHome">처음 화면으로</button></div>`;
    card.appendChild(complete);
  }
  return {form,review,complete};
}
function showStage(stages,name){
  stages.form.classList.toggle('hidden',name!=='form');
  stages.review.classList.toggle('hidden',name!=='review');
  stages.complete.classList.toggle('hidden',name!=='complete');
}

function install(){
  const modal=document.getElementById('inquiryModal');
  const submit=document.getElementById('submitInquiry');
  const content=document.getElementById('inqContent');
  if(!modal||!submit||!content)return false;

  installStyle();
  const existingStage=document.getElementById('zrInquiryFormStage');
  let contactGrid=modal.querySelector('.modal-card > .grid2,#zrInquiryFormStage .grid2');
  if(!contactGrid)return false;

  let fields=document.getElementById('zrInquiryVisitFields');
  if(!fields){
    fields=document.createElement('div');
    fields.id='zrInquiryVisitFields';
    fields.className='zr-inquiry-section';
    fields.innerHTML=`
      ${sectionTitle(1,'문의 정보')}
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
    const intro=modal.querySelector('.modal-card > h2 + .help,#zrInquiryFormStage > h2 + .help');
    if(intro)intro.textContent='사전답사 또는 단체 관련 문의를 남겨주세요.';
  }

  contactGrid.classList.add('zr-inquiry-contact-grid');
  const name=document.getElementById('inqName');
  const phone=document.getElementById('inqPhone');
  const mobile=document.getElementById('inqMobile');
  const email=document.getElementById('inqEmail');
  const privacy=document.getElementById('inqPrivacy');
  const nameWrap=name?.parentElement,phoneWrap=phone?.parentElement,mobileWrap=mobile?.parentElement,emailWrap=email?.parentElement;
  if(nameWrap)nameWrap.classList.add('zr-inquiry-name');
  if(phoneWrap)phoneWrap.classList.add('zr-inquiry-phone');
  if(mobileWrap)mobileWrap.classList.add('zr-inquiry-mobile');
  if(emailWrap){
    emailWrap.classList.add('zr-inquiry-email');
    const label=emailWrap.querySelector('label');
    if(label){label.classList.remove('req');label.textContent='이메일 (선택)';}
    email.required=false;email.removeAttribute('required');email.removeAttribute('aria-required');
  }

  let org=document.getElementById('inqOrgName');
  if(!org){
    const wrap=document.createElement('div');wrap.className='zr-inquiry-org';wrap.innerHTML='<label class="req">단체명</label><input id="inqOrgName" placeholder="ex) 주렁유치원">';
    contactGrid.appendChild(wrap);org=wrap.querySelector('#inqOrgName');
  }

  const type=document.getElementById('inqType'),visitDate=document.getElementById('inqVisitDate'),visitTime=document.getElementById('inqVisitTime'),people=document.getElementById('inqPeople'),peopleLabel=document.getElementById('inqPeopleLabel');
  if(!type||!visitDate||!visitTime||!people||!peopleLabel||!org||!name||!mobile||!email||!privacy)return false;

  ensureWrappedSection(contactGrid,'zrInquiryContactSection',2,'문의자 정보');
  const contentWrap=content.parentElement;
  ensureWrappedSection(contentWrap,'zrInquiryContentSection',3,'문의 내용');
  const privacyBox=privacy.closest('.calc');
  if(privacyBox){privacyBox.style.marginTop='0';ensureWrappedSection(privacyBox,'zrInquiryPrivacySection',4,'개인정보 수집·이용');}
  const stages=ensureStages(modal);if(!stages)return false;
  applyInquiryPrivacyText(modal);

  let draft=null,nativeSubmit=false;
  function syncVisitFieldHeight(){
    const refHeight=Math.round(name.getBoundingClientRect().height);if(!refHeight)return;
    for(const el of [visitDate,visitTime]){
      el.style.setProperty('height',`${refHeight}px`,'important');el.style.setProperty('min-height',`${refHeight}px`,'important');el.style.setProperty('max-height',`${refHeight}px`,'important');el.style.setProperty('box-sizing','border-box','important');
    }
  }
  function updatePeopleLabel(){peopleLabel.textContent=type.value==='preview'?'사전답사 인원':type.value==='group'?'단체 인원':'인원'}
  function resetVisitFields(){
    type.value='';visitDate.value='';visitTime.value='';people.value='';org.value='';draft=null;visitDate.min=localToday();updatePeopleLabel();showStage(stages,'form');requestAnimationFrame(syncVisitFieldHeight);
  }
  function setGroupInquiry(){resetVisitFields();type.value='group';updatePeopleLabel()}
  function validTime(v){const m=/^(\d{2}):(\d{2})$/.exec(String(v||''));return !!m&&['00','30'].includes(m[2])}
  function collectDraft(){
    const inquiryType=type.value,orgName=org.value.trim(),date=visitDate.value,time=visitTime.value,count=Math.trunc(Number(people.value));
    const person=name.value.trim(),mobileNo=mobile.value.trim(),phoneNo=phone?.value?.trim()||'',emailValue=email.value.trim(),body=content.value.trim();
    if(!inquiryType||!orgName||!date||!time||!Number.isFinite(count)||count<1||!person||!mobileNo||!body||!privacy.checked){
      showToast('필수 입력 항목과 개인정보 수집·이용 동의를 확인해주세요.');return null;
    }
    if(!validTime(time)){showToast('방문시간은 30분 단위로 입력해주세요.');return null}
    if(emailValue&&!email.validity.valid){showToast('이메일 주소 형식을 확인해주세요.');email.focus();return null}
    return {inquiryType,orgName,date,time,count,person,mobileNo,phoneNo,emailValue,body};
  }
  function prefixOf(d){
    const typeLabel=d.inquiryType==='preview'?'사전답사 문의':'단체 문의';
    const countLabel=d.inquiryType==='preview'?'사전답사 인원':'단체 인원';
    return `[${typeLabel}]\n단체명: ${d.orgName}\n방문 희망일: ${d.date}\n방문 희망시간: ${d.time}\n${countLabel}: ${d.count}명`;
  }
  function renderReview(d){
    const typeLabel=d.inquiryType==='preview'?'사전답사 문의':'단체 문의';
    const countLabel=d.inquiryType==='preview'?'사전답사 인원':'단체 인원';
    document.getElementById('zrInquiryReviewCard').innerHTML=`<div class="zr-review-grid">
      <div class="zr-review-row"><span class="zr-review-label">문의 유형</span><div class="zr-review-value">${esc(typeLabel)}</div></div>
      <div class="zr-review-row"><span class="zr-review-label">${esc(countLabel)}</span><div class="zr-review-value">${d.count}명</div></div>
      <div class="zr-review-row"><span class="zr-review-label">방문 희망일</span><div class="zr-review-value">${esc(d.date)}</div></div>
      <div class="zr-review-row"><span class="zr-review-label">방문 희망시간</span><div class="zr-review-value">${esc(d.time)}</div></div>
      <div class="zr-review-row"><span class="zr-review-label">문의자명</span><div class="zr-review-value">${esc(d.person)}</div></div>
      <div class="zr-review-row"><span class="zr-review-label">단체명</span><div class="zr-review-value">${esc(d.orgName)}</div></div>
      <div class="zr-review-row"><span class="zr-review-label">휴대폰번호</span><div class="zr-review-value">${esc(d.mobileNo)}</div></div>
      <div class="zr-review-row"><span class="zr-review-label">이메일</span><div class="zr-review-value">${esc(d.emailValue||'미입력')}</div></div>
      <div class="zr-review-row full"><span class="zr-review-label">문의내용</span><div class="zr-review-value">${esc(d.body)}</div></div>
    </div>`;
    showStage(stages,'review');modal.querySelector('.modal-card')?.scrollTo?.({top:0,behavior:'smooth'});
  }
  function submitNative(){
    if(!draft)return;
    const before=readInquiries().length,originalBody=content.value,originalEmail=email.value;
    content.value=`${prefixOf(draft)}\n\n${draft.body}`;
    if(!draft.emailValue)email.value=OPTIONAL_EMAIL_SENTINEL;
    const oldToast=window.toast;window.toast=()=>{};nativeSubmit=true;
    try{submit.click()}finally{nativeSubmit=false;window.toast=oldToast}
    setTimeout(()=>{
      const after=readInquiries().length;
      clearOptionalEmailSentinel();email.value=originalEmail;content.value=originalBody;
      if(after<=before){showStage(stages,'form');showToast('문의 접수에 실패했습니다. 입력 내용을 다시 확인해주세요.');return}
      try{if(typeof window.openModal==='function')window.openModal('inquiryModal');else modal.classList.remove('hidden')}catch{modal.classList.remove('hidden')}
      showStage(stages,'complete');draft=null;
      modal.querySelector('.modal-card')?.scrollTo?.({top:0});
    },0);
  }

  visitDate.min=localToday();requestAnimationFrame(syncVisitFieldHeight);
  if(!window.__ZR_INQUIRY_VISIT_HEIGHT_SYNC_V1){window.__ZR_INQUIRY_VISIT_HEIGHT_SYNC_V1=true;window.addEventListener('resize',()=>requestAnimationFrame(syncVisitFieldHeight),{passive:true})}
  if(type.dataset.zrInquiryVisitBound!=='1'){type.dataset.zrInquiryVisitBound='1';type.addEventListener('change',updatePeopleLabel)}
  updatePeopleLabel();

  if(submit.dataset.zrInquiryReviewBound!=='1'){
    submit.dataset.zrInquiryReviewBound='1';
    submit.addEventListener('click',e=>{
      if(nativeSubmit)return;
      e.preventDefault();e.stopImmediatePropagation();
      const next=collectDraft();if(!next)return;draft=next;renderReview(draft);
    },true);
  }
  const editBtn=document.getElementById('zrInquiryReviewEdit');
  if(editBtn&&editBtn.dataset.zrBound!=='1'){editBtn.dataset.zrBound='1';editBtn.addEventListener('click',()=>{showStage(stages,'form');requestAnimationFrame(syncVisitFieldHeight)})}
  const finalBtn=document.getElementById('zrInquiryReviewSubmit');
  if(finalBtn&&finalBtn.dataset.zrBound!=='1'){finalBtn.dataset.zrBound='1';finalBtn.addEventListener('click',submitNative)}
  const homeBtn=document.getElementById('zrInquiryCompleteHome');
  if(homeBtn&&homeBtn.dataset.zrBound!=='1'){homeBtn.dataset.zrBound='1';homeBtn.addEventListener('click',()=>window.location.reload())}

  const inquiryBtn=document.getElementById('inquiryBtn');
  if(inquiryBtn&&inquiryBtn.dataset.zrInquiryVisitBound!=='1'){inquiryBtn.dataset.zrInquiryVisitBound='1';inquiryBtn.addEventListener('click',()=>setTimeout(resetVisitFields,0))}
  const changeExisting=document.getElementById('changeExisting');
  if(changeExisting&&changeExisting.dataset.zrInquiryVisitBound!=='1'){changeExisting.dataset.zrInquiryVisitBound='1';changeExisting.addEventListener('click',()=>setTimeout(setGroupInquiry,0))}
  modal.querySelectorAll('[data-close="inquiryModal"]').forEach(btn=>{
    if(btn.dataset.zrInquiryVisitBound==='1')return;btn.dataset.zrInquiryVisitBound='1';btn.addEventListener('click',()=>setTimeout(resetVisitFields,0));
  });
  return true;
}

if(!install()){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else setTimeout(install,0);
}
document.addEventListener('zr:admin-runtime-ready',install,{once:true});
})();
