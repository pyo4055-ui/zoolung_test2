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
      #adminView input[type="date"]{
        display:block!important;
        width:100%!important;
        max-width:100%!important;
        min-width:0!important;
        box-sizing:border-box!important;
      }
    }
  `;
  document.head.appendChild(s);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',injectStyle,{once:true});
else injectStyle();
})();
