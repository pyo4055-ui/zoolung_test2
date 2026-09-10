(()=>{
'use strict';
if(window.__ZR_ADMIN_HOLIDAY_SETTINGS_POLISH_V1)return;
window.__ZR_ADMIN_HOLIDAY_SETTINGS_POLISH_V1=true;

const $=id=>document.getElementById(id);
let allowOriginalAdd=false;
let pendingRow=null;
let unsavedAddedDates=[];

function injectStyle(){
  if($('zrAdminHolidaySettingsPolishV1Style'))return;
  const s=document.createElement('style');
  s.id='zrAdminHolidaySettingsPolishV1Style';
  s.textContent=`
    html.zr-admin-shell-mounted body #adminView #zrHolidaySettingsCardV1{
      width:100%!important;max-width:none!important;margin:0!important;padding:18px!important
    }
    html.zr-admin-shell-mounted body #adminView #zrHolidaySettingsCardV1 .zr-holiday-toolbar{
      display:grid!important;grid-template-columns:220px 150px 130px!important;gap:8px!important;
      align-items:end!important;justify-content:start!important;width:max-content!important;max-width:100%!important
    }
    html.zr-admin-shell-mounted body #adminView #zrHolidaySettingsCardV1 .zr-holiday-toolbar label{
      margin:0!important;align-self:end!important
    }
    html.zr-admin-shell-mounted body #adminView #zrHolidaySettingsCardV1 #zrHolidayYearV1{
      height:44px!important;min-height:44px!important;margin:0!important;box-sizing:border-box!important
    }
    html.zr-admin-shell-mounted body #adminView #zrHolidayAutoLoadV1{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;align-self:end!important;
      min-width:150px!important;width:150px!important;height:44px!important;min-height:44px!important;margin:0!important;padding:0 14px!important;
      background:#195b37!important;border:1px solid #195b37!important;color:#fff!important;-webkit-text-fill-color:#fff!important;
      box-shadow:0 3px 9px rgba(25,91,55,.16)!important;font-weight:900!important;opacity:1!important;box-sizing:border-box!important
    }
    html.zr-admin-shell-mounted body #adminView #zrHolidayAutoLoadV1:hover{background:#12462b!important;border-color:#12462b!important}
    html.zr-admin-shell-mounted body #adminView #zrHolidayAddV1{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;align-self:end!important;
      min-width:130px!important;width:130px!important;height:44px!important;min-height:44px!important;margin:0!important;padding:0 12px!important;
      background:#f26828!important;border:1px solid #f26828!important;color:#fff!important;-webkit-text-fill-color:#fff!important;
      box-shadow:0 3px 9px rgba(242,104,40,.18)!important;font-weight:900!important;opacity:1!important;box-sizing:border-box!important
    }
    html.zr-admin-shell-mounted body #adminView #zrHolidayAddV1:hover{background:#d9571d!important;border-color:#d9571d!important}
    html.zr-admin-shell-mounted body #adminView #zrHolidayRowsV1{width:100%!important;max-width:100%!important}
    html.zr-admin-shell-mounted body #adminView #zrHolidayRowsV1 .zr-holiday-row{
      grid-template-columns:minmax(0,1fr) 74px!important;gap:8px!important;padding:9px!important;width:100%!important;box-sizing:border-box!important
    }
    html.zr-admin-shell-mounted body #adminView #zrHolidayRowsV1 .zr-holiday-row input[type="date"]{
      width:100%!important;height:42px!important;min-height:42px!important;box-sizing:border-box!important
    }
    html.zr-admin-shell-mounted body #adminView #zrHolidayRowsV1 .zr-holiday-row button{
      min-width:74px!important;width:74px!important;align-self:center!important
    }
    .zr-holiday-pending-row{border-style:dashed!important;border-color:#e2b38e!important;background:#fff8f1!important}
    .zr-holiday-pending-picker{display:flex;align-items:center;gap:10px;min-width:0}
    .zr-holiday-pending-picker>span{flex:0 0 auto;font-size:12px;font-weight:900;color:#78451f;white-space:nowrap}
    .zr-holiday-pending-picker>input{min-width:0;flex:1}
    @media(max-width:900px){
      html.zr-admin-shell-mounted body #adminView #zrHolidaySettingsCardV1{width:100%!important;max-width:none!important;padding:14px!important}
      html.zr-admin-shell-mounted body #adminView #zrHolidaySettingsCardV1 .zr-holiday-toolbar{grid-template-columns:1fr 1fr!important;width:100%!important}
      html.zr-admin-shell-mounted body #adminView #zrHolidaySettingsCardV1 .zr-holiday-toolbar label{grid-column:1/-1!important}
      html.zr-admin-shell-mounted body #adminView #zrHolidayAutoLoadV1,
      html.zr-admin-shell-mounted body #adminView #zrHolidayAddV1{width:100%!important;min-width:0!important}
    }
    @media(max-width:520px){
      .zr-holiday-pending-picker{display:grid;grid-template-columns:1fr;gap:5px}
      .zr-holiday-pending-picker>span{font-size:11px}
    }
  `;
  document.head.appendChild(s);
}
function selectedYear(){return String($('zrHolidayYearV1')?.value||new Date().getFullYear())}
function validDate(v,y=selectedYear()){
  const s=String(v||'');
  return /^\d{4}-\d{2}-\d{2}$/.test(s)&&s.startsWith(`${y}-`);
}
function visibleDates(){
  return [...document.querySelectorAll('#zrHolidayRowsV1 .zr-holiday-row:not(.zr-holiday-pending-row) input[type="date"]')]
    .map(x=>String(x.value||''))
    .filter(Boolean);
}
function nextOriginalCandidate(){
  const y=selectedYear(),used=new Set(visibleDates());
  for(let d=1;d<=31;d++){
    const v=`${y}-01-${String(d).padStart(2,'0')}`;
    if(!used.has(v))return v;
  }
  return `${y}-01-01`;
}
function removePending(){
  pendingRow?.remove();pendingRow=null;
}
function moveUnsavedRowsToTop(){
  const root=$('zrHolidayRowsV1');if(!root)return;
  for(const date of unsavedAddedDates){
    const input=[...root.querySelectorAll('.zr-holiday-row input[type="date"]')].find(x=>x.value===date);
    const row=input?.closest('.zr-holiday-row');if(row)root.prepend(row);
  }
}
function commitPending(value){
  const y=selectedYear();
  if(!validDate(value,y))return;
  if(visibleDates().includes(value)){
    removePending();
    try{window.toast?.('이미 등록된 공휴일입니다.')}catch{}
    return;
  }
  const candidate=nextOriginalCandidate();
  removePending();
  const add=$('zrHolidayAddV1');if(!add)return;
  allowOriginalAdd=true;
  try{add.click()}finally{allowOriginalAdd=false}
  requestAnimationFrame(()=>{
    const root=$('zrHolidayRowsV1');if(!root)return;
    const input=[...root.querySelectorAll('.zr-holiday-row input[type="date"]')].find(x=>x.value===candidate);
    if(!input)return;
    input.value=value;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    unsavedAddedDates=unsavedAddedDates.filter(x=>x!==value);
    unsavedAddedDates.push(value);
    setTimeout(moveUnsavedRowsToTop,0);
  });
}
function showPendingPicker(){
  const root=$('zrHolidayRowsV1');if(!root)return;
  if(pendingRow?.isConnected){pendingRow.querySelector('input')?.focus?.();return}
  removePending();
  const y=selectedYear();
  const row=document.createElement('div');
  row.className='zr-holiday-row zr-holiday-pending-row';
  row.innerHTML=`<div class="zr-holiday-pending-picker"><span>날짜 선택</span><input type="date" min="${y}-01-01" max="${y}-12-31" aria-label="추가할 공휴일 날짜 선택"></div><button type="button" class="btn-gray" data-zr-cancel-new-holiday="1">취소</button>`;
  root.prepend(row);pendingRow=row;
  const input=row.querySelector('input');
  input?.addEventListener('change',()=>commitPending(input.value));
  row.querySelector('[data-zr-cancel-new-holiday]')?.addEventListener('click',removePending);
  requestAnimationFrame(()=>{input?.focus?.();try{input?.showPicker?.()}catch{}});
}
function forceButtonVisual(button,kind){
  if(!button)return;
  const auto=kind==='auto';
  button.textContent=auto?'공휴일 불러오기':'+ 날짜 추가';
  button.style.setProperty('background',auto?'#195b37':'#f26828','important');
  button.style.setProperty('border',`1px solid ${auto?'#195b37':'#f26828'}`,'important');
  button.style.setProperty('color','#fff','important');
  button.style.setProperty('-webkit-text-fill-color','#fff','important');
  button.style.setProperty('opacity','1','important');
  button.style.setProperty('font-weight','900','important');
}
function prepare(){
  injectStyle();
  const auto=$('zrHolidayAutoLoadV1'),add=$('zrHolidayAddV1');
  if(auto){forceButtonVisual(auto,'auto');auto.title='선택한 연도의 공휴일을 자동으로 불러옵니다.';auto.setAttribute('aria-label','공휴일 자동 불러오기')}
  if(add){forceButtonVisual(add,'add');add.title='직접 공휴일 날짜를 추가합니다.';add.setAttribute('aria-label','공휴일 날짜 추가')}
}
function boot(){
  prepare();
  document.addEventListener('click',e=>{
    const add=e.target?.closest?.('#zrHolidayAddV1');
    if(add&&!allowOriginalAdd){
      e.preventDefault();e.stopImmediatePropagation();showPendingPicker();return;
    }
    if(e.target?.closest?.('#zrHolidaySaveV1')){
      removePending();
      unsavedAddedDates=[];
    }
  },true);
  document.addEventListener('change',e=>{
    if(e.target?.id==='zrHolidayYearV1')removePending();
  },true);
  let tries=0;
  const t=setInterval(()=>{
    prepare();
    if($('zrHolidayAutoLoadV1')&&$('zrHolidayAddV1')||++tries>120)clearInterval(t);
  },100);
  document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(prepare,80),{once:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
