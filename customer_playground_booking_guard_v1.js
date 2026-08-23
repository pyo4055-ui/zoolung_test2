(()=>{
'use strict';
if(window.__ZR_CUSTOMER_PLAYGROUND_BOOKING_GUARD_V1)return;
window.__ZR_CUSTOMER_PLAYGROUND_BOOKING_GUARD_V1=true;

const $=id=>document.getElementById(id);
const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
const LOCK_ATTR='zrVisitDateLock';
let observingStart=null,observingDuration=null;
let startObserver=null,durationObserver=null;

function customerVisible(){
  const v=$('customerView');
  return !!v&&!v.classList.contains('hidden')&&getComputedStyle(v).display!=='none';
}
function visitDate(){
  const v=String($('visitDay')?.value||'').trim();
  return DATE_RE.test(v)?v:'';
}
function playRequested(){return String($('playUse')?.value||'')==='yes'}
function playStart(){return $('playStart')}
function playDuration(){return $('playDuration')}

function ensureStyle(){
  if($('zrPlayBookingGuardStyle'))return;
  const s=document.createElement('style');
  s.id='zrPlayBookingGuardStyle';
  s.textContent=`
    #zrPlayBookingGuardHelp{margin-top:7px;padding:8px 10px;border-radius:9px;font-size:12px;line-height:1.5;font-weight:700}
    #zrPlayBookingGuardHelp.zr-lock{background:#fff7e4;border:1px solid #f0d89a;color:#765514}
    #zrPlayBookingGuardHelp.zr-limit{background:#fff7e4;border:1px solid #f0d89a;color:#765514}
    #zrPlayBookingGuardHelp.zr-ok{background:#f3f8f5;border:1px solid #d9e8df;color:#456454}
    #playStart[data-zr-visit-date-lock="1"],#playDuration[data-zr-visit-date-lock="1"]{opacity:.58;cursor:not-allowed}
  `;
  document.head.appendChild(s);
}
function ensureHelp(){
  let n=$('zrPlayBookingGuardHelp');
  if(n)return n;
  const duration=playDuration(),start=playStart();
  const anchor=duration||start;if(!anchor)return null;
  n=document.createElement('div');n.id='zrPlayBookingGuardHelp';n.className='help';
  anchor.insertAdjacentElement('afterend',n);
  return n;
}
function setHelp(text,kind='ok'){
  const n=ensureHelp();if(!n)return;
  n.textContent=text;
  n.className=`help zr-${kind}`;
  n.style.display=text?'block':'none';
}
function lockControl(el){
  if(!el||el.dataset[LOCK_ATTR]==='1')return;
  el.dataset[LOCK_ATTR]='1';
  el.dataset.zrVisitDateWasDisabled=el.disabled?'1':'0';
  el.disabled=true;
  el.setAttribute('data-zr-visit-date-lock','1');
}
function unlockControl(el){
  if(!el||el.dataset[LOCK_ATTR]!=='1')return;
  el.disabled=el.dataset.zrVisitDateWasDisabled==='1';
  delete el.dataset[LOCK_ATTR];
  delete el.dataset.zrVisitDateWasDisabled;
  el.removeAttribute('data-zr-visit-date-lock');
}
function durationMinutes(option){
  const raw=`${option?.value||''} ${option?.textContent||''}`;
  const m=raw.match(/(?:^|\D)(30|60)(?:\D|$)/);
  return m?Number(m[1]):null;
}
function durationAvailability(){
  const el=playDuration();
  if(!el)return {known:false,can30:false,can60:false};
  if(el.tagName==='SELECT'){
    let has30=false,has60=false,can30=false,can60=false;
    [...el.options].forEach(o=>{
      const m=durationMinutes(o);if(m===30){has30=true;if(!o.disabled)can30=true}if(m===60){has60=true;if(!o.disabled)can60=true}
    });
    return {known:has30||has60,can30,can60};
  }
  if(el.matches('input[type="number"]')){
    const max=Number(el.max||0);
    return {known:!!max,can30:!max||max>=30,can60:!max||max>=60};
  }
  return {known:false,can30:false,can60:false};
}
function syncHelp(){
  if(!customerVisible())return;
  if(!playRequested()){setHelp('', 'ok');return}
  if(!visitDate()){
    setHelp('방문 희망일을 먼저 선택하면 놀이터 예약 가능 시간을 확인할 수 있습니다.','lock');
    return;
  }
  if(!String(playStart()?.value||'').trim()){
    setHelp('놀이터 입장시간을 선택하면 가능한 이용시간이 표시됩니다.','ok');
    return;
  }
  const a=durationAvailability();
  if(a.known&&a.can30&&!a.can60){
    setHelp('현재 예약 가능 현황상 이 입장시간은 최대 30분 이용 가능합니다. 60분 이용을 원하시면 다른 놀이터 입장시간을 선택해주세요.','limit');
    return;
  }
  if(a.known&&a.can60){
    setHelp('이 놀이터 입장시간은 30분 또는 60분 이용이 가능합니다.','ok');
    return;
  }
  setHelp('', 'ok');
}
function syncLock(){
  if(!customerVisible())return;
  const noDate=!visitDate(),requested=playRequested();
  if(noDate&&requested){lockControl(playStart());lockControl(playDuration())}
  else {unlockControl(playStart());unlockControl(playDuration())}
  syncHelp();
}
function watchOptions(){
  const s=playStart(),d=playDuration();
  if(s&&s!==observingStart){startObserver?.disconnect();observingStart=s;startObserver=new MutationObserver(()=>setTimeout(syncLock,0));startObserver.observe(s,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','value']})}
  if(d&&d!==observingDuration){durationObserver?.disconnect();observingDuration=d;durationObserver=new MutationObserver(()=>setTimeout(syncLock,0));durationObserver.observe(d,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','value','max']})}
}
function apply(){ensureStyle();watchOptions();syncLock()}
function boot(){
  apply();
  const t=setInterval(apply,300);setTimeout(()=>clearInterval(t),20000);
  document.addEventListener('change',e=>{
    const id=e.target?.id||'';
    if(!['visitMonth','visitDay','playUse','playStart','playDuration','exitTime'].includes(id))return;
    setTimeout(apply,0);setTimeout(apply,80);
  },true);
  const root=$('customerView')||document.body;
  new MutationObserver(()=>setTimeout(apply,0)).observe(root,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
