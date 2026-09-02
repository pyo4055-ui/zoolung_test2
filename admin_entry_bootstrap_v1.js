(()=>{
'use strict';
if(window.__ZR_ADMIN_ENTRY_BOOTSTRAP_V1)return;
window.__ZR_ADMIN_ENTRY_BOOTSTRAP_V1=true;

const $=id=>document.getElementById(id);
const IDENTITY_KEY='zr_admin_display_name_v1';
let opened=false,loginObserver=null,todayPrepareTimer=0,identitySyncTimer=0,pendingIdentity='';
const hiddenLoginSiblings=new Set();

function installStyle(){
  if($('zrAdminEntryBootstrapStyleV1'))return;
  const s=document.createElement('style');
  s.id='zrAdminEntryBootstrapStyleV1';
  s.textContent=`
    html.zr-admin-entry-page #startView,
    html.zr-admin-entry-page #customerView,
    html.zr-admin-entry-page #successView,
    html.zr-admin-entry-page #cancelSuccessView{display:none!important}
    html.zr-admin-entry-page body>header:not(#zrAdminShellHeader){display:none!important}
    html.zr-admin-login-clean,html.zr-admin-login-clean body{background:#fff!important}
    html.zr-admin-login-clean body{overflow:hidden!important}
    .zr-admin-login-legacy-hidden{display:none!important}
    html.zr-admin-login-clean #adminLoginModal{background:#fff!important}
    html.zr-admin-entry-page #adminLoginModal [data-close="adminLoginModal"],
    html.zr-admin-entry-page #adminLoginModal .zr-modal-ux-header-close{display:none!important}
    html.zr-admin-shell-mounted #adminView>.admin-head,
    html.zr-admin-shell-mounted #adminView>.admin-tabs{display:none!important}
    #adminLoginModal .zr-admin-identity-field{display:block;margin:0 0 12px;text-align:left}
    #adminLoginModal .zr-admin-identity-label{display:block;margin:0 0 6px;font-size:12px;font-weight:900;color:#3f3a35}
    #adminLoginModal #zrAdminIdentity{display:block;width:100%;height:44px;min-height:44px;box-sizing:border-box;margin:0;padding:0 13px;border:1px solid #d8d0c8;border-radius:10px;background:#fff;color:#24211f;font:inherit;outline:none}
    #adminLoginModal #zrAdminIdentity::placeholder{color:#9a938c}
    #adminLoginModal #zrAdminIdentity:focus{border-color:#004b2a;box-shadow:0 0 0 3px rgba(0,75,42,.08)}
    #adminLoginModal .zr-admin-identity-error{margin:6px 0 0;font-size:11px;font-weight:800;color:#c64236}
    #adminLoginModal .zr-admin-identity-error.hidden{display:none!important}
  `;
  document.head.appendChild(s);
}
function normalizeIdentity(value){return String(value||'').replace(/\s+/g,' ').trim().slice(0,20)}
function savedIdentity(){
  try{return normalizeIdentity(localStorage.getItem(IDENTITY_KEY)||'')}
  catch{return''}
}
function syncIdentityStatus(){
  const status=document.querySelector('#zrAdminShellHeader .zr-admin-shell-status');
  if(!status)return false;
  status.textContent=savedIdentity()||pendingIdentity||'관리자 모드';
  return true;
}
function startIdentityStatusSync(){
  if(identitySyncTimer){clearInterval(identitySyncTimer);identitySyncTimer=0}
  let tries=0;
  const sync=()=>{
    if(syncIdentityStatus()||++tries>80){
      if(identitySyncTimer){clearInterval(identitySyncTimer);identitySyncTimer=0}
      return true;
    }
    return false;
  };
  if(sync())return;
  identitySyncTimer=setInterval(sync,100);
}
function commitIdentityIfLoggedIn(){
  if(!adminVisible()||!pendingIdentity)return false;
  try{localStorage.setItem(IDENTITY_KEY,pendingIdentity)}catch{}
  const input=$('zrAdminIdentity');if(input)input.value=pendingIdentity;
  pendingIdentity='';
  startIdentityStatusSync();
  return true;
}
function showIdentityError(show){
  const error=$('zrAdminIdentityError');if(error)error.classList.toggle('hidden',!show);
  const input=$('zrAdminIdentity');if(input)input.setAttribute('aria-invalid',show?'true':'false');
}
function ensureIdentityField(){
  const modal=$('adminLoginModal'),password=$('adminPassword');if(!modal||!password)return null;
  let input=$('zrAdminIdentity');
  if(!input){
    const field=document.createElement('label');field.className='zr-admin-identity-field';field.id='zrAdminIdentityField';
    field.innerHTML='<span class="zr-admin-identity-label">아이디</span><input type="text" id="zrAdminIdentity" autocomplete="username" maxlength="20" placeholder="이름 또는 닉네임 (예: 제트)" aria-describedby="zrAdminIdentityError"><div class="zr-admin-identity-error hidden" id="zrAdminIdentityError">아이디를 입력해주세요.</div>';
    const anchor=password.closest('.field,.form-field,label')||password.parentElement||password;
    if(anchor?.parentElement)anchor.parentElement.insertBefore(field,anchor);else modal.querySelector('.modal-card')?.appendChild(field);
    input=$('zrAdminIdentity');
    input?.addEventListener('input',()=>showIdentityError(false));
    input?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('adminLoginSubmit')?.click()}});
  }
  if(input&&!input.value)input.value=savedIdentity();
  return input;
}
function identityForSubmit(){
  const input=ensureIdentityField();
  const name=normalizeIdentity(input?.value||'');
  if(input)input.value=name;
  showIdentityError(!name);
  if(!name)input?.focus?.();
  return name;
}

