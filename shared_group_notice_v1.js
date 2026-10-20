(()=>{
'use strict';
const fallback='주렁주렁 동탄점 단체 이용 전 주요 혜택과 예약 기준을 확인해주세요.\n\n단체 요금\n인솔자를 포함한 총 15명 이상부터 단체예약이 가능하며, 단체요금은 1인 15,000원(VAT 포함)입니다.\n\n인솔 혜택\n유료인원 5명당 인솔자 1명이 무료 적용되며, 기준을 초과한 인솔자는 유료로 계산됩니다.\n\n이용 선택\n평일 12:00 이전 입장하는 유치원·어린이집 단체는 식사와 놀이터를 사전 예약할 수 있습니다.\n\n방문 일정\n평일 오전 유치원·어린이집 단체는 파크 입장까지 직원이 안내하며, 입장 후에는 자율 관람합니다. 단체 간 동선이 겹치지 않도록 배정한 방문 일정은 예약확인 페이지에서 확인할 수 있습니다. 그 외 일반단체는 직원 인솔 및 별도 일정 없이 자율 관람합니다.\n\n예약 운영\n단체예약은 평일 기준으로 운영하며, 주말 이용 문의는 1:1 문의를 통해 안내드립니다.\n\n예약 내용과 실제 운영 상황에 따라 세부 일정은 달라질 수 있습니다. 특이사항이 있다면 예약 접수 시 함께 작성해주세요.';
const $=id=>document.getElementById(id);
let dirty=false,saving=false,baseline='';
function value(){const text=window.settings?.().groupReservationNotice;return typeof text==='string'?text:fallback}
function render(){
  const text=value();
  document.querySelectorAll('#zrCustomerGroupGuideV2 .zr-guide-v2-body').forEach(el=>{
    if(el.textContent!==text)el.textContent=text;
    el.style.whiteSpace='pre-line';
  });
  if($('zrGroupNoticeText')&&!dirty&&!saving){$('zrGroupNoticeText').value=text;baseline=text}
  window.ZRAdminEditMeta?.show?.($('tab-group-notice'),window.settings?.().adminEditMeta?.groupNotice,'groupNotice');
}
const input=$('zrGroupNoticeText'),button=$('zrGroupNoticeSave');
if(input)input.addEventListener('input',()=>{dirty=input.value!==baseline});
if(button)button.onclick=async()=>{
  if(saving)return;
  const text=input.value;
  if(!text.trim()){window.toast?.('안내문구를 입력해주세요.');return}
  let saved=false;
  saving=true;button.disabled=true;input.disabled=true;button.textContent='저장 중…';
  try{
    const ok=await window.zrReservationSettingsFirebaseSyncV1Api?.save({groupReservationNotice:text},'groupNotice');
    if(!ok)throw Error('save failed');
    dirty=false;baseline=text;saved=true;window.ZRAdminFormDrafts?.saved('groupNotice');window.toast?.('저장완료');
  }catch{window.toast?.('저장하지 못했습니다. 다시 시도해주세요.')}
  finally{saving=false;button.disabled=false;input.disabled=false;button.textContent='저장';render()}
  return saved;
};
document.addEventListener('zr:reservation-settings-synced',render);
document.addEventListener('zr:customer-runtime-ready',render,{once:true});
window.ZRGroupNotice=Object.freeze({render});
window.addEventListener('beforeunload',e=>{if(dirty||saving){e.preventDefault();e.returnValue=''}});
render();
})();
