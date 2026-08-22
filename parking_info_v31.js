(()=>{
'use strict';
if(window.__ZR_PARKING_INFO_V31)return;
window.__ZR_PARKING_INFO_V31=true;
window.__ZR_FINAL_CONFIRM_V31=true;

const FV='12.17.1';
const STAFF_EMAIL='zoolung09@zoolungzoolung.com';
const COLLECTION='customerGuides';
const DOC_ID='main';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=v=>JSON.parse(JSON.stringify(v));
const safeUrl=u=>/^https?:\/\//i.test(String(u||'').trim())?String(u).trim():'';
const toast=s=>{try{window.toast?.(s)}catch{}};

const DEF={
  title:'주차 및 인솔 안내',
  dropoffTitle:'승·하차 위치',
  dropoffPlace:'아이스토어 라크몽점 앞 또는 황금동상 앞',
  dropoffAddress:'경기 화성시 동탄구 송동 741',
  dropoffNote:'하차지점에서 인솔자 대기\n도움 필요 시 도착 5분 전 연락해주세요.\n지하주차장 높이 제한 2.1m',
  busTitle:'버스 주차 위치',
  busPlace:'동탄 제2차고지 앞',
  busAddress:'경기도 화성시 장지동 1054',
  busNote:'25인승·45인승 버스 주차 가능\n주변 주정차 단속구간을 피해 주차해주세요.'
};
const FALLBACK_ZOO=['예약한 입장시간에 맞춰 방문해주세요.','동물 친구들은 눈으로만 만나주세요.'];
const FALLBACK_PLAY=['예약한 놀이터 이용시간을 지켜주세요.','안전을 위해 놀이터 이용수칙을 지켜주세요.'];

let FS=null,db=null,unsub=null,current=clone(DEF),guideDoc={};
let guideMapUrl='',guideMapDraft='',guideMapDirty=false;
let submitBypass=false,pendingButton=null;

function norm(raw){
  const s=raw&&typeof raw==='object'?raw:{};
  const t=(k,max=800)=>String(s[k]??DEF[k]).slice(0,max);
  return {
    title:t('title',80),dropoffTitle:t('dropoffTitle',80),dropoffPlace:t('dropoffPlace',160),dropoffAddress:t('dropoffAddress',160),dropoffNote:t('dropoffNote'),
    busTitle:t('busTitle',80),busPlace:t('busPlace',160),busAddress:t('busAddress',160),busNote:t('busNote')
  };
}
function lines(s){return String(s||'').split(/\n+/).map(x=>x.trim()).filter(Boolean)}
function mapUrls(address){
  const q=encodeURIComponent(String(address||'').trim());
  return {naver:`https://map.naver.com/p/search/${q}`,kakao:`https://map.kakao.com/link/search/${q}`};
}
function isStaff(){const u=window.zrReservationFirebase?.auth?.currentUser;return !!u&&String(u.email||'').toLowerCase()===STAFF_EMAIL}
function customerVisible(){const v=$('customerView');return !!v&&!v.classList.contains('hidden')&&getComputedStyle(v).display!=='none'}
function guideNotices(key,fallback){
  const raw=guideDoc?.[key]?.notices;
  const a=(Array.isArray(raw)?raw:[]).map(x=>String(x?.text||'').trim()).filter(Boolean).slice(0,2);
  return a.length?a:fallback;
}
function readGuideMapUrl(raw){
  const s=raw&&typeof raw==='object'?raw:{};
  return safeUrl(s.guideMapImageUrl||s.guideMapUrl||s.mapImageUrl||s.guideMap?.imageUrl||'');
}

function injectStyle(){
  if($('zrParkingStyleV31'))return;
  const s=document.createElement('style');s.id='zrParkingStyleV31';s.textContent=`
#zrParkingInfoCard{margin-top:16px;border:1px solid #dde4df;border-radius:14px;background:#fff;overflow:hidden}.zrpk31-title{padding:15px 16px 13px;font-size:17px;font-weight:900;border-bottom:1px solid #edf0ee}.zrpk31-row{padding:16px 16px 15px;border-left:4px solid transparent}.zrpk31-row+.zrpk31-row{border-top:1px solid #edf0ee}.zrpk31-row h4{display:inline-flex;align-items:center;margin:0 0 8px;padding:4px 9px;border-radius:999px;font-size:13px;font-weight:950;letter-spacing:-.2px}.zrpk31-row:first-of-type{background:#fffaf0;border-left-color:#d39a19}.zrpk31-row:first-of-type h4{background:#fff0bf;color:#805500}.zrpk31-row:nth-of-type(2){background:#f2f8f4;border-left-color:#2f6b4f}.zrpk31-row:nth-of-type(2) h4{background:#dfeee5;color:#24553f}.zrpk31-place{font-size:15px;font-weight:900;line-height:1.5;color:#1f2a23}.zrpk31-address{margin-top:4px;color:#5b665f;font-size:12px;line-height:1.5}.zrpk31-maps{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.zrpk31-map{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:0 12px;border-radius:8px;text-decoration:none;font-size:12px;font-weight:900}.zrpk31-map.naver{background:#fff;border:1px solid #03c75a;color:#03a84f}.zrpk31-map.kakao{background:#fee500;border:1px solid #fee500;color:#1f4aa8}.zrpk31-notes{margin:10px 0 0;padding-left:18px;color:#59645d}.zrpk31-notes li{margin:4px 0;font-size:12px;line-height:1.55}
#zrParkingAdminSection{margin-top:18px;padding:14px;border:1px solid #d9e3dc;border-radius:14px;background:#f8fbf9}#zrParkingAdminSection h3{margin:0}.zrpk31-admin{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}.zrpk31-admin .full{grid-column:1/-1}.zrpk31-admin label{display:block;font-size:11px;font-weight:850;color:#68736b;margin-bottom:4px}.zrpk31-admin input,.zrpk31-admin textarea{width:100%;box-sizing:border-box}.zrpk31-admin textarea{min-height:78px;resize:vertical}.zrpk31-save{display:flex;justify-content:flex-end;margin-top:12px}
.zrfinal31{position:fixed;inset:0;z-index:10120;background:rgba(16,25,20,.56);display:flex;align-items:center;justify-content:center;padding:14px}.zrfinal31.hidden{display:none!important}.zrfinal31-sheet{width:min(600px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:18px;padding:18px;box-sizing:border-box}.zrfinal31-sheet h2{margin:0 0 8px;font-size:20px}.zrfinal31-summary{padding:12px 0;border-bottom:1px solid #edf0ee}.zrfinal31-summary b{display:block;font-size:14px;margin-bottom:6px}.zrfinal31-summary ul{margin:0;padding-left:18px;color:#56615a}.zrfinal31-summary li{font-size:12px;line-height:1.55;margin:3px 0}.zrfinal31-parking{margin-top:15px}.zrfinal31-parking h3{margin:0 0 9px;font-size:16px}.zrfinal31-place{margin-top:10px;padding:12px 13px;border:1px solid #e2e8e3;border-left:4px solid transparent;border-radius:12px;font-size:13px;line-height:1.55}.zrfinal31-place:first-of-type{background:#fffaf0;border-color:#eedaa9;border-left-color:#d39a19}.zrfinal31-place:nth-of-type(2){background:#f2f8f4;border-color:#d9e8df;border-left-color:#2f6b4f}.zrfinal31-place>b{display:inline-block;margin-bottom:4px;padding:3px 8px;border-radius:999px;font-size:12px}.zrfinal31-place:first-of-type>b{background:#fff0bf;color:#805500}.zrfinal31-place:nth-of-type(2)>b{background:#dfeee5;color:#24553f}.zrfinal31-actions{display:grid;grid-template-columns:1fr 1.7fr;gap:9px;margin-top:16px}.zrfinal31-actions button{min-height:48px;border:0;border-radius:11px;font-weight:900}.zrfinal31-back{background:#eef1ee;color:#526057}.zrfinal31-ok{background:#2f6b4f;color:#fff}
.zrgm32{position:fixed;inset:0;z-index:10220;background:rgba(16,25,20,.64);display:flex;align-items:center;justify-content:center;padding:14px}.zrgm32.hidden{display:none!important}.zrgm32-sheet{width:min(980px,100%);max-height:94vh;overflow:auto;background:#fff;border-radius:18px;padding:14px;box-sizing:border-box}.zrgm32-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}.zrgm32-head h2{margin:0;font-size:18px}.zrgm32-close{border:0;border-radius:9px;background:#eef1ee;min-width:40px;min-height:36px;font-weight:900}.zrgm32-img{display:block;width:100%;height:auto;border:1px solid #e0e5e1;border-radius:12px;background:#f7f8f7}
@media(max-width:650px){.zrpk31-admin{grid-template-columns:1fr}.zrpk31-admin .full{grid-column:auto}.zrfinal31-actions{grid-template-columns:1fr}.zrpk31-row{padding:15px 13px}.zrgm32-sheet{padding:10px}}
`;
  document.head.appendChild(s);
}
function mapButtons(address){const u=mapUrls(address);return `<div class="zrpk31-maps"><a class="zrpk31-map naver" href="${esc(u.naver)}" target="_blank" rel="noopener noreferrer">네이버지도</a><a class="zrpk31-map kakao" href="${esc(u.kakao)}" target="_blank" rel="noopener noreferrer">카카오맵</a></div>`}
function notesHtml(text){const a=lines(text);return a.length?`<ul class="zrpk31-notes">${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
function locationHtml(title,place,address,note){return `<section class="zrpk31-row"><h4>${esc(title)}</h4><div class="zrpk31-place">${esc(place)}</div><div class="zrpk31-address">${esc(address)}</div>${mapButtons(address)}${notesHtml(note)}</section>`}
function cardHtml(){const p=current;return `<div class="zrpk31-title">${esc(p.title)}</div>${locationHtml(p.dropoffTitle,p.dropoffPlace,p.dropoffAddress,p.dropoffNote)}${locationHtml(p.busTitle,p.busPlace,p.busAddress,p.busNote)}`}
function anchor(){const a=$('entryTime'),b=$('exitTime');if(!a||!b)return null;const c=[b.closest('.grid2'),b.closest('.grid'),b.parentElement?.parentElement,b.parentElement].filter(Boolean);return c.find(x=>x.contains(a)&&x.contains(b))||b.parentElement}
function renderCard(){let r=$('zrParkingInfoCard');if(!r){const a=anchor();if(!a)return false;r=document.createElement('section');r.id='zrParkingInfoCard';a.insertAdjacentElement('afterend',r)}r.innerHTML=cardHtml();return true}

const field=(label,key,value,full=false,area=false)=>`<div class="${full?'full':''}"><label>${label}</label>${area?`<textarea data-pk31="${key}">${esc(value)}</textarea>`:`<input data-pk31="${key}" value="${esc(value)}">`}</div>`;
function renderAdmin(){
  const sec=$('zrGuideAdminSection');if(!sec)return false;
  let r=$('zrParkingAdminSection');
  if(!r){
    r=document.createElement('section');r.id='zrParkingAdminSection';
    const bar=sec.querySelector('.zrga-savebar');bar?bar.insertAdjacentElement('beforebegin',r):sec.appendChild(r);
  }
  const p=current;
  r.innerHTML=`<h3>주차 안내 관리</h3><div class="zrga-help">장소명·주소·안내 문구를 수정할 수 있습니다. 지도 버튼은 입력한 주소로 자동 연결됩니다.</div><div class="zrpk31-admin">${field('안내 제목','title',p.title,true)}${field('승·하차 제목','dropoffTitle',p.dropoffTitle)}${field('승·하차 장소','dropoffPlace',p.dropoffPlace)}${field('승·하차 주소','dropoffAddress',p.dropoffAddress,true)}${field('승·하차 안내 문구','dropoffNote',p.dropoffNote,true,true)}${field('버스 주차 제목','busTitle',p.busTitle)}${field('버스 주차 장소','busPlace',p.busPlace)}${field('버스 주차 주소','busAddress',p.busAddress,true)}${field('버스 주차 안내 문구','busNote',p.busNote,true,true)}</div><div class="zrpk31-save"><button type="button" class="btn-primary" id="zrParkingSaveV31">주차 안내 저장</button></div>`;
  $('zrParkingSaveV31').onclick=saveParking;return true;
}
async function saveParking(){
  if(!isStaff())return toast('관리자 DB 로그인을 확인해주세요.');
  if(!FS||!db)return toast('주차 안내 DB 연결 중입니다.');
  const b=$('zrParkingSaveV31'),old=b?.textContent||'';if(b){b.disabled=true;b.textContent='저장 중...'}
  try{
    const o=clone(current);document.querySelectorAll('#zrParkingAdminSection [data-pk31]').forEach(x=>o[x.dataset.pk31]=x.value);
    const cleaned=norm(o);await FS.setDoc(FS.doc(db,COLLECTION,DOC_ID),{parking:cleaned,updatedAtMs:Date.now()},{merge:true});
    current=cleaned;renderCard();renderAdmin();toast('주차 안내를 저장했습니다.');
  }catch(e){console.error('parking v31 save',e);toast('주차 안내 저장에 실패했습니다.')}finally{if(b){b.disabled=false;b.textContent=old}}
}

function visibleInput(x){
  if(!x||x.type==='hidden'||x.disabled)return false;
  try{return getComputedStyle(x).display!=='none'&&getComputedStyle(x).visibility!=='hidden'&&x.getClientRects().length>0}catch{return true}
}
function guideMapControls(button){
  const root=$('zrGuideAdminSection')||document;
  const b=button||[...root.querySelectorAll('button,input[type="button"],input[type="submit"]')].find(x=>/가이드맵저장/.test((x.textContent||x.value||'').replace(/\s+/g,'')));
  if(!b)return null;
  const scopes=[];
  for(const s of [b.parentElement,b.parentElement?.parentElement,b.closest('.card'),b.closest('section')])if(s&&!scopes.includes(s))scopes.push(s);
  for(const scope of scopes){
    let inputs=[...scope.querySelectorAll('input')].filter(visibleInput);
    if(!inputs.length)inputs=[...scope.querySelectorAll('input')].filter(x=>x.type!=='hidden'&&!x.disabled);
    if(!inputs.length)continue;
    const input=inputs.find(x=>/가이드맵|guide.?map/i.test(`${x.id||''} ${x.name||''} ${x.placeholder||''} ${x.getAttribute('aria-label')||''} ${x.parentElement?.textContent||''}`))
      ||inputs.find(x=>String(x.type||'').toLowerCase()==='url')
      ||inputs.find(x=>/url/i.test(`${x.id||''} ${x.name||''} ${x.placeholder||''}`))
      ||inputs[0];
    if(input){
      b.onclick=null;
      input.oninput=null;input.onchange=null;input.onblur=null;input.onfocusout=null;
      return {button:b,scope,input,root};
    }
  }
  return null;
}
function guideMapPreview(c,raw){
  if(!c)return;
  const roots=[];
  for(const r of [c.scope,c.button?.closest?.('.card'),c.button?.closest?.('section')])if(r&&!roots.includes(r))roots.push(r);
  let img=null;
  for(const r of roots){
    const imgs=[...r.querySelectorAll('img')];
    img=imgs.find(x=>/가이드맵|guide.?map/i.test(`${x.id||''} ${x.className||''} ${x.alt||''}`));
    if(!img&&imgs.length===1)img=imgs[0];
    if(img)break;
  }
  if(!img)return;
  const url=safeUrl(raw);
  if(!url){img.removeAttribute('src');img.style.display='none';return;}
  if(img.src!==url)img.src=url;
  img.style.display='block';
}
function syncGuideMapAdmin(force=false){
  const c=guideMapControls();if(!c)return false;
  if(guideMapDirty){
    if(c.input.value!==guideMapDraft)c.input.value=guideMapDraft;
    guideMapPreview(c,guideMapDraft);
    return true;
  }
  if(!force&&document.activeElement===c.input)return true;
  if(c.input.value!==guideMapUrl)c.input.value=guideMapUrl;
  guideMapPreview(c,guideMapUrl);
  return true;
}
function holdGuideMapDraft(){
  if(!guideMapDirty)return;
  for(const ms of [0,40,120,260])setTimeout(()=>syncGuideMapAdmin(true),ms);
}
async function saveGuideMap(button){
  const c=guideMapControls(button);if(!c)return toast('가이드맵 입력창을 찾지 못했습니다.');
  if(!isStaff())return toast('관리자 DB 로그인을 확인해주세요.');
  if(!FS||!db)return toast('가이드맵 DB 연결 중입니다. 잠시 후 다시 눌러주세요.');
  const raw=guideMapDirty?guideMapDraft:String(c.input.value||'');
  const trimmed=String(raw||'').trim();
  const url=trimmed?safeUrl(trimmed):'';
  if(trimmed&&!url)return toast('가이드맵 이미지 URL을 https:// 주소로 입력해주세요.');
  const old=c.button.textContent||c.button.value||'가이드맵 저장';
  c.button.disabled=true;if('value' in c.button&&c.button.tagName==='INPUT')c.button.value='저장 중...';else c.button.textContent='저장 중...';
  try{
    await FS.setDoc(FS.doc(db,COLLECTION,DOC_ID),{guideMapImageUrl:url,updatedAtMs:Date.now()},{merge:true});
    guideMapUrl=url;guideMapDraft=url;guideMapDirty=false;
    c.input.value=url;guideMapPreview(c,url);
    toast(url?'가이드맵 이미지를 저장했습니다.':'가이드맵 이미지를 숨겼습니다.');
  }catch(e){
    const code=String(e?.code||e?.name||'unknown').replace(/^firestore\//,'');
    console.error('guide map save',e);toast(`가이드맵 이미지 저장 실패 · ${code}`);
  }finally{
    c.button.disabled=false;if('value' in c.button&&c.button.tagName==='INPUT')c.button.value=old;else c.button.textContent=old;
  }
}
function ensureGuideMapModal(){
  if($('zrGuideMapModalV32'))return;
  const m=document.createElement('div');m.id='zrGuideMapModalV32';m.className='zrgm32 hidden';
  m.innerHTML=`<div class="zrgm32-sheet" role="dialog" aria-modal="true" aria-label="가이드맵"><div class="zrgm32-head"><h2>가이드맵</h2><button type="button" class="zrgm32-close" id="zrGuideMapCloseV32">닫기</button></div><img class="zrgm32-img" id="zrGuideMapImageV32" alt="주렁주렁 동탄 가이드맵"></div>`;
  document.body.appendChild(m);$('zrGuideMapCloseV32').onclick=()=>m.classList.add('hidden');m.addEventListener('click',e=>{if(e.target===m)m.classList.add('hidden')});
}
function openGuideMap(){
  const url=safeUrl(guideMapUrl);if(!url)return toast('등록된 가이드맵 이미지가 없습니다.');
  ensureGuideMapModal();$('zrGuideMapImageV32').src=url;$('zrGuideMapModalV32').classList.remove('hidden');
}
function isGuideMapCustomerButton(b){
  if(!b||b.closest('#adminView')||b.closest('#zrGuideMapModalV32'))return false;
  const t=(b.textContent||b.value||'').replace(/\s+/g,'');return /^가이드맵(보기|확인)?$/.test(t);
}
function bindGuideMap(){
  const editEvent=e=>{
    const c=guideMapControls();if(!c||e.target!==c.input)return;
    guideMapDraft=String(e.target.value||'');guideMapDirty=true;guideMapPreview(c,guideMapDraft);
    e.stopImmediatePropagation();
  };
  document.addEventListener('input',editEvent,true);
  document.addEventListener('change',e=>{const c=guideMapControls();if(!c||e.target!==c.input)return;e.stopImmediatePropagation();holdGuideMapDraft()},true);
  document.addEventListener('blur',e=>{const c=guideMapControls();if(!c||e.target!==c.input)return;e.stopImmediatePropagation();holdGuideMapDraft()},true);
  document.addEventListener('focusout',e=>{const c=guideMapControls();if(!c||e.target!==c.input)return;e.stopImmediatePropagation();holdGuideMapDraft()},true);
  document.addEventListener('click',e=>{
    const b=e.target?.closest?.('button,a,input[type="button"],input[type="submit"]');if(!b)return;
    const text=(b.textContent||b.value||'').replace(/\s+/g,'');
    if(/가이드맵저장/.test(text)){
      e.preventDefault();e.stopImmediatePropagation();saveGuideMap(b);return;
    }
    if(isGuideMapCustomerButton(b)){e.preventDefault();e.stopImmediatePropagation();openGuideMap()}
  },true);
  const mo=new MutationObserver(()=>syncGuideMapAdmin());mo.observe(document.body,{childList:true,subtree:true});
}

function summaryBlock(title,items){return `<section class="zrfinal31-summary"><b>${esc(title)}</b><ul>${items.slice(0,2).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`}
function finalModal(){
  if($('zrFinalGuideModalV31'))return;
  const m=document.createElement('div');m.id='zrFinalGuideModalV31';m.className='zrfinal31 hidden';
  m.innerHTML=`<div class="zrfinal31-sheet"><h2>예약 전 최종 확인</h2><div id="zrFinalChecksV31"></div><div class="zrfinal31-parking" id="zrFinalParkingV31"></div><div class="zrfinal31-actions"><button type="button" class="zrfinal31-back" id="zrFinalBackV31">예약 내용 다시 보기</button><button type="button" class="zrfinal31-ok" id="zrFinalOkV31">확인 후 예약 신청</button></div></div>`;
  document.body.appendChild(m);
  $('zrFinalBackV31').onclick=()=>m.classList.add('hidden');
  $('zrFinalOkV31').onclick=()=>{m.classList.add('hidden');submitBypass=true;window.__ZR_FINAL_DIRECT_SUBMIT=true;const b=pendingButton;pendingButton=null;setTimeout(()=>{b?.click?.();setTimeout(()=>{submitBypass=false;window.__ZR_FINAL_DIRECT_SUBMIT=false},250)},0)};
}
function finalLocation(title,place,address){return `<div class="zrfinal31-place"><b>${esc(title)}</b><br>${esc(place)}<br>${esc(address)}${mapButtons(address)}</div>`}
function showFinal(){
  finalModal();const play=String($('playUse')?.value||'')==='yes';
  const zoo=guideNotices('zoo',FALLBACK_ZOO),playItems=guideNotices('playground',FALLBACK_PLAY);
  $('zrFinalChecksV31').innerHTML=summaryBlock('동물원 이용 안내',zoo)+(play?summaryBlock('놀이터 이용 안내',playItems):`<section class="zrfinal31-summary"><b>놀이터</b><div style="font-size:12px;color:#6a746d">이용 안 함</div></section>`);
  $('zrFinalParkingV31').innerHTML=`<h3>${esc(current.title)}</h3>${finalLocation(current.dropoffTitle,current.dropoffPlace,current.dropoffAddress)}${finalLocation(current.busTitle,current.busPlace,current.busAddress)}`;
  $('zrFinalGuideModalV31').classList.remove('hidden');
}
function bookingButton(b){const t=(b?.textContent||b?.value||'').replace(/\s+/g,'');return !!b&&/(예약.*(신청|완료|하기)|신청하기|예약하기)/.test(t)&&!/예약확인|추가예약/.test(t)}
function bindFinal(){
  window.addEventListener('click',e=>{
    if(submitBypass||!customerVisible())return;
    const b=e.target?.closest?.('button,input[type="submit"],a');
    if(!bookingButton(b)||b.closest('#zrFinalGuideModalV31')||b.closest('#zrGuideModal')||b.closest('#zrPlayGuideModal'))return;
    e.preventDefault();e.stopImmediatePropagation();pendingButton=b;showFinal();
  },true);
}
async function init(){
  try{
    FS=await import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`);
    const z=window.zrReservationFirebase;if(!z?.db)throw new Error('Firebase DB bridge unavailable');db=z.db;
    if(unsub)unsub();
    unsub=FS.onSnapshot(FS.doc(db,COLLECTION,DOC_ID),snap=>{
      guideDoc=snap.exists()?snap.data()||{}:{};
      guideMapUrl=readGuideMapUrl(guideDoc);if(!guideMapDirty)guideMapDraft=guideMapUrl;
      current=norm(guideDoc.parking);renderCard();syncGuideMapAdmin();
      if($('zrGuideAdminSection')&&!$('zrGuideAdminSection').classList.contains('hidden'))renderAdmin();
    },e=>console.error('parking v31 read',e));
  }catch(e){console.error('parking v31 init',e)}
}
function boot(){
  injectStyle();
  const cardTimer=setInterval(()=>{if(renderCard())clearInterval(cardTimer)},200);setTimeout(()=>clearInterval(cardTimer),20000);
  const adminTimer=setInterval(()=>{
    const t=$('zrGuideAdminTab');if(!t)return;
    t.addEventListener('click',()=>setTimeout(()=>{renderAdmin();syncGuideMapAdmin(true)},80));clearInterval(adminTimer);
  },250);setTimeout(()=>clearInterval(adminTimer),20000);
  bindGuideMap();bindFinal();
  const wait=setInterval(()=>{if(!window.zrReservationFirebase?.auth||!window.zrReservationFirebase?.db)return;clearInterval(wait);init()},200);setTimeout(()=>clearInterval(wait),20000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
