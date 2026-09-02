import {state,$,auth,db,F,savePatch,toast} from './core.js';

const vendorRows=new Map();
let vendorOptions=[{id:'self',name:'자체'}];
let unsub=null;
let listeningDate='';
let observer=null;
let optionsLoaded=false;

function reservationVendorInfo(b){
  const st=b?.settlement||{};
  const snap=b?.outsourcingVendorSnapshot||st.vendorSnapshot||{};
  const id=String(b?.outsourcingVendorId||st.vendorId||snap.id||'self');
  const name=id==='self'?'자체':String(snap.name||id).trim()||id;
  return {id,name};
}

function groupForCard(card){
  const gid=card.querySelector('.detail[data-e]')?.dataset.e||card.querySelector('[data-seg][data-g]')?.dataset.g||'';
  const g=state.data.groups.find(x=>String(x.id)===String(gid));
  return {gid:String(gid||''),g};
}

function reservationInfoFor(gid,g){
  return vendorRows.get(String(gid))||vendorRows.get(String(g?.reservationId||''))||null;
}

function onsiteInfo(g){
  const id=String(g?.onsitePaymentVendorId||'').trim();
  const name=String(g?.onsitePaymentVendorName||'').trim();
  return id&&name?{id,name}:null;
}

async function loadVendorOptions(){
  if(optionsLoaded)return vendorOptions;
  optionsLoaded=true;
  try{
    const snap=await F.getDoc(F.doc(db,'customerGuides','main'));
    const raw=snap.exists()?snap.data()?.reservationSettings?.outsourcingVendors:[];
    const extras=(Array.isArray(raw)?raw:[])
      .filter(v=>String(v?.name||'').trim())
      .map(v=>({id:String(v.id||v.name),name:String(v.name).trim()}));
    const seen=new Set(['self']);
    vendorOptions=[{id:'self',name:'자체'},...extras.filter(v=>!seen.has(v.id)&&(seen.add(v.id),true))];
  }catch(e){
    console.debug('onsite vendor options read',e);
  }
  return vendorOptions;
}

async function chooseVendor(g,badge){
  if(!g||!state.editMode)return toast("상단에서 '수정 가능'을 먼저 켜주세요.");
  const options=await loadVendorOptions();
  if(!options.length)return toast('결제 구분 목록을 불러오지 못했습니다.');
  const oldId=String(g.onsitePaymentVendorId||''),oldName=String(g.onsitePaymentVendorName||'');
  const select=document.createElement('select');
  select.className='zr-outsourcing-select';
  select.innerHTML='<option value="">미지정</option>'+options.map(v=>`<option value="${v.id.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">${v.name.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</option>`).join('');
  select.value=oldId;
  badge.replaceWith(select);
  select.focus();
  const finish=()=>applyBadges();
  select.onchange=async()=>{
    const id=select.value;
    const picked=options.find(v=>v.id===id)||null;
    const name=picked?.name||'';
    g.onsitePaymentVendorId=id;
    g.onsitePaymentVendorName=name;
    try{
      await savePatch(g.id,{onsitePaymentVendorId:id,onsitePaymentVendorName:name});
      toast(name?`${name}으로 설정했습니다.`:'미지정으로 변경했습니다.');
    }catch(e){
      g.onsitePaymentVendorId=oldId;
      g.onsitePaymentVendorName=oldName;
      console.error('onsite vendor save',e);
      toast('결제 구분 저장에 실패했습니다.');
    }
    finish();
  };
  select.onblur=()=>setTimeout(()=>{if(document.body.contains(select))finish()},80);
}

