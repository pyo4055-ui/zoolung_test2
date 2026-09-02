import {state,$,auth,db,F} from './core.js';

const vendorRows=new Map();
let unsub=null;
let listeningDate='';
let observer=null;

function vendorInfo(b){
  const st=b?.settlement||{};
  const snap=b?.outsourcingVendorSnapshot||st.vendorSnapshot||{};
  const id=String(b?.outsourcingVendorId||st.vendorId||snap.id||'self');
  const name=id==='self'?'자체':String(snap.name||id).trim()||id;
  return {id,name};
}

function applyBadges(){
  document.querySelectorAll('#list .card').forEach(card=>{
    const gid=card.querySelector('.detail[data-e]')?.dataset.e||card.querySelector('[data-seg][data-g]')?.dataset.g||'';
    const pay=card.querySelector('.quick [data-c="pay"]');
    if(!gid||!pay)return;
    const info=vendorRows.get(String(gid));
    let badge=card.querySelector('.zr-outsourcing-tag');
    if(!info){badge?.remove();return;}
    if(!badge){
      badge=document.createElement('span');
      badge.className='zr-outsourcing-tag';
      pay.insertAdjacentElement('afterend',badge);
    }
    const isSelf=info.id==='self';
    badge.classList.toggle('self',isSelf);
    badge.textContent=isSelf?'자체':`외주 · ${info.name}`;
    badge.title=isSelf?'결제 구분: 자체':`아웃소싱 업체: ${info.name}`;
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
    snap.docs.forEach(d=>vendorRows.set(String(d.id),vendorInfo(d.data()||{})));
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
    #list .zr-outsourcing-tag{height:23px;max-width:104px;padding:0 6px;display:inline-flex;align-items:center;border:1px solid #e4cf9c;border-radius:6px;background:#fff5de;color:#805b13;font-size:7.5px;font-weight:900;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:none}
    #list .zr-outsourcing-tag.self{border-color:#d8dfda;background:#f3f5f3;color:#667169;font-weight:800}
  `;
  document.head.appendChild(s);
}

function boot(){
  injectStyle();
  const list=$('list');
  if(list&&!observer){
    observer=new MutationObserver(()=>{start();applyBadges();});
    observer.observe(list,{childList:true,subtree:true});
  }
  F.onAuthStateChanged(auth,user=>{if(user)start();else stop();});
  document.addEventListener('change',e=>{if(e.target?.id==='date')setTimeout(start,0)},true);
  document.addEventListener('click',e=>{if(e.target?.closest?.('#prev,#next,#today,#refreshBtn'))setTimeout(start,0)},true);
  start();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
