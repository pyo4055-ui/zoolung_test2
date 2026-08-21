(()=>{
'use strict';
if(window.__ZR_PARKING_PHOTOS_V30)return;
window.__ZR_PARKING_PHOTOS_V30=true;
const DEFAULTS={
  p1:'./assets/parking_dropoff_v30.jpg?v=30',
  p2:'./assets/parking_bus_ok_v30.jpg?v=30'
};
function apply(){
  const card=document.getElementById('zrParkingInfoCard');
  if(!card)return false;
  for(const [cls,src] of Object.entries(DEFAULTS)){
    const box=card.querySelector(`.zrpk-photo.${cls}`);
    if(!box||box.querySelector('img'))continue;
    const img=document.createElement('img');
    img.src=src;
    img.alt=cls==='p1'?'승·하차 장소':'버스 주차 가능 장소';
    img.loading='lazy';
    box.prepend(img);
  }
  return true;
}
function boot(){
  apply();
  const obs=new MutationObserver(()=>apply());
  obs.observe(document.body,{childList:true,subtree:true});
  setTimeout(()=>obs.disconnect(),60000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
