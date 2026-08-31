(()=>{
'use strict';
if(window.__ZR_CUSTOMER_HOLIDAY_BOOKING_SETTING_V1)return;
window.__ZR_CUSTOMER_HOLIDAY_BOOKING_SETTING_V1=true;

const $=id=>document.getElementById(id);
const HOLIDAY_SUFFIX=' (공휴일 예약 불가)';
const KR_HOLIDAYS_2026=new Set([
  '2026-01-01','2026-02-16','2026-02-17','2026-02-18','2026-03-01','2026-03-02',
  '2026-05-01','2026-05-05','2026-05-24','2026-05-25','2026-06-03','2026-06-06','2026-07-17','2026-08-15','2026-08-17',
  '2026-09-24','2026-09-25','2026-09-26','2026-10-03','2026-10-05','2026-10-09','2026-12-25'
]);
const KR_HOLIDAYS_2027=new Set([
  '2027-01-01',
  '2027-02-06','2027-02-07','2027-02-08','2027-02-09',
  '2027-03-01',
  '2027-05-01','2027-05-03','2027-05-05','2027-05-13',
  '2027-06-06',
  '2027-07-17','2027-07-19',
  '2027-08-15','2027-08-16',
  '2027-09-14','2027-09-15','2027-09-16',
  '2027-10-03','2027-10-04','2027-10-09','2027-10-11',
  '2027-12-25','2027-12-27'
]);
const FIXED_HOLIDAY_MD=new Set(['01-01','03-01','05-01','05-05','06-06','07-17','08-15','10-03','10-09','12-25']);
let adminDirty=false;
let wrappedRender=null;

function loadSharedReservationSettings(){
  if(document.getElementById('zrReservationSettingsFirebaseSyncV1')||window.__ZR_RESERVATION_SETTINGS_FIREBASE_SYNC_V1)return;
  const s=document.createElement('script');
  s.id='zrReservationSettingsFirebaseSyncV1';s.async=false;s.src='./reservation_settings_firebase_sync_v1.js?v=1';
  document.body.appendChild(s);
}
function localToday(){
  const d=new Date(),pad=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function isPastOrToday(date){
  const v=String(date||'');
  return /^\d{4}-\d{2}-\d{2}$/.test(v)&&v<=localToday();
}
function isHoliday(date){
  const v=String(date||'');
  return KR_HOLIDAYS_2026.has(v)||KR_HOLIDAYS_2027.has(v)||FIXED_HOLIDAY_MD.has(v.slice(5));
}
function readSettings(){
  try{
    const fn=typeof window.settings==='function'?window.settings:(typeof settings==='function'?settings:null);
    const s=fn?.();
    return s&&typeof s==='object'?s:{};
  }catch{return {}}
}
function writeSettings(s){
  try{
    const fn=typeof window.saveSettings==='function'?window.saveSettings:(typeof saveSettings==='function'?saveSettings:null);
    if(typeof fn!=='function')return false;
    fn(s);return true;
  }catch{return false}
}
function holidayAllowed(){return readSettings().holidayBookingAllowed!==false}
function customerVisible(){
  const v=$('customerView');
  return !!v&&!v.classList.contains('hidden')&&getComputedStyle(v).display!=='none';
}
function optionBaseText(o){return String(o.textContent||'').replace(HOLIDAY_SUFFIX,'')}
function restoreOption(o){
  if(o.dataset.zrHolidayLock!=='1')return;
  o.disabled=o.dataset.zrHolidayWasDisabled==='1';
  delete o.dataset.zrHolidayLock;
  delete o.dataset.zrHolidayWasDisabled;
  o.textContent=optionBaseText(o);
}
function blockOption(o){
  if(o.dataset.zrHolidayLock!=='1'){
    o.dataset.zrHolidayLock='1';
    o.dataset.zrHolidayWasDisabled=o.disabled?'1':'0';
  }
  o.disabled=true;
  const base=optionBaseText(o);
  if(!base.includes('공휴일 예약 불가'))o.textContent=base+HOLIDAY_SUFFIX;
}
function removePastAndTodayOptions(day){
  const selected=String(day.value||'');
  const selectedWasBlocked=isPastOrToday(selected);
  const td=localToday();
  [...day.options].forEach(o=>{
    const value=String(o.value||'');
    if(/^\d{4}-\d{2}-\d{2}$/.test(value)&&value<=td)o.remove();
  });
  return selectedWasBlocked;
}
function applyCustomerHolidayAvailability(){
  const day=$('visitDay');if(!day)return;
  const removedSelected=removePastAndTodayOptions(day);
  const allowed=holidayAllowed();
  [...day.options].forEach(o=>{
    const value=String(o.value||'');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value)){restoreOption(o);return}
    if(!allowed&&isHoliday(value))blockOption(o);else restoreOption(o);
  });
  if(removedSelected||(!allowed&&isHoliday(day.value))){
    day.value='';
    try{day.dispatchEvent(new Event('change',{bubbles:true}))}catch{}
  }
}
function hookVisitDays(){
  const fn=typeof window.renderVisitDays==='function'?window.renderVisitDays:null;
  if(!fn||fn===wrappedRender)return false;
  if(fn.__zrHolidayBookingSetting){wrappedRender=fn;return false}
  const base=fn;
  const wrapped=function(){
    const out=base.apply(this,arguments);
    if(customerVisible())setTimeout(applyCustomerHolidayAvailability,0);
    return out;
  };
  for(const key of Object.keys(base)){
    try{wrapped[key]=base[key]}catch{}
  }
  wrapped.__zrHolidayBookingSetting=true;
  wrappedRender=wrapped;
  window.renderVisitDays=wrapped;
  try{renderVisitDays=wrapped}catch{}
  return true;
}
function adminVisible(){const v=$('adminView');return !!v&&getComputedStyle(v).display!=='none'}
function ensureAdminUi(){
  const start=$('bookingOpenStart'),end=$('bookingOpenEnd'),save=$('saveBookingPeriod');
  if(!start||!end||!save)return false;
  let wrap=$('zrHolidayBookingSettingWrap');
  if(!wrap){
    wrap=document.createElement('div');
    wrap.id='zrHolidayBookingSettingWrap';
    wrap.innerHTML='<label for="zrHolidayBookingAllowed">공휴일 예약 가능 여부</label><select id="zrHolidayBookingAllowed"><option value="yes">예약 가능</option><option value="no">예약 불가</option></select><div class="help" style="margin-top:5px">예약 불가 시 고객 방문 희망일에서 공휴일 선택이 제한됩니다.</div>';
    const startBox=start.closest('div'),endBox=end.closest('div'),parent=startBox?.parentElement;
    if(parent&&endBox?.parentElement===parent)endBox.insertAdjacentElement('afterend',wrap);
    else save.insertAdjacentElement('beforebegin',wrap);
    $('zrHolidayBookingAllowed')?.addEventListener('change',()=>{adminDirty=true});
  }
  const select=$('zrHolidayBookingAllowed');
  if(select&&!adminDirty)select.value=holidayAllowed()?'yes':'no';
  if(!save.dataset.zrHolidayBookingBound){
    save.dataset.zrHolidayBookingBound='1';
    save.addEventListener('click',()=>{
      const sel=$('zrHolidayBookingAllowed');if(!sel)return;
      const s={...readSettings(),holidayBookingAllowed:sel.value!=='no'};
      if(writeSettings(s)){
        adminDirty=false;
        setTimeout(()=>{
          try{window.renderVisitDays?.()}catch{}
          applyCustomerHolidayAvailability();
          ensureAdminUi();
        },0);
      }
    },true);
  }
  return true;
}
function refreshHooks(){
  const hooked=hookVisitDays();
  if(hooked&&customerVisible())setTimeout(applyCustomerHolidayAvailability,0);
  if(adminVisible())ensureAdminUi();
}
function bookingActionButton(target){
  const btn=target?.closest?.('button,input[type="submit"]');if(!btn)return null;
  const txt=(btn.textContent||btn.value||'').replace(/\s+/g,'');
  if(!/(예약.*(신청|완료|하기)|신청하기|예약하기)/.test(txt)||/예약확인|추가예약/.test(txt))return null;
  return btn;
}
function boot(){
  loadSharedReservationSettings();
  refreshHooks();
  if(customerVisible())applyCustomerHolidayAvailability();

  // Other customer/admin patches can replace renderVisitDays during startup.
  // Poll only the function reference briefly; never rescan or observe the date DOM continuously.
  const t=setInterval(refreshHooks,500);
  setTimeout(()=>clearInterval(t),30000);

  document.addEventListener('zr:reservation-settings-synced',()=>{
    adminDirty=false;
    refreshHooks();
    if(customerVisible())setTimeout(applyCustomerHolidayAvailability,0);
  });
  document.addEventListener('change',e=>{
    if(e.target?.id==='visitMonth')setTimeout(applyCustomerHolidayAvailability,0);
  },true);
  document.addEventListener('click',e=>{
    if(!customerVisible()||!bookingActionButton(e.target))return;
    const day=$('visitDay'),value=String(day?.value||'');
    if(isPastOrToday(value)){
      e.preventDefault();e.stopImmediatePropagation();
      try{window.toast?.('당일 예약은 불가합니다. 익일부터 예약해주세요.')}catch{}
      return;
    }
    if(!holidayAllowed()&&isHoliday(value)){
      e.preventDefault();e.stopImmediatePropagation();
      try{window.toast?.('공휴일 예약이 현재 설정에서 허용되지 않습니다.')}catch{}
    }
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
