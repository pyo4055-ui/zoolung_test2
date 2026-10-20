import {state,$,START_MIN,MAX_PICK,SLOT,tm,min,clone,eq,cleanObj,F,db,savePatch,writeError,toast,segs,makeId} from './core.js?v=release-1792536903563';
let render=()=>{},lockedMsg=()=>{};
export function initDetail(ctx){render=ctx.render;lockedMsg=ctx.lockedMsg;function fill(el,blank){let h=blank?'<option value="">--:--</option>':"";for(let m=START_MIN;m<=MAX_PICK;m+=SLOT){const t=tm(m);h+=`<option value="${t}">${t}</option>`}el.innerHTML=h}["ps","pe"].forEach(x=>fill($(x),false));["eta","aend"].forEach(x=>fill($(x),true));$("pay").onclick=()=>{state.draft.pay=!state.draft.pay;checks()};$("book").onclick=()=>{state.draft.book=!state.draft.book;checks()};$("cancelToggle").onclick=()=>{state.draft.cancelled=!state.draft.cancelled;state.draft.cancelledAt=state.draft.cancelled?new Date().toISOString():"";cancelBtn()};$("detailSave").onclick=saveDetail;$("detailClose").onclick=closeDetail;$("cafeSave").onclick=saveCafe;$("cafeClose").onclick=closeCafe;$("cafeModal").onclick=e=>{if(e.target===$("cafeModal"))closeCafe()};$("fab").onclick=()=>openDetail()}
function mealOptions(value=''){const options=[{value:'',label:'미지정'},{value:'자리배정 없음',label:'자리배정 없음'},...window.ZRMealSeatAllocation.catalog.map(([place,rule])=>({value:place,label:place+' · '+rule.split(' · ')[0]}))];if(value&&!options.some(x=>x.value===value))options.push({value,label:value+' (기존 배정)'});return options}
function fillMealOptions(value){const select=$('mealLoc');select.replaceChildren();for(const item of mealOptions(value)){const option=document.createElement('option');option.value=item.value;option.textContent=item.label;select.append(option)}}
function fresh(){return {id:makeId(),date:state.date,org:"",res:15,tea:0,actualPaid:"",actualChap:"",ps:"10:30",pe:"14:00",eta:"",aend:"",meal:"도시락",mealLoc:"",cafeDetail:"",appearance:"",pay:false,book:false,memo:"",cancelled:false,cancelledAt:"",segments:segs(["f4","meal","play","f5"])}}
function checks(){$("pay").classList.toggle("on",state.draft.pay);$("pay").textContent="결제완료 "+(state.draft.pay?"✓":"□");$("book").classList.toggle("on",state.draft.book);$("book").textContent="컬러북 제공 "+(state.draft.book?"✓":"□")}
function cancelBtn(){const b=$("cancelToggle");b.classList.toggle("active",!!state.draft.cancelled);b.textContent=state.draft.cancelled?"↩ 취소 해제":"당일취소"}
export function openDetail(i){if(!state.editMode)return lockedMsg();state.eid=i||null;state.draft=clone(i?state.data.groups.find(g=>g.id===i):fresh());state.detailOriginal=clone(state.draft);fillMealOptions(state.draft.mealLoc);$("detailTitle").textContent=i?"단체 상세 수정":"단체 스케줄 추가";["org","res","tea","actualPaid","actualChap","ps","pe","eta","aend","meal","mealLoc","cafeDetail","memo","appearance"].forEach(k=>$(k).value=state.draft[k]??"");checks();cancelBtn();$("detailModal").classList.remove("hidden")}
async function saveDetail(){["org","res","tea","actualPaid","actualChap","ps","pe","eta","aend","meal","mealLoc","cafeDetail","memo","appearance"].forEach(k=>state.draft[k]=$(k).value);state.draft.res=Number(state.draft.res||0);state.draft.tea=Number(state.draft.tea||0);state.draft.actualPaid=state.draft.actualPaid===""?"":Number(state.draft.actualPaid||0);state.draft.actualChap=state.draft.actualChap===""?"":Number(state.draft.actualChap||0);if(!state.draft.org)return toast("단체명을 입력해주세요.");if(min(state.draft.pe)<=min(state.draft.ps))return toast("퇴장시간을 도착시간보다 늦게 설정해주세요.");try{if(!state.eid)await savePatch(state.draft.id,{...state.draft,createdAt:F.serverTimestamp()});else{const keys=["org","res","tea","actualPaid","actualChap","ps","pe","eta","aend","meal","mealLoc","cafeDetail","memo","appearance","pay","book","cancelled","cancelledAt"],patch={};keys.forEach(k=>{if(!eq(state.draft[k],state.detailOriginal[k]))patch[k]=state.draft[k]});if(Object.keys(patch).length)await savePatch(state.eid,patch)}closeDetail();toast("저장했습니다.")}catch(e){writeError(e)}}
function closeDetail(){$("detailModal").classList.add("hidden")}
export async function quickField(gid,kind){
 const g=state.data.groups.find(z=>z.id===gid);if(!g)return;
 if(kind==='plan'){openDetail(gid);return}
 const labels={actualPaid:'유료인원',actualChap:'인솔자인원',eta:'도착예정 시간 (예: 15:30)',aend:'퇴장예정 시간 (예: 15:30)',mealLoc:'식사 위치',appearance:'참가자 인상착의'};
 if(!labels[kind])return;
 const numeric=kind==='actualPaid'||kind==='actualChap';
 const submit=async raw=>{
  let value=String(raw).trim();
  if(numeric&&value!==''){const n=Number(value);if(!Number.isSafeInteger(n)||n<0)throw Error('인원은 0 이상의 정수로 입력해주세요.');value=n}
  if((kind==='eta'||kind==='aend')&&value&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))throw Error('시간을 15:30 형식으로 입력해주세요.');
  await savePatch(gid,{[kind]:value});g[kind]=value;render();return true;
 };
 if(kind==='mealLoc')await window.ZRDialogs.select(labels[kind],g[kind]||'',mealOptions(g[kind]),submit);
 else await window.ZRDialogs.prompt(labels[kind],g[kind]??'',numeric?'number':'text',submit);
}

export function openCafe(gid){const g=state.data.groups.find(z=>z.id===gid);if(!g)return;state.cafeEditGid=gid;$("cafeTitle").textContent=g.org+" · 카페 주문";$("cafeEdit").value=g.cafeDetail||"";$("cafeEdit").readOnly=!state.editMode;$("cafeSave").classList.toggle("hidden",!state.editMode);$("cafeLockHint").textContent=state.editMode?"수정 후 저장하면 바로 반영됩니다.":"현재 수정 불가 상태입니다. 상단에서 수정 가능을 켜면 메뉴를 수정할 수 있습니다.";$("cafeModal").classList.remove("hidden")}
async function saveCafe(){if(!state.editMode)return lockedMsg();const g=state.data.groups.find(z=>z.id===state.cafeEditGid);if(!g)return;const old=g.cafeDetail,value=$("cafeEdit").value.trim();g.cafeDetail=value;render();try{await savePatch(g.id,{cafeDetail:value});closeCafe();toast("카페 주문을 저장했습니다.")}catch(e){g.cafeDetail=old;render();writeError(e)}}
function closeCafe(){$("cafeModal").classList.add("hidden");state.cafeEditGid=null}
