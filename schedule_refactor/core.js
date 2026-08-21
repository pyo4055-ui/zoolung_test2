import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged,
  setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import {
  getFirestore, collection, doc, query, where, onSnapshot,
  setDoc, getDocs, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

export const firebaseConfig={
  apiKey:"AIzaSyCAjvuTrFVGTyciwAgsbnBonkWCDSt47g0",
  authDomain:"zoolung-dongtan-schedule.firebaseapp.com",
  projectId:"zoolung-dongtan-schedule",
  storageBucket:"zoolung-dongtan-schedule.firebasestorage.app",
  messagingSenderId:"1031198289899",
  appId:"1:1031198289899:web:00f4facaf47fc8c1f5b3ae",
  measurementId:"G-GZ4BPNB5KP"
};
export const STAFF_EMAIL="zoolung09@zoolungzoolung.com";
export const PK="zr_schedule_date_v2",START_MIN=600,MAX_PICK=1080,SLOT=15;
export const T={
  f4:["4F 베이직","f4"],
  f5:["5F 워터가든","f5"],
  meal:["식사","meal"],
  play:["놀이터","play"],
  free:["자율관람","free"]
};
export const DEFAULT_CATALOG={
  f4:{name:"4F 베이직",color:"#f8d7bf"},
  f5:{name:"5F 워터가든",color:"#cfe7f7"},
  meal:{name:"식사",color:"#fff0a8"},
  play:{name:"놀이터",color:"#d8efc9"},
  free:{name:"자율관람",color:"#edf0ed"}
};
export const SHORT={f4:"4F",f5:"5F",meal:"식",play:"놀",free:"자율"};
export const $=x=>document.getElementById(x);
export const pad=n=>String(n).padStart(2,"0");
export const tm=m=>pad(Math.floor(m/60))+":"+pad(m%60);
export const min=t=>{if(!t)return null;const a=String(t).split(":").map(Number);return a[0]*60+a[1]};
export const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
export const makeId=()=>"g"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
export const today=()=>{const d=new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())};
export const shift=(s,n)=>{const d=new Date(s+"T12:00:00");d.setDate(d.getDate()+n);return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())};
export const localGet=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
export const localSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
export const clone=v=>JSON.parse(JSON.stringify(v));
export const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export const cleanObj=o=>Object.fromEntries(Object.entries(o).filter(([,v])=>v!==undefined));
export const tel=s=>String(s||"").replace(/[^0-9+]/g,"");

export const firebaseApp=initializeApp(firebaseConfig);
export const auth=getAuth(firebaseApp);
export const db=getFirestore(firebaseApp);
export const F={
  signInWithEmailAndPassword,onAuthStateChanged,setPersistence,browserLocalPersistence,
  collection,doc,query,where,onSnapshot,setDoc,getDocs,getDoc,serverTimestamp
};

export const state={
  data:{groups:[],sharedMemos:{}},
  date:localGet(PK,today()),
  editMode:false,
  eid:null,
  draft:null,
  detailOriginal:null,
  contentState:null,
  cafeEditGid:null,
  unsubGroups:null,
  unsubMemo:null,
  unsubCatalog:null,
  catalog:new Map(Object.entries(DEFAULT_CATALOG)),
  activeContentGid:""
};

export function setSync(text,status="wait"){
  if(!$("syncStatus"))return;
  $("syncStatus").textContent="● "+text;
  $("syncStatus").className="pill syncPill "+status;
}
export function toast(msg){
  const t=$("toast");if(!t)return;
  t.textContent=msg;t.classList.add("show");
  clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),1700);
}
export function segs(order){
  const a=["10:30","11:15","12:00","12:45"],b=["11:15","12:00","12:45","13:30"];
  return order.map((type,i)=>({id:makeId(),type,start:a[i],end:b[i]}));
}
export function normalizeGroup(raw){
  const g={...raw};
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
export function currentList(){
  return state.data.groups
    .filter(g=>g.date===state.date)
    .sort((a,b)=>String(a.ps||"99:99").localeCompare(String(b.ps||"99:99"))||String(a.org||"").localeCompare(String(b.org||""),"ko"));
}
export async function savePatch(gid,patch){
  setSync("저장 중","wait");
  await F.setDoc(F.doc(db,"scheduleGroups",gid),cleanObj({...patch,updatedAt:F.serverTimestamp()}),{merge:true});
  setSync("실시간 연결됨","ok");
}
export function writeError(e){
  console.error(e);
  setSync("저장 오류","err");
  toast("저장에 실패했습니다. Firebase 설정을 확인해주세요.");
}
