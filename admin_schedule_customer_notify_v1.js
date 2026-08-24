(()=>{
'use strict';
if(window.__ZR_ADMIN_SCHEDULE_CUSTOMER_NOTIFY_V1)return;
window.__ZR_ADMIN_SCHEDULE_CUSTOMER_NOTIFY_V1=true;

const SCRIPT_STYLE_ID='zrScheduleCustomerNotifyV1Style';
const SETTINGS_CARD_ID='zrScheduleCustomerNotifySettingsV1';
const SETTING_FIELD='scheduleCustomerNotifyMessage';
const DEFAULT_MESSAGE='[주렁주렁 동탄점]\n관람 및 체험 일정이 확정되었습니다.\n예약 조회에서 확정된 일정을 확인해주세요.';
let listObserver=null;
let observedList=null;
let retryTimer=null;
let retryCount=0;

function toastSafe(message){
  try{if(typeof window.toast==='function')window.toast(message)}catch{}
}
function allBookings(){
  try{
    const list=typeof window.bookings==='function'?window.bookings():[];
    return Array.isArray(list)?list:[];
  }catch{return []}
}
function bookingById(id){
  return allBookings().find(b=>b&&!b.__availabilityOnly&&String(b.id)===String(id))||null;
}
function currentSettings(){
  try{return typeof window.settings==='function'?(window.settings()||{}):null}catch{return null}
}
function publicLookupUrl(){
  try{
    const u=new URL(window.location.href);
    u.search='';u.hash='';
    return u.href;
  }catch{return window.location.href}
}
function configuredMessage(){
  const s=currentSettings();
  const value=String(s?.[SETTING_FIELD]??'').trim();
  return value||DEFAULT_MESSAGE;
}
function buildMessage(booking){
  return [
    configuredMessage(),
    '',
    `단체명: ${String(booking?.orgName||'-')}`,
    `방문일: ${String(booking?.date||'-')}`,
    `예약 조회: ${publicLookupUrl()}`
  ].join('\n');
}
function normalizedPhone(value){
  const raw=String(value||'').trim();
  if(!raw)return '';
  return raw.replace(/[^0-9+]/g,'');
}
function isIOS(){
  return /iPad|iPhone|iPod/.test(navigator.userAgent)||
    (navigator.platform==='MacIntel'&&Number(navigator.maxTouchPoints||0)>1);
}
function isMobile(){return /Android|iPad|iPhone|iPod/i.test(navigator.userAgent)||isIOS()}
function openSms(booking){
  if(!booking?.schedulePublished){toastSafe('스케줄 확정 후 고객 알림을 보낼 수 있습니다.');return}
  const phone=normalizedPhone(booking.contact);
  if(!phone){toastSafe('고객 연락처가 없어 문자를 작성할 수 없습니다.');return}
  const message=buildMessage(booking);
  if(!isMobile()){
    if(navigator.clipboard?.writeText){
      navigator.clipboard.writeText(message).then(()=>toastSafe('알림 문구를 복사했습니다. 모바일에서 고객에게 전송해주세요.')).catch(()=>toastSafe('모바일에서 고객 알림 버튼을 눌러주세요.'));
    }else toastSafe('모바일에서 고객 알림 버튼을 눌러주세요.');
    return;
  }
  const separator=isIOS()?'&':'?';
  window.location.href=`sms:${phone}${separator}body=${encodeURIComponent(message)}`;
}
function injectStyle(){
  if(document.getElementById(SCRIPT_STYLE_ID))return;
  const style=document.createElement('style');
  style.id=SCRIPT_STYLE_ID;
  style.textContent=`
    #tab-schedule .zr-schedule-customer-notify{background:#eaf3fb!important;color:#2f6b9a!important;border:1px solid #c7dceb!important}
    #tab-schedule .zr-schedule-customer-notify:disabled{background:#f1f3f2!important;color:#9aa29d!important;border-color:#dfe4e1!important;cursor:not-allowed!important;opacity:1!important}
    #${SETTINGS_CARD_ID} textarea{min-height:135px;resize:vertical;line-height:1.55}
    #${SETTINGS_CARD_ID} .zr-schedule-notify-auto{margin-top:10px}
    @media(max-width:700px){
      #tab-schedule .zrsc-actions{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important;align-items:stretch!important}
      #tab-schedule .zrsc-actions>.zrsc-published{grid-column:1/-1!important;justify-self:end!important}
      #tab-schedule .zrsc-actions>button{width:100%!important;min-width:0!important;margin:0!important;white-space:nowrap!important}
    }
  `;
  document.head.appendChild(style);
}
function ensureSettingsCard(){
  if(document.getElementById(SETTINGS_CARD_ID))return true;
  if(typeof window.settings!=='function'||typeof window.saveSettings!=='function')return false;
  const smsSave=document.getElementById('saveSmsSettings');
  const smsCard=smsSave?.closest?.('.card');
  if(!smsCard)return false;
  const card=document.createElement('div');
  card.className='card';card.id=SETTINGS_CARD_ID;
  card.innerHTML=`
    <h2>스케줄 알림 문자 설정</h2>
    <div class="help">스케줄 관리의 <b>고객 알림</b> 버튼에서 사용하는 문구입니다. 스케줄이 확정된 예약에서만 사용할 수 있습니다.</div>
    <div style="margin-top:12px"><label for="zrScheduleCustomerNotifyMessage">알림 문구</label><textarea id="zrScheduleCustomerNotifyMessage"></textarea></div>
    <div class="calc zr-schedule-notify-auto"><b>자동입력 항목</b><br>단체명: <b>[예약 단체명 자동입력]</b><br>방문일: <b>[예약 방문일 자동입력]</b><br>예약 조회: <b>[현재 고객 예약사이트 주소 자동입력]</b></div>
    <div class="help" style="margin-top:8px">고객 번호와 위 자동입력 항목은 문자 작성 시 자동으로 채워집니다. 실제 전송은 휴대폰 문자 앱에서 마지막으로 확인 후 보내게 됩니다.</div>
    <div style="display:flex;justify-content:flex-end;margin-top:12px"><button type="button" class="btn-primary" id="zrSaveScheduleCustomerNotifyMessage">스케줄 알림 문구 저장</button></div>
  `;
  smsCard.insertAdjacentElement('afterend',card);
  const input=document.getElementById('zrScheduleCustomerNotifyMessage');
  input.value=configuredMessage();
  document.getElementById('zrSaveScheduleCustomerNotifyMessage').onclick=()=>{
    const s=currentSettings();
    if(!s){toastSafe('설정 정보를 불러오지 못했습니다.');return}
    const value=String(input.value||'').trim()||DEFAULT_MESSAGE;
    s[SETTING_FIELD]=value;
    try{
      window.saveSettings(s);
      input.value=value;
      toastSafe('스케줄 알림 문구를 저장했습니다.');
    }catch(e){console.error('schedule notify settings save',e);toastSafe('스케줄 알림 문구 저장에 실패했습니다.')}
  };
  return true;
}
function patchScheduleButtons(){
  const list=document.getElementById('zrscList');
  if(!list)return false;
  list.querySelectorAll('.zrsc-card[data-booking]').forEach(card=>{
    const id=card.dataset.booking||'';
    const booking=bookingById(id);
    const actions=card.querySelector('.zrsc-actions');
    const apply=actions?.querySelector('[data-apply]');
    if(!actions||!apply)return;
    let button=actions.querySelector('[data-zr-schedule-notify]');
    if(!button){
      button=document.createElement('button');
      button.type='button';
      button.className='btn-soft zr-schedule-customer-notify';
      button.dataset.zrScheduleNotify=id;
      button.textContent='고객 알림';
      actions.insertBefore(button,apply);
    }
    button.dataset.zrScheduleNotify=id;
    const published=!!booking?.schedulePublished;
    button.disabled=!published;
    button.title=published?'고객 문자 앱에 스케줄 안내 문구를 준비합니다.':'스케줄 확정 후 사용할 수 있습니다.';
  });
  return true;
}
function attachScheduleObserver(){
  const list=document.getElementById('zrscList');
  if(!list)return false;
  if(observedList!==list){
    listObserver?.disconnect();
    observedList=list;
    listObserver=new MutationObserver(()=>patchScheduleButtons());
    listObserver.observe(list,{childList:true});
  }
  patchScheduleButtons();
  return true;
}
function attemptInstall(){
  injectStyle();
  const settingsReady=ensureSettingsCard();
  const scheduleReady=attachScheduleObserver();
  return settingsReady&&scheduleReady;
}
function startRetries(){
  if(retryTimer)return;
  retryTimer=setInterval(()=>{
    retryCount+=1;
    if(attemptInstall()||retryCount>=80){clearInterval(retryTimer);retryTimer=null}
  },500);
}

document.addEventListener('click',e=>{
  const button=e.target?.closest?.('[data-zr-schedule-notify]');
  if(!button)return;
  const booking=bookingById(button.dataset.zrScheduleNotify||'');
  if(!booking){toastSafe('예약 정보를 찾지 못했습니다.');return}
  openSms(booking);
});
document.addEventListener('zr:admin-runtime-ready',()=>{attemptInstall();startRetries()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{attemptInstall();startRetries()},{once:true});
else{attemptInstall();startRetries()}
})();
