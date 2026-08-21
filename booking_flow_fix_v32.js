(()=>{
'use strict';
if(window.__ZR_BOOKING_FLOW_FIX_V32)return;
window.__ZR_BOOKING_FLOW_FIX_V32=true;

const $=id=>document.getElementById(id);
const SPECIAL_TEXT='간식시간 등 별도 시간 조정이 필요하거나, 예약 시 전달할 사항이 있다면 작성해주세요.';
const SPECIAL_EXAMPLE='예) 14:00~14:30 간식시간 필요';

function customerVisible(){
  const v=$('customerView');
  return !!v&&!v.classList.contains('hidden')&&getComputedStyle(v).display!=='none';
}
function bookingButton(b){
  const t=(b?.textContent||b?.value||'').replace(/\s+/g,'');
  return !!b&&/(예약.*(신청|완료|하기)|신청하기|예약하기)/.test(t)&&!/예약확인|추가예약/.test(t);
}
function hideLegacyGuides(){
  ['zrGuideModal','zrPlayGuideModal','zrFinalGuideModal','zrFinalGuideModalV30'].forEach(id=>{
    const m=$(id);if(m)m.classList.add('hidden');
  });
}
function applySpecialRequestText(){
  const root=$('customerView');if(!root)return;
  const areas=[...root.querySelectorAll('textarea')];
  const ta=areas.find(x=>/특이사항/.test((x.closest('.card,.calc,.box,.field,.form-group')?.textContent||x.parentElement?.textContent||'')))
    ||areas.find(x=>/이동\s*관련|요청사항/.test(String(x.placeholder||'')));
  if(!ta)return;
  ta.placeholder=SPECIAL_EXAMPLE;
  const scope=ta.closest('.card,.calc,.box,.field,.form-group')||ta.parentElement;
  if(!scope)return;
  const help=[...scope.querySelectorAll('.help,small,p')].find(x=>/이동\s*관련|요청사항|특이사항|전달.*사항/.test((x.textContent||'').trim()));
  if(help)help.textContent=`${SPECIAL_TEXT} ${SPECIAL_EXAMPLE}`;
}

window.addEventListener('click',e=>{
  const back=e.target?.closest?.('#zrFinalBackV31');
  if(back){window.__ZR_FINAL_DIRECT_SUBMIT=false;return;}
  const b=e.target?.closest?.('button,input[type="submit"],a');
  if(!customerVisible()||!bookingButton(b))return;
  if(b?.closest?.('#zrFinalGuideModalV31,#zrGuideModal,#zrPlayGuideModal'))return;
  window.__ZR_FINAL_DIRECT_SUBMIT=true;
  hideLegacyGuides();
  queueMicrotask(hideLegacyGuides);
  setTimeout(hideLegacyGuides,0);
  setTimeout(hideLegacyGuides,60);
},true);

function boot(){
  applySpecialRequestText();
  const t=setInterval(applySpecialRequestText,400);
  setTimeout(()=>clearInterval(t),15000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
