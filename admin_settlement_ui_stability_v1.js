(()=>{
'use strict';
if(window.__ZR_ADMIN_SETTLEMENT_UI_STABILITY_V1)return;
window.__ZR_ADMIN_SETTLEMENT_UI_STABILITY_V1=true;

const $=id=>document.getElementById(id);
let queued=false;
const pendingRoots=new Set();

function injectStyle(){
  if($('zrSettlementUiStabilityV1Style'))return;
  const s=document.createElement('style');s.id='zrSettlementUiStabilityV1Style';s.textContent=`
    #activityList .zr-settle-card-actions{display:flex!important;justify-content:flex-end!important;gap:8px!important;margin-top:10px!important;flex-wrap:wrap!important}
    #activityList .zr-settlement-done{background:#eee8fb!important;border-color:#d7c9ef!important;color:#5d4388!important;font-weight:900!important}
    #adminBookingDetailContent .zr-settle-open{display:none!important}
  `;document.head.appendChild(s);
}
function syncActivity(){window.ZRSettlementCards?.refresh()}
function syncDetail(){
  const root=$('adminBookingDetailContent');if(!root)return;
  root.querySelectorAll('.zr-settle-open').forEach(btn=>btn.remove());
}
function syncAll(){injectStyle();syncActivity();syncDetail()}
function schedule(id){
  if(id)pendingRoots.add(id);else{pendingRoots.add('activityList');pendingRoots.add('adminBookingDetailContent')}
  if(queued)return;queued=true;
  queueMicrotask(()=>{
    queued=false;const roots=new Set(pendingRoots);pendingRoots.clear();
    if(roots.has('activityList'))syncActivity();
    if(roots.has('adminBookingDetailContent'))syncDetail();
  });
}
function observe(id){
  const root=$(id);if(!root||root.dataset.zrSettlementStableObserved==='1')return false;
  root.dataset.zrSettlementStableObserved='1';
  new MutationObserver(()=>schedule(id)).observe(root,{childList:true,subtree:true});
  return true;
}
function bind(){
  observe('activityList');observe('adminBookingDetailContent');syncAll();
}
function boot(){
  document.addEventListener('zr:settlement-workspace-ready',bind);
  document.addEventListener('zr:admin-runtime-ready',bind);
  bind();
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#adminView .admin-tabs button,[data-tab],#activityList button'))setTimeout(schedule,0);
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
