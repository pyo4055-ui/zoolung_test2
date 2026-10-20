// Shared administrator edit metadata and title-area presentation.
(()=>{
'use strict';
if(window.ZRAdminEditMeta)return;
const values=new Map();
const targets={scheduleContent:'#zr14ContentModal',cafe:'#tab-menuadmin',parking:'#zrParkingAdminSection',guideMap:'#zrGuideMapAdminSection',guide:'#zrGuideAdminSection',inquiryTemplate:'#tab-inquiry-reply-examples',previewTemplate:'#zrPreviewNotifyTemplatePanel',changeSms:'#zrReservationChangeSmsPanel',scheduleSms:'#zrScheduleCustomerNotifySettingsV1',vendor:'#zrSettingsOutsourcePanelV1',sms:'#zrSettingsConfirmSmsPanelV1','booking-period':'#zrSettingsOperationPanelV1','booking-lead':'#zrBookingLeadSave','booking-Closure':'#zrSettingsClosurePanelV1','booking-Peak':'#zrSettingsPeakPanelV1','reservation-limits':'#saveReservationLimits','holiday-dates':'#zrHolidaySaveV1',memo:'#zrAdminDailyMemoV1'};
function make(){const by=String(localStorage.getItem('zr_admin_display_name_v1')||'').trim();return by?{by,at:new Date().toISOString()}:null}
function text(meta){if(!meta?.by||!meta?.at)return '수정 기록 없음';const d=typeof meta.at.toDate==='function'?meta.at.toDate():new Date(meta.at);if(!Number.isFinite(d.getTime()))return '수정 기록 없음';return '마지막 수정 · '+meta.by+' · '+d.toLocaleString('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false})}
function show(root,meta,key='main'){
 if(!root)return;const title=root.querySelector('h2,h3,.zr-admin-daily-memo-title');if(!title)return;
 let line=[...root.querySelectorAll('[data-zr-edit-meta]')].find(el=>el.dataset.zrEditMeta===key);
 const saveSelectors={sms:'#saveSmsSettings',scheduleSms:'#zrSaveScheduleCustomerNotifyMessage',changeSms:'#zrSharedReservationChangeSmsSave',previewTemplate:'#zrPreviewNotifyTemplateSave'};
 const save=saveSelectors[key]?root.querySelector(saveSelectors[key]):null;
 if(!line){line=document.createElement('div');line.className='zr-edit-meta';line.dataset.zrEditMeta=key;const parent=title.parentElement;if(save){save.parentElement.before(line)}else if(key==='memo'){root.querySelector('.zr-admin-daily-memo-head').append(line)}else if(parent&&getComputedStyle(parent).display.includes('flex')&&!parent.classList.contains('zr-edit-title-group')){const group=document.createElement('div');group.className='zr-edit-title-group';title.before(group);group.append(title,line)}else title.insertAdjacentElement('afterend',line)}
 const fullLabel=text(meta);const label=key==='memo'?fullLabel.replace('마지막 수정 · ','수정 · ').replace(/(\d{4})\.\s*(\d{2})\.\s*(\d{2})\.\s*/, '$1.$2.$3 '):fullLabel;if(line.textContent!==label)line.textContent=label;if(key==='memo')line.title=fullLabel;
}
const templateSources=[['inquiryTemplate','zr_inquiry_reply_templates_v1'],['previewTemplate','zr_preview_confirm_templates_v1']];
const templateCache=new Map();
let renderPending=false;
function showScope(scope){
 const selector=targets[scope];if(!selector)return;
 let root=document.querySelector(selector);
 if(root?.tagName==='BUTTON')root=root.closest('.card');
 show(root,values.get(scope),scope);
}
function render(){
 for(const [scope,key] of templateSources){
  try{
   const raw=localStorage.getItem(key)||'[]';
   if(templateCache.get(key)!==raw){
    const rows=JSON.parse(raw);
    values.set(scope,rows.map(x=>x.adminEditMeta).filter(Boolean).sort((a,b)=>String(b.at).localeCompare(String(a.at)))[0]);
    templateCache.set(key,raw);
   }
  }catch{}
 }
 for(const scope of Object.keys(targets))showScope(scope);
}
function scheduleRender(){
 if(renderPending)return;
 renderPending=true;
 requestAnimationFrame(()=>{renderPending=false;render()});
}
function publish(scope,meta){values.set(scope,meta||null);showScope(scope)}
window.ZRAdminEditMeta=Object.freeze({make,text,show,publish,render});
const style=document.createElement('style');style.textContent='.zr-edit-title-group{min-width:0;flex:1 1 0%}.zr-edit-meta{display:block;flex:0 0 100%;min-width:0;max-width:100%;margin:5px 0 10px;color:#756b62;font-size:12px;line-height:1.5;font-weight:400;white-space:normal;overflow-wrap:anywhere;word-break:normal}.zr-admin-daily-memo-head{flex-wrap:wrap}.zr-admin-daily-memo-head>.zr-edit-meta{order:3;margin:0;font-size:11px;white-space:nowrap;overflow-wrap:normal;overflow-x:auto}@media print{.zr-edit-meta{display:none}}';document.head.appendChild(style);
document.addEventListener('click',e=>{if(e.target?.closest?.('button,a,[role=button]'))scheduleRender()});
document.addEventListener('zr:admin-runtime-ready',render);
document.addEventListener('zr:reservation-settings-synced',()=>{const meta=window.settings?.().adminEditMeta||{};for(const [scope,value]of Object.entries(meta))values.set(scope,value);scheduleRender()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();
