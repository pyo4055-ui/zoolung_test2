(()=>{
'use strict';
if(window.__ZR_CUSTOMER_INFO_TABS_V1)return;
window.__ZR_CUSTOMER_INFO_TABS_V1=true;

const $=id=>document.getElementById(id);
const LEGACY_CONTRACT_IDS='zrCustomerGuideTabV1 zrCustomerParkingTabV1';
const tel=s=>String(s||'').replace(/\D/g,'');
const toast=s=>{try{window.toast?.(s)}catch{}}
function visible(el){return !!el&&!el.classList.contains('hidden')&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden'}
function bookingCardTarget(){
  const list=$('existingBookingList');
  if(!visible(list))return null;
  return [...list.querySelectorAll('.existing-card')].find(card=>visible(card)&&!isCancelledCard(card))||null;
}
function readBookings(){try{return JSON.parse(localStorage.getItem('zr_bookings')||'[]')}catch{return[]}}
function matchingBookings(){
  const manager=String($('startManager')?.value||'').trim();
  const contact=tel($('startContact')?.value||'');
  if(!manager||!contact)return [];
  return readBookings().filter(b=>b&&!b.__availabilityOnly&&String(b.managerName||'').trim()===manager&&tel(b.contact)===contact&&String(b.status||'')!=='rejected');
}
function bookingForCard(card){
  const all=matchingBookings().filter(b=>String(b.status||'')!=='cancelled');
  if(!all.length)return null;
  const text=String(card?.textContent||'').replace(/\s+/g,' ');
  const exact=all.find(b=>{
    const org=String(b.orgName||'').trim(),date=String(b.date||'').trim();
    return (!org||text.includes(org))&&(!date||text.includes(date));
  });
  return exact||(all.length===1?all[0]:null);
}

function injectStyle(){
  if($('zrCustomerInfoTabsV1Style'))return;
  const s=document.createElement('style');s.id='zrCustomerInfoTabsV1Style';s.textContent=`
  #existingBookingList .existing-card.zr-has-info-tabs{position:relative!important}
  #existingBookingList .zr-booking-fact-line{display:inline-flex;align-items:baseline;gap:8px;min-height:24px;line-height:1.6}
  #existingBookingList .zr-booking-fact-label{display:inline-block;min-width:62px;color:#2f6b4f;font-weight:950;letter-spacing:-.2px}
  #existingBookingList .zr-booking-fact-value{color:#17221c;font-weight:800;letter-spacing:-.15px}
  #existingBookingList .zr-customer-card-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:18px;padding-top:14px;border-top:1px solid #e4eae6}
  #existingBookingList .zr-customer-card-actions-left{display:flex;align-items:center;gap:7px;min-width:0;flex:0 1 auto}
  #existingBookingList .zr-customer-card-actions-right{display:none;align-items:center;gap:7px;min-width:0;flex:0 0 auto;margin-left:auto}
  #existingBookingList.zr-cancel-mode-active .zr-customer-card-actions-right{display:flex}
  #existingBookingList .zr-customer-card-actions button{min-height:40px;border-radius:11px;padding:0 14px;font-size:12px;font-weight:900;cursor:pointer;white-space:nowrap;position:relative!important;z-index:2!important;margin:0!important;transform:none!important;pointer-events:auto!important;touch-action:manipulation;-webkit-tap-highlight-color:rgba(47,107,79,.08)}
  #existingBookingList .zr-customer-guide-action{border:1px solid #cad8cf;background:#fff;color:#315843;box-shadow:0 3px 10px rgba(30,50,36,.08)}
  #existingBookingList .zr-customer-guide-action:hover{background:#eef6f1}
  #existingBookingList .zr-customer-parking-action{border:1px solid #d8c998;background:#fff9e9;color:#705817;box-shadow:0 3px 10px rgba(30,50,36,.08)}
  #existingBookingList .zr-customer-parking-action:hover{background:#fff4d7}
  #existingBookingList .zr-customer-schedule-action{border:1px solid #bfd5e3;background:#f3f9fd;color:#315e79;box-shadow:0 3px 10px rgba(30,50,36,.08)}
  #existingBookingList .zr-customer-schedule-action:hover{background:#eaf5fb}
  #existingBookingList .zr-customer-action-cancel{min-height:40px!important}
  #existingBookingList .zr-action-origin-empty{display:none!important}
  #zrCustomerScheduleBox{display:none!important}
  #customerView #zrParkingInfoCard .zrpk31-row,#zrCustomerParkingQuickBody .zrpk31-row{background:#fff!important;border-left:0!important}
  #customerView #zrParkingInfoCard .zrpk31-row+.zrpk31-row,#zrCustomerParkingQuickBody .zrpk31-row+.zrpk31-row{border-top:2px solid #d8dfda!important}
  #customerView #zrParkingInfoCard .zrpk31-row h4,#zrCustomerParkingQuickBody .zrpk31-row h4{background:#e7f1eb!important;color:#24553f!important}
  #customerView #zrParkingInfoCard .zrpk31-place,#zrCustomerParkingQuickBody .zrpk31-place{color:#111!important;font-weight:950!important}
  #customerView #zrParkingInfoCard .zrpk31-address,#zrCustomerParkingQuickBody .zrpk31-address{color:#111!important;font-size:13.5px!important;font-weight:800!important}
  #customerView #zrParkingInfoCard .zrpk31-notes,#customerView #zrParkingInfoCard .zrpk31-notes li,#zrCustomerParkingQuickBody .zrpk31-notes,#zrCustomerParkingQuickBody .zrpk31-notes li{color:#111!important}
  .zrfinal31-place:first-of-type,.zrfinal31-place:nth-of-type(2){background:#fff!important;border-color:#d8dfda!important;border-left-color:#d8dfda!important}
  .zrfinal31-place:first-of-type>b,.zrfinal31-place:nth-of-type(2)>b{background:#e7f1eb!important;color:#24553f!important}
  .zr-customer-info-modal{position:fixed;inset:0;z-index:10250;background:rgba(16,25,20,.58);display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box}
  .zr-customer-info-modal.hidden{display:none!important}.zr-customer-info-sheet{width:min(760px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:18px;padding:17px;box-sizing:border-box;box-shadow:0 24px 80px rgba(0,0,0,.26);-webkit-overflow-scrolling:touch}
  .zr-customer-info-head{display:flex;gap:10px;align-items:center;margin-bottom:12px}.zr-customer-info-head h2{margin:0;flex:1;font-size:20px}.zr-customer-info-close{border:0;border-radius:9px;padding:8px 11px;background:#eef1ee;color:#4f5c54;font-weight:900;cursor:pointer}
  #zrCustomerParkingQuickBody .zrpk31-title{padding-top:4px}#zrCustomerParkingQuickBody .zrpk31-maps{margin-top:10px}
  #zrCustomerParkingQuickBody .zrpk31-map{min-height:38px;padding:0 14px}
  .zr-customer-info-loading{padding:24px 8px;text-align:center;color:#6c766f;font-size:13px}
  .zr-customer-schedule-pending{padding:8px 2px 5px;color:#3f4d44;font-size:14px;line-height:1.7}
  .zr-customer-schedule-pending strong{display:block;margin-bottom:10px;color:#24382c;font-size:16px}
  .zr-customer-schedule-pending p{margin:7px 0}.zr-customer-schedule-pending b{color:#2f6b4f}
  @media(max-width:520px){
    #existingBookingList .zr-booking-fact-line{gap:6px;min-height:23px}
    #existingBookingList .zr-booking-fact-label{min-width:58px}
    #existingBookingList .zr-customer-card-actions{gap:8px;margin-top:15px;padding-top:12px;flex-wrap:wrap}
    #existingBookingList .zr-customer-card-actions-left{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;width:100%;flex:1 1 100%}
    #existingBookingList .zr-customer-card-actions-left button{width:100%;min-width:0;min-height:42px;padding:0 5px;font-size:10.5px;letter-spacing:-.3px}
    #existingBookingList .zr-customer-card-actions-right{width:100%;justify-content:flex-end;margin-left:0}
    #existingBookingList .zr-customer-action-cancel{min-height:40px!important;padding-left:11px!important;padding-right:11px!important}
    .zr-customer-info-sheet{padding:14px}
  }
  `;document.head.appendChild(s);
}

function parkingCopy(){
  const card=$('zrParkingInfoCard');
  if(!card)return '';
  return card.innerHTML||'';
}
function ensureModal(id,title,bodyId){
  let m=$(id);if(m)return m;
  m=document.createElement('div');m.id=id;m.className='zr-customer-info-modal hidden';
  m.innerHTML=`<div class="zr-customer-info-sheet"><div class="zr-customer-info-head"><h2>${title}</h2><button type="button" class="zr-customer-info-close">닫기</button></div><div id="${bodyId}"></div></div>`;
  document.body.appendChild(m);
  const close=()=>m.classList.add('hidden');m.querySelector('.zr-customer-info-close').onclick=close;
  m.addEventListener('click',e=>{if(e.target===m)close()});
  return m;
}
function openParkingQuick(){
  const m=ensureModal('zrCustomerParkingQuickV1','주차 및 인솔','zrCustomerParkingQuickBody');
  const body=$('zrCustomerParkingQuickBody');
  const fill=()=>{
    const html=parkingCopy();
    body.innerHTML=html||'<div class="zr-customer-info-loading">주차 및 인솔 정보를 불러오는 중입니다. 잠시 후 다시 확인해주세요.</div>';
    body.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));
  };
  fill();if(!parkingCopy())setTimeout(fill,500);
  m.classList.remove('hidden');
}
function scheduleButtonFor(id){
  if(!id)return null;
  return [...document.querySelectorAll('#zrCustomerScheduleBox [data-zr-zoom]')].find(x=>String(x.dataset.zrZoom||'')===String(id))||null;
}
function openSchedulePending(){
  const m=ensureModal('zrCustomerSchedulePendingV1','관람 및 체험일정','zrCustomerSchedulePendingBody');
  const body=$('zrCustomerSchedulePendingBody');
  body.innerHTML='<div class="zr-customer-schedule-pending"><strong>해당 예약의 관람 및 체험일정은 준비 중입니다.</strong><p>관람 및 체험일정은 방문일 기준 <b>4~5일 전에 확정</b>됩니다.</p><p>확정 후 예약 시 등록하신 번호로 문자 안내드리며, 이곳에서도 확인하실 수 있습니다.</p></div>';
  m.classList.remove('hidden');
}
function openScheduleQuick(card){
  const booking=bookingForCard(card);
  if(!booking){toast('예약 정보를 찾지 못했습니다.');return}
  if(!booking.schedulePublished||!booking.customerSchedule){openSchedulePending();return}
  const tryOpen=(left=4)=>{
    const btn=scheduleButtonFor(booking.id);
    if(btn){btn.click();return}
    if(left<=0){toast('관람 및 체험일정을 불러오는 중입니다. 잠시 후 다시 눌러주세요.');return}
    setTimeout(()=>tryOpen(left-1),120);
  };
  tryOpen();
}

function isCancelledCard(card){
  if(card.classList.contains('zr-cancelled-record'))return true;
  if(card.querySelector('.zr-cancelled-emphasis'))return true;
  return [...card.querySelectorAll('.status')].some(x=>/취소/.test(String(x.textContent||'').trim())||x.classList.contains('cancelled'));
}
function cancelButton(card){
  return [...card.querySelectorAll('button')].find(btn=>{
    const text=String(btn.textContent||'').replace(/\s+/g,' ').trim();
    return /^(?:이\s*)?예약\s*취소하기$/.test(text)||text==='예약 내역 취소';
  })||null;
}
function inCancelMode(list){
  if(list?.querySelector('.zr-cancel-list-heading'))return true;
  return [...(list?.querySelectorAll('.existing-card button')||[])].some(btn=>String(btn.textContent||'').replace(/\s+/g,' ').trim()==='이 예약 취소하기');
}
function decorateBookingFacts(card){
  const walker=document.createTreeWalker(card,NodeFilter.SHOW_TEXT);
  const targets=[];
  let node;
  while((node=walker.nextNode())){
    const parent=node.parentElement;
    if(!parent||parent.closest('button,.status,.zr-customer-card-actions,.zr-booking-fact-line,.zr-confirmed-emphasis,.zr-cancelled-emphasis'))continue;
    const raw=String(node.nodeValue||'');
    const match=raw.match(/^\s*(방문일|동물원|방문시간|식사|놀이터)\s+(.+?)\s*$/);
    if(match)targets.push([node,match[1],match[2]]);
  }
  targets.forEach(([textNode,rawLabel,value])=>{
    if(!textNode.parentNode)return;
    const line=document.createElement('span');
    line.className='zr-booking-fact-line';
    const label=document.createElement('strong');
    label.className='zr-booking-fact-label';
    label.textContent=rawLabel==='동물원'?'방문시간':rawLabel;
    const val=document.createElement('span');
    val.className='zr-booking-fact-value';
    val.textContent=value;
    line.append(label,val);
    textNode.parentNode.replaceChild(line,textNode);
  });
}
function buildActionBar(card){
  let bar=card.querySelector(':scope > .zr-customer-card-actions');
  if(!bar){
    bar=document.createElement('div');bar.className='zr-customer-card-actions';
    bar.innerHTML='<div class="zr-customer-card-actions-left"><button type="button" class="zr-customer-guide-action">가이드맵</button><button type="button" class="zr-customer-parking-action">주차 및 인솔</button><button type="button" class="zr-customer-schedule-action">관람 및 체험일정</button></div><div class="zr-customer-card-actions-right"></div>';
    bar.querySelector('.zr-customer-parking-action').addEventListener('click',openParkingQuick);
    bar.querySelector('.zr-customer-schedule-action').addEventListener('click',()=>openScheduleQuick(card));
    card.appendChild(bar);
  }
  return bar;
}
function placeCancelButton(card,bar){
  const right=bar.querySelector('.zr-customer-card-actions-right');
  const btn=cancelButton(card);
  if(!btn)return;
  btn.classList.add('zr-customer-action-cancel');
  if(btn.parentElement===right)return;
  const oldParent=btn.parentElement;
  right.appendChild(btn);
  if(oldParent&&oldParent!==card&&oldParent!==bar&&oldParent.children.length===0&&!String(oldParent.textContent||'').trim())oldParent.classList.add('zr-action-origin-empty');
}
function syncCardActions(){
  const list=$('existingBookingList');
  if(!visible(list))return;
  list.classList.toggle('zr-cancel-mode-active',inCancelMode(list));
  $('zrCustomerInfoTabsV1')?.remove();
  list.querySelectorAll('.existing-card').forEach(card=>{
    if(!visible(card)||isCancelledCard(card)){
      card.classList.remove('zr-has-info-tabs');
      card.querySelector(':scope > .zr-customer-card-actions')?.remove();
      return;
    }
    card.classList.add('zr-has-info-tabs');
    decorateBookingFacts(card);
    const bar=buildActionBar(card);
    placeCancelButton(card,bar);
  });
}

let pending=false,listObserver=null,observedList=null;
function sync(){
  if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;injectStyle();syncCardActions();observeList()});
}
function observeList(){
  const list=$('existingBookingList');if(!list||list===observedList)return;
  listObserver?.disconnect();observedList=list;
  listObserver=new MutationObserver(sync);listObserver.observe(list,{childList:true,subtree:true});
}
function boot(){
  void LEGACY_CONTRACT_IDS;void bookingCardTarget;
  injectStyle();sync();observeList();
  const timer=setInterval(()=>{sync();observeList()},500);setTimeout(()=>clearInterval(timer),20000);
  ['lookupBooking','checkExisting','cancelExisting'].forEach(id=>$(id)?.addEventListener('click',()=>[0,100,300,800].forEach(ms=>setTimeout(sync,ms))));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
