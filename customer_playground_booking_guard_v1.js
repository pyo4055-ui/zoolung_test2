(()=>{
'use strict';
if(window.__ZR_CUSTOMER_PLAYGROUND_BOOKING_GUARD_V1)return;
window.__ZR_CUSTOMER_PLAYGROUND_BOOKING_GUARD_V1=true;

const $=id=>document.getElementById(id);
const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
const LOCK_ATTR='zrVisitDateLock';
const OVERLAP_ATTR='zrOverlapDisabled';
const ENTRY_START_ATTR='zrEntryLinkDisabled';
const ENTRY_DURATION_ATTR='zrEntryDurationDisabled';
const ENTRY_RULE_SUFFIX=' (입장 직전만 가능)';
const ENTRY_OVERLAP_SUFFIX=' (60분 마감)';
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
function playEnd(){return $('playEnd')}

function ensureStyle(){
  if($('zrPlayBookingGuardStyle'))return;
  const s=document.createElement('style');
  s.id='zrPlayBookingGuardStyle';
  s.textContent=`
    #zrPlayBookingGuardHelp{display:block;width:100%;box-sizing:border-box;margin:7px 0 0;padding:8px 10px;border-radius:9px;font-size:12px;line-height:1.5;font-weight:700;white-space:nowrap}
    #zrPlayBookingGuardHelp.zr-lock{background:#fff7e4;border:1px solid #f0d89a;color:#765514}
    #zrPlayBookingGuardHelp.zr-limit{background:#fff7e4;border:1px solid #f0d89a;color:#765514}
    #zrPlayBookingGuardHelp.zr-ok{background:#f3f8f5;border:1px solid #d9e8df;color:#456454}
    #playStart[data-zr-visit-date-lock="1"],#playDuration[data-zr-visit-date-lock="1"]{opacity:.58;cursor:not-allowed}
    @media(max-width:720px){#zrPlayBookingGuardHelp{white-space:normal}}
  `;
  document.head.appendChild(s);
}
function controlsRow(){
  const els=[playStart(),playDuration(),playEnd()].filter(Boolean);
  if(!els.length)return null;
  let p=els[0].parentElement,depth=0;
  while(p&&depth<6&&!els.every(el=>p.contains(el))){p=p.parentElement;depth++}
  if(!p||p.id==='customerView'||p===document.body)return null;
  return p;
}
function ensureHelp(){
  let n=$('zrPlayBookingGuardHelp');
  if(!n){n=document.createElement('div');n.id='zrPlayBookingGuardHelp';n.className='help'}
  const row=controlsRow();
  if(row?.parentElement){
    if(n.previousElementSibling!==row)row.insertAdjacentElement('afterend',n);
  }else if(!n.isConnected){
    const anchor=playDuration()||playStart();
    if(!anchor)return null;
    anchor.insertAdjacentElement('afterend',n);
  }
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
function selectedDurationMinutes(){
  const el=playDuration();if(!el)return null;
  if(el.tagName==='SELECT')return durationMinutes(el.selectedOptions?.[0]);
  const n=Number(el.value||0);return n===30||n===60?n:null;
}
function timeMinutes(v){
  const m=String(v||'').match(/^(\d{1,2}):(\d{2})$/);if(!m)return null;
  return Number(m[1])*60+Number(m[2]);
}
function timeText(min){
  if(!Number.isFinite(min))return '';
  const n=((min%1440)+1440)%1440;
  return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
}
function durationOption(minutes){
  const el=playDuration();if(!el||el.tagName!=='SELECT')return null;
  return [...el.options].find(o=>durationMinutes(o)===minutes)||null;
}
function optionBaseText(o){
  return String(o?.textContent||'').replace(ENTRY_RULE_SUFFIX,'').replace(ENTRY_OVERLAP_SUFFIX,'');
}
function restoreEntryStartOption(o){
  if(!o||o.dataset[ENTRY_START_ATTR]!=='1')return;
  o.disabled=o.dataset.zrEntryLinkWasDisabled==='1';
  o.textContent=optionBaseText(o);
  delete o.dataset[ENTRY_START_ATTR];
  delete o.dataset.zrEntryLinkWasDisabled;
  delete o.dataset.zrEntryLinkReason;
}
function disableEntryStartOption(o,reason){
  if(!o||o.dataset[ENTRY_START_ATTR]==='1')return;
  o.dataset[ENTRY_START_ATTR]='1';
  o.dataset.zrEntryLinkWasDisabled=o.disabled?'1':'0';
  o.dataset.zrEntryLinkReason=reason;
  o.disabled=true;
  const base=optionBaseText(o);
  o.textContent=base+(reason==='overlap'?ENTRY_OVERLAP_SUFFIX:ENTRY_RULE_SUFFIX);
}
function restoreEntryStartLimits(){
  const start=playStart();if(!start||start.tagName!=='SELECT')return;
  [...start.options].forEach(restoreEntryStartOption);
}
function restoreEntryDurationOption(o){
  if(!o||o.dataset[ENTRY_DURATION_ATTR]!=='1')return;
  o.disabled=o.dataset.zrEntryDurationWasDisabled==='1';
  delete o.dataset[ENTRY_DURATION_ATTR];
  delete o.dataset.zrEntryDurationWasDisabled;
}
function disableEntryDurationOption(o){
  if(!o||o.dataset[ENTRY_DURATION_ATTR]==='1')return;
  o.dataset[ENTRY_DURATION_ATTR]='1';
  o.dataset.zrEntryDurationWasDisabled=o.disabled?'1':'0';
  o.disabled=true;
}
function restoreEntryDurationLimits(){
  const duration=playDuration();if(!duration||duration.tagName!=='SELECT')return;
  [...duration.options].forEach(restoreEntryDurationOption);
}
function syncEntryStartLimit(){
  const start=playStart();
  if(!start||start.tagName!=='SELECT')return;
  restoreEntryStartLimits();
  if(!playRequested()||!visitDate())return;
  const entry=timeMinutes($('entryTime')?.value||'');
  if(entry===null)return;

  const baseDisabled=new Map([...start.options].map(o=>[o,!!o.disabled]));
  const optionAt=min=>[...start.options].find(o=>timeMinutes(String(o.value||'').trim())===min)||null;

  [...start.options].forEach(o=>{
    const sm=timeMinutes(String(o.value||'').trim());
    if(sm===null||sm>=entry||baseDisabled.get(o))return;
    const gap=entry-sm;
    if(gap!==30&&gap!==60){disableEntryStartOption(o,'gap');return}
    if(gap===60){
      const next=optionAt(sm+30);
      if(!next||baseDisabled.get(next))disableEntryStartOption(o,'overlap');
    }
  });

  const selected=start.selectedOptions?.[0];
  if(selected?.disabled&&String(start.value||'')){
    start.value='';
    start.dispatchEvent(new Event('change',{bubbles:true}));
  }
}
function restoreOverlapLimit(){
  const o60=durationOption(60);
  if(o60?.dataset[OVERLAP_ATTR]==='1'){
    o60.disabled=false;
    delete o60.dataset[OVERLAP_ATTR];
  }
}
function sixtyMinutesFit(){
  const start=playStart(),v=String(start?.value||'').trim(),sm=timeMinutes(v);
  if(!start||sm===null)return null;
  const exit=timeMinutes($('exitTime')?.value||'');
  if(exit!==null&&sm+60>exit)return false;
  if(start.tagName==='SELECT'){
    const next=timeText(sm+30);
    const nextOption=[...start.options].find(o=>String(o.value||'').trim()===next);
    if(!nextOption||nextOption.disabled)return false;
  }
  return true;
}
function syncDurationLimit(){
  const duration=playDuration();
  if(!duration||duration.tagName!=='SELECT')return;
  if(!playRequested()||!visitDate()||!String(playStart()?.value||'').trim()){
    restoreOverlapLimit();
    return;
  }
  const fit=sixtyMinutesFit();
  const o60=durationOption(60),o30=durationOption(30);
  if(fit===false&&o60){
    if(!o60.disabled){o60.disabled=true;o60.dataset[OVERLAP_ATTR]='1'}
    const selected=durationMinutes(duration.selectedOptions?.[0]);
    if(selected===60&&o30&&!o30.disabled){
      duration.value=o30.value;
      duration.dispatchEvent(new Event('change',{bubbles:true}));
    }
    return;
  }
  if(fit===true)restoreOverlapLimit();
}
function syncEntryDurationLimit(){
  const duration=playDuration();
  if(!duration||duration.tagName!=='SELECT')return;
  restoreEntryDurationLimits();
  if(!playRequested()||!visitDate())return;
  const sm=timeMinutes(playStart()?.value||'');
  const entry=timeMinutes($('entryTime')?.value||'');
  if(sm===null||entry===null||sm>=entry)return;
  const required=entry-sm;
  if(required!==30&&required!==60)return;

  const requiredOption=durationOption(required);
  [...duration.options].forEach(o=>{
    const mins=durationMinutes(o);
    if((mins===30||mins===60)&&mins!==required)disableEntryDurationOption(o);
  });
  const selected=selectedDurationMinutes();
  if(selected!==required){
    if(requiredOption&&!requiredOption.disabled){
      duration.value=requiredOption.value;
      duration.dispatchEvent(new Event('change',{bubbles:true}));
    }else if(String(duration.value||'')){
      duration.value='';
      duration.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }
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
function preEntryState(){
  const sm=timeMinutes(playStart()?.value||'');
  const entry=timeMinutes($('entryTime')?.value||'');
  if(sm===null||entry===null||sm>=entry)return null;
  return {start:sm,entry,gap:entry-sm,duration:selectedDurationMinutes()};
}
function syncHelp(){
  if(!customerVisible())return;
  if(!playRequested()){setHelp('', 'ok');return}
  if(!visitDate()){
    setHelp('방문 희망일을 먼저 선택하면 놀이터 예약 가능 시간을 확인할 수 있습니다.','lock');
    return;
  }
  if(!String(playStart()?.value||'').trim()){
    setHelp('동물원 입장 전 놀이터는 입장시간 바로 직전 30분 또는 60분만 이용할 수 있습니다. 다른 단체와 시간이 겹치면 마감됩니다.','ok');
    return;
  }
  const pre=preEntryState();
  if(pre&&(pre.gap===30||pre.gap===60)){
    setHelp(`동물원 입장 전 놀이터는 ${pre.gap}분 이용 후 바로 입장하도록 연결됩니다. 다른 단체와 한 구간이라도 겹치면 예약할 수 없습니다.`,'ok');
    return;
  }
  const a=durationAvailability();
  if(a.known&&a.can30&&!a.can60){
    setHelp('다른 단체 예약으로 인해 이 시간대는 최대 30분 이용 가능합니다. 60분 이용을 원하시면 다른 입장시간을 선택해주세요.','limit');
    return;
  }
  if(a.known&&a.can60){
    setHelp('이 놀이터 입장시간은 30분 또는 60분 이용이 가능합니다.','ok');
    return;
  }
  setHelp('', 'ok');
}
function preEntryValidationMessage(){
  if(!playRequested())return '';
  const pre=preEntryState();if(!pre)return '';
  if((pre.gap!==30&&pre.gap!==60)||pre.duration!==pre.gap){
    return '동물원 입장 전 놀이터는 입장시간 바로 직전 30분 또는 60분으로만 예약할 수 있습니다.';
  }
  const startOption=playStart()?.selectedOptions?.[0];
  const durationOptionSelected=playDuration()?.selectedOptions?.[0];
  if(startOption?.disabled||durationOptionSelected?.disabled){
    return '선택한 놀이터 시간은 다른 단체 예약과 겹쳐 이용할 수 없습니다. 다른 시간을 선택해주세요.';
  }
  return '';
}
function syncLock(){
  if(!customerVisible())return;
  const noDate=!visitDate(),requested=playRequested();
  if(noDate&&requested){lockControl(playStart());lockControl(playDuration())}
  else {unlockControl(playStart());unlockControl(playDuration())}
  syncEntryStartLimit();
  syncDurationLimit();
  syncEntryDurationLimit();
  syncHelp();
}
function watchOptions(){
  const s=playStart(),d=playDuration();
  if(s&&s!==observingStart){startObserver?.disconnect();observingStart=s;startObserver=new MutationObserver(()=>setTimeout(syncLock,0));startObserver.observe(s,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','value']})}
  if(d&&d!==observingDuration){durationObserver?.disconnect();observingDuration=d;durationObserver=new MutationObserver(()=>setTimeout(syncLock,0));durationObserver.observe(d,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','value','max']})}
}
function apply(){ensureStyle();watchOptions();ensureHelp();syncLock()}
function guardSubmit(ev){
  if(!customerVisible())return;
  const msg=preEntryValidationMessage();if(!msg)return;
  ev.preventDefault();ev.stopImmediatePropagation();
  try{window.toast?.(msg)}catch{}
  try{playStart()?.scrollIntoView({behavior:'smooth',block:'center'})}catch{}
}
function boot(){
  apply();
  const t=setInterval(apply,300);setTimeout(()=>clearInterval(t),20000);
  document.addEventListener('change',e=>{
    const id=e.target?.id||'';
    if(!['visitMonth','visitDay','playUse','playStart','playDuration','entryTime','exitTime'].includes(id))return;
    setTimeout(apply,0);setTimeout(apply,80);
  },true);
  document.addEventListener('click',e=>{if(e.target?.closest?.('#submitBooking'))guardSubmit(e)},true);
  document.addEventListener('submit',e=>{if(e.target?.closest?.('#customerView'))guardSubmit(e)},true);
  const root=$('customerView')||document.body;
  new MutationObserver(()=>setTimeout(apply,0)).observe(root,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
