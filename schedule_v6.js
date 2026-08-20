import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged,
  setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import {
  getFirestore, collection, doc, query, where, onSnapshot,
  setDoc, getDocs, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

"use strict";

const firebaseConfig = {
  apiKey: "AIzaSyCAjvuTrFVGTyciwAgsbnBonkWCDSt47g0",
  authDomain: "zoolung-dongtan-schedule.firebaseapp.com",
  projectId: "zoolung-dongtan-schedule",
  storageBucket: "zoolung-dongtan-schedule.firebasestorage.app",
  messagingSenderId: "1031198289899",
  appId: "1:1031198289899:web:00f4facaf47fc8c1f5b3ae",
  measurementId: "G-GZ4BPNB5KP"
};

const STAFF_EMAIL="zoolung09@zoolungzoolung.com";
const PK="zr_schedule_date_v2", START_MIN=600, MAX_PICK=1080, SLOT=15;
const T={f4:["4F 베이직","f4"],f5:["5F 워터가든","f5"],meal:["식사","meal"],play:["놀이터","play"],free:["자율관람","free"]};
const $=x=>document.getElementById(x);
const pad=n=>String(n).padStart(2,"0");
const tm=m=>pad(Math.floor(m/60))+":"+pad(m%60);
const min=t=>{if(!t)return null;let a=t.split(":").map(Number);return a[0]*60+a[1]};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const id=()=>"g"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const today=()=>{let d=new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())};
const shift=(s,n)=>{let d=new Date(s+"T12:00:00");d.setDate(d.getDate()+n);return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())};
const localGet=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
const localSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const clone=v=>JSON.parse(JSON.stringify(v));
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const cleanObj=o=>Object.fromEntries(Object.entries(o).filter(([,v])=>v!==undefined));

const app=initializeApp(firebaseConfig);
const auth=getAuth(app);
const db=getFirestore(app);

let data={groups:[],sharedMemos:{}};
let date=localGet(PK,today()), editMode=false, eid=null, draft=null, detailOriginal=null, contentState=null, cafeEditGid=null;
let unsubGroups=null, unsubMemo=null;

function setSync(text,state="wait"){
  if(!$("syncStatus"))return;
  $("syncStatus").textContent="● "+text;
  $("syncStatus").className="pill syncPill "+state;
}
function toast(s){$("toast").textContent=s;$("toast").classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>$("toast").classList.remove("show"),1700)}
function normalizeGroup(raw){
  let g={...raw};
  if(g.actualPaid===undefined)g.actualPaid=(g.act!==undefined&&g.act!=="")?g.act:"";
  if(g.actualChap===undefined)g.actualChap="";
  if(g.mealLoc===undefined)g.mealLoc="";
  if(g.cafeDetail===undefined)g.cafeDetail="";
  if(g.appearance===undefined)g.appearance="";
  if(g.cancelled===undefined)g.cancelled=false;
  if(g.memo===undefined)g.memo="";
  if(g.pay===undefined)g.pay=false;
  if(g.book===undefined)g.book=false;
  if(!Array.isArray(g.segments))g.segments=segs(["f4","meal","play","f5"]);
  return g;
}
function segs(order){
  let a=["10:30","11:15","12:00","12:45"],b=["11:15","12:00","12:45","13:30"];
  return order.map((x,i)=>({id:id(),type:x,start:a[i],end:b[i]}));
}
function list(){
  return data.groups.filter(g=>g.date===date)
    .sort((a,b)=>String(a.ps||"99:99").localeCompare(String(b.ps||"99:99"))||String(a.org||"").localeCompare(String(b.org||""),"ko"));
}
function axisFor(groups){
  let used=[900];
  groups.forEach(g=>{
    [g.ps,g.pe,g.eta,g.aend].forEach(t=>{let m=min(t);if(m!=null)used.push(m)});
    (g.segments||[]).forEach(s=>{let a=min(s.start),b=min(s.end);if(a!=null)used.push(a);if(b!=null)used.push(b)});
  });
  let mx=Math.max(...used),end=Math.max(900,Math.ceil(mx/60)*60);
  end=Math.min(MAX_PICK,end);
  return {start:START_MIN,end};
}
function pct(t,axis){let m=min(t);if(m==null)return 0;return Math.max(0,Math.min(100,(m-axis.start)/(axis.end-axis.start)*100))}
function rulerHtml(axis){
  let span=axis.end-axis.start,step=span>360?60:30;
  let h='<div class="grid" style="background-size:'+((SLOT/span)*100)+'% 100%"></div>';
  for(let m=axis.start;m<=axis.end;m+=step){
    let p=(m-axis.start)/span*100,cl=m===axis.start?" first":m===axis.end?" end":"";
    h+=`<span class="tick${cl}" style="left:${p}%">${tm(m)}</span>`;
  }
  return h;
}
function renderRuler(axis){$("ruler").innerHTML=rulerHtml(axis);$("rangeTxt").textContent=tm(axis.start)+"~"+tm(axis.end)}
function segHtml(s,axis,attrs=""){
  let tt=T[s.type]||T.free,w=Math.max(1,pct(s.end,axis)-pct(s.start,axis));
  return `<div class="seg ${tt[1]}" ${attrs} style="left:${pct(s.start,axis)}%;width:${w}%"><b>${tt[0]}</b>${w>=10?`<small>${s.start}~${s.end}</small>`:""}</div>`;
}

