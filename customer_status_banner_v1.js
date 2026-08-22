(()=>{
'use strict';
if(window.__ZR_CUSTOMER_STATUS_BANNER_V1)return;
window.__ZR_CUSTOMER_STATUS_BANNER_V1=true;

const $=id=>document.getElementById(id);
const RECEIVED_TEXT='예약 신청이 정상적으로 접수되었습니다. 담당자 확인 후 예약이 최종 확정됩니다.';
const CONFIRMED_TEXT='본 예약은 담당자 확인을 거쳐 최종 확정되었습니다.';

function injectStyle(){
  if($('zrCustomerStatusBannerV1Style'))return;
  const s=document.createElement('style');
  s.id='zrCustomerStatusBannerV1Style';
  s.textContent=`
  #existingBookingList .zr-received-emphasis{display:flex;align-items:center;gap:8px;margin:0 0 12px;padding:11px 12px;border:1px solid #b9dfe2;border-radius:11px;background:#eef9fa;color:#245a5d;font-size:14px;font-weight:900;line-height:1.5}
  `;
  document.head.appendChild(s);
}
function statusText(card){
  return [...card.querySelectorAll('.status')].map(x=>String(x.textContent||'').trim()).join(' ');
}
function syncCard(card){
  if(!card||card.classList.contains('zr-cancelled-record'))return;
  const text=statusText(card);
  const cancelled=/취소/.test(text)||!!card.querySelector('.zr-cancelled-emphasis');
  const confirmed=/확정/.test(text)||!!card.querySelector('.zr-confirmed-emphasis');
  const received=/접수/.test(text)&&!confirmed&&!cancelled;
  let banner=card.querySelector(':scope > .zr-received-emphasis');

  if(cancelled||confirmed||!received){banner?.remove();banner=null}
  if(received){
    if(!banner){banner=document.createElement('div');banner.className='zr-received-emphasis';card.prepend(banner)}
    if(banner.textContent!==RECEIVED_TEXT)banner.textContent=RECEIVED_TEXT;
  }
  const confirmedBanner=card.querySelector('.zr-confirmed-emphasis');
  if(confirmedBanner&&confirmedBanner.textContent!==CONFIRMED_TEXT)confirmedBanner.textContent=CONFIRMED_TEXT;
}
function sync(){
  injectStyle();
  const list=$('existingBookingList');if(!list)return;
  list.querySelectorAll('.existing-card').forEach(syncCard);
}
function boot(){
  sync();
  new MutationObserver(sync).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class']});
  const timer=setInterval(sync,400);setTimeout(()=>clearInterval(timer),20000);
  ['lookupBooking','checkExisting','cancelExisting'].forEach(id=>$(id)?.addEventListener('click',()=>[0,80,220,600].forEach(ms=>setTimeout(sync,ms))));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
