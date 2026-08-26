(()=>{
'use strict';
if(window.__ZR_ADMIN_INQUIRY_REPLY_LAYOUT_V1)return;
window.__ZR_ADMIN_INQUIRY_REPLY_LAYOUT_V1=true;

const $=id=>document.getElementById(id);
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
    @media(max-width:720px){
      #zrInquiryReplyInnerTabs{display:grid;grid-template-columns:1fr 1fr;width:100%;box-sizing:border-box}
      #zrInquiryReplyInnerTabs button{width:100%;min-width:0}
    }
  `;
  document.head.appendChild(style);
}

function directPanel(main){
  return [...main.children].find(el=>el.classList?.contains('zr-ir-panel'))||null;
}
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
  }
}

function install(){
  if(installed)return true;
  const main=$('tab-inquiry-reply-v1'),examples=$('tab-inquiry-reply-examples');
  if(!main||!examples)return false;
  installStyle();

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

  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('#adminView .admin-tabs button');
    if(!btn)return;
    if((btn.textContent||'').trim()==='1:1 문의')setTimeout(()=>setSubtab('inquiry'),0);
  },true);

  setSubtab('inquiry');
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