function render(){
  $("date").value=date;
  let a=list(),axis=axisFor(a),n=new Date();renderRuler(axis);
  let active=a.filter(g=>!g.cancelled),cancelled=a.filter(g=>g.cancelled);
  $("teams").textContent=active.length+"팀";$("cancelledCount").textContent=cancelled.length+"팀";
  $("reserved").textContent=active.reduce((s,g)=>s+Number(g.res||0),0)+"명";
  $("actualPaidSum").textContent=active.reduce((s,g)=>s+(g.actualPaid===""?0:Number(g.actualPaid||0)),0)+"명";
  $("actualChapSum").textContent=active.reduce((s,g)=>s+(g.actualChap===""?0:Number(g.actualChap||0)),0)+"명";
  $("nowtxt").textContent="현재 "+pad(n.getHours())+":"+pad(n.getMinutes());
  document.body.classList.toggle("viewLocked",!editMode);
  $("toolbar").classList.toggle("editing",editMode);
  $("editLock").className="editLock "+(editMode?"unlocked":"locked");
  $("editLock").textContent=editMode?"🔓 수정 가능":"🔒 수정 불가";
  if(!a.length){$("list").innerHTML='<div class="empty">등록된 단체 스케줄이 없습니다.</div>';return}
  let nowm=n.getHours()*60+n.getMinutes(),np=date===today()&&nowm>=axis.start&&nowm<=axis.end?(nowm-axis.start)/(axis.end-axis.start)*100:null;
  $("list").innerHTML=a.map(g=>{
    let ss=(g.segments||[]).map(s=>segHtml(s,axis,`data-seg="${s.id}" data-g="${g.id}"`)).join("");
    let cafe=String(g.meal||"").includes("카페"),mealClass=cafe?"tag mealTag cafe":"tag mealTag";
    return `<article class="card ${editMode?"editable":""} ${g.cancelled?"cancelled":""}">
    <div class="head"><div class="org">${esc(g.org)}</div><span class="tag">${g.res}(${g.tea})명</span><span class="${mealClass}" ${cafe?`data-cafe="${g.id}"`:""}>${esc(g.meal||"")}</span>${!String(g.meal||"").includes("식사없음")?`<span class="tag locTag ${g.mealLoc?"hasLoc":"noLoc"}" data-loc="${g.id}" title="식사위치">📍 ${esc(g.mealLoc||"식사위치")}</span>`:""}<span class="tag appearanceTag ${g.appearance?"hasAppearance":"noAppearance"}" data-a="${g.id}" title="아이들 인상착의">👕 ${esc(g.appearance||"인상착의")}</span>${g.cancelled?'<span class="tag cancelTag">당일취소</span>':""}<button class="soft detail" data-e="${g.id}">상세</button></div>
    <div class="meta"><span class="planT" data-q="plan" data-id="${g.id}">예약 ${g.ps}~${g.pe}</span><span class="live ${g.eta?"has":""}" data-q="eta" data-id="${g.id}">도착예정 ${g.eta||"--:--"}</span><span class="live ${g.aend?"has":""}" data-q="aend" data-id="${g.id}">퇴장예정 ${g.aend||"--:--"}</span><span class="live ${g.actualPaid!==""?"has":""}" data-q="actualPaid" data-id="${g.id}">유료 ${g.actualPaid!==""?g.actualPaid+"명":"--"}</span><span class="live ${g.actualChap!==""?"has":""}" data-q="actualChap" data-id="${g.id}">인솔 ${g.actualChap!==""?g.actualChap+"명":"--"}</span><div class="quick"><button class="check ${g.pay?"on":""}" data-c="pay" data-id="${g.id}">${g.pay?"✓ ":""}결제</button><button class="check ${g.book?"on":""}" data-c="book" data-id="${g.id}">${g.book?"✓ ":""}컬러북</button></div></div>
    <div class="timeline"><div class="grid" style="background-size:${(SLOT/(axis.end-axis.start))*100}% 100%"></div>${ss}${np==null?"":`<div class="now" style="left:${np}%"></div>`}</div>
    <div class="memo" data-m="${g.id}"><b>메모</b>${esc(g.memo||"메모 없음 · 눌러서 입력")}</div></article>`;
  }).join("");

  document.querySelectorAll("[data-e]").forEach(x=>x.onclick=()=>editMode?openDetail(x.dataset.e):lockedMsg());
  document.querySelectorAll("[data-m]").forEach(x=>x.onclick=()=>{if(!editMode)return lockedMsg();openDetail(x.dataset.m);setTimeout(()=>$("memo").focus(),80)});
  document.querySelectorAll("[data-c]").forEach(x=>x.onclick=async()=>{
    if(!editMode)return lockedMsg();
    let g=data.groups.find(z=>z.id===x.dataset.id);if(!g)return;
    let field=x.dataset.c, old=g[field];g[field]=!g[field];render();
    try{await savePatch(g.id,{[field]:g[field]})}catch(e){g[field]=old;render();writeError(e)}
  });
  document.querySelectorAll("[data-seg]").forEach(x=>x.onclick=()=>{if(!editMode)return lockedMsg();openContentEditor(x.dataset.g)});
  document.querySelectorAll("[data-q]").forEach(x=>x.onclick=()=>{if(!editMode)return lockedMsg();quickField(x.dataset.id,x.dataset.q)});
  document.querySelectorAll("[data-cafe]").forEach(x=>x.onclick=e=>{e.stopPropagation();openCafe(x.dataset.cafe)});
  document.querySelectorAll("[data-loc]").forEach(x=>x.onclick=e=>{e.stopPropagation();if(!editMode)return lockedMsg();quickField(x.dataset.loc,"mealLoc")});
  document.querySelectorAll("[data-a]").forEach(x=>x.onclick=()=>{if(!editMode)return lockedMsg();quickField(x.dataset.a,"appearance")});
}
function lockedMsg(){toast("상단에서 '수정 가능'을 먼저 켜주세요.")}
$("editLock").onclick=()=>{editMode=!editMode;render();toast(editMode?"수정 가능 상태입니다.":"수정을 잠갔습니다.")};

