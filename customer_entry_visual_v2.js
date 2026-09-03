(()=>{
'use strict';
if(window.__ZR_CUSTOMER_ENTRY_VISUAL_V2)return;
window.__ZR_CUSTOMER_ENTRY_VISUAL_V2=true;

const $=id=>document.getElementById(id);
const ROOT=document.documentElement;
const INTRO_URL='./admin_login_intro_html_v1.html?v=1';
let viewObserver=null;
let introReady=false;
let introFallback=0;
let lookupToken=0;

function visible(el){
  if(!el||el.classList?.contains('hidden'))return false;
  try{const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&el.getClientRects().length>0}catch{return true}
}
function text(el){return String(el?.textContent||el?.value||'').replace(/\s+/g,' ').trim()}
function sanitizePhone(value){return String(value||'').replace(/\D/g,'').slice(0,11)}
function validPhone(value){return /^010\d{8}$/.test(String(value||''))}
function toast(message){try{window.toast?.(message)}catch{}}

function injectStyle(){
  if($('zrCustomerEntryVisualV2Style'))return;
  const s=document.createElement('style');
  s.id='zrCustomerEntryVisualV2Style';
  s.textContent=`
  html.zr-customer-entry-v2{
    --zr-v2-brown:#38271e;
    --zr-v2-wine:#651012;
    --zr-v2-wine-deep:#470910;
    --zr-v2-orange:#fc5404;
    --zr-v2-orange-dark:#e24600;
    --zr-v2-paper:#fffdfa;
    --zr-v2-line:#e3d8d0;
    --zr-v2-close-bg:#ffe7e7;
    --zr-v2-close-bg-hover:#ffdada;
    --zr-v2-close-line:#f1bcbc;
    --zr-v2-close-text:#913535;
  }
  html.zr-customer-entry-v2 body>header .top-actions{display:none!important}
  html.zr-customer-entry-v2.zr-customer-entry-v2-active body>header{display:none!important}
  html.zr-customer-entry-v2.zr-customer-entry-v2-active body{background:var(--zr-v2-brown)!important}
  html.zr-customer-entry-v2.zr-customer-entry-v2-active main{max-width:none!important;width:100%!important;margin:0!important;padding:0!important}
  html.zr-customer-entry-v2 #startView{
    min-height:0!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;
    overflow:visible!important;background:transparent!important;box-shadow:none!important;
  }
  html.zr-customer-entry-v2 #startView:before,html.zr-customer-entry-v2 #startView:after{display:none!important;content:none!important}
  html.zr-customer-entry-v2 #startView>.notice,
  html.zr-customer-entry-v2 #startView>h1,
  html.zr-customer-entry-v2 #startView>h2,
  html.zr-customer-entry-v2 #startView>h3,
  html.zr-customer-entry-v2 #startView>.help{display:none!important}
  html.zr-customer-entry-v2 .zr-entry-legacy-gate-v2{display:none!important}

  #zrCustomerEntryHeroV2{
    position:relative;width:100vw;min-height:100vh;min-height:100svh;margin-left:calc(50% - 50vw);
    overflow:hidden;isolation:isolate;background:var(--zr-v2-brown);box-sizing:border-box;
  }
  #zrCustomerEntrySceneV2{position:absolute;inset:0;z-index:0;overflow:hidden;background:var(--zr-v2-brown);pointer-events:none}
  #zrCustomerEntrySceneV2 iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:var(--zr-v2-brown);pointer-events:none}
  #zrCustomerEntrySceneV2:after{
    content:"";position:absolute;inset:0;pointer-events:none;
    background:linear-gradient(90deg,rgba(34,18,10,.30) 0%,rgba(34,18,10,.12) 34%,rgba(10,14,14,.03) 64%,rgba(10,14,14,.09) 100%);
  }
  #zrCustomerEntryCardV2{
    position:absolute;z-index:2;left:clamp(72px,13.5vw,280px);top:50%;transform:translate(-18px,-50%);
    display:flex;flex-direction:column;width:min(430px,calc(100vw - 56px));min-height:610px;max-height:calc(100svh - 44px);
    margin:0;padding:48px 42px 34px;box-sizing:border-box;overflow:auto;
    border:1px solid rgba(91,52,36,.10);border-radius:30px;background:rgba(255,253,249,.972);
    box-shadow:0 28px 70px rgba(26,14,9,.28),0 5px 18px rgba(26,14,9,.10);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
    opacity:0;visibility:hidden;pointer-events:none;
    transition:opacity .58s ease,transform .68s cubic-bezier(.22,.8,.24,1),visibility 0s linear .68s;
  }
  html.zr-customer-entry-v2.zr-customer-entry-card-ready #zrCustomerEntryCardV2{
    opacity:1;visibility:visible;pointer-events:auto;transform:translate(0,-50%);transition-delay:0s;
  }
  .zr-entry-logo-v2{display:block;width:162px;height:auto;max-height:66px;object-fit:contain;margin:0 auto 15px}
  .zr-entry-title-v2{margin:0;text-align:center;color:var(--zr-v2-wine);font-size:29px;line-height:1.22;letter-spacing:-.045em;font-weight:900}
  .zr-entry-sub-v2{margin:7px 0 18px;text-align:center;color:#8a7469;font-size:12px;line-height:1.45;font-weight:700}
  #zrCustomerGroupGuideOpenV2{
    width:100%;min-height:42px;margin:0 0 19px;padding:0 14px;border:1px solid #ead4c3;border-radius:10px;
    background:#fff3e9;color:var(--zr-v2-wine-deep);font-size:13px;font-weight:900;cursor:pointer;box-shadow:none;
  }
  #zrCustomerGroupGuideOpenV2:hover{background:#ffeada;border-color:#e6c3aa}
  .zr-entry-field-v2{display:block;margin:0 0 11px}
  .zr-entry-field-v2 span{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
  .zr-entry-field-v2 input{
    display:block;width:100%;height:51px;min-height:51px;margin:0;box-sizing:border-box;border:1px solid var(--zr-v2-line)!important;
    border-radius:10px!important;outline:none!important;padding:0 14px 0 44px!important;background-color:var(--zr-v2-paper)!important;
    color:#38251d!important;font:inherit!important;font-size:14px!important;box-shadow:none!important;transition:border-color .16s ease,box-shadow .16s ease!important;
  }
  #zrCustomerEntryNameV2{
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23ad8d7a' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M4.5 20c.8-4 3.2-6 7.5-6s6.7 2 7.5 6'/%3E%3C/svg%3E")!important;
    background-repeat:no-repeat!important;background-position:15px center!important;
  }
  #zrCustomerEntryPhoneV2{
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23ad8d7a' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6.6 2.8l3 3-2.1 2.7c1.3 2.6 3.4 4.7 6 6l2.7-2.1 3 3c.6.6.7 1.5.2 2.2l-1.2 1.8c-.5.8-1.5 1.1-2.4.8C8.9 18.9 5.1 15.1 2.8 8.2c-.3-.9 0-1.9.8-2.4l1.8-1.2c.7-.5 1.6-.4 2.2.2z'/%3E%3C/svg%3E")!important;
    background-repeat:no-repeat!important;background-position:15px center!important;
  }
  .zr-entry-field-v2 input::placeholder{color:#aa968a!important}
  .zr-entry-field-v2 input:focus{border-color:#c58870!important;box-shadow:0 0 0 3px rgba(252,84,4,.09)!important}
  #zrCustomerEntryErrorV2{min-height:17px;margin:0 0 5px;color:#b64040;font-size:11px;font-weight:800;line-height:1.45}
  .zr-entry-actions-v2{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:2px}
  .zr-entry-actions-v2 button{min-height:50px;border-radius:10px;font-size:13px;font-weight:900;cursor:pointer;touch-action:manipulation}
  #zrCustomerEntryApplyV2{border:1px solid var(--zr-v2-orange);background:var(--zr-v2-orange);color:#fff;box-shadow:0 8px 16px rgba(252,84,4,.20)}
  #zrCustomerEntryApplyV2:hover{border-color:var(--zr-v2-orange-dark);background:var(--zr-v2-orange-dark)}
  #zrCustomerEntryLookupV2{border:1px solid var(--zr-v2-wine-deep);background:var(--zr-v2-wine-deep);color:#fff;box-shadow:0 8px 16px rgba(71,9,16,.16)}
  #zrCustomerEntryLookupV2:hover{background:#35060c;border-color:#35060c}
  #zrCustomerEntryInquiryV2{
    grid-column:1/-1;min-height:45px!important;border:1px solid #e3cfc1!important;background:#fff7f1!important;color:var(--zr-v2-wine-deep)!important;box-shadow:none!important;
  }
  #zrCustomerEntryInquiryV2:hover{background:#ffede1!important}
  .zr-entry-foot-v2{margin-top:auto;padding-top:24px;text-align:center;color:#a28f84;font-size:11px;line-height:1.45;font-weight:700}

  #zrCustomerEntryResultsV2{
    width:min(1100px,calc(100% - 32px));margin:0 auto;padding:26px 0 70px;box-sizing:border-box;background:#f7f3ee;
  }
  #zrCustomerEntryResultsV2:empty{display:none}
  #zrCustomerEntryResultsV2>*{margin-left:auto!important;margin-right:auto!important}
  html.zr-customer-entry-v2 #startView.zr-v2-has-results{background:#f7f3ee!important}

  #zrCustomerGroupGuideV2{
    position:fixed;inset:0;z-index:2147482600;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;
    background:rgba(36,22,16,.66);backdrop-filter:blur(2px);
  }
  #zrCustomerGroupGuideV2.hidden{display:none!important}
  #zrCustomerGroupGuideV2 .zr-guide-v2-sheet{
    width:min(620px,100%);max-height:90vh;overflow:auto;border:1px solid #eaded5;border-radius:20px;background:#fff;box-shadow:0 26px 80px rgba(35,18,10,.30);-webkit-overflow-scrolling:touch;
  }
  .zr-guide-v2-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:12px;min-height:60px;padding:10px 14px 10px 20px;box-sizing:border-box;background:var(--zr-v2-orange);color:#fff}
  .zr-guide-v2-head h2{flex:1;min-width:0;margin:0;color:#fff;font-size:19px;font-weight:900;letter-spacing:-.03em}
  .zr-guide-v2-close{min-width:54px;min-height:36px;border:1px solid var(--zr-v2-close-line);border-radius:9px;background:var(--zr-v2-close-bg);color:var(--zr-v2-close-text);font-weight:900;cursor:pointer}
  .zr-guide-v2-close:hover{background:var(--zr-v2-close-bg-hover)}
  .zr-guide-v2-body{padding:20px}
  .zr-guide-v2-lead{margin:0 0 16px;color:#594943;font-size:14px;line-height:1.7;word-break:keep-all}
  .zr-guide-v2-list{display:grid;gap:9px}
  .zr-guide-v2-item{display:grid;grid-template-columns:76px 1fr;gap:12px;padding:13px 14px;border:1px solid #eadfd7;border-radius:13px;background:#fffaf6}
  .zr-guide-v2-item b{color:var(--zr-v2-wine);font-size:13px}.zr-guide-v2-item span{color:#4d433e;font-size:13px;line-height:1.6;word-break:keep-all}
  .zr-guide-v2-note{margin-top:14px;padding:12px 13px;border:1px solid #f1d0ba;border-radius:12px;background:#fff3e9;color:#754021;font-size:12px;line-height:1.65}
  .zr-guide-v2-actions{display:grid;grid-template-columns:1fr 1.7fr;gap:9px;padding:0 20px 20px}
  .zr-guide-v2-actions button{min-height:48px;border-radius:11px;font-size:14px;font-weight:900;cursor:pointer}
  #zrCustomerGroupGuideCancelV2{border:1px solid var(--zr-v2-close-line);background:var(--zr-v2-close-bg);color:var(--zr-v2-close-text)}
  #zrCustomerGroupGuideOkV2{border:1px solid var(--zr-v2-orange);background:var(--zr-v2-orange);color:#fff}

  /* Customer popup palette: confirm/application = bright orange, dismiss/back = soft red. */
  html.zr-customer-entry-v2 .zr-guide-confirm,
  html.zr-customer-entry-v2 #zrGuideConfirm,
  html.zr-customer-entry-v2 .zrfinal31-ok,
  html.zr-customer-entry-v2 #zrCustomerReturnHomeYes{
    border-color:var(--zr-v2-orange)!important;background:var(--zr-v2-orange)!important;color:#fff!important;-webkit-text-fill-color:#fff!important;
  }
  html.zr-customer-entry-v2 .zr-guide-confirm:hover,
  html.zr-customer-entry-v2 #zrGuideConfirm:hover,
  html.zr-customer-entry-v2 .zrfinal31-ok:hover,
  html.zr-customer-entry-v2 #zrCustomerReturnHomeYes:hover{background:var(--zr-v2-orange-dark)!important;border-color:var(--zr-v2-orange-dark)!important}
  html.zr-customer-entry-v2 .zr-modal-ux-header-close,
  html.zr-customer-entry-v2 #inquiryModal .zr-modal-ux-header-close,
  html.zr-customer-entry-v2 #inquiryModal [data-close="inquiryModal"],
  html.zr-customer-entry-v2 .modal-actions [data-close],
  html.zr-customer-entry-v2 .zr-guide-back,
  html.zr-customer-entry-v2 .zrfinal31-back,
  html.zr-customer-entry-v2 .zrgm32-close,
  html.zr-customer-entry-v2 .zr-customer-info-close,
  html.zr-customer-entry-v2 .zr-cancel-select-close,
  html.zr-customer-entry-v2 #zrCustomerReturnHomeNo{
    border:1px solid var(--zr-v2-close-line)!important;background:var(--zr-v2-close-bg)!important;color:var(--zr-v2-close-text)!important;-webkit-text-fill-color:var(--zr-v2-close-text)!important;box-shadow:none!important;
  }
  html.zr-customer-entry-v2 #inquiryModal .modal-actions .btn-gray{border:1px solid var(--zr-v2-close-line)!important;background:var(--zr-v2-close-bg)!important;color:var(--zr-v2-close-text)!important;-webkit-text-fill-color:var(--zr-v2-close-text)!important}
  html.zr-customer-entry-v2 .zr-modal-ux-header-close:hover,
  html.zr-customer-entry-v2 #inquiryModal [data-close="inquiryModal"]:hover,
  html.zr-customer-entry-v2 .modal-actions [data-close]:hover,
  html.zr-customer-entry-v2 .zr-guide-back:hover,
  html.zr-customer-entry-v2 .zrfinal31-back:hover,
  html.zr-customer-entry-v2 .zrgm32-close:hover,
  html.zr-customer-entry-v2 .zr-customer-info-close:hover,
  html.zr-customer-entry-v2 .zr-cancel-select-close:hover,
  html.zr-customer-entry-v2 #zrCustomerReturnHomeNo:hover{background:var(--zr-v2-close-bg-hover)!important}

  @media(max-width:900px){
    #zrCustomerEntryCardV2{left:50%;top:50%;width:min(420px,calc(100vw - 36px));min-height:570px;max-height:calc(100svh - 30px);padding:40px 30px 28px;border-radius:26px;transform:translate(-50%,-50%)}
    html.zr-customer-entry-v2.zr-customer-entry-card-ready #zrCustomerEntryCardV2{transform:translate(-50%,-50%)}
    #zrCustomerEntrySceneV2:after{background:rgba(31,17,11,.18)}
  }
  @media(max-width:520px){
    #zrCustomerEntryHeroV2{min-height:100svh}
    #zrCustomerEntryCardV2{width:calc(100vw - 28px);min-height:0;max-height:calc(100svh - 24px);padding:31px 22px 24px;border-radius:24px}
    .zr-entry-logo-v2{width:145px;margin-bottom:11px}.zr-entry-title-v2{font-size:26px}.zr-entry-sub-v2{margin-bottom:14px}
    #zrCustomerGroupGuideOpenV2{margin-bottom:14px}.zr-entry-actions-v2{grid-template-columns:1fr}.zr-entry-actions-v2 button,#zrCustomerEntryInquiryV2{grid-column:auto;min-height:47px!important}
    .zr-entry-foot-v2{padding-top:16px}
    .zr-guide-v2-body{padding:16px}.zr-guide-v2-actions{grid-template-columns:1fr;padding:0 16px 16px}.zr-guide-v2-item{grid-template-columns:1fr;gap:4px}
  }
  @media(max-height:680px){
    #zrCustomerEntryCardV2{min-height:0;padding-top:25px;padding-bottom:22px}.zr-entry-logo-v2{width:132px;max-height:50px;margin-bottom:8px}.zr-entry-sub-v2{margin-bottom:11px}#zrCustomerGroupGuideOpenV2{margin-bottom:11px}.zr-entry-foot-v2{display:none}
  }
  @media(prefers-reduced-motion:reduce){#zrCustomerEntryCardV2{transition:none!important}}
  `;
  document.head.appendChild(s);
}

function commonAncestor(nodes,stop){
  const list=nodes.filter(Boolean);if(!list.length)return null;
  let el=list[0];
  while(el&&el!==stop){if(list.every(n=>el.contains(n)))return el;el=el.parentElement}
  return null;
}
function ensureResultsRegion(){
  const start=$('startView'),hero=$('zrCustomerEntryHeroV2');if(!start||!hero)return null;
  let region=$('zrCustomerEntryResultsV2');
  if(!region){region=document.createElement('section');region.id='zrCustomerEntryResultsV2';hero.insertAdjacentElement('afterend',region)}
  const known=['existingActions','newBookingActions','existingBookingList'].map($).filter(Boolean);
  const top=known.filter(node=>!known.some(other=>other!==node&&other.contains(node)));
  top.forEach(node=>{if(node.parentElement!==region)region.appendChild(node)});
  const has=known.some(visible);
  start.classList.toggle('zr-v2-has-results',has);
  return region;
}
function hideLegacyGate(){
  const start=$('startView'),manager=$('startManager'),contact=$('startContact'),lookup=$('lookupBooking');
  if(!start||!manager||!contact||!lookup)return false;
  ensureResultsRegion();
  const gate=commonAncestor([manager,contact,lookup],start);
  if(gate&&gate!==start)gate.classList.add('zr-entry-legacy-gate-v2');
  return true;
}

function ensureGuideModal(){
  let modal=$('zrCustomerGroupGuideV2');if(modal)return modal;
  modal=document.createElement('div');modal.id='zrCustomerGroupGuideV2';modal.className='hidden';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','zrCustomerGroupGuideTitleV2');
  modal.innerHTML=`<div class="zr-guide-v2-sheet">
    <div class="zr-guide-v2-head"><h2 id="zrCustomerGroupGuideTitleV2">단체 안내사항</h2><button type="button" class="zr-guide-v2-close" id="zrCustomerGroupGuideCloseV2">닫기</button></div>
    <div class="zr-guide-v2-body"><p class="zr-guide-v2-lead">주렁주렁 동탄점 단체 이용 전 주요 혜택과 예약 기준을 확인해주세요.</p>
      <div class="zr-guide-v2-list">
        <div class="zr-guide-v2-item"><b>단체 요금</b><span>유료인원 15명 이상부터 단체예약이 가능하며, 단체요금은 1인 15,000원(VAT 포함)입니다.</span></div>
        <div class="zr-guide-v2-item"><b>인솔 혜택</b><span>유료인원 5명당 인솔자 1명이 무료 적용되며, 기준을 초과한 인솔자는 유료로 계산됩니다.</span></div>
        <div class="zr-guide-v2-item"><b>이용 선택</b><span>단체 일정에 맞춰 식사와 놀이터 이용을 함께 선택할 수 있습니다.</span></div>
        <div class="zr-guide-v2-item"><b>관람 일정</b><span>동물원 관람 및 체험 일정은 방문 전주에 예약확인 페이지에서 안내됩니다.</span></div>
        <div class="zr-guide-v2-item"><b>예약 운영</b><span>단체예약은 평일 기준으로 운영하며, 주말 이용 문의는 1:1 문의를 통해 안내드립니다.</span></div>
      </div><div class="zr-guide-v2-note">예약 내용과 실제 운영 상황에 따라 세부 일정은 달라질 수 있습니다. 특이사항이 있다면 예약 접수 시 함께 작성해주세요.</div>
    </div>
    <div class="zr-guide-v2-actions"><button type="button" id="zrCustomerGroupGuideCancelV2">닫기</button><button type="button" id="zrCustomerGroupGuideOkV2">확인</button></div>
  </div>`;
  document.body.appendChild(modal);
  const close=()=>closeGuide();
  $('zrCustomerGroupGuideCloseV2').addEventListener('click',close);
  $('zrCustomerGroupGuideCancelV2').addEventListener('click',close);
  $('zrCustomerGroupGuideOkV2').addEventListener('click',close);
  modal.addEventListener('pointerdown',e=>{if(e.target===modal){e.preventDefault();e.stopPropagation()}},true);
  modal.addEventListener('click',e=>{if(e.target===modal){e.preventDefault();e.stopPropagation()}},true);
  return modal;
}
function openGuide(){
  const modal=ensureGuideModal();modal.classList.remove('hidden');ROOT.classList.add('zr-customer-guide-v2-open');
  try{document.body.style.overflow='hidden'}catch{}
  setTimeout(()=>$('zrCustomerGroupGuideOkV2')?.focus(),0);
}
function closeGuide(){
  const modal=$('zrCustomerGroupGuideV2');if(!modal)return;modal.classList.add('hidden');ROOT.classList.remove('zr-customer-guide-v2-open');
  try{document.body.style.removeProperty('overflow')}catch{}
  $('zrCustomerGroupGuideOpenV2')?.focus();
}

function showEntryError(message,focus){
  const box=$('zrCustomerEntryErrorV2');if(box)box.textContent=message||'';
  if(message&&focus)try{focus.focus()}catch{}
}
function syncProxyFromNative(){
  const name=$('zrCustomerEntryNameV2'),phone=$('zrCustomerEntryPhoneV2');
  const nativeName=$('startManager'),nativePhone=$('startContact');
  if(name&&nativeName&&!name.value)name.value=String(nativeName.value||'').trim();
  if(phone&&nativePhone&&!phone.value)phone.value=sanitizePhone(nativePhone.value);
}
function validateEntry(){
  const name=$('zrCustomerEntryNameV2'),phone=$('zrCustomerEntryPhoneV2');
  const n=String(name?.value||'').replace(/\s+/g,' ').trim();const p=sanitizePhone(phone?.value);
  if(name)name.value=n;if(phone)phone.value=p;
  if(!n){showEntryError('예약자 이름을 입력해주세요.',name);return null}
  if(!validPhone(p)){showEntryError('연락처는 010으로 시작하는 숫자 11자리로 입력해주세요.',phone);return null}
  showEntryError('');return {name:n,phone:p};
}
function syncNative(values){
  if(!values)return;
  const name=$('startManager'),phone=$('startContact');
  if(name){name.value=values.name;name.dispatchEvent(new Event('input',{bubbles:true}));name.dispatchEvent(new Event('change',{bubbles:true}))}
  if(phone){phone.value=values.phone;phone.dispatchEvent(new Event('input',{bubbles:true}));phone.dispatchEvent(new Event('change',{bubbles:true}))}
}
function nativeLookup(values){
  syncNative(values);const btn=$('lookupBooking');if(!btn)return false;btn.click();return true;
}
function scrollToResults(){
  ensureResultsRegion();
  const target=[$('existingBookingList'),$('existingActions'),$('newBookingActions'),$('customerView')].find(visible);
  if(target)try{target.scrollIntoView({behavior:'smooth',block:'start'})}catch{target.scrollIntoView?.()}
}
function lookupReservation(){
  const values=validateEntry();if(!values)return;
  const token=++lookupToken;
  if(!nativeLookup(values)){toast('예약 조회 화면을 준비하지 못했습니다. 새로고침 후 다시 시도해주세요.');return}
  let opened=false;
  [80,220,500,900,1400].forEach(ms=>setTimeout(()=>{
    if(token!==lookupToken)return;
    ensureResultsRegion();
    const check=$('checkExisting');
    if(!opened&&visible(check)){opened=true;try{check.click()}catch{}}
    setTimeout(scrollToResults,20);
  },ms));
}
function applyReservation(){
  const values=validateEntry();if(!values)return;
  const token=++lookupToken;
  if(!nativeLookup(values)){toast('예약 접수 화면을 준비하지 못했습니다. 새로고침 후 다시 시도해주세요.');return}
  let clicked=false;
  const proceed=()=>{
    if(token!==lookupToken)return;
    ensureResultsRegion();
    const customer=$('customerView');
    if(visible(customer)){scrollToResults();return}
    if(!clicked){
      const scope=$('newBookingActions');
      const candidates=[...(scope?.querySelectorAll?.('button,input[type="button"],input[type="submit"],a')||[])];
      const next=candidates.find(el=>visible(el)&&/(새\s*예약|신규\s*예약|추가\s*예약|예약\s*(신청|접수|하기))/.test(text(el))&&!/(조회|확인|취소|문의)/.test(text(el)));
      if(next){clicked=true;try{next.click()}catch{}}
    }
    setTimeout(scrollToResults,20);
  };
  [80,220,480,850,1300,1800].forEach(ms=>setTimeout(proceed,ms));
}
function openInquiry(){
  const n=String($('zrCustomerEntryNameV2')?.value||'').replace(/\s+/g,' ').trim();const p=sanitizePhone($('zrCustomerEntryPhoneV2')?.value);
  const nativeName=$('startManager'),nativePhone=$('startContact');
  if(n&&nativeName)nativeName.value=n;if(p&&nativePhone)nativePhone.value=p;
  const btn=$('inquiryBtn');
  if(!btn){toast('1:1 문의 화면을 준비하지 못했습니다. 새로고침 후 다시 시도해주세요.');return}
  btn.click();
  const prefill=()=>{
    const inqName=$('inqName'),inqMobile=$('inqMobile');
    if(n&&inqName&&!inqName.value)inqName.value=n;
    if(validPhone(p)&&inqMobile&&!inqMobile.value){inqMobile.value=p;inqMobile.dispatchEvent(new Event('input',{bubbles:true}))}
  };
  setTimeout(prefill,20);setTimeout(prefill,120);
}

function ensureHero(){
  const start=$('startView');if(!start)return false;
  if($('zrCustomerEntryHeroV2')){hideLegacyGate();syncProxyFromNative();return true}
  const hero=document.createElement('section');hero.id='zrCustomerEntryHeroV2';
  hero.innerHTML=`<div id="zrCustomerEntrySceneV2" aria-hidden="true"><iframe id="zrCustomerEntryIntroFrameV2" title="주렁주렁 단체예약 인트로" tabindex="-1" aria-hidden="true" allow="autoplay"></iframe></div>
    <div id="zrCustomerEntryCardV2">
      <img class="zr-entry-logo-v2" src="https://zoolungzoolung.com/wp-content/themes/zoolungzoolung/assets/images/zoolung_logo_color.svg" alt="주렁주렁">
      <h1 class="zr-entry-title-v2">단체예약</h1><p class="zr-entry-sub-v2">동탄점 단체예약 · 접수 및 조회</p>
      <button type="button" id="zrCustomerGroupGuideOpenV2">단체 안내사항</button>
      <label class="zr-entry-field-v2"><span>예약자 이름</span><input id="zrCustomerEntryNameV2" type="text" maxlength="30" autocomplete="name" placeholder="예약자 이름"></label>
      <label class="zr-entry-field-v2"><span>연락처</span><input id="zrCustomerEntryPhoneV2" type="tel" inputmode="numeric" autocomplete="tel" maxlength="11" pattern="010[0-9]{8}" placeholder="01000000000"></label>
      <div id="zrCustomerEntryErrorV2" aria-live="polite"></div>
      <div class="zr-entry-actions-v2"><button type="button" id="zrCustomerEntryApplyV2">예약 접수</button><button type="button" id="zrCustomerEntryLookupV2">예약 조회</button><button type="button" id="zrCustomerEntryInquiryV2">1:1 문의하기</button></div>
      <div class="zr-entry-foot-v2">주렁주렁 동탄점 단체예약</div>
    </div>`;
  start.insertBefore(hero,start.firstChild);
  ensureResultsRegion();hideLegacyGate();ensureGuideModal();
  $('zrCustomerGroupGuideOpenV2').addEventListener('click',openGuide);
  $('zrCustomerEntryApplyV2').addEventListener('click',applyReservation);
  $('zrCustomerEntryLookupV2').addEventListener('click',lookupReservation);
  $('zrCustomerEntryInquiryV2').addEventListener('click',openInquiry);
  const name=$('zrCustomerEntryNameV2'),phone=$('zrCustomerEntryPhoneV2');
  name.addEventListener('input',()=>showEntryError(''));
  phone.addEventListener('input',()=>{phone.value=sanitizePhone(phone.value);showEntryError('')});
  syncProxyFromNative();
  startIntro();
  return true;
}
function startIntro(){
  if(introReady)return;
  const frame=$('zrCustomerEntryIntroFrameV2');if(!frame)return;
  frame.src=INTRO_URL+'&customer=1&t='+Date.now();
  if(introFallback)clearTimeout(introFallback);
  introFallback=setTimeout(finishIntro,4500);
}
function finishIntro(){
  if(introReady)return;introReady=true;
  if(introFallback){clearTimeout(introFallback);introFallback=0}
  ROOT.classList.add('zr-customer-entry-card-ready');
}
function onIntroMessage(e){
  const frame=$('zrCustomerEntryIntroFrameV2');if(!frame||e.source!==frame.contentWindow)return;
  const d=e.data;if(!d||d.source!=='zr-admin-intro-html-v1')return;
  if(d.event==='ended'||d.event==='error')finishIntro();
}
function syncViewState(){
  ensureHero();ensureResultsRegion();
  const start=$('startView'),customer=$('customerView');
  const active=visible(start)&&!visible(customer);
  ROOT.classList.toggle('zr-customer-entry-v2-active',active);
  if(active&&introReady)ROOT.classList.add('zr-customer-entry-card-ready');
  if(!active)ROOT.classList.remove('zr-customer-entry-card-ready');
}
function watchViews(){
  if(viewObserver)return;
  const nodes=[$('startView'),$('customerView')].filter(Boolean);if(!nodes.length)return;
  viewObserver=new MutationObserver(()=>requestAnimationFrame(syncViewState));
  nodes.forEach(n=>viewObserver.observe(n,{attributes:true,attributeFilter:['class','style','hidden']}));
}
function boot(){
  ROOT.classList.add('zr-customer-entry-v2');injectStyle();ensureHero();watchViews();syncViewState();
  window.addEventListener('message',onIntroMessage);
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('zrCustomerGroupGuideV2')?.classList.contains('hidden')){e.preventDefault();closeGuide()}});
  document.addEventListener('zr:customer-runtime-ready',()=>{ensureHero();syncViewState()},{once:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
