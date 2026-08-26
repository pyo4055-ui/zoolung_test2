(()=>{
'use strict';
if(window.__ZR_ADMIN_LIST_PAGINATION_V1)return;
window.__ZR_ADMIN_LIST_PAGINATION_V1=true;

const $=id=>document.getElementById(id);
const configs={
  activity:{rootId:'activityList',itemSelector:'.booking-item',pageSize:8,alwaysControls:true,nativePaginationSelector:'.zr-activity-pagination'},
  outsourcing:{rootId:'outsourceList',itemSelector:'.booking-item',pageSize:8,alwaysControls:true},
  inquiry:{rootId:'zrInquiryReplyList',itemSelector:'.zr-ir-card',pageSize:15,alwaysControls:true},
  preview:{rootId:'zrPreviewVisitList',itemSelector:'.zr-pv-card',pageSize:15,alwaysControls:true}
};
const state={activity:1,outsourcing:1,inquiry:1,preview:1};
const observers=new Map();
const timers=new Map();

function installStyle(){
  if($('zrAdminListPaginationStyleV1'))return;
  const style=document.createElement('style');style.id='zrAdminListPaginationStyleV1';style.textContent=`
    .zr-admin-list-pagination{display:flex;justify-content:center;align-items:center;gap:6px;flex-wrap:wrap;margin:16px 0 4px;grid-column:1/-1}
    .zr-admin-list-pagination button{min-width:38px;height:38px;padding:0 11px}
    .zr-admin-list-pagination .zr-page-gap{display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:38px;color:var(--muted,#6d756f);font-weight:800}
    @media(max-width:560px){.zr-admin-list-pagination{gap:5px}.zr-admin-list-pagination button{min-width:36px;height:36px;padding:0 9px}}
  `;document.head.appendChild(style);
}
function restorePageHidden(root){
  root.querySelectorAll('[data-zr-list-page-hidden="1"]').forEach(el=>{
    el.style.display=el.dataset.zrListPageDisplay||'';
    delete el.dataset.zrListPageHidden;delete el.dataset.zrListPageDisplay;
  });
}
function pageNumbers(page,pages){
  if(pages<=7)return Array.from({length:pages},(_,i)=>i+1);
  const keep=new Set([1,pages,page-1,page,page+1]);
  const valid=[...keep].filter(p=>p>=1&&p<=pages).sort((a,b)=>a-b),out=[];let prev=0;
  for(const p of valid){if(prev&&p-prev>1)out.push('…');out.push(p);prev=p}
  return out;
}
function button(label,page,disabled=false,active=false){
  return `<button type="button" class="${active?'btn-primary':'btn-soft'}" data-zr-list-page="${page}"${disabled?' disabled':''}${active?' aria-current="page"':''}>${label}</button>`;
}
function controlsHtml(key,page,pages){
  const nums=pageNumbers(page,pages).map(p=>p==='…'?'<span class="zr-page-gap">…</span>':button(String(p),p,false,p===page)).join('');
  return `<div class="zr-admin-list-pagination" data-zr-pagination-key="${key}">${button('이전',Math.max(1,page-1),page<=1)}${nums}${button('다음',Math.min(pages,page+1),page>=pages)}</div>`;
}
function paginate(key){
  const cfg=configs[key],root=cfg?$(cfg.rootId):null;if(!cfg||!root)return false;
  installStyle();
  root.querySelector(`.zr-admin-list-pagination[data-zr-pagination-key="${key}"]`)?.remove();
  restorePageHidden(root);
  if(cfg.nativePaginationSelector&&root.querySelector(`:scope > ${cfg.nativePaginationSelector}`))return true;
  const all=[...root.querySelectorAll(`:scope > ${cfg.itemSelector}`)];
  const eligible=all.filter(el=>el.style.display!=='none');
  const pages=Math.max(1,Math.ceil(eligible.length/cfg.pageSize));
  state[key]=Math.max(1,Math.min(state[key]||1,pages));
  if(!eligible.length)return true;
  const start=(state[key]-1)*cfg.pageSize;
  eligible.forEach((el,i)=>{
    if(i>=start&&i<start+cfg.pageSize)return;
    el.dataset.zrListPageHidden='1';el.dataset.zrListPageDisplay=el.style.display||'';el.style.display='none';
  });
  if(pages>1||cfg.alwaysControls)root.insertAdjacentHTML('beforeend',controlsHtml(key,state[key],pages));
  return true;
}
function schedule(key,{reset=false,delay=0}={}){
  if(reset)state[key]=1;
  clearTimeout(timers.get(key));
  timers.set(key,setTimeout(()=>{bindRoot(key);paginate(key)},delay));
}
function bindRoot(key){
  const cfg=configs[key],root=cfg?$(cfg.rootId):null;if(!cfg||!root)return false;
  if(observers.get(key)?.root===root)return true;
  observers.get(key)?.observer?.disconnect?.();
  const observer=new MutationObserver(mutations=>{
    const itemChanged=mutations.some(m=>[...m.addedNodes,...m.removedNodes].some(n=>n?.nodeType===1&&n.matches?.(cfg.itemSelector)));
    if(itemChanged)paginate(key);
  });
  observer.observe(root,{childList:true});observers.set(key,{root,observer});return true;
}
function scrollRoot(key){try{$(configs[key].rootId)?.scrollIntoView?.({block:'start'})}catch{}}
function keyFromPagination(el){return el?.closest?.('[data-zr-pagination-key]')?.dataset?.zrPaginationKey||''}
function isOutsourceFilterControl(target){return ['outsourceStart','outsourceEnd','outsourceVendorFilter'].includes(target?.id||'')}
function loadOutsourcePeopleStability(){
  if(document.getElementById('zrAdminOutsourcePeopleStabilityV1')||window.__ZR_ADMIN_OUTSOURCE_PEOPLE_STABILITY_V1)return;
  const s=document.createElement('script');s.id='zrAdminOutsourcePeopleStabilityV1';s.async=false;s.src='./admin_outsource_people_stability_v1.js?v=1';document.body.appendChild(s);
}

function installEvents(){
  document.addEventListener('click',e=>{
    const pageBtn=e.target?.closest?.('[data-zr-list-page]');
    if(pageBtn){
      const key=keyFromPagination(pageBtn);if(!configs[key])return;
      e.preventDefault();e.stopPropagation();state[key]=Math.max(1,Number(pageBtn.dataset.zrListPage)||1);paginate(key);scrollRoot(key);return;
    }
    const target=e.target;
    const activityButton=target?.closest?.('#tab-activity button');
    if(activityButton&&['조회하기','오늘'].includes((activityButton.textContent||'').trim()))state.activity=1;
    if(target?.closest?.('#outsourceSearch'))state.outsourcing=1;
    if(target?.closest?.('#outsourceTabBtn'))schedule('outsourcing',{reset:true,delay:80});
    if(target?.closest?.('#zrInquiryApply'))state.inquiry=1;
    const adminTab=target?.closest?.('#adminView .admin-tabs button');
    if(adminTab&&(adminTab.textContent||'').trim()==='1:1 문의')schedule('inquiry',{reset:true,delay:40});
    if(target?.closest?.('#zrPreviewApplyFilter'))state.preview=1;
    if(target?.closest?.('#zrPreviewVisitTabBtn'))schedule('preview',{reset:true,delay:40});
  },true);
  document.addEventListener('change',e=>{
    if(!isOutsourceFilterControl(e.target))return;
    e.stopImmediatePropagation();
  },true);
  document.addEventListener('zr:inquiry-replies-changed',()=>schedule('inquiry',{delay:0}));
  document.addEventListener('zr:preview-visits-changed',()=>schedule('preview',{delay:20}));
  window.addEventListener('storage',e=>{
    if(e.key==='zr_inquiries'){schedule('inquiry',{delay:20});schedule('preview',{delay:40})}
    if(e.key==='zr_bookings'){schedule('activity',{delay:20});schedule('outsourcing',{delay:40})}
  });
}
function boot(){
  installStyle();installEvents();loadOutsourcePeopleStability();
  const started=Date.now();
  const timer=setInterval(()=>{
    for(const key of Object.keys(configs)){if(bindRoot(key))schedule(key,{delay:0})}
    if(Object.keys(configs).every(key=>observers.has(key))||Date.now()-started>20000)clearInterval(timer);
  },120);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();