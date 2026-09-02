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
        margin:0!important;padding:14px!important;
        background:var(--zr-shell-panel,#fffdfa)!important;
        border:1px solid var(--zr-shell-line,#e7ddd4)!important;
        border-radius:20px!important;
        box-shadow:var(--zr-shell-shadow,0 8px 28px rgba(68,49,35,.055))!important;
        box-sizing:border-box!important;
        overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior:contain!important;scrollbar-gutter:auto;
      }
      html.zr-admin-shell-collapsed body #adminView{left:calc(var(--zr-admin-rail-collapsed-width) + (var(--zr-shell-gap) * 2))!important}

      /* Legacy screens used centered max-width containers. In the new three-panel shell the
         center workspace itself is already width-constrained, so let each screen use it. */
      html.zr-admin-shell-mounted body #adminView>#tab-today,
      html.zr-admin-shell-mounted body #adminView>#tab-calendar,
      html.zr-admin-shell-mounted body #adminView>#tab-schedule,
      html.zr-admin-shell-mounted body #adminView>#tab-warning,
      html.zr-admin-shell-mounted body #adminView>#tab-activity,
      html.zr-admin-shell-mounted body #adminView>#tab-meals,
      html.zr-admin-shell-mounted body #adminView>#tab-cleanup,
      html.zr-admin-shell-mounted body #adminView>#tab-inquiries,
      html.zr-admin-shell-mounted body #adminView>#tab-preview-visit,
      html.zr-admin-shell-mounted body #adminView>#zrGuideAdminSection,
      html.zr-admin-shell-mounted body #adminView>#tab-outsourcing,
      html.zr-admin-shell-mounted body #adminView>#tab-menuadmin,
      html.zr-admin-shell-mounted body #adminView>#tab-settings{
        width:100%!important;max-width:none!important;margin-left:0!important;margin-right:0!important;box-sizing:border-box!important;
      }
      html.zr-admin-shell-mounted body #adminView>.hidden{display:none!important}

      html.zr-admin-shell-mounted body #adminView>#tab-calendar>.card,
      html.zr-admin-shell-mounted body #adminView>#tab-activity>.card,
      html.zr-admin-shell-mounted body #adminView>#tab-meals>.card,
      html.zr-admin-shell-mounted body #adminView>#tab-cleanup>.card,
      html.zr-admin-shell-mounted body #adminView>#tab-inquiries>.card,
      html.zr-admin-shell-mounted body #adminView>#tab-preview-visit>.card,
      html.zr-admin-shell-mounted body #adminView>#zrGuideAdminSection>.card,
      html.zr-admin-shell-mounted body #adminView>#tab-outsourcing>.card,
      html.zr-admin-shell-mounted body #adminView>#tab-menuadmin>.card,
      html.zr-admin-shell-mounted body #adminView>#tab-settings>.card{
        width:100%!important;max-width:none!important;margin-left:0!important;margin-right:0!important;box-sizing:border-box!important;
      }
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
