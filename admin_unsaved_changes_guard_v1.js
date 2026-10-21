(()=>{
'use strict';
if(window.__ZR_ADMIN_UNSAVED_CHANGES_GUARD_V1)return;
window.__ZR_ADMIN_UNSAVED_CHANGES_GUARD_V1=true;

const $=id=>document.getElementById(id);
let editBaseline='',quickBaseline='',contentBookingId='',stableScheduleDate='';
let wrappedEdit=null,wrappedQuick=null,bypass=false,decision=null;
let pointerStartTarget=null;
const dirtySchedule=new Set();
const draftOwners=window.ZRAdminDraftOwners||(window.ZRAdminDraftOwners=new Map());
function activeDrafts(){return [...draftOwners.values()].filter(owner=>owner.dirty())}
async function saveDrafts(owners){const request=decision;for(const owner of owners){try{const ok=await owner.save();if(request?.cancelled)return false;if(ok!==true){toast('저장이 완료되지 않아 현재 화면을 유지합니다.');return false}}catch{toast('저장하지 못했습니다. 연결과 입력값을 확인해주세요.');return false}}return true}


// Track editing forms at the first interaction, before the browser changes a value.
const formSpecs=[
 ['groupNotice','단체 안내문구','#tab-group-notice','#zrGroupNoticeSave'],
 ['changeApply','예약 변경 반영','#zrSharedReservationChangeApplyModal','#zrSharedChangeApplyConfirm'],
 ['scheduleContent','스케줄 컨텐츠 설정','#zr14ContentModal','#zr14SaveSettings'],
 ['cafe','카페 메뉴','#menuEditModal','#saveCafeMenu'],
 ['settlement','실제 결제','#zrSettlementWorkspaceBody','[data-zr-settle-save]'],
 ['sms','예약 확정문자','#zrSettingsConfirmSmsPanelV1','#saveSmsSettings'],
 ['vendor','아웃소싱 업체','#zrSettingsOutsourcePanelV1','#saveVendorSettings'],
 ['parking','주차 안내','#zrParkingAdminSection','#zrParkingSaveV31'],
 ['guideMap','가이드맵','#zrGuideMapAdminSection','#zrGuideMapSave'],
 ['guide','고객 안내','#zrGuideAdminContents,#zrGuideAdminNotices','#zrGuideAdminSave'],
 ['inquiryTemplate','문의 답변예시','.zr-ir-template-editor','#zrInquiryTemplateSave'],
 ['previewTemplate','사전답사 문자','.zr-pvn-editor','#zrPreviewNotifyTemplateSave'],
 ['changeSms','예약변경 문자','.zr-cr-shared-sms-only','#zrSharedReservationChangeSmsSave'],
 ['scheduleSms','스케줄 알림 문자','#zrScheduleCustomerNotifySettingsV1','#zrSaveScheduleCustomerNotifyMessage']
];
const forms=new Map();
function formFields(spec){return [...document.querySelectorAll(spec[2])].flatMap(root=>[...root.querySelectorAll('input,select,textarea')])}
function captureForm(spec){return formFields(spec).map(el=>({el,value:el.value,checked:el.checked}))}
function formSignature(spec){return JSON.stringify(formFields(spec).map(el=>[el.id||el.name||el.dataset.field||el.type,el.value,el.checked]))}
function acceptForm(id){const state=forms.get(id);if(!state)return;state.values=captureForm(state.spec);state.signature=formSignature(state.spec);state.touched=false}
window.ZRAdminFormDrafts={capture(id){const spec=formSpecs.find(x=>x[0]===id);const root=spec&&document.querySelector(spec[2]);if(root){watchForms({target:root});acceptForm(id)}},saved:acceptForm,isDirty:id=>!!forms.get(id)?.touched&&formSignature(forms.get(id).spec)!==forms.get(id).signature};
async function saveTrackedForm(state){
 const {spec,root}=state,button=document.querySelector(spec[3]);
 if(!button)return false;
 const before=formSignature(spec),wasPending=button.disabled;
 if(wasPending&&!button.zrSavePromise)return false;
 const custom=window.ZRAdminFormActions?.[spec[0]];
 const result=wasPending?await button.zrSavePromise:custom?await custom.save():await button.onclick?.call(button,new Event('click'));
 if(result!==true||forms.get(spec[0])!==state||!root.isConnected)return false;
 // A late save must not acknowledge edits made after its submitted snapshot.
 if(state.touched&&(wasPending||formSignature(spec)!==before))return false;
 acceptForm(spec[0]);return true;
}
function watchForms(e){
 for(const spec of formSpecs){if(!e.target?.closest?.(spec[2]))continue;
  const id=spec[0],root=document.querySelector(spec[2]);
  if(forms.get(id)?.root===root){if(!forms.get(id).touched)acceptForm(id);continue}
  const state={spec,root,touched:false,values:captureForm(spec),signature:formSignature(spec)};forms.set(id,state);
  draftOwners.set('form-'+id,{label:spec[1],dirty:()=>state.touched&&root.isConnected&&formSignature(spec)!==state.signature,
   save:()=>saveTrackedForm(state),
  });
 }
}

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
function pendingOwners(){
 const owners=activeDrafts();
 if(editDirty())owners.push({label:'예약 수정',save:()=>saveModalAndContinue('zr2EditModal','zr2EditSave')});
 if(quickDirty())owners.push({label:'관리자 예약 등록',save:()=>saveModalAndContinue('zr2QuickModal','zr2QuickSave')});
 if(scheduleDirty()||window.ZRAdminFormDrafts?.isDirty('scheduleContent'))owners.push({label:'스케줄',save:saveDirtySchedules});
 return owners;
}
function anyDirty(){return pendingOwners().length>0}
function runBypass(fn){bypass=true;try{return fn()}finally{bypass=false}}
function toast(s){try{window.toast?.(s)}catch{}}

function injectStyle(){
  if($('zrUnsavedGuardStyleV1'))return;
  const s=document.createElement('style');s.id='zrUnsavedGuardStyleV1';s.textContent=`
#zrUnsavedGuardModal{position:fixed;inset:0;z-index:2147483500;display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box;background:rgba(16,25,20,.6)}
#zrUnsavedGuardModal.hidden{display:none!important}
#zrUnsavedGuardModal .zr-unsaved-sheet{width:min(470px,100%);background:#fff;border-radius:18px;padding:22px 20px 18px;box-sizing:border-box;box-shadow:0 24px 80px rgba(0,0,0,.3)}
#zrUnsavedGuardModal h3{margin:-22px -20px 14px;padding:18px 20px;font-size:19px;color:#fff;background:var(--zr-v3-orange,#fc5404);border-radius:18px 18px 0 0}
#zrUnsavedGuardModal p{margin:0;color:#59655d;font-size:13px;line-height:1.65;word-break:keep-all}
#zrUnsavedGuardModal .zr-unsaved-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:19px}
#zrUnsavedGuardModal button{min-height:44px;border-radius:11px;font-size:13px;font-weight:900;cursor:pointer}
#zrUnsavedKeep{border:1px solid #d5ddd7;background:#fff;color:#4f5b54}
#zrUnsavedDiscard{border:1px solid #d5ddd7;background:#f5f1eb;color:#4f5b54}
#zrUnsavedDiscard[hidden]{display:none!important}
#zrUnsavedSave{border:1px solid var(--zr-v3-orange,#fc5404);background:var(--zr-v3-orange,#fc5404);color:#fff}
@media(max-width:520px){#zrUnsavedGuardModal .zr-unsaved-actions{grid-template-columns:1fr}#zrUnsavedKeep{grid-column:auto}}
`;
  document.head.appendChild(s);
}
function ensureDecisionModal(){
  let m=$('zrUnsavedGuardModal');if(m)return m;
  m=document.createElement('div');m.id='zrUnsavedGuardModal';m.className='modal hidden';m.innerHTML=`<div class="zr-unsaved-sheet" role="dialog" aria-modal="true" aria-labelledby="zrUnsavedTitle"><h3 id="zrUnsavedTitle">저장하지 않은 변경사항이 있습니다</h3><p id="zrUnsavedText"></p><div class="zr-unsaved-actions"><button type="button" id="zrUnsavedKeep">계속 수정</button><button type="button" id="zrUnsavedDiscard" hidden>저장 안 하고 닫기</button><button type="button" id="zrUnsavedSave">저장하고 이동</button></div></div>`;document.body.appendChild(m);
  $('zrUnsavedKeep').onclick=()=>closeDecision();
  $('zrUnsavedDiscard').onclick=()=>{const d=decision;if(!d||$('zrUnsavedSave').disabled)return;closeDecision();d.discard?.()};
  $('zrUnsavedSave').onclick=async()=>{
    const d=decision;if(!d)return;
    const b=$('zrUnsavedSave');b.disabled=true;const old=b.textContent;b.textContent='저장 중…';$('zrUnsavedDiscard').disabled=true;
    $('zrUnsavedKeep').disabled=false;
    const pendingTimer=setTimeout(()=>{if(decision===d){$('zrUnsavedText').textContent='서버의 저장 응답을 기다리고 있습니다. 계속 수정을 누르면 이동을 취소하고 현재 화면으로 돌아갑니다. 저장 요청은 연결 복구 후 완료될 수 있습니다.';b.textContent='저장 확인 대기'}},10000);
    try{await d.save?.()}catch{toast('저장하지 못했습니다. 입력한 내용을 확인해주세요.')}finally{clearTimeout(pendingTimer);if(decision===d){closeDecision();$('zrUnsavedKeep').disabled=false;b.disabled=false;b.textContent=old}}
  };
  return m;
}
function closeDecision(clear=true){const m=$('zrUnsavedGuardModal');if(m)m.classList.add('hidden');if(clear){if(decision)decision.cancelled=true;decision=null}}
function ask({text,save,discard}){
  injectStyle();const m=ensureDecisionModal();decision={save,discard};$('zrUnsavedDiscard').hidden=!discard;$('zrUnsavedDiscard').disabled=false;$('zrUnsavedSave').disabled=false;$('zrUnsavedKeep').disabled=false;$('zrUnsavedText').textContent=text;$('zrUnsavedSave').textContent=discard?'저장하고 닫기':'저장하고 이동';m.classList.remove('hidden');requestAnimationFrame(()=>$('zrUnsavedKeep')?.focus());
}
window.ZRAdminUnsavedChanges={requestMove:({text,save,move})=>ask({text,save:async()=>{try{const request=decision;const ok=await save();if(request?.cancelled)return;if(ok===true)move();else toast('저장이 완료되지 않아 현재 화면을 유지합니다.')}catch{toast('저장하지 못했습니다. 입력한 내용을 확인해주세요.')}}})};

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
async function saveModalAndContinue(modalId,saveId,onSuccess){
 const m=$(modalId),b=$(saveId);if(!m||!b||b.disabled)return false;
 try{await runBypass(()=>b.onclick?.call(b,new Event('click')))}catch{toast('저장하지 못했습니다. 입력한 내용을 확인해주세요.');return false}
 if(visible(m))return false;
 if(modalId==='zr2EditModal')editBaseline='';else quickBaseline='';
 onSuccess?.();return true;
}

function markScheduleCard(el){const card=el?.closest?.('#tab-schedule .zrsc-card[data-booking]');if(card?.dataset.booking)dirtySchedule.add(String(card.dataset.booking))}
async function waitScheduleSave(id,btn){
 if(btn.disabled)return false;
 try{const ok=await runBypass(()=>btn.onclick?.call(btn,new Event('click')));if(ok===true){dirtySchedule.delete(String(id));return true}}catch{}
 return false;
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
    text:`${count>1?`${count}개 단체의 `:''}스케줄에 반영하지 않은 변경사항이 있습니다. 저장한 뒤 이동할 수 있습니다.`,
    save:async()=>{const ok=await saveDrafts(pendingOwners());if(ok)continueMove?.()},
  });
}

