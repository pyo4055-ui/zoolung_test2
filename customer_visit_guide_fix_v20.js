(()=>{
'use strict';
if(window.__ZR_CUSTOMER_GUIDE_FIX_V20)return;
window.__ZR_CUSTOMER_GUIDE_FIX_V20=true;

const FV='12.17.1';
const STAFF_EMAIL='zoolung09@zoolungzoolung.com';
const COLLECTION='customerGuides';
const DOC_ID='main';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const safeUrl=u=>/^https?:\/\//i.test(String(u||'').trim())?String(u).trim():'';
const clone=v=>JSON.parse(JSON.stringify(v));
const uid=p=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
const toast=s=>{try{window.toast?.(s)}catch{}};

const DEFAULT_GUIDE={contents:[
  {id:'guide_f4',name:'4F 베이직',duration:'',imageUrl:'',description:'4F 동물 관람 컨텐츠입니다.',enabled:true},
  {id:'guide_f5',name:'5F 워터가든',duration:'',imageUrl:'',description:'5F 워터가든 관람 컨텐츠입니다.',enabled:true},
  {id:'guide_play',name:'놀이터',duration:'',imageUrl:'',description:'예약된 이용시간에 맞춰 놀이터를 이용합니다.',enabled:true}
],notices:[
  {id:'notice_1',text:'동물 관람은 10:30부터 가능합니다.'},
  {id:'notice_2',text:'예약한 입장시간에 맞춰 방문해주세요.'}
]};

let APP=null,FS=null,db=null,unsub=null;
let current=clone(DEFAULT_GUIDE),draft=clone(DEFAULT_GUIDE);

function normalize(raw){
  const s=raw&&typeof raw==='object'?raw:{};
  const contents=(Array.isArray(s.contents)?s.contents:DEFAULT_GUIDE.contents).slice(0,10).map((x,i)=>({
    id:String(x?.id||uid('guide')),
    name:String(x?.name||`컨텐츠 ${i+1}`).trim()||`컨텐츠 ${i+1}`,
    duration:String(x?.duration??'').replace(/[^0-9]/g,'').slice(0,3),
    imageUrl:safeUrl(x?.imageUrl),
    description:String(x?.description||''),
    enabled:x?.enabled!==false
  }));
  const notices=(Array.isArray(s.notices)?s.notices:DEFAULT_GUIDE.notices).slice(0,20).map(x=>({
    id:String(x?.id||uid('notice')),
    text:String(x?.text||'').trim()
  })).filter(x=>x.text);
  return {contents,notices};
}
function isStaff(){
  const u=window.zrReservationFirebase?.auth?.currentUser;
  return !!u&&String(u.email||'').toLowerCase()===STAFF_EMAIL.toLowerCase();
}
function collect(){
  if(!draft)draft=clone(current);
  document.querySelectorAll('#zrGuideAdminContents .zrga-row[data-v20-i]').forEach(row=>{
    const x=draft.contents[Number(row.dataset.v20I)];if(!x)return;
    x.name=(row.querySelector('[data-k="name"]')?.value||'').trim()||x.name;
    x.duration=String(row.querySelector('[data-k="duration"]')?.value||'').replace(/[^0-9]/g,'').slice(0,3);
    x.imageUrl=safeUrl(row.querySelector('[data-k="imageUrl"]')?.value||'');
    x.description=String(row.querySelector('[data-k="description"]')?.value||'');
    x.enabled=!!row.querySelector('[data-k="enabled"]')?.checked;
  });
  document.querySelectorAll('#zrGuideAdminNotices .zrga-notice-row[data-v20-i]').forEach(row=>{
    const x=draft.notices[Number(row.dataset.v20I)];if(x)x.text=row.querySelector('input')?.value||'';
  });
}
function move(a,i,d){const j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]]}

function renderAdmin(){
  const root=$('zrGuideAdminContents'), notices=$('zrGuideAdminNotices');
  if(!root||!notices)return;
  root.innerHTML=draft.contents.map((x,i)=>{const u=safeUrl(x.imageUrl);return `<div class="zrga-row" data-v20-i="${i}"><div class="zrga-head"><strong>컨텐츠 ${i+1}</strong><button type="button" class="zrga-mini" data-v20-up="${i}">↑</button><button type="button" class="zrga-mini" data-v20-down="${i}">↓</button><button type="button" class="zrga-mini zrga-del" data-v20-del="${i}">삭제</button></div><div class="zrga-grid"><div><label>컨텐츠명</label><input data-k="name" value="${esc(x.name)}"></div><div><label>평균 소요시간(분)</label><input data-k="duration" type="number" min="0" max="999" value="${esc(x.duration)}" placeholder="예: 45"></div><div class="full"><label>사진 URL</label><input data-k="imageUrl" value="${esc(x.imageUrl)}" placeholder="https://..."></div>${u?`<div class="full zrga-preview"><img src="${esc(u)}" alt="미리보기" onerror="this.parentElement.style.display='none'"></div>`:''}<div class="full"><label>간단 설명</label><textarea data-k="description">${esc(x.description)}</textarea></div><div class="full"><label style="display:flex;gap:7px;align-items:center"><input data-k="enabled" type="checkbox" ${x.enabled?'checked':''} style="width:auto"> 고객에게 노출</label></div></div></div>`}).join('');
  notices.innerHTML=draft.notices.map((x,i)=>`<div class="zrga-notice-row" data-v20-i="${i}"><input value="${esc(x.text)}" placeholder="주의사항을 입력해주세요."><button type="button" class="zrga-mini zrga-del" data-v20-ndel="${i}">삭제</button></div>`).join('');
  root.onclick=e=>{
    const up=e.target.closest('[data-v20-up]'),down=e.target.closest('[data-v20-down]'),del=e.target.closest('[data-v20-del]');
    if(!up&&!down&&!del)return;collect();
    if(up)move(draft.contents,Number(up.dataset.v20Up),-1);
    if(down)move(draft.contents,Number(down.dataset.v20Down),1);
    if(del)draft.contents.splice(Number(del.dataset.v20Del),1);
    renderAdmin();
  };
  notices.onclick=e=>{const b=e.target.closest('[data-v20-ndel]');if(!b)return;collect();draft.notices.splice(Number(b.dataset.v20Ndel),1);renderAdmin()};
}

