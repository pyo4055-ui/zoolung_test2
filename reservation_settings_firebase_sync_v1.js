(()=>{
'use strict';
if(window.__ZR_RESERVATION_SETTINGS_FIREBASE_SYNC_V1)return;
window.__ZR_RESERVATION_SETTINGS_FIREBASE_SYNC_V1=true;

const FV='12.17.1';
const COLLECTION='customerGuides';
const DOC_ID='main';
const STAFF_EMAIL='zoolung09@zoolungzoolung.com';
let F=null,Auth=null,unsub=null,remote=null,remoteReady=false,applyingRemote=false;
let baseSettings=null,baseSaveSettings=null,settingsWrapper=null,saveWrapper=null;
let writeChain=Promise.resolve();

const clone=v=>JSON.parse(JSON.stringify(v));
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
  remote=clean(value&&typeof value==='object'?value:{});
  remoteReady=true;
  persistRemoteLocally(remote);
  refreshUi();
}
function queueWrite(value){
  if(!F||!bridge()?.db||!isStaff())return;
  const payload=clean(value&&typeof value==='object'?value:{});
  writeChain=writeChain.then(async()=>{
    const z=bridge();if(!z?.db||!isStaff())return;
    await F.setDoc(F.doc(z.db,COLLECTION,DOC_ID),{
      reservationSettings:payload,
      reservationSettingsVersion:1,
      reservationSettingsUpdatedAt:F.serverTimestamp()
    },{merge:true});
  }).catch(e=>console.error('reservation settings firebase write',e));
}
function installHooks(){
  const currentSettings=window.settings;
  if(typeof currentSettings==='function'&&!currentSettings.__zrReservationSettingsSync){
    baseSettings=currentSettings;
    settingsWrapper=function(){return mergedSettings(baseSettings.apply(this,arguments))};
    settingsWrapper.__zrReservationSettingsSync=true;
    window.settings=settingsWrapper;
    try{settings=settingsWrapper}catch{}
  }
  const currentSave=window.saveSettings;
  if(typeof currentSave==='function'&&!currentSave.__zrReservationSettingsSync){
    baseSaveSettings=currentSave;
    saveWrapper=function(value){
      if(applyingRemote)return baseSaveSettings.apply(this,arguments);
      if(remoteReady&&!isStaff()){
        const safe=clone(remote);
        const out=baseSaveSettings.call(this,safe);
        refreshUi();
        return out;
      }
      const out=baseSaveSettings.apply(this,arguments);
      if(isStaff())queueWrite(value);
      return out;
    };
    saveWrapper.__zrReservationSettingsSync=true;
    window.saveSettings=saveWrapper;
    try{saveSettings=saveWrapper}catch{}
  }
}
function subscribe(){
  const z=bridge();if(!F||!z?.db||!z?.auth?.currentUser)return false;
  if(unsub){unsub();unsub=null}
  unsub=F.onSnapshot(F.doc(z.db,COLLECTION,DOC_ID),snap=>{
    const data=snap.exists()?snap.data()||{}:{};
    if(data.reservationSettings&&typeof data.reservationSettings==='object')setRemote(data.reservationSettings);
    else{remote=null;remoteReady=false}
  },e=>console.error('reservation settings firebase read',e));
  return true;
}
async function initFirebase(){
  try{
    [F,Auth]=await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`),
      import(`https://www.gstatic.com/firebasejs/${FV}/firebase-auth.js`)
    ]);
    const started=Date.now();
    const t=setInterval(()=>{
      installHooks();
      const z=bridge();if(!z?.auth||!z?.db){if(Date.now()-started>20000)clearInterval(t);return}
      clearInterval(t);
      Auth.onAuthStateChanged(z.auth,()=>setTimeout(()=>{installHooks();subscribe()},20));
      subscribe();
    },150);
  }catch(e){console.error('reservation settings firebase init',e)}
}
function boot(){
  installHooks();
  const hookTimer=setInterval(installHooks,500);
  setTimeout(()=>clearInterval(hookTimer),60000);
  initFirebase();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',installHooks);
})();
