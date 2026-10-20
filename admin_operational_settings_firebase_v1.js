(()=>{
'use strict';
if(window.__ZR_ADMIN_OPERATIONAL_SETTINGS_FIREBASE_V1)return;
window.__ZR_ADMIN_OPERATIONAL_SETTINGS_FIREBASE_V1=true;

const FIREBASE_VERSION='12.17.1';
const COLLECTION='customerGuides';
const DOC_ID='main';
const FIELD='adminOperationalSettings';
const STAFF_EMAIL='zoolung09@zoolungzoolung.com';
const TEMPLATE_KEY='zr_inquiry_reply_templates_v1';
const SMS_KEY='zr_reservation_change_confirm_sms_v1';
const PREVIEW_TEMPLATE_KEY='zr_preview_confirm_templates_v1';
const KEYS=[TEMPLATE_KEY,SMS_KEY,PREVIEW_TEMPLATE_KEY];

let F=null,Auth=null,unsub=null,remote={},remoteReady=false,applyingRemote=false;
let writeChain=Promise.resolve(),lastLocal=new Map(),started=false;
let editMetadata={},pendingEditMetadata={};
let subscriptionGeneration=0,subscribedUid=null;

const bridge=()=>window.zrReservationFirebase||null;
const isStaff=()=>{
  const z=bridge(),u=z?.auth?.currentUser;
  return !!z?.isStaff?.()&&!!u&&String(u.email||'').toLowerCase()===STAFF_EMAIL;
};
const rawLocal=key=>{try{return localStorage.getItem(key)}catch{return null}};
const hasOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);

function refreshVisibleUi(key,value){
  if(key===SMS_KEY){
    for(const id of ['zrSharedReservationChangeSmsTemplate','zrReservationChangeSmsTemplate']){
      const el=document.getElementById(id);if(el&&document.activeElement!==el)el.value=value;
    }
  }
}
function emitStorage(key,oldValue,newValue){
  refreshVisibleUi(key,newValue);
  try{window.dispatchEvent(new StorageEvent('storage',{key,oldValue,newValue,storageArea:localStorage,url:location.href}))}
  catch{
    try{
      const ev=new Event('storage');
      Object.defineProperty(ev,'key',{value:key});
      Object.defineProperty(ev,'oldValue',{value:oldValue});
      Object.defineProperty(ev,'newValue',{value:newValue});
      window.dispatchEvent(ev);
    }catch{}
  }
  try{document.dispatchEvent(new CustomEvent('zr:admin-operational-settings-updated',{detail:{key,value:newValue}}))}catch{}
}
function applyLocal(key,value){
  if(!KEYS.includes(key)||typeof value!=='string')return;
  const before=rawLocal(key);
  if(before===value){lastLocal.set(key,value);refreshVisibleUi(key,value);return}
  applyingRemote=true;
  try{localStorage.setItem(key,value)}finally{applyingRemote=false}
  lastLocal.set(key,value);
  emitStorage(key,before,value);
}
function queueWrite(next){
  if(!F||!bridge()?.db||!isStaff())return;
  const uid=bridge()?.auth?.currentUser?.uid;
  const payload={},editPayload={};
  for(const key of KEYS){
    if(!hasOwn(next,key)||typeof next[key]!=='string')continue;
    payload[key]=next[key];
    if(pendingEditMetadata[key]){editPayload[key]=pendingEditMetadata[key];delete pendingEditMetadata[key];}
  }
  if(!Object.keys(payload).length)return;
  writeChain=writeChain.then(async()=>{
    const z=bridge();if(!z?.db||!isStaff()||z.auth?.currentUser?.uid!==uid)return;
    await F.setDoc(F.doc(z.db,COLLECTION,DOC_ID),{
      [FIELD]:payload,adminOperationalEditMetadata:editPayload,
      adminOperationalSettingsVersion:1,
      adminOperationalSettingsUpdatedAt:F.serverTimestamp()
    },{merge:true});
  }).catch(e=>console.error('admin operational settings write',e));
}
function syncMissingLocalToRemote(){
  if(!remoteReady||!isStaff())return;
  let changed=false;
  const next={};
  for(const key of KEYS){
    if(hasOwn(remote,key))continue;
    const local=rawLocal(key);
    if(local!==null){next[key]=local;changed=true}
  }
  if(changed){remote={...remote,...next};queueWrite(next)}
}
function applySnapshot(data){
  editMetadata=data?.adminOperationalEditMetadata||{};window.ZRAdminEditMeta?.publish('changeSms',editMetadata[SMS_KEY]);
  const incoming=data&&typeof data==='object'&&data[FIELD]&&typeof data[FIELD]==='object'?data[FIELD]:{};
  remote={};
  for(const key of KEYS)if(typeof incoming[key]==='string')remote[key]=incoming[key];
  remoteReady=true;
  for(const key of KEYS){
    if(hasOwn(remote,key))applyLocal(key,remote[key]);
    else lastLocal.set(key,rawLocal(key));
  }
  syncMissingLocalToRemote();
  try{document.dispatchEvent(new CustomEvent('zr:admin-operational-settings-ready'))}catch{}
}
function stopSubscription(){
  subscriptionGeneration++;
  if(unsub){try{unsub()}catch{}unsub=null}
  subscribedUid=null;remoteReady=false;remote={};editMetadata={};pendingEditMetadata={};
}
function subscribe(){
  const z=bridge(),uid=z?.auth?.currentUser?.uid;
  if(!F||!z?.db||!uid||!isStaff()){stopSubscription();return false}
  if(unsub&&subscribedUid===uid)return true;
  stopSubscription();subscribedUid=uid;
  const generation=subscriptionGeneration;
  const current=()=>generation===subscriptionGeneration&&bridge()?.auth?.currentUser?.uid===uid&&isStaff();
  unsub=F.onSnapshot(F.doc(z.db,COLLECTION,DOC_ID),snap=>{
    if(current())applySnapshot(snap.exists()?snap.data()||{}:{});
  },e=>{if(current()){stopSubscription();console.error('admin operational settings read',e)}});
  return true;
}
function detectLocalChanges(){
  if(applyingRemote||!remoteReady||!isStaff())return;
  let changed=false;
  const next={};
  for(const key of KEYS){
    const now=rawLocal(key),prev=lastLocal.has(key)?lastLocal.get(key):now;
    lastLocal.set(key,now);
    if(now===prev||now===null)continue;
    next[key]=now;changed=true;
  }
  if(changed){remote={...remote,...next};queueWrite(next)}
}
let localDetectionPending=false;
function scheduleLocalDetection(){
  if(localDetectionPending)return;
  localDetectionPending=true;
  setTimeout(()=>{localDetectionPending=false;detectLocalChanges()},0);
}
async function saveSharedSetting(key,value){
 if(!KEYS.includes(key)||typeof value!=='string'||!F||!isStaff()||!bridge()?.db)return false;
 const uid=bridge()?.auth?.currentUser?.uid;
 const meta=window.ZRAdminEditMeta?.make();
 const task=async()=>{const z=bridge();if(!z?.db||!isStaff()||z.auth?.currentUser?.uid!==uid)throw Error('staff session required');
  await F.setDoc(F.doc(z.db,COLLECTION,DOC_ID),{[FIELD]:{[key]:value},...(meta?{adminOperationalEditMetadata:{[key]:meta}}:{}),adminOperationalSettingsUpdatedAt:F.serverTimestamp()},{merge:true});
  if(!isStaff()||bridge()?.auth?.currentUser?.uid!==uid)return false;
  remote={...remote,[key]:value};applyLocal(key,value);if(meta){editMetadata[key]=meta;if(key===SMS_KEY)window.ZRAdminEditMeta?.publish('changeSms',meta)}return true;
 };
 const operation=writeChain.then(task,task);writeChain=operation.catch(()=>{});try{return await operation}catch(e){console.error('operational settings save',e);return false}
}
// UI writers keep synchronous LocalStorage semantics; this owner schedules synchronization.
window.ZROperationalSettingsLocal=Object.freeze({
  set(key,value){
    if(!KEYS.includes(key)||typeof value!=='string')throw new TypeError('Unsupported operational setting');
    const meta=window.ZRAdminEditMeta?.make();if(meta)pendingEditMetadata[key]=meta;
    localStorage.setItem(key,value);
    scheduleLocalDetection();
  }
});
async function init(){
  if(started)return;started=true;
  try{
    [F,Auth]=await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`)
    ]);
    const waitStart=Date.now();
    const wait=setInterval(()=>{
      const z=bridge();
      if(!z?.auth||!z?.db){if(Date.now()-waitStart>30000)clearInterval(wait);return}
      clearInterval(wait);
      for(const key of KEYS)lastLocal.set(key,rawLocal(key));
      Auth.onAuthStateChanged(z.auth,()=>subscribe());
    },150);
    window.addEventListener('storage',e=>{
      if(!KEYS.includes(String(e.key||''))||applyingRemote)return;
      scheduleLocalDetection();
    });
    window.zrAdminOperationalSettings={
      version:1,save:saveSharedSetting,
      keys:[...KEYS],
      get ready(){return remoteReady},
      get(key){return hasOwn(remote,key)?remote[key]:rawLocal(key)},
      set(key,value){
        if(!KEYS.includes(key)||typeof value!=='string')return false;
        const before=rawLocal(key);
        try{localStorage.setItem(key,value)}catch{return false}
        lastLocal.set(key,value);remote={...remote,[key]:value};
        emitStorage(key,before,value);queueWrite({[key]:value});return true;
      }
    };
  }catch(e){started=false;console.error('admin operational settings bridge boot',e)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(init,0),{once:true});
})();
