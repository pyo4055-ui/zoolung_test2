(()=>{
'use strict';
if(window.__ZR_ADMIN_RESERVATION_CHANGE_ROUTE_ADAPTER_V1)return;
window.__ZR_ADMIN_RESERVATION_CHANGE_ROUTE_ADAPTER_V1=true;

const $=id=>document.getElementById(id);
let mode='';
let headerObserver=null;

function changeModeFromTarget(target){
  if(target==='zrReservationChangeAdminSmsSubtab')return 'sms';
  return 'requests';
}
function rootInquiryButton(){
  return document.querySelector('#adminView .admin-tabs [data-tab="inquiries"]')||[...document.querySelectorAll('#adminView .admin-tabs button')].find(b=>(b.textContent||'').trim()==='1:1 문의')||null;
}
function shellItem(id){return document.querySelector(`#zrAdminShellRail [data-zr-admin-item="${id}"]`)}
function shellWrap(id){return document.querySelector(`.zr-admin-shell-item-wrap[data-zr-submenu-parent="${id}"]`)}
function setShellOpen(id){
  for(const key of ['inquiries','reservationChange']){
    const wrap=shellWrap(key),item=shellItem(key),on=key===id;
    wrap?.classList.toggle('is-submenu-open',on);
    item?.setAttribute('aria-expanded',on?'true':'false');
  }
}
function setShellActive(id){
  for(const key of ['inquiries','reservationChange'])shellItem(key)?.classList.toggle('is-active',key===id);
}
function clearChangeActive(){
  for(const id of ['zrReservationChangeAdminRequestSubtab','zrReservationChangeAdminSmsSubtab']){
    const b=$(id);if(!b)continue;
    b.classList.remove('btn-primary','zr-subtab-active');
    b.classList.add('btn-gray','zr-change-inner-tab');
    b.setAttribute('aria-selected','false');
  }
}
function headerText(title,path){
  const t=$('zrAdminShellPageTitle'),p=$('zrAdminShellPath');
  if(t&&t.textContent!==title)t.textContent=title;
  if(p&&p.textContent!==path)p.textContent=path;
}
function enforceHeader(){
  if(mode==='requests'||mode==='sms')headerText('예약변경현황','고객 › 예약변경현황');
  else if(mode==='inquiry'||mode==='examples')headerText('1:1 문의','고객 › 1:1 문의');
}
function installHeaderGuard(){
  const header=$('zrAdminShellHeader');if(!header||headerObserver)return false;
  headerObserver=new MutationObserver(()=>{if(mode)queueMicrotask(enforceHeader)});
  headerObserver.observe(header,{subtree:true,childList:true,characterData:true});
  return true;
}
function directInquiryPanels(){
  const main=$('tab-inquiry-reply-v1');if(!main)return[];
  return [...main.children].filter(el=>el.classList?.contains('zr-ir-panel')&&!['zrReservationChangeAdminPanel','zrReservationChangeSmsPanel'].includes(el.id));
}
function forceInquirySurface(which='inquiry'){
  const examples=which==='examples';
  $('zrReservationChangeAdminPanel')?.classList.add('hidden');
  $('zrReservationChangeSmsPanel')?.classList.add('hidden');
  directInquiryPanels().forEach(el=>el.classList.toggle('hidden',examples));
  $('tab-inquiry-reply-examples')?.classList.toggle('hidden',!examples);
  const inquiry=$('zrInquiryReplyInquirySubtab'),example=$('zrInquiryReplyExampleSubtab');
  if(inquiry){inquiry.classList.toggle('btn-primary',!examples);inquiry.classList.toggle('btn-gray',examples)}
  if(example){example.classList.toggle('btn-primary',examples);example.classList.toggle('btn-gray',!examples)}
}
function openInquiry(which='inquiry'){
  mode=which==='examples'?'examples':'inquiry';
  clearChangeActive();
  setShellOpen('inquiries');setShellActive('inquiries');
  rootInquiryButton()?.click();
  setTimeout(()=>{
    clearChangeActive();
    const target=$(which==='examples'?'zrInquiryReplyExampleSubtab':'zrInquiryReplyInquirySubtab');
    target?.click();
    forceInquirySurface(which);
    setShellActive('inquiries');enforceHeader();
  },20);
  [80,180,420].forEach(ms=>setTimeout(()=>{if(mode===which||mode===(which==='examples'?'examples':'inquiry')){forceInquirySurface(which);setShellActive('inquiries');enforceHeader()}},ms));
}
function openReservation(which='requests'){
  mode=which==='sms'?'sms':'requests';
  setShellOpen('reservationChange');setShellActive('reservationChange');
  rootInquiryButton()?.click();
  setTimeout(()=>{
    mode=which==='sms'?'sms':'requests';
    const target=$(which==='sms'?'zrReservationChangeAdminSmsSubtab':'zrReservationChangeAdminRequestSubtab');
    target?.click();
    setShellActive('reservationChange');enforceHeader();
  },20);
  [80,180,420].forEach(ms=>setTimeout(()=>{if(mode===which){setShellActive('reservationChange');enforceHeader()}},ms));
}
function leaveSpecialMode(){
  if(!mode)return;
  mode='';clearChangeActive();
  shellItem('reservationChange')?.classList.remove('is-active');
}
function installStyle(){
  if($('zrReservationChangeRouteAdapterStyleV1'))return;
  const s=document.createElement('style');s.id='zrReservationChangeRouteAdapterStyleV1';s.textContent=`
  #zrReservationChangeAdminList .zr-cr-status.done{background:#e7f5ed!important;border-color:#b9dcc7!important;color:#1f7a4d!important}
  #zrReservationChangeAdminList .zr-cr-actions button[data-zr-shared-apply],#zrReservationChangeAdminList .zr-cr-actions button[data-change-apply]{background:#fc5404!important;border-color:#fc5404!important;color:#fff!important}
  #zrReservationChangeAdminList .zr-cr-actions button[data-zr-shared-detail],#zrReservationChangeAdminList .zr-cr-actions button[data-change-detail]{background:#f5f1ee!important;border-color:#ddd1c9!important;color:#5b463b!important}
  #zrReservationChangeAdminList .zr-cr-actions button[data-zr-shared-sms],#zrReservationChangeAdminList .zr-cr-actions button[data-change-sms]{background:#651012!important;border-color:#651012!important;color:#fff!important}
  #zrReservationChangeAdminList .zr-cr-actions button[data-zr-shared-done],#zrReservationChangeAdminList .zr-cr-actions button[data-change-done]{background:#8a5a44!important;border-color:#8a5a44!important;color:#fff!important}
  #zrReservationChangeAdminList .zr-cr-card:has(.zr-cr-status.done) .zr-cr-actions button[data-zr-shared-done],#zrReservationChangeAdminList .zr-cr-card:has(.zr-cr-status.done) .zr-cr-actions button[data-change-done],#zrReservationChangeAdminList .zr-cr-actions button[data-zr-shared-done].is-done{background:#1f7a4d!important;border-color:#1f7a4d!important;color:#fff!important}
  `;document.head.appendChild(s);
}
function interceptShellClick(e){
  const item=e.target?.closest?.('#zrAdminShellRail [data-zr-admin-item]');
  const sub=e.target?.closest?.('#zrAdminShellRail [data-zr-admin-subitem]');
  if(sub){
    const id=sub.dataset.zrAdminSubitem||'';
    if(id==='inquiry-list'||id==='inquiry-examples'||id==='reservation-change-list'||id==='reservation-change-sms'){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      if(id==='inquiry-list')openInquiry('inquiry');
      else if(id==='inquiry-examples')openInquiry('examples');
      else if(id==='reservation-change-sms')openReservation('sms');
      else openReservation('requests');
      return;
    }
  }
  if(item){
    const id=item.dataset.zrAdminItem||'';
    if(id==='inquiries'||id==='reservationChange'){
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      if(id==='inquiries')openInquiry('inquiry');else openReservation('requests');
      return;
    }
    leaveSpecialMode();
    return;
  }
  const inner=e.target?.closest?.('#zrInquiryReplyInquirySubtab,#zrInquiryReplyExampleSubtab,#zrReservationChangeAdminRequestSubtab,#zrReservationChangeAdminSmsSubtab');
  if(inner){
    if(inner.id==='zrInquiryReplyInquirySubtab'){mode='inquiry';clearChangeActive();setTimeout(()=>{forceInquirySurface('inquiry');enforceHeader()},0)}
    else if(inner.id==='zrInquiryReplyExampleSubtab'){mode='examples';clearChangeActive();setTimeout(()=>{forceInquirySurface('examples');enforceHeader()},0)}
    else {mode=changeModeFromTarget(inner.id);setTimeout(()=>{setShellActive('reservationChange');enforceHeader()},0)}
  }
}
function boot(){
  installStyle();installHeaderGuard();
  document.addEventListener('click',interceptShellClick,true);
  let tries=0;const timer=setInterval(()=>{installHeaderGuard();if(++tries>80)clearInterval(timer)},100);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(()=>{installStyle();installHeaderGuard()},0),{once:true});
})();