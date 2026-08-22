(()=>{
'use strict';
if(window.__ZR_CUSTOMER_INFO_TABS_V1)return;
window.__ZR_CUSTOMER_INFO_TABS_V1=true;

const $=id=>document.getElementById(id);
const LEGACY_CONTRACT_IDS='zrCustomerGuideTabV1 zrCustomerParkingTabV1';
function visible(el){return !!el&&!el.classList.contains('hidden')&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden'}
function bookingCardTarget(){
  const list=$('existingBookingList');
  if(!visible(list))return null;
  return [...list.querySelectorAll('.existing-card')].find(card=>visible(card)&&!isCancelledCard(card))||null;
}

function injectStyle(){
  if($('zrCustomerInfoTabsV1Style'))return;
  const s=document.createElement('style');s.id='zrCustomerInfoTabsV1Style';s.textContent=`
  #existingBookingList .existing-card.zr-has-info-tabs{position:relative!important}
  #existingBookingList .zr-booking-fact-line{display:inline-flex;align-items:baseline;gap:8px;min-height:24px;line-height:1.6}
  #existingBookingList .zr-booking-fact-label{display:inline-block;min-width:62px;color:#2f6b4f;font-weight:950;letter-spacing:-.2px}
  #existingBookingList .zr-booking-fact-value{color:#17221c;font-weight:800;letter-spacing:-.15px}
  #existingBookingList .zr-customer-card-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:18px;padding-top:14px;border-top:1px solid #e4eae6}
  #existingBookingList .zr-customer-card-actions-left,#existingBookingList .zr-customer-card-actions-right{display:flex;align-items:center;gap:7px;min-width:0}
  #existingBookingList .zr-customer-card-actions-left{flex:0 1 auto}
  #existingBookingList .zr-customer-card-actions-right{flex:0 0 auto;margin-left:auto}
  #existingBookingList .zr-customer-card-actions button{min-height:40px;border-radius:11px;padding:0 14px;font-size:12px;font-weight:900;cursor:pointer;white-space:nowrap;position:static!important;margin:0!important;transform:none!important}
  #existingBookingList .zr-customer-guide-action{border:1px solid #cad8cf;background:#fff;color:#315843;box-shadow:0 3px 10px rgba(30,50,36,.08)}
  #existingBookingList .zr-customer-guide-action:hover{background:#eef6f1}
  #existingBookingList .zr-customer-parking-action{border:1px solid #d8c998;background:#fff9e9;color:#705817;box-shadow:0 3px 10px rgba(30,50,36,.08)}
  #existingBookingList .zr-customer-parking-action:hover{background:#fff4d7}
  #existingBookingList .zr-customer-action-cancel{min-height:40px!important}
  #existingBookingList .zr-action-origin-empty{display:none!important}
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
  @media(max-width:520px){
    #existingBookingList .zr-booking-fact-line{gap:6px;min-height:23px}
    #existingBookingList .zr-booking-fact-label{min-width:58px}
    #existingBookingList .zr-customer-card-actions{gap:6px;margin-top:15px;padding-top:12px}
    #existingBookingList .zr-customer-card-actions-left{gap:5px}
    #existingBookingList .zr-customer-card-actions button{min-height:38px;padding:0 8px;font-size:10.5px;letter-spacing:-.2px}
    #existingBookingList .zr-customer-action-cancel{min-height:38px!important;padding-left:9px!important;padding-right:9px!important}
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
    bar.innerHTML='<div class="zr-customer-card-actions-left"><button type="button" class="zr-customer-guide-action">가이드맵</button><button type="button" class="zr-customer-parking-action">주차 및 인솔</button></div><div class="zr-customer-card-actions-right"></div>';
    bar.querySelector('.zr-customer-parking-action').addEventListener('click',openParkingQuick);
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

let pending=false;
function sync(){
  if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;injectStyle();syncCardActions()});
}
function boot(){
  void LEGACY_CONTRACT_IDS;void bookingCardTarget;
  injectStyle();sync();
  new MutationObserver(sync).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
  const timer=setInterval(sync,350);setTimeout(()=>clearInterval(timer),20000);
  ['checkExisting','cancelExisting'].forEach(id=>$(id)?.addEventListener('click',()=>[0,100,300,800].forEach(ms=>setTimeout(sync,ms))));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
