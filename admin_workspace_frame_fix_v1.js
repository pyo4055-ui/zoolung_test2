(()=>{
'use strict';
if(window.__ZR_ADMIN_WORKSPACE_FRAME_FIX_V1)return;
window.__ZR_ADMIN_WORKSPACE_FRAME_FIX_V1=true;

const $=id=>document.getElementById(id);
const SECTION_IDS=['tab-today','tab-calendar','tab-schedule','tab-warning','tab-activity','tab-meals','tab-cleanup','tab-inquiries','tab-preview-visit','zrGuideAdminSection','tab-outsourcing','tab-menuadmin','tab-settings'];
let rootObserver=null,adminObserver=null,scheduled=false,loginIdentityResetDone=false;

function injectStyle(){
  if($('zrAdminWorkspaceFrameFixV1Style'))return;
  const s=document.createElement('style');s.id='zrAdminWorkspaceFrameFixV1Style';s.textContent=`
    @media(min-width:901px){
      html.zr-admin-shell-mounted,html.zr-admin-shell-mounted body{height:100%!important;min-height:100%!important;overflow:hidden!important}
      html.zr-admin-shell-mounted body #adminView{
        position:fixed!important;margin:0!important;padding:14px!important;
        width:auto!important;height:auto!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;
        background:var(--zr-shell-panel,#fffdfa)!important;
        border:1px solid var(--zr-shell-line,#e7ddd4)!important;border-radius:20px!important;
        box-shadow:var(--zr-shell-shadow,0 8px 28px rgba(68,49,35,.055))!important;
        box-sizing:border-box!important;overflow-x:hidden!important;overflow-y:auto!important;
        overscroll-behavior:contain!important;scrollbar-gutter:stable;
      }
      html.zr-admin-shell-mounted body #adminView .zr-admin-workspace-fluid-wrapper{
        width:100%!important;max-width:none!important;min-width:0!important;
        margin-left:0!important;margin-right:0!important;margin-top:0!important;
        padding-top:0!important;box-sizing:border-box!important;
      }
      html.zr-admin-shell-mounted body #adminView .zr-admin-workspace-fluid-section{
        width:100%!important;max-width:none!important;min-width:0!important;
        margin-left:0!important;margin-right:0!important;margin-top:0!important;
        box-sizing:border-box!important;
      }
      html.zr-admin-shell-mounted body #adminView .zr-admin-workspace-fluid-section>.card,
      html.zr-admin-shell-mounted body #adminView .zr-admin-workspace-fluid-section>.panel,
      html.zr-admin-shell-mounted body #adminView .zr-admin-workspace-fluid-section>.container{
        width:100%!important;max-width:none!important;margin-left:0!important;margin-right:0!important;box-sizing:border-box!important;
      }
    }
    /* Login visual repair: keep the photo layer above the modal fallback background,
       while the white login card stays above both photo and overlay. */
    html.zr-admin-login-clean #adminLoginModal[data-zr-login-visual="1"]{background:#38271e!important}
    html.zr-admin-login-clean #adminLoginModal[data-zr-login-visual="1"]::before{z-index:0!important;opacity:1!important}
    html.zr-admin-login-clean #adminLoginModal[data-zr-login-visual="1"]::after{z-index:1!important}
    html.zr-admin-login-clean #adminLoginModal[data-zr-login-visual="1"]>.modal-card{z-index:2!important}
  `;document.head.appendChild(s);
}
function important(el,name,value){try{el?.style?.setProperty(name,value,'important')}catch{}}
function frameEdges(){
  const root=document.documentElement;
  const collapsed=root.classList.contains('zr-admin-shell-collapsed');
  return {
    top:'calc(var(--zr-shell-gap,14px) + var(--zr-admin-header-height,58px) + var(--zr-shell-gap,14px))',
    bottom:'var(--zr-shell-gap,14px)',
    left:collapsed?'calc(var(--zr-admin-rail-collapsed-width,54px) + (var(--zr-shell-gap,14px) * 2))':'calc(var(--zr-admin-rail-width,250px) + (var(--zr-shell-gap,14px) * 2))',
    right:window.matchMedia('(min-width:1201px)').matches?'calc(var(--zr-admin-smart-width,300px) + (var(--zr-shell-gap,14px) * 2))':'var(--zr-shell-gap,14px)'
  };
}
function forceFrame(){
  const admin=$('adminView');if(!admin)return false;
  const e=frameEdges();
  important(admin,'position','fixed');important(admin,'top',e.top);important(admin,'bottom',e.bottom);important(admin,'left',e.left);important(admin,'right',e.right);
  important(admin,'width','auto');important(admin,'height','auto');important(admin,'min-width','0');important(admin,'min-height','0');important(admin,'max-width','none');important(admin,'max-height','none');
  important(admin,'margin','0');important(admin,'padding','14px');important(admin,'box-sizing','border-box');
  important(admin,'background','var(--zr-shell-panel,#fffdfa)');important(admin,'border','1px solid var(--zr-shell-line,#e7ddd4)');important(admin,'border-radius','20px');important(admin,'box-shadow','var(--zr-shell-shadow,0 8px 28px rgba(68,49,35,.055))');
  important(admin,'overflow-x','hidden');important(admin,'overflow-y','auto');important(admin,'overscroll-behavior','contain');
  return true;
}
function fluidize(){
  const admin=$('adminView');if(!admin)return;
  for(const id of SECTION_IDS){
    const sec=$(id);if(!sec||!admin.contains(sec))continue;
    sec.classList.add('zr-admin-workspace-fluid-section');
    important(sec,'width','100%');important(sec,'max-width','none');important(sec,'min-width','0');important(sec,'margin-left','0');important(sec,'margin-right','0');important(sec,'margin-top','0');important(sec,'box-sizing','border-box');
    let node=sec.parentElement;
    while(node&&node!==admin){
      node.classList.add('zr-admin-workspace-fluid-wrapper');
      important(node,'width','100%');important(node,'max-width','none');important(node,'min-width','0');important(node,'margin-left','0');important(node,'margin-right','0');important(node,'margin-top','0');important(node,'padding-top','0');important(node,'box-sizing','border-box');
      node=node.parentElement;
    }
  }
}
function fixLoginIdentityPlacement(){
  const modal=$('adminLoginModal'),card=modal?.querySelector('.modal-card');
  const field=$('zrAdminIdentityField'),password=$('adminPassword');
  if(!modal||!card||!field||!password)return false;
  let anchor=password;
  while(anchor.parentElement&&anchor.parentElement!==card&&card.contains(anchor.parentElement))anchor=anchor.parentElement;
  if(anchor.parentElement===card){
    if(field.parentElement!==card||field.nextElementSibling!==anchor)card.insertBefore(field,anchor);
  }else{
    const actions=card.querySelector('.modal-actions');
    if(field.parentElement!==card)card.insertBefore(field,actions||null);
  }

  const clean=document.documentElement.classList.contains('zr-admin-login-clean');
  if(clean&&!loginIdentityResetDone){
    try{localStorage.removeItem('zr_admin_display_name_v1')}catch{}
    const input=$('zrAdminIdentity');
    if(input){
      input.value='';
      input.placeholder='아이디';
      input.setAttribute('autocomplete','off');
      input.setAttribute('aria-label','아이디');
    }
    loginIdentityResetDone=true;
  }else if(!clean){
    loginIdentityResetDone=false;
  }
  return true;
}
function apply(){scheduled=false;injectStyle();fixLoginIdentityPlacement();forceFrame();fluidize()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(apply)}
function installObservers(){
  const admin=$('adminView');
  if(!rootObserver){rootObserver=new MutationObserver(schedule);rootObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']})}
  if(admin&&!adminObserver){adminObserver=new MutationObserver(schedule);adminObserver.observe(admin,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden']})}
}
function boot(){
  apply();installObservers();
  window.addEventListener('resize',schedule,{passive:true});
  [50,150,350,800,1600].forEach(ms=>setTimeout(apply,ms));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,0),{once:true});
})();
