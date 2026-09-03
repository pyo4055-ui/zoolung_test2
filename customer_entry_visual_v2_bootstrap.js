(()=>{
'use strict';
if(window.__ZR_CUSTOMER_ENTRY_VISUAL_V2_BOOTSTRAP)return;
window.__ZR_CUSTOMER_ENTRY_VISUAL_V2_BOOTSTRAP=true;

function installViewportShell(){
  if(document.getElementById('zrCustomerEntryViewportShellV1'))return;
  const s=document.createElement('style');
  s.id='zrCustomerEntryViewportShellV1';
  s.textContent=`
  html.zr-customer-entry-v2 body>header{display:none!important}
  html.zr-customer-entry-v2.zr-customer-entry-v2-active body{margin:0!important;background:#38271e!important}
  `;
  document.head.appendChild(s);
}

let readyWaitStarted=0;
function surfaceReady(){
  const root=document.documentElement;
  const hero=document.getElementById('zrCustomerEntryHeroV2');
  const overlay=document.getElementById('zrCustomerEntryOverlayV3');
  return !!hero&&!!overlay&&hero.parentElement===overlay&&overlay.parentElement===document.body&&
    root.classList.contains('zr-customer-entry-v2-active')&&
    root.classList.contains('zr-customer-entry-shell-stable');
}
function signalVisualReady(force=false){
  if(window.__ZR_CUSTOMER_ENTRY_V2_READY)return;
  if(!force&&!surfaceReady()){
    if(!readyWaitStarted)readyWaitStarted=Date.now();
    if(Date.now()-readyWaitStarted<6000){requestAnimationFrame(()=>signalVisualReady(false));return}
  }
  window.__ZR_CUSTOMER_ENTRY_V2_READY=true;
  document.getElementById('zrCustomerLandingBootGuard')?.remove();
  try{document.dispatchEvent(new CustomEvent('zr:customer-entry-v2-ready'))}catch{}
}

function loadActionBridge(){
  if(window.__ZR_CUSTOMER_ENTRY_ACTION_BRIDGE_V1||document.getElementById('zrCustomerEntryActionBridgeV1Script')){signalVisualReady();return}
  const a=document.createElement('script');
  a.id='zrCustomerEntryActionBridgeV1Script';
  a.async=false;
  a.src='./customer_entry_action_bridge_v1.js?v=1';
  a.onload=()=>signalVisualReady(false);
  a.onerror=()=>{a.remove();signalVisualReady(false)};
  document.body.appendChild(a);
}

function loadStability(){
  if(window.__ZR_CUSTOMER_ENTRY_RELOAD_STABILITY_V1||document.getElementById('zrCustomerEntryReloadStabilityV1Script')){loadActionBridge();return}
  const q=document.createElement('script');
  q.id='zrCustomerEntryReloadStabilityV1Script';
  q.async=false;
  q.src='./customer_entry_reload_stability_v1.js?v=2';
  q.onload=loadActionBridge;
  q.onerror=()=>{q.remove();loadActionBridge()};
  document.body.appendChild(q);
}

function loadFix(){
  if(window.__ZR_CUSTOMER_ENTRY_VISUAL_V2_FIX_V1||document.getElementById('zrCustomerEntryVisualV2FixV1Script')){loadStability();return}
  const p=document.createElement('script');
  p.id='zrCustomerEntryVisualV2FixV1Script';
  p.async=false;
  p.src='./customer_entry_visual_v2_fix_v1.js?v=3';
  p.onload=loadStability;
  p.onerror=()=>{p.remove();loadStability()};
  document.body.appendChild(p);
}

function load(){
  installViewportShell();
  if(window.__ZR_CUSTOMER_ENTRY_VISUAL_V2||document.getElementById('zrCustomerEntryVisualV2Script')){
    loadFix();
    return;
  }
  const s=document.createElement('script');
  s.id='zrCustomerEntryVisualV2Script';
  s.async=false;
  s.src='./customer_entry_visual_v2.js?v=2';
  s.onload=loadFix;
  s.onerror=()=>{s.remove();signalVisualReady(true);try{window.toast?.('고객 첫 화면 디자인을 불러오지 못했습니다. 새로고침해주세요.')}catch{}};
  document.body.appendChild(s);
}

installViewportShell();
if(window.__ZR_CUSTOMER_RUNTIME_READY)load();
else document.addEventListener('zr:customer-runtime-ready',load,{once:true});
})();
