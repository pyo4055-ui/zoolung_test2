// Atomic capacity registries. Original reservations remain the source of truth.
(()=>{
'use strict';
const COLLECTION='bookingAllocations',CONFIG='bookingAllocationConfig';
const inactive=b=>!b||['cancelled','rejected','done'].includes(String(b.status||''));
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s||''));
function range(start,end){
  const parse=s=>/^([01]\d|2[0-3]):[0-5]\d$/.test(String(s||''))?Number(s.slice(0,2))*60+Number(s.slice(3)):NaN;
  const a=parse(start),b=parse(end);if(!Number.isFinite(a)||!Number.isFinite(b)||a%15||![30,60].includes(b-a))throw Error('놀이터 시간은 15분 단위 시작, 30분 또는 60분 이용으로 설정해주세요.');
  return Array.from({length:(b-a)/15},(_,i)=>String(a+i*15));
}
function days(b){return validDate(b?.date)?[b.date]:[]}
function slots(b,date){return !inactive(b)&&b.date===date&&b.playUse==='yes'?range(b.playStart,b.playEnd):[]}
function program(b,date){return !inactive(b)&&!b.changePlayHoldDedicated&&b.date===date&&window.ZRBookingRules.groupProgram(b.groupType,b.date,b.entryTime)}
function plan(previous,id,required,limit,kind,related=[]){
  const members={...(previous?.members||{})},before=Object.keys(members).length;
  if(required)Object.defineProperty(members,id,{value:true,enumerable:true,configurable:true,writable:true});else delete members[id];
  const count=Object.keys(members).length;
  if(limit>0&&count>limit&&count>before&&!(kind==='playground'&&Object.keys(members).every(key=>key===id||related.includes(key)))){
    const message=kind==='program'?'해당 날짜 오전 프로그램 예약이 마감되었습니다.':'선택한 놀이터 시간은 다른 단체가 먼저 예약했습니다.';
    throw Object.assign(Error(message),{code:kind==='program'?'booking-capacity-conflict':'booking-playground-conflict'});
  }
  return {version:1,members,lastBookingId:id};
}
// Complete all reads first; the caller runs this writer alongside the reservation.
async function prepare(F,db,tx,id,before,after){
  const config=await tx.get(F.doc(db,CONFIG,'main'));
  if(config.exists()&&config.data().maintenance===true)throw Error('예약 저장 시스템을 점검 중입니다. 잠시 후 다시 시도해주세요.');
  if(!config.exists()||config.data().enforced!==true)return ()=>{};
  const settingSnap=await tx.get(F.doc(db,'customerGuides','main'));
  const settings=settingSnap.exists()?settingSnap.data().reservationSettings||{}:{};
  const targets=[];
  for(const date of [...new Set([...days(before),...days(after)])].filter(day=>day>=String(config.data().startDate||''))){
    targets.push({collection:COLLECTION,key:date,required:program(after,date),limit:(settings.autoCloseOverrideOpen||[]).includes(date)?0:Number(settings.autoCloseLimit??4),kind:'program'});
    const oldSlots=slots(before,date),wanted=slots(after,date);
    for(const slot of new Set([...oldSlots,...wanted]))targets.push({collection:'playgroundAllocations',key:date+'__'+slot,required:wanted.includes(slot),limit:settings.playgroundLimitEnabled===false?0:1,kind:'playground'});
  }
  const writes=[];
  for(const target of targets){
    const ref=F.doc(db,target.collection,target.key),snap=await tx.get(ref),old=snap.exists()?snap.data():null;
    if((old?.members?.[id]===true)===target.required)continue;
    const related=after?.changePlayHoldDedicated?[String(after.sourceBookingId||'')]:['changePlayHold_'+String(after?.changePlayHoldRequestId||after?.reservationChangeRequest?.id||after?.reservationChangeRequest?.requestId||'')];
    const next=plan(old,String(id),target.required,target.limit,target.kind,related);
    writes.push({ref,data:{...next,updatedAt:F.serverTimestamp()}});
  }
  return ()=>{for(const write of writes)tx.set(write.ref,write.data)};
}
async function prepareWrites(F,db,tx,writes){
  const planned=new Map(),planning={get:async ref=>{const key=ref.path||String(ref);return planned.has(key)?{exists:()=>true,data:()=>planned.get(key).data}:tx.get(ref)},set:(ref,data)=>planned.set(ref.path||String(ref),{ref,data})};
  for(const write of writes){
    const path=typeof write.ref==='string'?write.ref:write.ref.path;
    const [collection,id]=String(path||'').split('/');
    if(collection!=='reservations'&&!(collection==='reservationAvailability'&&id.startsWith('changePlayHold_')))continue;
    const snapshot=await tx.get(write.ref),before=snapshot.exists()?snapshot.data():null;
    const after=write.remove?null:{...(before||{}),...write.data};
    const requestId=before?.changePlayHoldRequestId||before?.reservationChangeRequest?.id||before?.reservationChangeRequest?.requestId;
    if(collection==='reservations'&&inactive(after)&&requestId){
      const holdRef=F.doc(db,'reservationAvailability','changePlayHold_'+requestId),holdSnap=await tx.get(holdRef);
      if(holdSnap.exists()&&String(holdSnap.data().sourceBookingId||holdSnap.data().changePlayHoldSourceBookingId||'')===id){
        writes.push({ref:holdRef,data:{date:'',status:'done',playUse:'no',playStart:'',playEnd:'',playDuration:0,changePlayHoldActive:false,changePlayHoldDate:'',changePlayHoldStart:'',changePlayHoldEnd:'',changePlayHoldDuration:0,updatedAt:F.serverTimestamp()}});
      }
    }
    const apply=await prepare(F,db,planning,id,before,after);apply();
  }
  return ()=>{for(const write of planned.values())tx.set(write.ref,write.data)};
}
async function save(F,db,writes){
  return F.runTransaction(db,async tx=>{
    const pending=writes.map(w=>({...w}));
    const allocate=await prepareWrites(F,db,tx,pending);
    allocate();
    for(const w of pending){if(w.remove)tx.delete(w.ref);else tx.set(w.ref,w.data,{merge:w.replace!==true})}
  });
}
// Cleanup keeps each reservation, archive record and allocation release atomic.
function batch(F,db){
  const groups=new Map();
  const add=w=>{const id=w.ref.id||String(w.ref.path||w.ref).split('/').at(-1);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(w)};
  return {set:(ref,data,options)=>add({ref,data,replace:options?.merge!==true}),delete:ref=>add({ref,remove:true}),commit:async()=>{for(const writes of groups.values())await save(F,db,writes)}};
}
window.ZRBookingAllocations=Object.freeze({COLLECTION,CONFIG,range,days,slots,program,plan,prepare,prepareWrites,save,batch});
})();
