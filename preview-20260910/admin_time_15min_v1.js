(()=>{
'use strict';
if(window.__ZR_ADMIN_TIME_15MIN_V1)return;
window.__ZR_ADMIN_TIME_15MIN_V1=true;

const TARGETS=['zr2eEntry','zr2eExit','zr2eMealStart','zr2ePlayStart','zr2qEntry','zr2qExit','zr2qMealStart','zr2qPlayStart'];
const pad=n=>String(n).padStart(2,'0');
function options(current){
  const value=String(current||'');
  const out=['<option value="">선택</option>'];
  const standard=new Set();
  for(let m=0;m<24*60;m+=15){
    const t=`${pad(Math.floor(m/60))}:${pad(m%60)}`;standard.add(t);
    out.push(`<option value="${t}" ${t===value?'selected':''}>${t}</option>`);
  }
  if(value&&!standard.has(value))out.splice(1,0,`<option value="${value}" selected>기존 ${value}</option>`);
  return out.join('');
}
function replaceTimeInput(input){
  if(!input||input.tagName!=='INPUT'||input.type!=='time'||input.dataset.zr15Converted==='1')return false;
  const select=document.createElement('select');
  select.id=input.id;select.name=input.name||'';select.className=input.className||'';select.style.cssText=input.style.cssText||'';
  select.required=input.required;select.disabled=input.disabled;select.dataset.zr15Converted='1';select.dataset.zr15AdminTime='1';
  select.innerHTML=options(input.value);
  for(const a of ['data-field','aria-label','aria-describedby'])if(input.hasAttribute(a))select.setAttribute(a,input.getAttribute(a));
  input.replaceWith(select);return true;
}
function apply(root=document){
  TARGETS.forEach(id=>{const el=(root.getElementById?.(id)||document.getElementById(id));replaceTimeInput(el)});
}
function observeBody(id){
  const root=document.getElementById(id);if(!root||root.dataset.zr15Observed==='1')return false;
  root.dataset.zr15Observed='1';new MutationObserver(()=>apply(root)).observe(root,{childList:true,subtree:true});apply(root);return true;
}
function install(){
  apply();observeBody('zr2EditBody');observeBody('zr2QuickBody');
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('[onclick*="openAdminEditBooking"],#adminCreateBooking,[onclick*="openAdminQuickBooking"]')){
      setTimeout(()=>{observeBody('zr2EditBody');observeBody('zr2QuickBody');apply()},0);
      setTimeout(()=>apply(),80);
    }
  },true);
}
function boot(){
  install();const t=setInterval(install,250);setTimeout(()=>clearInterval(t),20000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
