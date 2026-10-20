(()=>{
'use strict';
// Inquiry identity and legacy-field compatibility. No DOM, storage or network.
function create(BRIDGE_VERSION){
function isRecord(value){return !!value&&typeof value==='object'&&!Array.isArray(value)}
function clean(value){
  if(Array.isArray(value))return value.map(clean).filter(v=>v!==undefined);
  if(value&&typeof value==='object'){
    const out={};
    for(const [k,v] of Object.entries(value)){
      if(['__proto__','constructor','prototype'].includes(k)||v===undefined||typeof v==='function')continue;
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
function markList(list,uid){return (Array.isArray(list)?list:[]).filter(isRecord).map(x=>ensureSharedMeta(x,uid))}
function mergeRecords(remote,local,uid){
  const map=new Map();
  for(const item of Array.isArray(remote)?remote:[]){
    if(!isRecord(item))continue;
    const x=ensureSharedMeta(item,item?.ownerUid||'');
    map.set(String(x.sharedInquiryId),x);
  }
  for(const item of Array.isArray(local)?local:[]){
    if(!isRecord(item))continue;
    const id=String(item.sharedInquiryId||'');
    if(!id){
      const x=ensureSharedMeta(item,uid);
      if(!map.has(String(x.sharedInquiryId)))map.set(String(x.sharedInquiryId),x);
      continue;
    }
    if(!map.has(id))map.set(id,item);
  }
  return [...map.values()];
}
// Select writable inquiry data; Firebase authorization remains in the database rules.
function prepareWrite(item,uid,staff){
  if(!isRecord(item))return null;
  const x=ensureSharedMeta(item,uid);
  if(!staff&&x.ownerUid&&x.ownerUid!==uid)return null;
  if(!x.ownerUid)x.ownerUid=uid;
  return {...clean(x),sharedInquiryId:String(x.sharedInquiryId),sharedInquiryVersion:BRIDGE_VERSION};
}
// Server timestamps and object-key order do not change inquiry content.
function writeSignature(payload){
  function ordered(value){
    if(Array.isArray(value))return value.map(ordered);
    if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,ordered(value[k])]));
    return value;
  }
  const {updatedAt,...content}=payload;
  return JSON.stringify(ordered(content));
}
return Object.freeze({clean,ensureSharedMeta,markList,mergeRecords,prepareWrite,writeSignature});
}
window.ZRInquiryRecords=Object.freeze({create});
})();
