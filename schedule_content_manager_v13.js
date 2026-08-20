(()=>{
'use strict';
if(window.__ZR_SCHEDULE_CONTENT_MANAGER_V13)return;
window.__ZR_SCHEDULE_CONTENT_MANAGER_V13=true;

const FV='12.17.1', STAFF_EMAIL='zoolung09@zoolungzoolung.com', CATALOG_ID='__content_catalog__';
const FIXED=['f4','f5','meal','play'], START=600, MAX=1080, SLOT=15;
const DEFAULTS=[
  {id:'f4',name:'4F 베이직',color:'#f8d7bf',fixed:true},
  {id:'f5',name:'5F 워터가든',color:'#cfe7f7',fixed:true},
  {id:'meal',name:'식사',color:'#fff0a8',fixed:true},
  {id:'play',name:'놀이터',color:'#d8efc9',fixed:true}
];
const SHORT={f4:'4F',f5:'5F',meal:'식',play:'놀'};
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const tm=m=>`${pad(Math.floor(m/60))}:${pad(m%60)}`;
const mn=t=>{if(!t)return null;const [h,m]=String(t).split(':').map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:null};
const toast=s=>{try{window.toast?.(s)}catch{}};

let app=null,auth=null,db=null,F=null,catalog=DEFAULTS.map(x=>({...x})),groups=new Map();
let unsubCatalog=null,unsubGroups=null,currentDate='',enhancePending=false,clickBound=false,dateBound=false;

const catalogMap=()=>new Map(catalog.map(x=>[x.id,x]));
const content=id=>catalog.find(x=>x.id===id)||null;
const customCatalog=()=>catalog.filter(x=>!x.fixed);
const allBookings=()=>{try{return typeof window.bookings==='function'?window.bookings():[]}catch{return[]}};
const bookingById=id=>allBookings().find(x=>String(x.id)===String(id))||null;

function normalizeCatalog(raw){
  const arr=Array.isArray(raw)?raw:[],map=new Map(arr.filter(x=>x?.id).map(x=>[String(x.id),x]));
  const out=DEFAULTS.map(d=>{const x=map.get(d.id)||{};return {...d,name:String(x.name||d.name).trim()||d.name,color:/^#[0-9a-f]{6}$/i.test(x.color||'')?x.color:d.color}});
  for(const x of arr){
    const id=String(x?.id||'');if(!id.startsWith('custom_'))continue;
    out.push({id,name:String(x.name||'새 컨텐츠').trim()||'새 컨텐츠',color:/^#[0-9a-f]{6}$/i.test(x.color||'')?x.color:'#e9ddf7',fixed:false});
  }
  return out;
}
function decorate(s){const c=content(s.type);return c?{...s,label:c.name,color:c.color}:{...s}}
function segmentName(s){return content(s.type)?.name||s.label||s.type||'컨텐츠'}
function segmentColor(s){return content(s.type)?.color||s.color||'#edf0ed'}
function segmentShort(s){return SHORT[s.type]||segmentName(s).slice(0,2)}
function timeOptions(value,maxTime){
  const max=Math.min(MAX,mn(maxTime)??MAX);let h='<option value="">선택</option>',found=!value;
  for(let m=START;m<=max;m+=SLOT){const t=tm(m);if(t===value)found=true;h+=`<option value="${t}" ${t===value?'selected':''}>${t}</option>`}
  if(value&&!found)h+=`<option value="${esc(value)}" selected>${esc(value)}</option>`;
  return h;
}
function getAxis(){
  const A=window.zrScheduleAdminV3||window.zrScheduleAdminV2;
  try{return A?.axisFor(A.getRows())||{start:START,end:900}}catch{return {start:START,end:900}}
}
function pct(t,a){const m=mn(t);return m==null?0:Math.max(0,Math.min(100,(m-a.start)/(a.end-a.start)*100))}
function segHtml(s,a,large=false){
  if(!s?.start||!s?.end)return'';const w=Math.max(1,pct(s.end,a)-pct(s.start,a)),compact=w<(large?6:8),label=compact?segmentShort(s):segmentName(s);
  return `<div class="zrsc-seg ${compact?'compact':''}" style="left:${pct(s.start,a)}%;width:${w}%;background:${esc(segmentColor(s))}" title="${esc(segmentName(s)+' '+s.start+'~'+s.end)}"><b>${esc(label)}</b>${w>=(large?8:13)?`<small>${esc(s.start)}~${esc(s.end)}</small>`:''}</div>`;
}
function existingFor(id,type){return (groups.get(String(id))?.segments||[]).find(s=>s.type===type)||null}
function unknownPreserved(id){
  const known=new Set(catalog.map(x=>x.id));return (groups.get(String(id))?.segments||[]).filter(s=>!known.has(s.type));
}
function interval(type,start,end,id=''){return (start||end)?{id:id||`${type}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,5)}`,type,start,end}:null}

function cardSegments(card,id){
  const out=[];
  for(const type of FIXED){
    const s=card.querySelector(`[data-field="${type}s"]`)?.value||'',e=card.querySelector(`[data-field="${type}e"]`)?.value||'',old=existingFor(id,type);
    const x=interval(type,s,e,old?.id);if(x)out.push(decorate(x));
  }
  card.querySelectorAll('.zr13-custom-box[data-custom-type]').forEach(box=>{
    const type=box.dataset.customType,s=box.querySelector('[data-custom-start]')?.value||'',e=box.querySelector('[data-custom-end]')?.value||'',old=existingFor(id,type);
    const x=interval(type,s,e,old?.id);if(x)out.push(decorate(x));
  });
  unknownPreserved(id).forEach(s=>out.push(s));
  return out.sort((a,b)=>String(a.start||'').localeCompare(String(b.start||'')));
}
function validateSegments(segs,b){
  const arr=segs.filter(s=>s?.start||s?.end).map(s=>({...s,a:mn(s.start),z:mn(s.end)}));
  for(const s of arr){
    const name=segmentName(s);
    if(s.a==null||s.z==null)return `${name} 시작·종료 시간을 모두 선택해주세요.`;
    if(s.z<=s.a)return `${name} 종료시간은 시작시간보다 늦어야 합니다.`;
    if(b?.exitTime&&s.z>mn(b.exitTime))return `${name} 종료시간은 예약 퇴장시간(${b.exitTime}) 이후로 설정할 수 없습니다.`;
  }
  arr.sort((a,b)=>a.a-b.a);
  for(let i=1;i<arr.length;i++)if(arr[i].a<arr[i-1].z)return `${segmentName(arr[i-1])}과(와) ${segmentName(arr[i])} 시간이 겹칩니다.`;
  return'';
}
function renderCardPreview(card){
  const id=card.dataset.booking,b=bookingById(id),line=card.querySelector('.zrsc-line');if(!id||!b||!line)return;
  const a=getAxis(),segs=cardSegments(card,id),key=JSON.stringify([a.start,a.end,segs.map(s=>[s.id,s.type,s.start,s.end,segmentName(s),segmentColor(s)])]);
  if(line.dataset.zr13PreviewKey===key)return;
  line.dataset.zr13PreviewKey=key;
  line.innerHTML=`<div class="zrsc-grid" style="background-size:${SLOT/(a.end-a.start)*100}% 100%"></div>${segs.map(s=>segHtml(s,a)).join('')}`;
}
function customBoxHtml(c,b,id){
  const old=existingFor(id,c.id)||{};
  return `<div class="zrsc-timebox zr13-custom-box" data-custom-type="${esc(c.id)}" style="background:${esc(c.color)};border-color:${esc(c.color)}"><strong>${esc(c.name)}</strong><div class="zrsc-pair"><div><label>시작</label><select data-custom-start>${timeOptions(old.start||'',b.exitTime)}</select></div><div><label>종료</label><select data-custom-end>${timeOptions(old.end||'',b.exitTime)}</select></div></div></div>`;
}
function enhanceCards(){
  const cmap=catalogMap();
  document.querySelectorAll('#tab-schedule .zrsc-card[data-booking]').forEach(card=>{
    const id=card.dataset.booking,b=bookingById(id),edit=card.querySelector('.zrsc-edit');if(!b||!edit)return;
    for(const type of FIXED){
      const box=edit.querySelector(`.zrsc-timebox.${type}`),c=cmap.get(type);if(!box||!c)continue;
      const st=box.querySelector('strong');if(st&&st.textContent!==c.name)st.textContent=c.name;
      if(box.style.background!==c.color)box.style.background=c.color;
    }
    const wanted=new Set(customCatalog().map(x=>x.id));
    edit.querySelectorAll('.zr13-custom-box').forEach(x=>{if(!wanted.has(x.dataset.customType))x.remove()});
    for(const c of customCatalog()){
      let box=edit.querySelector(`.zr13-custom-box[data-custom-type="${CSS.escape(c.id)}"]`);
      if(!box){edit.insertAdjacentHTML('beforeend',customBoxHtml(c,b,id));box=edit.querySelector(`.zr13-custom-box[data-custom-type="${CSS.escape(c.id)}"]`);box?.querySelectorAll('select').forEach(s=>s.addEventListener('change',()=>renderCardPreview(card)))}
      if(box){const st=box.querySelector('strong');if(st&&st.textContent!==c.name)st.textContent=c.name;box.style.background=c.color;box.style.borderColor=c.color}
    }
    const actions=card.querySelector('.zrsc-actions'),pub=actions?.querySelector('[data-publish]');
    if(actions&&pub&&!actions.querySelector('.zr13-content-btn')){
      const btn=document.createElement('button');btn.className='zr13-content-btn';btn.textContent='컨텐츠 추가';btn.type='button';pub.insertAdjacentElement('beforebegin',btn);btn.onclick=e=>{e.preventDefault();e.stopPropagation();openContentModal()};
    }
    card.querySelectorAll('select[data-field]').forEach(s=>{if(s.dataset.zr13Preview)return;s.dataset.zr13Preview='1';s.addEventListener('change',()=>setTimeout(()=>renderCardPreview(card),0))});
    renderCardPreview(card);
  });
}
function scheduleEnhance(){if(enhancePending)return;enhancePending=true;requestAnimationFrame(()=>{enhancePending=false;enhanceCards();ensureToolbarButtons()})}

function injectStyle(){
  if($('zrContentManagerV13Style'))return;const s=document.createElement('style');s.id='zrContentManagerV13Style';s.textContent=`
  #tab-schedule .zr13-content-btn{border:1px solid #d1bdf3;background:#f0e9ff;color:#6841a5;border-radius:10px;padding:9px 12px;font-weight:800;cursor:pointer}
  #tab-schedule .zr13-content-btn:hover{background:#e8dcfb}
  #tab-schedule .zr13-zoom-btn{border:1px solid #bad5e8;background:#eaf5fc;color:#2e6487;border-radius:10px;padding:9px 12px;font-weight:800;cursor:pointer}
  .zr13-modal{position:fixed;inset:0;z-index:10020;background:rgba(0,0,0,.48);display:flex;align-items:center;justify-content:center;padding:16px}.zr13-modal.hidden{display:none!important}
  .zr13-modal-card{width:min(760px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:17px;padding:17px;box-shadow:0 22px 70px rgba(0,0,0,.24)}
  .zr13-title{display:flex;gap:10px;align-items:center}.zr13-title h2{margin:0;flex:1}.zr13-close{border:1px solid #d8ded9;background:#f1f4f1;border-radius:9px;padding:8px 12px;font-weight:800}
  .zr13-catalog-row{display:grid;grid-template-columns:minmax(150px,1fr) 76px 52px;gap:9px;align-items:center;margin-top:9px}.zr13-catalog-row input[type=text]{min-height:40px}.zr13-catalog-row input[type=color]{height:40px;padding:3px}.zr13-kind{font-size:11px;color:#6d756f;text-align:center}
  .zr13-modal-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:16px}.zr13-new{margin-top:12px}
  .zr13-zoom-card{width:min(1180px,100%);max-height:94vh;overflow:hidden}.zr13-zoom-scroll{overflow:auto;max-height:78vh;margin-top:12px;border:1px solid #dfe5df;border-radius:12px;background:#fff}
  .zr13-zoom-wide{min-width:920px}.zr13-zoom-ruler,.zr13-zoom-row{display:grid;grid-template-columns:170px 1fr}.zr13-zoom-name{padding:11px 12px;font-weight:900;border-right:1px solid #e1e6e2;border-bottom:1px solid #e9edea;background:#fafbfa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .zr13-zoom-axis{position:relative;height:32px;border-bottom:1px solid #dfe5df}.zr13-zoom-axis span{position:absolute;top:8px;transform:translateX(-50%);font-size:10px;color:#69736c;white-space:nowrap}.zr13-zoom-axis span:first-of-type{transform:none}.zr13-zoom-axis span:last-of-type{transform:translateX(-100%)}
  .zr13-zoom-line{position:relative;height:58px;border-bottom:1px solid #e9edea;overflow:hidden}.zr13-zoom-grid{position:absolute;inset:0;background-image:linear-gradient(to right,rgba(47,107,79,.10) 1px,transparent 1px)}
  .zr13-zoom-line .zrsc-seg{top:5px;bottom:5px;font-size:10px}.zr13-zoom-line .zrsc-seg small{font-size:9px}
  @media(max-width:650px){.zr13-catalog-row{grid-template-columns:1fr 70px}.zr13-kind{display:none}.zr13-modal-actions button{flex:1}}
  `;document.head.appendChild(s)
}
function ensureContentModal(){
  if($('zr13ContentModal'))return;
  const m=document.createElement('div');m.id='zr13ContentModal';m.className='zr13-modal hidden';m.innerHTML=`<div class="zr13-modal-card"><div class="zr13-title"><h2>컨텐츠 추가 / 설정</h2><button class="zr13-close" id="zr13ContentClose">닫기</button></div><div class="help" style="margin-top:6px">컨텐츠 이름과 색상을 설정합니다. 새 컨텐츠를 저장하면 모든 단체의 기본 4개 아래에 시간 입력칸이 추가됩니다.</div><div id="zr13CatalogRows" style="margin-top:12px"></div><button class="btn-soft zr13-new" id="zr13NewContent">+ 새 컨텐츠 만들기</button><div class="zr13-modal-actions"><button class="btn-gray" id="zr13ContentCloseBottom">닫기</button><button class="btn-primary" id="zr13SaveCatalog">설정 저장</button></div></div>`;
  document.body.appendChild(m);
  const close=()=>m.classList.add('hidden');$('zr13ContentClose').onclick=close;$('zr13ContentCloseBottom').onclick=close;
  m.addEventListener('click',e=>{if(e.target===m){e.preventDefault();e.stopPropagation()}});
  $('zr13NewContent').onclick=()=>{catalog.push({id:'custom_'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),name:'새 컨텐츠',color:'#e9ddf7',fixed:false});renderCatalogRows()};
  $('zr13SaveCatalog').onclick=saveCatalog;
}
function renderCatalogRows(){
  const box=$('zr13CatalogRows');if(!box)return;
  box.innerHTML=catalog.map((c,i)=>`<div class="zr13-catalog-row" data-i="${i}" data-id="${esc(c.id)}"><input type="text" data-name value="${esc(c.name)}" aria-label="컨텐츠 이름"><input type="color" data-color value="${esc(c.color)}" aria-label="컨텐츠 색상"><span class="zr13-kind">${c.fixed?'기본':'추가'}</span></div>`).join('');
}
function readCatalogRows(){
  const out=[];$('zr13CatalogRows')?.querySelectorAll('.zr13-catalog-row').forEach(row=>{const old=catalog[Number(row.dataset.i)]||{},name=row.querySelector('[data-name]')?.value.trim()||'',color=row.querySelector('[data-color]')?.value||old.color||'#e9ddf7';out.push({id:old.id||row.dataset.id,name,color,fixed:FIXED.includes(old.id||row.dataset.id)})});
  return normalizeCatalog(out);
}
function openContentModal(){ensureContentModal();renderCatalogRows();$('zr13ContentModal').classList.remove('hidden')}
async function saveCatalog(){
  const next=readCatalogRows();
  if(next.some(x=>!x.name))return toast('컨텐츠 이름을 입력해주세요.');
  const names=next.map(x=>x.name.trim());if(new Set(names).size!==names.length)return toast('컨텐츠 이름은 서로 다르게 설정해주세요.');
  if(!db||!auth?.currentUser)return toast('공용 DB 연결을 확인해주세요.');
  const btn=$('zr13SaveCatalog'),old=btn.textContent;btn.disabled=true;btn.textContent='저장 중...';
  try{await F.setDoc(F.doc(db,'scheduleGroups',CATALOG_ID),{catalog:next,updatedAt:F.serverTimestamp()},{merge:true})}
  catch(e){console.error('catalog save',e);btn.disabled=false;btn.textContent=old;return toast('컨텐츠 설정 저장에 실패했습니다.')}
  catalog=next;btn.disabled=false;btn.textContent=old;renderCatalogRows();scheduleEnhance();syncPublishedLabels();toast('컨텐츠 설정을 저장했습니다.');
}
function syncPublishedLabels(){
  const bs=allBookings();let changed=false;
  for(const b of bs){if(!b?.schedulePublished||!Array.isArray(b.customerSchedule?.segments))continue;const next=b.customerSchedule.segments.map(decorate);if(JSON.stringify(next)!==JSON.stringify(b.customerSchedule.segments)){b.customerSchedule={...b.customerSchedule,segments:next,updatedAt:new Date().toISOString()};changed=true}}
  if(changed)try{window.setStore?.('zr_bookings',bs)}catch(e){console.debug('published label sync',e)}
}

function mealText(b){return ({lunchbox:'도시락',cafe:'카페주문',none:'식사없음'})[b?.mealType]||'식사없음'}
function cafeText(b){return (b?.cafe?.items||[]).map(x=>`${x.name} × ${x.qty}`).join(' / ')}
async function applyScheduleV13(id,btn,publish){
  const b=bookingById(id),card=document.querySelector(`#tab-schedule .zrsc-card[data-booking="${CSS.escape(String(id))}"]`);if(!b||!card)return;
  const segs=cardSegments(card,id),err=validateSegments(segs,b);if(err)return toast(err);
  if(!db||!auth?.currentUser||String(auth.currentUser.email||'').toLowerCase()!==STAFF_EMAIL.toLowerCase())return toast('공용 DB 로그인 연결을 확인해주세요.');
  const old=btn.textContent;btn.disabled=true;btn.textContent=publish?'확정 중...':'반영 중...';let ok=false;
  const patch={reservationId:String(b.id),date:b.date,org:b.orgName||'',res:Number(b.paidCount||0),tea:Number(b.chaperoneCount||0),contact:b.contact||'',ps:b.entryTime||'',pe:b.exitTime||'',meal:mealText(b),cafeDetail:cafeText(b),segments:segs,updatedAt:F.serverTimestamp()};
  try{
    await F.setDoc(F.doc(db,'scheduleGroups',String(b.id)),patch,{merge:true});
    const bs=allBookings(),lb=bs.find(x=>String(x.id)===String(id));
    if(lb){if(publish)lb.schedulePublished=true;if(lb.schedulePublished)lb.customerSchedule={reservationId:String(lb.id),date:lb.date,org:lb.orgName||'',entryTime:lb.entryTime||'',exitTime:lb.exitTime||'',contact:lb.contact||'',segments:segs.map(x=>({...x})),updatedAt:new Date().toISOString()};window.setStore?.('zr_bookings',bs)}
    ok=true;toast(publish?'스케줄을 확정해 고객에게 공개했습니다.':'현장 스케줄에 반영했습니다.');
    if(publish){btn.textContent='✓ 스케줄 확정됨';let badge=card.querySelector('.zrsc-published');if(!badge){badge=document.createElement('span');badge.className='zrsc-published';badge.textContent='고객 노출중';btn.insertAdjacentElement('beforebegin',badge)}}
  }catch(e){console.error('schedule v13 apply',e);toast('스케줄 반영에 실패했습니다. DB 연결을 확인해주세요.')}
  finally{btn.disabled=false;if(!publish||!ok)btn.textContent=old}
}
function bindApplyCapture(){
  if(clickBound)return;const root=$('adminView');if(!root)return;clickBound=true;
  root.addEventListener('click',e=>{
    const btn=e.target.closest?.('#tab-schedule [data-apply],#tab-schedule [data-publish]');if(!btn)return;
    const publish=btn.hasAttribute('data-publish'),id=btn.dataset.apply||btn.dataset.publish,b=bookingById(id);
    if(publish&&b?.schedulePublished)return;
    e.preventDefault();e.stopImmediatePropagation();applyScheduleV13(id,btn,publish);
  },true);
}

function ensureZoomModal(){
  if($('zr13ZoomModal'))return;
  const m=document.createElement('div');m.id='zr13ZoomModal';m.className='zr13-modal hidden';m.innerHTML=`<div class="zr13-modal-card zr13-zoom-card"><div class="zr13-title"><h2 id="zr13ZoomTitle">스케줄 확대</h2><button class="zr13-close" id="zr13ZoomClose">닫기</button></div><div class="help" style="margin-top:5px">단체별 타임라인만 모아 한눈에 비교합니다.</div><div class="zr13-zoom-scroll"><div class="zr13-zoom-wide" id="zr13ZoomBody"></div></div></div>`;document.body.appendChild(m);$('zr13ZoomClose').onclick=()=>m.classList.add('hidden');
}
function rulerHtml(a){let h='';const step=(a.end-a.start)>360?60:30;for(let m=a.start;m<=a.end;m+=step)h+=`<span style="left:${(m-a.start)/(a.end-a.start)*100}%">${tm(m)}</span>`;return h}
function openZoom(){
  ensureZoomModal();const cards=[...document.querySelectorAll('#tab-schedule .zrsc-card[data-booking]')],a=getAxis(),body=$('zr13ZoomBody'),date=$('zrscDate')?.value||'';
  $('zr13ZoomTitle').textContent=`${date} 스케줄 확대`;
  if(!cards.length){body.innerHTML='<div class="help" style="padding:24px">표시할 확정 예약이 없습니다.</div>';$('zr13ZoomModal').classList.remove('hidden');return}
  let html=`<div class="zr13-zoom-ruler"><div class="zr13-zoom-name">단체명</div><div class="zr13-zoom-axis">${rulerHtml(a)}</div></div>`;
  for(const card of cards){const id=card.dataset.booking,name=card.querySelector('.zrsc-org')?.textContent||'',segs=cardSegments(card,id);html+=`<div class="zr13-zoom-row"><div class="zr13-zoom-name" title="${esc(name)}">${esc(name)}</div><div class="zr13-zoom-line"><div class="zr13-zoom-grid" style="background-size:${SLOT/(a.end-a.start)*100}% 100%"></div>${segs.map(s=>segHtml(s,a,true)).join('')}</div></div>`}
  body.innerHTML=html;$('zr13ZoomModal').classList.remove('hidden');
}
function ensureToolbarButtons(){
  const excel=$('zrscExcel');if(!excel)return;
  let z=$('zr13ZoomBtn');if(!z){z=document.createElement('button');z.id='zr13ZoomBtn';z.className='zr13-zoom-btn';z.textContent='확대';z.type='button';excel.insertAdjacentElement('afterend',z);z.onclick=openZoom}
}

function subscribeDate(){
  const d=$('zrscDate')?.value||'';if(!db||!auth?.currentUser||!d)return;if(d===currentDate&&unsubGroups)return;
  currentDate=d;if(unsubGroups){unsubGroups();unsubGroups=null}groups.clear();
  const q=F.query(F.collection(db,'scheduleGroups'),F.where('date','==',d));
  unsubGroups=F.onSnapshot(q,s=>{groups=new Map(s.docs.map(x=>[x.id,{id:x.id,...x.data()}]));scheduleEnhance()},e=>console.debug('v13 groups',e));
}
function bindDate(){
  if(dateBound)return;dateBound=true;
  const root=$('adminView')||document.body;root.addEventListener('change',e=>{if(e.target?.id==='zrscDate')setTimeout(subscribeDate,50)});
  root.addEventListener('click',e=>{if(['zrscPrev','zrscNext','zrscToday'].includes(e.target?.id))setTimeout(()=>{currentDate='';subscribeDate()},100)});
}
async function initFirebase(){
  try{
    const [am,au,fs]=await Promise.all([import(`https://www.gstatic.com/firebasejs/${FV}/firebase-app.js`),import(`https://www.gstatic.com/firebasejs/${FV}/firebase-auth.js`),import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`)]);
    app=am.getApps()[0];if(!app)return;auth=au.getAuth(app);db=fs.getFirestore(app);F=fs;
    au.onAuthStateChanged(auth,u=>{
      if(!u||String(u.email||'').toLowerCase()!==STAFF_EMAIL.toLowerCase())return;
      if(unsubCatalog)unsubCatalog();unsubCatalog=fs.onSnapshot(fs.doc(db,'scheduleGroups',CATALOG_ID),s=>{catalog=normalizeCatalog(s.exists()?s.data().catalog:DEFAULTS);renderCatalogRows();scheduleEnhance();syncPublishedLabels()},e=>console.debug('v13 catalog',e));
      currentDate='';subscribeDate();
    });
  }catch(e){console.error('schedule content manager init',e)}
}
function boot(){
  injectStyle();ensureContentModal();ensureZoomModal();bindDate();
  const t=setInterval(()=>{if(!$('tab-schedule'))return;bindApplyCapture();ensureToolbarButtons();scheduleEnhance();clearInterval(t);initFirebase()},250);setTimeout(()=>clearInterval(t),15000);
  const root=$('adminView')||document.body;new MutationObserver(()=>scheduleEnhance()).observe(root,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
