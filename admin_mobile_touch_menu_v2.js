(()=>{
'use strict';
if(window.__ZR_ADMIN_MOBILE_TOUCH_MENU_V2)return;
window.__ZR_ADMIN_MOBILE_TOUCH_MENU_V2=true;

const MAX_MOBILE=900;
const LEAVES={
  operation:[
    {label:'오늘 운영',parent:'today'},
    {label:'예약 캘린더',parent:'calendar'},
    {label:'스케줄 관리',parent:'schedule'},
    {label:'경고',parent:'warning'}
  ],
  reservation:[
    {label:'예약 현황',parent:'activity'},
    {label:'식사 현황',parent:'meals'},
    {label:'예약 정리',parent:'cleanup',targetId:'zrCleanupSubtab'},
    {label:'취소 정리',parent:'cleanup',targetId:'zrCancelCleanupSubtab'},
    {label:'정리 내역',parent:'cleanup',targetId:'zrCleanupHistorySubtab'}
  ],
  customer:[
    {label:'문의 현황',parent:'inquiries',targetId:'zrInquiryReplyInquirySubtab'},
    {label:'답변 예시',parent:'inquiries',targetId:'zrInquiryReplyExampleSubtab'},
    {label:'사전답사 현황',parent:'previewVisit',targetId:'zrPreviewNotifyVisitSubtab'},
    {label:'확정문자 예시',parent:'previewVisit',targetId:'zrPreviewNotifyTemplateSubtab'},
    {label:'이용 안내',parent:'guide',targetId:'zrGuideInfoSubtabV1'},
    {label:'가이드맵',parent:'guide',targetId:'zrGuideMapSubtabV1'},
    {label:'주차 안내',parent:'guide',targetId:'zrGuideParkingSubtabV1'}
  ],
  sales:[
    {label:'월매출 현황',parent:'salesDashboard',salesMode:'monthly'},
    {label:'전월매출 현황',parent:'salesDashboard',salesMode:'prev'},
    {label:'전년매출 현황',parent:'salesDashboard',salesMode:'year'},
    {label:'단체 카페매출',parent:'salesDashboard',salesMode:'cafe'},
    {label:'재방문율',parent:'salesDashboard',salesMode:'revisit'},
    {label:'아웃소싱 결제대금',parent:'outsourcing'},
    {label:'카페 메뉴 관리',parent:'menuadmin'}
  ],
  settings:[
    {label:'예약 운영',parent:'settings',targetId:'zrSettingsOperationSubtabV1'},
    {label:'스케줄 알림 문자',parent:'settings',targetId:'zrSettingsScheduleSmsSubtabV1'},
    {label:'아웃소싱 업체 설정',parent:'settings',targetId:'zrSettingsOutsourceSubtabV1'},
    {label:'예약 확정 문자',parent:'settings',targetId:'zrSettingsConfirmSmsSubtabV1'}
  ]
};
const LABELS={operation:'운영',reservation:'예약',customer:'고객',sales:'매출',settings:'설정'};
let panel=null,currentGroup='';
const mobile=()=>window.matchMedia(`(max-width:${MAX_MOBILE}px)`).matches;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function railButton(id){return document.querySelector(`#zrAdminShellRail [data-zr-admin-item="${CSS.escape(id)}"]`)}
function ensure(){
  if(panel)return panel;
  const style=document.createElement('style');
  style.id='zrAdminMobileTouchMenuV2Style';
  style.textContent=`
    @media(max-width:${MAX_MOBILE}px){
      #zrAdminMobileQuickV1{display:none!important;pointer-events:none!important}
      #zrAdminMobileTouchMenuV2{display:none;position:fixed;left:10px;right:10px;bottom:calc(72px + env(safe-area-inset-bottom));z-index:260;max-height:min(58svh,520px);overflow:auto;overscroll-behavior:contain;padding:9px;box-sizing:border-box;border:1px solid #eaded5;border-radius:17px;background:#fffdf9;box-shadow:0 14px 38px rgba(56,39,30,.18);-webkit-overflow-scrolling:touch}
      #zrAdminMobileTouchMenuV2.is-open{display:block}
      #zrAdminMobileTouchMenuV2 .zrm-head{display:flex;align-items:center;justify-content:space-between;padding:4px 5px 8px}
      #zrAdminMobileTouchMenuV2 .zrm-head b{font-size:13px;color:#701418}#zrAdminMobileTouchMenuV2 .zrm-head span{font-size:10px;color:#8a766b}
      #zrAdminMobileTouchMenuV2 .zrm-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
      #zrAdminMobileTouchMenuV2 .zrm-btn{touch-action:manipulation;-webkit-tap-highlight-color:transparent;min-height:46px!important;margin:0!important;padding:8px 10px!important;border:1px solid #eaded5!important;border-radius:11px!important;background:#fffaf6!important;color:#523d33!important;box-shadow:none!important;text-align:left!important;font-size:12px!important;font-weight:850!important;line-height:1.3!important}
      #zrAdminMobileTouchMenuV2 .zrm-btn:active{background:#fff0e3!important;border-color:#e3bba0!important;color:#701418!important}
    }
  `;
  document.head.appendChild(style);
  panel=document.createElement('section');
  panel.id='zrAdminMobileTouchMenuV2';
  panel.setAttribute('aria-label','모바일 빠른 메뉴');
  document.body.appendChild(panel);
  panel.addEventListener('click',e=>{
    const btn=e.target.closest('[data-zrm-index]');
    if(!btn)return;
    e.preventDefault();
    const index=Number(btn.dataset.zrmIndex||0),group=btn.dataset.zrmGroup||'';
    activate(group,index);
  });
  return panel;
}
function open(group){
  if(!mobile()||!LEAVES[group])return;
  const p=ensure();
  if(p.classList.contains('is-open')&&currentGroup===group){close();return}
  currentGroup=group;
  p.innerHTML=`<div class="zrm-head"><b>${esc(LABELS[group]||'')} 메뉴</b><span>마지막 작업 메뉴 바로가기</span></div><div class="zrm-list">${LEAVES[group].map((x,i)=>`<button type="button" class="zrm-btn" data-zrm-group="${group}" data-zrm-index="${i}">${esc(x.label)}</button>`).join('')}</div>`;
  p.classList.add('is-open');
}
function close(){panel?.classList.remove('is-open');currentGroup=''}
async function clickWhenReady(selector,attempts=40){
  for(let i=0;i<attempts;i++){
    const el=document.querySelector(selector);
    if(el){el.click();return true}
    await wait(50);
  }
  return false;
}
async function activate(group,index){
  const leaf=LEAVES[group]?.[index];if(!leaf)return;
  close();
  const parent=railButton(leaf.parent);if(!parent)return;
  if(!parent.classList.contains('is-active'))parent.click();
  if(leaf.targetId)await clickWhenReady(`#${CSS.escape(leaf.targetId)}`);
  else if(leaf.salesMode)await clickWhenReady(`#tab-sales-dashboard [data-zr-sales-mode="${CSS.escape(leaf.salesMode)}"]`,44);
}
function bindBottom(){
  const bottom=document.getElementById('zrAdminMobileBottomV1');
  if(!bottom||bottom.dataset.zrTouchMenuV2==='1')return false;
  bottom.dataset.zrTouchMenuV2='1';
  bottom.addEventListener('touchend',e=>{
    if(!mobile())return;
    const btn=e.target.closest('[data-mobile-group]');if(!btn)return;
    open(btn.dataset.mobileGroup||'');
  },{passive:true});
  bottom.addEventListener('click',e=>{
    if(!mobile())return;
    const btn=e.target.closest('[data-mobile-group]');if(!btn)return;
    if(e.detail===0)open(btn.dataset.mobileGroup||'');
  });
  return true;
}
function boot(){
  ensure();
  let tries=0;const timer=setInterval(()=>{if(bindBottom()||++tries>100)clearInterval(timer)},100);
  document.addEventListener('click',e=>{
    if(!panel?.classList.contains('is-open'))return;
    if(e.target.closest('#zrAdminMobileTouchMenuV2,#zrAdminMobileBottomV1'))return;
    close();
  });
  window.addEventListener('resize',()=>{if(!mobile())close()},{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();