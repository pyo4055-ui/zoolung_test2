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
    #zrCafeMenuPagination{display:flex!important;justify-content:center;align-items:center;gap:6px;flex-wrap:wrap;width:100%;margin:16px 0 4px;clear:both}
    #zrCafeMenuPagination button{min-width:38px;height:38px;padding:0 11px}
    #zrCafeMenuPagination .zr-page-gap{display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:38px;color:var(--muted,#6d756f);font-weight:800}
    @media(max-width:560px){#zrCafeMenuPagination{gap:5px}#zrCafeMenuPagination button{min-width:36px;height:36px;padding:0 9px}}
  `;
  document.head.appendChild(s);
}
function section(){
  const direct=$('tab-menuadmin');if(direct)return direct;
  const admin=$('adminView');if(!admin)return null;
  const btn=[...admin.querySelectorAll('.admin-tabs button')].find(b=>(b.textContent||'').replace(/\s/g,'').includes('카페메뉴'));
  const key=btn?.dataset?.tab||'';
  if(key&&$(`tab-${key}`))return $(`tab-${key}`);
  return [...admin.querySelectorAll('section,[id^="tab-"]')].find(sec=>{
    const title=sec.querySelector('h1,h2,h3')?.textContent||'';
    return title.replace(/\s/g,'').includes('카페메뉴');
  })||null;
}
function primaryRows(sec){return [...(sec?.querySelectorAll('.menu-row')||[])]}
function editButtons(sec){return [...(sec?.querySelectorAll('[onclick*="editCafeMenu"],[data-menu-id],[data-cafe-menu-id]')||[])]}
function inferredRoot(sec){
  const edits=editButtons(sec);if(!edits.length)return null;
  const candidates=new Map();
  for(const edit of edits){
    let p=edit.parentElement,depth=0;
    while(p&&p!==sec&&depth<7){
      const direct=[...p.children].filter(ch=>ch.querySelector?.('[onclick*="editCafeMenu"],[data-menu-id],[data-cafe-menu-id]'));
      if(direct.length)candidates.set(p,{count:direct.length,depth});
      p=p.parentElement;depth++;
    }
  }
  return [...candidates.entries()].sort((a,b)=>b[1].count-a[1].count||a[1].depth-b[1].depth)[0]?.[0]||null;
}
function listRoot(sec=section()){
  if(!sec)return null;
  const all=primaryRows(sec);
  if(all.length){
    const root=all[0].parentElement;
    if(root&&all.every(row=>row.parentElement===root))return root;
  }
  return inferredRoot(sec);
}
function rows(sec=section(),root=listRoot(sec)){
  if(!sec||!root)return [];
  const primary=primaryRows(sec).filter(row=>row.parentElement===root);
  if(primary.length)return primary;
  return [...root.children].filter(ch=>ch.querySelector?.('[onclick*="editCafeMenu"],[data-menu-id],[data-cafe-menu-id]'));
}
function restoreRows(){
  const sec=section(),root=listRoot(sec);
  rows(sec,root).forEach(row=>{
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
  const root=listRoot(sec),all=rows(sec,root);if(!root||!all.length)return false;
  const eligible=all.filter(row=>row.style.display!=='none');
  const pages=Math.max(1,Math.ceil(eligible.length/PAGE_SIZE));
  page=Math.max(1,Math.min(page,pages));
  const start=(page-1)*PAGE_SIZE;
  eligible.forEach((row,i)=>{
    if(i>=start&&i<start+PAGE_SIZE)return;
    row.dataset.zrCafePageHidden='1';row.dataset.zrCafePageDisplay=row.style.display||'';row.style.display='none';
  });
  root.insertAdjacentHTML('afterend',controlsHtml(pages));
  return true;
}
function schedule({reset=false,delay=0}={}){
  if(reset)page=1;
  clearTimeout(timer);timer=setTimeout(paginate,delay);
}
function rowMutation(mutations){
  return mutations.some(m=>[...m.addedNodes,...m.removedNodes].some(n=>n?.nodeType===1&&(n.matches?.('.menu-row')||n.querySelector?.('.menu-row,[onclick*="editCafeMenu"],[data-menu-id],[data-cafe-menu-id]'))));
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
    const tab=e.target?.closest?.('#adminView .admin-tabs button');
    if(tab&&(tab.textContent||'').replace(/\s/g,'').includes('카페메뉴'))schedule({reset:true,delay:40});
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
