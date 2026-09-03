(()=>{
'use strict';
if(window.__ZR_CUSTOMER_ENTRY_VISUAL_V2_BOOTSTRAP)return;
window.__ZR_CUSTOMER_ENTRY_VISUAL_V2_BOOTSTRAP=true;

function load(){
  if(window.__ZR_CUSTOMER_ENTRY_VISUAL_V2||document.getElementById('zrCustomerEntryVisualV2Script'))return;
  const s=document.createElement('script');
  s.id='zrCustomerEntryVisualV2Script';
  s.async=false;
  s.src='./customer_entry_visual_v2.js?v=1';
  s.onerror=()=>{s.remove();try{window.toast?.('고객 첫 화면 디자인을 불러오지 못했습니다. 새로고침해주세요.')}catch{}};
  document.body.appendChild(s);
}

if(window.__ZR_CUSTOMER_RUNTIME_READY)load();
else document.addEventListener('zr:customer-runtime-ready',load,{once:true});
})();
