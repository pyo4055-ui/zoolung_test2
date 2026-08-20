import { getApps } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const $=id=>document.getElementById(id);
let db=null,auth=null,bound=false;

function toast(msg){
  const t=$('toast');if(!t)return;
  t.textContent=msg;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),1700);
}
function setSync(text,state='wait'){
  const e=$('syncStatus');if(!e)return;
  e.textContent='● '+text;e.className='pill syncPill '+state;
}
function currentDate(){return $('date')?.value||''}
async function openMemo(){
  const d=currentDate();if(!d)return;
  $('sharedMemoTitle').textContent='공용 메모';$('sharedMemoDate').textContent=d;
  $('sharedMemoText').readOnly=false;$('sharedMemoSave').classList.remove('hidden');
  $('sharedMemoHint').textContent='수정 잠금과 관계없이 공용 메모를 수정할 수 있습니다.';
  $('sharedMemoModal').classList.remove('hidden');
  if(!db||!auth?.currentUser)return;
  try{
    const snap=await getDoc(doc(db,'scheduleSharedMemos',d));
    if(currentDate()===d)$('sharedMemoText').value=snap.exists()?(snap.data().text||''):'';
  }catch(e){console.debug('shared memo load',e)}
}
async function saveMemo(){
  const d=$('sharedMemoDate')?.textContent||currentDate();if(!d||!db||!auth?.currentUser)return toast('공용 DB 연결을 확인해주세요.');
  const value=$('sharedMemoText').value.trim();
  try{
    setSync('저장 중','wait');
    await setDoc(doc(db,'scheduleSharedMemos',d),{text:value,updatedAt:serverTimestamp()},{merge:true});
    $('sharedMemoModal').classList.add('hidden');setSync('실시간 연결됨','ok');toast('공용 메모를 저장했습니다.');
  }catch(e){console.error('shared memo save',e);setSync('저장 오류','err');toast('공용 메모 저장에 실패했습니다.');}
}
function bind(){
  if(bound)return;
  const b=$('sharedMemoBtn'),s=$('sharedMemoSave');if(!b||!s)return;
  b.onclick=openMemo;s.onclick=saveMemo;bound=true;
}
function boot(){
  const t=setInterval(()=>{
    if(!getApps().length)return;
    auth=getAuth(getApps()[0]);db=getFirestore(getApps()[0]);
    bind();if(bound)clearInterval(t);
  },200);
  setTimeout(()=>clearInterval(t),15000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
