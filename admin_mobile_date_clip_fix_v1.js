(()=>{
'use strict';
if(window.__ZR_ADMIN_MOBILE_DATE_CLIP_FIX_V1)return;
window.__ZR_ADMIN_MOBILE_DATE_CLIP_FIX_V1=true;

const mobile=()=>window.matchMedia('(max-width:900px)').matches;
const SELECTOR='#zrMobileActivityToolbarV2 .zrm-act-start input[type="date"],#zrMobileActivityToolbarV2 .zrm-act-end input[type="date"],#tab-cleanup .zr-cleanup-field input[type="date"]';
const watched=new WeakMap();
let treeObserver=null;

function prop(el,name,value){
  if(!el)return;
  if(el.style.getPropertyValue(name)===value&&el.style.getPropertyPriority(name)==='important')return;
  el.style.setProperty(name,value,'important');
}
function ensureShell(el){
  let shell=el.parentElement;
  if(shell?.classList?.contains('zr-mobile-date-shell'))return shell;
  shell=document.createElement('span');
  shell.className='zr-mobile-date-shell';
  el.parentNode?.insertBefore(shell,el);
  shell.appendChild(el);
  return shell;
}
function applyOne(el){
  if(!mobile()||!el?.isConnected)return;
  const shell=ensureShell(el);
  prop(shell,'display','block');
  prop(shell,'width','100%');
  prop(shell,'inline-size','100%');
  prop(shell,'min-width','0');
  prop(shell,'max-width','100%');
  prop(shell,'height','44px');
  prop(shell,'min-height','44px');
  prop(shell,'max-height','44px');
  prop(shell,'margin','0');
  prop(shell,'padding','0');
  prop(shell,'overflow','hidden');
  prop(shell,'border','1px solid #dfd2c8');
  prop(shell,'border-radius','11px');
  prop(shell,'background','#fff');
  prop(shell,'box-sizing','border-box');
  prop(shell,'align-self','stretch');

  prop(el,'display','block');
  prop(el,'width','calc(100% - 14px)');
  prop(el,'inline-size','calc(100% - 14px)');
  prop(el,'min-width','0');
  prop(el,'min-inline-size','0');
  prop(el,'max-width','calc(100% - 14px)');
  prop(el,'max-inline-size','calc(100% - 14px)');
  prop(el,'height','42px');
  prop(el,'min-height','42px');
  prop(el,'max-height','42px');
  prop(el,'margin','0');
  prop(el,'padding','0 10px');
  prop(el,'border','0');
  prop(el,'border-radius','0');
  prop(el,'box-shadow','none');
  prop(el,'background','transparent');
  prop(el,'box-sizing','border-box');
  prop(el,'font-size','16px');
  prop(el,'line-height','42px');
}
function watch(el){
  if(!el||watched.has(el))return;
  applyOne(el);
  const mo=new MutationObserver(()=>applyOne(el));
  mo.observe(el,{attributes:true,attributeFilter:['style','class']});
  watched.set(el,mo);
}
function scan(root=document){
  if(!mobile())return;
  if(root?.nodeType===1&&root.matches?.(SELECTOR))watch(root);
  root?.querySelectorAll?.(SELECTOR).forEach(watch);
}
function apply(){scan(document)}
function watchTree(){
  if(treeObserver)return;
  const root=document.getElementById('adminView')||document.body;
  treeObserver=new MutationObserver(records=>{
    if(!mobile())return;
    records.forEach(r=>r.addedNodes.forEach(n=>scan(n)));
  });
  treeObserver.observe(root,{childList:true,subtree:true});
}
function burst(){
  apply();
  [0,40,120,260].forEach(ms=>setTimeout(apply,ms));
}
function boot(){
  watchTree();
  burst();
  document.addEventListener('click',e=>{
    if(!mobile())return;
    if(e.target?.closest?.('#zrAdminMobileBottomV1,#zrAdminMobileSubnavV3,#tab-activity,#tab-cleanup'))burst();
  },true);
  document.addEventListener('zr:admin-runtime-ready',()=>{watchTree();burst()},{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();