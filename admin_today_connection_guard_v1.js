(()=>{
'use strict';
if(window.__ZR_ADMIN_TODAY_CONNECTION_GUARD_V1)return;
window.__ZR_ADMIN_TODAY_CONNECTION_GUARD_V1=true;

const STAFF_EMAIL='zoolung09@zoolungzoolung.com';
const $=id=>document.getElementById(id);
let retryTimer=0,watchTimer=0,lastLoadingAt=0,lastRetryAt=0,retryCount=0,lastDate='';
let defaultTodayOpened=false,defaultTodayTimer=0;

function injectStyle(){
  if($('zrAdminTodayConnectionGuardStyleV1'))return;
  const s=document.createElement('style');
  s.id='zrAdminTodayConnectionGuardStyleV1';
  s.textContent=`
    html.zr-admin-shell-mounted #adminView #tab-today #zrTodayNow,
    html.zr-admin-shell-mounted #adminView #tab-today #zrTodayNow.btn-soft,
    html.zr-admin-shell-mounted #adminView #tab-today #zrTodayNow.zr-safari-role-current,
    html.zr-admin-shell-mounted #adminView button.zr-safari-role-current.btn-soft{
      background:var(--zr-v3-green,#004b2a)!important;
      border:1.5px solid var(--zr-v3-green,#004b2a)!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      opacity:1!important;
      visibility:visible!important;
      box-shadow:none!important;
    }
    html.zr-admin-shell-mounted #adminView #tab-today #zrTodayNow:hover,
    html.zr-admin-shell-mounted #adminView button.zr-safari-role-current.btn-soft:hover{
      background:var(--zr-v3-green-dark,#003b21)!important;
      border-color:var(--zr-v3-green-dark,#003b21)!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
    }
    html.zr-admin-shell-mounted #adminView button.zr-safari-role-date-nav.btn-gray{
      background:#fff!important;
      border:1.5px solid var(--zr-v3-green,#004b2a)!important;
      color:var(--zr-v3-green,#004b2a)!important;
      -webkit-text-fill-color:var(--zr-v3-green,#004b2a)!important;
      opacity:1!important;
      visibility:visible!important;
    }
    html.zr-admin-shell-mounted #adminView #tab-calendar button.zr-calendar-current-month-fix{
      background:var(--zr-v3-green,#004b2a)!important;
      border:1.5px solid var(--zr-v3-green,#004b2a)!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      opacity:1!important;
      visibility:visible!important;
      box-shadow:none!important;
    }
    html.zr-admin-shell-mounted #adminView #tab-calendar button.zr-calendar-current-month-fix:hover{
      background:var(--zr-v3-green-dark,#003b21)!important;
      border-color:var(--zr-v3-green-dark,#003b21)!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
    }
    html.zr-admin-shell-mounted #adminView #tab-calendar #adminCalendar .weekday{
      min-height:34px!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      margin:0 3px 8px!important;
      border:1px solid #ded5cc!important;
      border-radius:9px!important;
      background:#fbf8f3!important;
      color:#4e4741!important;
      font-weight:900!important;
      box-sizing:border-box!important;
    }
    html.zr-admin-shell-mounted #adminView #tab-calendar #adminCalendar .weekday.zr-cal-sun{
      background:var(--zr-v3-coral-soft,#fff0ec)!important;
      border-color:#efc8c1!important;
      color:var(--zr-v3-coral,#bd5548)!important;
    }
    html.zr-admin-shell-mounted #adminView #tab-calendar #adminCalendar .weekday.zr-cal-sat{
      background:var(--zr-v3-blue-soft,#edf6fb)!important;
      border-color:#c7ddea!important;
      color:var(--zr-v3-blue,#2f6b86)!important;
    }

    /* Schedule month controls: same date-navigation language as every other admin screen. */
    html.zr-admin-shell-mounted #adminView #tab-schedule button.zr-schedule-date-nav-fix{
      min-width:38px!important;
      min-height:38px!important;
      background:#fff!important;
      border:1.5px solid var(--zr-v3-green,#004b2a)!important;
      border-radius:10px!important;
      color:var(--zr-v3-green,#004b2a)!important;
      -webkit-text-fill-color:var(--zr-v3-green,#004b2a)!important;
      box-shadow:none!important;
      opacity:1!important;
    }
    html.zr-admin-shell-mounted #adminView #tab-schedule button.zr-schedule-date-nav-fix:hover{
      background:var(--zr-v3-green-soft,#eef6f1)!important;
      border-color:var(--zr-v3-green,#004b2a)!important;
      color:var(--zr-v3-green-dark,#003b21)!important;
      -webkit-text-fill-color:var(--zr-v3-green-dark,#003b21)!important;
    }
    html.zr-admin-shell-mounted #adminView #tab-schedule button.zr-schedule-export-fix{
      background:#fff!important;
      border:1.5px solid var(--zr-v3-green,#004b2a)!important;
      color:var(--zr-v3-green,#004b2a)!important;
      -webkit-text-fill-color:var(--zr-v3-green,#004b2a)!important;
      box-shadow:none!important;
      opacity:1!important;
    }
    html.zr-admin-shell-mounted #adminView #tab-schedule button.zr-schedule-export-fix:hover,
    html.zr-admin-shell-mounted #adminView #tab-schedule button.zr-schedule-export-fix:focus-visible{
      background:var(--zr-v3-green,#004b2a)!important;
      border-color:var(--zr-v3-green,#004b2a)!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
    }

    /* Right shared memo: mirror the same navigation/action colors. */
    html.zr-admin-shell-mounted #zrAdminDailyMemoV1 .zr-admin-daily-memo-nav{
      background:#fff!important;
      border:1.5px solid var(--zr-v3-green,#004b2a)!important;
      color:var(--zr-v3-green,#004b2a)!important;
      -webkit-text-fill-color:var(--zr-v3-green,#004b2a)!important;
      box-shadow:none!important;
    }
    html.zr-admin-shell-mounted #zrAdminDailyMemoV1 .zr-admin-daily-memo-nav:hover{
      background:var(--zr-v3-green-soft,#eef6f1)!important;
      color:var(--zr-v3-green-dark,#003b21)!important;
      -webkit-text-fill-color:var(--zr-v3-green-dark,#003b21)!important;
    }
    html.zr-admin-shell-mounted #zrAdminDailyMemoV1 .zr-admin-daily-memo-today{
      background:var(--zr-v3-green,#004b2a)!important;
      border:1.5px solid var(--zr-v3-green,#004b2a)!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      box-shadow:none!important;
    }
    html.zr-admin-shell-mounted #zrAdminDailyMemoV1 .zr-admin-daily-memo-today:hover{
      background:var(--zr-v3-green-dark,#003b21)!important;
      border-color:var(--zr-v3-green-dark,#003b21)!important;
    }
    html.zr-admin-shell-mounted #zrAdminDailyMemoV1 .zr-admin-daily-memo-save{
      background:var(--zr-v3-orange,#fc5404)!important;
      border:1px solid var(--zr-v3-orange,#fc5404)!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      box-shadow:none!important;
    }
    html.zr-admin-shell-mounted #zrAdminDailyMemoV1 .zr-admin-daily-memo-save:hover:not(:disabled){
      background:var(--zr-v3-orange-dark,#e24600)!important;
      border-color:var(--zr-v3-orange-dark,#e24600)!important;
    }

    #zrTodayDbStatus[data-zr-retryable="1"]{cursor:pointer;user-select:none}
    #zrTodayDbStatus[data-zr-retryable="1"]:hover{border-color:var(--zr-v3-orange,#fc5404)!important}
  `;
  document.head.appendChild(s);
}
function markCalendarCurrentMonth(){
  const tab=$('tab-calendar');if(!tab)return;
  tab.querySelectorAll('button').forEach(btn=>{
    const compact=String(btn.textContent||'').replace(/\s+/g,'').trim();
    btn.classList.toggle('zr-calendar-current-month-fix',compact==='이번달');
  });
}
function markScheduleControls(){
  const tab=$('tab-schedule');if(!tab)return;
  tab.querySelectorAll('button').forEach(btn=>{
    const text=String(btn.textContent||'').replace(/\s+/g,' ').trim();
    const compact=text.replace(/\s+/g,'');
    const aria=String(btn.getAttribute('aria-label')||'').replace(/\s+/g,'');
    const nav=/^[‹›<>←→]$/.test(compact)||/(이전|다음).*(달|월)/.test(compact)||(이전|다음).*(달|월)/.test(aria);
    const excel=/엑셀/.test(compact);
    btn.classList.toggle('zr-schedule-date-nav-fix',nav);
    btn.classList.toggle('zr-schedule-export-fix',excel);
  });
}
function adminVisible(){
  const admin=$('adminView');if(!admin)return false;
  const style=getComputedStyle(admin);
  return style.display!=='none'&&style.visibility!=='hidden'&&admin.getClientRects().length>0;
}
function loginModalVisible(){
  const modal=$('adminLoginModal');
  if(!modal||modal.classList.contains('hidden'))return false;
  const style=getComputedStyle(modal);return style.display!=='none'&&style.visibility!=='hidden';
}
function openTodayAfterLoginOnce(){
  if(defaultTodayOpened)return true;
  if(!adminVisible()||loginModalVisible())return false;
  const btn=document.querySelector('#zrAdminShellRail [data-zr-admin-item="today"]');
  if(!btn)return false;
  defaultTodayOpened=true;
  try{btn.click()}catch{}
  if(defaultTodayTimer){clearInterval(defaultTodayTimer);defaultTodayTimer=0}
  return true;
}
function todayOpen(){
  const sec=$('tab-today');
  return !!sec&&!sec.classList.contains('hidden')&&getComputedStyle(sec).display!=='none';
}
function isStaff(){
  const u=window.zrReservationFirebase?.auth?.currentUser;
  return !!u&&String(u.email||'').toLowerCase()===STAFF_EMAIL.toLowerCase();
}
function statusText(){return String($('zrTodayDbStatus')?.textContent||'').replace(/^●\s*/,'').trim()}
function connected(){return /실시간 연결/.test(statusText())}
function resetRetry(){
  retryCount=0;lastLoadingAt=0;lastRetryAt=0;
  const st=$('zrTodayDbStatus');if(st)delete st.dataset.zrRetryable;
}
function triggerRetry(reason='auto'){
  if(!todayOpen())return false;
  const date=$('zrTodayDate');if(!date)return false;
  const now=Date.now();if(now-lastRetryAt<1800)return false;
  lastRetryAt=now;retryCount++;
  const st=$('zrTodayDbStatus');
  if(st){st.textContent='● 스케줄 연결 재시도 중';st.className='zr-today-db wait';delete st.dataset.zrRetryable}
  try{
    date.dispatchEvent(new Event('change',{bubbles:true}));
    console.debug('today schedule retry',reason,retryCount,date.value);
    return true;
  }catch(e){console.debug('today schedule retry failed',e);return false}
}
function markManualRetry(){
  const st=$('zrTodayDbStatus');if(!st)return;
  st.textContent='● 스케줄 연결 재시도';st.className='zr-today-db err';st.dataset.zrRetryable='1';st.title='눌러서 다시 연결';
}
function watch(){
  injectStyle();
  markCalendarCurrentMonth();
  markScheduleControls();
  openTodayAfterLoginOnce();
  const st=$('zrTodayDbStatus'),date=$('zrTodayDate');
  if(!st||!date)return;
  if(date.value!==lastDate){lastDate=date.value;retryCount=0;lastLoadingAt=0}
  if(connected()){resetRetry();return}
  if(!todayOpen())return;
  const text=statusText();
  const loading=/불러오는 중|연결 재시도 중/.test(text);
  const waiting=/DB 연결 대기/.test(text);
  if(loading){
    if(!lastLoadingAt)lastLoadingAt=Date.now();
    if(Date.now()-lastLoadingAt>=5500){
      lastLoadingAt=Date.now();
      if(retryCount<3)triggerRetry('loading-timeout');else markManualRetry();
    }
    return;
  }
  lastLoadingAt=0;
  if(waiting&&isStaff()&&retryCount<3)triggerRetry('staff-ready');
}
function bindStatus(){
  const st=$('zrTodayDbStatus');if(!st||st.dataset.zrRetryBound==='1')return;
  st.dataset.zrRetryBound='1';
  st.addEventListener('click',()=>{
    if(st.dataset.zrRetryable==='1'){retryCount=0;triggerRetry('manual')}
  });
}
function boot(){
  injectStyle();
  markCalendarCurrentMonth();
  markScheduleControls();
  if(!defaultTodayTimer)defaultTodayTimer=setInterval(openTodayAfterLoginOnce,120);
  if(!watchTimer)watchTimer=setInterval(()=>{bindStatus();watch()},700);
  window.addEventListener('online',()=>{retryCount=0;setTimeout(()=>triggerRetry('online'),100)});
  document.addEventListener('zr:customer-firebase-ready',()=>{retryCount=0;setTimeout(()=>triggerRetry('firebase-ready'),100)});
  bindStatus();watch();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,0),{once:true});
})();
