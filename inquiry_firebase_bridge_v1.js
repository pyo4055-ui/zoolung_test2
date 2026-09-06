(()=>{
'use strict';
if(window.__ZR_INQUIRY_FIREBASE_BRIDGE_V1)return;
window.__ZR_INQUIRY_FIREBASE_BRIDGE_V1=true;

const FIREBASE_VERSION='12.17.1';
const STAFF_EMAIL='zoolung09@zoolungzoolung.com';
const STORE_KEY='zr_inquiries';
const COLLECTION='customerInquiries';
const BRIDGE_VERSION=1;
const ADMIN_PAGE=/\/admin\.html(?:$|[?#])/i.test(location.pathname+location.search+location.hash)||document.title.includes('예약관리');

let F=null,auth=null,db=null,currentUser=null,stopSnapshot=null;
let originalSetStore=null,applyingRemote=false,started=false,scanTimer=0,writeChain=Promise.resolve();

const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const isStaff=u=>!!u&&String(u.email||'').toLowerCase()===STAFF_EMAIL.toLowerCase();
const readLocal=()=>{try{const v=JSON.parse(localStorage.getItem(STORE_KEY)||'[]');return Array.isArray(v)?v:[]}catch{return[]}};

function clean(value){
  if(Array.isArray(value))return value.map(clean).filter(v=>v!==undefined);
  if(value&&typeof value==='object'){
    const out={};
    for(const [k,v] of Object.entries(value)){
      if(v===undefined||typeof v==='function')continue;
      const c=clean(v);if(c!==undefined)out[k]=c;
    }
    return out;
  }
  if(value===undefined||typeof value==='function')return undefined;
  return value;
}
function pick(item,keys){
  for(const k of keys){const v=String(item?.[k]??'').trim();if(v)return v}
  return'';
}
function contentOf(item){
  for(const k of ['content','message','inquiry','text'])if(Object.prototype.hasOwnProperty.call(item||{},k))return String(item?.[k]??'');
  return'';
}
function stableHash(text){
  let h1=2166136261>>>0,h2=2246822519>>>0;
  for(let i=0;i<text.length;i++){
    const c=text.charCodeAt(i);
    h1=Math.imul(h1^c,16777619)>>>0;
    h2=Math.imul(h2^c,3266489917)>>>0;
  }
  return h1.toString(36).padStart(7,'0')+h2.toString(36).padStart(7,'0');
}
function legacySeed(item){
  return JSON.stringify([
    pick(item,['id','inquiryId']),
    pick(item,['createdAt','created','submittedAt','dateTime']),
    pick(item,['name','customerName','managerName','inqName','writer']),
    pick(item,['mobile','mobilePhone','cellphone','cellPhone','hp','inqMobile','contact','phone','inqPhone','tel','telephone']),
    pick(item,['email','inqEmail']),
    contentOf(item)
  ]);
}
function ensureSharedMeta(item,uid){
  const out=clean(item&&typeof item==='object'?item:{});
  if(!out.sharedInquiryId)out.sharedInquiryId='inq_'+stableHash(legacySeed(out));
  if(!out.ownerUid&&uid)out.ownerUid=uid;
  out.sharedInquiryVersion=BRIDGE_VERSION;
  return out;
}
function markList(list,uid){return (Array.isArray(list)?list:[]).map(x=>ensureSharedMeta(x,uid))}
function dispatchChanged(source){
  try{document.dispatchEvent(new CustomEvent('zr:inquiry-replies-changed',{detail:{source:source||'shared'}}))}catch{}
  try{document.dispatchEvent(new CustomEvent('zr:inquiry-shared-updated',{detail:{source:source||'shared'}}))}catch{}
}
function directWrite(list,source){
  const next=Array.isArray(list)?list:[];
  if(same(readLocal(),next)){dispatchChanged(source);return}
  applyingRemote=true;
  try{localStorage.setItem(STORE_KEY,JSON.stringify(next))}
  finally{applyingRemote=false}
  dispatchChanged(source);
}
function mergeRemote(remote){
  const local=readLocal();
  const map=new Map();
  for(const item of remote){
    const x=ensureSharedMeta(item,item?.ownerUid||'');
    map.set(String(x.sharedInquiryId),x);
  }
  for(const item of local){
    if(!item||typeof item!=='object')continue;
    const id=String(item.sharedInquiryId||'');
    if(!id){
      const x=ensureSharedMeta(item,currentUser?.uid||'');
      if(!map.has(String(x.sharedInquiryId)))map.set(String(x.sharedInquiryId),x);
      continue;
    }
    if(!map.has(id))map.set(id,item);
  }
  return [...map.values()];
}
async function upsertItem(item,user){
  if(!user||!db||!F)return false;
  const x=ensureSharedMeta(item,user.uid);
  if(!isStaff(user)&&x.ownerUid&&x.ownerUid!==user.uid)return false;
  if(!x.ownerUid)x.ownerUid=user.uid;
  const payload={...clean(x),sharedInquiryId:String(x.sharedInquiryId),sharedInquiryVersion:BRIDGE_VERSION,updatedAt:F.serverTimestamp()};
  await F.setDoc(F.doc(db,COLLECTION,String(x.sharedInquiryId)),payload,{merge:true});
  return true;
}
async function migrateLegacy(user){
  if(!user)return;
  if(ADMIN_PAGE&&!isStaff(user))return;
  const local=readLocal();
  const legacy=local.filter(x=>x&&typeof x==='object'&&!x.sharedInquiryId);
  if(!legacy.length)return;
  const legacyIds=new Set(legacy.map(x=>'inq_'+stableHash(legacySeed(x))));
  const prepared=markList(local,user.uid);
  directWrite(prepared,'legacy-tag');
  for(const item of prepared){
    if(!legacyIds.has(String(item.sharedInquiryId||'')))continue;
    try{await upsertItem(item,user)}catch(e){console.error('inquiry legacy migration',e)}
  }
}
async function syncList(list){
  writeChain=writeChain.then(async()=>{
    const user=currentUser||auth?.currentUser;
    if(!user||!db||!F)return;
    if(ADMIN_PAGE&&!isStaff(user))return;
    const prepared=markList(list,user.uid);
    if(!same(prepared,readLocal()))directWrite(prepared,'local-tag');
    for(const item of prepared){
      try{await upsertItem(item,user)}catch(e){console.error('inquiry firebase write',e)}
    }
  }).catch(e=>console.error('inquiry sync chain',e));
  return writeChain;
}
function patchSetStore(){
  if(window.setStore?.__zrInquiryFirebaseBridge)return true;
  if(typeof window.setStore!=='function')return false;
  originalSetStore=window.setStore;
  const wrapped=function(k,v){
    if(k!==STORE_KEY)return originalSetStore.apply(this,arguments);
    const uid=currentUser?.uid||auth?.currentUser?.uid||'';
    const prepared=markList(v,uid);
    const r=originalSetStore.call(this,k,prepared);
    if(!applyingRemote)syncList(prepared);
    return r;
  };
  wrapped.__zrInquiryFirebaseBridge=true;
  try{Object.assign(wrapped,originalSetStore)}catch{}
  window.setStore=wrapped;
  try{setStore=wrapped}catch{}
  return true;
}
function stopListening(){if(stopSnapshot){try{stopSnapshot()}catch{}stopSnapshot=null}}
async function startListening(user){
  stopListening();currentUser=user||null;
  if(!user||!F||!db)return;
  if(ADMIN_PAGE&&!isStaff(user))return;
  await migrateLegacy(user);
  try{
    const ref=isStaff(user)
      ?F.collection(db,COLLECTION)
      :F.query(F.collection(db,COLLECTION),F.where('ownerUid','==',user.uid));
    stopSnapshot=F.onSnapshot(ref,snap=>{
      const rows=snap.docs.map(d=>({sharedInquiryId:d.id,...d.data()}));
      directWrite(mergeRemote(rows),'firestore');
    },e=>console.error('inquiry firebase listener',e));
  }catch(e){console.error('inquiry listener start',e)}
}
async function connect(){
  if(started)return true;
  const bridge=window.zrReservationFirebase;
  if(!bridge?.auth||!bridge?.db)return false;
  started=true;auth=bridge.auth;db=bridge.db;
  try{
    const [authMod,fsMod]=await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`)
    ]);
    F={...authMod,...fsMod};
    patchSetStore();
    const patchTimer=setInterval(patchSetStore,500);setTimeout(()=>clearInterval(patchTimer),15000);
    authMod.onAuthStateChanged(auth,user=>startListening(user).catch(e=>console.error('inquiry auth state',e)));
    if(auth.currentUser)await startListening(auth.currentUser);
    if(!scanTimer)scanTimer=setInterval(()=>{patchSetStore();const u=currentUser||auth?.currentUser;if(u)migrateLegacy(u).catch(()=>{})},3000);
    try{document.dispatchEvent(new CustomEvent('zr:inquiry-shared-ready'))}catch{}
    return true;
  }catch(e){started=false;console.error('inquiry firebase bridge boot',e);return false}
}
function boot(){
  patchSetStore();
  let tries=0;
  const attempt=async()=>{
    const ok=await connect();
    if(ok)return;
    if(++tries>120)return;
    setTimeout(attempt,250);
  };
  attempt();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:customer-firebase-ready',()=>setTimeout(connect,0));
document.addEventListener('zr:admin-staff-auth-ready',()=>setTimeout(connect,0));
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,0),{once:true});
})();
