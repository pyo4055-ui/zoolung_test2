(()=>{
'use strict';
if(window.__ZR_CUSTOMER_RUNTIME_LOADER_V1)return;
window.__ZR_CUSTOMER_RUNTIME_LOADER_V1=true;

function loadScript(id,src){
  return new Promise((resolve,reject)=>{
    if(window[id]||document.getElementById(id)){resolve();return}
    const s=document.createElement('script');
    s.id=id;s.async=false;s.src=src;
    s.onload=()=>resolve();
    s.onerror=()=>{s.remove();reject(new Error(`고객 기능을 불러오지 못했습니다: ${src}`))};
    document.body.appendChild(s);
  });
}

function installLegacyGuideGuards(){
  for(const id of ['zrCustomerVisitGuideV16','zrCustomerVisitGuideFixV20']){
    if(document.getElementById(id))continue;
    const guard=document.createElement('script');
    guard.id=id;guard.type='application/json';guard.dataset.zrLegacyGuideGuard='1';
    document.body.appendChild(guard);
  }
}
function takeLegacyGuideGuard(id){
  const el=document.getElementById(id);
  if(el?.dataset?.zrLegacyGuideGuard==='1'){el.remove();return true}
  return false;
}

async function loadCustomerBookingUx(){
  if(window.__ZR_CUSTOMER_BOOKING_UX_V24)return;
  await loadScript('zrCustomerBookingUxV24','./customer_booking_ux_v24.js?v=31');
}

async function loadCustomerVisitGuideV16(){
  if(window.__ZR_CUSTOMER_VISIT_GUIDE_V16){takeLegacyGuideGuard('zrCustomerVisitGuideV16');return}
  takeLegacyGuideGuard('zrCustomerVisitGuideV16');
  await loadScript('zrCustomerVisitGuideV16','./customer_visit_guide_v16.js?v=31');
}

function installPlayZooGuideGuard(){
  if(window.__ZR_PLAY_ZOO_GUIDE_GUARD_V27)return;
  window.__ZR_PLAY_ZOO_GUIDE_GUARD_V27=true;
  document.addEventListener('change',e=>{
    const id=e.target?.id||'';
    if(id!=='playStart'&&id!=='playDuration')return;
    document.getElementById('zrGuideModal')?.classList.add('hidden');
  },true);
}

async function loadCustomerGuideFixV20(){
  if(window.__ZR_CUSTOMER_GUIDE_FIX_V20){takeLegacyGuideGuard('zrCustomerVisitGuideFixV20');return}
  takeLegacyGuideGuard('zrCustomerVisitGuideFixV20');
  await loadScript('zrCustomerVisitGuideFixV20','./customer_visit_guide_fix_v20.js?v=31');
}

async function loadParkingInfo(){
  if(window.__ZR_PARKING_INFO_V31)return;
  await loadScript('zrParkingInfoV31','./parking_info_v31.js?v=32');
}

function installFinalConfirmBridge(){
  if(window.__ZR_CUSTOMER_FINAL_CONFIRM_BRIDGE_V1)return;
  window.__ZR_CUSTOMER_FINAL_CONFIRM_BRIDGE_V1=true;
  window.addEventListener('click',e=>{
    const btn=e.target?.closest?.('#zrFinalOkV31');
    if(!btn)return;
    const modal=btn.closest?.('#zrFinalGuideModalV31');
    if(!modal||modal.classList.contains('hidden'))return;
    const handler=btn.onclick;
    if(typeof handler!=='function')return;
    e.preventDefault();
    e.stopImmediatePropagation();
    try{handler.call(btn,e)}catch(err){console.error('customer final confirm bridge',err)}
  },true);
}

async function loadCustomerModules(){
  // Explicit customer-only dependency list. No admin tabs, settlement, Excel,
  // schedule editor, warning dashboard or cleanup workspace are loaded here.
  const modules=[
    ['zrCustomerViewTrackingV1','./customer_view_tracking_v1.js?v=3'],
    ['zrCustomerLookupActionsV1','./customer_lookup_actions_v1.js?v=2'],
    ['zrCustomerCancelCommitV1','./customer_cancel_commit_v1.js?v=2'],
    ['zrCustomerInfoTabsV1Script','./customer_info_tabs_v1.js?v=4'],
    ['zrCustomerStatusBannerV1','./customer_status_banner_v1.js?v=1'],
    ['zrCustomerTimeGuideGuardV2','./customer_time_guide_guard_v2.js?v=1'],
    ['zrCustomerPlaygroundBookingGuardV1','./customer_playground_booking_guard_v1.js?v=1'],
    ['zrCustomerHolidayBookingSettingV1','./customer_holiday_booking_setting_v1.js?v=1'],
    ['zrCustomerReturnHomeV1','./customer_return_home_v1.js?v=2'],
    ['zrCustomerInquiryVisitV1','./customer_inquiry_visit_v1.js?v=5'],
    ['zrCustomerInquiryValidationV1','./customer_inquiry_validation_v1.js?v=2'],
    ['zrCustomerReservationChangeRequestV1','./customer_reservation_change_request_v1.js?v=2'],
    ['zrCustomerGroupMinimumV1','./customer_group_minimum_v1.js?v=1'],
    ['zrCustomerScheduleScript','./customer_schedule_view_v3.js?v=12'],
    ['zrCustomerBookingRulesScript','./customer_booking_rules_v3.js?v=3'],
    ['zrCustomerValidationFocusV1','./customer_validation_focus_v1.js?v=2'],
    ['zrCustomerScheduleUiV5','./customer_schedule_ui_v5.js?v=5'],
    ['zrCustomerVisualThemeV1','./customer_visual_theme_v1.js?v=3']
  ];
  for(const [id,src] of modules)await loadScript(id,src);
}

function revealPage(){
  requestAnimationFrame(()=>requestAnimationFrame(()=>document.getElementById('zrPreBootStyle')?.remove()));
}
function signalReady(){
  window.__ZR_CUSTOMER_RUNTIME_READY=true;
  try{document.dispatchEvent(new CustomEvent('zr:customer-runtime-ready'))}catch{}
  if(window.zrReservationFirebase){revealPage();return}
  const started=Date.now();
  const t=setInterval(()=>{
    if(window.zrReservationFirebase||Date.now()-started>=7000){clearInterval(t);revealPage()}
  },100);
}

installLegacyGuideGuards();
(async()=>{
  try{
    await loadCustomerBookingUx();
    await loadCustomerVisitGuideV16();
    installPlayZooGuideGuard();
    await loadCustomerGuideFixV20();
    await loadParkingInfo();
    installFinalConfirmBridge();
    await loadCustomerModules();
  }catch(e){
    console.error('customer runtime load failed',e);
    try{window.toast?.('고객 예약 기능 일부를 불러오지 못했습니다. 새로고침해주세요.')}catch{}
  }finally{
    signalReady();
  }
})();
})();
