/* Standalone sales entry. Only this page uses the range reader; admin.html is unchanged. */
(()=>{'use strict';
const $=id=>document.getElementById(id),STAFF='zoolung09@zoolungzoolung.com';
const config={apiKey:'AIzaSyCAjvuTrFVGTyciwAgsbnBonkWCDSt47g0',authDomain:'zoolung-dongtan-schedule.firebaseapp.com',projectId:'zoolung-dongtan-schedule',storageBucket:'zoolung-dongtan-schedule.firebasestorage.app',messagingSenderId:'1031198289899',appId:'1:1031198289899:web:00f4facaf47fc8c1f5b3ae'};
let F,auth,db,store,rows=[],readyKey='',loadingKey='',failedKey='',epoch=0;
const currentMonth=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')};
const val=(id,fallback)=>$(id)?.value||fallback;
const monthRange=ym=>{const [y,m]=ym.split('-').map(Number);return [ym+'-01',(m===12?y+1:y)+'-'+String(m===12?1:m+1).padStart(2,'0')+'-01']};
function plan(){
  const mode=document.querySelector('[data-zr-sales-mode].active')?.dataset.zrSalesMode||'monthly',ym=currentMonth(),year=ym.slice(0,4);
  let ranges;
  if(mode==='year')ranges=[val('zrSalesAnnualBase',year),val('zrSalesAnnualCompare',String(Number(year)-1))].map(y=>[y+'-01-01',String(Number(y)+1)+'-01-01']);
  else if(mode==='revisit')ranges=[['1900-01-01',String(Number(val('zrSalesRevisitYear',year))+1)+'-01-01']];
  else if(mode==='prev'){const d=new Date(Number(year),Number(ym.slice(5))-2,1),prev=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');ranges=[val('zrSalesPrevBase',ym),val('zrSalesPrevCompare',prev)].map(monthRange)}
  else ranges=[monthRange(val(mode==='cafe'?'zrSalesCafeMonth':'zrSalesMonth',ym))];
  return {mode,ranges,key:mode+JSON.stringify(ranges)};
}
function message(text,error=false){$('salesMessage').textContent=text;$('salesMessage').classList.toggle('error',error)}
function ready(){
  if(!store||auth?.currentUser?.email?.toLowerCase()!==STAFF)return false;
  const p=plan();if(p.key===readyKey){if(loadingKey){++epoch;loadingKey=''}$('adminView').dataset.loading='false';return true}
  $('adminView').dataset.loading='true';
  if(p.key===loadingKey||p.key===failedKey)return false;
  loadingKey=p.key;const request=++epoch;
  message(p.mode==='revisit'?'재방문 판별에 필요한 과거 방문 이력을 조회하고 있습니다.':'선택한 기간의 매출을 조회하고 있습니다.');
  store.loadMany(p.ranges).then(result=>{
    if(request!==epoch)return;
    rows=result;readyKey=p.key;loadingKey='';$('adminView').dataset.loading='false';
    message('조회 완료 · '+result.length.toLocaleString('ko-KR')+'건 · 방문일 기준');
    window.ZRSalesViews.refresh();
  }).catch(error=>{if(request!==epoch)return;loadingKey='';failedKey=p.key;message('매출을 불러오지 못했습니다. 새로고침을 눌러 다시 시도해주세요. ('+(error.code||error.message)+')',true)});
  return false;
}
window.bookings=()=>rows;
window.ZRSalesPage=Object.freeze({ready});
window.ZRAdminHelp={tidy(){},open(title,lines){const dialog=document.createElement('dialog');const h=document.createElement('h2');h.textContent=title;dialog.append(h);for(const line of lines){const p=document.createElement('p');p.textContent=line;dialog.append(p)}const close=document.createElement('button');close.textContent='닫기';close.onclick=()=>dialog.close();dialog.append(close);dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal()}};
function summary(snap){
  const today=snap.docs.map(d=>d.data()).filter(b=>b.status==='confirmed');
  const metrics=[['총 예약 확정 팀',today.length+'팀'],['총 방문 인원',today.reduce((s,b)=>s+Math.max(0,Number(b.paidCount||0))+Math.max(0,Number(b.chaperoneCount||0)),0)+'명'],['카페 주문 단체',today.filter(b=>b.mealType==='cafe'||b.cafe?.items?.some(i=>Number(i.qty)>0)).length+'팀'],['결제 완료 팀',today.filter(b=>b.settlement?.savedAt||b.settlementStatus==='completed'||b.settlementCompletedAt).length+'팀']];
  $('salesToday').replaceChildren(...metrics.map(([label,value])=>{const p=document.createElement('p'),b=document.createElement('b');p.textContent=label;b.textContent=value;p.append(b);return p}));
}
function pendingSummary({pending,cancelled,changes,inquiries}){
  const messages=inquiries.docs.map(d=>d.data());
  const text=item=>{for(const key of ['content','message','inquiry','text'])if(Object.prototype.hasOwnProperty.call(item,key))return String(item[key]??'');return ''};
  const change=item=>item.changeRequest===true||/^\[예약 변경 요청\]/.test(text(item))||text(item).includes('\n[예약 변경 정보]\n');
  const counts=[['1:1 문의',messages.filter(i=>!/^\[(사전답사 문의|사전답사 확정)\]/.test(text(i))&&!change(i)&&!text(i).includes('\n\n[관리자 답변]\n')).length],['예약변경요청',changes.docs.filter(d=>{const r=d.data().reservationChangeRequest;return r&&typeof r==='object'&&!['done','rejected'].includes(String(r.status||'pending'))}).length],['사전답사 문의',messages.filter(i=>/^\[사전답사 문의\]/.test(text(i))).length],['예약 대기',pending.size],['예약 취소',cancelled.docs.filter(d=>d.data().status==='cancelled').length]];
  const destinations=['inquiries','reservationChange','previewVisit','activity','activity'];
  $('salesPending').replaceChildren(...counts.map(([label,count],index)=>{const p=document.createElement('a');p.href='./admin.html?section='+destinations[index];p.textContent=label+' '+count+'건';return p}));
}
let summaryStops=[],summaryDay='',dayTimer=0;
function stopSummary(){summaryStops.forEach(stop=>stop());summaryStops=[];clearInterval(dayTimer)}
function refreshSummary(){
  stopSummary();const user=auth.currentUser,state={},errors=new Set(),col=F.collection(db,'reservations');
  const day=new Date(),date=day.getFullYear()+'-'+String(day.getMonth()+1).padStart(2,'0')+'-'+String(day.getDate()).padStart(2,'0');summaryDay=date;
  const queries={today:F.query(col,F.where('date','==',date)),pending:F.query(col,F.where('status','==','pending')),cancelled:F.query(col,F.where('cancelReviewed','==',false)),changes:F.query(col,F.orderBy('reservationChangeRequest')),inquiries:F.collection(db,'customerInquiries')};
  for(const [key,query] of Object.entries(queries))summaryStops.push(F.onSnapshot(query,snap=>{
    if(auth.currentUser!==user)return;state[key]=snap;errors.delete(key);
    if(key==='today')summary(snap);
    else if(['pending','cancelled','changes','inquiries'].every(k=>state[k]&&!errors.has(k)))pendingSummary(state);
  },()=>{if(auth.currentUser!==user)return;errors.add(key);$(key==='today'?'salesToday':'salesPending').textContent='운영 요약 연결을 확인해주세요.'}));
  dayTimer=setInterval(()=>{const d=new Date(),key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');if(key!==summaryDay)refreshSummary()},60000);
}
window.addEventListener('pagehide',stopSummary);
window.addEventListener('beforeunload',event=>{if([...(window.ZRAdminDraftOwners?.values()||[])].some(owner=>owner.dirty?.())){event.preventDefault();event.returnValue=''}});
window.addEventListener('pageshow',event=>{if(event.persisted&&auth?.currentUser?.email?.toLowerCase()===STAFF)refreshSummary()});
async function boot(){
  try{
    const base='https://www.gstatic.com/firebasejs/12.17.1/';
    const [app,A,D]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]);
    F={...A,...D};const instance=app.getApps()[0]||app.initializeApp(config);auth=A.getAuth(instance);db=D.getFirestore(instance);
    // The existing shared memo uses this minimal authenticated connection, not the reservation bridge.
    window.zrReservationFirebase={auth,db,isStaff:()=>auth.currentUser?.email?.toLowerCase()===STAFF};
    store=window.ZRSalesRangeStore.create(async(start,end)=>{const snap=await D.getDocs(D.query(D.collection(db,'reservations'),D.where('date','>=',start),D.where('date','<',end)));return snap.docs.map(d=>({...d.data(),id:d.id}))});
    $('salesLogin').onsubmit=async event=>{event.preventDefault();const button=event.submitter;button.disabled=true;try{await A.setPersistence(auth,A.browserLocalPersistence);await A.signInWithEmailAndPassword(auth,STAFF,$('salesPassword').value);localStorage.setItem('zr_admin_display_name_v1',$('salesIdentity').value.trim());$('salesPassword').value=''}catch{message('로그인 정보를 확인해주세요.',true)}finally{button.disabled=false}};
    A.onAuthStateChanged(auth,user=>{
      const staff=user?.email?.toLowerCase()===STAFF;++epoch;readyKey=loadingKey=failedKey='';rows=[];store.clear();stopSummary();
      $('salesLogin').hidden=staff;$('adminView').hidden=!staff;$('salesRefresh').disabled=!staff;
      if(!staff){message('관리자 로그인 후 이용해주세요.');$('salesToday').textContent=$('salesPending').textContent='로그인 후 확인할 수 있습니다.';return}
      const requested=new URLSearchParams(location.search).get('view');
      window.ZRAdminOpenSales(['monthly','prev','year','cafe','revisit'].includes(requested)?requested:'monthly');refreshSummary();
      document.dispatchEvent(new CustomEvent('zr:admin-firebase-staff-ready'));
    });
    $('salesLogout').onclick=()=>A.signOut(auth);
    $('salesRefresh').onclick=()=>{++epoch;store.clear();readyKey=loadingKey=failedKey='';window.ZRSalesViews.refresh();refreshSummary()};
  }catch(error){message('매출 화면 연결을 확인해주세요. ('+(error.code||error.message)+')',true)}
}
document.addEventListener('DOMContentLoaded',boot,{once:true});
})();
