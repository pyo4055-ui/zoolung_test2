import {state,$,auth,db,F} from './core.js?v=release-1792577604735';

const vendorRows=new Map();

let unsub=null;
let listeningDate='';
let observer=null;


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

function applyBadges(){
  document.querySelectorAll('#list .card').forEach(card=>{
    const {gid,g}=groupForCard(card);
    const pay=card.querySelector('.quick [data-c="pay"]');
    if(!gid||!g||!pay)return;
    const reservationInfo=reservationInfoFor(gid,g);
    const localInfo=onsiteInfo(g);

    const text=reservationInfo?.name||localInfo?.name||'업체 확인 중';
    let badge=card.querySelector('.zr-outsourcing-tag');
    if(!badge){
      badge=document.createElement('span');
      badge.className='zr-outsourcing-tag';
      pay.insertAdjacentElement('beforebegin',badge);
    }else if(badge.nextElementSibling!==pay){
      pay.insertAdjacentElement('beforebegin',badge);
    }
    const isSelf=(reservationInfo||localInfo)?.id==='self';
    badge.classList.toggle('self',isSelf);

    badge.textContent=text;
    badge.title='관리자에서 지정한 예약 업체';

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
  `;
  document.head.appendChild(s);
}

function boot(){
  injectStyle();

  const list=$('list');
  if(list&&!observer){
    observer=new MutationObserver(()=>{start();applyBadges();});
    // renderView replaces the direct children of #list. Observe only that boundary.
    // Badge/select changes happen deeper inside each card and must not retrigger this observer.
    observer.observe(list,{childList:true});
  }
  F.onAuthStateChanged(auth,user=>{if(user){start()}else stop();});
  document.addEventListener('change',e=>{if(e.target?.id==='date')setTimeout(start,0)},true);
  document.addEventListener('click',e=>{if(e.target?.closest?.('#prev,#next,#today,#refreshBtn,#editLock'))setTimeout(()=>{start();applyBadges()},0)},true);
  start();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
