(()=>{
'use strict';
if(window.__ZR_ADMIN_PREVIEW_CAFE_UI_V1)return;
window.__ZR_ADMIN_PREVIEW_CAFE_UI_V1=true;

const $=id=>document.getElementById(id);
let installed=false;

function installStyle(){
  if($('zrAdminPreviewCafeUiStyleV1'))return;
  const s=document.createElement('style');
  s.id='zrAdminPreviewCafeUiStyleV1';
  s.textContent=`
    #zrPreviewNotifyInnerTabs button:hover{background:#f8faf8!important;color:#2f6b4f!important}
  `;
  document.head.appendChild(s);
}
function menuSection(){return $('tab-menuadmin')}
function menuButton(){
  const tabs=document.querySelector('#adminView .admin-tabs');
  if(!tabs)return null;
  return $('zrCafeMenuTabBtn')||tabs.querySelector('[data-tab="menuadmin"]');
}
function ensureMenuButton(){
  const tabs=document.querySelector('#adminView .admin-tabs'),section=menuSection();
  if(!tabs||!section)return null;
  let btn=menuButton();
  if(!btn){
    btn=document.createElement('button');
    btn.type='button';btn.id='zrCafeMenuTabBtn';btn.className='btn-gray';btn.dataset.tab='menuadmin';
    tabs.appendChild(btn);
  }else if(!btn.id)btn.id='zrCafeMenuTabBtn';
  btn.textContent='카페메뉴 관리';
  return btn;
}
function openCafeMenu(){
  const section=menuSection(),btn=ensureMenuButton();
  if(!section||!btn)return false;
  document.querySelectorAll('#adminView section[id^="tab-"]').forEach(s=>s.classList.add('hidden'));
  document.querySelectorAll('#adminView .admin-tabs button').forEach(b=>b.className='btn-gray');
  section.classList.remove('hidden');btn.className='btn-primary';
  try{if(typeof window.renderMenuAdmin==='function')window.renderMenuAdmin();else if(typeof renderMenuAdmin==='function')renderMenuAdmin()}catch(e){console.error('cafe menu render',e)}
  return true;
}
function install(){
  installStyle();
  const section=menuSection(),btn=ensureMenuButton();
  if(!section||!btn)return false;
  if(btn.dataset.zrCafePageBound!=='1'){
    btn.dataset.zrCafePageBound='1';
    btn.addEventListener('click',e=>{e.preventDefault();openCafeMenu()});
  }
  if(document.querySelector('#adminView')?.dataset.zrCafePageBound!=='1'){
    const admin=document.querySelector('#adminView');
    if(admin){
      admin.dataset.zrCafePageBound='1';
      document.addEventListener('click',e=>{
        const clicked=e.target?.closest?.('#adminView .admin-tabs button');
        if(!clicked)return;
        const cafe=menuButton();
        if(cafe&&clicked!==cafe){cafe.className='btn-gray';menuSection()?.classList.add('hidden')}
      },true);
    }
  }
  installed=true;return true;
}
function boot(){
  installStyle();
  if(install())return;
  let tries=0;
  const timer=setInterval(()=>{if(install()||++tries>100)clearInterval(timer)},150);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',boot,{once:true});
})();