function bindAdmin(){
  const tab=$('zrGuideAdminTab'), addContent=$('zrGuideAddContent'), addNotice=$('zrGuideAddNotice'), save=$('zrGuideAdminSave');
  if(!tab||!addContent||!addNotice||!save)return false;
  if(tab.dataset.v20Bound)return true;
  tab.dataset.v20Bound='1';
  tab.addEventListener('click',()=>setTimeout(()=>{draft=clone(current);renderAdmin();},0));
  addContent.onclick=()=>{collect();if(draft.contents.length>=10)return toast('컨텐츠는 최대 10개까지 등록할 수 있습니다.');draft.contents.push({id:uid('guide'),name:'새 컨텐츠',duration:'',imageUrl:'',description:'',enabled:true});renderAdmin()};
  addNotice.onclick=()=>{collect();if(draft.notices.length>=20)return toast('주의사항은 최대 20개까지 등록할 수 있습니다.');draft.notices.push({id:uid('notice'),text:''});renderAdmin()};
  save.addEventListener('click',saveGuide,true);
  return true;
}

async function saveGuide(e){
  e.preventDefault();e.stopImmediatePropagation();
  if(!isStaff())return toast('관리자 DB 로그인을 확인해주세요.');
  if(!db||!FS)return toast('고객 안내 DB 연결 중입니다. 잠시 후 다시 눌러주세요.');
  collect();const cleaned=normalize(draft);
  const b=$('zrGuideAdminSave'),old=b?.textContent||'안내 설정 저장';if(b){b.disabled=true;b.textContent='저장 중...'}
  try{
    await FS.setDoc(FS.doc(db,COLLECTION,DOC_ID),{contents:cleaned.contents,notices:cleaned.notices,updatedAtMs:Date.now()},{merge:true});
    current=clone(cleaned);draft=clone(cleaned);toast('고객 안내 설정을 저장했습니다.');
  }catch(err){
    const code=String(err?.code||err?.name||'unknown').replace(/^firestore\//,'');
    const msg=String(err?.message||'').slice(0,220);
    console.error('customer guide v20 save',err);
    toast(`고객 안내 저장 실패 · ${code}`);
    try{alert(`고객 안내 설정 저장 실패\n오류코드: ${code}\n${msg}`)}catch{}
  }finally{if(b){b.disabled=false;b.textContent=old}}
}

function renderCustomer(){
  const cards=$('zrGuideCards'), notices=$('zrGuideNotices');if(!cards||!notices)return;
  const active=current.contents.filter(x=>x.enabled);
  cards.innerHTML=active.map(x=>{const u=safeUrl(x.imageUrl),d=Number(x.duration||0);return `<article class="zr-guide-card">${u?`<img class="zr-guide-img" src="${esc(u)}" alt="${esc(x.name)}" onerror="this.style.display='none'">`:''}<div class="zr-guide-card-body"><h3>${esc(x.name)}</h3>${d?`<span class="zr-guide-duration">평균 소요시간 약 ${d}분</span>`:''}${x.description?`<p class="zr-guide-desc">${esc(x.description)}</p>`:''}</div></article>`}).join('');
  notices.innerHTML=current.notices.length?`<section class="zr-guide-notices"><h3>방문 전 주의사항</h3><ul>${current.notices.map(x=>`<li>${esc(x.text)}</li>`).join('')}</ul></section>`:'';
}
function watchModal(){
  const attach=()=>{const m=$('zrGuideModal');if(!m||m.dataset.v20Watch)return false;m.dataset.v20Watch='1';new MutationObserver(()=>{if(!m.classList.contains('hidden'))setTimeout(renderCustomer,0)}).observe(m,{attributes:true,attributeFilter:['class']});return true};
  if(attach())return;const t=setInterval(()=>{if(attach())clearInterval(t)},200);setTimeout(()=>clearInterval(t),15000);
}

async function init(){
  try{
    const [appMod,fsMod]=await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FV}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`)
    ]);
    APP=appMod;FS=fsMod;
    const app=APP.getApps().length?APP.getApp():null;
    if(!app)throw new Error('Firebase 앱이 아직 초기화되지 않았습니다.');
    db=FS.getFirestore(app);
    if(unsub)unsub();
    unsub=FS.onSnapshot(FS.doc(db,COLLECTION,DOC_ID),snap=>{
      current=normalize(snap.exists()?snap.data():DEFAULT_GUIDE);
      if($('zrGuideAdminSection')&&!$('zrGuideAdminSection').classList.contains('hidden')){draft=clone(current);renderAdmin()}
      if($('zrGuideModal')&&!$('zrGuideModal').classList.contains('hidden'))renderCustomer();
    },err=>console.error('customer guide v20 read',err));
  }catch(err){console.error('customer guide v20 init',err)}
}

function boot(){
  const t=setInterval(()=>{if(bindAdmin())clearInterval(t)},200);setTimeout(()=>clearInterval(t),20000);
  watchModal();
  const wait=setInterval(()=>{if(!window.zrReservationFirebase?.auth)return;clearInterval(wait);init()},200);setTimeout(()=>clearInterval(wait),20000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
