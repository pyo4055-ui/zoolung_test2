(()=>{
'use strict';
if(window.__ZR_CUSTOMER_VISUAL_THEME_V1)return;
window.__ZR_CUSTOMER_VISUAL_THEME_V1=true;

function install(){
  document.documentElement.classList.add('zr-customer-theme-v1');
  if(document.getElementById('zrCustomerVisualThemeV1Style'))return;
  const style=document.createElement('style');
  style.id='zrCustomerVisualThemeV1Style';
  style.textContent=`
    html.zr-customer-theme-v1{
      --zr-customer-wine:#470910;
      --zr-customer-wine-dark:#300206;
      --zr-customer-brown:#38271e;
      --zr-customer-orange:#fc5404;
      --zr-customer-orange-dark:#e24600;
      --zr-customer-orange-soft:#fff1e5;
      --zr-customer-cream:#f7f3ee;
      --zr-customer-paper:#fffdfb;
      --zr-customer-line:#e5d9cf;
      --zr-customer-text:#302b28;
      --zr-customer-muted:#766d66;
      --bg:var(--zr-customer-cream);
      --card:#fff;
      --text:var(--zr-customer-text);
      --muted:var(--zr-customer-muted);
      --line:var(--zr-customer-line);
      --green:var(--zr-customer-wine);
      --green2:var(--zr-customer-orange-soft);
      --gray:#f3eee9;
      accent-color:var(--zr-customer-orange);
    }

    html.zr-customer-theme-v1 body{
      background:var(--zr-customer-cream)!important;
      color:var(--zr-customer-text)!important;
      font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR",Arial,sans-serif!important;
    }
    html.zr-customer-theme-v1 body>header{
      border-bottom:1px solid #eadfd6!important;
      background:rgba(255,253,251,.97)!important;
      box-shadow:0 5px 18px rgba(56,39,30,.05)!important;
      backdrop-filter:blur(12px);
    }
    html.zr-customer-theme-v1 .top{max-width:1180px!important}
    html.zr-customer-theme-v1 .brand{color:var(--zr-customer-wine)!important;letter-spacing:-.025em}
    html.zr-customer-theme-v1 .brand small{color:#887c73!important}

    html.zr-customer-theme-v1 main{max-width:1180px!important}
    html.zr-customer-theme-v1 main .card,
    html.zr-customer-theme-v1 main .existing-card{
      border-color:var(--zr-customer-line)!important;
      box-shadow:0 8px 26px rgba(56,39,30,.06)!important;
    }
    html.zr-customer-theme-v1 main .notice{
      border-color:#f0c8aa!important;
      background:#fff6ee!important;
      color:#6f3a1c!important;
    }

    /* First reservation / lookup screen: same warm, dark stage language as the approved admin login. */
    html.zr-customer-theme-v1 #startView{
      position:relative!important;
      isolation:isolate!important;
      overflow:hidden!important;
      min-height:520px!important;
      padding:38px 30px!important;
      border:1px solid rgba(255,255,255,.05)!important;
      border-radius:30px!important;
      background:
        radial-gradient(circle at 8% 8%,rgba(252,84,4,.24) 0,rgba(252,84,4,0) 31%),
        radial-gradient(circle at 92% 82%,rgba(247,173,102,.14) 0,rgba(247,173,102,0) 34%),
        linear-gradient(135deg,#38271e 0%,#4a2e22 52%,#2f1e18 100%)!important;
      box-shadow:0 24px 54px rgba(56,39,30,.18)!important;
    }
    html.zr-customer-theme-v1 #startView:before,
    html.zr-customer-theme-v1 #startView:after{
      content:"";
      position:absolute;
      z-index:0;
      pointer-events:none;
      border-radius:999px;
      filter:blur(1px);
    }
    html.zr-customer-theme-v1 #startView:before{
      width:240px;height:240px;right:-95px;top:-105px;
      background:rgba(252,84,4,.13);
      border:1px solid rgba(255,255,255,.05);
    }
    html.zr-customer-theme-v1 #startView:after{
      width:190px;height:190px;left:-78px;bottom:-92px;
      background:rgba(255,255,255,.035);
      border:1px solid rgba(255,255,255,.05);
    }
    html.zr-customer-theme-v1 #startView>*{position:relative;z-index:1}
    html.zr-customer-theme-v1 #startView>.card,
    html.zr-customer-theme-v1 #startView .layout>.card,
    html.zr-customer-theme-v1 #startView .summary.card{
      border:1px solid rgba(238,221,209,.96)!important;
      border-radius:24px!important;
      background:rgba(255,253,250,.985)!important;
      box-shadow:0 22px 48px rgba(25,12,7,.22)!important;
    }
    html.zr-customer-theme-v1 #startView .notice{
      border-color:rgba(252,84,4,.20)!important;
      background:rgba(255,247,240,.96)!important;
      box-shadow:none!important;
    }
    html.zr-customer-theme-v1 #startView>h1,
    html.zr-customer-theme-v1 #startView>h2,
    html.zr-customer-theme-v1 #startView>h3{color:#fff!important}
    html.zr-customer-theme-v1 #startView #startManager,
    html.zr-customer-theme-v1 #startView #startContact{
      min-height:52px!important;
      border:1px solid #dccfc5!important;
      border-radius:14px!important;
      background:#fff!important;
      color:#302b28!important;
      font-size:15px!important;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.8)!important;
    }
    html.zr-customer-theme-v1 #startView #lookupBooking{
      min-height:52px!important;
      border:1px solid var(--zr-customer-orange)!important;
      border-radius:14px!important;
      background:var(--zr-customer-orange)!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      box-shadow:0 10px 22px rgba(252,84,4,.22)!important;
      font-size:15px!important;
      font-weight:900!important;
    }
    html.zr-customer-theme-v1 #startView #lookupBooking:hover{
      border-color:var(--zr-customer-orange-dark)!important;
      background:var(--zr-customer-orange-dark)!important;
    }
    html.zr-customer-theme-v1 #startView #checkExisting,
    html.zr-customer-theme-v1 #startView #cancelExisting{
      min-height:46px!important;
      border-radius:12px!important;
      font-weight:850!important;
    }
    html.zr-customer-theme-v1 #startView #checkExisting{
      border:1px solid #7e4c43!important;
      background:#fff9f5!important;
      color:var(--zr-customer-wine)!important;
    }
    html.zr-customer-theme-v1 #startView #cancelExisting{
      border:1px solid #d7c9c0!important;
      background:#f5eee9!important;
      color:#5c4740!important;
    }

    /* Core customer form */
    html.zr-customer-theme-v1 #customerView{
      color:var(--zr-customer-text)!important;
    }
    html.zr-customer-theme-v1 #customerView .card,
    html.zr-customer-theme-v1 #customerView .calc{
      border-color:var(--zr-customer-line)!important;
    }
    html.zr-customer-theme-v1 input:not([type="checkbox"]):not([type="radio"]),
    html.zr-customer-theme-v1 select,
    html.zr-customer-theme-v1 textarea{
      border-color:#dcd2ca!important;
      color:#312c29!important;
      background:#fff!important;
    }
    html.zr-customer-theme-v1 input:not([type="checkbox"]):not([type="radio"]):focus,
    html.zr-customer-theme-v1 select:focus,
    html.zr-customer-theme-v1 textarea:focus{
      outline:2px solid rgba(252,84,4,.16)!important;
      border-color:var(--zr-customer-orange)!important;
      box-shadow:0 0 0 3px rgba(252,84,4,.07)!important;
    }
    html.zr-customer-theme-v1 input[type="checkbox"],
    html.zr-customer-theme-v1 input[type="radio"]{accent-color:var(--zr-customer-orange)!important}
    html.zr-customer-theme-v1 .section-no,
    html.zr-customer-theme-v1 #zrInquiryFormStage .zr-inquiry-section-title .section-no{
      background:#fff0e5!important;
      color:var(--zr-customer-wine)!important;
    }
    html.zr-customer-theme-v1 .calc{
      border-color:#e2d5cc!important;
      background:#fffaf6!important;
    }

    /* Brand actions: vivid orange primary, wine / warm brown secondary. */
    html.zr-customer-theme-v1 .btn-primary,
    html.zr-customer-theme-v1 button.btn-primary,
    html.zr-customer-theme-v1 input.btn-primary{
      border-color:var(--zr-customer-orange)!important;
      background:var(--zr-customer-orange)!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      box-shadow:0 7px 16px rgba(252,84,4,.16)!important;
    }
    html.zr-customer-theme-v1 .btn-primary:hover,
    html.zr-customer-theme-v1 button.btn-primary:hover,
    html.zr-customer-theme-v1 input.btn-primary:hover{
      border-color:var(--zr-customer-orange-dark)!important;
      background:var(--zr-customer-orange-dark)!important;
    }
    html.zr-customer-theme-v1 .btn-soft{
      border:1px solid #ead7c9!important;
      background:#fff3e9!important;
      color:var(--zr-customer-wine)!important;
    }
    html.zr-customer-theme-v1 .btn-gray{
      border:1px solid #493029!important;
      background:var(--zr-customer-brown)!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
    }
    html.zr-customer-theme-v1 .btn-gray:hover{background:#2d1d17!important}
    html.zr-customer-theme-v1 .btn-danger{
      border-color:#7e262d!important;
      background:#7e262d!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
    }

    /* Every shared customer modal receives the same orange title bar. */
    html.zr-customer-theme-v1 .modal,
    html.zr-customer-theme-v1 .zr-customer-info-modal,
    html.zr-customer-theme-v1 .zr-customer-zoom,
    html.zr-customer-theme-v1 .zrgm32,
    html.zr-customer-theme-v1 .zrfinal31,
    html.zr-customer-theme-v1 .zr-guide-modal,
    html.zr-customer-theme-v1 .zr14-modal,
    html.zr-customer-theme-v1 #zrCustomerReturnHomeModal,
    html.zr-customer-theme-v1 .zr-cancel-select-modal{
      background:rgba(36,22,16,.64)!important;
      backdrop-filter:blur(2px);
    }
    html.zr-customer-theme-v1 .modal-card,
    html.zr-customer-theme-v1 .zr-customer-info-sheet,
    html.zr-customer-theme-v1 .zr-customer-zoom-card,
    html.zr-customer-theme-v1 .zrgm32-sheet,
    html.zr-customer-theme-v1 .zrfinal31-sheet,
    html.zr-customer-theme-v1 .zr-guide-sheet,
    html.zr-customer-theme-v1 .zr14-modal-card,
    html.zr-customer-theme-v1 .zr-return-sheet,
    html.zr-customer-theme-v1 .zr-cancel-select-sheet{
      border:1px solid #eaded5!important;
      border-radius:20px!important;
      background:#fff!important;
      box-shadow:0 26px 80px rgba(35,18,10,.28)!important;
    }
    html.zr-customer-theme-v1 .zr-modal-ux-header{
      min-height:58px!important;
      margin-bottom:18px!important;
      border-bottom:0!important;
      background:var(--zr-customer-orange)!important;
      color:#fff!important;
      box-shadow:0 5px 14px rgba(252,84,4,.13)!important;
    }
    html.zr-customer-theme-v1 .zr-modal-ux-header-title{
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      font-weight:900!important;
      letter-spacing:-.02em!important;
    }
    html.zr-customer-theme-v1 .zr-modal-ux-header-close{
      min-width:38px!important;
      min-height:36px!important;
      border:1px solid rgba(71,9,16,.12)!important;
      border-radius:9px!important;
      background:rgba(71,9,16,.07)!important;
      color:var(--zr-customer-wine)!important;
      -webkit-text-fill-color:var(--zr-customer-wine)!important;
      box-shadow:none!important;
    }
    html.zr-customer-theme-v1 .zr-modal-ux-header-close:hover{
      border-color:rgba(71,9,16,.18)!important;
      background:rgba(71,9,16,.13)!important;
    }
    html.zr-customer-theme-v1 .modal-actions{
      border-top-color:#eaded5!important;
    }
    html.zr-customer-theme-v1 .modal-actions .btn-primary,
    html.zr-customer-theme-v1 .modal-actions button[type="submit"]{
      border-color:var(--zr-customer-orange)!important;
      background:var(--zr-customer-orange)!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
    }
    html.zr-customer-theme-v1 .modal-actions .btn-gray,
    html.zr-customer-theme-v1 .modal-actions [data-close]{
      border-color:#38271e!important;
      background:#38271e!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
    }

    /* Custom popup shells which do not use the shared sticky modal header. */
    html.zr-customer-theme-v1 .zr-cancel-select-head{
      margin:-18px -18px 14px!important;
      padding:13px 16px!important;
      border-radius:19px 19px 0 0!important;
      background:var(--zr-customer-orange)!important;
    }
    html.zr-customer-theme-v1 .zr-cancel-select-head h2{color:#fff!important}
    html.zr-customer-theme-v1 .zr-cancel-select-close{
      border:1px solid rgba(71,9,16,.12)!important;
      background:rgba(71,9,16,.07)!important;
      color:var(--zr-customer-wine)!important;
    }

    /* Existing booking / customer guide pieces: remove the old green family. */
    html.zr-customer-theme-v1 #existingBookingList .zr-confirmed-emphasis{
      border-color:#f1bd96!important;
      background:#fff2e8!important;
      color:#8a3a08!important;
    }
    html.zr-customer-theme-v1 #existingBookingList .zr-booking-fact-label{
      color:var(--zr-customer-wine)!important;
    }
    html.zr-customer-theme-v1 #existingBookingList .zr-customer-card-actions{
      border-top-color:#eadfd7!important;
    }
    html.zr-customer-theme-v1 #existingBookingList .zr-customer-guide-action{
      border-color:#d9c5bb!important;
      background:#fffaf6!important;
      color:var(--zr-customer-wine)!important;
      box-shadow:0 3px 10px rgba(56,39,30,.07)!important;
    }
    html.zr-customer-theme-v1 #existingBookingList .zr-customer-guide-action:hover{background:#fff1e8!important}
    html.zr-customer-theme-v1 #existingBookingList .zr-customer-parking-action{
      border-color:#f0c29d!important;
      background:#fff4e9!important;
      color:#91400d!important;
      box-shadow:0 3px 10px rgba(56,39,30,.07)!important;
    }
    html.zr-customer-theme-v1 #existingBookingList .zr-customer-schedule-action{
      border-color:#d6c7bd!important;
      background:#f8f1ec!important;
      color:#634338!important;
      box-shadow:0 3px 10px rgba(56,39,30,.07)!important;
    }
    html.zr-customer-theme-v1 .zr-customer-schedule-pending b{color:var(--zr-customer-orange-dark)!important}
    html.zr-customer-theme-v1 .zr-cancel-select-status{
      background:#fff0e5!important;
      color:var(--zr-customer-wine)!important;
    }

    /* Return-home confirmation */
    html.zr-customer-theme-v1 #zrCustomerReturnHomeBtn{
      border-color:#d9c8bd!important;
      background:#fffaf6!important;
      color:var(--zr-customer-wine)!important;
    }
    html.zr-customer-theme-v1 #zrCustomerReturnHomeBtn:hover{background:#fff0e5!important}
    html.zr-customer-theme-v1 #zrCustomerReturnHomeNo{
      border-color:#d7c9c0!important;
      background:#f5eee9!important;
      color:#5c4740!important;
    }
    html.zr-customer-theme-v1 #zrCustomerReturnHomeYes{
      border-color:var(--zr-customer-orange)!important;
      background:var(--zr-customer-orange)!important;
      color:#fff!important;
    }

    /* Inquiry / completion */
    html.zr-customer-theme-v1 #zrInquiryFormStage .zr-inquiry-section{
      border-color:#e4d8cf!important;
      background:#fffdfb!important;
    }
    html.zr-customer-theme-v1 #zrInquiryReviewStage .zr-review-card{
      border-color:#e4d8cf!important;
      background:#fffaf6!important;
    }
    html.zr-customer-theme-v1 #zrInquiryCompleteStage .zr-complete-mark{
      background:#fff0e5!important;
      color:var(--zr-customer-orange-dark)!important;
    }

    /* Common status / progress accents that inherited the original green theme. */
    html.zr-customer-theme-v1 .status.confirmed,
    html.zr-customer-theme-v1 .status.approved,
    html.zr-customer-theme-v1 .status.done{
      border-color:#f0bf9a!important;
      background:#fff1e6!important;
      color:#8b3e0c!important;
    }
    html.zr-customer-theme-v1 progress{accent-color:var(--zr-customer-orange)!important}

    @media(max-width:800px){
      html.zr-customer-theme-v1 main{padding-left:14px!important;padding-right:14px!important}
      html.zr-customer-theme-v1 #startView{
        min-height:0!important;
        padding:22px 14px!important;
        border-radius:22px!important;
      }
      html.zr-customer-theme-v1 #startView>.card,
      html.zr-customer-theme-v1 #startView .layout>.card,
      html.zr-customer-theme-v1 #startView .summary.card{
        border-radius:19px!important;
        box-shadow:0 16px 34px rgba(25,12,7,.18)!important;
      }
      html.zr-customer-theme-v1 .modal,
      html.zr-customer-theme-v1 .zr-customer-info-modal,
      html.zr-customer-theme-v1 .zr-customer-zoom,
      html.zr-customer-theme-v1 .zrgm32,
      html.zr-customer-theme-v1 .zrfinal31,
      html.zr-customer-theme-v1 .zr-guide-modal,
      html.zr-customer-theme-v1 .zr14-modal,
      html.zr-customer-theme-v1 #zrCustomerReturnHomeModal,
      html.zr-customer-theme-v1 .zr-cancel-select-modal{padding:10px!important}
      html.zr-customer-theme-v1 .modal-card,
      html.zr-customer-theme-v1 .zr-customer-info-sheet,
      html.zr-customer-theme-v1 .zr-customer-zoom-card,
      html.zr-customer-theme-v1 .zrgm32-sheet,
      html.zr-customer-theme-v1 .zrfinal31-sheet,
      html.zr-customer-theme-v1 .zr-guide-sheet,
      html.zr-customer-theme-v1 .zr14-modal-card,
      html.zr-customer-theme-v1 .zr-return-sheet,
      html.zr-customer-theme-v1 .zr-cancel-select-sheet{border-radius:17px!important}
      html.zr-customer-theme-v1 .zr-modal-ux-header{min-height:54px!important}
      html.zr-customer-theme-v1 .modal-actions button{min-height:48px!important}
    }

    @media(max-width:520px){
      html.zr-customer-theme-v1 #startView{margin-left:-2px!important;margin-right:-2px!important;padding:18px 10px!important}
      html.zr-customer-theme-v1 #startView #startManager,
      html.zr-customer-theme-v1 #startView #startContact,
      html.zr-customer-theme-v1 #startView #lookupBooking{min-height:50px!important}
      html.zr-customer-theme-v1 .zr-cancel-select-head{margin:-15px -15px 13px!important}
    }
  `;
  document.head.appendChild(style);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
