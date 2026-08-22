(()=>{
'use strict';
if(window.__ZR_CUSTOMER_INFO_TABS_V1)return;
window.__ZR_CUSTOMER_INFO_TABS_V1=true;

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function visible(el){return !!el&&!el.classList.contains('hidden')&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden'}
function guideMapUrl(){return String(window.zrCustomerGuideMapV1?.imageUrl||'').trim()}

function injectStyle(){
  if($('zrCustomerInfoTabsV1Style'))return;
  const s=document.createElement('style');s.id='zrCustomerInfoTabsV1Style';s.textContent=`
  #existingBookingList .existing-card.zr-has-info-tabs{position:relative!important;padding-bottom:72px!important}
  #zrCustomerInfoTabsV1{position:absolute;left:14px;bottom:14px;z-index:20;display:flex;gap:7px;align-items:center;flex-wrap:wrap}
  #zrCustomerInfoTabsV1.hidden{display:none!important}
  #zrCustomerInfoTabsV1 button{min-height:40px;border:1px solid #cad8cf;border-radius:11px;padding:0 14px;background:#fff;color:#315843;font-size:12px;font-weight:900;box-shadow:0 3px 10px rgba(30,50,36,.08);cursor:pointer}
  #zrCustomerInfoTabsV1 button:hover{background:#eef6f1}
  #zrCustomerInfoTabsV1 .parking{border-color:#d8c998;background:#fff9e9;color:#705817}
  #zrCustomerInfoTabsV1 .parking:hover{background:#fff4d7}
  .zr-customer-info-modal{position:fixed;inset:0;z-index:10250;background:rgba(16,25,20,.58);display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box}
  .zr-customer-info-modal.hidden{display:none!important}.zr-customer-info-sheet{width:min(760px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:18px;padding:17px;box-sizing:border-box;box-shadow:0 24px 80px rgba(0,0,0,.26);-webkit-overflow-scrolling:touch}
  .zr-customer-info-head{display:flex;gap:10px;align-items:center;margin-bottom:12px}.zr-customer-info-head h2{margin:0;flex:1;font-size:20px}.zr-customer-info-close{border:0;border-radius:9px;padding:8px 11px;background:#eef1ee;color:#4f5c54;font-weight:900;cursor:pointer}
  .zr-guide-map-note{margin-bottom:10px;color:#68736b;font-size:12px;line-height:1.55}.zr-guide-map-frame{display:block;border:1px solid #dfe5df;border-radius:13px;overflow:hidden;background:#f5f7f5}
  .zr-guide-map-frame img{display:block;width:100%;height:auto;max-height:72vh;object-fit:contain}.zr-guide-map-empty{padding:30px 12px;text-align:center;border:1px dashed #d6ddd8;border-radius:12px;background:#fafbfa;color:#6d776f;font-size:13px;line-height:1.6}
  #zrCustomerParkingQuickBody .zrpk31-title{padding-top:4px}#zrCustomerParkingQuickBody .zrpk31-maps{margin-top:10px}
  #zrCustomerParkingQuickBody .zrpk31-map{min-height:38px;padding:0 14px}
  .zr-customer-info-loading{padding:24px 8px;text-align:center;color:#6c766f;font-size:13px}
  @media(max-width:520px){#existingBookingList .existing-card.zr-has-info-tabs{padding-bottom:118px!important}#zrCustomerInfoTabsV1{left:12px;right:12px;bottom:12px}#zrCustomerInfoTabsV1 button{flex:1;min-width:120px;min-height:38px;padding:0 10px;font-size:11px}.zr-customer-info-sheet{padding:14px}}
  `;document.head.appendChild(s);
}

function loadGuideMapConfig(){
  if($('zrCustomerGuideMapV1Script'))return;
  const s=document.createElement('script');s.id='zrCustomerGuideMapV1Script';s.src='./customer_guide_map_v1.js?v=3';document.body.appendChild(s);
}
function bookingCardTarget(){
  const list=$('existingBookingList');
  if(!visible(list))return null;
  return [...list.querySelectorAll('.existing-card')].find(visible)||null;
}
function ensureTabs(){
  let tabs=$('zrCustomerInfoTabsV1');
  if(!tabs){
    tabs=document.createElement('div');tabs.id='zrCustomerInfoTabsV1';tabs.className='hidden';
    tabs.innerHTML='<button type="button" id="zrCustomerGuideTabV1">가이드맵</button><button type="button" class="parking" id="zrCustomerParkingTabV1">주차 및 인솔</button>';
    tabs.querySelector('#zrCustomerGuideTabV1').addEventListener('click',openGuideQuick);
    tabs.querySelector('#zrCustomerParkingTabV1').addEventListener('click',openParkingQuick);
    document.body.appendChild(tabs);
  }
  const target=bookingCardTarget();
  document.querySelectorAll('#existingBookingList .existing-card.zr-has-info-tabs').forEach(card=>{if(card!==target)card.classList.remove('zr-has-info-tabs')});
  if(!target){tabs.classList.add('hidden');return}
  target.classList.add('zr-has-info-tabs');
  if(tabs.parentElement!==target)target.appendChild(tabs);
  tabs.classList.remove('hidden');
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

function fillGuideQuick(){
  const body=$('zrCustomerGuideQuickBody');if(!body)return;
  const url=guideMapUrl();
  if(url){
    body.innerHTML=`<div class="zr-guide-map-note">가이드맵을 확인해주세요. 이미지를 누르면 원본 크기로 열립니다.</div><a class="zr-guide-map-frame" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><img src="${esc(url)}" alt="주렁주렁 동탄점 가이드맵" onerror="this.parentElement.outerHTML='<div class=&quot;zr-guide-map-empty&quot;>가이드맵 이미지를 불러오지 못했습니다.<br>잠시 후 다시 확인해주세요.</div>'"></a>`;
  }else{
    body.innerHTML='<div class="zr-guide-map-empty">등록된 가이드맵 이미지가 없습니다.<br>관리자가 이미지를 등록한 뒤 확인해주세요.</div>';
  }
}
function openGuideQuick(){
  const m=ensureModal('zrCustomerGuideQuickV1','가이드맵','zrCustomerGuideQuickBody');
  fillGuideQuick();
  if(!guideMapUrl()){setTimeout(fillGuideQuick,450);setTimeout(fillGuideQuick,1200)}
  m.classList.remove('hidden');
}
function parkingCopy(){
  const card=$('zrParkingInfoCard');
  if(!card)return '';
  return card.innerHTML||'';
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

let pending=false;
function sync(){
  if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;injectStyle();ensureTabs()});
}
function boot(){
  injectStyle();loadGuideMapConfig();sync();
  new MutationObserver(sync).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
  const timer=setInterval(sync,350);setTimeout(()=>clearInterval(timer),20000);
  ['checkExisting','cancelExisting'].forEach(id=>$(id)?.addEventListener('click',()=>[0,100,300,800].forEach(ms=>setTimeout(sync,ms))));
  document.addEventListener('zr:guide-map-updated',()=>{if(!$('zrCustomerGuideQuickV1')?.classList.contains('hidden'))fillGuideQuick()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
