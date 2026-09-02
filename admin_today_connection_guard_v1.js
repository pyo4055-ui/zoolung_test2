(()=>{
'use strict';
if(window.__ZR_ADMIN_TODAY_CONNECTION_GUARD_V1)return;
window.__ZR_ADMIN_TODAY_CONNECTION_GUARD_V1=true;

const STAFF_EMAIL='zoolung09@zoolungzoolung.com';
const $=id=>document.getElementById(id);
let retryTimer=0,watchTimer=0,lastLoadingAt=0,lastRetryAt=0,retryCount=0,lastDate='';

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
  if(!watchTimer)watchTimer=setInterval(()=>{bindStatus();watch()},700);
  window.addEventListener('online',()=>{retryCount=0;setTimeout(()=>triggerRetry('online'),100)});
  document.addEventListener('zr:customer-firebase-ready',()=>{retryCount=0;setTimeout(()=>triggerRetry('firebase-ready'),100)});
  bindStatus();watch();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,0),{once:true});
})();
