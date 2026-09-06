(()=>{
'use strict';
if(window.__ZR_ADMIN_OPERATIONAL_SETTINGS_FIREBASE_V1)return;
window.__ZR_ADMIN_OPERATIONAL_SETTINGS_FIREBASE_V1=true;

const FIREBASE_VERSION='12.17.1';
const COLLECTION='customerGuides';
const DOC_ID='main';
const FIELD='adminOperationalSettings';
const STAFF_EMAIL='zoolung09@zoolungzoolung.com';
const KEYS=[
  'zr_inquiry_reply_templates_v1',
  'zr_reservation_change_confirm_sms_v1'
];

let F=null,Auth=null,unsub=null,remote={},remoteReady=false,applyingRemote=false;
let writeChain=Promise.resolve(),lastLocal=new Map(),started=false;

const bridge=()=>window.zrReservationFirebase||null;
const isStaff=()=>{
  const z=bridge(),u=z?.auth?.currentUser;
  return !!z?.isStaff?.()&&!!u&&String(u.email||'').toLowerCase()===STAFF_EMAIL;
};
const rawLocal=key=>{try{return localStorage.getItem(key)}catch{return null}};
const hasOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);

function emitStorage(key,oldValue,newValue){
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
  if(before===value){lastLocal.set(key,value);return}
  applyingRemote=true;
  try{localStorage.setItem(key,value)}finally{applyingRemote=false}
  lastLocal.set(key,value);
  emitStorage(key,before,value);
}
function queueWrite(next){
  if(!F||!bridge()?.db||!isStaff())return;
  const payload={};
  for(const key of KEYS)if(hasOwn(next,key)&&typeof next[key]==='string')payload[key]=next[key];
  writeChain=writeChain.then(async()=>{
    const z=bridge();if(!z?.db||!isStaff())return;
    await F.setDoc(F.doc(z.db,COLLECTION,DOC_ID),{
      [FIELD]:payload,
      adminOperationalSettingsVersion:1,
      adminOperationalSettingsUpdatedAt:F.serverTimestamp()
    },{merge:true});
  }).catch(e=>console.error('admin operational settings write',e));
}
function syncMissingLocalToRemote(){
  if(!remoteReady||!isStaff())return;
  let changed=false;
  const next={...remote};
  for(const key of KEYS){
    if(hasOwn(remote,key))continue;
    const local=rawLocal(key);
    if(local!==null){next[key]=local;changed=true}
  }
  if(changed){remote=next;queueWrite(remote)}
}
function applySnapshot(data){
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
function subscribe(){
  const z=bridge();if(!F||!z?.db||!z?.auth?.currentUser||!isStaff())return false;
  if(unsub){try{unsub()}catch{}unsub=null}
  unsub=F.onSnapshot(F.doc(z.db,COLLECTION,DOC_ID),snap=>{
    applySnapshot(snap.exists()?snap.data()||{}:{});
  },e=>console.error('admin operational settings read',e));
  return true;
}
function detectLocalChanges(){
  if(applyingRemote||!remoteReady||!isStaff())return;
  let changed=false;
  const next={...remote};
  for(const key of KEYS){
    const now=rawLocal(key),prev=lastLocal.has(key)?lastLocal.get(key):now;
    lastLocal.set(key,now);
    if(now===prev||now===null)continue;
    next[key]=now;changed=true;
  }
  if(changed){remote=next;queueWrite(remote)}
}
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
      Auth.onAuthStateChanged(z.auth,()=>setTimeout(()=>{
        if(isStaff())subscribe();
        else if(unsub){try{unsub()}catch{}unsub=null;remoteReady=false;remote={}}
      },50));
      if(isStaff())subscribe();
    },150);
    setInterval(detectLocalChanges,700);
    window.addEventListener('storage',e=>{
      if(!KEYS.includes(String(e.key||''))||applyingRemote)return;
      setTimeout(detectLocalChanges,0);
    });
    window.zrAdminOperationalSettings={
      version:1,
      keys:[...KEYS],
      get ready(){return remoteReady},
      get(key){return hasOwn(remote,key)?remote[key]:rawLocal(key)},
      set(key,value){
        if(!KEYS.includes(key)||typeof value!=='string')return false;
        const before=rawLocal(key);
        try{localStorage.setItem(key,value)}catch{return false}
        lastLocal.set(key,value);remote={...remote,[key]:value};
        emitStorage(key,before,value);queueWrite(remote);return true;
      }
    };
  }catch(e){started=false;console.error('admin operational settings bridge boot',e)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(init,0),{once:true});
})();
