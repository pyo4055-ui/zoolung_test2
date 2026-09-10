(()=>{
'use strict';
if(window.__ZR_ADMIN_DAILY_MEMO_V1)return;
window.__ZR_ADMIN_DAILY_MEMO_V1=true;

const FV='12.17.1';
const COLLECTION='scheduleSharedMemos';
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const today=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const shift=(s,n)=>{const d=new Date(`${s}T12:00:00`);d.setDate(d.getDate()+n);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
let selected=today(),FS=null,db=null,unsub=null,dirty=false,saving=false,loadToken=0;

function injectStyle(){
  if($('zrAdminDailyMemoV1Style'))return;
  const s=document.createElement('style');s.id='zrAdminDailyMemoV1Style';s.textContent=`
    .zr-admin-daily-memo{border:1px solid #e8dfd7;border-radius:15px;background:#fff;padding:14px}
    .zr-admin-daily-memo-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}
    .zr-admin-daily-memo-title{font-size:16px;font-weight:950;color:#332f2b}
    #zrAdminDailyMemoV1 .zr-admin-daily-memo-save{height:40px;min-height:40px;border:1px solid var(--zr-v3-orange,#fc5404);border-radius:10px;background:var(--zr-v3-orange,#fc5404);color:#fff;-webkit-text-fill-color:#fff;box-shadow:none;padding:0 12px;font-size:12px;font-weight:900}
    #zrAdminDailyMemoV1 .zr-admin-daily-memo-save:disabled{opacity:.5}
    .zr-admin-daily-memo-datebar{display:grid;grid-template-columns:40px minmax(0,1fr) 40px auto;gap:6px;align-items:center;margin-bottom:9px}
    #zrAdminDailyMemoV1 .zr-admin-daily-memo-datebar button{box-sizing:border-box;height:40px;min-height:40px;border:1px solid var(--zr-v3-line,#e2d9d0);border-radius:10px;background:var(--zr-v3-surface2,#fbf8f3);color:var(--zr-v3-muted,#766d66);-webkit-text-fill-color:currentColor;box-shadow:none;padding:0;font-size:18px;font-weight:900}
    #zrAdminDailyMemoV1 .zr-admin-daily-memo-nav{width:40px;min-width:40px}
    #zrAdminDailyMemoV1 .zr-admin-daily-memo-datebar .zr-admin-daily-memo-today{width:auto;min-width:48px;padding:0 10px;font-size:12px}
    #zrAdminDailyMemoV1 button:focus-visible{outline:2px solid var(--zr-v3-orange,#fc5404);outline-offset:2px}
    .zr-admin-daily-memo-date{min-width:0;text-align:center;font-size:11.5px;font-weight:900;color:#49433e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .zr-admin-daily-memo textarea{width:100%!important;min-height:116px!important;resize:vertical;box-sizing:border-box!important;margin:0!important;border:1px solid #e6ddd5!important;border-radius:12px!important;background:#fffaf5!important;padding:11px!important;font-size:12.5px!important;line-height:1.55!important;color:#403a35!important;box-shadow:none!important}.zr-admin-daily-memo textarea:focus{outline:none!important;border-color:#adbcaf!important;box-shadow:0 0 0 3px rgba(63,111,90,.08)!important}
    .zr-admin-daily-memo-foot{display:flex;justify-content:space-between;gap:8px;margin-top:7px;font-size:10px;color:#918981}.zr-admin-daily-memo-status[data-state="dirty"]{color:#9a6a17;font-weight:850}.zr-admin-daily-memo-status[data-state="saved"]{color:var(--zr-operation);font-weight:850}.zr-admin-daily-memo-status[data-state="error"]{color:var(--zr-action-danger);font-weight:850}
  `;document.head.appendChild(s);
}
function formatDate(v){
  const d=new Date(`${v}T12:00:00`);if(Number.isNaN(d.getTime()))return v;
  const days=['일','월','화','수','목','금','토'];return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} (${days[d.getDay()]})`;
}
function setStatus(text,state=''){const el=$('zrAdminDailyMemoStatus');if(el){el.textContent=text;el.dataset.state=state}}
function setDateLabel(){const el=$('zrAdminDailyMemoDate');if(el)el.textContent=formatDate(selected)}
function setBusy(on){saving=!!on;const b=$('zrAdminDailyMemoSave');if(b)b.disabled=on}
async function ensureFs(){
  if(FS&&db)return true;
  const z=window.zrReservationFirebase;if(!z?.db)return false;
  try{FS=await import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`);db=z.db;return true}catch(e){console.error('admin daily memo firebase',e);return false}
}
function stop(){if(unsub){unsub();unsub=null}}
async function subscribe(date){
  stop();const token=++loadToken;setDateLabel();setStatus('불러오는 중…');
  const area=$('zrAdminDailyMemoText');if(area){area.disabled=true;if(!dirty)area.value=''}
  const ready=await ensureFs();
  if(token!==loadToken)return;
  if(!ready){if(area)area.disabled=false;setStatus('공용 DB 연결 대기','error');return}
  if(!window.zrReservationFirebase?.isStaff?.()){if(token===loadToken){if(area)area.disabled=false;setStatus('관리자 DB 로그인 필요','error')}return}
  try{
    const ref=FS.doc(db,COLLECTION,date);
    unsub=FS.onSnapshot(ref,snap=>{
      if(token!==loadToken)return;
      if(!dirty&&!saving&&area)area.value=snap.exists()?String(snap.data()?.text||''):'';
      if(area)area.disabled=false;
      if(!dirty)setStatus(snap.exists()?'공용 메모 불러옴':'메모 없음','saved');
      else if(!saving)setStatus('저장 필요','dirty');
    },e=>{if(token!==loadToken)return;console.error('admin daily memo listen',e);unsub=null;if(area)area.disabled=false;setStatus('메모 연결 확인 필요','error')});
  }catch(e){console.error('admin daily memo subscribe',e);if(area)area.disabled=false;setStatus('메모 연결 확인 필요','error')}
}
async function saveCurrent(silent=false){
  const area=$('zrAdminDailyMemoText');if(!area||!dirty)return true;
  if(!(await ensureFs())||!window.zrReservationFirebase?.isStaff?.()){setStatus('관리자 DB 로그인 필요','error');return false}
  setBusy(true);setStatus('저장 중…');
  try{
    await FS.setDoc(FS.doc(db,COLLECTION,selected),{text:area.value.trim(),updatedAt:FS.serverTimestamp()},{merge:true});
    dirty=false;setStatus('저장됨','saved');if(!silent)try{window.toast?.('오늘의 메모를 저장했습니다.')}catch{}return true;
  }catch(e){console.error('admin daily memo save',e);setStatus('저장 실패','error');return false}
  finally{setBusy(false)}
}
async function move(next){
  if(next===selected)return;
  if(dirty&&!(await saveCurrent(true)))return;
  selected=next;dirty=false;await subscribe(selected);
}
function build(){
  if($('zrAdminDailyMemoV1'))return true;
  const body=document.querySelector('#zrAdminSmartPanelV1 .zr-admin-smart-body');if(!body)return false;
  injectStyle();
  const section=document.createElement('section');section.id='zrAdminDailyMemoV1';section.className='zr-admin-daily-memo';
  section.innerHTML=`<div class="zr-admin-daily-memo-head"><div class="zr-admin-daily-memo-title">오늘의 메모장</div><button type="button" class="zr-admin-daily-memo-save" id="zrAdminDailyMemoSave">저장</button></div><div class="zr-admin-daily-memo-datebar"><button type="button" class="zr-admin-daily-memo-nav" id="zrAdminDailyMemoPrev" aria-label="이전 날짜">‹</button><div class="zr-admin-daily-memo-date" id="zrAdminDailyMemoDate"></div><button type="button" class="zr-admin-daily-memo-nav" id="zrAdminDailyMemoNext" aria-label="다음 날짜">›</button><button type="button" class="zr-admin-daily-memo-today" id="zrAdminDailyMemoToday">오늘</button></div><textarea id="zrAdminDailyMemoText" placeholder="이 날짜의 공용 운영 메모를 입력하세요."></textarea><div class="zr-admin-daily-memo-foot"><span>현장스케줄 공용 메모와 동일</span><span class="zr-admin-daily-memo-status" id="zrAdminDailyMemoStatus">연결 대기</span></div>`;
  body.appendChild(section);
  $('zrAdminDailyMemoText').addEventListener('input',()=>{dirty=true;setStatus('저장 필요','dirty')});
  $('zrAdminDailyMemoSave').addEventListener('click',()=>saveCurrent(false));
  $('zrAdminDailyMemoPrev').addEventListener('click',()=>move(shift(selected,-1)));
  $('zrAdminDailyMemoNext').addEventListener('click',()=>move(shift(selected,1)));
  $('zrAdminDailyMemoToday').addEventListener('click',()=>move(today()));
  subscribe(selected);return true;
}
function boot(){
  if(build())return;let tries=0;const wait=setInterval(()=>{if(build()||++tries>150)clearInterval(wait)},100);
}
function reconnectAfterLogin(){
  if(!$('zrAdminDailyMemoText')||unsub||saving||!window.zrReservationFirebase?.isStaff?.())return;
  subscribe(selected);
}
document.addEventListener('zr:admin-firebase-staff-ready',reconnectAfterLogin);
window.addEventListener('beforeunload',()=>{if(dirty)saveCurrent(true)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,0),{once:true});
})();