function applyBadges(){
  document.querySelectorAll('#list .card').forEach(card=>{
    const {gid,g}=groupForCard(card);
    const pay=card.querySelector('.quick [data-c="pay"]');
    if(!gid||!g||!pay)return;
    const reservationInfo=reservationInfoFor(gid,g);
    const localInfo=onsiteInfo(g);
    const editable=!reservationInfo;
    const text=reservationInfo?.name||localInfo?.name||(g.reservationId?'미지정':'현장추가');
    let badge=card.querySelector('.zr-outsourcing-tag');
    const activeSelect=card.querySelector('.zr-outsourcing-select');
    if(activeSelect)return;
    if(!badge){
      badge=document.createElement('button');
      badge.type='button';
      badge.className='zr-outsourcing-tag';
      pay.insertAdjacentElement('beforebegin',badge);
    }else if(badge.nextElementSibling!==pay){
      pay.insertAdjacentElement('beforebegin',badge);
    }
    const isSelf=(reservationInfo||localInfo)?.id==='self';
    badge.classList.toggle('self',isSelf);
    badge.classList.toggle('editable',editable);
    badge.disabled=!editable||!state.editMode;
    badge.textContent=text;
    badge.title=editable?(state.editMode?'눌러서 결제 구분 변경':'수정 가능을 켜면 변경할 수 있습니다.'):'관리자 예약 결제 구분';
    badge.onclick=editable?()=>chooseVendor(g,badge):null;
  });
}

function stop(){
  if(unsub){try{unsub()}catch{}unsub=null;}
  listeningDate='';
  vendorRows.clear();
  applyBadges();
}

function start(){
  const date=String(state.date||$('date')?.value||'').trim();
  if(!auth.currentUser||!date){stop();return;}
  if(unsub&&listeningDate===date){applyBadges();return;}
  if(unsub){try{unsub()}catch{}unsub=null;}
  listeningDate=date;
  vendorRows.clear();
  const q=F.query(F.collection(db,'reservations'),F.where('date','==',date));
  unsub=F.onSnapshot(q,snap=>{
    if(listeningDate!==date)return;
    vendorRows.clear();
    snap.docs.forEach(d=>vendorRows.set(String(d.id),reservationVendorInfo(d.data()||{})));
    applyBadges();
  },err=>{
    console.debug('onsite outsourcing display read',err);
    if(listeningDate===date){vendorRows.clear();applyBadges();}
  });
}

function injectStyle(){
  if($('zrOnsiteOutsourceStyle'))return;
  const s=document.createElement('style');
  s.id='zrOnsiteOutsourceStyle';
  s.textContent=`
    #list .zr-outsourcing-tag{height:23px;max-width:104px;padding:0 6px;display:inline-flex;align-items:center;border:1px solid #e4cf9c;border-radius:6px;background:#fff5de;color:#805b13;font-size:7.5px;font-weight:900;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:none;cursor:default}
    #list .zr-outsourcing-tag.self{border-color:#d8dfda;background:#f3f5f3;color:#667169;font-weight:800}
    #list .zr-outsourcing-tag.editable:not(:disabled){cursor:pointer;border-style:dashed}
    #list .zr-outsourcing-tag:disabled{opacity:1}
    #list .zr-outsourcing-select{height:23px;min-height:23px;width:auto;max-width:108px;padding:0 20px 0 5px;border:1px solid #d0b56f;border-radius:6px;background:#fffaf0;color:#6f5118;font-size:8px;font-weight:900;flex:none}
  `;
  document.head.appendChild(s);
}

function boot(){
  injectStyle();
  loadVendorOptions();
  const list=$('list');
  if(list&&!observer){
    observer=new MutationObserver(()=>{start();applyBadges();});
    // renderView replaces the direct children of #list. Observe only that boundary.
    // Badge/select changes happen deeper inside each card and must not retrigger this observer.
    observer.observe(list,{childList:true});
  }
  F.onAuthStateChanged(auth,user=>{if(user){optionsLoaded=false;loadVendorOptions();start()}else stop();});
  document.addEventListener('change',e=>{if(e.target?.id==='date')setTimeout(start,0)},true);
  document.addEventListener('click',e=>{if(e.target?.closest?.('#prev,#next,#today,#refreshBtn,#editLock'))setTimeout(()=>{start();applyBadges()},0)},true);
  start();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
