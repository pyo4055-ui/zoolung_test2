(()=>{
'use strict';
if(window.__ZR_CUSTOMER_ENTRY_LOOKUP_SURFACE_FIX_V1)return;
window.__ZR_CUSTOMER_ENTRY_LOOKUP_SURFACE_FIX_V1=true;

const $=id=>document.getElementById(id);
const ROOT=document.documentElement;
let observer=null;

function installStyle(){
  if($('zrCustomerEntryLookupSurfaceFixV1Style'))return;
  const s=document.createElement('style');
  s.id='zrCustomerEntryLookupSurfaceFixV1Style';
  s.textContent=`
  @media(max-width:900px){
    html.zr-customer-entry-v2.zr-customer-entry-v2-active.zr-customer-entry-lookup-open #zrCustomerEntryOverlayV3 #zrCustomerEntryResultsV2{
      border-radius:26px!important;
      overflow:hidden!important;
      -webkit-mask-image:-webkit-radial-gradient(white,black)!important;
    }
    html.zr-customer-entry-v2.zr-customer-entry-v2-active.zr-customer-entry-lookup-open #zrCustomerEntryResultsV2> :first-child{
      border-top-left-radius:18px!important;
      border-top-right-radius:18px!important;
    }
  }
  `;
  document.head.appendChild(s);
}

function logicalOpen(el){
  if(!el||el.hidden||el.classList.contains('hidden'))return false;
  if(el.style?.display==='none'||el.style?.visibility==='hidden')return false;
  return true;
}
function ensureRegionHost(){
  const overlay=$('zrCustomerEntryOverlayV3');
  const region=$('zrCustomerEntryResultsV2');
  if(overlay&&region&&region.parentElement!==overlay)overlay.appendChild(region);
}
function sync(){
  ensureRegionHost();
  const existing=$('existingActions');
  const list=$('existingBookingList');
  const listHasContent=!!list&&list.children.length>0;
  const open=logicalOpen(existing)||(logicalOpen(list)&&listHasContent);
  ROOT.classList.toggle('zr-customer-entry-lookup-open',open);
  $('startView')?.classList.toggle('zr-v2-has-results',open);
  if(open&&innerWidth<=900){
    const region=$('zrCustomerEntryResultsV2');
    if(region&&!region.dataset.zrLookupScrolled){
      region.dataset.zrLookupScrolled='1';
      setTimeout(()=>{try{region.scrollIntoView({behavior:'smooth',block:'start'})}catch{}},40);
    }
  }else{
    const region=$('zrCustomerEntryResultsV2');
    if(region)delete region.dataset.zrLookupScrolled;
  }
}
function observe(){
  observer?.disconnect();
  const nodes=[$('existingActions'),$('existingBookingList'),$('zrCustomerEntryResultsV2')].filter(Boolean);
  if(!nodes.length)return;
  observer=new MutationObserver(()=>queueMicrotask(sync));
  nodes.forEach(node=>observer.observe(node,{attributes:true,attributeFilter:['class','style','hidden'],childList:true,subtree:true}));
}
function boot(){
  installStyle();
  sync();observe();
  document.addEventListener('click',e=>{
    if(!e.target?.closest?.('#zrCustomerEntryLookupV2,#lookupBooking,#checkExisting'))return;
    const region=$('zrCustomerEntryResultsV2');if(region)delete region.dataset.zrLookupScrolled;
    [0,30,80,160,320,650,1200].forEach(ms=>setTimeout(sync,ms));
  },true);
  document.addEventListener('zr:customer-entry-v2-ready',()=>{installStyle();sync();observe()});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
