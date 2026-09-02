(()=>{
'use strict';
if(window.__ZR_ADMIN_WORKSPACE_FRAME_FIX_V1)return;
window.__ZR_ADMIN_WORKSPACE_FRAME_FIX_V1=true;

const $=id=>document.getElementById(id);
function injectStyle(){
  if($('zrAdminWorkspaceFrameFixV1Style'))return;
  const s=document.createElement('style');s.id='zrAdminWorkspaceFrameFixV1Style';s.textContent=`
    @media(min-width:901px){
      html.zr-admin-shell-mounted,html.zr-admin-shell-mounted body{height:100%!important;min-height:100%!important;overflow:hidden!important}
      html.zr-admin-shell-mounted body #adminView{
        position:fixed!important;
        top:calc(var(--zr-shell-gap) + var(--zr-admin-header-height) + var(--zr-shell-gap))!important;
        bottom:var(--zr-shell-gap)!important;
        left:calc(var(--zr-admin-rail-width) + (var(--zr-shell-gap) * 2))!important;
        right:var(--zr-shell-gap)!important;
        width:auto!important;height:auto!important;min-height:0!important;max-height:none!important;
        margin:0!important;padding:18px 18px 24px!important;
        overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior:contain!important;scrollbar-gutter:stable;
      }
      html.zr-admin-shell-collapsed body #adminView{left:calc(var(--zr-admin-rail-collapsed-width) + (var(--zr-shell-gap) * 2))!important}
    }
    @media(min-width:1201px){
      html.zr-admin-shell-mounted body #adminView{right:calc(var(--zr-admin-smart-width) + (var(--zr-shell-gap) * 2))!important}
    }
  `;document.head.appendChild(s);
}
function resetScroll(){const admin=$('adminView');if(admin&&admin.scrollTop<0)admin.scrollTop=0}
function boot(){injectStyle();resetScroll()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,0),{once:true});
})();
