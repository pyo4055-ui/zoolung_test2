(()=>{
'use strict';
if(window.__ZR_ADMIN_UNSAVED_CHANGES_GUARD_V1)return;
window.__ZR_ADMIN_UNSAVED_CHANGES_GUARD_V1=true;

const $=id=>document.getElementById(id);
let editBaseline='',quickBaseline='',contentBookingId='',stableScheduleDate='';
let wrappedEdit=null,wrappedQuick=null,bypass=false,decision=null;
const dirtySchedule=new Set();

function visible(el){return !!el&&!el.classList.contains('hidden')&&getComputedStyle(el).display!=='none'}
function serialize(root){
  if(!root)return'';
  return [...root.querySelectorAll('input,select,textarea')].filter(el=>!['button','submit','reset'].includes(el.type)).map(el=>{
    const v=(el.type==='checkbox'||el.type==='radio')?(el.checked?'1':'0'):String(el.value??'');
    return `${el.id||el.name||el.dataset.field||el.type}:${v}`;
  }).join('|');
}
function editDirty(){const m=$('zr2EditModal');return visible(m)&&!!editBaseline&&serialize($('zr2EditBody'))!==editBaseline}
function quickDirty(){const m=$('zr2QuickModal');return visible(m)&&!!quickBaseline&&serialize($('zr2QuickBody'))!==quickBaseline}
function scheduleVisible(){const s=$('tab-schedule');return visible(s)}
function scheduleDirty(){return scheduleVisible()&&dirtySchedule.size>0}
function anyDirty(){return editDirty()||quickDirty()||scheduleDirty()}
function runBypass(fn){bypass=true;try{return fn()}finally{bypass=false}}
function toast(s){try{window.toast?.(s)}catch{}}

function injectStyle(){
  if($('zrUnsavedGuardStyleV1'))return;
  const s=document.createElement('style');s.id='zrUnsavedGuardStyleV1';s.textContent=`
#zrUnsavedGuardModal{position:fixed;inset:0;z-index:2147483500;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;background:rgba(16,25,20,.6)}
#zrUnsavedGuardModal.hidden{display:none!important}
#zrUnsavedGuardModal .zr-unsaved-sheet{width:min(470px,100%);background:#fff;border-radius:18px;padding:22px 20px 18px;box-sizing:border-box;box-shadow:0 24px 80px rgba(0,0,0,.3)}
#zrUnsavedGuardModal h3{margin:0 0 9px;font-size:19px;color:#1f2a23}
#zrUnsavedGuardModal p{margin:0;color:#59655d;font-size:13px;line-height:1.65;word-break:keep-all}
#zrUnsavedGuardModal .zr-unsaved-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:19px}
#zrUnsavedGuardModal button{min-height:44px;border-radius:11px;font-size:13px;font-weight:900;cursor:pointer}
#zrUnsavedKeep{grid-column:1/-1;border:1px solid #d5ddd7;background:#fff;color:#4f5b54}
#zrUnsavedDiscard{border:1px solid #d7ded9;background:#eef1ee;color:#526057}
#zrUnsavedSave{border:1px solid #315f49;background:#315f49;color:#fff}
@media(max-width:520px){#zrUnsavedGuardModal .zr-unsaved-actions{grid-template-columns:1fr}#zrUnsavedKeep{grid-column:auto}}
`;
  document.head.appendChild(s);
}
function ensureDecisionModal(){
  let m=$('zrUnsavedGuardModal');if(m)return m;
  m=document.createElement('div');m.id='zrUnsavedGuardModal';m.className='modal hidden';m.innerHTML=`<div class="zr-unsaved-sheet" role="dialog" aria-modal="true" aria-labelledby="zrUnsavedTitle"><h3 id="zrUnsavedTitle">저장하지 않은 변경사항이 있습니다</h3><p id="zrUnsavedText"></p><div class="zr-unsaved-actions"><button type="button" id="zrUnsavedKeep">계속 수정</button><button type="button" id="zrUnsavedDiscard">저장 안 하고 이동</button><button type="button" id="zrUnsavedSave">저장하고 이동</button></div></div>`;document.body.appendChild(m);
  $('zrUnsavedKeep').onclick=()=>closeDecision();
  $('zrUnsavedDiscard').onclick=()=>{const d=decision;closeDecision();d?.discard?.()};
  $('zrUnsavedSave').onclick=async()=>{
    const d=decision;if(!d)return;
    const b=$('zrUnsavedSave');b.disabled=true;const old=b.textContent;b.textContent='저장 중...';
    closeDecision(false);
    try{await d.save?.()}finally{b.disabled=false;b.textContent=old}
  };
  return m;
}
function closeDecision(clear=true){const m=$('zrUnsavedGuardModal');if(m)m.classList.add('hidden');if(clear)decision=null}
function ask({text,saveLabel='저장하고 이동',discardLabel='저장 안 하고 이동',save,discard}){
  injectStyle();const m=ensureDecisionModal();decision={save,discard};$('zrUnsavedText').textContent=text;$('zrUnsavedSave').textContent=saveLabel;$('zrUnsavedDiscard').textContent=discardLabel;m.classList.remove('hidden');requestAnimationFrame(()=>$('zrUnsavedKeep')?.focus());
}

function patchOpeners(){
  const e=window.openAdminEditBooking;
  if(typeof e==='function'&&e!==wrappedEdit&&!e.__zrUnsavedGuard){
    const base=e;wrappedEdit=function(){const out=base.apply(this,arguments);requestAnimationFrame(()=>{editBaseline=serialize($('zr2EditBody'))});return out};wrappedEdit.__zrUnsavedGuard=true;window.openAdminEditBooking=wrappedEdit;
    try{openAdminEditBooking=wrappedEdit}catch{}
  }
  const q=window.openAdminQuickBooking;
  if(typeof q==='function'&&q!==wrappedQuick&&!q.__zrUnsavedGuard){
    const base=q;wrappedQuick=function(){const out=base.apply(this,arguments);requestAnimationFrame(()=>{quickBaseline=serialize($('zr2QuickBody'))});return out};wrappedQuick.__zrUnsavedGuard=true;window.openAdminQuickBooking=wrappedQuick;
    try{openAdminQuickBooking=wrappedQuick}catch{}
  }
}
function clearModalDirtyWhenSaved(){
  setTimeout(()=>{
    if(!visible($('zr2EditModal')))editBaseline='';
    if(!visible($('zr2QuickModal')))quickBaseline='';
  },30);
}
function saveModalAndContinue(modalId,saveId,onSuccess){
  const m=$(modalId),b=$(saveId);if(!m||!b)return false;
  runBypass(()=>b.click());
  setTimeout(()=>{
    decision=null;
    if(visible(m))return;
    if(modalId==='zr2EditModal')editBaseline='';else quickBaseline='';
    onSuccess?.();
  },80);
  return true;
}

function markScheduleCard(el){const card=el?.closest?.('#tab-schedule .zrsc-card[data-booking]');if(card?.dataset.booking)dirtySchedule.add(String(card.dataset.booking))}
function waitScheduleSave(id,btn){
  return new Promise(resolve=>{
    let done=false,started=false,enabledSince=0;
    const finish=v=>{if(done)return;done=true;clearTimeout(timeout);clearInterval(watch);document.removeEventListener('zr:schedule-apply-success',onSuccess);resolve(v)};
    const success=()=>{dirtySchedule.delete(String(id));finish(true)};
    const onSuccess=e=>{if(String(e.detail?.id||'')===String(id))success()};
    document.addEventListener('zr:schedule-apply-success',onSuccess);
    const watch=setInterval(()=>{
      if(!btn.isConnected&&started){success();return}
      if(btn.disabled){started=true;enabledSince=0;return}
      if(started){
        if(!enabledSince)enabledSince=Date.now();
        if(Date.now()-enabledSince>1200)finish(false);
      }
    },40);
    const timeout=setTimeout(()=>finish(false),7000);
    runBypass(()=>btn.click());
    setTimeout(()=>{if(!btn.disabled&&!started&&btn.isConnected)finish(false)},180);
  });
}
function watchManualScheduleSave(id,btn){
  let started=false,enabledSince=0,done=false;
  const finish=saved=>{if(done)return;done=true;clearInterval(watch);clearTimeout(timeout);if(saved)dirtySchedule.delete(String(id))};
  const watch=setInterval(()=>{
    if(!btn.isConnected&&started){finish(true);return}
    if(btn.disabled){started=true;enabledSince=0;return}
    if(started){if(!enabledSince)enabledSince=Date.now();if(Date.now()-enabledSince>1200)finish(false)}
  },40);
  const timeout=setTimeout(()=>finish(false),7000);
  setTimeout(()=>{if(!btn.disabled&&!started&&btn.isConnected)finish(false)},180);
}
async function saveDirtySchedules(){
  const ids=[...dirtySchedule];
  for(const id of ids){
    const card=document.querySelector(`#tab-schedule .zrsc-card[data-booking="${CSS.escape(String(id))}"]`),btn=card?.querySelector('[data-apply]');
    if(!card||!btn){toast('변경한 스케줄을 찾지 못했습니다. 현재 화면에서 다시 확인해주세요.');return false}
    const ok=await waitScheduleSave(id,btn);if(!ok){toast('스케줄 저장이 완료되지 않았습니다. 입력값과 DB 연결을 확인해주세요.');return false}
  }
  return true;
}
function askScheduleMove(continueMove){
  const count=dirtySchedule.size;
  ask({
    text:`${count>1?`${count}개 단체의 `:''}스케줄에 반영하지 않은 변경사항이 있습니다. 저장하지 않고 이동하면 변경 내용이 사라질 수 있습니다.`,
    saveLabel:'스케줄 반영 후 이동',
    discardLabel:'저장 안 하고 이동',
    save:async()=>{const ok=await saveDirtySchedules();decision=null;if(ok)continueMove?.()},
    discard:()=>{dirtySchedule.clear();continueMove?.()}
  });
}

function interceptClick(e){
  if(bypass)return;
  const t=e.target?.closest?.('button,a,input[type="button"],input[type="submit"]');if(!t)return;

  if(t.id==='zr2EditCancel'&&editDirty()){
    e.preventDefault();e.stopImmediatePropagation();
    ask({text:'예약 내용을 수정했지만 아직 저장하지 않았습니다. 저장하고 닫을까요?',saveLabel:'수정 저장 후 닫기',discardLabel:'저장 안 하고 닫기',save:()=>saveModalAndContinue('zr2EditModal','zr2EditSave'),discard:()=>{editBaseline='';runBypass(()=>t.click())}});return;
  }
  if(t.id==='zr2QuickCancel'&&quickDirty()){
    e.preventDefault();e.stopImmediatePropagation();
    ask({text:'관리자 예약 등록 내용을 입력했지만 아직 저장하지 않았습니다. 저장하고 닫을까요?',saveLabel:'예약 등록 후 닫기',discardLabel:'저장 안 하고 닫기',save:()=>saveModalAndContinue('zr2QuickModal','zr2QuickSave'),discard:()=>{quickBaseline='';runBypass(()=>t.click())}});return;
  }

  if(t.matches('#tab-schedule [data-content]'))contentBookingId=String(t.dataset.content||'');
  if(t.id==='zr14SaveSettings'&&contentBookingId)dirtySchedule.add(contentBookingId);
  if(t.matches('#tab-schedule [data-custom-delete]'))markScheduleCard(t);

  const manualApply=t.matches('#tab-schedule [data-apply]');
  const publishApply=t.matches('#tab-schedule [data-publish]')&&!/확정됨/.test(String(t.textContent||''));
  if(manualApply||publishApply){const card=t.closest('.zrsc-card[data-booking]'),id=String(card?.dataset.booking||'');if(id&&dirtySchedule.has(id))watchManualScheduleSave(id,t)}

  if(!scheduleDirty())return;
  const isOtherTab=t.matches('#adminView .admin-tabs button')&&t.id!=='zrScheduleTabBtn';
  const isDateMove=t.matches('#zrscPrev,#zrscNext,#zrscToday');
  const isLogout=t.id==='adminLogout';
  if(!isOtherTab&&!isDateMove&&!isLogout)return;
  e.preventDefault();e.stopImmediatePropagation();
  askScheduleMove(()=>runBypass(()=>t.click()));
}
function interceptChange(e){
  if(bypass)return;
  const t=e.target;
  if(t?.matches?.('#tab-schedule .zrsc-card select')){markScheduleCard(t);return}
  if(t?.id!=='zrscDate')return;
  const desired=t.value;
  if(!scheduleDirty()){stableScheduleDate=desired;return}
  e.preventDefault();e.stopImmediatePropagation();
  const previous=stableScheduleDate||desired;t.value=previous;
  askScheduleMove(()=>runBypass(()=>{t.value=desired;stableScheduleDate=desired;t.dispatchEvent(new Event('change',{bubbles:true}))}));
}
function rememberScheduleDate(e){const t=e.target;if(t?.id==='zrscDate'&&!scheduleDirty())stableScheduleDate=t.value}
function handleScheduleSaved(e){const id=String(e.detail?.id||'');if(id)dirtySchedule.delete(id)}

function boot(){
  injectStyle();ensureDecisionModal();patchOpeners();
  document.addEventListener('click',interceptClick,true);
  document.addEventListener('change',interceptChange,true);
  document.addEventListener('focusin',rememberScheduleDate,true);
  document.addEventListener('pointerdown',rememberScheduleDate,true);
  document.addEventListener('click',e=>{if(e.target?.id==='zr2EditSave'||e.target?.id==='zr2QuickSave')clearModalDirtyWhenSaved()},false);
  document.addEventListener('zr:schedule-apply-success',handleScheduleSaved);
  document.addEventListener('click',e=>{if(e.target?.id==='zrScheduleTabBtn')setTimeout(()=>{stableScheduleDate=$('zrscDate')?.value||stableScheduleDate},0)},false);
  window.addEventListener('beforeunload',e=>{if(!anyDirty())return;e.preventDefault();e.returnValue=''});
  const t=setInterval(patchOpeners,300);setTimeout(()=>clearInterval(t),30000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
