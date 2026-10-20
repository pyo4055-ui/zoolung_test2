(()=>{
'use strict';
if(window.__ZR_ADMIN_SECTION_HEADER_HELP_V1)return;
window.__ZR_ADMIN_SECTION_HEADER_HELP_V1=true;

const $=id=>document.getElementById(id);
const SECTIONS=[
  {id:'tab-inquiry-reply-examples',title:'단체문의 답변예시',aliases:['단체문의 답변예시','답변 예시','답변 예시 관리'],help:['자주 쓰는 문의 답변을 저장하고 수정합니다.']},
  {id:'tab-today',title:'오늘 운영',aliases:['오늘 운영','Today'],help:['방문 단체의 인원·입퇴장 시간과 먹이 등 준비 내역을 확인합니다. 일반단체는 직원 인솔과 별도 스케줄 없이 자율 관람합니다.','고객의 주차안내·가이드맵·최종 스케줄 확인 여부와 당일 스케줄도 함께 확인할 수 있습니다.','상단 날짜를 바꾸면 다른 날짜의 운영 현황도 확인할 수 있습니다.']},
  {id:'tab-calendar',title:'예약 캘린더',aliases:['예약 캘린더','예약캘린더'],help:['날짜별 예약 현황과 예약 가능 상태를 달력에서 빠르게 확인합니다.','날짜를 선택하면 해당 날짜의 예약 건과 상태를 확인하고 필요한 예약으로 이동할 수 있습니다.']},
  {id:'tab-schedule',title:'스케줄 관리',aliases:['스케줄 관리','스케줄관리'],help:['기본 컨텐츠는 이름·색상을 수정할 수 있습니다. 추가 컨텐츠는 선택한 단체에만 적용됩니다.','시간 겹침과 퇴장시간을 확인한 뒤 스케줄을 반영하고, 최종 확정한 스케줄은 고객 화면과 현장스케줄에 연결됩니다.']},
  {id:'tab-warning',title:'운영 경고',aliases:['경고','경고 관리','운영 경고'],help:['예약과 운영 준비 중 확인이 필요한 항목을 모아서 보여줍니다.','긴급 항목이 있으면 왼쪽 경고 메뉴가 빨간색으로 표시되므로 우선 확인하면 됩니다.']},
  {id:'tab-activity',title:'예약 현황',aliases:['예약 현황','예약현황'],help:['접수된 예약을 날짜·상태·단체명 등으로 조회하고 상세 내용을 확인합니다.','단체명 검색은 날짜 범위와 관계없이 전체 예약에서 찾습니다.']},
  {id:'tab-meals',title:'식사 현황',aliases:['식사 현황','식사현황'],help:['도시락 지참과 카페 주문 등 단체별 식사 정보를 모아서 확인합니다.','날짜별 식사 준비 현황을 확인하고 필요한 경우 엑셀로 내려받을 수 있습니다.']},
  {id:'tab-cleanup',title:'과거 예약 정리',aliases:['과거 예약 정리','예약 정리','과거예약정리'],help:['지난 예약과 취소 기록을 정리하고 정리 내역을 확인하는 화면입니다.','예약 정리·취소 정리·정리 내역 화면 전환은 왼쪽 메뉴의 하위 메뉴에서 선택하면 됩니다.']},
  {id:'tab-inquiry-reply-v1',title:'1:1 문의',aliases:['1:1 문의','1:1 문의 관리','문의 현황','문의현황'],help:['고객이 남긴 1:1 문의를 확인하고 답변을 관리합니다.','문의 현황과 답변 예시는 왼쪽 1:1 문의의 하위 메뉴에서 바로 이동할 수 있습니다.']},
  {id:'tab-preview-visit',title:'사전답사 관리',aliases:['사전답사 관리','사전답사'],help:['고객이 요청한 사전답사 문의를 확인하고 방문 일정과 상태를 관리합니다.','요청 내용을 확인한 뒤 필요한 일정 안내와 확정 처리를 진행하면 됩니다.']},
  {id:'zrGuideAdminSection',title:'고객 안내 설정',aliases:['고객 안내 관리','고객안내관리','이용 안내 관리'],help:['고객 예약조회 화면에 노출되는 이용안내·가이드맵·주차안내를 관리합니다.','이용 안내·가이드맵·주차 안내 화면은 왼쪽 고객 안내 관리의 하위 메뉴에서 선택하면 됩니다.']},
  {id:'tab-outsourcing',title:'아웃소싱 정산',aliases:['아웃소싱 정산','아웃소싱 정산'],help:['실제결제가 저장된 예약만 집계합니다. 취소·거절 예약은 제외합니다.','단체명 검색 시 날짜 범위는 적용하지 않고 업체 조건은 유지합니다.']},
  {id:'tab-menuadmin',title:'카페 메뉴 설정',aliases:['카페 메뉴 관리','카페메뉴관리'],help:['단체 예약에서 선택할 수 있는 카페 메뉴와 가격 정보를 관리합니다.','메뉴를 수정한 뒤 저장하면 고객 예약과 관리자 화면에서 같은 메뉴 정보를 사용합니다.']},
  {id:'tab-settings',title:'예약 설정',aliases:['예약설정','예약 설정'],help:['예약 운영기간·예약 제한·공휴일 설정 등 고객 예약에 적용되는 운영 기준을 관리합니다.','팀 수 제한이 0이면 자동마감을 사용하지 않습니다. 놀이터 제한을 켜면 같은 시간에 한 단체만 예약할 수 있습니다.','문자 문구는 문자 설정에서, 업체별 요금과 수수료는 아웃소싱 업체 설정에서 관리합니다.']}
];
let observer=null,scheduled=false,booted=false,readyTimer=0;

function injectStyle(){
  if($('zrAdminSectionHeaderHelpStyleV1'))return;
  const s=document.createElement('style');s.id='zrAdminSectionHeaderHelpStyleV1';s.textContent=`
    /* Keep the old in-section subtab controls alive for click forwarding, but remove them from the visible workspace. */
    #zrInquiryReplyInnerTabs,#zrCleanupInnerTabs,#zrGuideSubtabsV1,#zrSettingsSubtabsV1{
      position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;
      overflow:hidden!important;clip:rect(0,0,0,0)!important;clip-path:inset(50%)!important;white-space:nowrap!important;border:0!important;
    }
    /* Header Menu Edit is the single visible entry point; retain the footer button only as the existing programmatic target. */
    .zr-admin-shell-footer .zr-admin-shell-edit{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;clip-path:inset(50%)!important;border:0!important}
    .zr-admin-section-head{display:flex;align-items:center;gap:9px;margin:0 0 17px;padding:1px 1px 0;background:transparent!important;border:0!important;box-shadow:none!important}
    .zr-admin-section-head-title{margin:0!important;padding:0!important;font-size:26px!important;line-height:1.25!important;font-weight:950!important;letter-spacing:-.035em!important;color:#282521!important;background:transparent!important}
    .zr-admin-section-help{width:30px!important;height:30px!important;min-width:30px!important;min-height:30px!important;display:grid!important;place-items:center!important;padding:0!important;margin:0!important;border:1px solid #ded6ce!important;border-radius:9px!important;background:#fff!important;color:#625b55!important;box-shadow:none!important;font-size:14px!important;font-weight:950!important;line-height:1!important}
    .zr-admin-section-help:hover{background:#f7f3ee!important;border-color:#cfc5bb!important;color:#3f6f5a!important}
    @media screen{
      #adminView .zr-summary-source{display:none!important}
      #adminView .zr-admin-section-head{flex-wrap:wrap;gap:9px;margin-bottom:12px!important}
      #adminView .zr-admin-summary{display:flex;flex-wrap:wrap;gap:6px;margin-left:auto;align-items:center}
      #adminView .zr-admin-summary span{padding:6px 10px;border:1px solid #e6ded6;border-radius:999px;background:#fffdfa;color:#625b55;font-size:12px;line-height:1.5;font-weight:800}
      #adminView .card,#adminView .zr-cleanup-panel,#adminView .zr-cr-sms-box,#adminView #zrParkingAdminSection,#adminView #zrGuideMapAdminSection{background:#fff!important;border-color:#e6ded6!important;line-height:1.5}
      #adminView .zr-admin-section-head + .card,#adminView .zr-admin-subpanel > section:first-child,#adminView .zr-admin-subpanel > .card:first-child{margin-top:0!important}
      #adminView .zr-ir-head,#adminView .zr-pv-head,#adminView .zr-cleanup-head,#adminView .zr-cr-head{gap:8px;margin-bottom:12px}
      /* Shared presentation for all four SMS settings pages. */
      #adminView :is(#zrSettingsConfirmSmsPanelV1>.card,#zrScheduleCustomerNotifySettingsV1,#zrReservationChangeSmsPanel,#zrPreviewNotifyTemplatePanel){padding:20px!important;border:1px solid #e6ded6;border-radius:16px;background:#fff!important;box-sizing:border-box}
      #adminView :is(#zrSettingsConfirmSmsPanelV1,#zrScheduleCustomerNotifySettingsV1,#zrReservationChangeSmsPanel,#zrPreviewNotifyTemplatePanel) label{display:block;margin:0 0 8px;font-size:14px;line-height:1.5;font-weight:700}
      #adminView :is(#zrSettingsConfirmSmsPanelV1,#zrScheduleCustomerNotifySettingsV1,#zrReservationChangeSmsPanel,#zrPreviewNotifyTemplatePanel) :is(input,select,textarea){box-sizing:border-box;width:100%;padding:10px 12px;border:1px solid #ded6ce;border-radius:10px;background:#fff;color:#39332d;font:inherit}
      #adminView :is(#zrSettingsConfirmSmsPanelV1,#zrScheduleCustomerNotifySettingsV1,#zrReservationChangeSmsPanel,#zrPreviewNotifyTemplatePanel) :is(input,select){height:44px;min-height:44px}
      #adminView :is(#zrSettingsConfirmSmsPanelV1,#zrScheduleCustomerNotifySettingsV1,#zrReservationChangeSmsPanel,#zrPreviewNotifyTemplatePanel) textarea{min-height:180px;line-height:1.65;resize:vertical}
      #adminView :is(#zrSettingsConfirmSmsPanelV1,#zrScheduleCustomerNotifySettingsV1,#zrReservationChangeSmsPanel,#zrPreviewNotifyTemplatePanel) :is(.calc,pre,.zr-cr-sms-preview){margin:12px 0 0;padding:14px;border:1px solid #e6ded6;border-radius:10px;background:#faf7f3;color:#554b42;font:inherit;line-height:1.65;white-space:pre-wrap;overflow-wrap:anywhere}
      #adminView :is(.zr-cr-shared-sms-only,.zr-pvn-editor){padding:0;border:0;background:transparent;display:grid;gap:16px}
      #adminView :is(.zr-pvn-save,.zr-cr-shared-sms-actions,#zrSettingsConfirmSmsPanelV1 .zr-settings-actions,.zr-sms-settings-actions){display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
      #adminView :is(#zrSettingsConfirmSmsPanelV1,#zrScheduleCustomerNotifySettingsV1,#zrReservationChangeSmsPanel,#zrPreviewNotifyTemplatePanel) button{min-height:44px;border-radius:10px;padding:10px 18px}
      @media(max-width:720px){#adminView :is(#zrSettingsConfirmSmsPanelV1>.card,#zrScheduleCustomerNotifySettingsV1,#zrReservationChangeSmsPanel,#zrPreviewNotifyTemplatePanel){padding:16px!important}}
      #adminView .zr-cr-shared-sms-actions,#adminView .zrga-savebar,#adminView .zrpk31-save{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
      #adminView .zr-admin-subpanel,#adminView .zr-cleanup-panel,#adminView .zr-ir-panel,#adminView .zr-pv-panel{margin-top:0!important}
      #adminView .zr-today-metric,#adminView .zr-sales-kpi{border-radius:999px!important;padding:8px 12px!important;min-height:0!important;line-height:1.5}
      #adminView .zr-sales-kpi strong{font-size:18px!important}
      #adminView .zr-sales-kpis{gap:8px!important;margin-bottom:12px!important}
      #adminView .zr-cancel-workspace-title:has(>div:empty){margin-bottom:0}
      #adminView .zr-v25-admin-section,#adminView [data-v25-notice-section]{background:#fff!important;border-color:#e6ded6!important}
      #adminView .zr-unified-sms-preview{margin:0 0 12px}
      #adminView .zr-unified-sms-input{width:100%;min-height:145px;box-sizing:border-box;line-height:1.6}
      #adminView .zr-closure-date-row{display:flex;gap:8px;align-items:end;margin:10px 0}
      #adminView .zr-closure-date-row label{flex:1;max-width:320px}
      #adminView .zr-closure-date-row input{width:100%}
      #adminView .zr-sms-preview pre{white-space:pre-wrap;overflow-wrap:anywhere;min-height:145px;margin:0;font:inherit;padding:14px;background:#faf7f3;border:1px solid #e6ded6;border-radius:12px;line-height:1.6}
      #adminView .zr-sales-filter select{min-height:44px;border:1px solid #e2d9d0;border-radius:10px;background:#fff;padding:8px 12px;font:inherit}
      #adminView .zr-extra-monthly table{width:100%;table-layout:fixed}

      #adminView .zr-admin-section-head-title,#adminView .zr-sales-title{font-size:26px!important;line-height:1.25!important;font-weight:950!important}
      #adminView h2:not(.zr-admin-section-head-title),#adminView h3:not(.zr-admin-section-head-title){font-size:18px!important;line-height:1.4!important}
      #adminView .zr-admin-section-head ~ * .zr-admin-section-head{display:none!important}
    }
    @media screen and (max-width:900px){#adminView .zr-admin-section-head-title,#adminView .zr-sales-title{font-size:22px!important}}
    .zr-admin-legacy-intro-hidden{display:none!important}
    .zr-admin-help-modal{position:fixed;inset:0;z-index:2147482100;display:flex;align-items:center;justify-content:center;padding:22px;box-sizing:border-box;background:rgba(30,28,25,.38);font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif}
    .zr-admin-help-modal[hidden]{display:none!important}
    .zr-admin-help-card{width:min(520px,100%);max-height:min(78vh,620px);overflow:auto;background:#fffdfa;border:1px solid #e1d8cf;border-radius:18px;box-shadow:0 22px 60px rgba(45,35,28,.18)}
    .zr-admin-help-head{min-height:62px;box-sizing:border-box;padding:14px 15px 14px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #eee5dd}
    .zr-admin-help-head strong{font-size:19px;color:#2d2925;letter-spacing:-.02em}
    .zr-admin-help-close{width:54px!important;height:44px!important;min-width:54px!important;padding:0!important;border:1px solid #ded7d0!important;border-radius:10px!important;background:#fff!important;color:#4f4944!important;font-size:14px!important;font-weight:850!important;box-shadow:none!important}
    .zr-admin-help-body{padding:18px;display:grid;gap:11px;color:#554f49;font-size:14px;line-height:1.65}
    .zr-admin-help-line{display:flex;gap:9px;align-items:flex-start;padding:11px 12px;border:1px solid #ebe3dc;border-radius:12px;background:#faf7f3}
    .zr-admin-help-line:before{content:'•';flex:none;color:#3f6f5a;font-weight:950}
    @media(max-width:900px){.zr-admin-section-head-title{font-size:22px!important}.zr-admin-section-head{margin-bottom:13px}.zr-admin-section-help{width:29px!important;height:29px!important;min-width:29px!important}}
  `;document.head.appendChild(s);
}
function text(el){return String(el?.textContent||'').replace(/\s+/g,' ').trim()}
function candidateTopWrappers(sec){return [...sec.children].slice(0,5)}
function hideLegacyIntro(sec,cfg){
  const aliases=new Set(cfg.aliases.map(x=>x.replace(/\s+/g,'').toLowerCase()));
  const candidates=[];
  for(const root of candidateTopWrappers(sec)){
    if(root.classList?.contains('zr-admin-section-head'))continue;
    if(root.matches?.('h1,h2,h3'))candidates.push(root);
    root.querySelectorAll?.('h1,h2,h3').forEach(h=>{if(!h.closest('.zr-admin-section-head'))candidates.push(h)});
  }
  for(const h of candidates){
    const key=text(h).replace(/\s+/g,'').toLowerCase();
    if(!aliases.has(key))continue;
    const parent=h.parentElement;
    const interactive=parent?.querySelector?.('button,input,select,textarea,a[href]');
    const shortParent=parent&&parent!==sec&&parent.parentElement===sec&&text(parent).length<320;
    if(shortParent&&!interactive){parent.classList.add('zr-admin-legacy-intro-hidden');continue}
    h.classList.add('zr-admin-legacy-intro-hidden');
    const next=h.nextElementSibling;
    if(next&&/^(P|SMALL|DIV)$/.test(next.tagName)&&!next.querySelector('button,input,select,textarea,a[href]')&&text(next).length>0&&text(next).length<220)next.classList.add('zr-admin-legacy-intro-hidden');
  }
}
function ensureModal(){
  let modal=$('zrAdminSectionHelpModalV1');if(modal)return modal;
  modal=document.createElement('div');modal.id='zrAdminSectionHelpModalV1';modal.className='zr-admin-help-modal';modal.hidden=true;
  modal.innerHTML='<div class="zr-admin-help-card" role="dialog" aria-modal="true" aria-labelledby="zrAdminHelpTitle"><div class="zr-admin-help-head"><strong id="zrAdminHelpTitle">도움말</strong><button type="button" class="zr-admin-help-close" id="zrAdminHelpClose" aria-label="도움말 닫기">닫기</button></div><div class="zr-admin-help-body" id="zrAdminHelpBody"></div></div>';
  document.body.appendChild(modal);$('zrAdminHelpClose').addEventListener('click',closeHelp);return modal;
}
function movedHelp(sec){return [...(sec?.querySelectorAll('[data-zr-moved-help]')||[])].filter(el=>!el.parentElement?.closest('.hidden,[hidden],.zr-sales-panel:not(.active)')).map(el=>text(el))}
function moveExplanations(sec){
  for(const el of sec.querySelectorAll('[data-zr-help-only],.help,.zr-sales-note,.zr-sales-subtitle,.zrga-help,.zr-cleanup-help,.zr-ir-help,.zr-pv-query-help,.zr-gmap-help')){
    if(el.closest('.modal,[role="dialog"],.zr-admin-section-head')||el.querySelector('input,button,select,textarea,a')||el.closest('.zr-sales-empty-pie'))continue;
    const smsSetting=el.closest('#zrSettingsConfirmSmsPanelV1,#zrScheduleCustomerNotifySettingsV1,#zrReservationChangeSmsPanel,#zrPreviewNotifyTemplatePanel');
    const value=text(el);if(!value||(!smsSetting&&!el.hasAttribute('data-zr-help-only')&&!el.dataset.zrMovedHelp&&!/확인할 수|이동할 수|선택하면|문구|시작일|휴무일|고객 예약|예약 가능|저장 버튼|정리할 수|보관합니다|사용할 수|집계합니다|기준.*집계|직접 변경|자동 연결|저장해두고|기본값은|실제 총매출 기준|정산 건수 기준|날짜별 팀 수/.test(value)))continue;
    if(el.dataset.zrMovedHelp!==value)el.dataset.zrMovedHelp=value;
    if(!el.classList.contains('zr-admin-legacy-intro-hidden'))el.classList.add('zr-admin-legacy-intro-hidden');
  }
}
function openHelp(cfg){
  const modal=ensureModal(),title=$('zrAdminHelpTitle'),body=$('zrAdminHelpBody');
  if(title)title.textContent=`${cfg.title} 도움말`;
  if(body){body.textContent='';for(const line of [...new Set([...cfg.help,...movedHelp($(cfg.id))])]){const row=document.createElement('div');row.className='zr-admin-help-line';row.textContent=line;body.appendChild(row)}}
  modal.hidden=false;setTimeout(()=>$('zrAdminHelpClose')?.focus?.(),0);
}
function closeHelp(){const modal=$('zrAdminSectionHelpModalV1');if(modal)modal.hidden=true}
function summary(sec,head){
  const sources=[['zrTodayTeams','확정 단체'],['zrTodayPeople','총 방문 인원'],['zrTodayMeal','식사 이용'],['zrTodayPlay','놀이터 이용'],['kpiTeams','이번 달 예약'],['kpiPeople','총인원'],['kpiPending','예약 대기'],['activityKpiTotal','조회 예약'],['activityKpiConfirmed','확정'],['activityKpiPending','접수 대기'],['activityKpiCancelled','취소'],['activityKpiCompleted','완료'],['mealKpiTeams','확정 단체'],['mealKpiQty','주문 수량'],['mealKpiAmount','주문 금액'],['zrCancelKpiAll','전체'],['zrCancelKpiPending','확인 필요'],['zrCancelKpiDone','확인완료'],['zrInquiryReplyCount',''],['zrPreviewVisitCount',''],['zrReservationChangeCount',''],['zrCleanupCount',''],['zrCancelCleanupCount',''],['zrCleanupHistoryCount','']];
  const entries=[];
  for(const [id,label] of sources){const node=$(id);if(!node||!sec.contains(node)||node.parentElement?.closest('.hidden,[hidden]'))continue;if(sec.id==='tab-activity'&&sec.classList.contains('zr-cancel-workspace-active')&&!node.closest('#zrActivityCancelWorkspaceV1'))continue;const value=text(node);if(!value)continue;entries.push(label?label+' '+value:value);const original=node.closest('.kpis,.kpi,.zr-cancel-kpis,.zr-today-summary')||node;if(!original.classList.contains('zr-summary-source'))original.classList.add('zr-summary-source');}
  let bar=head.querySelector('.zr-admin-summary');if(!entries.length){bar?.remove();return}if(!bar){bar=document.createElement('div');bar.className='zr-admin-summary';head.append(bar)}
  const values=entries.flatMap(x=>x.split(' · '));const signature=values.join('|');if(bar.dataset.signature===signature)return;bar.dataset.signature=signature;bar.replaceChildren(...values.map(value=>{const chip=document.createElement('span');chip.textContent=value;return chip}));
}
function ensureHeader(cfg){
  const sec=$(cfg.id);if(!sec)return false;
  let head=sec.querySelector(':scope > .zr-admin-section-head');
  if(!head){
    head=document.createElement('div');head.className='zr-admin-section-head';head.dataset.zrSectionHeader=cfg.id;
    const title=document.createElement('h1');title.className='zr-admin-section-head-title';title.textContent=cfg.title;
    const help=document.createElement('button');help.type='button';help.className='zr-admin-section-help';help.textContent='?';help.setAttribute('aria-label',`${cfg.title} 도움말`);help.title=`${cfg.title} 도움말`;help.addEventListener('click',()=>openHelp(cfg));
    head.append(title,help);sec.prepend(head);
    document.dispatchEvent(new CustomEvent('zr:admin-section-header-ready',{detail:{id:cfg.id}}));
  }
  moveExplanations(sec);hideLegacyIntro(sec,cfg);summary(sec,head);return true;
}
function apply(){injectStyle();SECTIONS.forEach(ensureHeader);ensureModal()}
window.ZRAdminHelp={tidy:moveExplanations,refreshSummary:sec=>{const head=sec?.querySelector(':scope > .zr-admin-section-head');if(head)summary(sec,head)},open:(title,help,sec)=>{if(sec)moveExplanations(sec);openHelp({title,help,id:sec?.id})},moved:movedHelp};
const pendingSections=new Set();
function changedSections(records){
  const ids=new Set();
  for(const record of records){
    const target=record.target?.nodeType===1?record.target:record.target?.parentElement;
    for(const cfg of SECTIONS){
      if(target?.closest?.('#'+cfg.id))ids.add(cfg.id);
      for(const node of [...(record.addedNodes||[]),...(record.removedNodes||[])]){
        if(node.nodeType===1&&(node.id===cfg.id||node.querySelector?.('#'+cfg.id)))ids.add(cfg.id);
      }
    }
  }
  return ids;
}
function schedule(records){
  changedSections(records).forEach(id=>pendingSections.add(id));
  if(scheduled||!pendingSections.size)return;
  scheduled=true;requestAnimationFrame(()=>{
    scheduled=false;const ids=new Set(pendingSections);pendingSections.clear();
    SECTIONS.forEach(cfg=>{if(ids.has(cfg.id))ensureHeader(cfg)});
  });
}
function connectObserver(){
  const admin=$('adminView');if(!admin)return false;
  if(!observer){observer=new MutationObserver(schedule);observer.observe(admin,{subtree:true,childList:true})}
  if(readyTimer){clearInterval(readyTimer);readyTimer=0}
  return true;
}
function boot(){
  apply();
  if(!booted){
    booted=true;
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('zrAdminSectionHelpModalV1')?.hidden)closeHelp()});
  }
  if(connectObserver()||readyTimer)return;
  let tries=0;readyTimer=setInterval(()=>{apply();if(connectObserver()||++tries>100){clearInterval(readyTimer);readyTimer=0}},150);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',boot,{once:true});
})();
