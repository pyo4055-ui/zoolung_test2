(()=>{
'use strict';
const fallback='주렁주렁 동탄점 단체 이용 전 주요 혜택과 예약 기준을 확인해주세요.\n\n단체 요금\n인솔자를 포함한 총 15명 이상부터 단체예약이 가능하며, 단체요금은 1인 15,000원(VAT 포함)입니다.\n\n인솔 혜택\n유료인원 5명당 인솔자 1명이 무료 적용되며, 기준을 초과한 인솔자는 유료로 계산됩니다.\n\n이용 선택\n평일 12:00 이전 입장하는 유치원·어린이집 단체는 식사와 놀이터를 사전 예약할 수 있습니다.\n\n방문 일정\n평일 오전 유치원·어린이집 단체는 파크 입장까지 직원이 안내하며, 입장 후에는 자율 관람합니다. 단체 간 동선이 겹치지 않도록 배정한 방문 일정은 예약확인 페이지에서 확인할 수 있습니다. 그 외 일반단체는 직원 인솔 및 별도 일정 없이 자율 관람합니다.\n\n예약 운영\n단체예약은 평일 기준으로 운영하며, 주말 이용 문의는 1:1 문의를 통해 안내드립니다.\n\n예약 내용과 실제 운영 상황에 따라 세부 일정은 달라질 수 있습니다. 특이사항이 있다면 예약 접수 시 함께 작성해주세요.';
const $=id=>document.getElementById(id);
let dirty=false,saving=false,baseline='';
function normalize(raw){
 if(raw&&typeof raw==='object'&&Array.isArray(raw.sections))return {lead:String(raw.lead||''),sections:raw.sections.map(x=>({title:String(x?.title||''),body:String(x?.body||'')}))};
 const parts=(typeof raw==='string'?raw:fallback).split(/\n\s*\n/);
 return {lead:parts.shift()||'',sections:parts.map(text=>{const at=text.indexOf('\n');return at<0?{title:'안내',body:text}:{title:text.slice(0,at),body:text.slice(at+1)}})};
}
function value(){const settings=window.settings?.()||{};return normalize(settings.groupReservationNoticeBlocks||settings.groupReservationNotice)}
function node(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el}
const input=$('zrGroupNoticeText'),list=$('zrGroupNoticeSections'),button=$('zrGroupNoticeSave');
function read(){return {lead:input.value,sections:[...list.children].map(row=>({title:row.querySelector('input').value,body:row.querySelector('textarea').value}))}}
function mark(){dirty=JSON.stringify(read())!==baseline}
function addRow(section={title:'',body:''}){
 const row=node('div','zr-notice-editor-row');
 const titleLabel=node('label','','소제목'),title=node('input');title.value=section.title;title.maxLength=120;title.placeholder='예: 단체 요금';titleLabel.append(title);
 const bodyLabel=node('label','','내용'),body=node('textarea');body.value=section.body;body.rows=4;body.maxLength=5000;bodyLabel.append(body);
 const remove=node('button','btn-gray','삭제');remove.type='button';remove.setAttribute('aria-label','안내 항목 삭제');remove.onclick=()=>{row.remove();mark()};
 row.append(titleLabel,bodyLabel,remove);list.append(row);return title;
}
function render(){
 const notice=value();
 document.querySelectorAll('#zrCustomerGroupGuideV2 .zr-guide-v2-body').forEach(el=>{
  const signature=JSON.stringify(notice);if(el.dataset.notice===signature)return;
  const cards=node('div','zr-guide-v2-list');
  notice.sections.forEach(section=>{const card=node('div','zr-guide-v2-item');card.append(node('b','',section.title),node('span','',section.body));cards.append(card)});
  el.replaceChildren(node('p','zr-guide-v2-lead',notice.lead),cards);el.dataset.notice=signature;
 });
 if(input&&!dirty&&!saving){input.value=notice.lead;list.replaceChildren();notice.sections.forEach(addRow);baseline=JSON.stringify(read());window.ZRAdminFormDrafts?.capture('groupNotice')}
 window.ZRAdminEditMeta?.show?.($('tab-group-notice'),window.settings?.().adminEditMeta?.groupNotice,'groupNotice');
}
if(input){input.addEventListener('input',mark);list.addEventListener('input',mark);$('zrGroupNoticeAdd').onclick=()=>{addRow().focus();mark()}}
if(button)button.onclick=async()=>{
 if(saving)return false;
 const notice=read();
 if(!notice.lead.trim()||notice.sections.some(x=>!x.title.trim()||!x.body.trim())){window.toast?.('제목과 내용을 입력해주세요.');return false}
 const text=[notice.lead,...notice.sections.map(x=>x.title+'\n'+x.body)].join('\n\n');
 if(text.length>30000){window.toast?.('전체 안내문구는 30,000자까지 입력할 수 있습니다.');return false}
 let saved=false;saving=true;
 const controls=[...$('tab-group-notice').querySelectorAll('input,textarea,button')];controls.forEach(el=>el.disabled=true);button.textContent='저장 중…';
 try{
  const ok=await window.zrReservationSettingsFirebaseSyncV1Api?.save({groupReservationNotice:text,groupReservationNoticeBlocks:notice},'groupNotice');
  if(!ok)throw Error('save failed');
  dirty=false;baseline=JSON.stringify(notice);saved=true;window.ZRAdminFormDrafts?.saved('groupNotice');window.toast?.('저장완료');
 }catch{window.toast?.('저장하지 못했습니다. 다시 시도해주세요.')}
 finally{saving=false;controls.forEach(el=>el.disabled=false);button.textContent='저장';render()}
 return saved;
};
const style=node('style');style.textContent='#tab-group-notice .zr-notice-editor-row{display:grid;gap:12px;padding:18px;margin-top:14px;background:#fffaf6;border:1px solid #eadfd7;border-radius:12px}#tab-group-notice label{display:grid;gap:8px;font-weight:700}#tab-group-notice textarea{line-height:1.7;resize:vertical;min-height:80px}#tab-group-notice .zr-notice-editor-row button{justify-self:end}#zrCustomerGroupGuideV2 .zr-guide-v2-sheet{display:flex;flex-direction:column;overflow:hidden}#zrCustomerGroupGuideV2 .zr-guide-v2-body{overflow-y:auto;min-height:0;overscroll-behavior:contain}#zrCustomerGroupGuideV2 .zr-guide-v2-head,#zrCustomerGroupGuideV2 .zr-guide-v2-actions{flex-shrink:0}#zrCustomerGroupGuideV2 .zr-guide-v2-lead{font-size:16px;font-weight:700;white-space:pre-wrap;overflow-wrap:anywhere}#zrCustomerGroupGuideV2 .zr-guide-v2-item{grid-template-columns:1fr;gap:8px}#zrCustomerGroupGuideV2 .zr-guide-v2-item b{font-size:15px}#zrCustomerGroupGuideV2 .zr-guide-v2-item span{font-size:14px;white-space:pre-wrap;overflow-wrap:anywhere}';document.head.append(style);
document.addEventListener('zr:reservation-settings-synced',render);
document.addEventListener('zr:customer-runtime-ready',render,{once:true});
window.ZRGroupNotice=Object.freeze({render,normalize});
window.addEventListener('beforeunload',e=>{if(dirty||saving){e.preventDefault();e.returnValue=''}});
render();
})();
