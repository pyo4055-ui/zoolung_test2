(()=>{
'use strict';
if(window.__ZR_RESERVATION_SETTINGS_FIREBASE_SYNC_V1)return;
window.__ZR_RESERVATION_SETTINGS_FIREBASE_SYNC_V1=true;

const FV='12.17.1';
const COLLECTION='customerGuides';
const DOC_ID='main';
const STAFF_EMAIL='zoolung09@zoolungzoolung.com';
let F=null,Auth=null,unsub=null,remote=null,remoteReady=false,applyingRemote=false;
let baseSaveSettings=null;
let writeChain=Promise.resolve();
let subscriptionGeneration=0,subscribedUid=null;

const clone=v=>JSON.parse(JSON.stringify(v));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function clean(v){
  if(Array.isArray(v))return v.map(clean).filter(x=>x!==undefined);
  if(v&&typeof v==='object'){
    const o={};for(const [k,x] of Object.entries(v)){if(x===undefined||typeof x==='function')continue;const c=clean(x);if(c!==undefined)o[k]=c}return o;
  }
  if(v===undefined||typeof v==='function')return undefined;
  return v;
}
function bridge(){return window.zrReservationFirebase||null}
function isStaff(){
  const z=bridge(),u=z?.auth?.currentUser;
  return !!z?.isStaff?.()&&!!u&&String(u.email||'').toLowerCase()===STAFF_EMAIL;
}
function mergedSettings(local){
  const l=local&&typeof local==='object'?local:{};
  return remoteReady&&remote&&typeof remote==='object'?{...l,...clone(remote)}:l;
}
function refreshUi(){
  try{if(typeof window.renderVisitDays==='function')window.renderVisitDays()}catch{}
  try{if(typeof window.refreshPlayStarts==='function')window.refreshPlayStarts()}catch{}
  const av=document.getElementById('adminView');
  const adminVisible=av&&getComputedStyle(av).display!=='none'&&!av.classList.contains('hidden');
  if(adminVisible){
    try{if(typeof window.renderAdmin==='function')window.renderAdmin()}catch{}
    try{if(typeof window.renderExtendedSettings==='function')window.renderExtendedSettings()}catch{}
  }
  try{document.dispatchEvent(new CustomEvent('zr:reservation-settings-synced',{detail:{remoteReady}}))}catch{}
}
function persistRemoteLocally(value){
  if(typeof baseSaveSettings!=='function')return;
  applyingRemote=true;
  try{baseSaveSettings(clone(value))}finally{applyingRemote=false}
}
function setRemote(value){
  const next=clean(value&&typeof value==='object'?value:{});
  if(remoteReady&&JSON.stringify(remote)===JSON.stringify(next))return;
  remote=next;
  remoteReady=true;
  persistRemoteLocally(remote);
  refreshUi();
}
function queueWrite(value){
  if(!F||!bridge()?.db||!isStaff())return;
  const payload=clean(value&&typeof value==='object'?value:{});
  const uid=bridge()?.auth?.currentUser?.uid;
  writeChain=writeChain.then(async()=>{
    const z=bridge();if(!z?.db||!isStaff()||z.auth?.currentUser?.uid!==uid)return;
    await F.setDoc(F.doc(z.db,COLLECTION,DOC_ID),{
      reservationSettings:payload,
      reservationSettingsVersion:1,
      reservationSettingsUpdatedAt:F.serverTimestamp()
    },{merge:true});
  }).catch(e=>console.error('reservation settings firebase write',e));
}
function settingsWritePayload(value,scope){
  const fields={
    groupNotice:['groupReservationNotice'],sms:['smsTemplateText'],scheduleSms:['scheduleCustomerNotifyMessage','scheduleCustomerNotifyTemplateVersion'],
    vendor:['outsourcingVendors'],'reservation-limits':['autoCloseLimit','autoClose','playgroundLimitEnabled'],
    'booking-period':['bookingStart','bookingEnd','holidayBookingAllowed'],'holiday-dates':['holidayDatesByYear'],
    'booking-lead':['bookingLeadDays'],'booking-Closure':['regularClosurePeriods'],'booking-Peak':['peakSeasonPeriods']
  }[scope];
  if(!fields)return clean(value);
  return Object.fromEntries(fields.filter(key=>Object.prototype.hasOwnProperty.call(value,key)).map(key=>[key,value[key]]));
}
async function saveShared(value,scope="reservationSettings"){
  installHooks();
  const baseline=clean(value&&typeof value==='object'?value:{}),payload=settingsWritePayload(baseline,scope);
  const meta=window.ZRAdminEditMeta?.make();
  const started=Date.now();
  while((!F||!bridge()?.db||!isStaff())&&Date.now()-started<5000)await wait(100);
  const z=bridge();
  if(!F||!z?.db||!isStaff()){
    console.error('reservation settings shared save unavailable');
    return false;
  }
  const uid=z.auth?.currentUser?.uid;
  let ok=false;
  const task=async()=>{
    const current=bridge();
    if(!current?.db||!isStaff()||current.auth?.currentUser?.uid!==uid)throw new Error('staff firebase session unavailable');
    if(meta)payload.adminEditMeta={[scope]:meta};
    await F.setDoc(F.doc(current.db,COLLECTION,DOC_ID),{
      reservationSettings:payload,
      reservationSettingsVersion:1,
      reservationSettingsUpdatedAt:F.serverTimestamp()
    },{merge:true});
    ok=true;
  };
  writeChain=writeChain.then(task,task);
  try{await writeChain}
  catch(e){console.error('reservation settings shared save',e);return false}
  if(!ok||!isStaff()||bridge()?.auth?.currentUser?.uid!==uid)return false;
  const latest=remote||baseline;
  remote={...latest,...payload,...(payload.adminEditMeta?{adminEditMeta:{...latest.adminEditMeta,...payload.adminEditMeta}}:{})};
  if(scope==='holiday-dates'&&payload.holidayDatesByYear){
    remote.holidayDatesByYear={...latest.holidayDatesByYear,...payload.holidayDatesByYear};
  }
  remoteReady=true;persistRemoteLocally(remote);refreshUi();
  return true;
}
function exposeApi(){
  window.zrReservationSettingsFirebaseSyncV1Api={
    version:1,
    save:saveShared,
    get ready(){return !!F&&!!bridge()?.db&&isStaff()},
    get remoteReady(){return remoteReady}
  };
}
function installHooks(){
  const currentSettings=window.settings;
  if(typeof currentSettings==='function'&&!currentSettings.__zrReservationSettingsSync){
    const base=currentSettings;
    const settingsWrapper=function(){return mergedSettings(base.apply(this,arguments))};
    settingsWrapper.__zrReservationSettingsSync=true;
    window.settings=settingsWrapper;
    try{settings=settingsWrapper}catch{}
  }
  const currentSave=window.saveSettings;
  if(typeof currentSave==='function'&&!currentSave.__zrReservationSettingsSync){
    baseSaveSettings=currentSave;
    const base=currentSave;
    const saveWrapper=function(value){
      if(applyingRemote)return base.apply(this,arguments);
      if(remoteReady&&!isStaff()){
        const safe=clone(remote);
        const out=base.call(this,safe);
        refreshUi();
        return out;
      }
      const out=base.apply(this,arguments);
      if(isStaff())queueWrite(value);
      return out;
    };
    saveWrapper.__zrReservationSettingsSync=true;
    window.saveSettings=saveWrapper;
    try{saveSettings=saveWrapper}catch{}
  }
  exposeApi();
}
function stopSubscription(){
  subscriptionGeneration++;
  if(unsub){try{unsub()}catch{}unsub=null}
  subscribedUid=null;remote=null;remoteReady=false;
}
function subscribe(){
  const z=bridge(),uid=z?.auth?.currentUser?.uid;
  if(!F||!z?.db||!uid){stopSubscription();return false}
  if(unsub&&subscribedUid===uid)return true;
  stopSubscription();subscribedUid=uid;
  const generation=subscriptionGeneration;
  const current=()=>generation===subscriptionGeneration&&bridge()?.auth?.currentUser?.uid===uid;
  unsub=F.onSnapshot(F.doc(z.db,COLLECTION,DOC_ID),{includeMetadataChanges:true},snap=>{
    if(!current()||snap.metadata?.hasPendingWrites)return;
    const data=snap.exists()?snap.data()||{}:{};
    if(data.reservationSettings&&typeof data.reservationSettings==='object')setRemote(data.reservationSettings);
    else{remote=null;remoteReady=false}
  },e=>{if(current()){stopSubscription();console.error('reservation settings firebase read',e)}});
  return true;
}
async function initFirebase(){
  try{
    [F,Auth]=await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`),
      import(`https://www.gstatic.com/firebasejs/${FV}/firebase-auth.js`)
    ]);
    exposeApi();
    const started=Date.now();
    const t=setInterval(()=>{
      installHooks();
      const z=bridge();if(!z?.auth||!z?.db){if(Date.now()-started>20000)clearInterval(t);return}
      clearInterval(t);
      Auth.onAuthStateChanged(z.auth,()=>{installHooks();subscribe()});
    },150);
  }catch(e){console.error('reservation settings firebase init',e)}
}
function boot(){
  installHooks();
  exposeApi();
  const hookTimer=setInterval(installHooks,500);
  setTimeout(()=>clearInterval(hookTimer),60000);
  initFirebase();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',installHooks);
})();
