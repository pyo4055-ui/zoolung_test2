(()=>{
'use strict';
if(window.__ZR_CUSTOMER_RUNTIME_LOADER_V1)return;
window.__ZR_CUSTOMER_RUNTIME_LOADER_V1=true;

const fetchText=async(src,message)=>{
  const r=await fetch(src,{cache:'no-store'});
  if(!r.ok)throw new Error(message);
  return r.text();
};
const evalText=code=>(0,eval)(code);
const evalFile=async(src,message)=>evalText(await fetchText(src,message));

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
  await evalFile('./customer_booking_ux_v24.js?v=31','고객 예약 입력 보정 기능을 불러오지 못했습니다.');
}

async function loadCustomerVisitGuideV16(){
  if(window.__ZR_CUSTOMER_VISIT_GUIDE_V16){takeLegacyGuideGuard('zrCustomerVisitGuideV16');return}
  const existing=document.getElementById('zrCustomerVisitGuideV16');
  if(existing&&!takeLegacyGuideGuard('zrCustomerVisitGuideV16'))throw new Error('예전 고객 방문 안내가 이미 로드되어 새 안내를 적용할 수 없습니다.');
  let guide16=await fetchText('./customer_visit_guide_v16.js?v=31','고객 방문 안내 기능을 불러오지 못했습니다.');
  const fnStart=guide16.indexOf('function isEntryControl(el){');
  const fnEnd=guide16.indexOf('\nfunction findVisibleEntry()',fnStart);
  if(fnStart<0||fnEnd<0)throw new Error('고객 방문 안내 시간 판별 함수를 찾지 못했습니다.');
  guide16=guide16.slice(0,fnStart)+
    "function isEntryControl(el){\n  if(!el?.matches?.('select,input')||el.closest('#adminView'))return false;\n  return el.id==='entryTime';\n}"+
    guide16.slice(fnEnd);
  const openNeedle='function openCustomerGuide(control){';
  if(!guide16.includes(openNeedle))throw new Error('고객 방문 안내 팝업 함수를 찾지 못했습니다.');
  guide16=guide16.replace(openNeedle,"function openCustomerGuide(control){if(control?.id!=='entryTime')return;const final=document.getElementById('zrFinalGuideModalV31');if(final&&!final.classList.contains('hidden'))return;");
  guide16=guide16.replace('function interceptBooking(ev){',"function interceptBooking(ev){if(window.__ZR_FINAL_DIRECT_SUBMIT)return;");
  guide16=guide16.replace('function interceptSubmit(ev){',"function interceptSubmit(ev){if(window.__ZR_FINAL_DIRECT_SUBMIT)return;");
  const marker=document.createElement('script');marker.id='zrCustomerVisitGuideV16';marker.type='application/json';document.body.appendChild(marker);
  evalText(guide16);
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
  const existing=document.getElementById('zrCustomerVisitGuideFixV20');
  if(existing&&!takeLegacyGuideGuard('zrCustomerVisitGuideFixV20'))throw new Error('예전 놀이터 안내가 이미 로드되어 새 안내를 적용할 수 없습니다.');
  let guide20=await fetchText('./customer_visit_guide_fix_v20.js?v=31','고객 안내 분리 기능을 불러오지 못했습니다.');
  const playAckNeedle='function playAcknowledged(){';
  if(!guide20.includes(playAckNeedle))throw new Error('놀이터 안내 확인 함수를 찾지 못했습니다.');
  guide20=guide20.replace(playAckNeedle,"function playAcknowledged(){if(window.__ZR_FINAL_DIRECT_SUBMIT)return true;");
  const playOpenNeedle='function openPlayGuide(){';
  if(!guide20.includes(playOpenNeedle))throw new Error('놀이터 안내 팝업 함수를 찾지 못했습니다.');
  guide20=guide20.replace(playOpenNeedle,"function openPlayGuide(){document.getElementById('zrGuideModal')?.classList.add('hidden');const final=document.getElementById('zrFinalGuideModalV31');if(final&&!final.classList.contains('hidden'))return;");
  evalText(guide20);
}

async function loadParkingInfo(){
  if(window.__ZR_PARKING_INFO_V31)return;
  if(document.getElementById('zrParkingInfoV31'))return;
  let parking=await fetchText('./parking_info_v31.js?v=32','주차 및 최종확인 기능을 불러오지 못했습니다.');
  const finalBindNeedle="function bindFinal(){\n  window.addEventListener('click',e=>{";
  if(!parking.includes(finalBindNeedle))throw new Error('예약 최종확인 이벤트 함수를 찾지 못했습니다.');
  parking=parking.replace(finalBindNeedle,"function bindFinal(){\n  document.addEventListener('click',e=>{");
  const marker=document.createElement('script');marker.id='zrParkingInfoV31';marker.type='application/json';document.body.appendChild(marker);
  evalText(parking);
}

async function loadCustomerModules(){
  // Explicit customer-only dependency list. No admin tabs, settlement, Excel,
  // schedule editor, warning dashboard or cleanup workspace are loaded here.
  const modules=[
    ['zrCustomerViewTrackingV1','./customer_view_tracking_v1.js?v=3'],
    ['zrCustomerLookupActionsV1','./customer_lookup_actions_v1.js?v=2'],
    ['zrCustomerInfoTabsV1Script','./customer_info_tabs_v1.js?v=4'],
    ['zrCustomerStatusBannerV1','./customer_status_banner_v1.js?v=1'],
    ['zrCustomerTimeGuideGuardV2','./customer_time_guide_guard_v2.js?v=1'],
    ['zrCustomerPlaygroundBookingGuardV1','./customer_playground_booking_guard_v1.js?v=1'],
    ['zrCustomerHolidayBookingSettingV1','./customer_holiday_booking_setting_v1.js?v=1'],
    ['zrCustomerReturnHomeV1','./customer_return_home_v1.js?v=1'],
    ['zrCustomerInquiryVisitV1','./customer_inquiry_visit_v1.js?v=1'],
    ['zrCustomerGroupMinimumV1','./customer_group_minimum_v1.js?v=1'],
    ['zrCustomerScheduleScript','./customer_schedule_view_v3.js?v=12'],
    ['zrCustomerBookingRulesScript','./customer_booking_rules_v3.js?v=3'],
    ['zrCustomerScheduleUiV5','./customer_schedule_ui_v5.js?v=5']
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
    await loadCustomerModules();
  }catch(e){
    console.error('customer runtime load failed',e);
    try{window.toast?.('고객 예약 기능 일부를 불러오지 못했습니다. 새로고침해주세요.')}catch{}
  }finally{
    signalReady();
  }
})();
})();
