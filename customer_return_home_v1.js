(()=>{
'use strict';
if(window.__ZR_CUSTOMER_RETURN_HOME_V1)return;
window.__ZR_CUSTOMER_RETURN_HOME_V1=true;

const $=id=>document.getElementById(id);

function ensureModalUxConsistency(){
  if(document.getElementById('zrModalUxConsistencyV1')||window.__ZR_MODAL_UX_CONSISTENCY_V1)return;
  const s=document.createElement('script');
  s.id='zrModalUxConsistencyV1';
  s.async=false;
  s.src='./modal_ux_consistency_v1.js?v=1';
  document.body.appendChild(s);
}
function customerVisible(){
  const v=$('customerView');
  return !!v&&!v.classList.contains('hidden')&&getComputedStyle(v).display!=='none';
}
function normalizedText(el){
  return String(el?.textContent||el?.value||'').replace(/\s+/g,'').trim();
}
function submitButton(){
  const root=$('customerView');if(!root)return null;
  return [...root.querySelectorAll('button,input[type="submit"],input[type="button"]')]
    .find(el=>normalizedText(el)==='예약신청하기')||null;
}
function ensureStyle(){
  if($('zrCustomerReturnHomeStyle'))return;
  const s=document.createElement('style');
  s.id='zrCustomerReturnHomeStyle';
  s.textContent=`
    #zrCustomerReturnHomeWrap{display:flex;justify-content:center;margin:10px 0 0}
    #zrCustomerReturnHomeBtn{width:100%;min-height:44px;border:1px solid #cfd8d2;border-radius:12px;background:#fff;color:#4d5b53;font-size:13px;font-weight:900;cursor:pointer;box-shadow:none}
    #zrCustomerReturnHomeBtn:hover{background:#f4f7f5}
    #zrCustomerReturnHomeModal{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;background:rgba(16,25,20,.58)}
    #zrCustomerReturnHomeModal.hidden{display:none!important}
    #zrCustomerReturnHomeModal .zr-return-sheet{width:min(430px,100%);background:#fff;border-radius:18px;padding:23px 20px 18px;box-sizing:border-box;box-shadow:0 24px 80px rgba(0,0,0,.28);text-align:center}
    #zrCustomerReturnHomeModal h3{margin:0 0 10px;font-size:18px;color:#1f2a23}
    #zrCustomerReturnHomeModal p{margin:0;color:#58655d;font-size:13px;line-height:1.65;word-break:keep-all}
    #zrCustomerReturnHomeModal .zr-return-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:20px}
    #zrCustomerReturnHomeModal button{min-height:43px;border-radius:11px;font-size:13px;font-weight:900;cursor:pointer}
    #zrCustomerReturnHomeNo{border:1px solid #d7ded9;background:#fff;color:#4f5b54}
    #zrCustomerReturnHomeYes{border:1px solid #315f49;background:#315f49;color:#fff}
  `;
  document.head.appendChild(s);
}
function ensureModal(){
  let modal=$('zrCustomerReturnHomeModal');if(modal)return modal;
  modal=document.createElement('div');
  modal.id='zrCustomerReturnHomeModal';
  modal.className='hidden';
  modal.setAttribute('role','dialog');
  modal.setAttribute('aria-modal','true');
  modal.setAttribute('aria-labelledby','zrCustomerReturnHomeTitle');
  modal.innerHTML=`<div class="zr-return-sheet"><h3 id="zrCustomerReturnHomeTitle">처음 화면으로 돌아가기</h3><p>입력한 예약정보가 초기화됩니다.<br>정말 처음 화면으로 돌아가시겠습니까?</p><div class="zr-return-actions"><button type="button" id="zrCustomerReturnHomeNo">아니오</button><button type="button" id="zrCustomerReturnHomeYes">예</button></div></div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click',e=>{e.stopPropagation()});
  modal.addEventListener('pointerdown',e=>{e.stopPropagation()});
  $('zrCustomerReturnHomeNo').addEventListener('click',()=>closeModal());
  $('zrCustomerReturnHomeYes').addEventListener('click',()=>{
    const yes=$('zrCustomerReturnHomeYes');const no=$('zrCustomerReturnHomeNo');
    if(yes)yes.disabled=true;if(no)no.disabled=true;
    window.location.reload();
  });
  return modal;
}
function openModal(){
  ensureStyle();
  const modal=ensureModal();
  modal.classList.remove('hidden');
  requestAnimationFrame(()=>$('zrCustomerReturnHomeNo')?.focus());
}
function closeModal(){
  const modal=$('zrCustomerReturnHomeModal');if(!modal)return;
  modal.classList.add('hidden');
  $('zrCustomerReturnHomeBtn')?.focus();
}
function ensureButton(){
  if(!customerVisible())return false;
  const submit=submitButton();if(!submit)return false;
  let wrap=$('zrCustomerReturnHomeWrap');
  if(!wrap){
    wrap=document.createElement('div');
    wrap.id='zrCustomerReturnHomeWrap';
    wrap.innerHTML='<button type="button" id="zrCustomerReturnHomeBtn">처음 화면으로 돌아가기</button>';
    wrap.querySelector('#zrCustomerReturnHomeBtn')?.addEventListener('click',openModal);
  }
  const anchor=submit.closest('.actions,.button-row,.btn-row')||submit.parentElement||submit;
  if(anchor.nextElementSibling!==wrap)anchor.insertAdjacentElement('afterend',wrap);
  return true;
}
function ensure(){ensureStyle();ensureModal();ensureButton()}
function boot(){
  ensureModalUxConsistency();
  ensure();
  const timer=setInterval(ensure,350);setTimeout(()=>clearInterval(timer),15000);
  document.addEventListener('click',()=>setTimeout(ensureButton,0),true);
  document.addEventListener('change',e=>{if(e.target?.closest?.('#customerView'))setTimeout(ensureButton,0)},true);
  window.addEventListener('keydown',e=>{
    const modal=$('zrCustomerReturnHomeModal');
    if(e.key!=='Escape'||!modal||modal.classList.contains('hidden'))return;
    e.preventDefault();e.stopImmediatePropagation();
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
