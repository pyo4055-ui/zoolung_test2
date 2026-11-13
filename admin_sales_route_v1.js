/* Route only sales. ?sales=inline retains the original dashboard for rollback. */
(()=>{'use strict';
const params=new URLSearchParams(location.search);
document.addEventListener('click',event=>{
  if(params.get('sales')==='inline')return;
  const button=event.target.closest('[data-zr-sales-rail-mode],[data-zr-sales-mode]');
  if(!button)return;
  const mode=button.dataset.zrSalesRailMode||button.dataset.zrSalesMode;
  if(!['monthly','prev','year','cafe','revisit'].includes(mode))return;
  event.preventDefault();event.stopImmediatePropagation();
  const dirty=[...(window.ZRAdminDraftOwners?.values()||[])].some(owner=>owner.dirty?.());
  if(dirty){window.ZRDialogs?.alert('작성 중인 내용을 저장하거나 변경을 취소한 뒤 매출 화면으로 이동해주세요.');return}
  location.assign('./admin-sales.html?view='+mode);
},true);
const target=params.get('section');
if(!['today','activity','meals','calendar','schedule','inquiries','previewVisit','reservationChange'].includes(target))return;
let timer=setInterval(()=>{
  const view=document.getElementById('adminView');
  if(!view||getComputedStyle(view).display==='none'||view.classList.contains('hidden')||!window.ZRAdminNavigate)return;
  const leaf={inquiries:'inquiry-list',reservationChange:'reservation-change-list',previewVisit:'preview-visit-list',activity:'activity-list'}[target];
  const child=leaf&&document.querySelector('[data-zr-admin-subitem="'+leaf+'"]');
  if(leaf&&!child)return;
  clearInterval(timer);if(child)child.click();else window.ZRAdminNavigate(target);
},250);
window.addEventListener('pagehide',()=>clearInterval(timer));
})();
