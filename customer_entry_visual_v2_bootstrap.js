(()=>{
'use strict';
if(window.__ZR_CUSTOMER_ENTRY_VISUAL_V2_BOOTSTRAP)return;
window.__ZR_CUSTOMER_ENTRY_VISUAL_V2_BOOTSTRAP=true;

function signalVisualReady(){
  if(window.__ZR_CUSTOMER_ENTRY_V2_READY)return;
  window.__ZR_CUSTOMER_ENTRY_V2_READY=true;
  try{document.dispatchEvent(new CustomEvent('zr:customer-entry-v2-ready'))}catch{}
}

function loadFix(){
  if(window.__ZR_CUSTOMER_ENTRY_VISUAL_V2_FIX_V1||document.getElementById('zrCustomerEntryVisualV2FixV1Script')){signalVisualReady();return}
  const p=document.createElement('script');
  p.id='zrCustomerEntryVisualV2FixV1Script';
  p.async=false;
  p.src='./customer_entry_visual_v2_fix_v1.js?v=2';
  p.onload=signalVisualReady;
  p.onerror=()=>{p.remove();signalVisualReady()};
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
  s.onerror=()=>{s.remove();signalVisualReady();try{window.toast?.('고객 첫 화면 디자인을 불러오지 못했습니다. 새로고침해주세요.')}catch{}};
  document.body.appendChild(s);
}

/* Wait until the existing customer runtime is ready so the approved landing
   layout is built against the complete reservation DOM. The pre-boot guard is
   released only after this visual layer signals that it is ready. */
if(window.__ZR_CUSTOMER_RUNTIME_READY)load();
else document.addEventListener('zr:customer-runtime-ready',load,{once:true});
})();
