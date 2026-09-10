(()=>{
'use strict';
if(window.__ZR_ADMIN_MOBILE_DATE_CLIP_FIX_V1)return;
window.__ZR_ADMIN_MOBILE_DATE_CLIP_FIX_V1=true;
const mobile=()=>window.matchMedia('(max-width:900px)').matches;
const SELECTOR='#zrMobileActivityToolbarV2 .zrm-act-start input[type="date"],#zrMobileActivityToolbarV2 .zrm-act-end input[type="date"],#tab-cleanup .zr-cleanup-field input[type="date"],#zrActivityCancelWorkspaceV1 .zr-cancel-start input[type="date"],#zrActivityCancelWorkspaceV1 .zr-cancel-end input[type="date"]';
const CANCEL_ACTIONS='#zrActivityCancelWorkspaceV1 .zr-cancel-search,#zrActivityCancelWorkspaceV1 .zr-cancel-today';
function apply(){
  if(!mobile())return;
  document.querySelectorAll(SELECTOR).forEach(el=>{
    const parent=el.parentElement;
    if(parent){
      parent.style.setProperty('overflow','visible','important');
      parent.style.setProperty('padding-right','0','important');
      parent.style.setProperty('min-width','0','important');
      parent.style.setProperty('box-sizing','border-box','important');
    }
    const isCancel=!!el.closest('#zrActivityCancelWorkspaceV1');
    const inset=isCancel?'24px':'18px';
    el.style.setProperty('display','block','important');
    el.style.setProperty('width',`calc(100% - ${inset})`,'important');
    el.style.setProperty('inline-size',`calc(100% - ${inset})`,'important');
    el.style.setProperty('max-width',`calc(100% - ${inset})`,'important');
    el.style.setProperty('max-inline-size',`calc(100% - ${inset})`,'important');
    el.style.setProperty('min-width','0','important');
    el.style.setProperty('min-inline-size','0','important');
    el.style.setProperty('margin',isCancel?'0 auto':'0','important');
    el.style.setProperty('box-sizing','border-box','important');
  });
  document.querySelectorAll(CANCEL_ACTIONS).forEach(btn=>{
    btn.style.setProperty('display','flex','important');
    btn.style.setProperty('align-items','center','important');
    btn.style.setProperty('justify-content','center','important');
    btn.style.setProperty('align-self','end','important');
    btn.style.setProperty('width','100%','important');
    btn.style.setProperty('min-width','0','important');
    btn.style.setProperty('max-width','100%','important');
    btn.style.setProperty('height','44px','important');
    btn.style.setProperty('min-height','44px','important');
    btn.style.setProperty('max-height','44px','important');
    btn.style.setProperty('margin','0','important');
    btn.style.setProperty('padding','0 12px','important');
    btn.style.setProperty('box-sizing','border-box','important');
    btn.style.setProperty('line-height','1','important');
    btn.style.setProperty('border-radius','11px','important');
    btn.style.setProperty('font-size','13px','important');
    btn.style.setProperty('font-weight','900','important');
  });
}
function burst(){[0,90,240,520,900].forEach(ms=>setTimeout(apply,ms))}
function boot(){
  burst();
  let n=0;const t=setInterval(()=>{apply();if(++n>=48)clearInterval(t)},160);
  setTimeout(()=>clearInterval(t),8000);
  document.addEventListener('click',e=>{
    if(!mobile())return;
    if(e.target?.closest?.('#zrAdminMobileBottomV1,#zrAdminMobileSubnavV3,#tab-activity,#tab-cleanup'))burst();
  },true);
  document.addEventListener('zr:admin-runtime-ready',burst,{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
