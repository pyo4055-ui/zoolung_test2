// Reservation record transformations only; no DOM, storage, auth or network.
(()=>{
'use strict';
if(window.ZRReservationRecords)return;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function clean(value){
  if(Array.isArray(value))return value.map(clean).filter(v=>v!==undefined);
  if(value&&typeof value==='object'){
    const out={};
    for(const [k,v] of Object.entries(value)){
      if(k.startsWith('__')||v===undefined||typeof v==='function')continue;
      const c=clean(v);if(c!==undefined)out[k]=c;
    }
    return out;
  }
  if(value===undefined||typeof value==='function')return undefined;
  return value;
}
function byId(list){return new Map((Array.isArray(list)?list:[]).filter(x=>x&&x.id&&!x.__availabilityOnly).map(x=>[String(x.id),x]))}
function changedTop(prev,next){
  if(!prev)return clean(next);
  const out={};
  const keys=new Set([...Object.keys(prev||{}),...Object.keys(next||{})]);
  for(const k of keys){
    if(k.startsWith('__')||k==='updatedAt'||k==='ownerUid'||k==='bridgeVersion')continue;
    if(!same(prev?.[k],next?.[k]))out[k]=clean(next?.[k]);
  }
  return out;
}
function bookingWritePatch(id,previous,booking,ownerUid,bridgeVersion){
  const patch=changedTop(previous,booking);
  if(!previous)Object.assign(patch,clean(booking));
  patch.id=id;patch.ownerUid=ownerUid;patch.bridgeVersion=bridgeVersion;
  return patch;
}
// Public availability never copies contact details from the source booking.
function availabilityPatch(b,ownerUid,bridgeVersion,programCapacity){
  return clean({programCapacity,id:b.id,ownerUid,date:b.date||'',status:b.status||'pending',
    playUse:b.playUse||'no',playStart:b.playStart||'',playEnd:b.playEnd||'',bridgeVersion});
}
function availabilityPlaceholder(a){
  return {programCapacity:typeof a.programCapacity==='boolean'?a.programCapacity:undefined,
    id:a.id,date:a.date||'',status:a.status||'pending',playUse:a.playUse||'no',
    playStart:a.playStart||'',playEnd:a.playEnd||'',
    paidCount:0,chaperoneCount:0,freeChaperone:0,paidChaperone:0,
    entryTime:'',exitTime:'',mealType:'none',mealStart:'',mealEnd:'',
    orgName:'',managerName:'',contact:'',email:'',notes:'',__availabilityOnly:true};
}
window.ZRReservationRecords=Object.freeze({clean,byId,changedTop,bookingWritePatch,availabilityPatch,availabilityPlaceholder});
})();