function hideCustomerSurfaces(){
  for(const id of ['startView','customerView','successView','cancelSuccessView']){
    const el=$(id);if(el)el.classList.add('hidden');
  }
}
function clearLoginSiblingMask(){
  hiddenLoginSiblings.forEach(el=>el?.classList?.remove('zr-admin-login-legacy-hidden'));
  hiddenLoginSiblings.clear();
}
function maskSiblingsAlongModalPath(modal){
  clearLoginSiblingMask();
  const admin=$('adminView');
  let node=modal;
  while(node&&node!==document.body){
    const parent=node.parentElement;if(!parent)break;
    for(const sibling of parent.children){
      if(sibling===node||['SCRIPT','STYLE','LINK'].includes(sibling.tagName))continue;
      /* Never mask the real administrator workspace (or an ancestor that contains it).
         Its own pre-login display state already keeps it hidden. Masking it here creates
         a circular state where successful login can never be detected. */
      if(admin&&(sibling===admin||sibling.contains?.(admin)))continue;
      sibling.classList.add('zr-admin-login-legacy-hidden');hiddenLoginSiblings.add(sibling);
    }
    node=parent;
  }
}
function adminVisible(){
  const admin=$('adminView');if(!admin)return false;
  return !admin.classList.contains('hidden')&&getComputedStyle(admin).display!=='none';
}
function syncLoginClean(){
  const modal=$('adminLoginModal');if(!modal)return;
  const clean=!adminVisible();
  document.documentElement.classList.toggle('zr-admin-login-clean',clean);
  if(clean)maskSiblingsAlongModalPath(modal);else clearLoginSiblingMask();
  if(!clean){
    commitIdentityIfLoggedIn();
    startIdentityStatusSync();
  }
}
function watchLoginClean(){
  const modal=$('adminLoginModal'),admin=$('adminView');if(!modal||!admin||loginObserver)return;
  loginObserver=new MutationObserver(()=>setTimeout(syncLoginClean,0));
  loginObserver.observe(modal,{attributes:true,attributeFilter:['class','style','hidden']});
  loginObserver.observe(admin,{attributes:true,attributeFilter:['class','style','hidden']});
  syncLoginClean();
}
function preselectTodayWhileHidden(){
  if(todayPrepareTimer){clearInterval(todayPrepareTimer);todayPrepareTimer=0}
  let tries=0;
  const select=()=>{
    const btn=$('zrTodayTabBtn');
    if(btn){
      try{btn.click()}catch{}
      if(todayPrepareTimer){clearInterval(todayPrepareTimer);todayPrepareTimer=0}
      return true;
    }
    return ++tries>40;
  };
  if(select())return;
  todayPrepareTimer=setInterval(()=>{if(select()){clearInterval(todayPrepareTimer);todayPrepareTimer=0}},25);
}

function openAdminGate(force=false){
  document.documentElement.classList.add('zr-admin-entry-page');
  document.title='주렁주렁 동탄점 예약관리';
  installStyle();
  hideCustomerSurfaces();

  const modal=$('adminLoginModal'),admin=$('adminView');
  if(!modal||!admin||!$('adminLoginSubmit')||!$('adminPassword'))return false;
  const identity=ensureIdentityField();
  watchLoginClean();
  startIdentityStatusSync();

  const adminIsVisible=adminVisible();
  if(adminIsVisible&&!force){opened=true;syncLoginClean();return true}

  if(typeof window.openModal==='function')window.openModal('adminLoginModal');
  else modal.classList.remove('hidden');

  opened=true;syncLoginClean();
  setTimeout(()=>{if(identity&&!identity.value)identity.focus();else $('adminPassword')?.focus?.()},60);
  return true;
}

function boot(){
  document.documentElement.classList.add('zr-admin-entry-page');
  installStyle();

  const tryOpen=()=>{
    if(!window.__ZR_ADMIN_REFACTOR_READY)return false;
    return openAdminGate(false);
  };

  if(!tryOpen()){
    document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(()=>openAdminGate(false),0),{once:true});
    let tries=0;
    const t=setInterval(()=>{
      if(tryOpen()||++tries>80)clearInterval(t);
    },150);
  }

  /* Capture phase validates the display name before the existing password login handler runs. */
  document.addEventListener('click',e=>{
    if(e.target?.closest?.('#adminLoginSubmit')){
      const name=identityForSubmit();
      if(!name){
        e.preventDefault();e.stopImmediatePropagation();
        return;
      }
      pendingIdentity=name;
      /* Select Today while #adminView is still hidden. The async login handler reveals
         the workspace later, so no previous/default tab can flash on screen first. */
      preselectTodayWhileHidden();
      setTimeout(syncLoginClean,0);
      setTimeout(syncLoginClean,120);
      setTimeout(syncLoginClean,500);
    }
    if(!e.target?.closest?.('#adminLogout'))return;
    setTimeout(()=>openAdminGate(true),0);
  },true);

  document.addEventListener('zr:admin-runtime-ready',()=>{ensureIdentityField();startIdentityStatusSync()});
  window.zrOpenDedicatedAdminLogin=()=>openAdminGate(true);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
