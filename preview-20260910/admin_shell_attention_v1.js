(()=>{
'use strict';
if(window.__ZR_ADMIN_SHELL_ATTENTION_V1)return;
window.__ZR_ADMIN_SHELL_ATTENTION_V1=true;

const $=id=>document.getElementById(id);
let urgentObserver=null,pollTimer=null,lastUrgent=-1;

function injectStyle(){
  if($('zrAdminShellAttentionStyleV1'))return;
  const style=document.createElement('style');
  style.id='zrAdminShellAttentionStyleV1';
  style.textContent=`
    @media(min-width:901px){
      html.zr-admin-shell-mounted #adminView{
        width:100%!important;
        max-width:none!important;
        margin-left:0!important;
        margin-right:0!important;
      }
    }
    .zr-admin-shell-warning-badge{
      margin-left:auto;min-width:20px;height:20px;padding:0 6px;border-radius:999px;
      display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;
      background:var(--zr-action-danger);color:#fff;font-size:10px;font-weight:950;line-height:1;
      box-shadow:0 2px 8px rgba(178,56,56,.28);flex:none;
    }
    .zr-admin-shell-warning-badge[hidden]{display:none!important}
    .zr-admin-shell-item[data-zr-admin-item="warning"].zr-admin-warning-urgent{
      --zr-group-color:var(--zr-action-danger);--zr-group-soft:#fff0f0;
      color:#a72f2f!important;background:#ffe7e7!important;border-color:rgba(178,56,56,.34)!important;
      box-shadow:inset 3px 0 0 var(--zr-action-danger),0 0 0 rgba(178,56,56,0)!important;
      animation:zrAdminUrgentPulse 1.15s ease-in-out infinite;
      will-change:opacity,filter;
    }
    .zr-admin-shell-item[data-zr-admin-item="warning"].zr-admin-warning-urgent .zr-admin-shell-item-dot{
      background:var(--zr-action-danger)!important;opacity:1!important;
      box-shadow:0 0 0 4px rgba(178,56,56,.13);
    }
    @keyframes zrAdminUrgentPulse{
      0%,100%{opacity:1;filter:saturate(1) brightness(1)}
      50%{opacity:.55;filter:saturate(1.5) brightness(1.05)}
    }
    @media(prefers-reduced-motion:reduce){
      .zr-admin-shell-item[data-zr-admin-item="warning"].zr-admin-warning-urgent{
        animation:none!important;opacity:1!important;filter:none!important;background:#ffe6e6!important
      }
    }
  `;
  document.head.appendChild(style);
}
function warningButton(){return document.querySelector('#zrAdminShellRail [data-zr-admin-item="warning"]')}
function urgentMetric(){return $('zrWarningUrgent')}
function urgentCount(){
  const text=String(urgentMetric()?.textContent||'');
  const n=parseInt(text.replace(/[^0-9]/g,''),10);
  return Number.isFinite(n)?n:0;
}
function ensureBadge(button){
  let badge=button?.querySelector('.zr-admin-shell-warning-badge');
  if(!badge&&button){
    badge=document.createElement('span');badge.className='zr-admin-shell-warning-badge';badge.hidden=true;
    badge.setAttribute('aria-hidden','true');button.appendChild(badge);
  }
  return badge;
}
function syncUrgent(){
  const button=warningButton();if(!button)return false;
  const count=urgentCount(),badge=ensureBadge(button),urgent=count>0;
  button.classList.toggle('zr-admin-warning-urgent',urgent);
  if(badge){badge.hidden=!urgent;badge.textContent=count>99?'99+':String(count)}
  button.setAttribute('aria-label',urgent?`경고 · 긴급 ${count}건`:'경고');
  button.title=urgent?`긴급 확인 ${count}건`:'경고';
  lastUrgent=count;
  return true;
}
function observeMetric(){
  const metric=urgentMetric();if(!metric||urgentObserver)return false;
  urgentObserver=new MutationObserver(syncUrgent);
  urgentObserver.observe(metric,{subtree:true,childList:true,characterData:true});
  syncUrgent();return true;
}
function refreshHiddenWarning(){
  if(!document.documentElement.classList.contains('zr-admin-shell-mounted'))return;
  const section=$('tab-warning'),refresh=$('zrWarningRefresh');
  if(section&&section.classList.contains('hidden')&&refresh&&!refresh.disabled)refresh.click();
  observeMetric();
  const count=urgentCount();if(count!==lastUrgent)syncUrgent();
}
function boot(){
  injectStyle();
  let tries=0;
  const ready=setInterval(()=>{
    const ok=observeMetric()&&syncUrgent();
    if(ok||++tries>120)clearInterval(ready);
  },100);
  if(!pollTimer)pollTimer=setInterval(refreshHiddenWarning,3000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshHiddenWarning()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(refreshHiddenWarning,0));
})();
