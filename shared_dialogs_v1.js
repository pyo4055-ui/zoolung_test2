(()=>{
'use strict';
if(window.ZRDialogs)return;
let active=false;const queue=[];
function pump(){
 if(active||!queue.length)return;active=true;const {options:o,resolve}=queue.shift(),previous=document.activeElement;
 const dialog=document.createElement('dialog');dialog.className='zr-common-dialog';dialog.setAttribute('aria-label',o.title||'확인');
 const header=document.createElement('header'),title=document.createElement('strong'),close=document.createElement('button'),body=document.createElement('div'),actions=document.createElement('footer'),ok=document.createElement('button');
 title.textContent=o.title||'확인';close.textContent='닫기';close.type='button';close.setAttribute('aria-label','팝업 닫기');header.append(title,close);body.className='zr-common-dialog-body';body.textContent=String(o.message||'');ok.textContent=o.confirmLabel||'확인';ok.type='button';ok.className='zr-common-dialog-confirm';actions.append(ok);dialog.append(header,body,actions);document.body.append(dialog);
 let input=null;if(o.input){input=document.createElement(o.input.options?'select':'input');if(o.input.options){for(const item of o.input.options){const option=document.createElement('option');option.value=item.value;option.textContent=item.label;input.append(option)}}else input.type=o.input.type||'text';input.value=String(o.input.value??'');input.setAttribute('aria-label',o.message||o.title||'입력');input.style.cssText='display:block;width:100%;box-sizing:border-box;margin-top:12px;font:inherit;padding:10px';if(input.type==='number'){input.min='0';input.step='1'}body.append(input);}
 let finished=false;function finish(value){if(finished)return;finished=true;dialog.close();dialog.remove();active=false;previous?.focus?.({preventScroll:true});resolve(value);pump()}
 let saving=false;const errorLine=document.createElement('div');errorLine.setAttribute('role','alert');errorLine.style.cssText='color:#b42318;margin-top:10px;font-size:13px';body.append(errorLine);
 close.onclick=()=>{if(!saving)finish(false)};ok.onclick=async()=>{
  if(saving||(input&&!input.reportValidity()))return;
  const value=input?input.value:true;
  if(!o.onSubmit){finish(value);return}
  saving=true;ok.disabled=true;close.disabled=true;if(input)input.disabled=true;ok.textContent='저장 중…';errorLine.textContent='';
  try{if(await o.onSubmit(value)!==false)finish(value)}catch(error){errorLine.textContent=error?.message||'저장하지 못했습니다. 다시 시도해주세요.'}
  finally{saving=false;ok.disabled=false;close.disabled=false;if(input)input.disabled=false;ok.textContent=o.confirmLabel||'확인'}
 };dialog.addEventListener('cancel',e=>{e.preventDefault();if(!saving)finish(false)});dialog.showModal();(input||close).focus({preventScroll:true});
}
function ask(options){return new Promise(resolve=>{queue.push({options,resolve});pump()})}
function smsUrl(phone,message){
 const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&Number(navigator.maxTouchPoints||0)>1);
 return 'sms:'+String(phone||'').replace(/[^0-9+]/g,'')+(ios?'&':'?')+'body='+encodeURIComponent(message);
}
async function sms({phone,message,uri,title='확정문자 연결'}){if(!String(phone||'').trim()){await ask({title:'안내',message:'고객 연락처를 확인해주세요.'});return false}const approved=await ask({title,message:`받는 번호: ${phone}\n\n${message}\n\n문자 앱에서 내용을 확인한 후 직접 전송해주세요. 연결만으로 실제 발송이 완료되지는 않습니다.`,confirmLabel:'문자 앱 연결'});if(approved)window.location.href=smsUrl(phone,message);return approved}
const style=document.createElement('style');style.textContent=`html{scrollbar-gutter:stable}.zr-common-dialog{box-sizing:border-box;width:min(560px,calc(100% - 24px));max-height:calc(100dvh - 32px);padding:0;border:0;border-radius:20px;background:#fff;color:#26352d;box-shadow:0 16px 50px #0003;overflow:auto;font-family:inherit}.zr-common-dialog::backdrop{background:#0007}.zr-common-dialog header{position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;gap:14px;background:#fc5404;color:#fff;padding:12px 20px;z-index:1}.zr-common-dialog header strong{font-size:18px;line-height:1.4;overflow-wrap:anywhere}.zr-common-dialog button{font-family:inherit;font-size:14px;font-weight:700;min-height:44px;border:0;border-radius:10px;cursor:pointer;padding:10px 16px}.zr-common-dialog header button{background:#fff;color:#493d33;flex-shrink:0}.zr-common-dialog-body{padding:22px;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.65;font-size:14px}.zr-common-dialog footer{display:flex;justify-content:flex-end;padding:0 22px 22px}.zr-common-dialog-confirm{background:#fc5404;color:#fff}.zr-common-dialog button:focus-visible{outline:3px solid #e2a254;outline-offset:2px}html:has(.zr-common-dialog[open]){overflow:hidden}`;document.head.append(style);
let lastSaveButton=null;const feedbackTimers=new WeakMap();const activeSaveButtons=new Set();
const feedbackFonts=new WeakMap();
function maskSaveLabel(button){if(!feedbackFonts.has(button))feedbackFonts.set(button,[button.style.getPropertyValue('font-size'),button.style.getPropertyPriority('font-size')]);button.style.setProperty('font-size','0','important')}
function unmaskSaveLabel(button){const value=feedbackFonts.get(button);if(value){if(value[0])button.style.setProperty('font-size',...value);else button.style.removeProperty('font-size');feedbackFonts.delete(button)}}
function feedback(button,label){if(!button||!button.isConnected)return;clearTimeout(feedbackTimers.get(button));maskSaveLabel(button);button.dataset.zrSaveFeedback=label;feedbackTimers.set(button,setTimeout(()=>{delete button.dataset.zrSaveLabel;delete button.dataset.zrSaveFeedback;if(!button.dataset.zrSavePending)unmaskSaveLabel(button)},2000))}
function saved(button=lastSaveButton){feedback(button,'저장완료')}
function failed(button=lastSaveButton){feedback(button,'저장실패')}
function finishSave(button,value){
 if(value===true)saved(button);else if(value===false)failed(button);
 return value;
}
function rejectSave(button,error){
 console.error('save action failed',error);failed(button);
 ask({title:'저장 실패',message:'저장하지 못했습니다. 연결과 입력값을 확인한 뒤 다시 저장해주세요.'});
 return false;
}
function trackSavePromise(button,result){
 activeSaveButtons.add(button);
 delete button.dataset.zrSaveFeedback;maskSaveLabel(button);button.dataset.zrSavePending='저장 중…';
 const timer=setTimeout(()=>{button.dataset.zrSavePending='저장 확인 대기'},10000);
 const pending=Promise.resolve(result).then(value=>finishSave(button,value),error=>rejectSave(button,error)).finally(()=>{
  activeSaveButtons.delete(button);
  clearTimeout(timer);delete button.dataset.zrSavePending;
  if(!button.dataset.zrSaveFeedback)unmaskSaveLabel(button);
  if(button.zrSavePromise===pending)delete button.zrSavePromise;
 });
 button.zrSavePromise=pending;return pending;
}
function runSaveFeedback(button,action){
 if(button?.zrSavePromise)return button.zrSavePromise;
 try{
  const result=action();
  return result&&typeof result.then==='function'?trackSavePromise(button,result):finishSave(button,result);
 }catch(error){return rejectSave(button,error)}
}
function bindSaveFeedback(button,action=button?.onclick){
 if(!button)return;
 const original=action;if(typeof original!=='function'||original.__zrSaveFeedback)return;
 const wrapped=function(event){return runSaveFeedback(button,()=>original.call(this,event))};
 wrapped.__zrSaveFeedback=true;button.onclick=wrapped;
}
document.addEventListener('click',e=>{const b=e.target?.closest?.('button');if(b?.closest('.zr-common-dialog'))return;if(b&&(/저장/.test(b.dataset.zrSaveLabel||b.textContent||'')||b.matches?.('[data-apply]'))){lastSaveButton=b;if(!b.dataset.zrSaveLabel)b.dataset.zrSaveLabel=b.textContent;bindSaveFeedback(b)}else lastSaveButton=null},true);
const feedbackStyle=document.createElement('style');feedbackStyle.textContent='html body button[data-zr-save-feedback],html body button[data-zr-save-pending]{font-size:0!important;line-height:0!important;opacity:1!important}button[data-zr-save-feedback]>*,button[data-zr-save-pending]>*{display:none!important}button[data-zr-save-pending]::after{content:attr(data-zr-save-pending);font-size:14px;line-height:1.5}button[data-zr-save-feedback]::after{content:attr(data-zr-save-feedback);font-size:14px;line-height:1.5}';document.head.append(feedbackStyle);
function notify(message){const text=String(message||'');if(/실패|못했|오류|확인해주세요|입력해|선택해|필요합니다|없습니다|불가|초과|다시 시도/.test(text)){if(!activeSaveButtons.size&&/저장|실패|못했/.test(text))failed();return ask({title:'안내',message:text})}if(/저장했|저장되|저장 완료|저장완료/.test(text)||(lastSaveButton&&/수정했습니다|반영했습니다|반영되었습니다|등록했습니다/.test(text))){if(!activeSaveButtons.size)saved();return}if(/완료|했습니다|되었습니다|불러왔|복사했|연결 중|저장 중/.test(text))return;return ask({title:'안내',message:text})}
window.ZRDialogs=Object.freeze({bindSave:bindSaveFeedback,runSave:runSaveFeedback,smsUrl,notify,saved,failed,feedback,prompt:async(message,value='',type='text',onSubmit)=>{const result=await ask({title:'수정',message,confirmLabel:'저장',input:{value,type},onSubmit});return result===false?null:result},select:async(message,value,options,onSubmit)=>{const result=await ask({title:'수정',message,confirmLabel:'저장',input:{value,options},onSubmit});return result===false?null:result},confirm:message=>ask({title:'확인',message}),alert:message=>ask({title:'안내',message}),sms});
})();
