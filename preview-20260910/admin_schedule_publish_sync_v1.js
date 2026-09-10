(()=>{
'use strict';
if(window.__ZR_ADMIN_SCHEDULE_PUBLISH_SYNC_V1)return;
window.__ZR_ADMIN_SCHEDULE_PUBLISH_SYNC_V1=true;

const FV='12.17.1';
const STAFF_EMAIL='zoolung09@zoolungzoolung.com';
let FS=null,db=null,listObserver=null,observedList=null,retryTimer=null,retryCount=0;

function injectStyle(){
  if(document.getElementById('zrAdminSchedulePublishSyncV1Style'))return;
  const s=document.createElement('style');
  s.id='zrAdminSchedulePublishSyncV1Style';
  s.textContent=`
    html.zr-admin-shell-mounted #adminView #tab-schedule .zrsc-actions [data-publish]{
      background:var(--zr-v3-green,#004b2a)!important;
      border:1.5px solid var(--zr-v3-green,#004b2a)!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
      box-shadow:0 4px 10px rgba(0,75,42,.13)!important;
      opacity:1!important;
    }
    html.zr-admin-shell-mounted #adminView #tab-schedule .zrsc-actions [data-publish]:hover,
    html.zr-admin-shell-mounted #adminView #tab-schedule .zrsc-actions [data-publish]:focus-visible{
      background:var(--zr-v3-green-dark,#003b21)!important;
      border-color:var(--zr-v3-green-dark,#003b21)!important;
      color:#fff!important;
      -webkit-text-fill-color:#fff!important;
    }
    html.zr-admin-shell-mounted #adminView #tab-schedule .zrsc-actions button[disabled]:not(.zr-schedule-customer-notify){
      background:var(--zr-v3-green-soft,#eef6f1)!important;
      border:1.5px solid #bdd5c7!important;
      color:var(--zr-v3-green,#004b2a)!important;
      -webkit-text-fill-color:var(--zr-v3-green,#004b2a)!important;
      opacity:1!important;
      box-shadow:none!important;
    }
  `;
  document.head.appendChild(s);
}
function allBookings(){
  try{
    const list=typeof window.bookings==='function'?window.bookings():[];
    return Array.isArray(list)?list:[];
  }catch{return []}
}
function bookingById(id){return allBookings().find(b=>b&&!b.__availabilityOnly&&String(b.id)===String(id))||null}
function isStaff(){
  const z=window.zrReservationFirebase;
  return !!z?.db&&!!z?.auth?.currentUser&&String(z.auth.currentUser.email||'').toLowerCase()===STAFF_EMAIL.toLowerCase();
}
async function ensureFirebase(){
  if(FS&&db)return true;
  const z=window.zrReservationFirebase;if(!z?.db)return false;
  try{FS=await import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`);db=z.db;return true}
  catch(e){console.debug('schedule publish sync firebase',e);return false}
}
async function syncReservation(id,target){
  const b=bookingById(id);
  if(!b||!!b.schedulePublished!==target)return false;
  if(!(await ensureFirebase())||!isStaff())return false;
  const patch={schedulePublished:target,updatedAt:FS.serverTimestamp()};
  if(target&&b.customerSchedule)patch.customerSchedule=b.customerSchedule;
  try{
    await FS.setDoc(FS.doc(db,'reservations',String(id)),patch,{merge:true});
    return true;
  }catch(e){console.warn('schedule publish reservation sync',id,e);return false}
}
function waitAndSync(id,target,left=80){
  const b=bookingById(id);
  if(b&&!!b.schedulePublished===target){syncReservation(id,target);return}
  if(left>0)setTimeout(()=>waitAndSync(id,target,left-1),100);
}
function patchButtons(){
  injectStyle();
  const list=document.getElementById('zrscList');if(!list)return false;
  list.querySelectorAll('[data-publish]').forEach(btn=>{
    if(btn.dataset.zrPublishSyncV1==='1')return;
    btn.dataset.zrPublishSyncV1='1';
    btn.addEventListener('click',()=>{
      const id=String(btn.dataset.publish||'');if(!id)return;
      const before=!!bookingById(id)?.schedulePublished;
      waitAndSync(id,!before);
    });
  });
  return true;
}
function attachObserver(){
  const list=document.getElementById('zrscList');if(!list)return false;
  if(observedList!==list){
    listObserver?.disconnect();observedList=list;
    listObserver=new MutationObserver(()=>patchButtons());
    listObserver.observe(list,{childList:true});
  }
  patchButtons();return true;
}
function startRetries(){
  if(retryTimer)return;
  retryTimer=setInterval(()=>{
    retryCount+=1;
    if(attachObserver()||retryCount>=80){clearInterval(retryTimer);retryTimer=null}
  },500);
}
function boot(){injectStyle();attachObserver();startRetries()}
document.addEventListener('zr:admin-runtime-ready',boot,{once:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
