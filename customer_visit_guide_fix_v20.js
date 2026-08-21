(()=>{
'use strict';
if(window.__ZR_CUSTOMER_GUIDE_FIX_V20)return;
window.__ZR_CUSTOMER_GUIDE_FIX_V20=true;

const FV='12.17.1';
const STAFF_EMAIL='zoolung09@zoolungzoolung.com';
const COLLECTION='customerGuides';
const DOC_ID='main';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=u=>/^https?:\/\//i.test(String(u||'').trim())?String(u).trim():'';
const clone=v=>JSON.parse(JSON.stringify(v));
const uid=p=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
const toast=s=>{try{window.toast?.(s)}catch{}};

const DEFAULT_GUIDES={
  zoo:{
    contents:[
      {id:'guide_f4',name:'4F 베이직',duration:'',imageUrl:'',description:'4F 동물 관람 컨텐츠입니다.',enabled:true},
      {id:'guide_f5',name:'5F 워터가든',duration:'',imageUrl:'',description:'5F 워터가든 관람 컨텐츠입니다.',enabled:true}
    ],
    notices:[
      {id:'notice_1',text:'동물 관람은 10:30부터 가능합니다.'},
      {id:'notice_2',text:'예약한 입장시간에 맞춰 방문해주세요.'}
    ]
  },
  playground:{
    contents:[
      {id:'guide_play',name:'놀이터',duration:'',imageUrl:'',description:'예약된 이용시간에 맞춰 놀이터를 이용합니다.',enabled:true}
    ],
    notices:[
      {id:'play_notice_1',text:'놀이터는 예약한 이용시간에 맞춰 이용해주세요.'}
    ]
  }
};

let FS=null,db=null,unsub=null;
let current=clone(DEFAULT_GUIDES),draft=clone(DEFAULT_GUIDES);
let playAckValue='',playAckSig='';

function normalizeSection(raw,fallback){
  const s=raw&&typeof raw==='object'?raw:{};
  const contents=(Array.isArray(s.contents)?s.contents:fallback.contents).slice(0,10).map((x,i)=>({
    id:String(x?.id||uid('guide')),
    name:String(x?.name||`컨텐츠 ${i+1}`).trim()||`컨텐츠 ${i+1}`,
    duration:String(x?.duration??'').replace(/[^0-9]/g,'').slice(0,3),
    imageUrl:safeUrl(x?.imageUrl),
    description:String(x?.description||''),
    enabled:x?.enabled!==false
  }));
  const notices=(Array.isArray(s.notices)?s.notices:fallback.notices).slice(0,20).map(x=>({
    id:String(x?.id||uid('notice')),
    text:String(x?.text||'').trim()
  })).filter(x=>x.text);
  return {contents,notices};
}
function normalize(raw){
  const s=raw&&typeof raw==='object'?raw:{};
  if(s.zoo||s.playground){
    return {
      zoo:normalizeSection(s.zoo,DEFAULT_GUIDES.zoo),
      playground:normalizeSection(s.playground,DEFAULT_GUIDES.playground)
    };
  }
  const legacy=normalizeSection({contents:s.contents,notices:s.notices},{
    contents:[...DEFAULT_GUIDES.zoo.contents,...DEFAULT_GUIDES.playground.contents],
    notices:DEFAULT_GUIDES.zoo.notices
  });
  const isPlay=x=>String(x?.id||'')==='guide_play'||/놀이터|playground/i.test(String(x?.name||''));
  const playItems=legacy.contents.filter(isPlay);
  const zooItems=legacy.contents.filter(x=>!isPlay(x));
  return {
    zoo:{contents:zooItems.length?zooItems:clone(DEFAULT_GUIDES.zoo.contents),notices:legacy.notices.length?legacy.notices:clone(DEFAULT_GUIDES.zoo.notices)},
    playground:{contents:playItems.length?playItems:clone(DEFAULT_GUIDES.playground.contents),notices:clone(DEFAULT_GUIDES.playground.notices)}
  };
}
function sectionSig(key){return JSON.stringify(current[key]||{})}
function isStaff(){
  const u=window.zrReservationFirebase?.auth?.currentUser;
  return !!u&&String(u.email||'').toLowerCase()===STAFF_EMAIL.toLowerCase();
}
function collect(){
  if(!draft)draft=clone(current);
  document.querySelectorAll('#zrGuideAdminContents .zrga-row[data-guide-section][data-v25-i]').forEach(row=>{
    const key=row.dataset.guideSection;
    const x=draft[key]?.contents?.[Number(row.dataset.v25I)];if(!x)return;
    x.name=(row.querySelector('[data-k="name"]')?.value||'').trim()||x.name;
    x.duration=String(row.querySelector('[data-k="duration"]')?.value||'').replace(/[^0-9]/g,'').slice(0,3);
    x.imageUrl=safeUrl(row.querySelector('[data-k="imageUrl"]')?.value||'');
    x.description=String(row.querySelector('[data-k="description"]')?.value||'');
    x.enabled=!!row.querySelector('[data-k="enabled"]')?.checked;
  });
  document.querySelectorAll('#zrGuideAdminNotices .zrga-notice-row[data-guide-section][data-v25-i]').forEach(row=>{
    const key=row.dataset.guideSection;
    const x=draft[key]?.notices?.[Number(row.dataset.v25I)];if(x)x.text=row.querySelector('input')?.value||'';
  });
}
function move(a,i,d){const j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]]}
function labelFor(key){return key==='playground'?'놀이터 안내':'동물원 안내'}

