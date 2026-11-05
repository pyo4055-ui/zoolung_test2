import {state,auth,db,F,savePatch,toast,esc} from './core.js?v=release-1792586551421';
let refresh=()=>{},unsubscribe=null,settingsReady=false;
export function peopleResult(g){
 if(g.actualPaid===''||g.actualPaid==null||g.actualChap===''||g.actualChap==null)return null;
 return window.ZRBookingRules.minimumPeople(g.actualPaid,g.actualChap,g.actualPeoplePricing||state.benefitSettings?.groupPricing||{});
}
export function benefitsHtml(g){
 const people=peopleResult(g),drink=state.benefitSettings?.drinkService,order=g.drinkService||{},sum=(order.items||[]).reduce((n,x)=>n+Number(x.qty||0),0);
 const info=people?'<span class="tag">실제 유료 관람 '+people.paid+'명 · 유료 인솔 '+people.paidChaperone+'명 · 무료 인솔 '+people.freeChaperone+'명</span>':'';
 return info+(settingsReady&&drink?.enabled===true?'<button type="button" class="check '+(order.completed?'on':'')+'" data-drinks="'+esc(g.id)+'">음료 '+sum+'잔 · '+(order.completed?'제공완료':'제공대기')+'</button>':'');
}
export function initBenefits(render){
 refresh=render;
 F.onAuthStateChanged(auth,user=>{
  unsubscribe?.();unsubscribe=null;settingsReady=false;state.benefitSettingsReady=false;state.benefitSettings={};
  if(!user)return;
  unsubscribe=F.onSnapshot(F.doc(db,'customerGuides','main'),snap=>{state.benefitSettings=snap.data()?.reservationSettings||{};settingsReady=true;state.benefitSettingsReady=true;refresh()},()=>{settingsReady=false;state.benefitSettingsReady=false});
 });
 document.addEventListener('click',e=>{const b=e.target.closest('[data-drinks]');if(b)openDrinks(b.dataset.drinks)});
 const actualPaid=document.getElementById('actualPaid'),actualChap=document.getElementById('actualChap');
 if(actualPaid&&actualChap){const summary=document.createElement('div');summary.className='full helpText';actualChap.parentElement.after(summary);
  const update=()=>{const g={actualPaid:actualPaid.value,actualChap:actualChap.value},p=peopleResult(g);summary.textContent=p?'유료 관람 '+p.paid+'명 / 유료 인솔 '+p.paidChaperone+'명 / 무료 인솔 '+p.freeChaperone+'명':'실제 관람인원과 인솔자 수를 모두 입력하면 자동 계산됩니다.'};
  actualPaid.addEventListener('input',update);actualChap.addEventListener('input',update);
  new MutationObserver(update).observe(document.getElementById('detailModal'),{attributes:true,attributeFilter:['class']});
 }
}
export function drinkError(items,actualChap,completed=false){
 if(items.some(x=>!Number.isSafeInteger(x.qty)||x.qty<0||x.qty>1000))return '수량을 0~1000의 정수로 입력해주세요.';
 const total=items.reduce((n,x)=>n+x.qty,0);
 if(actualChap===''||actualChap==null||!Number.isSafeInteger(Number(actualChap))||Number(actualChap)<0)return '실제 인솔자 수를 먼저 입력해주세요.';
 if(total>Number(actualChap))return '음료는 인솔자 1명당 1잔까지 제공됩니다. 실제 인솔자 수와 음료 수량을 확인해주세요.';
 if(completed&&!total)return '제공할 음료 수량을 입력해주세요.';
 return '';
}
function openDrinks(id){
 const g=state.data.groups.find(x=>x.id===id);if(!g||!settingsReady||!state.benefitSettings?.drinkService?.enabled)return;
 const previous=JSON.stringify(g.drinkService||null),saved=g.drinkService||{},menus=[...(state.benefitSettings.drinkService.menus||[])];
 for(const item of saved.items||[])if(!menus.some(x=>x.id===item.id))menus.push({id:item.id,name:item.name});
 const dialog=document.createElement('dialog');dialog.style.cssText='padding:0;border:0;border-radius:20px;width:min(520px,calc(100vw - 32px));max-height:90vh;overflow:auto';
 dialog.innerHTML='<header style="background:#ff5500;color:white;padding:16px 20px;display:flex;justify-content:space-between;align-items:center"><strong>인솔자 음료 제공</strong><button type="button" data-close>닫기</button></header><div style="padding:20px"><h3>'+esc(g.org)+'</h3><div data-rows></div><p data-total></p><p data-error style="color:#b42318" role="status"></p><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" data-save>수량 저장</button><button type="button" data-complete>제공완료</button></div></div>';
 const controls=[];for(const menu of menus){const row=document.createElement('label');row.style.cssText='display:flex;justify-content:space-between;align-items:center;gap:10px;margin:12px 0';row.textContent=menu.name;const input=document.createElement('input');input.type='number';input.min='0';input.max='1000';input.step='1';input.style.width='95px';input.value=String(saved.items?.find(x=>x.id===menu.id)?.qty||0);input.disabled=!state.editMode;row.append(input);dialog.querySelector('[data-rows]').append(row);controls.push({menu,input})}
 const collect=()=>controls.map(({menu,input})=>({...menu,qty:Number(input.value)}));
 const summary=()=>{const sum=collect().reduce((n,x)=>n+x.qty,0);dialog.querySelector('[data-total]').textContent='합계 '+sum+'잔 · 실제 인솔자 '+(g.actualChap===''?'미입력':g.actualChap)+'명'+(g.actualChap!==''&&sum>Number(g.actualChap||0)?' · 인솔자 수보다 음료가 많습니다. 수량을 확인해주세요.':'');};controls.forEach(({input})=>input.oninput=summary);summary();
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());
 for(const selector of ['[data-save]','[data-complete]'])dialog.querySelector(selector).disabled=!state.editMode;
 async function persist(completed){
  if(!state.editMode)return;const items=collect();const error=dialog.querySelector('[data-error]');error.textContent='';
  const invalid=drinkError(items,g.actualChap,completed);if(invalid){error.textContent=invalid;return}
  const value={items:items.filter(x=>x.qty>0),completed,modifiedBy:window.zrScheduleIdentity?.()||'',modifiedAt:new Date().toISOString(),completedAt:completed?new Date().toISOString():''};
  const buttons=[...dialog.querySelectorAll('button')];buttons.forEach(x=>x.disabled=true);
  try{
   await F.runTransaction(db,async tx=>{const ref=F.doc(db,'scheduleGroups',id),snap=await tx.get(ref);if(!snap.exists())throw Error('단체 스케줄을 찾을 수 없습니다.');const settings=await tx.get(F.doc(db,'customerGuides','main'));if(settings.data()?.reservationSettings?.drinkService?.enabled!==true)throw Error('음료 제공 설정이 꺼져 있습니다.');const invalid=drinkError(items,snap.data().actualChap,completed);if(invalid)throw Error(invalid);if(JSON.stringify(snap.data().drinkService||null)!==previous)throw Error('다른 직원이 음료 내역을 수정했습니다. 닫은 뒤 다시 확인해주세요.');tx.set(ref,{drinkService:value,onsiteLastModifiedBy:value.modifiedBy,onsiteLastModifiedAt:F.serverTimestamp(),updatedAt:F.serverTimestamp()},{merge:true})});
   g.drinkService=value;dialog.close();refresh();
  }catch(e){error.textContent=e.message||'저장하지 못했습니다. 다시 시도해주세요.';buttons.forEach(x=>x.disabled=false)}
 }
 dialog.querySelector('[data-save]').onclick=()=>persist(false);dialog.querySelector('[data-complete]').onclick=()=>persist(true);
 document.body.append(dialog);dialog.showModal();
}
