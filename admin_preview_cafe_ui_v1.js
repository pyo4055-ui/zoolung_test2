(()=>{
'use strict';
if(window.__ZR_ADMIN_PREVIEW_CAFE_UI_V1)return;
window.__ZR_ADMIN_PREVIEW_CAFE_UI_V1=true;

const $=id=>document.getElementById(id);
const PAGE_SIZE=8;
let page=1,observer=null,timer=0;

function installStyle(){
  if($('zrAdminPreviewCafeUiStyleV1'))return;
  const s=document.createElement('style');
  s.id='zrAdminPreviewCafeUiStyleV1';
  s.textContent=`
    #zrPreviewNotifyInnerTabs button:hover{background:#f8faf8!important;color:#2f6b4f!important}
    #zrCafeMenuPagination{display:flex;justify-content:center;align-items:center;gap:6px;flex-wrap:wrap;margin:16px 0 4px}
    #zrCafeMenuPagination button{min-width:38px;height:38px;padding:0 11px}
    #zrCafeMenuPagination .zr-page-gap{display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:38px;color:var(--muted,#6d756f);font-weight:800}
    @media(max-width:560px){#zrCafeMenuPagination{gap:5px}#zrCafeMenuPagination button{min-width:36px;height:36px;padding:0 9px}}
  `;
  document.head.appendChild(s);
}
function section(){return $('tab-menuadmin')}
function rows(){return [...(section()?.querySelectorAll('.menu-row')||[])]}
function listRoot(){
  const all=rows();if(!all.length)return null;
  const root=all[0].parentElement;
  return root&&all.every(row=>row.parentElement===root)?root:null;
}
function restoreRows(){
  rows().forEach(row=>{
    if(row.dataset.zrCafePageHidden!=='1')return;
    row.style.display=row.dataset.zrCafePageDisplay||'';
    delete row.dataset.zrCafePageHidden;delete row.dataset.zrCafePageDisplay;
  });
}
function pageNumbers(current,pages){
  if(pages<=7)return Array.from({length:pages},(_,i)=>i+1);
  const keep=new Set([1,pages,current-1,current,current+1]);
  const valid=[...keep].filter(p=>p>=1&&p<=pages).sort((a,b)=>a-b),out=[];let prev=0;
  for(const p of valid){if(prev&&p-prev>1)out.push('…');out.push(p);prev=p}
  return out;
}
function button(label,target,disabled=false,active=false){
  return `<button type="button" class="${active?'btn-primary':'btn-soft'}" data-zr-cafe-page="${target}"${disabled?' disabled':''}${active?' aria-current="page"':''}>${label}</button>`;
}
function controlsHtml(pages){
  const nums=pageNumbers(page,pages).map(p=>p==='…'?'<span class="zr-page-gap">…</span>':button(String(p),p,false,p===page)).join('');
  return `<div id="zrCafeMenuPagination" aria-label="카페메뉴 페이지">${button('이전',Math.max(1,page-1),page<=1)}${nums}${button('다음',Math.min(pages,page+1),page>=pages)}</div>`;
}
function paginate(){
  const sec=section();if(!sec)return false;
  installStyle();
  $('zrCafeMenuPagination')?.remove();
  restoreRows();
  const all=rows(),root=listRoot();if(!all.length||!root)return false;
  const eligible=all.filter(row=>row.style.display!=='none');
  const pages=Math.max(1,Math.ceil(eligible.length/PAGE_SIZE));
  page=Math.max(1,Math.min(page,pages));
  const start=(page-1)*PAGE_SIZE;
  eligible.forEach((row,i)=>{
    if(i>=start&&i<start+PAGE_SIZE)return;
    row.dataset.zrCafePageHidden='1';row.dataset.zrCafePageDisplay=row.style.display||'';row.style.display='none';
  });
  if(eligible.length)root.insertAdjacentHTML('beforeend',controlsHtml(pages));
  return true;
}
function schedule({reset=false,delay=0}={}){
  if(reset)page=1;
  clearTimeout(timer);timer=setTimeout(paginate,delay);
}
function rowMutation(mutations){
  return mutations.some(m=>[...m.addedNodes,...m.removedNodes].some(n=>n?.nodeType===1&&(n.matches?.('.menu-row')||n.querySelector?.('.menu-row'))));
}
function bindObserver(){
  const sec=section();if(!sec)return false;
  if(observer?.zrRoot===sec)return true;
  observer?.disconnect?.();
  observer=new MutationObserver(m=>{if(rowMutation(m))schedule({delay:0})});
  observer.observe(sec,{childList:true,subtree:true});observer.zrRoot=sec;
  return true;
}
function installEvents(){
  if(document.documentElement.dataset.zrCafePaginationBound==='1')return;
  document.documentElement.dataset.zrCafePaginationBound='1';
  document.addEventListener('click',e=>{
    const pageBtn=e.target?.closest?.('[data-zr-cafe-page]');
    if(pageBtn){
      e.preventDefault();e.stopPropagation();
      page=Math.max(1,Number(pageBtn.dataset.zrCafePage)||1);paginate();
      try{listRoot()?.scrollIntoView?.({block:'start'})}catch{}
      return;
    }
    const tab=e.target?.closest?.('#adminView .admin-tabs [data-tab="menuadmin"]');
    if(tab)schedule({reset:true,delay:40});
  },true);
}
function boot(){
  installStyle();installEvents();
  let tries=0;
  const wait=setInterval(()=>{
    const bound=bindObserver();
    if(bound)paginate();
    if((bound&&rows().length)||++tries>120)clearInterval(wait);
  },120);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',boot,{once:true});
})();
