import {state,$} from './core.js';

let observer=null;

function asDate(value){
  if(!value)return null;
  try{
    if(typeof value.toDate==='function')return value.toDate();
    if(Number.isFinite(value.seconds))return new Date(value.seconds*1000);
    if(Number.isFinite(value._seconds))return new Date(value._seconds*1000);
    const d=new Date(value);
    return Number.isNaN(d.getTime())?null:d;
  }catch{return null}
}
function pad(n){return String(n).padStart(2,'0')}
function timeText(value){
  const d=asDate(value);if(!d)return '';
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function groupForCard(card){
  const gid=card.querySelector('.detail[data-e]')?.dataset.e||card.querySelector('[data-seg][data-g]')?.dataset.g||'';
  return state.data.groups.find(g=>String(g.id)===String(gid))||null;
}
function apply(){
  document.querySelectorAll('#list .card').forEach(card=>{
    const head=card.querySelector('.head');if(!head)return;
    const g=groupForCard(card);
    const by=String(g?.onsiteLastModifiedBy||'').trim();
    const at=timeText(g?.onsiteLastModifiedAt);
    let el=head.querySelector('.zr-last-edit');
    if(!by||!at){el?.remove();return;}
    if(!el){el=document.createElement('span');el.className='zr-last-edit';head.prepend(el)}
    el.innerHTML=`마지막 수정 · <strong>${by.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</strong> · ${at}`;
    el.title=`마지막 수정자 ${by} · ${at}`;
  });
}
function boot(){
  const list=$('list');if(!list)return;
  apply();
  if(!observer){
    observer=new MutationObserver(apply);
    observer.observe(list,{childList:true});
  }
  document.addEventListener('click',e=>{if(e.target?.closest?.('#prev,#next,#today,#refreshBtn,#editLock'))setTimeout(apply,0)},true);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
