(()=>{
'use strict';
if(window.__ZR_CUSTOMER_ENTRY_RELOAD_STABILITY_V1)return;
window.__ZR_CUSTOMER_ENTRY_RELOAD_STABILITY_V1=true;

const ROOT=document.documentElement;
const $=id=>document.getElementById(id);
let positionFrame=0;
let positionTimer=0;

function installStyle(){
  if($('zrCustomerEntryReloadStabilityV1Style'))return;
  const s=document.createElement('style');
  s.id='zrCustomerEntryReloadStabilityV1Style';
  s.textContent=`
  /* Customer entry never shows the old shared-runtime header. */
  html.zr-customer-entry-v2 body>header,
  html.zr-customer-entry-v2 body>header:first-of-type{display:none!important}

  /* Do not let a restored horizontal page position shift the viewport landing.
     Some browsers restore scrollLeft when a tab/window is reopened. */
  html.zr-customer-entry-v2.zr-customer-entry-v2-active,
  html.zr-customer-entry-v2.zr-customer-entry-v2-active body{
    width:100%!important;max-width:100%!important;margin-left:0!important;margin-right:0!important;
    overflow-x:hidden!important;
  }

  /* The legacy runtime may wrap #startView in a width-limited/transformed shell.
     Mounting #startView directly under body makes fixed positioning viewport-based. */
  html.zr-customer-entry-v2.zr-customer-entry-v2-active body>#startView{
    position:fixed!important;inset:0!important;left:0!important;right:0!important;z-index:2147480800!important;
    width:100vw!important;max-width:none!important;height:100vh!important;height:100svh!important;
    min-height:100vh!important;min-height:100svh!important;margin:0!important;padding:0!important;
    overflow:hidden!important;background:#38271e!important;border:0!important;border-radius:0!important;box-shadow:none!important;
    transform:none!important;filter:none!important;perspective:none!important;contain:none!important;
  }
  html.zr-customer-entry-v2.zr-customer-entry-v2-active body>#startView #zrCustomerEntryHeroV2{
    position:absolute!important;inset:0!important;left:0!important;right:0!important;width:100vw!important;max-width:none!important;
    height:100vh!important;height:100svh!important;min-height:100vh!important;min-height:100svh!important;
    margin:0!important;transform:none!important;
  }
  html.zr-customer-entry-v2.zr-customer-entry-v2-active body>#startView #zrCustomerEntrySceneV2,
  html.zr-customer-entry-v2.zr-customer-entry-v2-active body>#startView #zrCustomerEntrySceneV2 iframe{
    position:absolute!important;inset:0!important;left:0!important;right:0!important;width:100%!important;height:100%!important;max-width:none!important;
  }

  @media(min-width:901px){
    html.zr-customer-entry-v2.zr-customer-entry-v2-active body>#startView.zr-v2-has-results{
      overflow:hidden!important;
    }
  }
  @media(max-width:900px){
    html.zr-customer-entry-v2.zr-customer-entry-v2-active body>#startView.zr-v2-has-results{
      position:relative!important;inset:auto!important;width:100%!important;height:auto!important;min-height:100svh!important;
      overflow:visible!important;
    }
    html.zr-customer-entry-v2.zr-customer-entry-v2-active body>#startView.zr-v2-has-results #zrCustomerEntryHeroV2{
      position:relative!important;inset:auto!important;width:100vw!important;height:100vh!important;height:100svh!important;
    }
  }
  `;
  document.head.appendChild(s);
}

function mountStartViewToBody(){
  const start=$('startView');
  if(!start)return false;
  if(start.parentElement!==document.body)document.body.appendChild(start);
  return start.parentElement===document.body;
}

function resetLandingPosition(){
  if(!ROOT.classList.contains('zr-customer-entry-v2-active'))return;
  const scrolling=document.scrollingElement||document.documentElement;
  try{scrolling.scrollLeft=0}catch{}
  try{document.documentElement.scrollLeft=0}catch{}
  try{document.body.scrollLeft=0}catch{}
  try{$('startView').scrollLeft=0}catch{}
  try{window.scrollTo({left:0,top:0,behavior:'auto'})}catch{try{window.scrollTo(0,0)}catch{}}
}

function resetLandingPositionBurst(){
  resetLandingPosition();
  if(positionFrame)cancelAnimationFrame(positionFrame);
  clearTimeout(positionTimer);
  positionFrame=requestAnimationFrame(()=>{
    resetLandingPosition();
    positionFrame=requestAnimationFrame(resetLandingPosition);
  });
  positionTimer=setTimeout(resetLandingPosition,90);
}

function stabilize(){
  installStyle();
  const mounted=mountStartViewToBody();
  if(mounted){
    ROOT.classList.add('zr-customer-entry-shell-stable');
    if(ROOT.classList.contains('zr-customer-entry-v2-active'))resetLandingPositionBurst();
    try{document.dispatchEvent(new CustomEvent('zr:customer-entry-shell-stable'))}catch{}
  }
  return mounted;
}

stabilize();
requestAnimationFrame(stabilize);
setTimeout(stabilize,120);

/* Browser tab/window restore (including bfcache/session restore) can restore an
   old horizontal scroll offset after the DOM itself has already been restored. */
window.addEventListener('pageshow',()=>{stabilize();resetLandingPositionBurst()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){stabilize();resetLandingPositionBurst()}});
const rootObserver=new MutationObserver(()=>{
  if(ROOT.classList.contains('zr-customer-entry-v2-active'))resetLandingPositionBurst();
});
rootObserver.observe(ROOT,{attributes:true,attributeFilter:['class']});
})();
