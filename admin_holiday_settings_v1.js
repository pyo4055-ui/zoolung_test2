(()=>{
'use strict';
if(window.__ZR_ADMIN_HOLIDAY_SETTINGS_V1)return;
window.__ZR_ADMIN_HOLIDAY_SETTINGS_V1=true;

const $=id=>document.getElementById(id);
const AUTO_API_BASE='https://date.nager.at/api/v3/PublicHolidays';
let year=String(new Date().getFullYear());
let draft=[];
let dirty=false;
let barBound=false;
let mobileObserver=null;
let adminRenderWrapped=null;
let refreshTimer=0;

function readSettings(){
  try{
    const fn=typeof window.settings==='function'?window.settings:(typeof settings==='function'?settings:null);
    const value=fn?.();
    return value&&typeof value==='object'?value:{};
  }catch{return {}}
}
function writeSettings(value){
  try{
    const fn=typeof window.saveSettings==='function'?window.saveSettings:(typeof saveSettings==='function'?saveSettings:null);
    if(typeof fn!=='function')return false;
    fn(value);return true;
  }catch{return false}
}
function api(){return window.zrHolidayBookingSettingV1Api||null}
function validDate(v,y=year){
  const s=String(v||'');
  return /^\d{4}-\d{2}-\d{2}$/.test(s)&&(!y||s.startsWith(`${y}-`));
}
function normalizeDates(list,y=year){
  const helper=api()?.normalizeDateList;
  if(typeof helper==='function')return helper(list,y);
  return [...new Set((Array.isArray(list)?list:[]).map(String).filter(v=>validDate(v,y)))].sort();
}
function effectiveDates(y){
  const helper=api()?.effectiveDatesForYear;
  if(typeof helper==='function')return normalizeDates(helper(y),y);
  const map=readSettings().holidayDatesByYear||{};
  return normalizeDates(map[y],y);
}
function configuredDates(y){
  const helper=api()?.configuredDatesForYear;
  if(typeof helper==='function')return normalizeDates(helper(y),y);
  const map=readSettings().holidayDatesByYear||{};
  return normalizeDates(map[y],y);
}
function toastMsg(message){
  try{if(typeof window.toast==='function')window.toast(message);else if(typeof toast==='function')toast(message)}catch{}
}
function adminAllowed(){
  try{return typeof window.adminGuard==='function'?window.adminGuard(false):(typeof adminGuard==='function'?adminGuard(false):true)}
  catch{return true}
}
function injectStyle(){
  if($('zrAdminHolidaySettingsV1Style'))return;
  const s=document.createElement('style');
  s.id='zrAdminHolidaySettingsV1Style';
  s.textContent=`
  #zrSettingsHolidayPanelV1{display:block}
  #zrSettingsHolidayPanelV1.hidden{display:none!important}
  #zrHolidaySettingsCardV1{padding:18px!important}
  .zr-holiday-toolbar{display:grid;grid-template-columns:minmax(150px,220px) auto auto;gap:10px;align-items:end;margin:4px 0 12px}
  .zr-holiday-toolbar label{display:flex;flex-direction:column;gap:6px;min-width:0}
  .zr-holiday-toolbar select,.zr-holiday-toolbar button{min-height:42px}
  .zr-holiday-summary{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 12px}
  .zr-holiday-chip{display:inline-flex;align-items:center;min-height:28px;padding:0 10px;border:1px solid #e5dbd2;border-radius:999px;background:#fff9f4;color:#67574e;font-size:11px;font-weight:850}
  .zr-holiday-list{display:grid;gap:8px;margin-top:10px}
  .zr-holiday-row{display:grid;grid-template-columns:minmax(0,1fr) 74px;gap:8px;align-items:center;padding:9px;border:1px solid #e7ddd4;border-radius:12px;background:#fff}
  .zr-holiday-row input{width:100%;min-height:42px;margin:0!important}
  .zr-holiday-row button{min-height:38px;margin:0!important;padding:0 10px!important}
  .zr-holiday-empty{padding:18px;border:1px dashed #d9cec5;border-radius:12px;background:#faf7f3;color:#776d66;text-align:center;font-size:13px}
  .zr-holiday-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}
  .zr-holiday-auto-note{margin-top:6px;color:#7a7069;font-size:11.5px;line-height:1.55}
  @media(max-width:900px){
    #zrHolidaySettingsCardV1{padding:14px!important}
    .zr-holiday-toolbar{grid-template-columns:1fr 1fr}
    .zr-holiday-toolbar label{grid-column:1/-1}
    .zr-holiday-toolbar button{width:100%!important;min-width:0!important}
    .zr-holiday-row{grid-template-columns:minmax(0,1fr) 68px}
    .zr-holiday-actions button{width:100%!important}
  }
  `;
  document.head.appendChild(s);
}
function yearOptions(){
  const now=new Date().getFullYear();
  const start=Math.min(now-1,2026),end=Math.max(now+10,2036);
  let html='';
  for(let y=start;y<=end;y++)html+=`<option value="${y}">${y}년</option>`;
  return html;
}
function ensurePanel(){
  const sec=$('tab-settings'),bar=$('zrSettingsSubtabsV1');
  if(!sec||!bar)return false;
  injectStyle();
  let btn=$('zrSettingsHolidaySubtabV1');
  if(!btn){
    btn=document.createElement('button');
    btn.type='button';btn.id='zrSettingsHolidaySubtabV1';btn.textContent='공휴일 설정';btn.dataset.zrSubtabMode='holiday';
    const operation=$('zrSettingsOperationSubtabV1');
    if(operation?.nextSibling)bar.insertBefore(btn,operation.nextSibling);else bar.appendChild(btn);
  }
  let panel=$('zrSettingsHolidayPanelV1');
  if(!panel){
    panel=document.createElement('div');panel.id='zrSettingsHolidayPanelV1';panel.className='hidden';
    const operationPanel=$('zrSettingsOperationPanelV1');
    if(operationPanel?.nextSibling)operationPanel.parentElement.insertBefore(panel,operationPanel.nextSibling);else sec.appendChild(panel);
  }
  let card=$('zrHolidaySettingsCardV1');
  if(!card){
    card=document.createElement('div');card.id='zrHolidaySettingsCardV1';card.className='card';
    card.innerHTML=`
      <div class="zr-holiday-toolbar">
        <label><span>연도</span><select id="zrHolidayYearV1">${yearOptions()}</select></label>
        <button type="button" class="btn-soft" id="zrHolidayAutoLoadV1">공휴일 불러오기</button>
        <button type="button" class="btn-gray" id="zrHolidayAddV1">+ 날짜 추가</button>
      </div>
      <div class="help">이 화면에서는 연도별 공휴일 날짜만 관리합니다. <b>공휴일 예약 가능 여부</b>는 기존 예약 운영 탭의 설정을 그대로 사용합니다.</div>
      <div class="zr-holiday-auto-note">자동 불러오기는 한국 공휴일 데이터를 현재 목록에 추가만 합니다. 바로 적용되지 않으며 목록을 확인한 뒤 저장해야 고객 예약에 반영됩니다.</div>
      <div class="zr-holiday-summary" id="zrHolidaySummaryV1"></div>
      <div class="zr-holiday-list" id="zrHolidayRowsV1"></div>
      <div class="zr-holiday-actions"><button type="button" class="btn-primary" id="zrHolidaySaveV1">공휴일 설정 저장</button></div>`;
    panel.appendChild(card);
    $('zrHolidayYearV1').value=year;
    $('zrHolidayYearV1').addEventListener('change',onYearChange);
    $('zrHolidayAutoLoadV1').addEventListener('click',autoLoad);
    $('zrHolidayAddV1').addEventListener('click',addDate);
    $('zrHolidaySaveV1').addEventListener('click',saveDates);
    $('zrHolidayRowsV1').addEventListener('input',onRowsInput);
    $('zrHolidayRowsV1').addEventListener('click',onRowsClick);
    resetDraft(year);
  }
  if(!barBound){
    barBound=true;
    bar.addEventListener('click',e=>{
      const tab=e.target?.closest?.('[data-zr-subtab-mode]');if(!tab)return;
      const holiday=tab.dataset.zrSubtabMode==='holiday';
      setTimeout(()=>{
        panel.classList.toggle('hidden',!holiday);
        if(holiday){
          btn.classList.add('zr-subtab-active');
          for(const id of ['zrSettingsOperationPanelV1','zrSettingsScheduleSmsPanelV1','zrSettingsOutsourcePanelV1','zrSettingsConfirmSmsPanelV1'])$(id)?.classList.add('hidden');
          renderDraft();syncHolidayHeader();
        }
      },0);
    });
  }
  return true;
}
function resetDraft(y){
  year=String(y||new Date().getFullYear());
  draft=effectiveDates(year);
  dirty=false;
  const select=$('zrHolidayYearV1');if(select&&select.value!==year)select.value=year;
  renderDraft();
}
function renderDraft(){
  const root=$('zrHolidayRowsV1'),summary=$('zrHolidaySummaryV1');if(!root||!summary)return;
  draft=normalizeDates(draft,year);
  const configured=configuredDates(year);
  summary.innerHTML=`<span class="zr-holiday-chip">${year}년 적용 ${draft.length}일</span><span class="zr-holiday-chip">공용 저장 ${configured.length}일</span>${dirty?'<span class="zr-holiday-chip">저장 전 변경사항 있음</span>':''}`;
  if(!draft.length){root.innerHTML='<div class="zr-holiday-empty">등록된 공휴일이 없습니다. 날짜를 직접 추가하거나 공휴일 불러오기를 이용하세요.</div>';return}
  root.innerHTML=draft.map((date,i)=>`<div class="zr-holiday-row" data-index="${i}"><input type="date" value="${date}" min="${year}-01-01" max="${year}-12-31" aria-label="공휴일 날짜"><button type="button" class="btn-gray" data-remove-holiday="${i}">삭제</button></div>`).join('');
}
function onRowsInput(e){
  const row=e.target?.closest?.('.zr-holiday-row');if(!row||e.target.type!=='date')return;
  const i=Number(row.dataset.index);if(!Number.isInteger(i)||i<0||i>=draft.length)return;
  const value=String(e.target.value||'');if(!validDate(value,year))return;
  draft[i]=value;draft=normalizeDates(draft,year);dirty=true;renderDraft();
}
function onRowsClick(e){
  const btn=e.target?.closest?.('[data-remove-holiday]');if(!btn)return;
  const i=Number(btn.dataset.removeHoliday);if(!Number.isInteger(i)||i<0||i>=draft.length)return;
  draft.splice(i,1);dirty=true;renderDraft();
}
function onYearChange(e){
  const next=String(e.target.value||'');
  if(!/^\d{4}$/.test(next))return;
  if(dirty&&!window.confirm('저장하지 않은 공휴일 변경사항이 있습니다. 다른 연도로 이동할까요?')){e.target.value=year;return}
  resetDraft(next);
}
function addDate(){
  const first=`${year}-01-01`;
  let candidate=first;
  for(let d=1;d<=31;d++){
    const v=`${year}-01-${String(d).padStart(2,'0')}`;
    if(!draft.includes(v)){candidate=v;break}
  }
  draft.push(candidate);draft=normalizeDates(draft,year);dirty=true;renderDraft();
  requestAnimationFrame(()=>$('zrHolidayRowsV1')?.querySelector(`[value="${candidate}"]`)?.focus?.());
}
async function autoLoad(){
  if(!adminAllowed())return;
  const btn=$('zrHolidayAutoLoadV1');if(!btn||btn.disabled)return;
  const old=btn.textContent;btn.disabled=true;btn.textContent='불러오는 중...';
  try{
    const res=await fetch(`${AUTO_API_BASE}/${encodeURIComponent(year)}/KR`,{cache:'no-store'});
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    const json=await res.json();
    const incoming=normalizeDates((Array.isArray(json)?json:[]).map(x=>x?.date),year);
    if(!incoming.length)throw new Error('empty holiday list');
    const before=draft.length;
    draft=normalizeDates([...draft,...incoming],year);
    const added=draft.length-before;
    dirty=true;renderDraft();
    toastMsg(`${year}년 공휴일을 불러왔습니다. ${added}개 날짜가 추가되었습니다.`);
  }catch(e){
    console.error('holiday auto load',e);
    toastMsg('공휴일 자동 불러오기에 실패했습니다. 날짜를 직접 추가해주세요.');
  }finally{btn.disabled=false;btn.textContent=old}
}
function saveDates(){
  if(!adminAllowed())return;
  const clean=normalizeDates(draft,year);
  if(clean.some(v=>!validDate(v,year))){toastMsg('공휴일 날짜를 다시 확인해주세요.');return}
  const current=readSettings();
  const map=current.holidayDatesByYear&&typeof current.holidayDatesByYear==='object'?{...current.holidayDatesByYear}:{};
  map[year]=clean;
  if(!writeSettings({...current,holidayDatesByYear:map})){
    toastMsg('공휴일 설정 저장에 실패했습니다.');return
  }
  draft=clean;dirty=false;renderDraft();
  try{window.renderVisitDays?.()}catch{}
  try{window.renderAdmin?.()}catch{}
  setTimeout(decorateAdminCalendar,0);
  toastMsg(`${year}년 공휴일 설정을 저장했습니다.`);
}
function selectHolidayTab(){
  if(!ensurePanel())return false;
  const btn=$('zrSettingsHolidaySubtabV1');if(!btn)return false;
  btn.click();
  setTimeout(()=>{syncHolidayHeader();renderDraft()},20);
  return true;
}
function ensurePcSidebarItem(){
  const wrap=document.querySelector('#zrAdminShellRail [data-zr-submenu-parent="settings"]');
  const inner=wrap?.querySelector('.zr-admin-shell-submenu-inner');if(!inner)return false;
  if(inner.querySelector('[data-zr-admin-subitem="settings-holiday"]'))return true;
  const b=document.createElement('button');b.type='button';b.className='zr-admin-shell-subitem';b.dataset.zrAdminSubitem='settings-holiday';b.dataset.targetId='zrSettingsHolidaySubtabV1';b.textContent='공휴일 설정';
  const first=inner.querySelector('[data-zr-admin-subitem="settings-operation"]');
  if(first?.nextSibling)inner.insertBefore(b,first.nextSibling);else inner.appendChild(b);
  b.addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();
    const parent=document.querySelector('#zrAdminShellRail [data-zr-admin-item="settings"]');
    if(parent&&!parent.classList.contains('is-active'))parent.click();
    setTimeout(selectHolidayTab,20);
  });
  return true;
}
function mobileSettingsSection(panel){
  return [...panel.querySelectorAll('.zrm-section')].find(sec=>String(sec.querySelector('.zrm-main')?.textContent||'').replace(/\s+/g,'')==='예약설정')||null;
}
function ensureMobileItem(){
  const panel=$('zrAdminMobileSubnavV3');if(!panel)return false;
  const section=mobileSettingsSection(panel);if(!section)return false;
  let children=section.querySelector('.zrm-children');if(!children)return false;
  if(children.querySelector('[data-zr-holiday-mobile="1"]'))return true;
  const b=document.createElement('button');b.type='button';b.className='zrm-child';b.dataset.zrHolidayMobile='1';b.textContent='공휴일 설정';
  const first=children.firstElementChild;
  if(first?.nextSibling)children.insertBefore(b,first.nextSibling);else children.appendChild(b);
  b.addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();
    panel.classList.remove('is-open');
    const parent=document.querySelector('#zrAdminShellRail [data-zr-admin-item="settings"]');
    if(parent&&!parent.classList.contains('is-active'))parent.click();
    setTimeout(selectHolidayTab,40);
  });
  return true;
}
function installMobileObserver(){
  const panel=$('zrAdminMobileSubnavV3');if(!panel||mobileObserver)return false;
  mobileObserver=new MutationObserver(()=>{ensureMobileItem();syncMobileActive()});
  mobileObserver.observe(panel,{childList:true,subtree:true});
  ensureMobileItem();return true;
}
function syncMobileActive(){
  const b=document.querySelector('#zrAdminMobileSubnavV3 [data-zr-holiday-mobile="1"]');
  if(b)b.classList.toggle('is-active',$('zrSettingsHolidaySubtabV1')?.classList.contains('zr-subtab-active'));
}
function syncHolidayHeader(){
  const btn=$('zrSettingsHolidaySubtabV1'),panel=$('zrSettingsHolidayPanelV1');
  if(!btn||!panel||!btn.classList.contains('zr-subtab-active')||panel.classList.contains('hidden'))return;
  const head=$('tab-settings')?.querySelector(':scope > .zr-admin-section-head');
  const title=head?.querySelector('.zr-admin-section-head-title');if(title)title.textContent='공휴일 설정';
  const help=head?.querySelector('.zr-admin-section-help');
  if(help){help.dataset.zrHolidayHelp='1';help.setAttribute('aria-label','공휴일 설정 도움말');help.title='공휴일 설정 도움말'}
  syncMobileActive();
}
function showHolidayHelp(){
  const modal=$('zrAdminSectionHelpModalV1'),title=$('zrAdminHelpTitle'),body=$('zrAdminHelpBody');if(!modal||!title||!body)return false;
  title.textContent='공휴일 설정 도움말';body.textContent='';
  for(const text of ['연도별로 고객 예약에서 공휴일로 판단할 날짜를 관리합니다.','공휴일 불러오기는 현재 목록에 날짜를 추가하며, 저장 버튼을 눌러야 실제 예약 설정에 반영됩니다.','공휴일에 예약을 받을지 여부는 예약 운영 탭의 공휴일 예약 가능 여부 설정을 그대로 사용합니다.']){
    const row=document.createElement('div');row.className='zr-admin-help-line';row.textContent=text;body.appendChild(row)
  }
  modal.hidden=false;return true;
}
function decorateAdminCalendar(){
  const root=$('adminCalendar'),ym=String($('adminMonth')?.value||'');if(!root||!/^\d{4}-\d{2}$/.test(ym)||typeof api()?.isHoliday!=='function')return;
  const [y,m]=ym.split('-').map(Number);
  root.querySelectorAll('.day').forEach(day=>{
    const first=day.querySelector('.num > span:first-child')||day.querySelector('.num span');
    const match=String(first?.textContent||'').trim().match(/^(\d{1,2})일/);if(!match||!first)return;
    const d=Number(match[1]),date=`${ym}-${String(d).padStart(2,'0')}`,holiday=!!api().isHoliday(date),dow=new Date(y,m-1,d,12).getDay();
    day.classList.toggle('zr2-hol',holiday);day.dataset.holiday=holiday?'true':'false';
    let tag=first.querySelector('.zr2-holiday');
    if(holiday&&!tag){tag=document.createElement('small');tag.className='zr2-holiday';tag.textContent=' 공휴일';first.appendChild(tag)}
    if(!holiday&&tag)tag.remove();
    first.classList.toggle('zr2-red',holiday||dow===0);first.classList.toggle('zr2-blue',!holiday&&dow===6);
  });
}
function hookRenderAdmin(){
  const fn=typeof window.renderAdmin==='function'?window.renderAdmin:null;if(!fn||fn===adminRenderWrapped)return false;
  if(fn.__zrManagedHolidayCalendar){adminRenderWrapped=fn;return false}
  const base=fn;
  const wrapped=function(){const out=base.apply(this,arguments);setTimeout(decorateAdminCalendar,0);return out};
  for(const key of Object.keys(base)){try{wrapped[key]=base[key]}catch{}}
  wrapped.__zrManagedHolidayCalendar=true;adminRenderWrapped=wrapped;window.renderAdmin=wrapped;try{renderAdmin=wrapped}catch{}
  return true;
}
function refresh(){
  ensurePanel();ensurePcSidebarItem();ensureMobileItem();installMobileObserver();hookRenderAdmin();decorateAdminCalendar();syncHolidayHeader();
}
function boot(){
  refresh();
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#zrSettingsHolidaySubtabV1'))setTimeout(()=>{syncHolidayHeader();renderDraft()},0);
    if(e.target?.closest?.('#tab-settings > .zr-admin-section-head .zr-admin-section-help')&&$('zrSettingsHolidaySubtabV1')?.classList.contains('zr-subtab-active')){
      e.preventDefault();e.stopImmediatePropagation();showHolidayHelp();
    }
  },true);
  document.addEventListener('zr:reservation-settings-synced',()=>{
    if(!dirty)resetDraft(year);
    setTimeout(()=>{decorateAdminCalendar();syncHolidayHeader()},0);
  });
  refreshTimer=setInterval(refresh,300);
  setTimeout(()=>{clearInterval(refreshTimer);refreshTimer=0},30000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
