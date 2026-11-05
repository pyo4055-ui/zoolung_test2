(()=>{
'use strict';
const $=id=>document.getElementById(id),read=()=>window.settings?.()||{};
const defaults=[{id:'iced-americano',name:'아이스 아메리카노'},{id:'hot-americano',name:'뜨거운 아메리카노'},{id:'peach-tea',name:'복숭아 아이스티'}];
function mount(){
 const bar=$('zrSettingsSubtabsV1'),section=$('tab-settings');if(!bar||!section)return;
 for(const [key,label,scope] of [['GroupPricing','단체가 설정','group-pricing'],['DrinkService','음료 제공 설정','drink-service']]){
  const field=key==='GroupPricing'?'groupPricing':'drinkService',id='zrSettings'+key+'PanelV1';let panel=$(id);
  if(!panel){
   const b=document.createElement('button');b.type='button';b.id='zrSettings'+key+'SubtabV1';b.dataset.zrSubtabMode=field;b.textContent=label;bar.append(b);
   panel=document.createElement('div');panel.id=id;panel.className='hidden';
   panel.innerHTML='<div class="card"><h3>'+label+'</h3><div data-fields></div><div class="zr-settings-actions"><button type="button" class="btn-primary" data-save>저장</button></div></div>';
   section.append(panel);
   panel.addEventListener('input',()=>panel.dataset.dirty='1');panel.addEventListener('change',()=>panel.dataset.dirty='1');
   panel.querySelector('[data-save]').onclick=async()=>{
    if(!window.adminGuard?.(false))return false;
    let value;
    if(field==='groupPricing'){
     const ratio=Number(panel.querySelector('[data-ratio]').value);
     if(!Number.isSafeInteger(ratio)||ratio<1||ratio>100){window.toast?.('무료 인솔자 기준은 1~100명으로 입력해주세요.');return false}
     value={freePerPaid:ratio,eventMinimum:15,eventEnabled:panel.querySelector('[data-enabled]').checked};
    }else{
     const menus=[...panel.querySelectorAll('[data-menu]')].map(row=>({id:row.dataset.menu,name:row.querySelector('input').value.trim()}));
     if(menus.some(x=>!x.name||x.name.length>40)||new Set(menus.map(x=>x.name)).size!==menus.length){window.toast?.('음료 이름은 중복 없이 1~40자로 입력해주세요.');return false}
     if(panel.querySelector('[data-enabled]').checked&&!menus.length){window.toast?.('제공할 음료를 추가해주세요.');return false}
     value={enabled:panel.querySelector('[data-enabled]').checked,menus};
    }
    const controls=[...panel.querySelectorAll('button,input')];controls.forEach(x=>x.disabled=true);
    try{const api=window.zrReservationSettingsFirebaseSyncV1Api;if(!api||!await api.save({...read(),[field]:value},scope))throw Error();
     delete panel.dataset.dirty;panel.dataset.signature='';mount();window.toast?.('설정을 저장했습니다.');return true;
    }catch{window.toast?.('설정을 저장하지 못했습니다. 입력 내용은 유지됩니다.');return false}
    finally{controls.forEach(x=>x.disabled=false)}
   };
   const owners=window.ZRAdminDraftOwners||(window.ZRAdminDraftOwners=new Map());
   owners.set(scope,{label,dirty:()=>!!panel.dataset.dirty,save:()=>panel.querySelector('[data-save]').onclick(),discard:()=>{delete panel.dataset.dirty;panel.dataset.signature='';mount()}});
  }
  const config=read()[field]||{},signature=JSON.stringify(config);if(panel.dataset.dirty||panel.dataset.signature===signature)continue;
  panel.dataset.signature=signature;const fields=panel.querySelector('[data-fields]');
  if(field==='groupPricing'){
   fields.innerHTML='<label>일반 무료 인솔자 기준</label><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">유료인원 <input data-ratio type="number" min="1" max="100" style="width:90px" aria-label="무료 인솔자 1명당 유료인원">명당 인솔자 1명 무료</div><label style="display:flex;align-items:center;gap:8px;margin-top:20px"><input data-enabled type="checkbox" style="width:auto">인솔자 전원 무료 이벤트 사용</label><p class="help">이벤트 사용 시 관람인원과 인솔자 합계 15명 이상이면 인솔자 전원 무료입니다. 끄면 일반 기준으로 계산합니다.</p>';
   fields.querySelector('[data-ratio]').value=config.freePerPaid||5;fields.querySelector('[data-enabled]').checked=config.eventEnabled===true;
  }else{
   fields.innerHTML='<label style="display:flex;align-items:center;gap:8px"><input data-enabled type="checkbox" style="width:auto">인솔자 음료 제공 사용</label><div data-menus></div><button type="button" class="btn-soft" data-add style="margin-top:12px">음료 추가</button>';
   fields.querySelector('[data-enabled]').checked=config.enabled===true;
   function row(menu){const el=document.createElement('div');el.dataset.menu=menu.id;el.style.cssText='display:flex;gap:8px;margin-top:10px';const input=document.createElement('input');input.value=menu.name;input.maxLength=40;input.setAttribute('aria-label','음료명');const remove=document.createElement('button');remove.type='button';remove.className='btn-gray';remove.textContent='삭제';remove.onclick=()=>{panel.dataset.dirty='1';el.remove()};el.append(input,remove);fields.querySelector('[data-menus]').append(el)}
   (Array.isArray(config.menus)?config.menus:defaults).forEach(row);
   fields.querySelector('[data-add]').onclick=()=>{panel.dataset.dirty='1';row({id:'drink-'+crypto.randomUUID(),name:''})};
  }
 }
}
document.addEventListener('zr:admin-runtime-ready',mount);document.addEventListener('zr:reservation-settings-synced',mount);document.addEventListener('zr:admin-shell-ready',mount);
window.ZRAdminSettingsViews?.register('group-benefits',mount);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();