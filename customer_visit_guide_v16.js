(()=>{
'use strict';
if(window.__ZR_CUSTOMER_VISIT_GUIDE_V16)return;
window.__ZR_CUSTOMER_VISIT_GUIDE_V16=true;

const FV='12.17.1';
const DOC_ID='__customer_guide__';
const COLLECTION='reservationAvailability';
const STAFF_EMAIL='zoolung09@zoolungzoolung.com';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr=esc;
const uid=prefix=>`${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
const safeUrl=u=>/^https?:\/\//i.test(String(u||'').trim())?String(u).trim():'';
const toast=s=>{try{window.toast?.(s)}catch{}}

const DEFAULT_GUIDE={
  contents:[
    {id:'guide_f4',name:'4F 베이직',duration:'',imageUrl:'',description:'4F 동물 관람 컨텐츠입니다.',enabled:true},
    {id:'guide_f5',name:'5F 워터가든',duration:'',imageUrl:'',description:'5F 워터가든 관람 컨텐츠입니다.',enabled:true},
    {id:'guide_play',name:'놀이터',duration:'',imageUrl:'',description:'예약된 이용시간에 맞춰 놀이터를 이용합니다.',enabled:true}
  ],
  notices:[
    {id:'notice_1',text:'동물 관람은 10:30부터 가능합니다.'},
    {id:'notice_2',text:'예약한 입장시간에 맞춰 방문해주세요.'}
  ]
};

let F=null,authMod=null,unsub=null;
let guide=JSON.parse(JSON.stringify(DEFAULT_GUIDE));
let adminDraft=null,entryControl=null,ackEntry='',ackSig='',guideSig='';
let installed=false,adminInstalled=false;

function normalize(raw){
  const src=raw&&typeof raw==='object'?raw:{};
  const contents=(Array.isArray(src.contents)?src.contents:DEFAULT_GUIDE.contents).slice(0,10).map((x,i)=>({
    id:String(x?.id||uid('guide')),
    name:String(x?.name||`컨텐츠 ${i+1}`).trim()||`컨텐츠 ${i+1}`,
    duration:x?.duration==null?'':String(x.duration).replace(/[^0-9]/g,'').slice(0,3),
    imageUrl:safeUrl(x?.imageUrl),
    description:String(x?.description||''),
    enabled:x?.enabled!==false
  }));
  const notices=(Array.isArray(src.notices)?src.notices:DEFAULT_GUIDE.notices).slice(0,20).map(x=>({
    id:String(x?.id||uid('notice')),
    text:String(x?.text||'').trim()
  })).filter(x=>x.text);
  return {contents,notices};
}
function signature(g){return JSON.stringify([g.contents.map(x=>[x.id,x.name,x.duration,x.imageUrl,x.description,x.enabled]),g.notices.map(x=>[x.id,x.text])])}
function setGuide(raw){guide=normalize(raw);guideSig=signature(guide);if(adminInstalled&&!$('zrGuideAdminSection')?.classList.contains('hidden')){adminDraft=JSON.parse(JSON.stringify(guide));renderAdminEditor()}}
function bridge(){return window.zrReservationFirebase||null}
function isStaff(){const z=bridge();return !!z?.isStaff?.()&&String(z.auth?.currentUser?.email||'').toLowerCase()===STAFF_EMAIL}
function customerVisible(){const v=$('customerView');return !!v&&!v.classList.contains('hidden')&&getComputedStyle(v).display!=='none'}
function visible(el){return !!el&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden'&&el.getClientRects().length>0}

function injectStyle(){
  if($('zrGuideStyleV16'))return;
  const s=document.createElement('style');s.id='zrGuideStyleV16';s.textContent=`
  .zr-guide-modal{position:fixed;inset:0;z-index:10050;background:rgba(16,25,20,.55);display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box}.zr-guide-modal.hidden{display:none!important}
  .zr-guide-sheet{width:min(760px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 24px 80px rgba(0,0,0,.26);padding:18px;box-sizing:border-box;-webkit-overflow-scrolling:touch}
  .zr-guide-head h2{margin:0;font-size:21px}.zr-guide-head p{margin:6px 0 0;color:#69736c;font-size:13px;line-height:1.55}.zr-guide-entry{display:inline-flex;margin-top:10px;padding:7px 10px;border-radius:999px;background:#e9f3ed;color:#2f6b4f;font-weight:800;font-size:12px}
  .zr-guide-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:15px}.zr-guide-card{border:1px solid #dde4df;border-radius:14px;overflow:hidden;background:#fff}.zr-guide-img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;background:#f0f3f1}.zr-guide-card-body{padding:12px}.zr-guide-card h3{margin:0;font-size:16px}.zr-guide-duration{display:inline-block;margin-top:6px;padding:4px 7px;border-radius:7px;background:#f0f5f2;color:#436453;font-size:11px;font-weight:800}.zr-guide-desc{margin:8px 0 0;font-size:13px;line-height:1.6;color:#4f5b53;white-space:pre-line}
  .zr-guide-notices{margin-top:15px;padding:13px 14px;border-radius:13px;background:#fff8e9;border:1px solid #efdfb4}.zr-guide-notices h3{margin:0 0 8px;font-size:15px}.zr-guide-notices ul{margin:0;padding-left:20px}.zr-guide-notices li{margin:5px 0;font-size:13px;line-height:1.55}
  .zr-guide-actions{display:grid;grid-template-columns:1fr 1.7fr;gap:9px;position:sticky;bottom:-18px;background:#fff;padding:14px 0 2px;margin-top:14px}.zr-guide-actions button{min-height:48px;border-radius:11px;border:0;font-weight:900;font-size:14px;cursor:pointer}.zr-guide-back{background:#eef1ee;color:#526057}.zr-guide-confirm{background:#2f6b4f;color:#fff}
  #zrGuideAdminSection .zrga-toolbar{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px}.zrga-list{display:grid;gap:10px}.zrga-row{border:1px solid #dde4df;border-radius:14px;padding:12px;background:#fff}.zrga-head{display:flex;gap:8px;align-items:center;margin-bottom:9px}.zrga-head strong{flex:1}.zrga-mini{border:1px solid #d7ded9;background:#f5f7f5;border-radius:8px;padding:6px 8px;font-size:11px;font-weight:800;cursor:pointer}.zrga-del{color:#9b4545;background:#fff0f0;border-color:#ebcccc}.zrga-grid{display:grid;grid-template-columns:1.2fr .55fr;gap:8px}.zrga-grid .full{grid-column:1/-1}.zrga-grid label{display:block;font-size:11px;font-weight:800;color:#68736b;margin-bottom:4px}.zrga-grid input,.zrga-grid textarea{width:100%;box-sizing:border-box}.zrga-grid textarea{min-height:82px;resize:vertical}.zrga-preview{margin-top:8px;max-width:240px;border-radius:10px;overflow:hidden;border:1px solid #e0e5e1}.zrga-preview img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover}.zrga-notice-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;margin-top:7px}.zrga-notice-row input{width:100%}.zrga-savebar{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}.zrga-savebar button{min-height:42px}.zrga-help{font-size:12px;color:#6d756f;line-height:1.55;margin:4px 0 12px}
  @media(max-width:620px){.zr-guide-cards{grid-template-columns:1fr}.zr-guide-sheet{padding:15px}.zr-guide-actions{grid-template-columns:1fr}.zrga-grid{grid-template-columns:1fr}.zrga-grid .full{grid-column:auto}}
  `;document.head.appendChild(s)
}

function ensureCustomerModal(){
  if($('zrGuideModal'))return;
  const m=document.createElement('div');m.id='zrGuideModal';m.className='zr-guide-modal hidden';m.innerHTML=`
    <div class="zr-guide-sheet" role="dialog" aria-modal="true" aria-labelledby="zrGuideTitle">
      <div class="zr-guide-head"><h2 id="zrGuideTitle">방문 전 꼭 확인해주세요</h2><p>선택한 입장시간 기준으로 방문 컨텐츠와 주의사항을 확인해주세요.</p><div class="zr-guide-entry" id="zrGuideEntry">입장시간 --:--</div></div>
      <div class="zr-guide-cards" id="zrGuideCards"></div><div id="zrGuideNotices"></div>
      <div class="zr-guide-actions"><button type="button" class="zr-guide-back" id="zrGuideBack">입장시간 다시 선택</button><button type="button" class="zr-guide-confirm" id="zrGuideConfirm">안내사항을 확인했습니다</button></div>
    </div>`;
  document.body.appendChild(m);
  $('zrGuideBack').onclick=()=>{m.classList.add('hidden');ackEntry='';ackSig='';setTimeout(()=>entryControl?.focus?.(),30)};
  $('zrGuideConfirm').onclick=()=>{const v=String(entryControl?.value||'').trim();if(!v)return;m.classList.add('hidden');ackEntry=v;ackSig=guideSig;toast('방문 안내사항을 확인했습니다.')};
}
function renderCustomerModal(control){
  entryControl=control||entryControl;const value=String(entryControl?.value||'').trim();if(!value)return;
  $('zrGuideEntry').textContent=`선택한 입장시간 ${value}`;
  const active=guide.contents.filter(x=>x.enabled);
  $('zrGuideCards').innerHTML=active.map(x=>{const u=safeUrl(x.imageUrl),dur=Number(x.duration||0);return `<article class="zr-guide-card">${u?`<img class="zr-guide-img" src="${attr(u)}" alt="${attr(x.name)}" onerror="this.style.display='none'">`:''}<div class="zr-guide-card-body"><h3>${esc(x.name)}</h3>${dur>0?`<span class="zr-guide-duration">평균 소요시간 약 ${dur}분</span>`:''}${x.description?`<p class="zr-guide-desc">${esc(x.description)}</p>`:''}</div></article>`}).join('');
  $('zrGuideNotices').innerHTML=guide.notices.length?`<section class="zr-guide-notices"><h3>방문 전 주의사항</h3><ul>${guide.notices.map(x=>`<li>${esc(x.text)}</li>`).join('')}</ul></section>`:'';
}
function openCustomerGuide(control){ensureCustomerModal();renderCustomerModal(control);$('zrGuideModal').classList.remove('hidden');(()=>{const sh=$('zrGuideModal').querySelector('.zr-guide-sheet');if(sh)sh.scrollTop=0})()}

function labelText(el){
  let out='';
  if(el.id){try{document.querySelectorAll(`label[for="${CSS.escape(el.id)}"]`).forEach(l=>out+=' '+l.textContent)}catch{}}
  const own=el.closest('label');if(own)out+=' '+own.textContent;
  let p=el.parentElement,depth=0;while(p&&depth<3){const t=(p.textContent||'').replace(/\s+/g,' ').trim();if(t.length<100)out+=' '+t;p=p.parentElement;depth++}
  return out;
}
function looksTimeControl(el){if(!el?.matches?.('select,input'))return false;if(el.matches('input[type="time"]'))return true;if(el.tagName==='SELECT'){const vals=[...el.options].slice(0,8).map(o=>o.value||o.textContent);return vals.some(v=>/^\d{1,2}:\d{2}$/.test(String(v).trim()))}return /^\d{1,2}:\d{2}$/.test(String(el.value||''))}
function isEntryControl(el){
  if(!looksTimeControl(el)||el.closest('#adminView'))return false;
  const key=`${el.id||''} ${el.name||''} ${el.getAttribute('aria-label')||''} ${el.placeholder||''}`.toLowerCase();
  if(/(^|[^a-z])(entry|admission)(time)?([^a-z]|$)|entrytime|admissiontime/.test(key))return true;
  const txt=labelText(el).replace(/\s/g,'');
  if(txt.includes('입장시간'))return true;
  return txt.includes('입장')&&!txt.includes('퇴장')&&txt.length<80;
}
function findVisibleEntry(){return [...document.querySelectorAll('select,input')].find(el=>isEntryControl(el)&&visible(el))||null}
function acknowledgementOk(control){const v=String(control?.value||'').trim();return !!v&&ackEntry===v&&ackSig===guideSig}

function interceptBooking(ev){
  if(!customerVisible())return;
  const btn=ev.target?.closest?.('button,input[type="submit"],a');if(!btn||btn.closest('#zrGuideModal'))return;
  const txt=(btn.textContent||btn.value||'').replace(/\s+/g,'');
  if(!/(예약.*(신청|완료|하기)|신청하기|예약하기)/.test(txt)||/예약확인|추가예약/.test(txt))return;
  const control=findVisibleEntry();if(!control||!String(control.value||'').trim())return;
  if(acknowledgementOk(control))return;
  ev.preventDefault();ev.stopImmediatePropagation();openCustomerGuide(control);toast('방문 안내사항 확인이 필요합니다.');
}
function interceptSubmit(ev){if(!customerVisible())return;const q=ev.target?.querySelectorAll?.('select,input')||[];const control=[...q].find(isEntryControl)||findVisibleEntry();if(control&&String(control.value||'').trim()&&!acknowledgementOk(control)){ev.preventDefault();ev.stopImmediatePropagation();openCustomerGuide(control)}}

function bindCustomer(){
  document.addEventListener('change',e=>{const el=e.target;if(!customerVisible()||!isEntryControl(el))return;entryControl=el;ackEntry='';ackSig='';if(String(el.value||'').trim())setTimeout(()=>openCustomerGuide(el),20)},true);
  document.addEventListener('click',interceptBooking,true);
  document.addEventListener('submit',interceptSubmit,true);
}

function ensureAdminSection(){
  if(adminInstalled)return true;
  const tabs=document.querySelector('#adminView .admin-tabs');if(!tabs)return false;
  const btn=document.createElement('button');btn.id='zrGuideAdminTab';btn.className='btn-gray';btn.textContent='고객 안내 관리';tabs.appendChild(btn);
  const sec=document.createElement('section');sec.id='zrGuideAdminSection';sec.className='hidden';sec.innerHTML=`<div class="card" style="margin-top:14px"><div class="zrga-toolbar"><div><h2 style="margin:0">고객 안내 관리</h2><div class="zrga-help">고객이 입장시간을 선택하면 표시되는 컨텐츠·사진·평균 소요시간·주의사항을 관리합니다.</div></div><button type="button" class="btn-soft" id="zrGuideAddContent">+ 컨텐츠 추가</button></div><div id="zrGuideAdminContents" class="zrga-list"></div><div style="margin-top:18px"><div class="zrga-toolbar"><h3 style="margin:0">방문 전 주의사항</h3><button type="button" class="btn-soft" id="zrGuideAddNotice">+ 주의사항 추가</button></div><div id="zrGuideAdminNotices"></div></div><div class="zrga-savebar"><button type="button" class="btn-primary" id="zrGuideAdminSave">안내 설정 저장</button></div></div>`;
  document.querySelector('#adminView').appendChild(sec);
  btn.onclick=()=>openAdminTab();
  document.addEventListener('click',e=>{const b=e.target.closest?.('#adminView .admin-tabs button');if(b&&b!==btn)sec.classList.add('hidden')});
  $('zrGuideAddContent').onclick=()=>{if(!adminDraft)adminDraft=normalize(guide);if(adminDraft.contents.length>=10)return toast('컨텐츠는 최대 10개까지 등록할 수 있습니다.');adminDraft.contents.push({id:uid('guide'),name:'새 컨텐츠',duration:'',imageUrl:'',description:'',enabled:true});renderAdminEditor()};
  $('zrGuideAddNotice').onclick=()=>{if(!adminDraft)adminDraft=normalize(guide);if(adminDraft.notices.length>=20)return toast('주의사항은 최대 20개까지 등록할 수 있습니다.');adminDraft.notices.push({id:uid('notice'),text:''});renderAdminEditor()};
  $('zrGuideAdminSave').onclick=saveAdminGuide;
  adminInstalled=true;return true;
}
function openAdminTab(){
  document.querySelectorAll('#adminView section[id^="tab-"]').forEach(s=>s.classList.add('hidden'));
  document.querySelectorAll('#adminView .admin-tabs button').forEach(b=>b.className='btn-gray');
  $('zrGuideAdminSection').classList.remove('hidden');$('zrGuideAdminTab').className='btn-primary';
  adminDraft=JSON.parse(JSON.stringify(guide));renderAdminEditor();
}
function collectAdminDraft(){
  if(!adminDraft)return;
  document.querySelectorAll('#zrGuideAdminContents .zrga-row[data-i]').forEach(row=>{const i=Number(row.dataset.i),x=adminDraft.contents[i];if(!x)return;x.name=row.querySelector('[data-k="name"]').value.trim();x.duration=row.querySelector('[data-k="duration"]').value.replace(/[^0-9]/g,'').slice(0,3);x.imageUrl=safeUrl(row.querySelector('[data-k="imageUrl"]').value);x.description=row.querySelector('[data-k="description"]').value;x.enabled=row.querySelector('[data-k="enabled"]').checked});
  document.querySelectorAll('#zrGuideAdminNotices .zrga-notice-row[data-i]').forEach(row=>{const i=Number(row.dataset.i),x=adminDraft.notices[i];if(x)x.text=row.querySelector('input').value});
}
function move(arr,i,dir){const j=i+dir;if(j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]]}
function renderAdminEditor(){
  if(!adminDraft)return;const root=$('zrGuideAdminContents');
  root.innerHTML=adminDraft.contents.map((x,i)=>{const u=safeUrl(x.imageUrl);return `<div class="zrga-row" data-i="${i}"><div class="zrga-head"><strong>컨텐츠 ${i+1}</strong><button class="zrga-mini" data-up="${i}">↑</button><button class="zrga-mini" data-down="${i}">↓</button><button class="zrga-mini zrga-del" data-del="${i}">삭제</button></div><div class="zrga-grid"><div><label>컨텐츠명</label><input data-k="name" value="${attr(x.name)}"></div><div><label>평균 소요시간(분)</label><input data-k="duration" inputmode="numeric" type="number" min="0" max="999" value="${attr(x.duration)}" placeholder="예: 45"></div><div class="full"><label>사진 URL</label><input data-k="imageUrl" value="${attr(x.imageUrl)}" placeholder="https://..."></div>${u?`<div class="full zrga-preview"><img src="${attr(u)}" alt="미리보기" onerror="this.parentElement.style.display='none'"></div>`:''}<div class="full"><label>간단 설명</label><textarea data-k="description" placeholder="고객에게 보여줄 간단한 설명">${esc(x.description)}</textarea></div><div class="full"><label style="display:flex;gap:7px;align-items:center"><input data-k="enabled" type="checkbox" ${x.enabled?'checked':''} style="width:auto"> 고객에게 노출</label></div></div></div>`}).join('');
  root.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{collectAdminDraft();move(adminDraft.contents,Number(b.dataset.up),-1);renderAdminEditor()});
  root.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>{collectAdminDraft();move(adminDraft.contents,Number(b.dataset.down),1);renderAdminEditor()});
  root.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{collectAdminDraft();adminDraft.contents.splice(Number(b.dataset.del),1);renderAdminEditor()});
  const notices=$('zrGuideAdminNotices');notices.innerHTML=adminDraft.notices.map((x,i)=>`<div class="zrga-notice-row" data-i="${i}"><input value="${attr(x.text)}" placeholder="주의사항을 입력해주세요."><button class="zrga-mini zrga-del" data-notice-del="${i}">삭제</button></div>`).join('');
  notices.querySelectorAll('[data-notice-del]').forEach(b=>b.onclick=()=>{collectAdminDraft();adminDraft.notices.splice(Number(b.dataset.noticeDel),1);renderAdminEditor()});
}
async function saveAdminGuide(){
  collectAdminDraft();if(!adminDraft)return;
  const cleaned=normalize(adminDraft);
  const z=bridge();if(!F||!z?.db||!isStaff())return toast('관리자 DB 로그인을 확인해주세요.');
  const btn=$('zrGuideAdminSave'),old=btn.textContent;btn.disabled=true;btn.textContent='저장 중...';
  try{await F.setDoc(F.doc(z.db,COLLECTION,DOC_ID),{kind:'customerGuide',date:'',status:'cancelled',playUse:'no',playStart:'',playEnd:'',contents:cleaned.contents,notices:cleaned.notices,updatedAt:F.serverTimestamp()},{merge:true});setGuide(cleaned);toast('고객 안내 설정을 저장했습니다.')}
  catch(e){console.error('customer guide save',e);toast('고객 안내 설정 저장에 실패했습니다.')}
  finally{btn.disabled=false;btn.textContent=old}
}

function subscribe(){
  const z=bridge();if(!F||!z?.db||!z?.auth?.currentUser)return;
  if(unsub){unsub();unsub=null}
  try{unsub=F.onSnapshot(F.doc(z.db,COLLECTION,DOC_ID),s=>{setGuide(s.exists()?s.data():DEFAULT_GUIDE)},e=>console.debug('customer guide read',e))}catch(e){console.debug('customer guide subscribe',e)}
}
async function initFirebase(){
  try{const [fs,au]=await Promise.all([import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`),import(`https://www.gstatic.com/firebasejs/${FV}/firebase-auth.js`)]);F=fs;authMod=au;const t=setInterval(()=>{const z=bridge();if(!z?.auth||!z?.db)return;clearInterval(t);authMod.onAuthStateChanged(z.auth,()=>setTimeout(subscribe,20));subscribe()},200);setTimeout(()=>clearInterval(t),15000)}catch(e){console.error('customer guide firebase',e)}
}
function boot(){
  if(installed)return;installed=true;injectStyle();ensureCustomerModal();bindCustomer();
  const t=setInterval(()=>{ensureAdminSection();if(adminInstalled)clearInterval(t)},250);setTimeout(()=>clearInterval(t),15000);initFirebase();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
