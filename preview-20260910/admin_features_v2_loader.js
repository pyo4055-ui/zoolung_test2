(()=>{
'use strict';
if(window.__ZR_ADMIN_REFACTOR_LOADER)return;
window.__ZR_ADMIN_REFACTOR_LOADER=true;

function installBootShield(){
  if(document.getElementById('zrRefactorBootShield'))return;
  const style=document.createElement('style');
  style.id='zrRefactorBootShieldStyle';
  style.textContent='#zrRefactorBootShield{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:28px;box-sizing:border-box;background:#f6f7f4;font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif;color:#1f2a23}#zrRefactorBootShield .zrbs-box{background:#fff;border:1px solid #dfe5df;border-radius:18px;padding:26px;max-width:420px;width:100%;text-align:center;box-shadow:0 6px 24px rgba(30,50,36,.07)}#zrRefactorBootShield .zrbs-spin{width:34px;height:34px;border:4px solid #e9f3ed;border-top-color:#2f6b4f;border-radius:50%;margin:0 auto 16px;animation:zrbs-spin .8s linear infinite}#zrRefactorBootShield small{color:#6d756f;line-height:1.6}@keyframes zrbs-spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(style);
  const shield=document.createElement('div');
  shield.id='zrRefactorBootShield';
  shield.setAttribute('role','status');
  shield.innerHTML='<div class="zrbs-box"><div class="zrbs-spin"></div><b>주렁주렁 단체예약 테스트</b><br><small>페이지를 준비하는 중입니다.</small></div>';
  document.body.appendChild(shield);
}
function removeBootShield(){
  document.getElementById('zrRefactorBootShield')?.remove();
  document.getElementById('zrRefactorBootShieldStyle')?.remove();
}
function bridgeStaffReady(){
  const z=window.zrReservationFirebase;
  return !!z?.db&&!!z?.auth&&!!z?.isStaff?.()&&!!z.auth.currentUser;
}
function waitForStaffBridge(timeout=7000){
  if(bridgeStaffReady())return Promise.resolve(true);
  return new Promise(resolve=>{
    const started=Date.now();
    const t=setInterval(()=>{
      if(bridgeStaffReady()){clearInterval(t);resolve(true);return}
      if(Date.now()-started>=timeout){clearInterval(t);resolve(false)}
    },120);
  });
}
function installScheduleAuthGuard(){
  if(window.__ZR_SCHEDULE_AUTH_GUARD)return;
  window.__ZR_SCHEDULE_AUTH_GUARD=true;
  document.addEventListener('click',e=>{
    const btn=e.target?.closest?.('#tab-schedule [data-apply],#tab-schedule [data-publish]');
    if(!btn)return;
    if(btn.dataset.zrAuthRetry==='1'){delete btn.dataset.zrAuthRetry;return}
    if(bridgeStaffReady())return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if(btn.dataset.zrAuthWaiting==='1')return;
    btn.dataset.zrAuthWaiting='1';
    const old=btn.textContent;
    btn.disabled=true;
    btn.textContent='DB 연결 확인 중...';
    waitForStaffBridge().then(ok=>{
      delete btn.dataset.zrAuthWaiting;
      btn.disabled=false;
      btn.textContent=old;
      if(ok){btn.dataset.zrAuthRetry='1';btn.click();return}
      try{if(typeof toast==='function')toast('관리자 DB 연결이 완료되지 않았습니다. 관리자 로그인을 다시 확인해주세요.')}catch{}
    });
  },true);
  const repair=setInterval(()=>{
    if(!bridgeStaffReady())return;
    const sec=document.getElementById('tab-schedule');
    const status=document.getElementById('zrscStatus');
    if(!sec||sec.classList.contains('hidden')||!status)return;
    if(status.textContent.includes('DB 로그인 필요'))document.getElementById('zrScheduleTabBtn')?.click();
  },400);
  setTimeout(()=>clearInterval(repair),30000);
}
installBootShield();
installScheduleAuthGuard();

const loadScript=(id,src)=>new Promise((resolve,reject)=>{
  if(document.getElementById(id)){resolve();return}
  const s=document.createElement('script');
  s.id=id;s.async=false;s.src=src;
  s.onload=()=>resolve();
  s.onerror=()=>{s.remove();reject(new Error(`관리자 기능을 불러오지 못했습니다: ${src}`))};
  document.body.appendChild(s);
});

function installLegacyGuideGuards(){
  for(const id of ['zrCustomerVisitGuideV16','zrCustomerVisitGuideFixV20']){
    if(document.getElementById(id))continue;
    const guard=document.createElement('script');
    guard.id=id;
    guard.type='application/json';
    guard.dataset.zrLegacyGuideGuard='1';
    document.body.appendChild(guard);
  }
}
function takeLegacyGuideGuard(id){
  const el=document.getElementById(id);
  if(el?.dataset?.zrLegacyGuideGuard==='1'){el.remove();return true}
  return false;
}

async function loadAdminBase(){
  await loadScript('zrAdminBaseRuntime','./admin_base_runtime.js?v=1');
}

async function loadAdminPatchChain(){
  await loadScript('zrAdminPatchBundle','./admin_features_patch_bundle.js?v=1');
  await new Promise(resolve=>setTimeout(resolve,0));
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

function loadCustomerQuickTools(){
  const tools=[
    ['zrCustomerLookupActionsV1','./customer_lookup_actions_v1.js?v=2'],
    ['zrCustomerInfoTabsV1Script','./customer_info_tabs_v1.js?v=4'],
    ['zrCustomerStatusBannerV1','./customer_status_banner_v1.js?v=1'],
    ['zrCustomerGuideMapAdminUiV2','./customer_guide_map_admin_ui_v2.js?v=1'],
    ['zrCustomerTimeGuideGuardV2','./customer_time_guide_guard_v2.js?v=1'],
    ['zrCustomerPlaygroundBookingGuardV1','./customer_playground_booking_guard_v1.js?v=2'],
    ['zrCustomerHolidayBookingSettingV1','./customer_holiday_booking_setting_v1.js?v=1'],
    ['zrCustomerReturnHomeV1','./customer_return_home_v1.js?v=2'],
    ['zrAdminCancelVisibilityV1','./admin_cancel_visibility_v1.js?v=1'],
    ['zrAdminTabActiveFixV1','./admin_tab_active_fix_v1.js?v=2'],
    ['zrAdminActivityFilterFixV1','./admin_activity_filter_fix_v1.js?v=3']
  ];
  for(const [id,src] of tools){
    if(document.getElementById(id))continue;
    const s=document.createElement('script');
    s.id=id;s.async=false;s.src=src;document.body.appendChild(s);
  }
}

function loadAdminSearchEnhancements(){
  if(document.getElementById('zrAdminGroupSearchV2'))return;
  const s=document.createElement('script');
  s.id='zrAdminGroupSearchV2';
  s.async=false;s.src='./admin_group_search_v2.js?v=2';document.body.appendChild(s);
}

function installLegacyScheduleFallback(){
  const waitSchedule=setInterval(()=>{
    if(!window.zrReservationFirebase)return;
    clearInterval(waitSchedule);
    if(document.getElementById('zrAdminScheduleScript'))return;
    const s=document.createElement('script');
    s.id='zrAdminScheduleScript';
    s.src='./admin_schedule_tab.js?v=1';
    document.body.appendChild(s);
  },300);
  setTimeout(()=>clearInterval(waitSchedule),15000);
}

function revealPage(){
  requestAnimationFrame(()=>requestAnimationFrame(()=>{document.getElementById('zrPreBootStyle')?.remove();removeBootShield()}));
}
function signalReady(){
  window.__ZR_ADMIN_REFACTOR_READY=true;
  try{document.dispatchEvent(new CustomEvent('zr:admin-runtime-ready'))}catch{}
  if(window.zrReservationFirebase){revealPage();return}
  const started=Date.now();
  const t=setInterval(()=>{
    if(window.zrReservationFirebase||Date.now()-started>=7000){clearInterval(t);revealPage()}
  },100);
}

installLegacyGuideGuards();
loadCustomerQuickTools();
loadAdminSearchEnhancements();

(async()=>{
  try{
    await loadAdminBase();
    try{
      await loadAdminPatchChain();
      await loadCustomerBookingUx();
      await loadCustomerVisitGuideV16();
      installPlayZooGuideGuard();
      await loadCustomerGuideFixV20();
      await loadParkingInfo();
      installLegacyScheduleFallback();
    }catch(e3){
      console.error('admin latest patch load failed',e3);
      if(typeof toast==='function')toast('최신 관리자 기능 일부를 불러오지 못했습니다.');
    }
  }catch(e){
    console.error('admin v2 patch load failed',e);
    if(typeof toast==='function')toast('관리자 확장 기능 로딩에 실패했습니다.');
  }finally{
    signalReady();
  }
})();
})();
