(()=>{
'use strict';
if(window.__ZR_ADMIN_INQUIRY_REPLY_LAYOUT_V1)return;
window.__ZR_ADMIN_INQUIRY_REPLY_LAYOUT_V1=true;

const INQUIRY_KEY='zr_inquiries';
const PREVIEW_LIMIT=20;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let installed=false;

function installStyle(){
  if($('zrInquiryReplyLayoutStyleV1'))return;
  const style=document.createElement('style');
  style.id='zrInquiryReplyLayoutStyleV1';
  style.textContent=`
    @media(min-width:721px){#tab-inquiry-reply-v1 .zr-ir-field.status{position:relative!important;top:4px!important}}
    #zrInquiryReplyInnerTabs{display:inline-flex;align-items:center;gap:4px;margin:14px 0 8px;padding:4px;background:#eef3ef;border:1px solid #d7e1da;border-radius:12px;box-shadow:inset 0 1px 2px rgba(30,50,36,.04)}
    #zrInquiryReplyInnerTabs button{position:relative;min-width:108px;height:38px;padding:0 16px!important;border:1px solid transparent!important;border-radius:9px!important;background:transparent!important;color:#66736b!important;box-shadow:none!important;font-size:13px!important;font-weight:800!important;line-height:1!important}
    #zrInquiryReplyInnerTabs button.btn-primary{background:#fff!important;color:#2f6b4f!important;border-color:#bad1c1!important;box-shadow:0 2px 6px rgba(30,50,36,.08)!important}
    #zrInquiryReplyInnerTabs button.btn-primary::after{content:'';position:absolute;left:18px;right:18px;bottom:4px;height:2px;border-radius:999px;background:#2f6b4f}
    #zrInquiryReplyInnerTabs button:hover{background:#f8faf8!important;color:#2f6b4f!important}
    #tab-inquiry-reply-v1>#tab-inquiry-reply-examples{margin:0!important}
    #tab-inquiry-reply-v1>#tab-inquiry-reply-examples>.zr-ir-panel{margin-top:12px!important}
    #tab-inquiry-reply-v1 .zr-ir-line2{display:flex!important;align-items:center;gap:7px;min-width:0}
    #tab-inquiry-reply-v1 .zr-ir-content-preview{display:block;min-width:0;max-width:380px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#69766e}
    #tab-inquiry-reply-v1 .zr-ir-actions{gap:8px}
    #tab-inquiry-reply-v1 .zr-ir-actions .zr-ir-content-btn{min-width:78px}
    #zrInquiryContentModal .modal-card{width:min(680px,100%);max-height:min(82vh,720px);display:flex;flex-direction:column}
    #zrInquiryContentModal h2{margin:0 0 14px}
    #zrInquiryContentModal .zr-ir-content-full{min-height:120px;max-height:56vh;overflow:auto;border:1px solid var(--line,#dfe5df);border-radius:13px;background:#fafcf9;padding:16px;font-size:14px;line-height:1.7;color:var(--text,#1f2a23);white-space:pre-wrap;word-break:break-word}
    #zrInquiryContentModal .modal-actions{display:flex;justify-content:flex-end;margin-top:16px}
    #zrInquiryContentModal .modal-actions button{min-width:84px}
    @media(max-width:720px){
      #zrInquiryReplyInnerTabs{display:grid;grid-template-columns:1fr 1fr;width:100%;box-sizing:border-box}
      #zrInquiryReplyInnerTabs button{width:100%;min-width:0}
      #tab-inquiry-reply-v1 .zr-ir-content-preview{max-width:190px}
      #tab-inquiry-reply-v1 .zr-ir-actions{gap:6px}
      #zrInquiryContentModal .zr-ir-content-full{max-height:58vh;padding:14px}
    }
  `;
  document.head.appendChild(style);
}

function directPanel(main){
  return [...main.children].find(el=>el.classList?.contains('zr-ir-panel'))||null;
}
function previewText(value){
  const oneLine=String(value||'').replace(/\s+/g,' ').trim();
  const chars=Array.from(oneLine);
  return chars.length>PREVIEW_LIMIT?`${chars.slice(0,PREVIEW_LIMIT).join('')}…`:oneLine;
}
function ensureContentModal(){
  if($('zrInquiryContentModal'))return;
  const modal=document.createElement('div');
  modal.id='zrInquiryContentModal';
  modal.className='modal hidden';
  modal.innerHTML=`<div class="modal-card"><h2>문의내용</h2><div class="zr-ir-content-full" id="zrInquiryContentFull"></div><div class="modal-actions"><button type="button" class="btn-gray" id="zrInquiryContentClose">닫기</button></div></div>`;
  document.body.appendChild(modal);
  $('zrInquiryContentClose').onclick=closeContentModal;
}
function openContentModal(content){
  ensureContentModal();
  const body=$('zrInquiryContentFull');if(body)body.textContent=String(content||'문의내용 없음');
  $('zrInquiryContentModal')?.classList.remove('hidden');
  $('zrInquiryContentModal')?.querySelector('.modal-card')?.scrollTo?.({top:0});
}
function closeContentModal(){$('zrInquiryContentModal')?.classList.add('hidden')}
function decorateInquiryCards(){
  const main=$('tab-inquiry-reply-v1');if(!main)return;
  main.querySelectorAll('.zr-ir-card').forEach(card=>{
    const line=card.querySelector('.zr-ir-line2');if(!line||line.dataset.zrContentDecorated==='1')return;
    const raw=(line.getAttribute('title')||line.textContent.replace(/^\s*문의내용\s*/,'')).trim()||'문의내용 없음';
    line.dataset.zrContentDecorated='1';
    line.dataset.zrFullContent=raw;
    line.removeAttribute('title');
    line.innerHTML=`<b>문의내용</b><span class="zr-ir-content-preview">${esc(previewText(raw))}</span>`;

    let actions=card.querySelector('.zr-ir-actions');
    if(!actions){actions=document.createElement('div');actions.className='zr-ir-actions';card.appendChild(actions)}
    if(!actions.querySelector('[data-ir-content]')){
      const btn=document.createElement('button');
      btn.type='button';btn.className='btn-gray zr-ir-content-btn';btn.setAttribute('data-ir-content','');btn.textContent='문의내용';
      const reply=actions.querySelector('[data-ir-reply]');
      if(reply)actions.insertBefore(btn,reply);else actions.appendChild(btn);
    }
  });
}
function scheduleDecorate(){setTimeout(decorateInquiryCards,0)}
function setSubtab(mode){
  const main=$('tab-inquiry-reply-v1'),examples=$('tab-inquiry-reply-examples');
  if(!main||!examples)return;
  const inquiryPanel=directPanel(main),inquiryBtn=$('zrInquiryReplyInquirySubtab'),exampleBtn=$('zrInquiryReplyExampleSubtab');
  const examplesOpen=mode==='examples';
  inquiryPanel?.classList.toggle('hidden',examplesOpen);
  examples.classList.toggle('hidden',!examplesOpen);
  if(inquiryBtn)inquiryBtn.className=examplesOpen?'btn-gray':'btn-primary';
  if(exampleBtn)exampleBtn.className=examplesOpen?'btn-primary':'btn-gray';
  if(examplesOpen){
    try{document.getElementById('zrInquiryTemplateList')?.scrollIntoView?.({block:'nearest'})}catch{}
  }else scheduleDecorate();
}

function install(){
  if(installed)return true;
  const main=$('tab-inquiry-reply-v1'),examples=$('tab-inquiry-reply-examples');
  if(!main||!examples)return false;
  installStyle();
  ensureContentModal();

  $('zrInquiryReplyExampleTabBtn')?.remove();
  if(examples.parentElement!==main)main.appendChild(examples);

  let nav=$('zrInquiryReplyInnerTabs');
  if(!nav){
    nav=document.createElement('div');
    nav.id='zrInquiryReplyInnerTabs';
    nav.setAttribute('aria-label','1:1 문의 내부 메뉴');
    nav.innerHTML='<button type="button" class="btn-primary" id="zrInquiryReplyInquirySubtab">문의현황</button><button type="button" class="btn-gray" id="zrInquiryReplyExampleSubtab">답변예시</button>';
    main.insertBefore(nav,main.firstChild);
  }
  $('zrInquiryReplyInquirySubtab').onclick=()=>setSubtab('inquiry');
  $('zrInquiryReplyExampleSubtab').onclick=()=>setSubtab('examples');

  if(main.dataset.zrInquiryContentBound!=='1'){
    main.dataset.zrInquiryContentBound='1';
    main.addEventListener('click',e=>{
      const contentBtn=e.target?.closest?.('[data-ir-content]');
      if(contentBtn){
        e.preventDefault();e.stopPropagation();
        const card=contentBtn.closest('.zr-ir-card'),line=card?.querySelector('.zr-ir-line2');
        openContentModal(line?.dataset.zrFullContent||'문의내용 없음');
        return;
      }
      if(e.target?.closest?.('#zrInquiryApply'))scheduleDecorate();
    },true);
  }

  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('#adminView .admin-tabs button');
    if(!btn)return;
    if((btn.textContent||'').trim()==='1:1 문의'){setTimeout(()=>setSubtab('inquiry'),0);scheduleDecorate()}
  },true);
  document.addEventListener('zr:inquiry-replies-changed',scheduleDecorate);
  window.addEventListener('storage',e=>{if(e.key===INQUIRY_KEY)scheduleDecorate()});

  setSubtab('inquiry');
  scheduleDecorate();
  installed=true;
  return true;
}
function boot(){
  if(install())return;
  let tries=0;
  const timer=setInterval(()=>{if(install()||++tries>80)clearInterval(timer)},120);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
document.addEventListener('zr:admin-runtime-ready',boot,{once:true});
})();
