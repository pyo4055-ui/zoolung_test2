import fs from 'node:fs';

const admin=fs.readFileSync('admin.html','utf8');
const smart=fs.readFileSync('admin_smart_panel_v1.js','utf8');
const css=fs.readFileSync('admin_design_tokens_v1.css','utf8');

function need(ok,message){if(!ok){console.error(message);process.exit(1)}}

need(admin.includes('admin_smart_panel_v1.js?v=2'),'admin entry must load the refined smart operations panel.');
for(const required of [
  "id='zrAdminSmartPanelV1'",
  "id=\"zrAdminSmartToggle\"",
  "id=\"zrSmartConfirmedTeams\"",
  "id=\"zrSmartVisitors\"",
  "id=\"zrSmartCafeTeams\"",
  "id=\"zrSmartPaidTeams\"",
  "id=\"zrSmartInquiry\"",
  "id=\"zrSmartPreview\"",
  "id=\"zrSmartPendingReservation\"",
  '총 예약 확정 팀',
  '총 방문 인원',
  '카페 주문 단체',
  '결제 완료 팀',
  '처리 대기 현황',
  '1:1 문의',
  '사전답사 문의',
  '예약 대기',
  '빠른 실행',
  '현장스케줄 열기',
  "String(b.status||'')==='pending'",
  "String(b.status||'')==='confirmed'",
  "String(b?.mealType||'')==='cafe'",
  "b?.settlement?.savedAt||b?.settlementStatus==='completed'||b?.settlementCompletedAt",
  "localStorage.getItem('zr_bookings')",
  "localStorage.getItem(INQUIRY_KEY)",
  "html.zr-admin-shell-mounted .zr-admin-smart-panel{display:flex;flex-direction:column}",
  "html:not(.zr-admin-smart-open) .zr-admin-smart-copy",
  "html:not(.zr-admin-smart-open) .zr-admin-smart-body",
  "toggleButton.textContent=open?'›':'‹'",
  "setInterval(render,3000)",
  "document.addEventListener('zr:inquiry-replies-changed',render)",
  "document.addEventListener('zr:preview-visits-changed',render)"
])need(smart.includes(required),`admin smart panel contract missing: ${required}`);

for(const forbidden of [
  'zrSmartUrgent',
  'zrAdminSmartHandleV1',
  'writing-mode:vertical-rl',
  'setDoc(',
  'updateDoc(',
  'deleteDoc(',
  'writeBatch(',
  'setStore(',
  'localStorage.setItem(',
  'sessionStorage.setItem(',
  'firebase-firestore',
  'collection(db',
  'addDoc('
])need(!smart.includes(forbidden),`admin smart panel must remain summary/read-only without the old urgent/vertical-handle behavior: ${forbidden}`);

for(const required of ['overflow:hidden;transition:width .18s ease','white-space:nowrap;overflow:hidden','.zr-admin-shell-group-title','white-space:nowrap'])need(css.includes(required),`admin rail collapse must avoid vertical text reflow: ${required}`);

console.log('OK: admin right rail hides before admin login, mirrors the left rail collapse control, summarizes today confirmed teams/visitors/cafe/payment completion, shows inquiry/preview/reservation queues, keeps quick actions secondary, and performs no data writes.');