async function savePatch(gid,patch){
  setSync("저장 중","wait");
  await setDoc(doc(db,"scheduleGroups",gid),cleanObj({...patch,updatedAt:serverTimestamp()}),{merge:true});
  setSync("실시간 연결됨","ok");
}
function writeError(e){
  console.error(e);setSync("저장 오류","err");
  toast("저장에 실패했습니다. Firebase 설정을 확인해주세요.");
}
async function quickField(gid,kind){
  let g=data.groups.find(z=>z.id===gid);if(!g)return;
  let old=clone(g[kind]);
  if(kind==="actualPaid"||kind==="actualChap"){
    let label=kind==="actualPaid"?"유료인원":"인솔자인원",v=prompt(label,g[kind]===""?"":g[kind]);if(v===null)return;
    g[kind]=v===""?"":Math.max(0,Number(v||0));
  } else if(kind==="eta"||kind==="aend"){
    let label=kind==="eta"?"도착예정":"퇴장예정",cur=g[kind]||"",v=prompt(label+" 시간 (예: 15:30)",cur);if(v===null)return;
    if(v!==""&&!/^\d{2}:\d{2}$/.test(v))return toast("시간을 15:30 형식으로 입력해주세요.");
    g[kind]=v;
  } else if(kind==="mealLoc"){
    let v=prompt("식사위치",g.mealLoc||"");if(v===null)return;g.mealLoc=v.trim();
  } else if(kind==="appearance"){
    let v=prompt("아이들 인상착의",g.appearance||"");if(v===null)return;g.appearance=v.trim();
  } else if(kind==="plan"){openDetail(gid);return}
  render();
  try{await savePatch(gid,{[kind]:g[kind]})}catch(e){g[kind]=old;render();writeError(e)}
}

