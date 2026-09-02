(()=>{
'use strict';
if(window.__ZR_ADMIN_SECTION_HEADER_HELP_V1)return;
window.__ZR_ADMIN_SECTION_HEADER_HELP_V1=true;

const $=id=>document.getElementById(id);
const SECTIONS=[
  {id:'tab-today',title:'오늘 운영',aliases:['오늘 운영','Today'],help:['오늘 방문하는 확정 단체의 인원·입퇴장·식사·놀이터 정보를 한눈에 확인합니다.','고객의 주차안내·가이드맵·최종 스케줄 확인 여부와 당일 스케줄도 함께 확인할 수 있습니다.','상단 날짜를 바꾸면 다른 날짜의 운영 현황도 확인할 수 있습니다.']},
  {id:'tab-calendar',title:'예약 캘린더',aliases:['예약 캘린더','예약캘린더'],help:['날짜별 예약 현황과 예약 가능 상태를 달력에서 빠르게 확인합니다.','날짜를 선택하면 해당 날짜의 예약 건과 상태를 확인하고 필요한 예약으로 이동할 수 있습니다.']},
  {id:'tab-schedule',title:'스케줄 관리',aliases:['스케줄 관리','스케줄관리'],help:['확정 예약의 4F·5F·식사·놀이터 등 당일 스케줄을 조정하는 화면입니다.','시간 겹침과 퇴장시간을 확인한 뒤 스케줄을 반영하고, 최종 확정한 스케줄은 고객 화면과 현장스케줄에 연결됩니다.']},
  {id:'tab-warning',title:'경고',aliases:['경고','경고 관리','운영 경고'],help:['예약과 운영 준비 중 확인이 필요한 항목을 모아서 보여줍니다.','긴급 항목이 있으면 왼쪽 경고 메뉴가 빨간색으로 표시되므로 우선 확인하면 됩니다.']},
  {id:'tab-activity',title:'예약 현황',aliases:['예약 현황','예약현황'],help:['접수된 예약을 날짜·상태·단체명 등으로 조회하고 상세 내용을 확인합니다.','필요한 조건으로 검색한 뒤 예약 상세 확인이나 엑셀 내려받기를 이용할 수 있습니다.']},
  {id:'tab-meals',title:'식사 현황',aliases:['식사 현황','식사현황'],help:['도시락 지참과 카페 주문 등 단체별 식사 정보를 모아서 확인합니다.','날짜별 식사 준비 현황을 확인하고 필요한 경우 엑셀로 내려받을 수 있습니다.']},
  {id:'tab-cleanup',title:'과거 예약 정리',aliases:['과거 예약 정리','예약 정리','과거예약정리'],help:['지난 예약과 취소 기록을 정리하고 정리 내역을 확인하는 화면입니다.','예약 정리·취소 정리·정리 내역 화면 전환은 왼쪽 메뉴의 하위 메뉴에서 선택하면 됩니다.']},
  {id:'tab-inquiries',title:'1:1 문의',aliases:['1:1 문의','1:1 문의 관리','문의 현황','문의현황'],help:['고객이 남긴 1:1 문의를 확인하고 답변을 관리합니다.','문의 현황과 답변 예시는 왼쪽 1:1 문의의 하위 메뉴에서 바로 이동할 수 있습니다.']},
  {id:'tab-preview-visit',title:'사전답사 관리',aliases:['사전답사 관리','사전답사'],help:['고객이 요청한 사전답사 문의를 확인하고 방문 일정과 상태를 관리합니다.','요청 내용을 확인한 뒤 필요한 일정 안내와 확정 처리를 진행하면 됩니다.']},
  {id:'zrGuideAdminSection',title:'고객 안내 관리',aliases:['고객 안내 관리','고객안내관리','이용 안내 관리'],help:['고객 예약조회 화면에 노출되는 이용안내·가이드맵·주차안내를 관리합니다.','이용 안내·가이드맵·주차 안내 화면은 왼쪽 고객 안내 관리의 하위 메뉴에서 선택하면 됩니다.']},
  {id:'tab-outsourcing',title:'아웃소싱 결제대금',aliases:['아웃소싱 결제대금','아웃소싱 결제 대금'],help:['아웃소싱 단체의 결제 구분과 실제 결제 관련 정보를 확인하고 정리합니다.','현장 결제 확인에 필요한 업체 구분과 정산 정보를 기준으로 확인하면 됩니다.']},
  {id:'tab-menuadmin',title:'카페 메뉴 관리',aliases:['카페 메뉴 관리','카페메뉴관리'],help:['단체 예약에서 선택할 수 있는 카페 메뉴와 가격 정보를 관리합니다.','메뉴를 수정한 뒤 저장하면 고객 예약과 관리자 화면에서 같은 메뉴 정보를 사용합니다.']},
  {id:'tab-settings',title:'예약설정',aliases:['예약설정','예약 설정'],help:['예약 운영기간·예약 제한·공휴일 설정 등 고객 예약에 적용되는 운영 기준을 관리합니다.','스케줄 알림 문자·아웃소싱 업체·예약 확정 문자 설정은 왼쪽 예약설정의 하위 메뉴에서 선택하면 됩니다.']}
];
let observer=null,scheduled=false;

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
    .zr-admin-legacy-intro-hidden{display:none!important}
    .zr-admin-help-modal{position:fixed;inset:0;z-index:2147482100;display:flex;align-items:center;justify-content:center;padding:22px;box-sizing:border-box;background:rgba(30,28,25,.38);font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR",sans-serif}
    .zr-admin-help-modal[hidden]{display:none!important}
    .zr-admin-help-card{width:min(520px,100%);max-height:min(78vh,620px);overflow:auto;background:#fffdfa;border:1px solid #e1d8cf;border-radius:18px;box-shadow:0 22px 60px rgba(45,35,28,.18)}
    .zr-admin-help-head{min-height:62px;box-sizing:border-box;padding:14px 15px 14px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #eee5dd}
    .zr-admin-help-head strong{font-size:19px;color:#2d2925;letter-spacing:-.02em}
    .zr-admin-help-close{width:34px!important;height:34px!important;min-width:34px!important;padding:0!important;border:1px solid #ded7d0!important;border-radius:10px!important;background:#fff!important;color:#4f4944!important;font-size:18px!important;font-weight:850!important;box-shadow:none!important}
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
  modal.innerHTML='<div class="zr-admin-help-card" role="dialog" aria-modal="true" aria-labelledby="zrAdminHelpTitle"><div class="zr-admin-help-head"><strong id="zrAdminHelpTitle">도움말</strong><button type="button" class="zr-admin-help-close" id="zrAdminHelpClose" aria-label="도움말 닫기">×</button></div><div class="zr-admin-help-body" id="zrAdminHelpBody"></div></div>';
  document.body.appendChild(modal);$('zrAdminHelpClose').addEventListener('click',closeHelp);return modal;
}
function openHelp(cfg){
  const modal=ensureModal(),title=$('zrAdminHelpTitle'),body=$('zrAdminHelpBody');
  if(title)title.textContent=`${cfg.title} 도움말`;
  if(body){body.textContent='';for(const line of cfg.help){const row=document.createElement('div');row.className='zr-admin-help-line';row.textContent=line;body.appendChild(row)}}
  modal.hidden=false;setTimeout(()=>$('zrAdminHelpClose')?.focus?.(),0);
}
function closeHelp(){const modal=$('zrAdminSectionHelpModalV1');if(modal)modal.hidden=true}
function ensureHeader(cfg){
  const sec=$(cfg.id);if(!sec)return false;
  let head=sec.querySelector(':scope > .zr-admin-section-head');
  if(!head){
    head=document.createElement('div');head.className='zr-admin-section-head';head.dataset.zrSectionHeader=cfg.id;
    const title=document.createElement('h1');title.className='zr-admin-section-head-title';title.textContent=cfg.title;
    const help=document.createElement('button');help.type='button';help.className='zr-admin-section-help';help.textContent='?';help.setAttribute('aria-label',`${cfg.title} 도움말`);help.title=`${cfg.title} 도움말`;help.addEventListener('click',()=>openHelp(cfg));
    head.append(title,help);sec.prepend(head);
  }
  hideLegacyIntro(sec,cfg);return true;
}
function apply(){injectStyle();SECTIONS.forEach(ensureHeader);ensureModal()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply()})}
function boot(){
  apply();
  const admin=$('adminView');if(admin&&!observer){observer=new MutationObserver(schedule);observer.observe(admin,{subtree:true,childList:true})}
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('zrAdminSectionHelpModalV1')?.hidden)closeHelp()});
  let tries=0;const t=setInterval(()=>{apply();if(++tries>100)clearInterval(t)},150);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('zr:admin-runtime-ready',()=>setTimeout(boot,0),{once:true});
})();
