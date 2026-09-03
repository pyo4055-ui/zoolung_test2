(()=>{
'use strict';
if(window.__ZR_CUSTOMER_ENTRY_VISUAL_V2_FIX_V1)return;
window.__ZR_CUSTOMER_ENTRY_VISUAL_V2_FIX_V1=true;

function install(){
  if(document.getElementById('zrCustomerEntryVisualV2FixV1Style'))return;
  const s=document.createElement('style');
  s.id='zrCustomerEntryVisualV2FixV1Style';
  s.textContent=`
  /* Keep the approved V2 landing page as the only first-screen surface. */
  html.zr-customer-entry-v2.zr-customer-entry-v2-active #startView > *:not(#zrCustomerEntryHeroV2):not(#zrCustomerEntryResultsV2){
    display:none!important;
  }
  html.zr-customer-entry-v2.zr-customer-entry-v2-active #startView:not(.zr-v2-has-results){
    height:100vh!important;
    height:100svh!important;
    min-height:100vh!important;
    min-height:100svh!important;
    overflow:hidden!important;
  }
  html.zr-customer-entry-v2.zr-customer-entry-v2-active #startView:not(.zr-v2-has-results) #zrCustomerEntryResultsV2{
    display:none!important;
  }
  html.zr-customer-entry-v2.zr-customer-entry-v2-active #zrCustomerEntryHeroV2{
    height:100vh!important;
    height:100svh!important;
    min-height:100vh!important;
    min-height:100svh!important;
  }

  /* Slightly larger, easier-to-read reservation card for older guests. */
  html.zr-customer-entry-v2 #zrCustomerEntryCardV2{
    width:min(500px,calc(100vw - 48px))!important;
    min-height:650px!important;
    padding:54px 46px 38px!important;
    border-radius:32px!important;
  }
  html.zr-customer-entry-v2 .zr-entry-logo-v2{
    width:174px!important;
    max-height:72px!important;
    margin-bottom:17px!important;
  }
  html.zr-customer-entry-v2 .zr-entry-title-v2{
    font-size:32px!important;
  }
  html.zr-customer-entry-v2 .zr-entry-sub-v2{
    margin-top:8px!important;
    margin-bottom:20px!important;
    font-size:13px!important;
  }
  html.zr-customer-entry-v2 #zrCustomerGroupGuideOpenV2{
    min-height:46px!important;
    margin-bottom:20px!important;
    font-size:14px!important;
  }
  html.zr-customer-entry-v2 .zr-entry-field-v2{
    margin-bottom:12px!important;
  }
  html.zr-customer-entry-v2 .zr-entry-field-v2 input{
    height:56px!important;
    min-height:56px!important;
    padding-left:46px!important;
    font-size:16px!important;
  }
  html.zr-customer-entry-v2 #zrCustomerEntryErrorV2{
    min-height:18px!important;
    font-size:12px!important;
  }
  html.zr-customer-entry-v2 .zr-entry-actions-v2{
    gap:10px!important;
  }
  html.zr-customer-entry-v2 .zr-entry-actions-v2 button{
    min-height:56px!important;
    font-size:15px!important;
  }
  html.zr-customer-entry-v2 #zrCustomerEntryInquiryV2{
    min-height:50px!important;
  }
  html.zr-customer-entry-v2 .zr-entry-foot-v2{
    padding-top:26px!important;
    font-size:12px!important;
  }

  @media(max-width:700px){
    html.zr-customer-entry-v2 #zrCustomerEntryCardV2{
      width:calc(100vw - 28px)!important;
      min-height:0!important;
      max-height:calc(100svh - 28px)!important;
      padding:36px 28px 28px!important;
      border-radius:26px!important;
    }
    html.zr-customer-entry-v2 .zr-entry-logo-v2{width:158px!important;margin-bottom:12px!important}
    html.zr-customer-entry-v2 .zr-entry-title-v2{font-size:29px!important}
    html.zr-customer-entry-v2 .zr-entry-sub-v2{margin-bottom:16px!important}
    html.zr-customer-entry-v2 #zrCustomerGroupGuideOpenV2{margin-bottom:16px!important}
  }

  @media(max-height:720px) and (min-width:701px){
    html.zr-customer-entry-v2 #zrCustomerEntryCardV2{
      min-height:0!important;
      max-height:calc(100svh - 28px)!important;
      padding-top:34px!important;
      padding-bottom:28px!important;
    }
    html.zr-customer-entry-v2 .zr-entry-logo-v2{width:154px!important;margin-bottom:10px!important}
    html.zr-customer-entry-v2 .zr-entry-title-v2{font-size:29px!important}
    html.zr-customer-entry-v2 .zr-entry-sub-v2{margin-bottom:14px!important}
    html.zr-customer-entry-v2 #zrCustomerGroupGuideOpenV2{margin-bottom:14px!important}
    html.zr-customer-entry-v2 .zr-entry-foot-v2{padding-top:16px!important}
  }
  `;
  document.head.appendChild(s);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();
