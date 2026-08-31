(()=>{
'use strict';
if(window.__ZR_ADMIN_SECTION_SUBTABS_V1)return;
window.__ZR_ADMIN_SECTION_SUBTABS_V1=true;

const $=id=>document.getElementById(id);
let guideMode='guide',settingsMode='operation',guideObserver=null,settingsObserver=null,pendingGuide=false,pendingSettings=false;

function injectStyle(){
  if($('zrAdminSectionSubtabsStyleV1'))return;
  const s=document.createElement('style');s.id='zrAdminSectionSubtabsStyleV1';s.textContent=`
  .zr-admin-subtabs{display:inline-flex;align-items:center;gap:4px;margin:0 0 14px;padding:4px;background:#eef3ef;border:1px solid #d7e1da;border-radius:12px;box-shadow:inset 0 1px 2px rgba(30,50,36,.04);max-width:100%;overflow-x:auto}
  .zr-admin-subtabs button{position:relative;min-width:108px;height:38px;padding:0 16px!important;border:1px solid transparent!important;border-radius:9px!important;background:transparent!important;color:#66736b!important;box-shadow:none!important;font-size:13px!important;font-weight:850!important;white-space:nowrap!important;flex:0 0 auto}
  .zr-admin-subtabs button.zr-subtab-active{background:#fff!important;color:#2f6b4f!important;border-color:#c9d9cf!important;box-shadow:0 1px 4px rgba(25,60,40,.08)!important}
  .zr-admin-subtabs button.zr-subtab-active:after{content:'';position:absolute;left:20%;right:20%;bottom:4px;height:2px;border-radius:2px;background:#2f6b4f}
  .zr-admin-subpanel.hidden{display:none!important}
  #zrGuideAdminSection .zr-admin-subtabs{margin-top:14px}
  #tab-settings>.zr-admin-subtabs{margin-top:4px}
  @media(max-width:620px){.zr-admin-subtabs{display:flex;width:100%;box-sizing:border-box}.zr-admin-subtabs button{min-width:max-content;height:40px}}
  `;document.head.appendChild(s);
}
function button(id,label,mode){const b=document.createElement('button');b.type='button';b.id=id;b.textContent=label;b.dataset.zrSubtabMode=mode;return b}
function selectMode(bar,panels,mode){
  bar?.querySelectorAll('[data-zr-subtab-mode]').forEach(b=>b.classList.toggle('zr-subtab-active',b.dataset.zrSubtabMode===mode));
  Object.entries(panels).forEach(([key,p])=>p?.classList.toggle('hidden',key!==mode));
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
    bar.addEventListener('click',e=>{const b=e.target.closest('[data-zr-subtab-mode]');if(!b)return;guideMode=b.dataset.zrSubtabMode;selectMode(bar,{guide,map,parking},guideMode)});
  }
  const mapSec=$('zrGuideMapAdminSection'),parkingSec=$('zrParkingAdminSection');
  [...card.children].forEach(el=>{
    if([bar,guide,map,parking].includes(el))return;
    if(el===mapSec)map.appendChild(el);else if(el===parkingSec)parking.appendChild(el);else guide.appendChild(el);
  });
  if(mapSec&&mapSec.parentElement!==map)map.appendChild(mapSec);
  if(parkingSec&&parkingSec.parentElement!==parking)parking.appendChild(parkingSec);
  selectMode(bar,{guide,map,parking},guideMode);
  if(!guideObserver){guideObserver=new MutationObserver(()=>{if(pendingGuide)return;pendingGuide=true;queueMicrotask(()=>{pendingGuide=false;ensureGuideSubtabs()})});guideObserver.observe(card,{childList:true,subtree:true})}
  return true;
}

function settingsReady(){return !!($('tab-settings')&&$('bookingOpenStart')&&$('saveBookingPeriod')&&$('vendorSettingsRows')&&$('saveVendorSettings')&&$('saveSmsSettings'))}
function classifySettingsCard(card){
  if(card.querySelector('#vendorSettingsRows,#saveVendorSettings'))return'outsourcing';
  if(card.querySelector('#saveSmsSettings'))return'sms';
  return'operation';
}
function ensureSettingsSubtabs(){
  if(!settingsReady())return false;injectStyle();
  const sec=$('tab-settings');let bar=$('zrSettingsSubtabsV1'),operation=$('zrSettingsOperationPanelV1'),outsourcing=$('zrSettingsOutsourcePanelV1'),sms=$('zrSettingsSmsPanelV1');
  if(!bar){
    bar=document.createElement('div');bar.id='zrSettingsSubtabsV1';bar.className='zr-admin-subtabs';bar.append(button('zrSettingsOperationSubtabV1','예약 운영','operation'),button('zrSettingsOutsourceSubtabV1','아웃소싱','outsourcing'),button('zrSettingsSmsSubtabV1','문자 안내','sms'));
    operation=document.createElement('div');operation.id='zrSettingsOperationPanelV1';operation.className='zr-admin-subpanel';outsourcing=document.createElement('div');outsourcing.id='zrSettingsOutsourcePanelV1';outsourcing.className='zr-admin-subpanel';sms=document.createElement('div');sms.id='zrSettingsSmsPanelV1';sms.className='zr-admin-subpanel';
    sec.prepend(bar);bar.insertAdjacentElement('afterend',operation);operation.insertAdjacentElement('afterend',outsourcing);outsourcing.insertAdjacentElement('afterend',sms);
    bar.addEventListener('click',e=>{const b=e.target.closest('[data-zr-subtab-mode]');if(!b)return;settingsMode=b.dataset.zrSubtabMode;selectMode(bar,{operation,outsourcing,sms},settingsMode)});
  }
  [...sec.children].filter(el=>el.classList?.contains('card')).forEach(card=>{
    const mode=classifySettingsCard(card),panel=mode==='outsourcing'?outsourcing:mode==='sms'?sms:operation;if(card.parentElement!==panel)panel.appendChild(card);
  });
  selectMode(bar,{operation,outsourcing,sms},settingsMode);
  if(!settingsObserver){settingsObserver=new MutationObserver(()=>{if(pendingSettings)return;pendingSettings=true;queueMicrotask(()=>{pendingSettings=false;ensureSettingsSubtabs()})});settingsObserver.observe(sec,{childList:true})}
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
