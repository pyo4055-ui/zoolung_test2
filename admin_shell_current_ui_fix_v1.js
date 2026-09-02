(()=>{
'use strict';
if(window.__ZR_ADMIN_SHELL_CURRENT_UI_FIX_V1)return;
window.__ZR_ADMIN_SHELL_CURRENT_UI_FIX_V1=true;
const $=id=>document.getElementById(id);
let observer=null;

function ensureSafariTheme(){
  if($('zrAdminSafariThemeV1'))return;
  const link=document.createElement('link');
  link.id='zrAdminSafariThemeV1';link.rel='stylesheet';link.href='./admin_safari_theme_v1.css?v=1';
  document.head.appendChild(link);
}
function injectStyle(){
  if($('zrAdminShellCurrentUiFixV1Style'))return;
  const s=document.createElement('style');s.id='zrAdminShellCurrentUiFixV1Style';s.textContent=`
    .zr-admin-legacy-chrome-hidden,.zr-admin-legacy-time-pill-hidden{display:none!important}
    .zr-admin-shell-refresh{height:40px;min-width:78px;border:1px solid #e2dad2!important;border-radius:10px!important;background:#fff!important;color:#57514b!important;box-shadow:none!important;padding:0 12px!important;font-size:12px!important;font-weight:900!important;white-space:nowrap}
    .zr-admin-shell-refresh:hover{background:#f7f3ee!important}
    .zr-admin-smart-summary-card{border:1px solid #e8dfd7!important;border-radius:12px!important;background:#faf7f3!important;padding:11px!important}
    .zr-admin-smart-summary-card:first-child{background:#f5f8f5!important;border-color:#dfe8e1!important}
    .zr-admin-smart-type-list{margin-top:9px!important;padding-top:8px!important;border-top:1px dashed #ddd6cf!important}
    .zr-admin-smart-type-row{font-size:11.5px!important;color:#716a64!important}.zr-admin-smart-type-row b{font-size:11.5px!important;color:#413c37!important}
    @media(min-width:901px){
      html.zr-admin-shell-mounted #adminView>section:not(.hidden){margin-top:0!important}
      html.zr-admin-shell-mounted #tab-today{margin-top:0!important}
    }
  `;document.head.appendChild(s);
}
function exactText(el){return String(el?.textContent||'').replace(/\s+/g,' ').trim()}
function allButtonsByText(text){return [...document.querySelectorAll('#adminView button')].filter(b=>b.id!=='zrAdminShellRefresh'&&exactText(b)===text)}
function commonAncestor(nodes,stop){
  if(!nodes.length)return null;
  let cur=nodes[0];
  while(cur&&cur!==stop){if(nodes.every(n=>cur.contains(n)))return cur;cur=cur.parentElement}
  return null;
}
function hideLegacyChrome(){
  const admin=$('adminView');if(!admin)return;
  const labels=['새로고침','고객 화면','로그아웃'];
  const actions=labels.flatMap(allButtonsByText);
  const title=[...admin.querySelectorAll('h1,h2,h3,strong,b')].find(el=>exactText(el)==='단체예약 관리자');
  let target=null;
  if(actions.length>=2){
    const nodes=title?[title,...actions]:actions;
    target=commonAncestor(nodes,admin);
    if(target===admin)target=null;
  }
  if(!target&&title){
    let cur=title.parentElement;
    for(let i=0;cur&&cur!==admin&&i<5;i++,cur=cur.parentElement){
      const texts=[...cur.querySelectorAll('button')].map(exactText);
      if(texts.some(x=>labels.includes(x))){target=cur;break}
    }
  }
  if(target)target.classList.add('zr-admin-legacy-chrome-hidden');
  else{
    title?.classList.add('zr-admin-legacy-chrome-hidden');
    actions.forEach(x=>x.classList.add('zr-admin-legacy-chrome-hidden'));
  }
  [...admin.querySelectorAll('button,span,div')].forEach(el=>{
    const t=exactText(el);if(/^↻?\s*오전\s*\d{1,2}:\d{2}\s*기준$/.test(t))el.classList.add('zr-admin-legacy-time-pill-hidden');
  });
}
function legacyRefresh(){
  const btn=allButtonsByText('새로고침')[0];
  if(btn){btn.click();return}
  location.reload();
}
function buildRefresh(){
  const header=$('zrAdminShellHeader');if(!header||$('zrAdminShellRefresh'))return false;
  const btn=document.createElement('button');btn.type='button';btn.id='zrAdminShellRefresh';btn.className='zr-admin-shell-refresh';btn.textContent='새로고침';btn.addEventListener('click',legacyRefresh);
  const edit=$('zrAdminShellHeaderEdit'),status=header.querySelector('.zr-admin-shell-status');
  header.insertBefore(btn,edit||status||null);return true;
}
function apply(){injectStyle();ensureSafariTheme();hideLegacyChrome();buildRefresh()}
function boot(){
  apply();let tries=0;const wait=setInterval(()=>{apply();if(($('zrAdminShellRefresh')&&$('adminView'))||++tries>120)clearInterval(wait)},100);
  const admin=$('adminView');if(admin&&!observer){observer=new MutationObserver(()=>hideLegacyChrome());observer.observe(admin,{subtree:true,childList:true})}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,0),{once:true});
})();
