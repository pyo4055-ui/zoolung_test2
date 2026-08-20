(()=>{
'use strict';
if(window.__ZR_ADMIN_SCHEDULE_V14)return;
window.__ZR_ADMIN_SCHEDULE_V14=true;

const FV='12.17.1', STAFF_EMAIL='zoolung09@zoolungzoolung.com';
const START=600, MAX=1080, SLOT=15, CATALOG_ID='__content_catalog__';
const FIXED=['f4','f5','meal','play'];
const DEFAULTS={
  f4:{id:'f4',name:'4F 베이직',color:'#f8d7bf'},
  f5:{id:'f5',name:'5F 워터가든',color:'#cfe7f7'},
  meal:{id:'meal',name:'식사',color:'#fff0a8'},
  play:{id:'play',name:'놀이터',color:'#d8efc9'}
};
const SHORT={f4:'4F',f5:'5F',meal:'식',play:'놀'};
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const tm=m=>`${pad(Math.floor(m/60))}:${pad(m%60)}`;
const mn=t=>{if(!t)return null;const [h,m]=String(t).split(':').map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:null};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>{const d=new Date();return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const shift=(s,n)=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`};
const add=(t,d)=>mn(t)==null?'':tm(mn(t)+Number(d||0));
const clone=v=>JSON.parse(JSON.stringify(v));
const toast=s=>{try{window.toast?.(s)}catch{}};

let F=null,authMod=null,db=null,auth=null,date=today(),unsub=null,unsubCatalog=null,remote=new Map();
let fixedCatalog=clone(DEFAULTS),installed=false,modalBookingId='',modalCustom=[],draftCustom=new Map(),retryTimer=null;

function allBookings(){try{return typeof window.bookings==='function'?window.bookings():[]}catch{return[]}}
function bookingById(id){return allBookings().find(x=>String(x.id)===String(id))||null}
function bookingsForDate(){return allBookings().filter(b=>b&&!b.__availabilityOnly&&b.status==='confirmed'&&b.date===date).sort((a,b)=>String(a.entryTime||'99:99').localeCompare(String(b.entryTime||'99:99'))||String(a.orgName||'').localeCompare(String(b.orgName||''),'ko'))}
function bridge(){return window.zrReservationFirebase||null}
function isStaff(){const z=bridge();return !!z?.isStaff?.()&&String(z.auth?.currentUser?.email||'').toLowerCase()===STAFF_EMAIL.toLowerCase()}
function ensureBridge(){const z=bridge();if(!z?.db||!z?.auth)return false;db=z.db;auth=z.auth;return true}
function cat(type){return fixedCatalog[type]||DEFAULTS[type]||null}
function nameOf(s){return s?.label||cat(s?.type)?.name||s?.type||'컨텐츠'}
function colorOf(s){return s?.color||cat(s?.type)?.color||'#edf0ed'}
function shortOf(s){return SHORT[s?.type]||nameOf(s).slice(0,2)}
function mealText(b){return ({lunchbox:'도시락',cafe:'카페주문',none:'식사없음'})[b.mealType]||'식사없음'}
function cafeText(b){return (b.cafe?.items||[]).map(x=>`${x.name} × ${x.qty}`).join(' / ')}
function seg(type,start,end,id,label,color){return (start||end)?{id:id||`${type}_${Math.random().toString(36).slice(2,7)}`,type,start,end,...(label?{label}:{}),...(color?{color}:{})}:null}
function findSeg(d,type){return (d?.segments||[]).find(s=>s.type===type)||null}
function defaultFixed(b,type){
  if(type==='meal'&&b.mealType!=='none'&&b.mealStart)return seg(type,b.mealStart,b.mealEnd||add(b.mealStart,b.mealDuration));
  if(type==='play'&&b.playUse!=='no'&&b.playStart)return seg(type,b.playStart,b.playEnd||add(b.playStart,b.playDuration));
  return null;
}
function managed(b,d){return {f4:findSeg(d,'f4'),f5:findSeg(d,'f5'),meal:findSeg(d,'meal')||defaultFixed(b,'meal'),play:findSeg(d,'play')||defaultFixed(b,'play')}}
function baseCustomDefs(d){
  if(Array.isArray(d?.customDefs))return d.customDefs.map(x=>({id:String(x.id),name:String(x.name||'추가 컨텐츠'),color:/^#[0-9a-f]{6}$/i.test(x.color||'')?x.color:'#e9ddf7'}));
  const map=new Map();
  (d?.segments||[]).filter(s=>!FIXED.includes(s.type)).forEach(s=>{if(!map.has(s.type))map.set(s.type,{id:String(s.type),name:String(s.label||s.type||'추가 컨텐츠'),color:/^#[0-9a-f]{6}$/i.test(s.color||'')?s.color:'#e9ddf7'})});
  return [...map.values()];
}
function customDefs(id,d){return draftCustom.has(String(id))?clone(draftCustom.get(String(id))):baseCustomDefs(d)}
function rows(){return bookingsForDate().map(b=>({b,d:remote.get(String(b.id))||null}))}
function axisFor(rs){
  const used=[900];
  rs.forEach(({b,d})=>{[b.entryTime,b.exitTime,b.mealStart,b.mealEnd,b.playStart,b.playEnd].forEach(t=>{const m=mn(t);if(m!=null)used.push(m)});(d?.segments||[]).forEach(s=>{const a=mn(s.start),z=mn(s.end);if(a!=null)used.push(a);if(z!=null)used.push(z)})});
  return {start:START,end:Math.min(MAX,Math.max(900,Math.ceil(Math.max(...used)/60)*60))};
}
function pct(t,a){const m=mn(t);return m==null?0:Math.max(0,Math.min(100,(m-a.start)/(a.end-a.start)*100))}
function rulerHtml(a,cls='zrsc-tick'){
  const span=a.end-a.start,step=span>360?60:30;let h=`<div class="zrsc-grid" style="background-size:${SLOT/span*100}% 100%"></div>`;
  for(let m=a.start;m<=a.end;m+=step){const edge=m===a.start?' first':m===a.end?' last':'';h+=`<span class="${cls}${edge}" style="left:${(m-a.start)/span*100}%">${tm(m)}</span>`}return h;
}
function segmentHtml(s,a,zoom=false){
  if(!s?.start||!s?.end)return'';const w=Math.max(1,pct(s.end,a)-pct(s.start,a)),compact=w<(zoom?6:8),label=compact?shortOf(s):nameOf(s),cl=zoom?'zr14-zoom-seg':'zrsc-seg';
  return `<div class="${cl} ${compact?'compact':''}" style="left:${pct(s.start,a)}%;width:${w}%;background:${esc(colorOf(s))}" title="${esc(nameOf(s)+' '+s.start+'~'+s.end)}"><b>${esc(label)}</b>${w>=(zoom?8:13)?`<small>${esc(s.start)}~${esc(s.end)}</small>`:''}</div>`;
}
function timeOptions(value,maxTime){const mx=Math.min(MAX,mn(maxTime)??MAX);let h='<option value="">선택</option>',found=!value;for(let m=START;m<=mx;m+=SLOT){const t=tm(m);if(t===value)found=true;h+=`<option value="${t}" ${t===value?'selected':''}>${t}</option>`}if(value&&!found)h+=`<option value="${esc(value)}" selected>${esc(value)}</option>`;return h}
function fixedBox(type,s,e,b){const c=cat(type);return `<div class="zrsc-timebox ${type}" style="background:${esc(c.color)};border-color:${esc(c.color)}"><strong>${esc(c.name)}</strong><div class="zrsc-pair"><div><label>시작</label><select data-field="${type}s">${timeOptions(s,b.exitTime)}</select></div><div><label>종료</label><select data-field="${type}e">${timeOptions(e,b.exitTime)}</select></div></div></div>`}
function customBox(def,s,b){return `<div class="zrsc-timebox zr14-custom-box" data-custom-id="${esc(def.id)}" data-custom-name="${esc(def.name)}" data-custom-color="${esc(def.color)}" style="background:${esc(def.color)};border-color:${esc(def.color)}"><div class="zr14-custom-head"><strong>${esc(def.name)}</strong><button type="button" class="zr14-delete-small" data-custom-delete>삭제</button></div><div class="zrsc-pair"><div><label>시작</label><select data-custom-start>${timeOptions(s?.start||'',b.exitTime)}</select></div><div><label>종료</label><select data-custom-end>${timeOptions(s?.end||'',b.exitTime)}</select></div></div></div>`}
function defsFromCard(card){return [...card.querySelectorAll('.zr14-custom-box')].map(box=>({id:box.dataset.customId,name:box.dataset.customName||'추가 컨텐츠',color:box.dataset.customColor||'#e9ddf7'}))}
function cardSegments(card,id){
  const d=remote.get(String(id))||null,out=[];
  for(const type of FIXED){const old=findSeg(d,type),s=card.querySelector(`[data-field="${type}s"]`)?.value||'',e=card.querySelector(`[data-field="${type}e"]`)?.value||'',c=cat(type),x=seg(type,s,e,old?.id,c.name,c.color);if(x)out.push(x)}
  card.querySelectorAll('.zr14-custom-box').forEach(box=>{const old=findSeg(d,box.dataset.customId),s=box.querySelector('[data-custom-start]')?.value||'',e=box.querySelector('[data-custom-end]')?.value||'',x=seg(box.dataset.customId,s,e,old?.id,box.dataset.customName,box.dataset.customColor);if(x)out.push(x)});
  return out.sort((a,b)=>String(a.start||'').localeCompare(String(b.start||'')));
}
function validateSegments(segs,b){
  const active=[];for(const s of segs){if(!s.start&&!s.end)continue;const n=nameOf(s),a=mn(s.start),z=mn(s.end);if(a==null||z==null)return `${n} 시작·종료 시간을 모두 선택해주세요.`;if(z<=a)return `${n} 종료시간은 시작시간보다 늦어야 합니다.`;if(b.exitTime&&z>mn(b.exitTime))return `${n} 종료시간은 예약 퇴장시간(${b.exitTime}) 이후로 설정할 수 없습니다.`;active.push({...s,a,z})}
  active.sort((x,y)=>x.a-y.a);for(let i=1;i<active.length;i++)if(active[i].a<active[i-1].z)return `${nameOf(active[i-1])}과(와) ${nameOf(active[i])} 시간이 겹칩니다.`;return'';
}
function renderCardPreview(card){const id=card.dataset.booking,b=bookingById(id);if(!b)return;const a=axisFor(rows()),line=card.querySelector('.zrsc-line'),ss=cardSegments(card,id);line.innerHTML=`<div class="zrsc-grid" style="background-size:${SLOT/(a.end-a.start)*100}% 100%"></div>${ss.map(s=>segmentHtml(s,a)).join('')}`}

function injectStyle(){if($('zrScheduleStyleV14'))return;const s=document.createElement('style');s.id='zrScheduleStyleV14';s.textContent=`
#tab-schedule .zrsc-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:2px 0 15px}#tab-schedule .zrsc-toolbar input{width:auto;min-width:150px}
#tab-schedule .zrsc-status{margin-left:auto;font-size:12px;font-weight:800;padding:7px 10px;border-radius:999px;background:#f2f4f2;border:1px solid var(--line)}#tab-schedule .zrsc-status.ok{color:#2f6b4f;background:#e9f3ed;border-color:#c6decf}#tab-schedule .zrsc-status.wait{color:#8a661f;background:#fff7e5;border-color:#ead8aa}#tab-schedule .zrsc-status.err{color:#a33b3b;background:#fbecec;border-color:#e8c6c6}
#tab-schedule .zrsc-ruler,#tab-schedule .zrsc-line{position:relative;margin-top:8px;border:1px solid var(--line);border-radius:12px;background:#fff;overflow:hidden}#tab-schedule .zrsc-line{height:62px}#tab-schedule .zrsc-ruler{height:30px;border:none;background:transparent;overflow:visible;margin:7px 0 2px}#tab-schedule .zrsc-grid{position:absolute;inset:0;background-image:linear-gradient(to right,rgba(47,107,79,.11) 1px,transparent 1px)}
#tab-schedule .zrsc-tick{position:absolute;top:6px;transform:translateX(-50%);font-size:10px;color:var(--muted);white-space:nowrap}#tab-schedule .zrsc-tick.first{transform:none}#tab-schedule .zrsc-tick.last{transform:translateX(-100%)}
#tab-schedule .zrsc-card{margin-top:14px;border:1px solid var(--line);border-radius:16px;padding:15px;background:#fff;box-shadow:0 2px 8px rgba(30,50,36,.035)}#tab-schedule .zrsc-head{display:flex;gap:7px;align-items:center;flex-wrap:wrap}#tab-schedule .zrsc-org{font-weight:900;font-size:17px;margin-right:auto}#tab-schedule .zrsc-tag{font-size:11px;padding:5px 8px;border-radius:999px;background:#f2f5f2;border:1px solid var(--line)}#tab-schedule .zrsc-phone{background:#eef6f1;color:#2f6b4f}
#tab-schedule .zrsc-edit{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:12px;align-items:stretch}#tab-schedule .zrsc-timebox{border:1px solid var(--line);border-radius:12px;padding:9px}#tab-schedule .zrsc-timebox>strong,.zr14-custom-head strong{display:block;font-size:12px}.zr14-custom-head{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:7px}.zr14-delete-small{border:0;background:rgba(255,255,255,.72);color:#8b3f3f;border-radius:7px;padding:4px 7px;font-size:10px;font-weight:800;cursor:pointer}
#tab-schedule .zrsc-pair{display:grid;grid-template-columns:1fr 1fr;gap:6px}#tab-schedule .zrsc-pair label{font-size:10px;font-weight:800;color:var(--muted);display:block;margin-bottom:3px}#tab-schedule .zrsc-pair select{width:100%;padding:8px 5px;background:#fff}#tab-schedule .zrsc-actions{display:flex;justify-content:flex-end;gap:7px;flex-wrap:wrap;margin-top:11px}#tab-schedule .zrsc-published{font-size:11px;color:#2f6b4f;background:#e9f3ed;border:1px solid #c6decf;border-radius:999px;padding:6px 9px;align-self:center}
#tab-schedule .zr14-content-btn{border:1px solid #d1bdf3;background:#f0e9ff;color:#6841a5;border-radius:10px;padding:9px 12px;font-weight:800}#tab-schedule .zr14-zoom-btn{border:1px solid #bad5e8;background:#eaf5fc;color:#2e6487;border-radius:10px;padding:9px 12px;font-weight:800}
#tab-schedule .zrsc-seg{position:absolute;top:5px;bottom:5px;border-radius:8px;padding:5px 6px;box-sizing:border-box;overflow:hidden;font-size:10px;z-index:2;display:flex;flex-direction:column;justify-content:center}#tab-schedule .zrsc-seg.compact{padding:3px 2px;text-align:center;align-items:center}#tab-schedule .zrsc-seg b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}#tab-schedule .zrsc-seg.compact b{font-size:9px;letter-spacing:-.4px}#tab-schedule .zrsc-seg small{font-size:9px;white-space:nowrap}#tab-schedule .zrsc-empty{text-align:center;padding:36px;color:var(--muted)}
.zr14-modal{position:fixed;inset:0;z-index:10030;background:rgba(0,0,0,.48);display:flex;align-items:center;justify-content:center;padding:16px}.zr14-modal.hidden{display:none!important}.zr14-modal-card{width:min(760px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:17px;padding:17px;box-shadow:0 22px 70px rgba(0,0,0,.24)}.zr14-title{display:flex;gap:10px;align-items:center}.zr14-title h2{margin:0;flex:1}.zr14-close{border:1px solid #d8ded9;background:#f1f4f1;border-radius:9px;padding:8px 12px;font-weight:800}.zr14-row{display:grid;grid-template-columns:minmax(150px,1fr) 76px 70px;gap:9px;align-items:center;margin-top:9px}.zr14-row input[type=text]{min-height:40px}.zr14-row input[type=color]{height:40px;padding:3px}.zr14-kind{font-size:11px;color:#6d756f;text-align:center}.zr14-remove{border:1px solid #e6c6c6;background:#fff1f1;color:#984444;border-radius:8px;padding:8px;font-weight:800}.zr14-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px;flex-wrap:wrap}
.zr14-zoom-card{width:min(1180px,100%);max-height:94vh;overflow:hidden}.zr14-zoom-scroll{overflow:auto;max-height:78vh;margin-top:12px;border:1px solid #dfe5df;border-radius:12px;background:#fff}.zr14-zoom-wide{min-width:920px}.zr14-zoom-ruler,.zr14-zoom-row{display:grid;grid-template-columns:180px 1fr}.zr14-zoom-name{padding:11px 12px;font-weight:900;border-right:1px solid #e1e6e2;border-bottom:1px solid #e9edea;background:#fafbfa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.zr14-zoom-axis{position:relative;height:32px;border-bottom:1px solid #dfe5df}.zr14-zoom-axis span{position:absolute;top:8px;transform:translateX(-50%);font-size:10px;color:#69736c;white-space:nowrap}.zr14-zoom-axis span.first{transform:none}.zr14-zoom-axis span.last{transform:translateX(-100%)}.zr14-zoom-line{position:relative;height:58px;border-bottom:1px solid #e9edea;overflow:hidden}.zr14-zoom-grid{position:absolute;inset:0;background-image:linear-gradient(to right,rgba(47,107,79,.10) 1px,transparent 1px)}.zr14-zoom-seg{position:absolute;top:5px;bottom:5px;border-radius:8px;padding:5px 6px;box-sizing:border-box;overflow:hidden;font-size:10px;z-index:2;display:flex;flex-direction:column;justify-content:center}.zr14-zoom-seg.compact{padding:3px 2px;text-align:center;align-items:center}.zr14-zoom-seg b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.zr14-zoom-seg small{font-size:9px;white-space:nowrap}
@media(max-width:900px){#tab-schedule .zrsc-edit{grid-template-columns:1fr 1fr}}@media(max-width:560px){#tab-schedule .zrsc-edit{grid-template-columns:1fr}#tab-schedule .zrsc-line{height:68px}.zr14-row{grid-template-columns:1fr 74px}.zr14-kind,.zr14-row .zr14-remove{grid-column:auto}.zr14-zoom-ruler,.zr14-zoom-row{grid-template-columns:140px 1fr}}
`;document.head.appendChild(s)}
function ensureModals(){
  if(!$('zr14ContentModal')){const m=document.createElement('div');m.id='zr14ContentModal';m.className='zr14-modal hidden';m.innerHTML=`<div class="zr14-modal-card"><div class="zr14-title"><h2>컨텐츠 추가 / 설정</h2><button class="zr14-close" id="zr14ContentClose">닫기</button></div><div class="help" style="margin-top:6px">기본 4개는 이름·색상을 바꿀 수 있고, 새 컨텐츠는 현재 선택한 단체에만 추가됩니다.</div><div id="zr14FixedRows"></div><div style="border-top:1px solid #e5e9e6;margin-top:14px;padding-top:12px"><b>이 단체의 추가 컨텐츠</b><div id="zr14CustomRows"></div><button class="btn-soft" id="zr14NewContent" style="margin-top:10px">+ 새 컨텐츠 만들기</button></div><div class="zr14-actions"><button class="btn-primary" id="zr14SaveSettings">설정 저장</button></div></div>`;document.body.appendChild(m);$('zr14ContentClose').onclick=closeContentModal;$('zr14NewContent').onclick=()=>{modalCustom.push({id:`custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,5)}`,name:'새 컨텐츠',color:'#e9ddf7'});renderModalRows()};$('zr14SaveSettings').onclick=saveSettings}
  if(!$('zr14ZoomModal')){const z=document.createElement('div');z.id='zr14ZoomModal';z.className='zr14-modal hidden';z.innerHTML=`<div class="zr14-modal-card zr14-zoom-card"><div class="zr14-title"><h2 id="zr14ZoomTitle">스케줄 확대</h2><button class="zr14-close" id="zr14ZoomClose">닫기</button></div><div class="help">단체별 타임라인만 모아 컨텐츠가 같은 시간에 몰리는지 비교합니다.</div><div class="zr14-zoom-scroll"><div class="zr14-zoom-wide" id="zr14ZoomBody"></div></div></div>`;document.body.appendChild(z);$('zr14ZoomClose').onclick=()=>z.classList.add('hidden')}
}
function closeContentModal(){$('zr14ContentModal')?.classList.add('hidden')}
function renderModalRows(){
  const fixed=$('zr14FixedRows'),custom=$('zr14CustomRows');if(!fixed||!custom)return;
  fixed.innerHTML=FIXED.map(type=>{const c=cat(type);return `<div class="zr14-row" data-fixed="${type}"><input type="text" value="${esc(c.name)}"><input type="color" value="${esc(c.color)}"><span class="zr14-kind">기본</span></div>`}).join('');
  custom.innerHTML=modalCustom.length?modalCustom.map((c,i)=>`<div class="zr14-row" data-custom-index="${i}"><input type="text" value="${esc(c.name)}"><input type="color" value="${esc(c.color)}"><button type="button" class="zr14-remove" data-modal-remove="${i}">삭제</button></div>`).join(''):'<div class="help" style="margin-top:9px">추가 컨텐츠가 없습니다.</div>';
  custom.querySelectorAll('[data-modal-remove]').forEach(b=>b.onclick=()=>{readModalRows();modalCustom.splice(Number(b.dataset.modalRemove),1);renderModalRows()})
}
function readModalRows(){
  document.querySelectorAll('#zr14FixedRows [data-fixed]').forEach(r=>{const type=r.dataset.fixed;fixedCatalog[type]={id:type,name:r.querySelector('input[type=text]').value.trim()||DEFAULTS[type].name,color:r.querySelector('input[type=color]').value||DEFAULTS[type].color}});
  const next=[];document.querySelectorAll('#zr14CustomRows [data-custom-index]').forEach(r=>{const old=modalCustom[Number(r.dataset.customIndex)];if(!old)return;next.push({...old,name:r.querySelector('input[type=text]').value.trim()||'추가 컨텐츠',color:r.querySelector('input[type=color]').value||'#e9ddf7'})});modalCustom=next;
}
function openContentModal(id){modalBookingId=String(id);const card=document.querySelector(`#tab-schedule .zrsc-card[data-booking="${CSS.escape(String(id))}"]`),d=remote.get(String(id))||null;modalCustom=card?defsFromCard(card):customDefs(id,d);renderModalRows();$('zr14ContentModal').classList.remove('hidden')}
async function saveSettings(){
  readModalRows();const card=document.querySelector(`#tab-schedule .zrsc-card[data-booking="${CSS.escape(modalBookingId)}"]`);if(card){draftCustom.set(modalBookingId,clone(modalCustom));renderCustomBoxes(card,modalBookingId)}
  if(!F||!ensureBridge()||!isStaff())return toast('컨텐츠 설정은 화면에 적용했습니다. DB 저장은 관리자 DB 로그인 후 가능합니다.');
  const btn=$('zr14SaveSettings'),old=btn.textContent;btn.disabled=true;btn.textContent='저장 중...';
  try{await F.setDoc(F.doc(db,'scheduleGroups',CATALOG_ID),{catalog:FIXED.map(type=>fixedCatalog[type]),updatedAt:F.serverTimestamp()},{merge:true});toast('컨텐츠 설정을 저장했습니다. 추가 컨텐츠 시간은 스케줄 반영 시 저장됩니다.');closeContentModal();render()}
  catch(e){console.error('content settings',e);toast('컨텐츠 설정 DB 저장에 실패했습니다. 관리자 DB 연결을 확인해주세요.')}
  finally{btn.disabled=false;btn.textContent=old}
}
function renderCustomBoxes(card,id){
  const b=bookingById(id),d=remote.get(String(id))||null,edit=card.querySelector('.zrsc-edit');if(!b||!edit)return;
  edit.querySelectorAll('.zr14-custom-box').forEach(x=>x.remove());
  for(const def of customDefs(id,d)){const s=findSeg(d,def.id);edit.insertAdjacentHTML('beforeend',customBox(def,s,b))}
  edit.querySelectorAll('.zr14-custom-box').forEach(box=>{box.querySelectorAll('select').forEach(s=>s.onchange=()=>renderCardPreview(card));box.querySelector('[data-custom-delete]').onclick=()=>{const defs=defsFromCard(card).filter(x=>x.id!==box.dataset.customId);draftCustom.set(String(id),defs);box.remove();renderCardPreview(card)}});
  renderCardPreview(card)
}
function render(){
  if(!$('zrscList'))return;const rs=rows(),a=axisFor(rs);$('zrscRuler').innerHTML=rulerHtml(a);
  if(!rs.length){$('zrscList').innerHTML='<div class="zrsc-empty">이 날짜에 확정된 예약이 없습니다.</div>';return}
  $('zrscList').innerHTML=rs.map(({b,d})=>{const m=managed(b,d),defs=customDefs(b.id,d),custom=defs.map(def=>findSeg(d,def.id)).filter(Boolean),preview=[m.f4,m.f5,m.meal,m.play,...custom].filter(Boolean).sort((x,y)=>String(x.start).localeCompare(String(y.start))).map(s=>segmentHtml({...s,label:s.label||cat(s.type)?.name,color:s.color||cat(s.type)?.color},a)).join(''),phone=b.contact?`<span class="zrsc-tag zrsc-phone">☎ ${esc(b.contact)}</span>`:'',published=b.schedulePublished?'<span class="zrsc-published">고객 노출중</span>':'';return `<div class="zrsc-card" data-booking="${esc(b.id)}"><div class="zrsc-head"><div class="zrsc-org">${esc(b.orgName)}</div><span class="zrsc-tag">${Number(b.paidCount||0)}(${Number(b.chaperoneCount||0)})명</span>${phone}<span class="zrsc-tag">${esc(mealText(b))}</span>${b.playUse!=='no'?'<span class="zrsc-tag">놀이터</span>':''}<span class="zrsc-tag">예약 ${esc(b.entryTime)}~${esc(b.exitTime)}</span></div><div class="zrsc-line"><div class="zrsc-grid" style="background-size:${SLOT/(a.end-a.start)*100}% 100%"></div>${preview}</div><div class="zrsc-edit">${fixedBox('f4',m.f4?.start||'',m.f4?.end||'',b)}${fixedBox('f5',m.f5?.start||'',m.f5?.end||'',b)}${fixedBox('meal',m.meal?.start||'',m.meal?.end||'',b)}${fixedBox('play',m.play?.start||'',m.play?.end||'',b)}${defs.map(def=>customBox(def,findSeg(d,def.id),b)).join('')}</div><div class="zrsc-actions">${published}<button class="zr14-content-btn" data-content="${esc(b.id)}">컨텐츠 추가</button><button class="btn-soft" data-publish="${esc(b.id)}">${b.schedulePublished?'✓ 스케줄 확정됨':'스케줄 확정'}</button><button class="btn-primary" data-apply="${esc(b.id)}">스케줄 반영</button></div></div>`}).join('');
  document.querySelectorAll('#tab-schedule .zrsc-card').forEach(card=>{const id=card.dataset.booking;card.querySelectorAll('select').forEach(s=>s.onchange=()=>renderCardPreview(card));card.querySelectorAll('[data-custom-delete]').forEach(btn=>btn.onclick=()=>{const box=btn.closest('.zr14-custom-box'),defs=defsFromCard(card).filter(x=>x.id!==box.dataset.customId);draftCustom.set(String(id),defs);box.remove();renderCardPreview(card)});renderCardPreview(card)});
  document.querySelectorAll('#tab-schedule [data-content]').forEach(btn=>btn.onclick=()=>openContentModal(btn.dataset.content));document.querySelectorAll('#tab-schedule [data-apply]').forEach(btn=>btn.onclick=()=>applySchedule(btn.dataset.apply,btn,false));document.querySelectorAll('#tab-schedule [data-publish]').forEach(btn=>btn.onclick=()=>togglePublish(btn.dataset.publish,btn));
}
function updateLocalBooking(id,segments,publish){const bs=allBookings(),b=bs.find(x=>String(x.id)===String(id));if(!b)return;if(publish)b.schedulePublished=true;if(b.schedulePublished)b.customerSchedule={reservationId:String(b.id),date:b.date,org:b.orgName||'',entryTime:b.entryTime||'',exitTime:b.exitTime||'',contact:b.contact||'',segments:clone(segments),updatedAt:new Date().toISOString()};try{window.setStore?.('zr_bookings',bs)}catch(e){console.error(e)}}
async function applySchedule(id,btn,publish){
  const b=bookingById(id),card=document.querySelector(`#tab-schedule .zrsc-card[data-booking="${CSS.escape(String(id))}"]`);if(!b||!card)return;const segments=cardSegments(card,id),err=validateSegments(segments,b);if(err)return toast(err);if(!F||!ensureBridge()||!isStaff())return toast('관리자 DB 로그인이 필요합니다. 관리자에서 한 번 다시 로그인해주세요.');
  const defs=defsFromCard(card),old=btn.textContent;btn.disabled=true;btn.textContent=publish?'확정 중...':'반영 중...';
  const patch={reservationId:String(b.id),date:b.date,org:b.orgName||'',res:Number(b.paidCount||0),tea:Number(b.chaperoneCount||0),contact:b.contact||'',ps:b.entryTime||'',pe:b.exitTime||'',meal:mealText(b),cafeDetail:cafeText(b),customDefs:defs,segments,updatedAt:F.serverTimestamp()};
  try{await F.setDoc(F.doc(db,'scheduleGroups',String(b.id)),patch,{merge:true});draftCustom.delete(String(id));updateLocalBooking(id,segments,publish);toast(publish?'스케줄을 확정해 고객에게 공개했습니다.':'현장 스케줄에 반영했습니다.');if(publish)setTimeout(render,100)}catch(e){console.error(e);toast('스케줄 반영에 실패했습니다. DB 연결을 확인해주세요.')}finally{btn.disabled=false;btn.textContent=old}
}
function togglePublish(id,btn){const b=bookingById(id);if(!b)return;if(!b.schedulePublished)return applySchedule(id,btn,true);const bs=allBookings(),x=bs.find(z=>String(z.id)===String(id));x.schedulePublished=false;try{window.setStore?.('zr_bookings',bs);toast('스케줄 확정을 취소했습니다. 고객에게는 노출되지 않습니다.');render()}catch(e){console.error(e);toast('스케줄 확정 취소에 실패했습니다.')}}
function openZoom(){
  const cards=[...document.querySelectorAll('#tab-schedule .zrsc-card[data-booking]')];if(!cards.length)return toast('확대해서 볼 스케줄이 없습니다.');const all=[];let end=900;
  cards.forEach(card=>{const id=card.dataset.booking,b=bookingById(id),segs=cardSegments(card,id).filter(s=>s.start&&s.end);if(b?.exitTime)end=Math.max(end,mn(b.exitTime)||900);segs.forEach(s=>end=Math.max(end,mn(s.end)||900));all.push({b,segs})});const a={start:START,end:Math.min(MAX,Math.max(900,Math.ceil(end/60)*60))},span=a.end-a.start,step=span>360?60:30;
  let ruler='<div class="zr14-zoom-ruler"><div class="zr14-zoom-name">단체명</div><div class="zr14-zoom-axis">';for(let m=a.start;m<=a.end;m+=step){const edge=m===a.start?' first':m===a.end?' last':'';ruler+=`<span class="${edge}" style="left:${(m-a.start)/span*100}%">${tm(m)}</span>`}ruler+='</div></div>';
  const body=all.map(({b,segs})=>`<div class="zr14-zoom-row"><div class="zr14-zoom-name">${esc(b?.orgName||'')}</div><div class="zr14-zoom-line"><div class="zr14-zoom-grid" style="background-size:${SLOT/span*100}% 100%"></div>${segs.map(s=>segmentHtml(s,a,true)).join('')}</div></div>`).join('');$('zr14ZoomTitle').textContent=`${date} 스케줄 확대`;$('zr14ZoomBody').innerHTML=ruler+body;$('zr14ZoomModal').classList.remove('hidden')
}
function installTab(){
  if(installed)return true;const tabs=document.querySelector('#adminView .admin-tabs');if(!tabs)return false;injectStyle();ensureModals();const btn=document.createElement('button');btn.id='zrScheduleTabBtn';btn.className='btn-gray';btn.textContent='스케줄 관리';tabs.appendChild(btn);const sec=document.createElement('section');sec.id='tab-schedule';sec.className='hidden';sec.innerHTML=`<div class="card" style="margin-top:14px"><div class="row"><div><h2 style="margin:0 0 4px">스케줄 관리</h2><div class="help">확정 예약을 기준으로 컨텐츠 시간을 편성합니다. 시간 변경 후 ‘스케줄 반영’을 눌러 적용합니다.</div></div></div><div class="zrsc-toolbar"><button class="btn-soft" id="zrscPrev">‹</button><input type="date" id="zrscDate"><button class="btn-soft" id="zrscNext">›</button><button class="btn-gray" id="zrscToday">오늘</button><button class="btn-soft" id="zrscExcel">엑셀 내려받기</button><button class="zr14-zoom-btn" id="zrscZoom">확대</button><span class="zrsc-status wait" id="zrscStatus">● DB 연결 대기</span></div><div class="zrsc-ruler" id="zrscRuler"></div><div id="zrscList"></div></div>`;document.querySelector('#adminView').appendChild(sec);btn.onclick=openTab;document.querySelectorAll('#adminView .admin-tabs button').forEach(x=>{if(x!==btn)x.addEventListener('click',()=>sec.classList.add('hidden'))});$('zrscDate').value=date;$('zrscDate').onchange=()=>setDate($('zrscDate').value);$('zrscPrev').onclick=()=>setDate(shift(date,-1));$('zrscNext').onclick=()=>setDate(shift(date,1));$('zrscToday').onclick=()=>setDate(today());$('zrscZoom').onclick=openZoom;installed=true;return true
}
function hideOtherTabs(){document.querySelectorAll('#adminView section[id^="tab-"]').forEach(s=>s.classList.add('hidden'));document.querySelectorAll('#adminView .admin-tabs button').forEach(b=>b.className='btn-gray');$('tab-schedule').classList.remove('hidden');$('zrScheduleTabBtn').className='btn-primary'}
function openTab(){hideOtherTabs();$('zrscDate').value=date;render();listenDate();listenCatalog()}
function setDate(d){if(!d)return;date=d;$('zrscDate').value=d;render();listenDate()}
function setStatus(text,state='wait'){const e=$('zrscStatus');if(!e)return;e.textContent='● '+text;e.className='zrsc-status '+state}
function stopDate(){if(unsub){unsub();unsub=null}}
function listenDate(){
  stopDate();clearTimeout(retryTimer);if(!F||!ensureBridge()){setStatus('DB 연결 대기','wait');retryTimer=setTimeout(()=>{if(!$('tab-schedule')?.classList.contains('hidden'))listenDate()},500);return}if(!isStaff()){setStatus('관리자 DB 로그인 필요','err');return}setStatus('불러오는 중...','wait');try{const q=F.query(F.collection(db,'scheduleGroups'),F.where('date','==',date));unsub=F.onSnapshot(q,s=>{remote=new Map(s.docs.map(d=>[d.id,{id:d.id,...d.data()}]));setStatus('실시간 연결됨','ok');render()},e=>{console.error(e);setStatus('DB 연결 확인 필요','err')})}catch(e){console.error(e);setStatus('DB 연결 확인 필요','err')}
}
function listenCatalog(){if(unsubCatalog){unsubCatalog();unsubCatalog=null}if(!F||!ensureBridge()||!isStaff())return;try{unsubCatalog=F.onSnapshot(F.doc(db,'scheduleGroups',CATALOG_ID),s=>{const list=s.exists()&&Array.isArray(s.data()?.catalog)?s.data().catalog:[];const next=clone(DEFAULTS);FIXED.forEach(type=>{const x=list.find(v=>v?.id===type);if(x)next[type]={id:type,name:String(x.name||DEFAULTS[type].name),color:/^#[0-9a-f]{6}$/i.test(x.color||'')?x.color:DEFAULTS[type].color}});fixedCatalog=next;if(!$('tab-schedule')?.classList.contains('hidden'))render()},e=>console.debug('catalog',e))}catch(e){console.debug(e)}}
async function initFirebase(){
  try{const [fs,au]=await Promise.all([import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`),import(`https://www.gstatic.com/firebasejs/${FV}/firebase-auth.js`)]);F=fs;authMod=au;const t=setInterval(()=>{if(!ensureBridge())return;clearInterval(t);authMod.onAuthStateChanged(auth,()=>{if(!$('tab-schedule')?.classList.contains('hidden')){listenDate();listenCatalog()}});if(!$('tab-schedule')?.classList.contains('hidden')){listenDate();listenCatalog()}},200);setTimeout(()=>clearInterval(t),15000)}catch(e){console.error('schedule v14 firebase',e);setStatus('DB 연결 확인 필요','err')}
}
window.zrScheduleAdminV14={get date(){return date},getRows:rows,axisFor,toMin:mn,toTime:tm,slot:SLOT,label:new Proxy({}, {get:(_,k)=>cat(k)?.name||k}),managed,toast,segmentsForRow:({b,d})=>{const card=document.querySelector(`#tab-schedule .zrsc-card[data-booking="${CSS.escape(String(b.id))}"]`);return card?cardSegments(card,b.id):(d?.segments||[])}};
window.zrScheduleAdminV3=window.zrScheduleAdminV14;
function boot(){const timer=setInterval(()=>{if(installTab()){clearInterval(timer);initFirebase()}},250);setTimeout(()=>clearInterval(timer),15000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
