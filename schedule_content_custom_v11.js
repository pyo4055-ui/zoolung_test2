(()=>{
'use strict';
if(window.__ZR_SCHEDULE_CONTENT_CUSTOM_V11)return;
window.__ZR_SCHEDULE_CONTENT_CUSTOM_V11=true;
const FV='12.17.1',STAFF_EMAIL='zoolung09@zoolungzoolung.com',CATALOG_ID='__content_catalog__';
const $=id=>document.getElementById(id),pad=n=>String(n).padStart(2,'0');
const mn=t=>{if(!t)return null;const [h,m]=String(t).split(':').map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:null};
const tm=m=>pad(Math.floor(m/60))+':'+pad(m%60);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defaults=()=>[
 {id:'f4',name:'4F 베이직',color:'#f8d7bf',fixed:true},
 {id:'f5',name:'5F 워터가든',color:'#cfe7f7',fixed:true},
 {id:'meal',name:'식사',color:'#fff0a8',fixed:true},
 {id:'play',name:'놀이터',color:'#d8efc9',fixed:true}
];
const SHORT={f4:'4F',f5:'5F',meal:'식',play:'놀'};
let app=null,auth=null,db=null,F=null,catalog=defaults(),unsubCatalog=null,unsubGroups=null,groups=new Map(),editingBookingId='';
const cat=id=>catalog.find(x=>x.id===id)||null;
const toast=s=>{try{window.toast?.(s)}catch{alert(s)}};
function cleanCatalog(raw){
 const base=defaults(),map=new Map((Array.isArray(raw)?raw:[]).filter(x=>x?.id).map(x=>[x.id,x]));
 const out=base.map(x=>{const v=map.get(x.id)||{};return {...x,name:String(v.name||x.name).trim()||x.name,color:/^#[0-9a-f]{6}$/i.test(v.color||'')?v.color:x.color}});
 (Array.isArray(raw)?raw:[]).filter(x=>String(x?.id||'').startsWith('custom_')).forEach(x=>out.push({id:x.id,name:String(x.name||'새 컨텐츠').trim()||'새 컨텐츠',color:/^#[0-9a-f]{6}$/i.test(x.color||'')?x.color:'#e9ddf7',fixed:false}));
 return out;
}
function decorateSegments(arr){return (arr||[]).map(s=>{const c=cat(s.type);return c?{...s,label:c.name,color:c.color}:{...s}})}
function bookingList(){try{return typeof window.bookings==='function'?window.bookings():[]}catch{return[]}}
function syncPublishedBooking(id,segs){
 const bs=bookingList(),b=bs.find(x=>String(x.id)===String(id));if(!b?.schedulePublished||!b.customerSchedule)return;
 b.customerSchedule={...b.customerSchedule,segments:decorateSegments(segs),updatedAt:new Date().toISOString()};
 try{window.setStore?.('zr_bookings',bs)}catch(e){console.debug('customer schedule decorate',e)}
}
function syncAllPublished(){
 const bs=bookingList();let changed=false;
 bs.forEach(b=>{if(!b?.schedulePublished||!b.customerSchedule?.segments)return;const next=decorateSegments(b.customerSchedule.segments);if(JSON.stringify(next)!==JSON.stringify(b.customerSchedule.segments)){b.customerSchedule={...b.customerSchedule,segments:next,updatedAt:new Date().toISOString()};changed=true}});
 if(changed)try{window.setStore?.('zr_bookings',bs)}catch(e){console.debug(e)}
}
function injectStyle(){
 if($('zrContentV11Style'))return;const s=document.createElement('style');s.id='zrContentV11Style';s.textContent=`
 .zr11-content-modal{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:14px}
 .zr11-content-modal.hidden{display:none!important}.zr11-content-card{width:min(760px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:16px;padding:16px;box-shadow:0 18px 60px rgba(0,0,0,.22)}
 .zr11-title{display:flex;align-items:center;gap:8px}.zr11-title h2{margin:0;flex:1}.zr11-close{background:#eef1ee}
 .zr11-section{border-top:1px solid #e6ebe7;margin-top:14px;padding-top:14px}.zr11-section:first-of-type{border-top:0;margin-top:8px;padding-top:0}
 .zr11-cat-row{display:grid;grid-template-columns:minmax(140px,1fr) 74px auto;gap:8px;align-items:center;margin:7px 0}.zr11-cat-row input[type=text]{min-height:38px}.zr11-cat-row input[type=color]{height:38px;padding:3px}
 .zr11-add-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr auto;gap:8px;align-items:end}.zr11-custom-row{display:grid;grid-template-columns:1.4fr 1fr 1fr auto;gap:8px;align-items:end;padding:8px;border:1px solid #e4e9e5;border-radius:10px;margin-top:7px}
 .zr11-custom-name{font-weight:900;padding:10px;border-radius:8px}.zr11-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:10px;flex-wrap:wrap}
 .zr11-content-btn{white-space:nowrap}
 @media(max-width:650px){.zr11-add-grid,.zr11-custom-row{grid-template-columns:1fr 1fr}.zr11-add-grid>div:first-child,.zr11-custom-row>div:first-child{grid-column:1/-1}.zr11-add-grid button,.zr11-custom-row button{width:100%}}
 `;document.head.appendChild(s)
}
function ensureModal(){
 if($('zr11ContentModal'))return;
 const m=document.createElement('div');m.id='zr11ContentModal';m.className='zr11-content-modal hidden';m.innerHTML=`<div class="zr11-content-card"><div class="zr11-title"><h2>컨텐츠 추가 / 설정</h2><button class="btn-gray zr11-close" id="zr11ContentClose">✕</button></div><div class="help">기본 4개는 유지하면서 이름·색상을 바꾸거나 새 컨텐츠를 추가할 수 있습니다.</div><div class="zr11-section"><b>컨텐츠 이름 / 색상</b><div id="zr11CatalogRows"></div><div class="zr11-actions"><button class="btn-soft" id="zr11NewCatalog">+ 새 컨텐츠 만들기</button><button class="btn-primary" id="zr11SaveCatalog">설정 저장</button></div></div><div class="zr11-section"><b>이 단체에 컨텐츠 추가</b><div class="zr11-add-grid" style="margin-top:8px"><div><label>컨텐츠</label><select id="zr11AddType"></select></div><div><label>시작</label><select id="zr11AddStart"></select></div><div><label>종료</label><select id="zr11AddEnd"></select></div><button class="btn-primary" id="zr11AddToGroup">추가</button></div></div><div class="zr11-section"><b>추가된 컨텐츠</b><div class="help">기본 4개 시간은 메인 스케줄 관리 화면에서 수정합니다.</div><div id="zr11ExistingCustom"></div></div></div>`;document.body.appendChild(m);
 $('zr11ContentClose').onclick=()=>m.classList.add('hidden');m.onclick=e=>{if(e.target===m)m.classList.add('hidden')};
 $('zr11NewCatalog').onclick=()=>{catalog.push({id:'custom_'+Date.now().toString(36),name:'새 컨텐츠',color:'#e9ddf7',fixed:false});renderCatalogRows();renderAddOptions()};
 $('zr11SaveCatalog').onclick=saveCatalogFromUi;$('zr11AddToGroup').onclick=addToGroup;
 fillTimes($('zr11AddStart'));fillTimes($('zr11AddEnd'));
}
function fillTimes(el,value=''){let h='<option value="">선택</option>';for(let m=600;m<=1080;m+=15){const t=tm(m);h+=`<option value="${t}" ${t===value?'selected':''}>${t}</option>`}el.innerHTML=h}
function renderCatalogRows(){
 const box=$('zr11CatalogRows');if(!box)return;box.innerHTML=catalog.map((c,i)=>`<div class="zr11-cat-row" data-i="${i}"><input type="text" data-name value="${esc(c.name)}"><input type="color" data-color value="${esc(c.color)}">${c.fixed?'<span class="help">기본</span>':`<button class="btn-gray" data-del-cat="${esc(c.id)}">삭제</button>`}</div>`).join('');
 box.querySelectorAll('[data-del-cat]').forEach(b=>b.onclick=()=>{catalog=catalog.filter(x=>x.id!==b.dataset.delCat);renderCatalogRows();renderAddOptions()})
}
function readCatalogUi(){
 document.querySelectorAll('#zr11CatalogRows .zr11-cat-row').forEach(row=>{const c=catalog[Number(row.dataset.i)];if(!c)return;c.name=row.querySelector('[data-name]').value.trim()||c.name;c.color=row.querySelector('[data-color]').value||c.color});
 catalog=cleanCatalog(catalog);
}
async function saveCatalogFromUi(){
 readCatalogUi();if(!db||!auth?.currentUser)return toast('공용 DB 연결을 확인해주세요.');
 try{await F.setDoc(F.doc(db,'scheduleGroups',CATALOG_ID),{catalog,updatedAt:F.serverTimestamp()},{merge:true});syncAllPublished();toast('컨텐츠 설정을 저장했습니다.');renderCatalogRows();renderAddOptions();enhanceAdmin()}
 catch(e){console.error(e);toast('컨텐츠 설정 저장에 실패했습니다.')}
}
function renderAddOptions(){const el=$('zr11AddType');if(el)el.innerHTML=catalog.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}
function currentBooking(){return bookingList().find(b=>String(b.id)===String(editingBookingId))||null}
function allValid(segs,exitTime){
 const arr=(segs||[]).filter(s=>s?.start||s?.end).map(s=>({...s,a:mn(s.start),b:mn(s.end)}));
 for(const s of arr){if(s.a==null||s.b==null)return '모든 컨텐츠의 시작·종료 시간을 선택해주세요.';if(s.b<=s.a)return '종료시간은 시작시간보다 늦어야 합니다.';if(exitTime&&s.b>mn(exitTime))return `컨텐츠 종료시간은 예약 퇴장시간(${exitTime}) 이후로 설정할 수 없습니다.`}
 arr.sort((x,y)=>x.a-y.a);for(let i=1;i<arr.length;i++)if(arr[i].a<arr[i-1].b)return '컨텐츠 시간이 서로 겹칩니다.';return ''
}
async function groupDoc(id){if(!db)return null;const s=await F.getDoc(F.doc(db,'scheduleGroups',String(id)));return s.exists()?{id:s.id,...s.data()}:null}
async function addToGroup(){
 readCatalogUi();const type=$('zr11AddType').value,start=$('zr11AddStart').value,end=$('zr11AddEnd').value,c=cat(type),b=currentBooking();if(!c||!b)return;
 if(['f4','f5','meal','play'].includes(type))return toast('기본 4개 컨텐츠는 메인 화면에서 시간을 수정해주세요.');
 try{
  const g=await groupDoc(b.id);if(!g)return toast('현장 스케줄을 먼저 반영해주세요.');
  const segs=[...(g.segments||[])];if(segs.some(s=>s.type===type))return toast('이 컨텐츠는 이미 추가되어 있습니다.');
  segs.push({id:'cs_'+Date.now().toString(36),type,start,end,label:c.name,color:c.color});const err=allValid(segs,b.exitTime);if(err)return toast(err);
  await F.setDoc(F.doc(db,'scheduleGroups',String(b.id)),{segments:decorateSegments(segs),updatedAt:F.serverTimestamp()},{merge:true});syncPublishedBooking(b.id,segs);toast('컨텐츠를 추가했습니다.');renderExistingCustom();
 }catch(e){console.error(e);toast('컨텐츠 추가에 실패했습니다.')}
}
async function renderExistingCustom(){
 const box=$('zr11ExistingCustom');if(!box||!editingBookingId)return;box.innerHTML='<div class="help" style="margin-top:8px">불러오는 중...</div>';
 try{
  const g=await groupDoc(editingBookingId),b=currentBooking();const list=(g?.segments||[]).filter(s=>!['f4','f5','meal','play'].includes(s.type));
  if(!list.length){box.innerHTML='<div class="help" style="margin-top:8px">추가된 컨텐츠가 없습니다.</div>';return}
  box.innerHTML=list.map(s=>{const c=cat(s.type),name=c?.name||s.label||s.type,color=c?.color||s.color||'#edf0ed';return `<div class="zr11-custom-row" data-segid="${esc(s.id)}"><div class="zr11-custom-name" style="background:${esc(color)}">${esc(name)}</div><div><label>시작</label><select data-start></select></div><div><label>종료</label><select data-end></select></div><button class="btn-gray" data-remove>삭제</button></div>`}).join('');
  box.querySelectorAll('.zr11-custom-row').forEach(row=>{const s=list.find(x=>String(x.id)===String(row.dataset.segid));fillTimes(row.querySelector('[data-start]'),s.start);fillTimes(row.querySelector('[data-end]'),s.end);row.querySelector('[data-start]').onchange=row.querySelector('[data-end]').onchange=()=>saveCustomRow(row,g,b);row.querySelector('[data-remove]').onclick=()=>removeCustomRow(row,g,b)});
 }catch(e){console.error(e);box.innerHTML='<div class="help">불러오지 못했습니다.</div>'}
}
async function saveCustomRow(row,g,b){
 const id=row.dataset.segid,segs=(g.segments||[]).map(s=>String(s.id)===String(id)?{...s,start:row.querySelector('[data-start]').value,end:row.querySelector('[data-end]').value}:s),err=allValid(segs,b?.exitTime);if(err){toast(err);return renderExistingCustom()}
 try{await F.setDoc(F.doc(db,'scheduleGroups',String(g.id)),{segments:decorateSegments(segs),updatedAt:F.serverTimestamp()},{merge:true});syncPublishedBooking(g.id,segs);toast('추가 컨텐츠 시간을 반영했습니다.')}
 catch(e){console.error(e);toast('시간 반영에 실패했습니다.');renderExistingCustom()}
}
async function removeCustomRow(row,g,b){
 if(!confirm('이 단체에서 해당 컨텐츠를 삭제할까요?'))return;const segs=(g.segments||[]).filter(s=>String(s.id)!==String(row.dataset.segid));
 try{await F.setDoc(F.doc(db,'scheduleGroups',String(g.id)),{segments:decorateSegments(segs),updatedAt:F.serverTimestamp()},{merge:true});syncPublishedBooking(g.id,segs);toast('컨텐츠를 삭제했습니다.');renderExistingCustom()}
 catch(e){console.error(e);toast('컨텐츠 삭제에 실패했습니다.')}
}
async function openModal(id){editingBookingId=String(id);readCatalogUi();renderCatalogRows();renderAddOptions();$('zr11ContentModal').classList.remove('hidden');await renderExistingCustom()}
function installButtons(){
 document.querySelectorAll('#tab-schedule .zrsc-card[data-booking]').forEach(card=>{if(card.querySelector('[data-content-add]'))return;const pub=card.querySelector('[data-publish]');if(!pub)return;const b=document.createElement('button');b.className='btn-soft zr11-content-btn';b.textContent='컨텐츠 추가';b.dataset.contentAdd=card.dataset.booking;pub.insertAdjacentElement('beforebegin',b);b.onclick=()=>openModal(b.dataset.contentAdd)})
}
function typeFromTitle(title){if(title.startsWith('4F 베이직 '))return'f4';if(title.startsWith('5F 워터가든 '))return'f5';if(title.startsWith('식사 '))return'meal';if(title.startsWith('놀이터 '))return'play';const m=title.match(/^(custom_[^ ]+)\s/);return m?m[1]:''}
function displayName(type,name,compact){return compact?(SHORT[type]||String(name||'').slice(0,2)):name}
function enhanceAdmin(){
 document.querySelectorAll('#tab-schedule .zrsc-timebox').forEach(box=>{const type=['f4','f5','meal','play'].find(x=>box.classList.contains(x)),c=cat(type);if(c){const st=box.querySelector('strong');if(st&&st.textContent!==c.name)st.textContent=c.name;if(box.style.background!==c.color)box.style.background=c.color}});
 document.querySelectorAll('#tab-schedule .zrsc-seg').forEach(el=>{const type=typeFromTitle(el.title||''),c=cat(type);if(!c)return;const b=el.querySelector('b'),want=displayName(type,c.name,el.classList.contains('compact'));if(b&&b.textContent!==want)b.textContent=want;if(el.style.background!==c.color)el.style.background=c.color});
 installButtons();
}
function subscribeDate(){
 if(unsubGroups){unsubGroups();unsubGroups=null}groups.clear();const d=$('zrscDate')?.value||'';if(!db||!auth?.currentUser||!d)return;
 const q=F.query(F.collection(db,'scheduleGroups'),F.where('date','==',d));unsubGroups=F.onSnapshot(q,s=>{groups=new Map(s.docs.map(x=>[x.id,{id:x.id,...x.data()}]));enhanceAdmin()},e=>console.debug('content groups',e))
}
function installValidation(){
 const root=$('adminView');if(!root||root.dataset.zr11ContentValidate)return;root.dataset.zr11ContentValidate='1';root.addEventListener('click',e=>{const btn=e.target.closest?.('#tab-schedule [data-apply],#tab-schedule [data-publish]');if(!btn)return;const id=btn.dataset.apply||btn.dataset.publish,card=btn.closest('.zrsc-card'),g=groups.get(String(id)),b=bookingList().find(x=>String(x.id)===String(id));if(!card||!b)return;const fixed=['f4','f5','meal','play'].map(t=>({type:t,start:card.querySelector(`[data-field="${t}s"]`)?.value||'',end:card.querySelector(`[data-field="${t}e"]`)?.value||''})).filter(s=>s.start||s.end);const custom=(g?.segments||[]).filter(s=>!['f4','f5','meal','play'].includes(s.type));const err=allValid([...fixed,...custom],b.exitTime);if(err){e.preventDefault();e.stopImmediatePropagation();toast(err)}},true)
}
function hookDate(){['zrscDate','zrscPrev','zrscNext','zrscToday'].forEach(id=>$(id)?.addEventListener(id==='zrscDate'?'change':'click',()=>setTimeout(subscribeDate,80)))}
async function init(){
 injectStyle();ensureModal();
 try{const [am,au,fs]=await Promise.all([import(`https://www.gstatic.com/firebasejs/${FV}/firebase-app.js`),import(`https://www.gstatic.com/firebasejs/${FV}/firebase-auth.js`),import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`)]);app=am.getApps()[0];if(!app)return;auth=au.getAuth(app);db=fs.getFirestore(app);F=fs;au.onAuthStateChanged(auth,u=>{if(!u||String(u.email||'').toLowerCase()!==STAFF_EMAIL.toLowerCase())return;if(unsubCatalog)unsubCatalog();unsubCatalog=fs.onSnapshot(fs.doc(db,'scheduleGroups',CATALOG_ID),s=>{catalog=cleanCatalog(s.exists()?s.data().catalog:defaults());renderCatalogRows();renderAddOptions();enhanceAdmin();syncAllPublished()},e=>console.debug('catalog',e));subscribeDate()});
 }catch(e){console.error('content custom init',e)}
 const t=setInterval(()=>{enhanceAdmin();installValidation();hookDate();if($('tab-schedule'))clearInterval(t)},250);setTimeout(()=>clearInterval(t),15000);
 const root=$('adminView')||document.body;new MutationObserver(()=>requestAnimationFrame(enhanceAdmin)).observe(root,{childList:true,subtree:true})
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();