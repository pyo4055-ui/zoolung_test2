(()=>{
'use strict';
if(window.__ZR_ADMIN_SECTION_SUBTABS_V1)return;
window.__ZR_ADMIN_SECTION_SUBTABS_V1=true;

const $=id=>document.getElementById(id);
let guideMode='guide',settingsMode='operation',guideObserver=null,settingsObserver=null,pendingGuide=false,pendingSettings=false;

function injectStyle(){
  if($('zrAdminSectionSubtabsStyleV1'))return;
  const s=document.createElement('style');s.id='zrAdminSectionSubtabsStyleV1';s.textContent=`
  .zr-admin-subtabs,#zrCleanupInnerTabs{display:inline-flex;align-items:center;gap:4px;margin:0 0 14px;padding:4px;background:#eef3ef;border:1px solid #d7e1da;border-radius:12px;box-shadow:inset 0 1px 2px rgba(30,50,36,.04);max-width:100%;overflow-x:auto}
  .zr-admin-subtabs button,#zrCleanupInnerTabs button{position:relative;min-width:108px;height:38px;padding:0 16px!important;border:1px solid transparent!important;border-radius:9px!important;background:transparent!important;color:#66736b!important;box-shadow:none!important;font-size:13px!important;font-weight:800!important;line-height:1!important;white-space:nowrap!important;flex:0 0 auto}
  .zr-admin-subtabs button.zr-subtab-active,#zrCleanupInnerTabs button.btn-primary{background:#fff!important;color:#2f6b4f!important;border-color:#bad1c1!important;box-shadow:0 2px 6px rgba(30,50,36,.08)!important}
  .zr-admin-subtabs button.zr-subtab-active:after,#zrCleanupInnerTabs button.btn-primary:after{content:'';position:absolute;left:18px;right:18px;bottom:4px;height:2px;border-radius:999px;background:#2f6b4f}
  .zr-admin-subtabs button:hover,#zrCleanupInnerTabs button:hover{background:#f8faf8!important;color:#2f6b4f!important}
  .zr-admin-subpanel.hidden{display:none!important}
  #zrGuideAdminSection .zr-admin-subtabs{margin-top:14px}
  #tab-settings>.zr-admin-subtabs{margin-top:4px}
  #zrGuideSubpanelV1 [data-k="imageUrl"],#zrGuideMapSubpanelV1 #zrGuideMapImageUrl{visibility:visible!important;opacity:1!important}
  @media(max-width:620px){.zr-admin-subtabs{display:flex;width:100%;box-sizing:border-box}.zr-admin-subtabs button{min-width:max-content;height:40px}}
  `;document.head.appendChild(s);
}
function button(id,label,mode){const b=document.createElement('button');b.type='button';b.id=id;b.textContent=label;b.dataset.zrSubtabMode=mode;return b}
function selectMode(bar,panels,mode){
  bar?.querySelectorAll('[data-zr-subtab-mode]').forEach(b=>b.classList.toggle('zr-subtab-active',b.dataset.zrSubtabMode===mode));
  Object.entries(panels).forEach(([key,p])=>p?.classList.toggle('hidden',key!==mode));
}
function restoreGuideUrlFields(){
  document.querySelectorAll('#zrGuideAdminContents [data-k="imageUrl"]').forEach(input=>{
    input.hidden=false;input.style.removeProperty('display');input.style.removeProperty('visibility');
    const full=input.closest('.full');if(full){full.hidden=false;full.style.removeProperty('display');full.style.removeProperty('visibility')}
  });
  const mapInput=$('zrGuideMapImageUrl');
  if(mapInput){
    mapInput.hidden=false;mapInput.style.removeProperty('display');mapInput.style.removeProperty('visibility');
    const box=mapInput.parentElement;if(box){box.hidden=false;box.style.removeProperty('display');box.style.removeProperty('visibility')}
    const row=mapInput.closest('.zr-gmap-row');if(row){row.hidden=false;row.style.removeProperty('display');row.style.removeProperty('visibility')}
  }
}

function guidePartsReady(){return !!($('zrGuideAdminSection')?.querySelector('.card')&&$('zrGuideAdminContents')&&$('zrGuideAdminNotices')&&$('zrGuideAdminSave'))}
function ensureGuideSubtabs(){
  if(!guidePartsReady())return false;injectStyle();
  const sec=$('zrGuideAdminSection'),card=sec.querySelector('.card');
  let bar=$('zrGuideSubtabsV1'),guide=$('zrGuideSubpanelV1'),map=$('zrGuideMapSubpanelV1'),parking=$('zrGuideParkingSubpanelV1');
  if(!bar){
    bar=document.createElement('div');bar.id='zrGuideSubtabsV1';bar.className='zr-admin-subtabs';bar.append(button('zrGuideInfoSubtabV1','이용 안내','guide'),button('zrGuideMapSubtabV1','가이드맵','map'),button('zrGuideParkingSubtabV1','주차 안내','parking'));
    guide=document.createElement('div');guide.id='zrGuideSubpanelV1';guide.className='zr-admin-subpanel';map=document.createElement('div');map.id='zrGuideMapSubpanelV1';map.className='zr-admin-subpanel';parking=document.createElement('div');parking.id='zrGuideParkingSubpanelV1';parking.className='zr-admin-subpanel';
    card.prepend(bar);bar.insertAdjacentElement('afterend',guide);guide.insertAdjacentElement('afterend',map);map.insertAdjacentElement('afterend',parking);
    bar.addEventListener('click',e=>{const b=e.target.closest('[data-zr-subtab-mode]');if(!b)return;guideMode=b.dataset.zrSubtabMode;selectMode(bar,{guide,map,parking},guideMode);restoreGuideUrlFields()});
  }
  const mapSec=$('zrGuideMapAdminSection'),parkingSec=$('zrParkingAdminSection');
  [...card.children].forEach(el=>{
    if([bar,guide,map,parking].includes(el))return;
    if(el===mapSec)map.appendChild(el);else if(el===parkingSec)parking.appendChild(el);else guide.appendChild(el);
  });
  if(mapSec&&mapSec.parentElement!==map)map.appendChild(mapSec);
  if(parkingSec&&parkingSec.parentElement!==parking)parking.appendChild(parkingSec);
  restoreGuideUrlFields();
  selectMode(bar,{guide,map,parking},guideMode);
  if(!guideObserver){guideObserver=new MutationObserver(()=>{if(pendingGuide)return;pendingGuide=true;queueMicrotask(()=>{pendingGuide=false;ensureGuideSubtabs()})});guideObserver.observe(card,{childList:true,subtree:true})}
  return true;
}

function settingsReady(){return !!($('tab-settings')&&$('bookingOpenStart')&&$('saveBookingPeriod')&&$('vendorSettingsRows')&&$('saveVendorSettings')&&$('saveSmsSettings'))}
function classifySettingsCard(card){
  if(card.id==='zrScheduleCustomerNotifySettingsV1'||card.querySelector('#zrScheduleCustomerNotifyMessage,#zrSaveScheduleCustomerNotifyMessage'))return'scheduleSms';
  if(card.querySelector('#vendorSettingsRows,#saveVendorSettings'))return'outsourcing';
  if(card.querySelector('#saveSmsSettings'))return'confirmSms';
  return'operation';
}
function settingsCards(sec){
  return [...sec.querySelectorAll(':scope > .card,:scope > .zr-admin-subpanel > .card')];
}
function ensureSettingsSubtabs(){
  if(!settingsReady())return false;injectStyle();
  const sec=$('tab-settings');let bar=$('zrSettingsSubtabsV1'),operation=$('zrSettingsOperationPanelV1'),scheduleSms=$('zrSettingsScheduleSmsPanelV1'),outsourcing=$('zrSettingsOutsourcePanelV1'),confirmSms=$('zrSettingsConfirmSmsPanelV1');
  if(!bar){
    bar=document.createElement('div');bar.id='zrSettingsSubtabsV1';bar.className='zr-admin-subtabs';
    bar.append(
      button('zrSettingsOperationSubtabV1','예약운영','operation'),
      button('zrSettingsScheduleSmsSubtabV1','스케줄알림문자','scheduleSms'),
      button('zrSettingsOutsourceSubtabV1','아웃소싱업체설정','outsourcing'),
      button('zrSettingsConfirmSmsSubtabV1','예약확정문자','confirmSms')
    );
    operation=document.createElement('div');operation.id='zrSettingsOperationPanelV1';operation.className='zr-admin-subpanel';
    scheduleSms=document.createElement('div');scheduleSms.id='zrSettingsScheduleSmsPanelV1';scheduleSms.className='zr-admin-subpanel';
    outsourcing=document.createElement('div');outsourcing.id='zrSettingsOutsourcePanelV1';outsourcing.className='zr-admin-subpanel';
    confirmSms=document.createElement('div');confirmSms.id='zrSettingsConfirmSmsPanelV1';confirmSms.className='zr-admin-subpanel';
    sec.prepend(bar);bar.insertAdjacentElement('afterend',operation);operation.insertAdjacentElement('afterend',scheduleSms);scheduleSms.insertAdjacentElement('afterend',outsourcing);outsourcing.insertAdjacentElement('afterend',confirmSms);
    bar.addEventListener('click',e=>{const b=e.target.closest('[data-zr-subtab-mode]');if(!b)return;settingsMode=b.dataset.zrSubtabMode;selectMode(bar,{operation,scheduleSms,outsourcing,confirmSms},settingsMode)});
  }
  settingsCards(sec).forEach(card=>{
    const mode=classifySettingsCard(card);
    const panel=mode==='scheduleSms'?scheduleSms:mode==='outsourcing'?outsourcing:mode==='confirmSms'?confirmSms:operation;
    if(card.parentElement!==panel)panel.appendChild(card);
  });
  selectMode(bar,{operation,scheduleSms,outsourcing,confirmSms},settingsMode);
  if(!settingsObserver){settingsObserver=new MutationObserver(()=>{if(pendingSettings)return;pendingSettings=true;queueMicrotask(()=>{pendingSettings=false;ensureSettingsSubtabs()})});settingsObserver.observe(sec,{childList:true,subtree:true})}
  return true;
}
function refresh(){ensureGuideSubtabs();ensureSettingsSubtabs()}
function boot(){
  refresh();
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#zrGuideAdminTab'))setTimeout(ensureGuideSubtabs,60);
    const settings=e.target?.closest?.('#adminView .admin-tabs button');if(settings&&settings.textContent.trim()==='예약설정')setTimeout(ensureSettingsSubtabs,60);
  },true);
  const t=setInterval(refresh,300);setTimeout(()=>clearInterval(t),30000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