function renderContentSection(key){
  const s=draft[key];
  return `<section class="zr-v25-admin-section" data-v25-section="${key}" style="margin-top:14px;padding:14px;border:1px solid #dde4df;border-radius:14px;background:#fbfcfb"><div class="zrga-toolbar"><div><h3 style="margin:0">${labelFor(key)}</h3><div class="zrga-help" style="margin-bottom:0">${key==='zoo'?'동물원 입장시간 선택 시 표시됩니다.':'놀이터 입장시간 선택 시 표시됩니다.'}</div></div><button type="button" class="btn-soft" data-v25-add-content="${key}">+ 컨텐츠 추가</button></div><div class="zrga-list">${s.contents.map((x,i)=>{const u=safeUrl(x.imageUrl);return `<div class="zrga-row" data-guide-section="${key}" data-v25-i="${i}"><div class="zrga-head"><strong>컨텐츠 ${i+1}</strong><button type="button" class="zrga-mini" data-v25-up="${key}:${i}">↑</button><button type="button" class="zrga-mini" data-v25-down="${key}:${i}">↓</button><button type="button" class="zrga-mini zrga-del" data-v25-del="${key}:${i}">삭제</button></div><div class="zrga-grid"><div><label>컨텐츠명</label><input data-k="name" value="${esc(x.name)}"></div><div><label>평균 소요시간(분)</label><input data-k="duration" type="number" min="0" max="999" value="${esc(x.duration)}" placeholder="예: 45"></div><div class="full"><label>사진 URL</label><input data-k="imageUrl" value="${esc(x.imageUrl)}" placeholder="https://..."></div>${u?`<div class="full zrga-preview"><img src="${esc(u)}" alt="미리보기" onerror="this.parentElement.style.display='none'"></div>`:''}<div class="full"><label>간단 설명</label><textarea data-k="description">${esc(x.description)}</textarea></div><div class="full"><label style="display:flex;gap:7px;align-items:center"><input data-k="enabled" type="checkbox" ${x.enabled?'checked':''} style="width:auto"> 고객에게 노출</label></div></div></div>`}).join('')}</div></section>`;
}
function renderNoticeSection(key){
  const s=draft[key];
  return `<section data-v25-notice-section="${key}" style="margin-top:14px;padding:14px;border:1px solid #dde4df;border-radius:14px;background:#fbfcfb"><div class="zrga-toolbar"><h3 style="margin:0">${labelFor(key)} 주의사항</h3><button type="button" class="btn-soft" data-v25-add-notice="${key}">+ 주의사항 추가</button></div>${s.notices.map((x,i)=>`<div class="zrga-notice-row" data-guide-section="${key}" data-v25-i="${i}"><input value="${esc(x.text)}" placeholder="주의사항을 입력해주세요."><button type="button" class="zrga-mini zrga-del" data-v25-ndel="${key}:${i}">삭제</button></div>`).join('')}</section>`;
}
function renderAdmin(){
  const root=$('zrGuideAdminContents'),notices=$('zrGuideAdminNotices');if(!root||!notices)return;
  const oldAdd=$('zrGuideAddContent'),oldNotice=$('zrGuideAddNotice');if(oldAdd)oldAdd.style.display='none';if(oldNotice)oldNotice.style.display='none';
  const help=$('zrGuideAdminSection')?.querySelector('.zrga-help');if(help)help.textContent='동물원과 놀이터 안내를 각각 관리합니다. 각 안내는 해당 입장시간 선택 시 따로 표시됩니다.';
  root.innerHTML=renderContentSection('zoo')+renderContentSection('playground');
  notices.innerHTML=renderNoticeSection('zoo')+renderNoticeSection('playground');
  root.onclick=e=>{
    const add=e.target.closest('[data-v25-add-content]');
    const up=e.target.closest('[data-v25-up]'),down=e.target.closest('[data-v25-down]'),del=e.target.closest('[data-v25-del]');
    if(!add&&!up&&!down&&!del)return;collect();
    if(add){const key=add.dataset.v25AddContent;if(draft[key].contents.length>=10)return toast('컨텐츠는 최대 10개까지 등록할 수 있습니다.');draft[key].contents.push({id:uid('guide'),name:'새 컨텐츠',duration:'',imageUrl:'',description:'',enabled:true});}
    for(const [b,dir] of [[up,-1],[down,1]])if(b){const [key,raw]=b.dataset[dir<0?'v25Up':'v25Down'].split(':');move(draft[key].contents,Number(raw),dir);}
    if(del){const [key,raw]=del.dataset.v25Del.split(':');draft[key].contents.splice(Number(raw),1);}
    renderAdmin();
  };
  notices.onclick=e=>{
    const add=e.target.closest('[data-v25-add-notice]'),del=e.target.closest('[data-v25-ndel]');if(!add&&!del)return;collect();
    if(add){const key=add.dataset.v25AddNotice;if(draft[key].notices.length>=20)return toast('주의사항은 최대 20개까지 등록할 수 있습니다.');draft[key].notices.push({id:uid('notice'),text:''});}
    if(del){const [key,raw]=del.dataset.v25Ndel.split(':');draft[key].notices.splice(Number(raw),1);}
    renderAdmin();
  };
}

