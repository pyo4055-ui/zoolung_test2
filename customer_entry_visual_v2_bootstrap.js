(()=>{
'use strict';
if(window.__ZR_CUSTOMER_ENTRY_VISUAL_V2_BOOTSTRAP)return;
window.__ZR_CUSTOMER_ENTRY_VISUAL_V2_BOOTSTRAP=true;

function installViewportShell(){
  if(document.getElementById('zrCustomerEntryViewportShellV1'))return;
  const s=document.createElement('style');
  s.id='zrCustomerEntryViewportShellV1';
  s.textContent=`
  /* The legacy reservation page remains underneath for its logic only.
     While the new landing is active, force the visible surface onto the real
     browser viewport so old header/container widths cannot leak through. */
  html.zr-customer-entry-v2.zr-customer-entry-v2-active body header{display:none!important}
  html.zr-customer-entry-v2.zr-customer-entry-v2-active body{margin:0!important;background:#38271e!important}

  @media(min-width:901px){
    html.zr-customer-entry-v2.zr-customer-entry-v2-active #startView{
      position:fixed!important;inset:0!important;z-index:2147480800!important;
      width:100vw!important;max-width:none!important;height:100vh!important;height:100svh!important;
      min-height:100vh!important;min-height:100svh!important;margin:0!important;padding:0!important;
      overflow:hidden!important;background:#38271e!important;border:0!important;border-radius:0!important;box-shadow:none!important;
    }
    html.zr-customer-entry-v2.zr-customer-entry-v2-active #zrCustomerEntryHeroV2{
      position:absolute!important;inset:0!important;width:100%!important;max-width:none!important;
      height:100%!important;min-height:100%!important;margin:0!important;
    }
    html.zr-customer-entry-v2.zr-customer-entry-v2-active #startView.zr-v2-has-results #zrCustomerEntryResultsV2{
      position:absolute!important;z-index:2147480900!important;
    }
  }

  @media(max-width:900px){
    html.zr-customer-entry-v2.zr-customer-entry-v2-active #startView:not(.zr-v2-has-results){
      position:fixed!important;inset:0!important;z-index:2147480800!important;
      width:100vw!important;max-width:none!important;height:100vh!important;height:100svh!important;
      min-height:100vh!important;min-height:100svh!important;margin:0!important;padding:0!important;
      overflow:hidden!important;background:#38271e!important;border:0!important;border-radius:0!important;box-shadow:none!important;
    }
    html.zr-customer-entry-v2.zr-customer-entry-v2-active #startView:not(.zr-v2-has-results) #zrCustomerEntryHeroV2{
      position:absolute!important;inset:0!important;width:100%!important;max-width:none!important;
      height:100%!important;min-height:100%!important;margin:0!important;
    }
    html.zr-customer-entry-v2.zr-customer-entry-v2-active #startView.zr-v2-has-results{
      position:relative!important;inset:auto!important;width:100%!important;max-width:none!important;height:auto!important;min-height:100svh!important;
      margin:0!important;padding:0!important;overflow:visible!important;
    }
    html.zr-customer-entry-v2.zr-customer-entry-v2-active #startView.zr-v2-has-results #zrCustomerEntryHeroV2{
      position:relative!important;inset:auto!important;width:100vw!important;max-width:none!important;
      height:100vh!important;height:100svh!important;min-height:100vh!important;min-height:100svh!important;margin:0!important;
    }
  }
  `;
  document.head.appendChild(s);
}

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
    if(Date.now()-readyWaitStarted<5000){requestAnimationFrame(()=>signalVisualReady(false));return}
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
  p.src='./customer_entry_visual_v2_fix_v1.js?v=3';
  p.onload=()=>signalVisualReady(false);
  p.onerror=()=>{p.remove();signalVisualReady(false)};
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
