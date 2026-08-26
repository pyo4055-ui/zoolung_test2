(()=>{
'use strict';
if(window.__ZR_CUSTOMER_VIEW_TRACKING_V1)return;
window.__ZR_CUSTOMER_VIEW_TRACKING_V1=true;

const FV='12.17.1';
const KEY='zr_bookings';
const FIELDS={
  guide:'customerViewedGuideMapAt',
  parking:'customerViewedParkingAt',
  schedule:'customerViewedScheduleAt'
};
const LABELS={
  [FIELDS.guide]:'가이드맵',
  [FIELDS.parking]:'주차 및 인솔',
  [FIELDS.schedule]:'최종 스케줄'
};
const ALLOWED_FIELDS=new Set(Object.values(FIELDS));
const $=id=>document.getElementById(id);
const tel=s=>String(s||'').replace(/\D/g,'');
let listObserver=null;
let scheduleObserver=null;
let syncQueued=false;
let FS=null,db=null;
const inflight=new Set();
const remoteDone=new Set();

function notice(msg,kind='ok'){
  let n=$('zrCustomerViewTrackingNoticeV1');
  if(!n){
    n=document.createElement('div');
    n.id='zrCustomerViewTrackingNoticeV1';
    n.style.cssText='position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:30000;max-width:calc(100vw - 28px);padding:10px 14px;border-radius:10px;background:#20372a;color:#fff;font-size:12px;font-weight:900;line-height:1.45;box-shadow:0 6px 24px rgba(0,0,0,.22);text-align:center;pointer-events:none;opacity:0;transition:opacity .18s ease';
    document.body.appendChild(n);
  }
  n.textContent=msg;
  n.style.background=kind==='err'?'#8d3d3d':kind==='wait'?'#756321':'#24553f';
  n.style.opacity='1';
  clearTimeout(n.__zrTimer);
  n.__zrTimer=setTimeout(()=>{n.style.opacity='0'},2600);
}
function customerVisible(){
  const v=$('customerView');
  return !!v&&!v.classList.contains('hidden')&&getComputedStyle(v).display!=='none';
}
function readBookings(){
  try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}
  catch{return[]}
}
function customerBookings(){
  const manager=String($('startManager')?.value||'').trim();
  const contact=tel($('startContact')?.value||'');
  if(!manager||!contact)return[];
  return readBookings().filter(b=>b&&!b.__availabilityOnly&&!['cancelled','rejected'].includes(String(b.status||''))&&String(b.managerName||'').trim()===manager&&tel(b.contact)===contact);
}
function resolveCardBooking(card){
  if(!card)return null;
  const all=readBookings();
  const cached=String(card.dataset.zrBookingId||'');
  if(cached){const b=all.find(x=>String(x?.id||'')===cached);if(b)return b}
  const candidates=customerBookings();
  if(!candidates.length)return null;
  const text=String(card.textContent||'').replace(/\s+/g,' ');
  let matched=candidates.filter(b=>String(b.id||'')&&text.includes(String(b.id)));
  if(matched.length!==1)matched=candidates.filter(b=>String(b.orgName||'').trim()&&text.includes(String(b.orgName).trim())&&String(b.date||'').trim()&&text.includes(String(b.date).trim()));
  if(matched.length!==1)matched=candidates.filter(b=>String(b.orgName||'').trim()&&text.includes(String(b.orgName).trim()));
  const b=matched.length===1?matched[0]:(candidates.length===1?candidates[0]:null);
  if(b)card.dataset.zrBookingId=String(b.id);
  return b;
}
async function ensureDirectDb(){
  if(FS&&db)return true;
  const z=window.zrReservationFirebase;
  if(!z?.db)return false;
  try{
    FS=await import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`);
    db=z.db;
    return true;
  }catch(e){console.debug('customer view tracking firebase',e);return false}
}
async function writeRemoteView(id,field,stamp){
  if(!id||!ALLOWED_FIELDS.has(field))return false;
  const key=`${id}:${field}`;
  if(remoteDone.has(key))return true;
  if(inflight.has(key))return false;
  inflight.add(key);
  const label=LABELS[field]||'고객 확인';
  try{
    if(!(await ensureDirectDb()))throw new Error('firebase-unavailable');
    await FS.updateDoc(FS.doc(db,'reservations',String(id)),{[field]:stamp});
    remoteDone.add(key);
    notice(`${label} 확인 기록 완료`,'ok');
    document.dispatchEvent(new CustomEvent('zr:customer-view-tracked',{detail:{bookingId:String(id),field,remote:true}}));
    return true;
  }catch(e){
    const code=String(e?.code||e?.name||e?.message||'unknown').replace(/^firestore\//,'');
    console.warn('customer view receipt write failed',id,field,e);
    notice(`${label} 기록 실패 · ${code}`,'err');
    return false;
  }finally{inflight.delete(key)}
}
function persistFirstView(id,field,retry=0){
  if(!customerVisible()||!id||!ALLOWED_FIELDS.has(field))return;
  const list=readBookings();
  const b=list.find(x=>String(x?.id||'')===String(id));
  if(!b||b.__availabilityOnly||['cancelled','rejected'].includes(String(b.status||''))){notice('확인 기록 대상 예약을 찾지 못했습니다.','err');return}
  const stamp=String(b[field]||'').trim()||new Date().toISOString();
  if(!b[field]){
    if(typeof window.setStore!=='function'){
      if(retry<12){setTimeout(()=>persistFirstView(id,field,retry+1),250);return}
      notice('예약 저장 연결을 확인해주세요.','err');return;
    }
    b[field]=stamp;
    try{window.setStore(KEY,list)}catch(e){console.debug('customer view local tracking',e)}
  }
  void writeRemoteView(id,field,stamp);
}
function trackCardAction(button,field){
  const card=button?.closest?.('.existing-card');
  const b=resolveCardBooking(card);
  if(!b){notice(`${LABELS[field]||'확인'} · 예약 식별 실패`,'err');return}
  persistFirstView(b.id,field);
}
function installListDelegation(){
  const list=$('existingBookingList');
  if(!list||list.dataset.zrViewTrackingDelegated==='1')return false;
  list.dataset.zrViewTrackingDelegated='1';
  list.addEventListener('click',e=>{
    const guide=e.target?.closest?.('.zr-customer-guide-action');
    if(guide&&list.contains(guide)){trackCardAction(guide,FIELDS.guide);return}
    const parking=e.target?.closest?.('.zr-customer-parking-action');
    if(parking&&list.contains(parking)){trackCardAction(parking,FIELDS.parking)}
  });
  return true;
}
function bindCustomerCards(){
  const list=$('existingBookingList');if(!list)return;
  list.querySelectorAll('.existing-card').forEach(card=>{
    if(card.classList.contains('zr-cancelled-record'))return;
    const b=resolveCardBooking(card);
    if(b)card.dataset.zrBookingId=String(b.id);
  });
}
function bindScheduleCards(){
  document.querySelectorAll('#zrCustomerScheduleBox .zr-customer-schedule').forEach(card=>{
    if(card.dataset.zrViewTracking==='1')return;
    const id=card.querySelector('[data-zr-zoom]')?.dataset?.zrZoom||'';
    if(!id)return;
    card.dataset.zrViewTracking='1';
    card.dataset.zrBookingId=String(id);
    const zoom=card.querySelector('[data-zr-zoom]');
    if(zoom){
      zoom.addEventListener('click',()=>persistFirstView(id,FIELDS.schedule));
      zoom.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')persistFirstView(id,FIELDS.schedule)});
    }
    if(scheduleObserver)scheduleObserver.observe(card);
    else card.addEventListener('click',()=>persistFirstView(id,FIELDS.schedule),{once:true});
  });
}
function sync(){
  if(syncQueued)return;syncQueued=true;
  requestAnimationFrame(()=>{syncQueued=false;if(!customerVisible())return;installListDelegation();bindCustomerCards();bindScheduleCards()});
}
function installListObserver(){
  const list=$('existingBookingList');if(!list||list.dataset.zrViewTrackingRoot==='1')return false;
  list.dataset.zrViewTrackingRoot='1';
  listObserver=new MutationObserver(()=>{sync();setTimeout(sync,80);setTimeout(sync,350)});
  listObserver.observe(list,{childList:true,subtree:true});
  return true;
}
function hookLookupButtons(){
  ['lookupBooking','checkExisting'].forEach(id=>{
    const b=$(id);if(!b||b.dataset.zrViewTrackingHook==='1')return;
    b.dataset.zrViewTrackingHook='1';
    b.addEventListener('click',()=>[0,100,350,900].forEach(ms=>setTimeout(sync,ms)));
  });
}
function boot(){
  if('IntersectionObserver' in window){
    scheduleObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting||entry.intersectionRatio<0.15)return;
        const id=entry.target.dataset.zrBookingId||entry.target.querySelector('[data-zr-zoom]')?.dataset?.zrZoom||'';
        if(id)persistFirstView(id,FIELDS.schedule);
        scheduleObserver.unobserve(entry.target);
      });
    },{threshold:[0.15]});
  }
  hookLookupButtons();installListObserver();installListDelegation();sync();
  let tries=0;
  const timer=setInterval(()=>{
    hookLookupButtons();installListObserver();installListDelegation();sync();
    if(++tries>60)clearInterval(timer);
  },300);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