function fill(el,blank){let h=blank?'<option value="">--:--</option>':"";for(let m=START_MIN;m<=MAX_PICK;m+=SLOT){let t=tm(m);h+=`<option value="${t}">${t}</option>`}el.innerHTML=h}
["ps","pe"].forEach(x=>fill($(x),false));["eta","aend"].forEach(x=>fill($(x),true));
function fresh(){return {id:id(),date,org:"",res:15,tea:0,actualPaid:"",actualChap:"",ps:"10:30",pe:"14:00",eta:"",aend:"",meal:"도시락",mealLoc:"",cafeDetail:"",appearance:"",pay:false,book:false,memo:"",cancelled:false,cancelledAt:"",segments:segs(["f4","meal","play","f5"])}}
function openDetail(i){
  if(!editMode)return lockedMsg();
  eid=i||null;draft=clone(i?data.groups.find(g=>g.id===i):fresh());detailOriginal=clone(draft);
  $("detailTitle").textContent=i?"단체 상세 수정":"단체 스케줄 추가";
  ["org","res","tea","actualPaid","actualChap","ps","pe","eta","aend","meal","mealLoc","cafeDetail","memo","appearance"].forEach(k=>$(k).value=draft[k]??"");
  refreshDetailChecks();refreshCancelBtn();$("detailModal").classList.remove("hidden");
}
function refreshDetailChecks(){$("pay").classList.toggle("on",draft.pay);$("pay").textContent="결제완료 "+(draft.pay?"✓":"□");$("book").classList.toggle("on",draft.book);$("book").textContent="컬러북 제공 "+(draft.book?"✓":"□")}
function refreshCancelBtn(){let b=$("cancelToggle");b.classList.toggle("active",!!draft.cancelled);b.textContent=draft.cancelled?"↩ 취소 해제":"당일취소"}
$("pay").onclick=()=>{draft.pay=!draft.pay;refreshDetailChecks()};
$("book").onclick=()=>{draft.book=!draft.book;refreshDetailChecks()};
$("cancelToggle").onclick=()=>{draft.cancelled=!draft.cancelled;draft.cancelledAt=draft.cancelled?new Date().toISOString():"";refreshCancelBtn()};
$("detailSave").onclick=async()=>{
  ["org","res","tea","actualPaid","actualChap","ps","pe","eta","aend","meal","mealLoc","cafeDetail","memo","appearance"].forEach(k=>draft[k]=$(k).value);
  draft.res=Number(draft.res||0);draft.tea=Number(draft.tea||0);
  draft.actualPaid=draft.actualPaid===""?"":Number(draft.actualPaid||0);draft.actualChap=draft.actualChap===""?"":Number(draft.actualChap||0);
  if(!draft.org)return toast("단체명을 입력해주세요.");
  if(min(draft.pe)<=min(draft.ps))return toast("퇴장시간을 도착시간보다 늦게 설정해주세요.");
  try{
    if(!eid){
      await setDoc(doc(db,"scheduleGroups",draft.id),cleanObj({...draft,updatedAt:serverTimestamp(),createdAt:serverTimestamp()}));
    }else{
      const keys=["org","res","tea","actualPaid","actualChap","ps","pe","eta","aend","meal","mealLoc","cafeDetail","memo","appearance","pay","book","cancelled","cancelledAt"];
      let patch={};keys.forEach(k=>{if(!eq(draft[k],detailOriginal[k]))patch[k]=draft[k]});
      if(Object.keys(patch).length)await savePatch(eid,patch);
    }
    $("detailModal").classList.add("hidden");toast("저장했습니다.");
  }catch(e){writeError(e)}
};
$("detailClose").onclick=()=>$("detailModal").classList.add("hidden");
$("detailModal").onclick=e=>{if(e.target===$("detailModal"))$("detailModal").classList.add("hidden")};

