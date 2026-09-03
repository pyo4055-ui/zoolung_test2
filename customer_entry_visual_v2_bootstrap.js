(()=>{
'use strict';
if(window.__ZR_CUSTOMER_ENTRY_VISUAL_V2_BOOTSTRAP)return;
window.__ZR_CUSTOMER_ENTRY_VISUAL_V2_BOOTSTRAP=true;

let readyWaitStarted=0;
function surfaceReady(){
  const root=document.documentElement;
  const hero=document.getElementById('zrCustomerEntryHeroV2');
  const start=document.getElementById('startView');
  return !!hero&&!!start&&root.classList.contains('zr-customer-entry-v2-active');
}
function signalVisualReady(force=false){
  if(window.__ZR_CUSTOMER_ENTRY_V2_READY)return;
  if(!force&&!surfaceReady()){
    if(!readyWaitStarted)readyWaitStarted=Date.now();
    if(Date.now()-readyWaitStarted<3500){requestAnimationFrame(()=>signalVisualReady(false));return}
  }
  window.__ZR_CUSTOMER_ENTRY_V2_READY=true;
  document.getElementById('zrCustomerLandingBootGuard')?.remove();
  try{document.dispatchEvent(new CustomEvent('zr:customer-entry-v2-ready'))}catch{}
}

function loadFix(){
  if(window.__ZR_CUSTOMER_ENTRY_VISUAL_V2_FIX_V1||document.getElementById('zrCustomerEntryVisualV2FixV1Script')){signalVisualReady();return}
  const p=document.createElement('script');
  p.id='zrCustomerEntryVisualV2FixV1Script';
  p.async=false;
  p.src='./customer_entry_visual_v2_fix_v1.js?v=2';
  p.onload=()=>signalVisualReady(false);
  p.onerror=()=>{p.remove();signalVisualReady(false)};
  document.body.appendChild(p);
}

function load(){
  if(window.__ZR_CUSTOMER_ENTRY_VISUAL_V2||document.getElementById('zrCustomerEntryVisualV2Script')){
    loadFix();
    return;
  }
  const s=document.createElement('script');
  s.id='zrCustomerEntryVisualV2Script';
  s.async=false;
  s.src='./customer_entry_visual_v2.js?v=1';
  s.onload=loadFix;
  s.onerror=()=>{s.remove();signalVisualReady(true);try{window.toast?.('고객 첫 화면 디자인을 불러오지 못했습니다. 새로고침해주세요.')}catch{}};
  document.body.appendChild(s);
}

/* Build the custom landing against the complete reservation DOM, then reveal
   only after that landing surface has actually mounted. */
if(window.__ZR_CUSTOMER_RUNTIME_READY)load();
else document.addEventListener('zr:customer-runtime-ready',load,{once:true});
})();
