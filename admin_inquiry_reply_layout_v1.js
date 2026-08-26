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
    #tab-inquiry-reply-v1 .zr-ir-field.status{position:relative!important;top:4px!important}
    #zrInquiryReplyInnerTabs{display:flex;gap:8px;margin:14px 0 0}
    #zrInquiryReplyInnerTabs button{min-width:96px}
    #tab-inquiry-reply-v1>#tab-inquiry-reply-examples{margin:0!important}
    #tab-inquiry-reply-v1>#tab-inquiry-reply-examples>.zr-ir-panel{margin-top:12px!important}
    @media(max-width:720px){
      #zrInquiryReplyInnerTabs{display:grid;grid-template-columns:1fr 1fr}
      #zrInquiryReplyInnerTabs button{width:100%}
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
