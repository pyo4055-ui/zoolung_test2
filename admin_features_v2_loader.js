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

const fetchText=async(src,message)=>{
  const r=await fetch(src,{cache:'no-store'});
  if(!r.ok)throw new Error(message);
  return r.text();
};
const evalText=code=>(0,eval)(code);
const evalFile=async(src,message)=>evalText(await fetchText(src,message));

async function loadAdminBase(){
  const parts=['admin2_part1.txt','admin2_part2.txt','admin2_part3.txt','admin2_part4.txt'];
  const rs=await Promise.all(parts.map(u=>fetch(`./${u}?v=2`,{cache:'no-store'})));
  if(rs.some(r=>!r.ok))throw new Error('관리자 확장 기능 데이터를 불러오지 못했습니다.');
  evalText((await Promise.all(rs.map(r=>r.text()))).join(''));
}

async function loadAdminPatchChain(){
  const chain=[
    ['./admin_features_v3_patch.js?v=3','관리자 v3 패치를 불러오지 못했습니다.'],
    ['./admin_features_v3_excel_fix.js?v=31','식사 엑셀 보정 패치를 불러오지 못했습니다.'],
    ['./admin_features_v4_patch.js?v=4','관리자 v4 패치를 불러오지 못했습니다.'],
    ['./admin_features_v5_patch.js?v=5','관리자 v5 패치를 불러오지 못했습니다.'],
    ['./admin_features_v6_patch.js?v=6','관리자 v6 패치를 불러오지 못했습니다.'],
    ['./admin_features_v7_patch.js?v=7','관리자 v7 패치를 불러오지 못했습니다.'],
    ['./admin_features_v8_patch.js?v=8','관리자 v8 패치를 불러오지 못했습니다.'],
    ['./admin_features_v9_patch.js?v=9','관리자 v9 패치를 불러오지 못했습니다.']
  ];
  for(const [src,message] of chain)await evalFile(src,message);
}

async function loadCustomerBookingUx(){
  if(window.__ZR_CUSTOMER_BOOKING_UX_V24)return;
  await evalFile('./customer_booking_ux_v24.js?v=31','고객 예약 입력 보정 패치를 불러오지 못했습니다.');
}

async function loadCustomerVisitGuideV16(){
  if(document.getElementById('zrCustomerVisitGuideV16'))return;
  let guide16=await fetchText('./customer_visit_guide_v16.js?v=31','고객 방문 안내 기능을 불러오지 못했습니다.');
  const fnStart=guide16.indexOf('function isEntryControl(el){');
  const fnEnd=guide16.indexOf('\nfunction findVisibleEntry()',fnStart);
  if(fnStart<0||fnEnd<0)throw new Error('고객 방문 안내 시간 판별 함수를 찾지 못했습니다.');
  guide16=guide16.slice(0,fnStart)+
    "function isEntryControl(el){\n  if(!el?.matches?.('select,input')||el.closest('#adminView'))return false;\n  return el.id==='entryTime';\n}"+
    guide16.slice(fnEnd);
  const openNeedle='function openCustomerGuide(control){';
  if(!guide16.includes(openNeedle))throw new Error('고객 방문 안내 팝업 함수를 찾지 못했습니다.');
  guide16=guide16.replace(openNeedle,"function openCustomerGuide(control){if(control?.id!=='entryTime')return;");
  guide16=guide16.replace('function interceptBooking(ev){',"function interceptBooking(ev){if(window.__ZR_FINAL_DIRECT_SUBMIT)return;");
  guide16=guide16.replace('function interceptSubmit(ev){',"function interceptSubmit(ev){if(window.__ZR_FINAL_DIRECT_SUBMIT)return;");
  const marker=document.createElement('script');
  marker.id='zrCustomerVisitGuideV16';
  marker.type='application/json';
  document.body.appendChild(marker);
  evalText(guide16);
}

function installPlayZooGuideGuard(){
  if(window.__ZR_PLAY_ZOO_GUIDE_GUARD_V27)return;
  window.__ZR_PLAY_ZOO_GUIDE_GUARD_V27=true;
  document.addEventListener('change',e=>{
    const id=e.target?.id||'';
    if(id!=='playStart'&&id!=='playDuration')return;
    setTimeout(()=>{
      const m=document.getElementById('zrGuideModal');
      if(m&&!m.classList.contains('hidden'))m.classList.add('hidden');
    },45);
  },true);
}

async function loadCustomerGuideFixV20(){
  if(window.__ZR_CUSTOMER_GUIDE_FIX_V20)return;
  let guide20=await fetchText('./customer_visit_guide_fix_v20.js?v=31','고객 안내 분리 기능을 불러오지 못했습니다.');
  const playAckNeedle='function playAcknowledged(){';
  if(!guide20.includes(playAckNeedle))throw new Error('놀이터 안내 확인 함수를 찾지 못했습니다.');
  guide20=guide20.replace(playAckNeedle,"function playAcknowledged(){if(window.__ZR_FINAL_DIRECT_SUBMIT)return true;");
  evalText(guide20);
}

function loadParkingInfo(){
  if(document.getElementById('zrParkingInfoV31'))return;
  const p=document.createElement('script');
  p.id='zrParkingInfoV31';
  p.async=false;
  p.src='./parking_info_v31.js?v=32';
  document.body.appendChild(p);
}

function loadCustomerQuickTools(){
  const tools=[
    ['zrCustomerLookupActionsV1','./customer_lookup_actions_v1.js?v=2'],
    ['zrCustomerInfoTabsV1Script','./customer_info_tabs_v1.js?v=4'],
    ['zrCustomerGuideMapAdminUiV2','./customer_guide_map_admin_ui_v2.js?v=1'],
    ['zrCustomerTimeGuideGuardV2','./customer_time_guide_guard_v2.js?v=1'],
    ['zrAdminCancelVisibilityV1','./admin_cancel_visibility_v1.js?v=1']
  ];
  for(const [id,src] of tools){
    if(document.getElementById(id))continue;
    const s=document.createElement('script');
    s.id=id;s.async=false;s.src=src;document.body.appendChild(s);
  }
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

loadCustomerQuickTools();

(async()=>{
  try{
    await loadAdminBase();
    try{
      await loadAdminPatchChain();
      await loadCustomerBookingUx();
      await loadCustomerVisitGuideV16();
      installPlayZooGuideGuard();
      await loadCustomerGuideFixV20();
      loadParkingInfo();
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
