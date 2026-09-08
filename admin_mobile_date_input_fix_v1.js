(()=>{
'use strict';
if(window.__ZR_ADMIN_MOBILE_DATE_INPUT_FIX_V1)return;
window.__ZR_ADMIN_MOBILE_DATE_INPUT_FIX_V1=true;

function injectStyle(){
  if(document.getElementById('zrAdminMobileDateInputFixV1Style'))return;
  const s=document.createElement('style');
  s.id='zrAdminMobileDateInputFixV1Style';
  s.textContent=`
    @media(max-width:720px){
      #adminView :where(div,label):has(> input[type="date"]),
      #adminView :where(div,label):has(> :where(div,label) > input[type="date"]){
        min-width:0!important;
        max-width:100%!important;
        box-sizing:border-box!important;
      }
      #adminView input[type="date"]{
        display:block!important;
        width:calc(100% - 12px)!important;
        inline-size:calc(100% - 12px)!important;
        max-width:calc(100% - 12px)!important;
        max-inline-size:calc(100% - 12px)!important;
        min-width:0!important;
        min-inline-size:0!important;
        box-sizing:border-box!important;
        margin-left:auto!important;
        margin-right:auto!important;
        justify-self:center!important;
      }
      #adminView input[type="date"]::-webkit-date-and-time-value{
        width:100%!important;
        min-width:0!important;
        margin:0!important;
        text-align:center!important;
      }

      /* Cancellation review: keep two date fields comfortably inside each mobile grid column. */
      #adminView #zrActivityCancelWorkspaceV1 .zr-cancel-toolbar input[type="date"]{
        width:calc(100% - 20px)!important;
        inline-size:calc(100% - 20px)!important;
        max-width:calc(100% - 20px)!important;
        max-inline-size:calc(100% - 20px)!important;
        margin-left:auto!important;
        margin-right:auto!important;
      }

      /* Cancellation review actions must use the exact same mobile footprint. */
      #adminView #zrActivityCancelWorkspaceV1 .zr-cancel-toolbar .zr-cancel-search,
      #adminView #zrActivityCancelWorkspaceV1 .zr-cancel-toolbar .zr-cancel-today{
        display:flex!important;
        align-items:center!important;
        justify-content:center!important;
        align-self:end!important;
        width:100%!important;
        min-width:0!important;
        max-width:100%!important;
        height:44px!important;
        min-height:44px!important;
        max-height:44px!important;
        margin:0!important;
        padding:0 12px!important;
        box-sizing:border-box!important;
        line-height:1!important;
        border-radius:11px!important;
        font-size:13px!important;
        font-weight:900!important;
      }
    }
  `;
  document.head.appendChild(s);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',injectStyle,{once:true});
else injectStyle();
})();