function opts(v){let h="";for(let m=START_MIN;m<=MAX_PICK;m+=SLOT){let t=tm(m);h+=`<option value="${t}" ${t===v?"selected":""}>${t}</option>`}return h}
function contentAxis(){let all=[...contentState.original,...contentState.changed],used=[900];all.forEach(s=>{used.push(min(s.start),min(s.end))});let end=Math.max(900,Math.ceil(Math.max(...used.filter(x=>x!=null))/60)*60);return {start:START_MIN,end:Math.min(MAX_PICK,end)}}
function preview(rulerId,timelineId,segsArr,axis){$(rulerId).innerHTML=rulerHtml(axis);$(timelineId).innerHTML='<div class="grid" style="background-size:'+((SLOT/(axis.end-axis.start))*100)+'% 100%"></div>'+segsArr.map(s=>segHtml(s,axis)).join("")}
function updateContentPreview(){let axis=contentAxis();preview("originalRuler","originalTimeline",contentState.original,axis);preview("changedRuler","changedTimeline",contentState.changed,axis)}
function openContentEditor(gid){let g=data.groups.find(z=>z.id===gid);if(!g)return;contentState={gid,original:clone(g.segments||[]),changed:clone(g.segments||[])};$("contentTitle").textContent=g.org+" · 컨텐츠 스케줄";renderContentRows();updateContentPreview();$("contentModal").classList.remove("hidden")}
function renderContentRows(){$("contentRows").innerHTML=contentState.changed.map((s,i)=>{let tt=T[s.type]||T.free;return `<div class="contentRow" data-i="${i}"><div class="contentName ${tt[1]}">${tt[0]}</div><div><label>시작</label><select data-k="start">${opts(s.start)}</select></div><div><label>종료</label><select data-k="end">${opts(s.end)}</select></div></div>`}).join("");document.querySelectorAll(".contentRow").forEach(r=>r.querySelectorAll("select").forEach(sel=>sel.onchange=()=>{let i=Number(r.dataset.i);contentState.changed[i][sel.dataset.k]=sel.value;updateContentPreview()}))}
function validateContent(){let arr=contentState.changed.map(s=>({...s,a:min(s.start),b:min(s.end)}));for(let s of arr)if(s.b<=s.a)return "종료시간은 시작시간보다 늦어야 합니다.";let sorted=[...arr].sort((x,y)=>x.a-y.a);for(let i=1;i<sorted.length;i++)if(sorted[i].a<sorted[i-1].b)return "같은 단체의 컨텐츠 시간이 겹쳐요.";return ""}
$("contentSave").onclick=async()=>{
  let err=validateContent();if(err)return toast(err);let g=data.groups.find(z=>z.id===contentState.gid);if(!g)return;
  let changed=clone(contentState.changed),old=clone(g.segments);g.segments=changed;render();
  try{await savePatch(g.id,{segments:changed});$("contentModal").classList.add("hidden");contentState=null;toast("컨텐츠 시간을 저장했습니다.")}
  catch(e){g.segments=old;render();writeError(e)}
};
$("contentCancel").onclick=$("contentClose").onclick=()=>{$("contentModal").classList.add("hidden");contentState=null};
$("contentModal").onclick=e=>{if(e.target===$("contentModal")){$("contentModal").classList.add("hidden");contentState=null}};

function openCafe(gid){
  let g=data.groups.find(z=>z.id===gid);if(!g)return;cafeEditGid=gid;
  $("cafeTitle").textContent=g.org+" · 카페 주문";$("cafeEdit").value=g.cafeDetail||"";
  $("cafeEdit").readOnly=!editMode;$("cafeSave").classList.toggle("hidden",!editMode);
  $("cafeLockHint").textContent=editMode?"수정 후 저장하면 바로 반영됩니다.":"현재 수정 불가 상태입니다. 상단에서 수정 가능을 켜면 메뉴를 수정할 수 있습니다.";
  $("cafeModal").classList.remove("hidden");
}
$("cafeSave").onclick=async()=>{
  if(!editMode)return lockedMsg();let g=data.groups.find(z=>z.id===cafeEditGid);if(!g)return;
  let old=g.cafeDetail,value=$("cafeEdit").value.trim();g.cafeDetail=value;render();
  try{await savePatch(g.id,{cafeDetail:value});$("cafeModal").classList.add("hidden");toast("카페 주문을 저장했습니다.")}
  catch(e){g.cafeDetail=old;render();writeError(e)}
};
$("cafeClose").onclick=()=>{$("cafeModal").classList.add("hidden");cafeEditGid=null};
$("cafeModal").onclick=e=>{if(e.target===$("cafeModal")){$("cafeModal").classList.add("hidden");cafeEditGid=null}};

$("fab").onclick=()=>openDetail();