function bindAdmin(){
  const tab=$('zrGuideAdminTab'),save=$('zrGuideAdminSave');if(!tab||!save)return false;
  if(tab.dataset.v25Bound)return true;tab.dataset.v25Bound='1';
  tab.addEventListener('click',()=>setTimeout(()=>{draft=clone(current);renderAdmin();},0));
  save.onclick=null;save.dataset.zrGuideSaveOwner='v25';save.addEventListener('click',saveGuide,true);
  return true;
}
async function saveGuide(e){
  e.preventDefault();e.stopImmediatePropagation();
  if(!isStaff())return toast('관리자 DB 로그인을 확인해주세요.');
  if(!db||!FS)return toast('고객 안내 DB 연결 중입니다. 잠시 후 다시 눌러주세요.');
  collect();const cleaned=normalize(draft);
  const b=$('zrGuideAdminSave'),old=b?.textContent||'안내 설정 저장';if(b){b.disabled=true;b.textContent='저장 중...'}
  try{
    const payload={zoo:cleaned.zoo,playground:cleaned.playground,contents:cleaned.zoo.contents,notices:cleaned.zoo.notices,updatedAtMs:Date.now()};
    await FS.setDoc(FS.doc(db,COLLECTION,DOC_ID),payload,{merge:true});
    current=clone(cleaned);draft=clone(cleaned);playAckSig='';toast('동물원·놀이터 안내 설정을 저장했습니다.');
  }catch(err){
    const code=String(err?.code||err?.name||'unknown').replace(/^firestore\//,'');const msg=String(err?.message||'').slice(0,220);
    console.error('customer guide v25 save',err);toast(`고객 안내 저장 실패 · ${code}`);try{alert(`고객 안내 설정 저장 실패\n오류코드: ${code}\n${msg}`)}catch{}
  }finally{if(b){b.disabled=false;b.textContent=old}}
}

function cardsHtml(section){
  return section.contents.filter(x=>x.enabled).map(x=>{const u=safeUrl(x.imageUrl),d=Number(x.duration||0);return `<article class="zr-guide-card">${u?`<img class="zr-guide-img" src="${esc(u)}" alt="${esc(x.name)}" onerror="this.style.display='none'">`:''}<div class="zr-guide-card-body"><h3>${esc(x.name)}</h3>${d?`<span class="zr-guide-duration">평균 소요시간 약 ${d}분</span>`:''}${x.description?`<p class="zr-guide-desc">${esc(x.description)}</p>`:''}</div></article>`}).join('');
}
function noticesHtml(section,title='방문 전 주의사항'){
  return section.notices.length?`<section class="zr-guide-notices"><h3>${esc(title)}</h3><ul>${section.notices.map(x=>`<li>${esc(x.text)}</li>`).join('')}</ul></section>`:'';
}
function renderZooCustomer(){
  const modal=$('zrGuideModal'),cards=$('zrGuideCards'),notices=$('zrGuideNotices');if(!modal||!cards||!notices)return;
  const title=$('zrGuideTitle'),head=modal.querySelector('.zr-guide-head p'),back=$('zrGuideBack');
  if(title)title.textContent='동물원 이용 안내';if(head)head.textContent='선택한 동물원 입장시간 기준으로 이용 안내를 확인해주세요.';if(back)back.textContent='동물원 입장시간 다시 선택';
  cards.innerHTML=cardsHtml(current.zoo);notices.innerHTML=noticesHtml(current.zoo,'동물원 이용 주의사항');
}
function ensurePlayModal(){
  if($('zrPlayGuideModal'))return;
  const m=document.createElement('div');m.id='zrPlayGuideModal';m.className='zr-guide-modal hidden';m.innerHTML=`<div class="zr-guide-sheet" role="dialog" aria-modal="true" aria-labelledby="zrPlayGuideTitle"><div class="zr-guide-head"><h2 id="zrPlayGuideTitle">놀이터 이용 안내</h2><p>선택한 놀이터 입장시간 기준으로 이용 안내를 확인해주세요.</p><div class="zr-guide-entry" id="zrPlayGuideEntry">놀이터 입장시간 --:--</div></div><div class="zr-guide-cards" id="zrPlayGuideCards"></div><div id="zrPlayGuideNotices"></div><div class="zr-guide-actions"><button type="button" class="zr-guide-back" id="zrPlayGuideBack">놀이터 입장시간 다시 선택</button><button type="button" class="zr-guide-confirm" id="zrPlayGuideConfirm">안내사항을 확인했습니다</button></div></div>`;
  document.body.appendChild(m);
  $('zrPlayGuideBack').onclick=()=>{m.classList.add('hidden');playAckValue='';playAckSig='';setTimeout(()=>$('playStart')?.focus?.(),30)};
  $('zrPlayGuideConfirm').onclick=()=>{const v=String($('playStart')?.value||'').trim();if(!v)return;m.classList.add('hidden');playAckValue=v;playAckSig=sectionSig('playground');toast('놀이터 안내사항을 확인했습니다.')};
}
function renderPlayCustomer(){
  ensurePlayModal();const v=String($('playStart')?.value||'').trim();$('zrPlayGuideEntry').textContent=`선택한 놀이터 입장시간 ${v||'--:--'}`;
  $('zrPlayGuideCards').innerHTML=cardsHtml(current.playground);$('zrPlayGuideNotices').innerHTML=noticesHtml(current.playground,'놀이터 이용 주의사항');
}
function openPlayGuide(){
  const v=String($('playStart')?.value||'').trim();if(!v||String($('playUse')?.value||'')!=='yes')return;
  renderPlayCustomer();$('zrPlayGuideModal').classList.remove('hidden');const sh=$('zrPlayGuideModal').querySelector('.zr-guide-sheet');if(sh)sh.scrollTop=0;
}
function playAcknowledged(){
  const v=String($('playStart')?.value||'').trim();if(String($('playUse')?.value||'')!=='yes'||!v)return true;
  return playAckValue===v&&playAckSig===sectionSig('playground');
}
function bookingButton(btn){
  const txt=(btn?.textContent||btn?.value||'').replace(/\s+/g,'');
  return !!btn&&/(예약.*(신청|완료|하기)|신청하기|예약하기)/.test(txt)&&!/예약확인|추가예약/.test(txt);
}
function bindCustomer(){
  document.addEventListener('change',e=>{
    const el=e.target;if(!el)return;
    if(el.id==='entryTime')setTimeout(renderZooCustomer,25);
    if(el.id==='playUse'&&String(el.value||'')!=='yes'){playAckValue='';playAckSig='';$('zrPlayGuideModal')?.classList.add('hidden');}
    if(el.id==='playStart'){
      playAckValue='';playAckSig='';
      if(String($('playUse')?.value||'')==='yes'&&String(el.value||'').trim())setTimeout(openPlayGuide,30);
    }
  },true);
}
function watchZooModal(){
  const attach=()=>{const m=$('zrGuideModal');if(!m||m.dataset.v25Watch)return false;m.dataset.v25Watch='1';new MutationObserver(()=>{if(!m.classList.contains('hidden'))setTimeout(renderZooCustomer,0)}).observe(m,{attributes:true,attributeFilter:['class']});return true};
  if(attach())return;const t=setInterval(()=>{if(attach())clearInterval(t)},200);setTimeout(()=>clearInterval(t),15000);
}

async function init(){
  try{
    FS=await import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`);const z=window.zrReservationFirebase;if(!z?.db)throw new Error('Firebase DB 브리지가 아직 초기화되지 않았습니다.');db=z.db;
    if(unsub)unsub();unsub=FS.onSnapshot(FS.doc(db,COLLECTION,DOC_ID),snap=>{
      current=normalize(snap.exists()?snap.data():DEFAULT_GUIDES);
      if($('zrGuideAdminSection')&&!$('zrGuideAdminSection').classList.contains('hidden')){draft=clone(current);renderAdmin()}
      if($('zrGuideModal')&&!$('zrGuideModal').classList.contains('hidden'))renderZooCustomer();
      if($('zrPlayGuideModal')&&!$('zrPlayGuideModal').classList.contains('hidden'))renderPlayCustomer();
    },err=>console.error('customer guide v25 read',err));
  }catch(err){console.error('customer guide v25 init',err)}
}
function boot(){
  const t=setInterval(()=>{if(bindAdmin())clearInterval(t)},200);setTimeout(()=>clearInterval(t),20000);
  bindCustomer();watchZooModal();
  const wait=setInterval(()=>{if(!window.zrReservationFirebase?.auth||!window.zrReservationFirebase?.db)return;clearInterval(wait);init()},200);setTimeout(()=>clearInterval(wait),20000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();