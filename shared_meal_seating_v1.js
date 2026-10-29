// Shared meal-place conflict policy and transactional schedule writer.
(()=>{
'use strict';
const catalog=[
 ['캠핑존 왼쪽 전체(오른쪽 평상 제외)','76석'],['캠핑존 전체(오른쪽 평상 포함)','118석'],
 ['캠핑존 · 의자','48석 · 만 6세부터 가능'],['캠핑존 · 테이블','14석 · 초등생부터 가능'],['캠핑존 · 돗자리','80~100자리 · 만 6세 미만'],
 ['캠핑존 왼쪽 평상','14석'],['캠핑존 오른쪽 평상 안쪽','21석'],['캠핑존 오른쪽 평상 바깥쪽','21석'],['캠핑존 오른쪽 평상 전체','42석'],['카페앞 · 평상','35석'],['카페앞 · 어항테이블','10석 · 초등생부터 가능'],
 ['온실 · 테이블','20석 · 초등생부터 가능'],['온실 · 돗자리','30자리 · 만 6세 미만'],['놀이터 · 테이블','24석 · 초등생부터 가능'],['놀이터 · 돗자리','30~40자리 · 만 6세 미만'],
 ['훔볼트아지트 · 테이블','16석 · 초등생부터 가능'],['훔볼트아지트 · 돗자리','20~30자리 · 만 6세 미만']
];
const canonical=value=>String(value||'').replace(/[·\s]/g,'').replace('캠핑존안쪽평상','캠핑존왼쪽평상').replace('캠핑존바깥평상','캠핑존오른쪽평상전체');
function places(value){const p=canonical(value),left=['캠핑존의자','캠핑존테이블','캠핑존돗자리','캠핑존왼쪽평상'],right=['캠핑존오른쪽평상안쪽','캠핑존오른쪽평상바깥쪽'];return !p||p==='미지정'||p==='자리배정없음'?[]:p==='캠핑존왼쪽전체(오른쪽평상제외)'?left:p==='캠핑존전체(오른쪽평상포함)'?[...left,...right]:p==='캠핑존오른쪽평상전체'?right:[p]}
function minutes(v){if(!/^\d{2}:\d{2}$/.test(v||''))return null;const [h,m]=v.split(':').map(Number);return h<24&&m<60?h*60+m:null}
function claim(g){if(g.customerInvalidated||g.cancelled||g.programNotRequired||g.status==='cancelled')return null;const seats=places(g.mealLoc);return seats.length?{seats,ranges:[{start:0,end:1440}],org:String(g.org||g.orgName||'다른 단체')}:null}
function conflict(a,b){return !!(a&&b&&a.seats.flatMap(places).some(x=>b.seats.flatMap(places).includes(x)))}
async function save(F,db,id,patch,extra=[]){
 const ref=F.doc(db,'scheduleGroups',String(id));
 if(!extra.length&&!['date','mealLoc','mealStart','mealEnd','ps','pe','segments','cancelled','programNotRequired'].some(k=>Object.hasOwn(patch,k)))return F.setDoc(ref,patch,{merge:true});
 const initial=await F.getDoc(ref),before=initial.exists()?initial.data():{},date=patch.date||before.date;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))throw Error('스케줄 날짜를 확인해주세요.');
 const dates=[...new Set([before.date,date].filter(Boolean))],seeds=new Map();
 // Existing schedules bootstrap the registry without changing their source documents.
 for(const day of dates){const q=await F.getDocs(F.query(F.collection(db,'scheduleGroups'),F.where('date','==',day)));const entries={};q.forEach(d=>{try{const c=claim(d.data());if(c)entries[d.id]=c}catch{entries[d.id]={seats:places(d.data().mealLoc),ranges:[{start:0,end:1440}],org:d.data().org||'시간 미등록 단체'}}});seeds.set(day,entries)}
 return F.runTransaction(db,async tx=>{
  const current=await tx.get(ref),old=current.exists()?current.data():{},next={...old,...patch};
  if((old.date||null)!==(before.date||null))throw Error('스케줄 날짜가 변경되었습니다. 새로고침 후 다시 저장해주세요.');
  const locks=[];for(const day of dates){const lock=F.doc(db,'mealSeatAllocations',day),snapshot=await tx.get(lock);locks.push({day,lock,entries:{...(snapshot.exists()?snapshot.data().entries||{}:seeds.get(day))}})}
  const target=locks.find(x=>x.day===date);
  const booking=await tx.get(F.doc(db,'reservations',String(id)));
  const inactive=booking.exists()&&['cancelled','rejected'].includes(booking.data().status);
  const wanted=inactive?null:claim(next);
  for(const other of Object.keys(target.entries)){if(other===String(id))continue;const reservation=await tx.get(F.doc(db,'reservations',other));const schedule=await tx.get(F.doc(db,'scheduleGroups',other));if((reservation.exists()&&['cancelled','rejected'].includes(reservation.data().status))||(schedule.exists()&&schedule.data().customerInvalidated))delete target.entries[other];}
  for(const [other,c]of Object.entries(target.entries))if(other!==String(id)&&conflict(wanted,c)){const error=Error(c.org+' 단체가 같은 날짜에 이미 배정받은 자리입니다. 식사 시간과 관계없이 다른 자리를 선택해주세요.');error.code='meal-seat-conflict';throw error}
  const allocate=extra.length?await window.ZRBookingAllocations.prepareWrites(F,db,tx,extra):()=>{};
  allocate();
  for(const item of locks){delete item.entries[String(id)];if(item.day===date&&wanted)item.entries[String(id)]=wanted;tx.set(item.lock,{entries:item.entries,updatedAt:F.serverTimestamp()})}
  tx.set(ref,patch,{merge:true});for(const w of extra)tx.set(w.ref,w.data,{merge:true});return true;
 });
}
window.ZRMealSeatAllocation=Object.freeze({catalog,places,claim,conflict,save});
})();
