(()=>{
'use strict';
if(window.__ZR_ADMIN_SCHEDULE_V3)return;
window.__ZR_ADMIN_SCHEDULE_V3=true;

const FV='12.17.1', STAFF_EMAIL='zoolung09@zoolungzoolung.com';
const START=600, MAX=1080, SLOT=15;
const LABEL={f4:'4F 베이직',f5:'5F 워터가든',meal:'식사',play:'놀이터'};
const SHORT={f4:'4F',f5:'5F',meal:'식사',play:'놀이터'};
const CLS={f4:'zrsc-f4',f5:'zrsc-f5',meal:'zrsc-meal',play:'zrsc-play'};
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const tm=m=>pad(Math.floor(m/60))+':'+pad(m%60);
const mn=t=>{if(!t)return null;const [h,m]=String(t).split(':').map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:null};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const add=(t,d)=>mn(t)==null?'':tm(mn(t)+Number(d||0));
const today=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const shift=(s,n)=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const toast=s=>{try{window.toast?.(s)}catch{}};
const clone=v=>JSON.parse(JSON.stringify(v));

let F=null,db=null,auth=null,date=today(),unsub=null,remote=new Map(),installed=false;

function allBookings(){try{return typeof window.bookings==='function'?window.bookings():[]}catch{return[]}}
function bookingsForDate(){
  return allBookings().filter(b=>b&&!b.__availabilityOnly&&b.status==='confirmed'&&b.date===date)
    .sort((a,b)=>String(a.entryTime||'99:99').localeCompare(String(b.entryTime||'99:99'))||String(a.orgName||'').localeCompare(String(b.orgName||''),'ko'));
}
function mealText(b){return ({lunchbox:'도시락',cafe:'카페주문',none:'식사없음'})[b.mealType]||'식사없음'}
function cafeText(b){return (b.cafe?.items||[]).map(x=>`${x.name} × ${x.qty}`).join(' / ')}
function seg(type,start,end){return start&&end?{id:`${type}_${Math.random().toString(36).slice(2,7)}`,type,start,end}:null}
function find(d,t){return (d?.segments||[]).find(s=>s.type===t)||null}
function def(b,t){
  if(t==='meal'&&b.mealType!=='none'&&b.mealStart)return seg(t,b.mealStart,b.mealEnd||add(b.mealStart,b.mealDuration));
  if(t==='play'&&b.playUse!=='no'&&b.playStart)return seg(t,b.playStart,b.playEnd||add(b.playStart,b.playDuration));
  return null;
}
function managed(b,d){return {f4:find(d,'f4'),f5:find(d,'f5'),meal:find(d,'meal')||def(b,'meal'),play:find(d,'play')||def(b,'play')}}
function preserved(d){return (d?.segments||[]).filter(s=>!['f4','f5','meal','play'].includes(s.type))}
function rows(){return bookingsForDate().map(b=>({b,d:remote.get(String(b.id))||null}))}
function axisFor(rs){
  const used=[900];
  rs.forEach(({b,d})=>{
    [b.entryTime,b.exitTime,b.mealStart,b.mealEnd,b.playStart,b.playEnd].forEach(t=>{const m=mn(t);if(m!=null)used.push(m)});
    (d?.segments||[]).forEach(s=>{const a=mn(s.start),z=mn(s.end);if(a!=null)used.push(a);if(z!=null)used.push(z)});
  });
  let end=Math.max(900,Math.ceil(Math.max(...used)/60)*60);end=Math.min(MAX,end);return {start:START,end};
}
function pct(t,a){const m=mn(t);return m==null?0:Math.max(0,Math.min(100,(m-a.start)/(a.end-a.start)*100))}
function ruler(a){
  const span=a.end-a.start,step=span>360?60:30;let h=`<div class="zrsc-grid" style="background-size:${SLOT/span*100}% 100%"></div>`;
  for(let m=a.start;m<=a.end;m+=step){h+=`<span class="zrsc-tick" style="left:${(m-a.start)/span*100}%">${tm(m)}</span>`}
  return h;
}
function segHtml(s,a){
  if(!s?.start||!s?.end)return'';
  const w=Math.max(1,pct(s.end,a)-pct(s.start,a));
  const label=w<8?(SHORT[s.type]||s.type):(LABEL[s.type]||s.type);
  return `<div class="zrsc-seg ${CLS[s.type]||''} ${w<8?'compact':''}" style="left:${pct(s.start,a)}%;width:${w}%" title="${esc((LABEL[s.type]||s.type)+' '+s.start+'~'+s.end)}"><b>${esc(label)}</b>${w>=13?`<small>${esc(s.start)}~${esc(s.end)}</small>`:''}</div>`;
}
function timeOptions(value,maxTime){
  const mx=Math.min(MAX,mn(maxTime)??MAX);let h='<option value="">선택</option>';
  for(let m=START;m<=mx;m+=SLOT){const t=tm(m);h+=`<option value="${t}" ${t===value?'selected':''}>${t}</option>`}
  return h;
}
function interval(type,s,e){return s&&e?{type,start:s,end:e}:null}
function overlaps(a,b){return mn(a.start)<mn(b.end)&&mn(b.start)<mn(a.end)}
function validateSegments(list,b){
  for(const s of list){
    if(!s)continue;
    if(!s.start||!s.end)return `${LABEL[s.type]} 시작·종료 시간을 모두 선택해주세요.`;
    if(mn(s.end)<=mn(s.start))return `${LABEL[s.type]} 종료시간은 시작시간보다 늦어야 합니다.`;
    if(b.exitTime&&mn(s.end)>mn(b.exitTime))return `${LABEL[s.type]} 종료시간은 예약 퇴장시간(${b.exitTime}) 이후로 설정할 수 없습니다.`;
  }
  const active=list.filter(Boolean);
  for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++)if(overlaps(active[i],active[j]))return `${LABEL[active[i].type]}과(와) ${LABEL[active[j].type]} 시간이 겹칩니다.`;
  return'';
}
function getCardValues(card){
  const v=(t,k)=>card.querySelector(`[data-field="${t}${k}"]`)?.value||'';
  return ['f4','f5','meal','play'].map(t=>interval(t,v(t,'s'),v(t,'e'))).filter(Boolean);
}
function updateCardPreview(card,b,d,a){
  const box=card.querySelector('.zrsc-line');if(!box)return;
  const vals=getCardValues(card),ss=[...vals,...preserved(d)].sort((x,y)=>String(x.start).localeCompare(String(y.start)));
  box.innerHTML=`<div class="zrsc-grid" style="background-size:${SLOT/(a.end-a.start)*100}% 100%"></div>${ss.map(s=>segHtml(s,a)).join('')}`;
}

function injectStyle(){
  if($('zrScheduleStyleV3'))return;
  const s=document.createElement('style');s.id='zrScheduleStyleV3';s.textContent=`
  #tab-schedule .zrsc-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:2px 0 15px}
  #tab-schedule .zrsc-toolbar input{width:auto;min-width:150px}
  #tab-schedule .zrsc-status{margin-left:auto;font-size:12px;font-weight:800;padding:7px 10px;border-radius:999px;background:#f2f4f2;border:1px solid var(--line)}
  #tab-schedule .zrsc-status.ok{color:#2f6b4f;background:#e9f3ed;border-color:#c6decf}
  #tab-schedule .zrsc-status.wait{color:#8a661f;background:#fff7e5;border-color:#ead8aa}
  #tab-schedule .zrsc-status.err{color:#a33b3b;background:#fbecec;border-color:#e8c6c6}
  #tab-schedule .zrsc-ruler,#tab-schedule .zrsc-line{position:relative;margin-top:8px;border:1px solid var(--line);border-radius:12px;background:#fff;overflow:hidden}
  #tab-schedule .zrsc-line{height:62px}
  #tab-schedule .zrsc-ruler{height:30px;border:none;background:transparent;overflow:visible;margin:7px 0 2px}
  #tab-schedule .zrsc-grid{position:absolute;inset:0;background-image:linear-gradient(to right,rgba(47,107,79,.11) 1px,transparent 1px)}
  #tab-schedule .zrsc-tick{position:absolute;top:6px;transform:translateX(-50%);font-size:10px;color:var(--muted);white-space:nowrap}
  #tab-schedule .zrsc-card{margin-top:14px;border:1px solid var(--line);border-radius:16px;padding:15px;background:#fff;box-shadow:0 2px 8px rgba(30,50,36,.035)}
  #tab-schedule .zrsc-head{display:flex;gap:7px;align-items:center;flex-wrap:wrap}
  #tab-schedule .zrsc-org{font-weight:900;font-size:17px;margin-right:auto}
  #tab-schedule .zrsc-tag{font-size:11px;padding:5px 8px;border-radius:999px;background:#f2f5f2;border:1px solid var(--line)}
  #tab-schedule .zrsc-phone{background:#eef6f1;color:#2f6b4f}
  #tab-schedule .zrsc-edit{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:12px;align-items:stretch}
  #tab-schedule .zrsc-timebox{border:1px solid var(--line);border-radius:12px;padding:9px}
  #tab-schedule .zrsc-timebox.f4{background:#fff3ea;border-color:#f2d0b8}.zrsc-timebox.f5{background:#eef8ff;border-color:#c7e1f2}.zrsc-timebox.meal{background:#fffbea;border-color:#eadc99}.zrsc-timebox.play{background:#f1faec;border-color:#cce4be}
  #tab-schedule .zrsc-timebox>strong{display:block;font-size:12px;margin-bottom:7px}
  #tab-schedule .zrsc-pair{display:grid;grid-template-columns:1fr 1fr;gap:6px}
  #tab-schedule .zrsc-pair label{font-size:10px;font-weight:800;color:var(--muted);display:block;margin-bottom:3px}
  #tab-schedule .zrsc-pair select{width:100%;padding:8px 5px;background:#fff}
  #tab-schedule .zrsc-actions{display:flex;justify-content:flex-end;gap:7px;flex-wrap:wrap;margin-top:11px}
  #tab-schedule .zrsc-published{font-size:11px;color:#2f6b4f;background:#e9f3ed;border:1px solid #c6decf;border-radius:999px;padding:6px 9px;align-self:center}
  #tab-schedule .zrsc-seg{position:absolute;top:5px;bottom:5px;border-radius:8px;padding:5px 6px;box-sizing:border-box;overflow:hidden;font-size:10px;z-index:2;display:flex;flex-direction:column;justify-content:center}
  #tab-schedule .zrsc-seg.compact{padding:3px 2px;text-align:center;align-items:center}
  #tab-schedule .zrsc-seg b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
  #tab-schedule .zrsc-seg.compact b{font-size:9px;letter-spacing:-.4px}
  #tab-schedule .zrsc-seg small{font-size:9px;white-space:nowrap}
  #tab-schedule .zrsc-f4{background:#f8d7bf}.zrsc-f5{background:#cfe7f7}.zrsc-meal{background:#fff0a8}.zrsc-play{background:#d8efc9}
  #tab-schedule .zrsc-empty{text-align:center;padding:36px;color:var(--muted)}
  @media(max-width:900px){#tab-schedule .zrsc-edit{grid-template-columns:1fr 1fr}}
  @media(max-width:560px){#tab-schedule .zrsc-edit{grid-template-columns:1fr}#tab-schedule .zrsc-line{height:68px}}
  `;document.head.appendChild(s);
}

function installTab(){
  if(installed)return true;
  const tabs=document.querySelector('#adminView .admin-tabs');if(!tabs)return false;
  injectStyle();
  const btn=document.createElement('button');btn.id='zrScheduleTabBtn';btn.className='btn-gray';btn.textContent='스케줄 관리';tabs.appendChild(btn);
  const sec=document.createElement('section');sec.id='tab-schedule';sec.className='hidden';sec.innerHTML=`<div class="card" style="margin-top:14px"><div class="row"><div><h2 style="margin:0 0 4px">스케줄 관리</h2><div class="help">확정 예약을 기준으로 4F·5F·식사·놀이터 시간을 편성합니다. 시간 변경 후 ‘스케줄 반영’을 눌러 적용합니다.</div></div></div><div class="zrsc-toolbar"><button class="btn-soft" id="zrscPrev">‹</button><input type="date" id="zrscDate"><button class="btn-soft" id="zrscNext">›</button><button class="btn-gray" id="zrscToday">오늘</button><button class="btn-soft" id="zrscExcel">엑셀 내려받기</button><span class="zrsc-status wait" id="zrscStatus">● DB 연결 대기</span></div><div class="zrsc-ruler" id="zrscRuler"></div><div id="zrscList"></div></div>`;
  document.querySelector('#adminView').appendChild(sec);
  btn.onclick=openTab;
  document.querySelectorAll('#adminView .admin-tabs button').forEach(x=>{if(x!==btn)x.addEventListener('click',()=>sec.classList.add('hidden'))});
  $('zrscDate').value=date;$('zrscDate').onchange=()=>setDate($('zrscDate').value);$('zrscPrev').onclick=()=>setDate(shift(date,-1));$('zrscNext').onclick=()=>setDate(shift(date,1));$('zrscToday').onclick=()=>setDate(today());
  installed=true;return true;
}
function hideOtherTabs(){document.querySelectorAll('#adminView section[id^="tab-"]').forEach(s=>s.classList.add('hidden'));document.querySelectorAll('#adminView .admin-tabs button').forEach(b=>b.className='btn-gray');$('tab-schedule').classList.remove('hidden');$('zrScheduleTabBtn').className='btn-primary'}
function openTab(){hideOtherTabs();$('zrscDate').value=date;render();listenDate()}
function setDate(d){if(!d)return;date=d;$('zrscDate').value=d;render();listenDate()}
function setStatus(text,state='wait'){const e=$('zrscStatus');if(!e)return;e.textContent='● '+text;e.className='zrsc-status '+state}

function timeBox(type,s,e,b){
  return `<div class="zrsc-timebox ${type}"><strong>${LABEL[type]}</strong><div class="zrsc-pair"><div><label>시작</label><select data-field="${type}s">${timeOptions(s,b.exitTime)}</select></div><div><label>종료</label><select data-field="${type}e">${timeOptions(e,b.exitTime)}</select></div></div></div>`;
}
function render(){
  if(!$('zrscList'))return;
  const rs=rows(),a=axisFor(rs);$('zrscRuler').innerHTML=ruler(a);
  if(!rs.length){$('zrscList').innerHTML='<div class="zrsc-empty">이 날짜에 확정된 예약이 없습니다.</div>';return}
  $('zrscList').innerHTML=rs.map(({b,d})=>{
    const m=managed(b,d),preview=[m.f4,m.f5,m.meal,m.play,...preserved(d)].filter(Boolean).sort((x,y)=>String(x.start).localeCompare(String(y.start))).map(s=>segHtml(s,a)).join('');
    const phone=b.contact?`<span class="zrsc-tag zrsc-phone">☎ ${esc(b.contact)}</span>`:'';
    const published=b.schedulePublished?'<span class="zrsc-published">고객 노출중</span>':'';
    return `<div class="zrsc-card" data-booking="${esc(b.id)}"><div class="zrsc-head"><div class="zrsc-org">${esc(b.orgName)}</div><span class="zrsc-tag">${Number(b.paidCount||0)}(${Number(b.chaperoneCount||0)})명</span>${phone}<span class="zrsc-tag">${esc(mealText(b))}</span>${b.playUse!=='no'?'<span class="zrsc-tag">놀이터</span>':''}<span class="zrsc-tag">예약 ${esc(b.entryTime)}~${esc(b.exitTime)}</span></div><div class="zrsc-line"><div class="zrsc-grid" style="background-size:${SLOT/(a.end-a.start)*100}% 100%"></div>${preview}</div><div class="zrsc-edit">${timeBox('f4',m.f4?.start||'',m.f4?.end||'',b)}${timeBox('f5',m.f5?.start||'',m.f5?.end||'',b)}${timeBox('meal',m.meal?.start||'',m.meal?.end||'',b)}${timeBox('play',m.play?.start||'',m.play?.end||'',b)}</div><div class="zrsc-actions">${published}<button class="btn-soft" data-publish="${esc(b.id)}">${b.schedulePublished?'✓ 스케줄 확정됨':'스케줄 확정'}</button><button class="btn-primary" data-apply="${esc(b.id)}">스케줄 반영</button></div></div>`;
  }).join('');
  document.querySelectorAll('#tab-schedule .zrsc-card').forEach(card=>{const b=bookingsForDate().find(x=>String(x.id)===String(card.dataset.booking)),d=remote.get(String(card.dataset.booking))||null;if(!b)return;card.querySelectorAll('select[data-field]').forEach(s=>s.addEventListener('change',()=>updateCardPreview(card,b,d,a)))});
  document.querySelectorAll('#tab-schedule [data-apply]').forEach(btn=>btn.onclick=()=>applySchedule(btn.dataset.apply,btn,false));
  document.querySelectorAll('#tab-schedule [data-publish]').forEach(btn=>btn.onclick=()=>applySchedule(btn.dataset.publish,btn,true));
}

function bookingDraft(id){
  const b=bookingsForDate().find(x=>String(x.id)===String(id));const card=document.querySelector(`#tab-schedule .zrsc-card[data-booking="${CSS.escape(String(id))}"]`);if(!b||!card)return null;
  const current=getCardValues(card),err=validateSegments(current,b);if(err){toast(err);return null}
  const d=remote.get(String(id))||null,segments=[...current,...preserved(d)].sort((x,y)=>String(x.start).localeCompare(String(y.start)));
  return {b,segments};
}
function customerSchedulePayload(b,segments){return {reservationId:String(b.id),date:b.date,org:b.orgName||'',entryTime:b.entryTime||'',exitTime:b.exitTime||'',contact:b.contact||'',segments:clone(segments),updatedAt:new Date().toISOString()}}
function updateLocalBooking(id,segments,publish){
  const bs=allBookings(),b=bs.find(x=>String(x.id)===String(id));if(!b)return;
  if(publish)b.schedulePublished=true;
  if(b.schedulePublished)b.customerSchedule=customerSchedulePayload(b,segments);
  try{window.setStore?.('zr_bookings',bs)}catch(e){console.error('schedule booking sync',e)}
}
async function applySchedule(id,btn,publish){
  const x=bookingDraft(id);if(!x)return;
  if(!F||!db||!auth?.currentUser||String(auth.currentUser.email||'').toLowerCase()!==STAFF_EMAIL)return toast('공용 DB 로그인 연결을 확인해주세요.');
  const {b,segments}=x,old=btn.textContent;btn.disabled=true;btn.textContent=publish?'확정 중...':'반영 중...';
  const patch={reservationId:String(b.id),date:b.date,org:b.orgName||'',res:Number(b.paidCount||0),tea:Number(b.chaperoneCount||0),contact:b.contact||'',ps:b.entryTime||'',pe:b.exitTime||'',meal:mealText(b),cafeDetail:cafeText(b),segments,updatedAt:F.serverTimestamp()};
  try{
    await F.setDoc(F.doc(db,'scheduleGroups',String(b.id)),patch,{merge:true});
    updateLocalBooking(id,segments,publish);
    toast(publish?'스케줄을 확정해 고객에게 공개했습니다.':'현장 스케줄에 반영했습니다.');
    if(publish)setTimeout(render,120);
  }catch(e){console.error('schedule apply',e);toast('스케줄 반영에 실패했습니다. DB 연결을 확인해주세요.')}
  finally{btn.disabled=false;btn.textContent=old}
}

function stopListen(){if(unsub){unsub();unsub=null}}
function listenDate(){
  stopListen();if(!F||!db||!auth?.currentUser){setStatus('DB 연결 대기','wait');return}
  setStatus('불러오는 중...','wait');
  try{
    const q=F.query(F.collection(db,'scheduleGroups'),F.where('date','==',date));
    unsub=F.onSnapshot(q,s=>{remote=new Map(s.docs.map(d=>[d.id,{id:d.id,...d.data()}]));setStatus('실시간 연결됨','ok');render()},e=>{console.error(e);setStatus('DB 연결 확인 필요','err')});
  }catch(e){console.error(e);setStatus('DB 연결 확인 필요','err')}
}
async function initFirebase(){
  try{
    const [appMod,authMod,fsMod]=await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FV}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FV}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`)
    ]);
    const app=appMod.getApps()[0];if(!app)throw new Error('Firebase app not initialized');auth=authMod.getAuth(app);db=fsMod.getFirestore(app);F={...fsMod};
    authMod.onAuthStateChanged(auth,()=>{if(!$('tab-schedule')?.classList.contains('hidden'))listenDate()});
  }catch(e){console.error('schedule admin firebase',e)}
}

window.zrScheduleAdminV3={
  get date(){return date},getRows:rows,axisFor,toMin:mn,toTime:tm,slot:SLOT,label:LABEL,managed,toast
};

function boot(){const timer=setInterval(()=>{if(installTab()){clearInterval(timer);initFirebase()}},250);setTimeout(()=>clearInterval(timer),15000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
