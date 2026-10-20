(()=>{
'use strict';
if(window.ZRCafeCatalog)return;
const KEY='zr_cafe_menus',FV='12.17.1';
let F,Auth,started=false,ready=false,failed=false,revision=0,pending=null,unsub,editRevision=null;
let accepted=null;
const clone=x=>JSON.parse(JSON.stringify(x));
const bridge=()=>window.zrReservationFirebase;
const staff=()=>bridge()?.isStaff?.()===true;
const quantities=()=>Object.fromEntries([...document.querySelectorAll('#customerCafeMenus input[id^="qty_"]')].map(e=>[e.id,Math.max(0,parseInt(e.value)||0)]));
function validate(items){
  if(!Array.isArray(items)||items.length>200)throw Error('메뉴 목록을 확인해주세요.');
  const ids=new Set();
  for(const m of items){
    if(!m||typeof m.id!=='string'||!/^[-\w]+$/.test(m.id)||ids.has(m.id)||typeof m.name!=='string'||!m.name.trim()||!Number.isFinite(m.price)||m.price<0)throw Error('메뉴 이름·가격·식별자를 확인해주세요.');
    ids.add(m.id);
    if(m.photo&&!String(m.photo).startsWith('data:image/')){
      let u;try{u=new URL(m.photo)}catch{}
      if(!u||u.protocol!=='https:'||u.username||u.password)throw Error('사진은 HTTPS 이미지 주소를 입력해주세요.');
    }
  }
  if(new TextEncoder().encode(JSON.stringify(items)).length>800000)throw Error('사진 용량이 큽니다. 기존 파일 사진을 URL로 교체해주세요.');
  return clone(items);
}
function notice(){
  const host=document.getElementById('customerCafeMenus');if(!host)return;
  let box=document.getElementById('zrCafeCatalogNotice');
  if(!box){box=document.createElement('div');box.id='zrCafeCatalogNotice';box.className='calc';box.setAttribute('role','status');host.before(box)}
  box.replaceChildren();
  const message=pending?'메뉴 정보가 변경되었습니다. 최신 가격과 알레르기를 확인한 뒤 주문해주세요.':failed?'메뉴 정보를 불러오지 못했습니다. 잠시 후 다시 접속해주세요.':!ready?'최신 메뉴 정보를 확인하고 있습니다.':'';
  box.hidden=!message;if(!message)return;
  box.append(document.createTextNode(message));
  if(pending){const b=document.createElement('button');b.type='button';b.className='btn-soft';b.textContent='최신 메뉴 확인';b.style.marginTop='8px';b.onclick=()=>{const next=pending;pending=null;apply(next,true);notice()};box.append(document.createElement('br'),b)}
}
function apply(items,preserve){
  const qty=preserve?quantities():{};
  accepted=clone(items);
  const latest=items.map(x=>x.adminEditMeta).filter(Boolean).sort((a,b)=>String(b.at).localeCompare(String(a.at)))[0];window.ZRAdminEditMeta?.publish('cafe',latest);
  localStorage.setItem(KEY,JSON.stringify(items));
  window.renderCustomerCafeMenus?.();
  for(const [id,n] of Object.entries(qty)){const e=document.getElementById(id);if(e)e.value=String(n)}
  window.refreshSummary?.();
  if(staff())window.renderMenuAdmin?.();
  // Never leave an already-open allergy/photo popup showing the old catalog.
  const modal=document.getElementById('menuDetailModal');
  if(modal&&!modal.classList.contains('hidden'))window.closeModal?.('menuDetailModal');
}
function receive(data){
  ready=true;failed=false;
  if(!data){revision=0;notice();return}
  const items=validate(data.items);revision=Number(data.revision)||0;
  if(JSON.stringify(items)===JSON.stringify(accepted)){pending=null;notice();return}
  if(!staff()&&Object.values(quantities()).some(n=>n>0)){pending=items;notice();return}
  pending=null;apply(items,false);notice();
}
async function save(items){
  if(!ready||failed||!F||!staff())throw Error('공용 메뉴 연결과 관리자 로그인을 확인해주세요.');
  const clean=validate(items),expected=editRevision??revision,z=bridge(),saveUid=z.auth.currentUser?.uid;
  try{await F.runTransaction(z.db,async tx=>{
    const ref=F.doc(z.db,'cafeCatalog','current'),snap=await tx.get(ref);
    if((snap.exists()?Number(snap.data().revision)||0:0)!==expected)throw Error('다른 관리자가 메뉴를 변경했습니다. 메뉴를 다시 열어 저장해주세요.');
    if(z.auth.currentUser?.uid!==saveUid)throw Error('관리자 로그인이 변경되었습니다.');
    tx.set(ref,{items:clean,revision:expected+1,updatedAt:F.serverTimestamp()});
  })}catch(e){
    if(e?.code){
      const denied=String(e.code).endsWith('permission-denied');
      throw Error(denied?'메뉴 저장 권한을 확인해주세요. 관리자 로그인 후 다시 시도해주세요.':'메뉴를 저장하지 못했습니다. 인터넷 연결을 확인한 뒤 다시 저장해주세요. 입력한 내용은 유지됩니다.');
    }
    throw e;
  }
  if(z.auth.currentUser?.uid!==saveUid)throw Error('관리자 로그인이 변경되었습니다.');
  editRevision=null;
  // A newer server snapshot may arrive before this transaction promise resolves.
  if(revision<=expected+1){revision=expected+1;apply(clean,true)}
}
function validationError(){
  if(!ready||failed)return '최신 메뉴 연결을 확인한 뒤 다시 신청해주세요.';
  return pending?'변경된 카페 메뉴를 확인한 뒤 다시 신청해주세요.':'';
}
window.ZRCafeCatalog=Object.freeze({save,validationError,beginEdit(){editRevision=revision},read(fallback){if(accepted===null)accepted=clone(fallback);return clone(accepted)}});
async function start(){
  if(started||!bridge()?.auth||!bridge()?.db)return;started=true;
  try{
    [F,Auth]=await Promise.all([import(`https://www.gstatic.com/firebasejs/${FV}/firebase-firestore.js`),import(`https://www.gstatic.com/firebasejs/${FV}/firebase-auth.js`)]);
    let generation=0;
    Auth.onAuthStateChanged(bridge().auth,user=>{
      const token=++generation;
      unsub?.();ready=false;pending=null;notice();if(!user)return;
      unsub=F.onSnapshot(F.doc(bridge().db,'cafeCatalog','current'),{includeMetadataChanges:true},snap=>{
        if(token!==generation||bridge().auth.currentUser?.uid!==user.uid)return;
        if(snap.metadata.fromCache){ready=false;notice();return}
        if(snap.metadata.hasPendingWrites)return;
        try{receive(snap.exists()?snap.data():null)}catch{failed=true;notice()}
      },()=>{if(token!==generation)return;failed=true;ready=false;notice()});
    });
  }catch{started=false;failed=true;notice()}
}
document.addEventListener('zr:customer-firebase-ready',start);
document.addEventListener('zr:reservation-firebase-ready',start);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{notice();start()},{once:true});else{notice();start()}
})();
