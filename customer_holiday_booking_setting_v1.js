(()=>{
'use strict';
if(window.__ZR_CUSTOMER_HOLIDAY_BOOKING_SETTING_V1)return;
window.__ZR_CUSTOMER_HOLIDAY_BOOKING_SETTING_V1=true;

const $=id=>document.getElementById(id);
const HOLIDAY_SUFFIX=' (공휴일 예약 불가)';
const KR_HOLIDAYS_2026=new Set([
  '2026-01-01','2026-02-16','2026-02-17','2026-02-18','2026-03-01','2026-03-02',
  '2026-05-05','2026-05-24','2026-05-25','2026-06-03','2026-06-06','2026-08-15','2026-08-17',
  '2026-09-24','2026-09-25','2026-09-26','2026-10-03','2026-10-05','2026-10-09','2026-12-25'
]);
const FIXED_HOLIDAY_MD=new Set(['01-01','03-01','05-05','06-06','08-15','10-03','10-09','12-25']);
let adminDirty=false;
let observedDay=null,dayObserver=null;
let wrappedRender=null;

function isHoliday(date){
  const v=String(date||'');
  return KR_HOLIDAYS_2026.has(v)||FIXED_HOLIDAY_MD.has(v.slice(5));
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
function applyCustomerHolidayAvailability(){
  const day=$('visitDay');if(!day)return;
  const allowed=holidayAllowed();
  [...day.options].forEach(o=>{
    const value=String(o.value||'');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value)){restoreOption(o);return}
    if(!allowed&&isHoliday(value))blockOption(o);else restoreOption(o);
  });
  if(!allowed&&isHoliday(day.value)){
    day.value='';
    try{day.dispatchEvent(new Event('change',{bubbles:true}))}catch{}
  }
}
function hookVisitDays(){
  const fn=typeof window.renderVisitDays==='function'?window.renderVisitDays:null;
  if(!fn||fn===wrappedRender||fn.__zrHolidayBookingSetting)return false;
  const base=fn;
  const wrapped=function(){
    const out=base.apply(this,arguments);
    if(customerVisible())setTimeout(applyCustomerHolidayAvailability,0);
    return out;
  };
  wrapped.__zrHolidayBookingSetting=true;
  wrappedRender=wrapped;
  window.renderVisitDays=wrapped;
  try{renderVisitDays=wrapped}catch{}
  return true;
}
function watchVisitDay(){
  const day=$('visitDay');
  if(!day||day===observedDay)return;
  dayObserver?.disconnect();observedDay=day;
  dayObserver=new MutationObserver(()=>setTimeout(applyCustomerHolidayAvailability,0));
  dayObserver.observe(day,{childList:true,subtree:true});
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
function apply(){
  hookVisitDays();watchVisitDay();
  if(customerVisible())applyCustomerHolidayAvailability();
  if(adminVisible())ensureAdminUi();
}
function boot(){
  apply();
  const t=setInterval(apply,300);setTimeout(()=>clearInterval(t),30000);
  document.addEventListener('change',e=>{
    const id=e.target?.id||'';
    if(id==='visitMonth'||id==='visitDay')setTimeout(applyCustomerHolidayAvailability,0);
  },true);
  document.addEventListener('click',e=>{
    if(!customerVisible()||holidayAllowed())return;
    const btn=e.target?.closest?.('button,input[type="submit"]');if(!btn)return;
    const txt=(btn.textContent||btn.value||'').replace(/\s+/g,'');
    if(!/(예약.*(신청|완료|하기)|신청하기|예약하기)/.test(txt)||/예약확인|추가예약/.test(txt))return;
    const day=$('visitDay');
    if(day&&isHoliday(day.value)){
      e.preventDefault();e.stopImmediatePropagation();
      try{window.toast?.('공휴일 예약이 현재 설정에서 허용되지 않습니다.')}catch{}
    }
  },true);
  const root=document.body;
  new MutationObserver(()=>setTimeout(apply,0)).observe(root,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
