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
let listenerGeneration=0,listenerStarting=false;
let applyingRemote=false,started=false,scanTimer=0,writeChain=Promise.resolve(),retryNeeded=false;

const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const isStaff=u=>!!u&&String(u.email||'').toLowerCase()===STAFF_EMAIL.toLowerCase();
const readLocal=()=>{try{const v=JSON.parse(localStorage.getItem(STORE_KEY)||'[]');return Array.isArray(v)?v:[]}catch{return[]}};

const acknowledgedWrites=new Map();
const {ensureSharedMeta,markList,mergeRecords,prepareWrite,writeSignature}=window.ZRInquiryRecords.create(BRIDGE_VERSION);
function dispatchChanged(source){
  try{document.dispatchEvent(new CustomEvent('zr:inquiry-replies-changed',{detail:{source:source||'shared'}}))}catch{}
  try{document.dispatchEvent(new CustomEvent('zr:inquiry-shared-updated',{detail:{source:source||'shared'}}))}catch{}
}
function directWrite(list,source){
  const next=Array.isArray(list)?list:[];
  if(same(readLocal(),next))return;
  applyingRemote=true;
  try{localStorage.setItem(STORE_KEY,JSON.stringify(next))}
  finally{applyingRemote=false}
  dispatchChanged(source);
}
function mergeRemote(remote){return mergeRecords(remote,readLocal(),currentUser?.uid||'')}
function sameSession(user){return !!user&&auth?.currentUser?.uid===user.uid&&currentUser?.uid===user.uid}
async function upsertItem(item,user,force=false){
  if(!sameSession(user)||!db||!F)return false;
  const payload=prepareWrite(item,user.uid,isStaff(user));
  if(!payload)return false;
  const cacheKey=user.uid+':'+payload.sharedInquiryId,signature=writeSignature(payload);
  if(!force&&acknowledgedWrites.get(cacheKey)===signature)return true;
  // Customer submissions are immutable after receipt; never replay stale replies.
  if(!isStaff(user)){
    const own=await F.getDocs(F.query(F.collection(db,COLLECTION),F.where('ownerUid','==',user.uid)));
    if(!sameSession(user))return false;
    if(own.docs.some(d=>d.id===payload.sharedInquiryId)){acknowledgedWrites.set(cacheKey,signature);return true;}
  }
  payload.updatedAt=F.serverTimestamp();
  await F.setDoc(F.doc(db,COLLECTION,payload.sharedInquiryId),payload,{merge:true});
  if(sameSession(user))acknowledgedWrites.set(cacheKey,signature);
  return true;
}
async function migrateLegacy(user){
  if(!sameSession(user)||(ADMIN_PAGE&&!isStaff(user)))return;
  const local=readLocal();
  let failed=false;
  for(const item of local){
    if(!sameSession(user))return;
    if(!item||typeof item!=='object'||Array.isArray(item)||item.sharedInquiryId)continue;
    const prepared=ensureSharedMeta(item,user.uid);
    try{
      const ok=await upsertItem(prepared,user);
      if(!sameSession(user))return;
      if(ok){
        // Only tag the unchanged legacy row; preserve inquiries added while awaiting DB.
        const next=readLocal().map(row=>same(row,item)?prepared:row);
        directWrite(next,'legacy-migrated');
      }else if(!prepared.ownerUid||prepared.ownerUid===user.uid)failed=true;
    }catch(e){failed=true;console.error('inquiry legacy migration',e)}
  }
  if(sameSession(user)&&failed)retryNeeded=true;
}
async function syncList(list){
  const user=currentUser||auth?.currentUser;
  if(!sameSession(user)||!db||!F||(ADMIN_PAGE&&!isStaff(user)))return;
  const prepared=markList(list,user.uid);
  if(!same(prepared,readLocal()))directWrite(prepared,'local-tag');
  writeChain=writeChain.then(async()=>{
    if(!sameSession(user))return;
    let failed=false;
    for(const item of prepared){
      if(!sameSession(user))return;
      try{
        const ok=await upsertItem(item,user);
        if(!ok&&(!item.ownerUid||item.ownerUid===user.uid))failed=true;
      }catch(e){failed=true;console.error('inquiry firebase write',e)}
    }
    if(sameSession(user))retryNeeded=failed;
  }).catch(e=>{if(sameSession(user))retryNeeded=true;console.error('inquiry sync chain',e)});
  return writeChain;
}
async function submitInquiry(item){
  if(!item||typeof item!=='object'||Array.isArray(item))throw Error('invalid inquiry record');
  const user=currentUser||auth?.currentUser;
  if(!sameSession(user)||!F||!db)throw Error('inquiry connection unavailable');
  const prepared=ensureSharedMeta(item,user.uid);
  const task=async()=>{
    if(!sameSession(user))throw Error('inquiry session changed');
    if(!await upsertItem(prepared,user))throw Error('inquiry save rejected');
    if(!sameSession(user))throw Error('inquiry session changed');
    const rows=readLocal();
    if(!rows.some(row=>row?.sharedInquiryId===prepared.sharedInquiryId))directWrite([...rows,prepared],'submitted');
    return prepared;
  };
  const operation=writeChain.then(task,task);
  writeChain=operation.catch(()=>{});
  return operation;
}
async function saveStaffInquiry(item){
  if(!item||typeof item!=='object'||Array.isArray(item))return false;
  const user=currentUser||auth?.currentUser;
  if(!sameSession(user)||!isStaff(user)||!F||!db)return false;
  const prepared=ensureSharedMeta(item,user.uid);
  const task=async()=>{
    if(!sameSession(user)||!isStaff(user))return false;
    if(!await upsertItem(prepared,user,true)||!sameSession(user))return false;
    const rows=readLocal(),index=rows.findIndex(row=>String(row?.sharedInquiryId||row?.id)===String(prepared.sharedInquiryId)||String(row?.id||'')===String(prepared.id||'')&&!!prepared.id);
    if(index<0)rows.push(prepared);else rows[index]={...rows[index],...prepared};
    directWrite(rows,'staff-saved');return true;
  };
  const operation=writeChain.then(task,task);writeChain=operation.catch(()=>{});
  try{return await operation}catch(e){console.error('staff inquiry save',e);return false}
}
window.zrInquiryFirebase=Object.freeze({submit:submitInquiry,save:saveStaffInquiry,get ready(){return !!F&&!!db&&sameSession(currentUser)}});
function patchSetStore(){
  const wrapped=window.ZRStoreDispatch.register(window.setStore,{
    id:'inquiry',key:STORE_KEY,marker:'__zrInquiryFirebaseBridge',
    handle:function(base,args){
      const [k,v]=args;
    if(k!==STORE_KEY)return base.apply(this,args);
    const uid=currentUser?.uid||auth?.currentUser?.uid||'';
    const prepared=markList(v,uid);
    const r=base.call(this,k,prepared);
    if(!applyingRemote)syncList(prepared);
    return r;
    }
  });
  if(!wrapped)return false;
  window.setStore=wrapped;
  try{setStore=wrapped}catch{}
  return true;
}
function stopListening(){listenerGeneration++;listenerStarting=false;if(stopSnapshot){try{stopSnapshot()}catch{}stopSnapshot=null}}
async function startListening(user){
  if(currentUser?.uid===user?.uid&&(listenerStarting||stopSnapshot))return;
  stopListening();if(currentUser?.uid!==user?.uid)acknowledgedWrites.clear();currentUser=user||null;
  if(!user||!F||!db)return;
  if(ADMIN_PAGE&&!isStaff(user))return;
  const generation=listenerGeneration;
  listenerStarting=true;
  try{
    await migrateLegacy(user);
    if(generation!==listenerGeneration)return;
    const ref=isStaff(user)
      ?F.collection(db,COLLECTION)
      :F.query(F.collection(db,COLLECTION),F.where('ownerUid','==',user.uid));
    stopSnapshot=F.onSnapshot(ref,snap=>{
      if(generation!==listenerGeneration)return;
      const rows=snap.docs.map(d=>({sharedInquiryId:d.id,...d.data()}));
      directWrite(mergeRemote(rows),'firestore');
    },e=>{if(generation!==listenerGeneration)return;stopSnapshot=null;retryNeeded=true;console.error('inquiry firebase listener',e)});
  }catch(e){if(generation===listenerGeneration){stopSnapshot=null;retryNeeded=true;console.error('inquiry listener start',e)}}
  finally{if(generation===listenerGeneration)listenerStarting=false;}
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
    authMod.onAuthStateChanged(auth,user=>startListening(user).catch(e=>{retryNeeded=true;console.error('inquiry auth state',e)}));
    // onAuthStateChanged supplies the initial user as well as later changes.
    if(!scanTimer)scanTimer=setInterval(()=>{
      patchSetStore();
      const u=currentUser||auth?.currentUser;
      if(!u)return;
      if(retryNeeded)syncList(readLocal());
      else migrateLegacy(u).catch(()=>{retryNeeded=true});
      if(!stopSnapshot&&(!ADMIN_PAGE||isStaff(u)))startListening(u).catch(()=>{retryNeeded=true});
    },3000);
    try{document.dispatchEvent(new CustomEvent('zr:inquiry-shared-ready'))}catch{}
    return true;
  }catch(e){started=false;retryNeeded=true;console.error('inquiry firebase bridge boot',e);return false}
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

