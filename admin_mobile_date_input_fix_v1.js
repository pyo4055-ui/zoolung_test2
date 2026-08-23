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
        width:100%!important;
        inline-size:100%!important;
        max-width:100%!important;
        max-inline-size:100%!important;
        min-width:0!important;
        min-inline-size:0!important;
        box-sizing:border-box!important;
        margin-left:0!important;
        margin-right:0!important;
        justify-self:stretch!important;
      }
      #adminView input[type="date"]::-webkit-date-and-time-value{
        width:100%!important;
        min-width:0!important;
        margin:0!important;
        text-align:center!important;
      }
    }
  `;
  document.head.appendChild(s);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',injectStyle,{once:true});
else injectStyle();
})();
