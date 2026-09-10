(()=>{
'use strict';
if(window.__ZR_ADMIN_RESERVATION_CHANGE_ROUTE_ADAPTER_V1)return;
window.__ZR_ADMIN_RESERVATION_CHANGE_ROUTE_ADAPTER_V1=true;

const $=id=>document.getElementById(id);
let mode='';
let headerObserver=null;
let reservationParentRouting=false;

function shellItem(id){return document.querySelector(`#zrAdminShellRail [data-zr-admin-item="${id}"]`)}
function shellWrap(id){return document.querySelector(`.zr-admin-shell-item-wrap[data-zr-submenu-parent="${id}"]`)}
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
function setChangeActive(which){
  const request=$('zrReservationChangeAdminRequestSubtab'),sms=$('zrReservationChangeAdminSmsSubtab');
  for(const [b,on] of [[request,which==='requests'],[sms,which==='sms']]){
    if(!b)continue;
    b.classList.toggle('btn-primary',on);
    b.classList.toggle('btn-gray',!on);
    b.classList.toggle('zr-subtab-active',on);
    b.setAttribute('aria-selected',on?'true':'false');
  }
  const inquiry=$('zrInquiryReplyInquirySubtab'),example=$('zrInquiryReplyExampleSubtab');
  for(const b of [inquiry,example]){
    if(!b)continue;
    b.classList.remove('btn-primary','zr-subtab-active');
    b.classList.add('btn-gray');
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
  clearChangeActive();
  $('zrReservationChangeAdminPanel')?.classList.add('hidden');
  $('zrReservationChangeSmsPanel')?.classList.add('hidden');
  directInquiryPanels().forEach(el=>el.classList.toggle('hidden',examples));
  $('tab-inquiry-reply-examples')?.classList.toggle('hidden',!examples);
  const inquiry=$('zrInquiryReplyInquirySubtab'),example=$('zrInquiryReplyExampleSubtab');
  if(inquiry){inquiry.classList.toggle('btn-primary',!examples);inquiry.classList.toggle('btn-gray',examples);inquiry.setAttribute('aria-selected',examples?'false':'true')}
  if(example){example.classList.toggle('btn-primary',examples);example.classList.toggle('btn-gray',!examples);example.setAttribute('aria-selected',examples?'true':'false')}
  setShellActive('inquiries');
  enforceHeader();
}
function forceReservationSurface(which='requests'){
  const main=$('tab-inquiry-reply-v1');
  if(!main)return;
  directInquiryPanels().forEach(el=>el.classList.add('hidden'));
  $('tab-inquiry-reply-examples')?.classList.add('hidden');
  const requests=$('zrReservationChangeAdminPanel'),sms=$('zrReservationChangeSmsPanel');
  requests?.classList.toggle('hidden',which!=='requests');
  sms?.classList.toggle('hidden',which!=='sms');
  setChangeActive(which);
  setShellActive('reservationChange');
  enforceHeader();
}
function scheduleSurface(expected){
  for(const delay of [0,70,180])setTimeout(()=>{
    if(mode!==expected)return;
    if(expected==='inquiry'||expected==='examples')forceInquirySurface(expected);
    else forceReservationSurface(expected);
  },delay);
}
function leaveSpecialMode(){
  mode='';
  reservationParentRouting=false;
  clearChangeActive();
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
function observeRouteClick(e){
  const sub=e.target?.closest?.('#zrAdminShellRail [data-zr-admin-subitem]');
  if(sub){
    const id=sub.dataset.zrAdminSubitem||'';
    if(id==='inquiry-list'){mode='inquiry';clearChangeActive();scheduleSurface('inquiry');return}
    if(id==='inquiry-examples'){mode='examples';clearChangeActive();scheduleSurface('examples');return}
    if(id==='reservation-change-list'){mode='requests';scheduleSurface('requests');return}
    if(id==='reservation-change-sms'){mode='sms';scheduleSurface('sms');return}
  }

  const item=e.target?.closest?.('#zrAdminShellRail [data-zr-admin-item]');
  if(item){
    const id=item.dataset.zrAdminItem||'';
    if(id==='reservationChange'){
      reservationParentRouting=true;
      mode='requests';
      setTimeout(()=>{reservationParentRouting=false;if(mode==='requests')forceReservationSurface('requests')},0);
      scheduleSurface('requests');
      return;
    }
    if(id==='inquiries'){
      if(reservationParentRouting)return;
      mode='inquiry';
      clearChangeActive();
      scheduleSurface('inquiry');
      return;
    }
    leaveSpecialMode();
    return;
  }

  const inner=e.target?.closest?.('#zrInquiryReplyInquirySubtab,#zrInquiryReplyExampleSubtab,#zrReservationChangeAdminRequestSubtab,#zrReservationChangeAdminSmsSubtab');
  if(inner){
    if(inner.id==='zrInquiryReplyInquirySubtab'){mode='inquiry';clearChangeActive();scheduleSurface('inquiry')}
    else if(inner.id==='zrInquiryReplyExampleSubtab'){mode='examples';clearChangeActive();scheduleSurface('examples')}
    else if(inner.id==='zrReservationChangeAdminSmsSubtab'){mode='sms';scheduleSurface('sms')}
    else {mode='requests';scheduleSurface('requests')}
  }
}
function boot(){
  installStyle();installHeaderGuard();
  document.addEventListener('click',observeRouteClick,true);
  let tries=0;const timer=setInterval(()=>{installHeaderGuard();if(++tries>80)clearInterval(timer)},100);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(()=>{installStyle();installHeaderGuard()},0),{once:true});
})();