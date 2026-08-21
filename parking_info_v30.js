(()=>{
'use strict';
if(window.__ZR_PARKING_INFO_V30)return;
window.__ZR_PARKING_INFO_V30=true;

const FV='12.17.1';
const STAFF_EMAIL='zoolung09@zoolungzoolung.com';
const COLLECTION='customerGuides';
const DOC_ID='main';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=v=>JSON.parse(JSON.stringify(v));
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

let FS=null,db=null,unsub=null,current=clone(DEF),submitBypass=false,pendingButton=null;

function norm(raw){
  const s=raw&&typeof raw==='object'?raw:{};
  const t=(k,max=800)=>String(s[k]??DEF[k]).slice(0,max);
  return {
    title:t('title',80),
    dropoffTitle:t('dropoffTitle',80),
    dropoffPlace:t('dropoffPlace',160),
    dropoffAddress:t('dropoffAddress',160),
    dropoffNote:t('dropoffNote'),
    busTitle:t('busTitle',80),
    busPlace:t('busPlace',160),
    busAddress:t('busAddress',160),
    busNote:t('busNote')
  };
}
function lines(s){return String(s||'').split(/\n+/).map(x=>x.trim()).filter(Boolean)}
function mapUrls(address){
  const q=encodeURIComponent(String(address||'').trim());
  return {
    naver:`https://map.naver.com/p/search/${q}`,
    kakao:`https://map.kakao.com/link/search/${q}`
  };
}
function isStaff(){
  const u=window.zrReservationFirebase?.auth?.currentUser;
  return !!u&&String(u.email||'').toLowerCase()===STAFF_EMAIL;
}
function customerVisible(){
  const v=$('customerView');
  return !!v&&!v.classList.contains('hidden')&&getComputedStyle(v).display!=='none';
}

function injectStyle(){
  if($('zrParkingStyleV30'))return;
  const s=document.createElement('style');
  s.id='zrParkingStyleV30';
  s.textContent=`
#zrParkingInfoCard{margin-top:16px;border:1px solid #dde4df;border-radius:14px;background:#fff;overflow:hidden}
.zrpk30-title{padding:15px 16px 13px;font-size:17px;font-weight:900;border-bottom:1px solid #edf0ee}
.zrpk30-row{padding:15px 16px}.zrpk30-row+.zrpk30-row{border-top:1px solid #edf0ee}
.zrpk30-row h4{margin:0 0 5px;font-size:15px}.zrpk30-place{font-size:14px;font-weight:800;line-height:1.5}
.zrpk30-address{margin-top:4px;color:#5b665f;font-size:12px;line-height:1.5}
.zrpk30-maps{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.zrpk30-map{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:0 11px;border:1px solid #d4dcd6;border-radius:8px;background:#fff;color:#26342b;text-decoration:none;font-size:12px;font-weight:800}.zrpk30-map:hover{background:#f5f7f5}
.zrpk30-notes{margin:10px 0 0;padding-left:18px;color:#59645d}.zrpk30-notes li{margin:4px 0;font-size:12px;line-height:1.55}
#zrParkingAdminSection{margin-top:18px;padding:14px;border:1px solid #d9e3dc;border-radius:14px;background:#f8fbf9}#zrParkingAdminSection h3{margin:0}
.zrpk30-admin{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}.zrpk30-admin .full{grid-column:1/-1}.zrpk30-admin label{display:block;font-size:11px;font-weight:850;color:#68736b;margin-bottom:4px}.zrpk30-admin input,.zrpk30-admin textarea{width:100%;box-sizing:border-box}.zrpk30-admin textarea{min-height:78px;resize:vertical}.zrpk30-save{display:flex;justify-content:flex-end;margin-top:12px}
.zrfinal30{position:fixed;inset:0;z-index:10120;background:rgba(16,25,20,.56);display:flex;align-items:center;justify-content:center;padding:14px}.zrfinal30.hidden{display:none!important}.zrfinal30-sheet{width:min(600px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:18px;padding:18px;box-sizing:border-box}.zrfinal30-sheet h2{margin:0;font-size:20px}.zrfinal30-check{padding:9px 0;border-bottom:1px solid #edf0ee;font-size:13px;font-weight:800}.zrfinal30-parking{margin-top:14px}.zrfinal30-parking h3{margin:0 0 9px;font-size:16px}.zrfinal30-place{margin-top:9px;font-size:13px;line-height:1.55}.zrfinal30-actions{display:grid;grid-template-columns:1fr 1.7fr;gap:9px;margin-top:16px}.zrfinal30-actions button{min-height:48px;border:0;border-radius:11px;font-weight:900}.zrfinal30-back{background:#eef1ee;color:#526057}.zrfinal30-ok{background:#2f6b4f;color:#fff}
@media(max-width:650px){.zrpk30-admin{grid-template-columns:1fr}.zrpk30-admin .full{grid-column:auto}.zrfinal30-actions{grid-template-columns:1fr}}
`;
  document.head.appendChild(s);
}

function mapButtons(address){
  const u=mapUrls(address);
  return `<div class="zrpk30-maps"><a class="zrpk30-map" href="${esc(u.naver)}" target="_blank" rel="noopener noreferrer">네이버지도</a><a class="zrpk30-map" href="${esc(u.kakao)}" target="_blank" rel="noopener noreferrer">카카오맵</a></div>`;
}
function notesHtml(text){
  const a=lines(text);return a.length?`<ul class="zrpk30-notes">${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'';
}
function locationHtml(title,place,address,note){
  return `<section class="zrpk30-row"><h4>${esc(title)}</h4><div class="zrpk30-place">${esc(place)}</div><div class="zrpk30-address">${esc(address)}</div>${mapButtons(address)}${notesHtml(note)}</section>`;
}
function cardHtml(){
  const p=current;
  return `<div class="zrpk30-title">${esc(p.title)}</div>${locationHtml(p.dropoffTitle,p.dropoffPlace,p.dropoffAddress,p.dropoffNote)}${locationHtml(p.busTitle,p.busPlace,p.busAddress,p.busNote)}`;
}
function anchor(){
  const a=$('entryTime'),b=$('exitTime');if(!a||!b)return null;
  const c=[b.closest('.grid2'),b.closest('.grid'),b.parentElement?.parentElement,b.parentElement].filter(Boolean);
  return c.find(x=>x.contains(a)&&x.contains(b))||b.parentElement;
}
function renderCard(){
  let r=$('zrParkingInfoCard');
  if(!r){const a=anchor();if(!a)return false;r=document.createElement('section');r.id='zrParkingInfoCard';a.insertAdjacentElement('afterend',r)}
  r.innerHTML=cardHtml();return true;
}

const field=(label,key,value,full=false,area=false)=>`<div class="${full?'full':''}"><label>${label}</label>${area?`<textarea data-pk30="${key}">${esc(value)}</textarea>`:`<input data-pk30="${key}" value="${esc(value)}">`}</div>`;
function renderAdmin(){
  const sec=$('zrGuideAdminSection');if(!sec)return false;
  let r=$('zrParkingAdminSection');
  if(!r){r=document.createElement('section');r.id='zrParkingAdminSection';const bar=sec.querySelector('.zrga-savebar');bar?bar.insertAdjacentElement('beforebegin',r):sec.appendChild(r)}
  const p=current;
  r.innerHTML=`<h3>주차 안내 관리</h3><div class="zrga-help">장소명·주소·안내 문구를 수정할 수 있습니다. 지도 버튼은 입력한 주소로 자동 연결됩니다.</div><div class="zrpk30-admin">${field('안내 제목','title',p.title,true)}${field('승·하차 제목','dropoffTitle',p.dropoffTitle)}${field('승·하차 장소','dropoffPlace',p.dropoffPlace)}${field('승·하차 주소','dropoffAddress',p.dropoffAddress,true)}${field('승·하차 안내 문구','dropoffNote',p.dropoffNote,true,true)}${field('버스 주차 제목','busTitle',p.busTitle)}${field('버스 주차 장소','busPlace',p.busPlace)}${field('버스 주차 주소','busAddress',p.busAddress,true)}${field('버스 주차 안내 문구','busNote',p.busNote,true,true)}</div><div class="zrpk30-save"><button type="button" class="btn-primary" id="zrParkingSaveV30">주차 안내 저장</button></div>`;
  $('zrParkingSaveV30').onclick=saveParking;
  return true;
}
async function saveParking(){
  if(!isStaff())return toast('관리자 DB 로그인을 확인해주세요.');
  if(!FS||!db)return toast('주차 안내 DB 연결 중입니다.');
  const b=$('zrParkingSaveV30'),old=b?.textContent||'';if(b){b.disabled=true;b.textContent='저장 중...'}
  try{
    const o=clone(current);
    document.querySelectorAll('#zrParkingAdminSection [data-pk30]').forEach(x=>o[x.dataset.pk30]=x.value);
    const cleaned=norm(o);
    await FS.setDoc(FS.doc(db,COLLECTION,DOC_ID),{parking:cleaned,updatedAtMs:Date.now()},{merge:true});
    current=cleaned;renderCard();renderAdmin();toast('주차 안내를 저장했습니다.');
  }catch(e){console.error('parking v30 save',e);toast('주차 안내 저장에 실패했습니다.');}
  finally{if(b){b.disabled=false;b.textContent=old}}
}

function finalModal(){
  if($('zrFinalGuideModalV30'))return;
  const m=document.createElement('div');m.id='zrFinalGuideModalV30';m.className='zrfinal30 hidden';
  m.innerHTML=`<div class="zrfinal30-sheet"><h2>예약 전 최종 확인</h2><div id="zrFinalChecksV30"></div><div class="zrfinal30-parking" id="zrFinalParkingV30"></div><div class="zrfinal30-actions"><button type="button" class="zrfinal30-back" id="zrFinalBackV30">예약 내용 다시 보기</button><button type="button" class="zrfinal30-ok" id="zrFinalOkV30">확인 후 예약 신청</button></div></div>`;
  document.body.appendChild(m);
  $('zrFinalBackV30').onclick=()=>m.classList.add('hidden');
  $('zrFinalOkV30').onclick=()=>{m.classList.add('hidden');submitBypass=true;const b=pendingButton;pendingButton=null;setTimeout(()=>{b?.click?.();setTimeout(()=>submitBypass=false,180)},0)};
}
function finalLocation(title,place,address){
  return `<div class="zrfinal30-place"><b>${esc(title)}</b><br>${esc(place)}<br>${esc(address)}${mapButtons(address)}</div>`;
}
function showFinal(){
  finalModal();const play=String($('playUse')?.value||'')==='yes';
  $('zrFinalChecksV30').innerHTML=`<div class="zrfinal30-check">동물원 이용 안내 확인</div><div class="zrfinal30-check">${play?'놀이터 이용 안내 확인':'놀이터 이용 안 함'}</div>`;
  $('zrFinalParkingV30').innerHTML=`<h3>${esc(current.title)}</h3>${finalLocation(current.dropoffTitle,current.dropoffPlace,current.dropoffAddress)}${finalLocation(current.busTitle,current.busPlace,current.busAddress)}`;
  $('zrFinalGuideModalV30').classList.remove('hidden');
}
function bookingButton(b){
  const t=(b?.textContent||b?.value||'').replace(/\s+/g,'');
  return !!b&&/(예약.*(신청|완료|하기)|신청하기|예약하기)/.test(t)&&!/예약확인|추가예약/.test(t);
}
function bindFinal(){
  document.addEventListener('click',e=>{
    if(submitBypass||!customerVisible())return;
    const b=e.target?.closest?.('button,input[type="submit"],a');
    if(!bookingButton(b)||b.closest('#zrFinalGuideModalV30')||b.closest('#zrGuideModal')||b.closest('#zrPlayGuideModal'))return;
    e.preventDefault();e.stopImmediatePropagation();pendingButton=b;showFinal();
  },true);
}

async function init(){
  try{
    FS=await import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`);
    const z=window.zrReservationFirebase;if(!z?.db)throw new Error('Firebase DB bridge unavailable');db=z.db;
    if(unsub)unsub();
    unsub=FS.onSnapshot(FS.doc(db,COLLECTION,DOC_ID),snap=>{
      current=norm(snap.exists()?snap.data()?.parking:null);
      renderCard();
      if($('zrGuideAdminSection')&&!$('zrGuideAdminSection').classList.contains('hidden'))renderAdmin();
    },e=>console.error('parking v30 read',e));
  }catch(e){console.error('parking v30 init',e)}
}
function boot(){
  injectStyle();
  const cardTimer=setInterval(()=>{if(renderCard())clearInterval(cardTimer)},200);setTimeout(()=>clearInterval(cardTimer),20000);
  const adminTimer=setInterval(()=>{const t=$('zrGuideAdminTab');if(!t)return;t.addEventListener('click',()=>setTimeout(renderAdmin,80));clearInterval(adminTimer)},250);setTimeout(()=>clearInterval(adminTimer),20000);
  bindFinal();
  const wait=setInterval(()=>{if(!window.zrReservationFirebase?.auth||!window.zrReservationFirebase?.db)return;clearInterval(wait);init()},200);setTimeout(()=>clearInterval(wait),20000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