async function refreshFromServer(){
  if(!auth.currentUser)return;
  try{
    setSync("새로고침 중","wait");
    const q=query(collection(db,"scheduleGroups"),where("date","==",date));
    const snap=await getDocs(q);data.groups=snap.docs.map(d=>normalizeGroup({id:d.id,...d.data()}));
    const memoSnap=await getDoc(doc(db,"scheduleSharedMemos",date));data.sharedMemos[date]=memoSnap.exists()?(memoSnap.data().text||""):"";
    render();setSync("실시간 연결됨","ok");toast("공용 데이터를 새로고침했습니다.");
  }catch(e){writeError(e)}
}
$("refreshBtn").onclick=refreshFromServer;

function openSharedMemo(){
  $("sharedMemoTitle").textContent="공용 메모";$("sharedMemoDate").textContent=date;$("sharedMemoText").value=data.sharedMemos?.[date]||"";
  $("sharedMemoText").readOnly=!editMode;$("sharedMemoSave").classList.toggle("hidden",!editMode);
  $("sharedMemoHint").textContent=editMode?"이 날짜의 공용 메모를 수정할 수 있습니다.":"현재는 보기 전용입니다. 수정하려면 상단에서 수정 가능을 켜주세요.";
  $("sharedMemoModal").classList.remove("hidden");
}
$("sharedMemoBtn").onclick=openSharedMemo;
$("sharedMemoSave").onclick=async()=>{
  if(!editMode)return lockedMsg();let value=$("sharedMemoText").value.trim(),old=data.sharedMemos[date]||"";data.sharedMemos[date]=value;
  try{setSync("저장 중","wait");await setDoc(doc(db,"scheduleSharedMemos",date),{text:value,updatedAt:serverTimestamp()},{merge:true});$("sharedMemoModal").classList.add("hidden");setSync("실시간 연결됨","ok");toast("공용 메모를 저장했습니다.")}
  catch(e){data.sharedMemos[date]=old;writeError(e)}
};
$("sharedMemoClose").onclick=()=>$("sharedMemoModal").classList.add("hidden");
$("sharedMemoModal").onclick=e=>{if(e.target===$("sharedMemoModal"))$("sharedMemoModal").classList.add("hidden")};

function stopListeners(){if(unsubGroups){unsubGroups();unsubGroups=null}if(unsubMemo){unsubMemo();unsubMemo=null}}
function startListeners(){
  if(!auth.currentUser)return;stopListeners();setSync("연결 중","wait");
  const q=query(collection(db,"scheduleGroups"),where("date","==",date));
  unsubGroups=onSnapshot(q,snap=>{data.groups=snap.docs.map(d=>normalizeGroup({id:d.id,...d.data()}));setSync("실시간 연결됨","ok");render()},e=>writeError(e));
  unsubMemo=onSnapshot(doc(db,"scheduleSharedMemos",date),snap=>{data.sharedMemos[date]=snap.exists()?(snap.data().text||""):"";setSync("실시간 연결됨","ok")},e=>writeError(e));
}
function setdate(d){date=d;localSet(PK,date);render();if(auth.currentUser)startListeners()}
$("date").onchange=()=>setdate($("date").value);$("prev").onclick=()=>setdate(shift(date,-1));$("next").onclick=()=>setdate(shift(date,1));$("today").onclick=()=>setdate(today());

async function login(){
  let pw=$("pw").value;if(!pw)return;
  $("pwerr").classList.add("hidden");$("loginBtn").disabled=true;$("loginBtn").textContent="로그인 중...";
  try{await setPersistence(auth,browserLocalPersistence);await signInWithEmailAndPassword(auth,STAFF_EMAIL,pw);$("pw").value=""}
  catch(e){console.error(e);$("pwerr").textContent="로그인에 실패했습니다. 이메일/비밀번호 인증 설정을 확인해주세요.";$("pwerr").classList.remove("hidden")}
  finally{$("loginBtn").disabled=false;$("loginBtn").textContent="로그인"}
}
$("loginBtn").onclick=login;$("pw").onkeydown=e=>{if(e.key==="Enter")login()};

onAuthStateChanged(auth,user=>{
  if(user&&String(user.email||"").toLowerCase()===STAFF_EMAIL.toLowerCase()){$("login").classList.add("hidden");startListeners()}
  else{stopListeners();data.groups=[];$("login").classList.remove("hidden");setSync("로그인 필요","wait");render()}
});

render();setInterval(()=>render(),60000);
