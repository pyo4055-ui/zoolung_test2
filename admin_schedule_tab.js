(()=>{
'use strict';

const FIREBASE_VERSION='12.17.1';
const START_MIN=600, MAX_MIN=1080, SLOT=15;
const COLORS={f4:'zrsc-f4',f5:'zrsc-f5',meal:'zrsc-meal',play:'zrsc-play'};
const LABELS={f4:'4F 베이직',f5:'5F 워터가든',meal:'식사',play:'놀이터'};
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const toMin=t=>{if(!t)return null;const [h,m]=String(t).split(':').map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:null};
const toTime=m=>pad(Math.floor(m/60))+':'+pad(m%60);
const addMin=(start,dur)=>{const m=toMin(start);return m==null?'':toTime(m+Number(dur||0))};
const today=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const shift=(s,n)=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const toastSafe=m=>{try{if(typeof window.toast==='function')window.toast(m)}catch{}};

let F=null,db=null,auth=null,selectedDate=today(),unsub=null,remote=new Map(),installed=false;

function bookingsForDate(){
  try{
    return (typeof window.bookings==='function'?window.bookings():[])
      .filter(b=>b&&b.status==='confirmed'&&b.date===selectedDate)
      .sort((a,b)=>String(a.entryTime||'99:99').localeCompare(String(b.entryTime||'99:99'))||String(a.orgName||'').localeCompare(String(b.orgName||''),'ko'));
  }catch{return []}
}
function mealText(b){return ({lunchbox:'도시락',cafe:'카페주문',none:'식사없음'})[b.mealType]||'식사없음'}
function cafeText(b){return (b.cafe?.items||[]).map(x=>`${x.name} × ${x.qty}`).join(' / ')}
function segment(type,start,end){return start&&end?{id:`${type}_${Math.random().toString(36).slice(2,8)}`,type,start,end}:null}
function bookingFixedSegments(b){
  const out=[];
  if(b.mealType!=='none'&&b.mealStart){const end=b.mealEnd||addMin(b.mealStart,b.mealDuration);if(end)out.push(segment('meal',b.mealStart,end))}
  if(b.playUse!=='no'&&b.playStart){const end=b.playEnd||addMin(b.playStart,b.playDuration);if(end)out.push(segment('play',b.playStart,end))}
  return out.filter(Boolean);
}
function findType(doc,type){return (doc?.segments||[]).find(s=>s.type===type)||null}
function axisFor(rows){
  const vals=[900];
  rows.forEach(({b,d})=>{
    [b.entryTime,b.exitTime,b.mealStart,b.mealEnd,b.playStart,b.playEnd].forEach(t=>{const m=toMin(t);if(m!=null)vals.push(m)});
    (d?.segments||[]).forEach(s=>{const a=toMin(s.start),z=toMin(s.end);if(a!=null)vals.push(a);if(z!=null)vals.push(z)});
  });
  let end=Math.max(900,Math.ceil(Math.max(...vals)/60)*60);end=Math.min(MAX_MIN,end);return {start:START_MIN,end};
}
function pct(t,axis){const m=toMin(t);if(m==null)return 0;return Math.max(0,Math.min(100,(m-axis.start)/(axis.end-axis.start)*100))}
function ruler(axis){
  const span=axis.end-axis.start,step=span>360?60:30;let h='<div class="zrsc-grid" style="background-size:'+((SLOT/span)*100)+'% 100%"></div>';
  for(let m=axis.start;m<=axis.end;m+=step){const p=(m-axis.start)/span*100;h+=`<span class="zrsc-tick" style="left:${p}%">${toTime(m)}</span>`}
  return h;
}
function segHtml(s,axis){if(!s||!s.start||!s.end)return'';const w=Math.max(1,pct(s.end,axis)-pct(s.start,axis));return `<div class="zrsc-seg ${COLORS[s.type]||''}" style="left:${pct(s.start,axis)}%;width:${w}%"><b>${LABELS[s.type]||s.type}</b>${w>=10?`<small>${s.start}~${s.end}</small>`:''}</div>`}
function timeOptions(value){
  let h='<option value="">선택</option>';for(let m=START_MIN;m<=MAX_MIN;m+=15){const t=toTime(m);h+=`<option value="${t}" ${t===value?'selected':''}>${t}</option>`}return h;
}

function injectStyle(){
  if($('zrScheduleStyle'))return;
  const s=document.createElement('style');s.id='zrScheduleStyle';s.textContent=`
  #tab-schedule .zrsc-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px}
  #tab-schedule .zrsc-toolbar input{width:auto;min-width:150px}
  #tab-schedule .zrsc-status{margin-left:auto;font-size:12px;color:var(--muted)}
  #tab-schedule .zrsc-ruler,#tab-schedule .zrsc-line{position:relative;height:34px;margin-top:8px;border:1px solid var(--line);border-radius:10px;background:#fff;overflow:hidden}
  #tab-schedule .zrsc-ruler{height:28px;border:none;background:transparent;overflow:visible;margin:4px 0 0}
  #tab-schedule .zrsc-grid{position:absolute;inset:0;background-image:linear-gradient(to right,rgba(47,107,79,.10) 1px,transparent 1px)}
  #tab-schedule .zrsc-tick{position:absolute;top:5px;transform:translateX(-50%);font-size:10px;color:var(--muted);white-space:nowrap}
  #tab-schedule .zrsc-card{margin-top:10px;border:1px solid var(--line);border-radius:14px;padding:12px;background:#fff}
  #tab-schedule .zrsc-head{display:flex;gap:7px;align-items:center;flex-wrap:wrap}
  #tab-schedule .zrsc-org{font-weight:900;font-size:16px;margin-right:auto}
  #tab-schedule .zrsc-tag{font-size:11px;padding:5px 8px;border-radius:999px;background:#f2f5f2;border:1px solid var(--line)}
  #tab-schedule .zrsc-edit{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:10px;align-items:end}
  #tab-schedule .zrsc-edit label{font-size:11px;font-weight:800;color:var(--muted);display:block;margin-bottom:4px}
  #tab-schedule .zrsc-edit select{width:100%;padding:8px 6px}
  #tab-schedule .zrsc-save{grid-column:1/-1;display:flex;justify-content:flex-end}
  #tab-schedule .zrsc-seg{position:absolute;top:3px;bottom:3px;border-radius:7px;padding:3px 5px;box-sizing:border-box;overflow:hidden;font-size:10px;z-index:2}
  #tab-schedule .zrsc-seg b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #tab-schedule .zrsc-seg small{font-size:9px;white-space:nowrap}
  #tab-schedule .zrsc-f4{background:#f8d7bf}.zrsc-f5{background:#cfe7f7}.zrsc-meal{background:#fff0a8}.zrsc-play{background:#d8efc9}
  #tab-schedule .zrsc-empty{text-align:center;padding:30px;color:var(--muted)}
  @media(max-width:700px){#tab-schedule .zrsc-edit{grid-template-columns:1fr 1fr}}
  `;document.head.appendChild(s);
}
function installTab(){
  if(installed)return true;
  const tabs=document.querySelector('#adminView .admin-tabs');if(!tabs)return false;
  injectStyle();
  const btn=document.createElement('button');btn.id='zrScheduleTabBtn';btn.className='btn-gray';btn.textContent='스케줄 관리';
  tabs.appendChild(btn);
  const sec=document.createElement('section');sec.id='tab-schedule';sec.className='hidden';sec.innerHTML=`<div class="card" style="margin-top:14px"><div class="row"><div><h2 style="margin:0 0 4px">스케줄 관리</h2><div class="help">확정 예약의 식사·놀이터 시간은 예약정보를 사용하고, 4F/5F 시간만 지정합니다.</div></div></div><div class="zrsc-toolbar"><button class="btn-soft" id="zrscPrev">‹</button><input type="date" id="zrscDate"><button class="btn-soft" id="zrscNext">›</button><button class="btn-gray" id="zrscToday">오늘</button><span class="zrsc-status" id="zrscStatus">DB 연결 대기</span></div><div class="zrsc-ruler" id="zrscRuler"></div><div id="zrscList"></div></div>`;
  document.querySelector('#adminView').appendChild(sec);
  btn.onclick=()=>openTab();
  document.querySelectorAll('#adminView .admin-tabs button').forEach(x=>{if(x!==btn)x.addEventListener('click',()=>sec.classList.add('hidden'))});
  $('zrscDate').value=selectedDate;$('zrscDate').onchange=()=>setDate($('zrscDate').value);$('zrscPrev').onclick=()=>setDate(shift(selectedDate,-1));$('zrscNext').onclick=()=>setDate(shift(selectedDate,1));$('zrscToday').onclick=()=>setDate(today());
  installed=true;return true;
}
function hideOtherTabs(){
  document.querySelectorAll('#adminView section[id^="tab-"]').forEach(s=>s.classList.add('hidden'));
  document.querySelectorAll('#adminView .admin-tabs button').forEach(b=>b.className='btn-gray');
  $('tab-schedule').classList.remove('hidden');$('zrScheduleTabBtn').className='btn-primary';
}
function openTab(){hideOtherTabs();$('zrscDate').value=selectedDate;render();listenDate()}
function setDate(d){if(!d)return;selectedDate=d;$('zrscDate').value=d;render();listenDate()}

function render(){
  if(!$('zrscList'))return;
  const bs=bookingsForDate();const rows=bs.map(b=>({b,d:remote.get(String(b.id))||null}));const axis=axisFor(rows);$('zrscRuler').innerHTML=ruler(axis);
  if(!rows.length){$('zrscList').innerHTML='<div class="zrsc-empty">이 날짜에 확정된 예약이 없습니다.</div>';return}
  $('zrscList').innerHTML=rows.map(({b,d})=>{
    const f4=findType(d,'f4'),f5=findType(d,'f5');const fixed=bookingFixedSegments(b);const preview=[f4,f5,...fixed].filter(Boolean).sort((a,z)=>String(a.start).localeCompare(String(z.start))).map(s=>segHtml(s,axis)).join('');
    return `<div class="zrsc-card" data-booking="${esc(b.id)}"><div class="zrsc-head"><div class="zrsc-org">${esc(b.orgName)}</div><span class="zrsc-tag">${Number(b.paidCount||0)}(${Number(b.chaperoneCount||0)})명</span><span class="zrsc-tag">${esc(mealText(b))}${b.mealStart?` · ${esc(b.mealStart)}~${esc(b.mealEnd||addMin(b.mealStart,b.mealDuration))}`:''}</span>${b.playUse!=='no'&&b.playStart?`<span class="zrsc-tag">놀이터 · ${esc(b.playStart)}~${esc(b.playEnd||addMin(b.playStart,b.playDuration))}</span>`:''}<span class="zrsc-tag">예약 ${esc(b.entryTime)}~${esc(b.exitTime)}</span></div><div class="zrsc-line"><div class="zrsc-grid" style="background-size:${(SLOT/(axis.end-axis.start))*100}% 100%"></div>${preview}</div><div class="zrsc-edit"><div><label>4F 시작</label><select data-field="f4s">${timeOptions(f4?.start||'')}</select></div><div><label>4F 종료</label><select data-field="f4e">${timeOptions(f4?.end||'')}</select></div><div><label>5F 시작</label><select data-field="f5s">${timeOptions(f5?.start||'')}</select></div><div><label>5F 종료</label><select data-field="f5e">${timeOptions(f5?.end||'')}</select></div><div class="zrsc-save"><button class="btn-primary" data-save="${esc(b.id)}">스케줄 저장</button></div></div></div>`;
  }).join('');
  document.querySelectorAll('#tab-schedule [data-save]').forEach(btn=>btn.onclick=()=>saveSchedule(btn.dataset.save,btn));
}
function validatePair(s,e,label){if(!s&&!e)return'';if(!s||!e)return `${label} 시작·종료 시간을 모두 선택해주세요.`;if(toMin(e)<=toMin(s))return `${label} 종료시간은 시작시간보다 늦어야 합니다.`;return''}
async function saveSchedule(id,btn){
  const b=bookingsForDate().find(x=>String(x.id)===String(id));if(!b)return toastSafe('예약 정보를 찾지 못했습니다.');
  if(!F||!db||!auth?.currentUser||String(auth.currentUser.email||'').toLowerCase()!=='zoolung09@zoolungzoolung.com')return toastSafe('공용 DB 로그인 연결을 확인해주세요.');
  const card=btn.closest('.zrsc-card'),f4s=card.querySelector('[data-field="f4s"]').value,f4e=card.querySelector('[data-field="f4e"]').value,f5s=card.querySelector('[data-field="f5s"]').value,f5e=card.querySelector('[data-field="f5e"]').value;
  let err=validatePair(f4s,f4e,'4F')||validatePair(f5s,f5e,'5F');if(err)return toastSafe(err);
  const segments=[];if(f4s&&f4e)segments.push(segment('f4',f4s,f4e));if(f5s&&f5e)segments.push(segment('f5',f5s,f5e));segments.push(...bookingFixedSegments(b));segments.sort((a,z)=>String(a.start).localeCompare(String(z.start)));
  const patch={reservationId:String(b.id),date:b.date,org:b.orgName||'',res:Number(b.paidCount||0),tea:Number(b.chaperoneCount||0),ps:b.entryTime||'',pe:b.exitTime||'',meal:mealText(b),cafeDetail:cafeText(b),segments,updatedAt:F.serverTimestamp()};
  btn.disabled=true;btn.textContent='저장 중...';
  try{await F.setDoc(F.doc(db,'scheduleGroups',String(b.id)),patch,{merge:true});toastSafe('현장 스케줄에 저장했습니다.');}
  catch(e){console.error('schedule save',e);toastSafe('스케줄 저장에 실패했습니다. DB 연결을 확인해주세요.');}
  finally{btn.disabled=false;btn.textContent='스케줄 저장'}
}

function stopListen(){if(unsub){unsub();unsub=null}}
function listenDate(){
  stopListen();if(!F||!db||!auth?.currentUser){$('zrscStatus').textContent='DB 연결 대기';return}
  $('zrscStatus').textContent='불러오는 중...';
  try{
    const q=F.query(F.collection(db,'scheduleGroups'),F.where('date','==',selectedDate));
    unsub=F.onSnapshot(q,s=>{remote=new Map(s.docs.map(d=>[d.id,{id:d.id,...d.data()}]));$('zrscStatus').textContent='● 실시간 연결됨';render()},e=>{console.error(e);$('zrscStatus').textContent='DB 연결 확인 필요'});
  }catch(e){console.error(e);$('zrscStatus').textContent='DB 연결 확인 필요'}
}
async function initFirebase(){
  try{
    const [appMod,authMod,fsMod]=await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`)
    ]);
    const app=appMod.getApps()[0];if(!app)throw new Error('Firebase app not initialized');auth=authMod.getAuth(app);db=fsMod.getFirestore(app);F={...fsMod};
    authMod.onAuthStateChanged(auth,()=>{if(!$('tab-schedule')?.classList.contains('hidden'))listenDate()});
  }catch(e){console.error('schedule admin firebase',e)}
}

function boot(){
  const timer=setInterval(()=>{if(installTab()){clearInterval(timer);initFirebase()}},300);setTimeout(()=>clearInterval(timer),15000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();