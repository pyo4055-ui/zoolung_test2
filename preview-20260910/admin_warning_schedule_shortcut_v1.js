(()=>{
'use strict';
if(window.__ZR_ADMIN_WARNING_SCHEDULE_SHORTCUT_V1)return;
window.__ZR_ADMIN_WARNING_SCHEDULE_SHORTCUT_V1=true;

const KEY='zr_bookings';
const SCHEDULE_LABELS=new Set(['스케줄 미확정','고객 알림 미완료','스케줄 시간 겹침']);
let installed=false,observer=null;

function allBookings(){
  try{
    const list=typeof window.bookings==='function'?window.bookings():JSON.parse(localStorage.getItem(KEY)||'[]');
    return Array.isArray(list)?list.filter(b=>b&&!b.__availabilityOnly):[];
  }catch{return []}
}
function bookingById(id){return allBookings().find(b=>String(b?.id)===String(id))||null}
function toast(text){try{window.toast?.(text)}catch{}}
function removeRefresh(){document.getElementById('zrWarningRefresh')?.remove()}
function ensurePaginationStyle(){
  if(document.getElementById('zrWarningPaginationMatchStyleV1'))return;
  const style=document.createElement('style');style.id='zrWarningPaginationMatchStyleV1';style.textContent=`
    #tab-warning .zr-warning-pagination{display:flex;justify-content:center;align-items:center;gap:6px;flex-wrap:wrap;margin:16px 0 4px}
    #tab-warning .zr-warning-pagination button{min-width:38px;height:38px;padding:0 11px;margin:0}
    #tab-warning .zr-warning-pagination button:disabled{opacity:.45;cursor:default;pointer-events:none}
    @media(max-width:560px){#tab-warning .zr-warning-pagination{gap:5px}#tab-warning .zr-warning-pagination button{min-width:36px;height:36px;padding:0 9px}}
  `;document.head.appendChild(style);
}
function pageNumbers(page,pages){
  if(pages<=7)return Array.from({length:pages},(_,i)=>i+1);
  const keep=new Set([1,pages,page-1,page,page+1]);
  const valid=[...keep].filter(p=>p>=1&&p<=pages).sort((a,b)=>a-b),out=[];let prev=0;
  for(const p of valid){if(prev&&p-prev>1)out.push('…');out.push(p);prev=p}
  return out;
}
function pageButton(label,value,disabled=false,active=false){
  return `<button type="button" class="${active?'btn-primary':'btn-soft'}" data-zr-warning-page="${value}"${disabled?' disabled':''}${active?' aria-current="page"':''}>${label}</button>`;
}
function normalizePagination(){
  const pager=document.getElementById('zrWarningPagination');if(!pager)return;
  ensurePaginationStyle();
  const numeric=[...pager.querySelectorAll('[data-zr-warning-page]')]
    .map(btn=>({btn,n:Number(btn.dataset.zrWarningPage)})).filter(x=>Number.isFinite(x.n)&&x.n>0);
  let pages=numeric.length?Math.max(...numeric.map(x=>x.n)):1;
  const info=String(pager.querySelector('.zr-warning-page-info')?.textContent||'');
  const totalMatch=info.match(/\/\s*(\d+)\s*페이지/);if(totalMatch)pages=Math.max(pages,Number(totalMatch[1])||1);
  let current=numeric.find(x=>x.btn.classList.contains('btn-primary'))?.n||1;
  current=Math.max(1,Math.min(current,pages));
  const nums=pageNumbers(current,pages).map(n=>n==='…'?'<span class="zr-page-gap">…</span>':pageButton(String(n),n,false,n===current)).join('');
  const html=`${pageButton('이전','prev',current<=1)}${nums}${pageButton('다음','next',current>=pages)}`;
  if(pager.innerHTML!==html)pager.innerHTML=html;
}
function hasScheduleIssue(card){
  return [...card.querySelectorAll('.zr-warning-issue b')].some(el=>SCHEDULE_LABELS.has(String(el.textContent||'').trim()));
}
function decorate(){
  removeRefresh();normalizePagination();
  document.querySelectorAll('#zrWarningList .zr-warning-card').forEach(card=>{
    const actions=card.querySelector('.zr-warning-actions');if(!actions)return;
    const id=String(card.dataset.booking||'');
    let btn=actions.querySelector('[data-zr-warning-schedule]');
    if(!hasScheduleIssue(card)){btn?.remove();return}
    if(!btn){
      btn=document.createElement('button');btn.type='button';btn.className='btn-soft';btn.textContent='스케줄 관리';
      const detail=actions.querySelector('[data-zr-warning-detail]');actions.insertBefore(btn,detail||actions.firstChild);
    }
    btn.dataset.zrWarningSchedule=id;
  });
}
function applyScheduleDate(date){
  const input=document.getElementById('zrscDate');
  if(!input||!date)return false;
  if(String(input.value)!==String(date)){
    input.value=String(date);
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }
  return true;
}
function openSchedule(id){
  const booking=bookingById(id);if(!booking?.date)return toast('예약 방문일을 찾지 못했습니다.');
  const tab=document.getElementById('zrScheduleTabBtn');if(!tab)return toast('스케줄 관리 탭을 불러오는 중입니다. 잠시 후 다시 눌러주세요.');
  tab.click();
  if(!applyScheduleDate(booking.date))setTimeout(()=>applyScheduleDate(booking.date),80);
  setTimeout(()=>applyScheduleDate(booking.date),250);
}
function install(){
  if(installed)return true;
  const list=document.getElementById('zrWarningList');if(!list)return false;
  removeRefresh();decorate();
  list.addEventListener('click',e=>{
    const btn=e.target?.closest?.('[data-zr-warning-schedule]');if(!btn)return;
    openSchedule(btn.dataset.zrWarningSchedule||'');
  });
  observer=new MutationObserver(()=>decorate());observer.observe(list,{childList:true,subtree:true});
  installed=true;return true;
}
function boot(){
  if(install())return;
  let tries=0;const timer=setInterval(()=>{if(install()||++tries>80)clearInterval(timer)},250);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();