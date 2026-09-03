(()=>{
'use strict';
if(window.__ZR_CUSTOMER_ENTRY_RELOAD_STABILITY_V1)return;
window.__ZR_CUSTOMER_ENTRY_RELOAD_STABILITY_V1=true;

const ROOT=document.documentElement;
const $=id=>document.getElementById(id);

function installStyle(){
  if($('zrCustomerEntryReloadStabilityV1Style'))return;
  const s=document.createElement('style');
  s.id='zrCustomerEntryReloadStabilityV1Style';
  s.textContent=`
  /* V3: the customer landing is a dedicated viewport overlay. It no longer
     depends on the legacy #startView/main/header layout for its dimensions. */
  #zrCustomerEntryOverlayV3{
    position:fixed!important;inset:0!important;left:0!important;top:0!important;
    z-index:2147482000!important;width:100vw!important;max-width:none!important;
    height:100vh!important;height:100svh!important;min-height:100vh!important;min-height:100svh!important;
    margin:0!important;padding:0!important;overflow:hidden!important;background:#38271e!important;
    border:0!important;border-radius:0!important;box-shadow:none!important;transform:none!important;
    display:none!important;isolation:isolate!important;
  }
  html.zr-customer-entry-v2.zr-customer-entry-v2-active #zrCustomerEntryOverlayV3{display:block!important}
  html.zr-customer-entry-v2.zr-customer-entry-v2-active body>header{display:none!important}
  html.zr-customer-entry-v2.zr-customer-entry-v2-active,
  html.zr-customer-entry-v2.zr-customer-entry-v2-active body{
    margin:0!important;overflow:hidden!important;background:#38271e!important;
  }
  #zrCustomerEntryOverlayV3>#zrCustomerEntryHeroV2{
    position:absolute!important;inset:0!important;left:0!important;top:0!important;
    width:100%!important;max-width:none!important;height:100%!important;min-height:100%!important;
    margin:0!important;padding:0!important;overflow:hidden!important;transform:none!important;
  }
  #zrCustomerEntryOverlayV3 #zrCustomerEntrySceneV2,
  #zrCustomerEntryOverlayV3 #zrCustomerEntrySceneV2 iframe{
    position:absolute!important;inset:0!important;left:0!important;top:0!important;
    width:100%!important;max-width:none!important;height:100%!important;margin:0!important;
  }

  /* Keep the legacy first-screen shell underneath for business logic only. */
  html.zr-customer-entry-v2.zr-customer-entry-v2-active #startView{
    visibility:visible!important;
  }
  html.zr-customer-entry-v2.zr-customer-entry-v2-active #startView>*:not(#zrCustomerEntryResultsV2){
    visibility:hidden!important;pointer-events:none!important;
  }

  /* Desktop lookup result sits above the dedicated landing overlay. */
  @media(min-width:901px){
    html.zr-customer-entry-v2.zr-customer-entry-v2-active #startView.zr-v2-has-results #zrCustomerEntryResultsV2{
      position:fixed!important;z-index:2147482100!important;right:clamp(30px,4.2vw,84px)!important;top:50%!important;
      transform:translateY(-50%)!important;width:min(720px,45vw)!important;max-height:calc(100svh - 56px)!important;
    }
  }
  `;
  document.head.appendChild(s);
}

function ensureOverlay(){
  let overlay=$('zrCustomerEntryOverlayV3');
  if(!overlay){
    overlay=document.createElement('div');
    overlay.id='zrCustomerEntryOverlayV3';
    overlay.setAttribute('aria-label','주렁주렁 동탄점 단체예약');
    document.body.appendChild(overlay);
  }
  return overlay;
}

function moveHeroToOverlay(){
  const hero=$('zrCustomerEntryHeroV2');
  if(!hero)return false;
  const overlay=ensureOverlay();
  if(hero.parentElement!==overlay)overlay.appendChild(hero);
  return hero.parentElement===overlay;
}

function legacyStartIsActive(){
  const start=$('startView'),customer=$('customerView');
  if(!start)return false;
  if(start.classList.contains('hidden'))return false;
  if(customer&&!customer.classList.contains('hidden')){
    try{if(getComputedStyle(customer).display!=='none')return false}catch{}
  }
  try{
    const s=getComputedStyle(start);
    return s.display!=='none';
  }catch{return true}
}

function syncActiveState(){
  const active=legacyStartIsActive();
  ROOT.classList.toggle('zr-customer-entry-v2-active',active);
  if(active){
    try{window.scrollTo(0,0)}catch{}
    try{(document.scrollingElement||document.documentElement).scrollLeft=0}catch{}
  }
  return active;
}

function stabilize(){
  installStyle();
  const mounted=moveHeroToOverlay();
  syncActiveState();
  if(mounted){
    ROOT.classList.add('zr-customer-entry-shell-stable');
    try{document.dispatchEvent(new CustomEvent('zr:customer-entry-shell-stable'))}catch{}
  }
  return mounted;
}

stabilize();
requestAnimationFrame(stabilize);
setTimeout(stabilize,120);

const watched=[$('startView'),$('customerView'),$('successView'),$('cancelSuccessView')].filter(Boolean);
if(watched.length){
  const observer=new MutationObserver(()=>requestAnimationFrame(syncActiveState));
  watched.forEach(node=>observer.observe(node,{attributes:true,attributeFilter:['class','style','hidden']}));
}
window.addEventListener('pageshow',()=>requestAnimationFrame(stabilize));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')requestAnimationFrame(stabilize)});
})();