// Dismissal is not a save: incomplete modal drafts must remain closable.
function dismissModalDraft(t){
  if(!t.matches('[data-close],.zr-modal-ux-header-close,.zr-modal-ux-close-source,#zrSettlementWorkspaceClose,#zr2EditCancel,#zr2QuickCancel,#zrSharedChangeApplyCancel,#zr14ContentClose'))return false;
  const modal=t.closest('.modal,.zr14-modal');if(!modal)return false;
  if(modal.id==='zr2EditModal')editBaseline='';
  if(modal.id==='zr2QuickModal')quickBaseline='';
  for(const state of forms.values())if(modal.contains(state.root)){
    // Restore persistent editor fields before acknowledging discarded changes.
    for(const old of state.values){if(old.el.isConnected){old.el.value=old.value;old.el.checked=old.checked}}
    acceptForm(state.spec[0]);
  }
  return true;
}

function interceptClick(e){
  if(bypass)return;
  const t=e.target?.closest?.('button,a,input[type="button"],input[type="submit"]')||(e.target?.matches?.('.modal')?e.target:null);if(!t||t.closest('#zrUnsavedGuardModal'))return;
  // A click can land on the backdrop after dragging from an input.
  if(t.matches('.modal')&&pointerStartTarget!==t){e.preventDefault();e.stopImmediatePropagation();return;}

  const closing=t.matches('[data-close],.zr-modal-ux-header-close,.zr-modal-ux-close-source,#zrSettlementWorkspaceClose,#zr2EditCancel,#zr2QuickCancel,#zrSharedChangeApplyCancel,#zr14ContentClose')&&t.closest('.modal,.zr14-modal');
  if(closing&&pendingOwners().length){
    e.preventDefault();e.stopImmediatePropagation();
    ask({text:'수정한 내용이 아직 저장되지 않았습니다. 저장하고 닫거나, 변경사항을 버리고 닫을 수 있습니다.',discard:()=>{dismissModalDraft(t);runBypass(()=>t.click())},save:async()=>{if(await saveDrafts(pendingOwners()))runBypass(()=>t.click())}});return;
  }
  if(t.matches('[data-zr-admin-item][aria-haspopup]'))return;
  const navigation=t.matches('#adminRefresh,[data-zr-admin-item],[data-zr-admin-subitem],[data-zr-subtab-mode],#adminView .admin-tabs button,#adminLogout,[data-close],.zr-modal-ux-header-close,.zr-modal-ux-close-source,#zrSettlementWorkspaceClose,#zrInquiryTemplateCancelEdit,#zrPreviewNotifyTemplateCancel,#zrPreviewNotifyVisitSubtab,#zrPreviewNotifyTemplateSubtab,[data-template-edit],[data-pvn-template-edit],.modal,#zrAdminDailyMemoPrev,#zrAdminDailyMemoNext,#zrAdminDailyMemoToday,#zr2EditCancel,#zr2QuickCancel,#zrSharedChangeApplyCancel,#zr14ContentClose,#zrscPrev,#zrscNext,#zrscToday');
  const owners=navigation?pendingOwners():[];
  if(owners.length){
    e.preventDefault();e.stopImmediatePropagation();
    ask({text:owners.map(owner=>owner.label).join(' · ')+'에 저장하지 않은 변경사항이 있습니다.',save:async()=>{if(await saveDrafts(owners))runBypass(()=>t.click())}});return;
  }
  if(t.matches('#tab-schedule [data-content]'))contentBookingId=String(t.dataset.content||'');
  if(t.id==='zr14SaveSettings'&&contentBookingId)dirtySchedule.add(contentBookingId);
  if(t.matches('#tab-schedule [data-custom-delete]'))markScheduleCard(t);

  if(!scheduleDirty())return;
  const isOtherTab=t.matches('#adminView .admin-tabs button,[data-zr-admin-item],[data-zr-admin-subitem]')&&t.id!=='zrScheduleTabBtn';
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
  window.addEventListener('pointerdown',e=>{pointerStartTarget=e.target},true);
  document.addEventListener('pointerdown',watchForms,true);
  document.addEventListener('focusin',watchForms,true);
  const markForms=e=>{for(const state of forms.values())if(e.target?.closest?.(state.spec[2]))state.touched=true};
  document.addEventListener('input',markForms,true);document.addEventListener('change',markForms,true);document.addEventListener('click',markForms,true);
  window.addEventListener('click',interceptClick,true);
  window.addEventListener('keydown',e=>{if(bypass||e.key!=='Escape')return;if(visible($('zrUnsavedGuardModal'))){e.preventDefault();e.stopImmediatePropagation();closeDecision();return}if(e.target?.matches?.('input,select,textarea,[contenteditable="true"]')){e.stopImmediatePropagation();return}const modal=[...document.querySelectorAll('.modal,.zr14-modal')].reverse().find(el=>visible(el)&&el.id!=='zrUnsavedGuardModal');if(!modal||!pendingOwners().length)return;e.preventDefault();e.stopImmediatePropagation();ask({text:'저장하지 않은 변경사항이 있습니다. 저장하고 닫을까요?',save:async()=>{if(await saveDrafts(pendingOwners()))modal.classList.add('hidden')}})},true);
  document.addEventListener('change',interceptChange,true);
  document.addEventListener('focusin',rememberScheduleDate,true);
  document.addEventListener('pointerdown',rememberScheduleDate,true);
  document.addEventListener('click',e=>{if(e.target?.id==='zr2EditSave'||e.target?.id==='zr2QuickSave')clearModalDirtyWhenSaved()},false);
  document.addEventListener('zr:schedule-apply-success',handleScheduleSaved);
  document.addEventListener('zr:schedule-content-draft-changed',e=>{if(e.detail?.id)dirtySchedule.add(String(e.detail.id))});
  document.addEventListener('click',e=>{if(e.target?.id==='zrScheduleTabBtn')setTimeout(()=>{stableScheduleDate=$('zrscDate')?.value||stableScheduleDate},0)},false);
  window.addEventListener('beforeunload',e=>{if(!anyDirty())return;e.preventDefault();e.returnValue=''});
  const t=setInterval(patchOpeners,300);setTimeout(()=>clearInterval(t),30000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
