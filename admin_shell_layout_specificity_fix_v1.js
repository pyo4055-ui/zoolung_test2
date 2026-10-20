(()=>{
'use strict';
if(window.__ZR_ADMIN_SHELL_LAYOUT_SPECIFICITY_FIX_V1)return;
window.__ZR_ADMIN_SHELL_LAYOUT_SPECIFICITY_FIX_V1=true;
const style=document.createElement('style');
style.id='zrAdminShellLayoutSpecificityFixV1';
style.textContent=`
@media(min-width:1201px){
  html.zr-admin-smart-open.zr-admin-shell-mounted .zr-admin-shell-header{
    right:calc(var(--zr-admin-smart-width) + (var(--zr-shell-gap) * 2))!important;
  }
  html.zr-admin-smart-open.zr-admin-shell-mounted body #adminView{
    padding-right:18px!important;
  }
}
@media(min-width:901px) and (max-width:1200px){
  html.zr-admin-smart-open.zr-admin-shell-mounted .zr-admin-shell-header{right:var(--zr-shell-gap)!important}
  html.zr-admin-smart-open.zr-admin-shell-mounted body #adminView{padding-right:18px!important}
}
`;
document.head.appendChild(style);
})();
