import fs from 'node:fs';

const admin=fs.readFileSync('admin.html','utf8');
const smart=fs.readFileSync('admin_smart_panel_v1.js','utf8');

function need(ok,message){if(!ok){console.error(message);process.exit(1)}}

need(admin.includes('admin_smart_panel_v1.js?v=3'),'admin entry must load the fixed smart operations summary.');
for(const required of [
  "id='zrAdminSmartPanelV1'",
  "id=\"zrSmartConfirmedTeams\"",
  "id=\"zrSmartGroupTypes\"",
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
  "function groupType(b)",
  "function typeCounts(rows)",
  "b?.groupType||b?.organizationType||b?.orgType",
  "String(b.status||'')==='pending'",
  "String(b.status||'')==='confirmed'",
  "String(b?.mealType||'')==='cafe'",
  "b?.settlement?.savedAt||b?.settlementStatus==='completed'||b?.settlementCompletedAt",
  "localStorage.getItem('zr_bookings')",
  "localStorage.getItem(INQUIRY_KEY)",
  "document.documentElement.classList.add('zr-admin-smart-open')",
  ".zr-admin-smart-summary-card",
  "setInterval(render,3000)",
  "document.addEventListener('zr:inquiry-replies-changed',render)",
  "document.addEventListener('zr:preview-visits-changed',render)"
])need(smart.includes(required),`admin smart panel contract missing: ${required}`);

for(const forbidden of [
  'zrSmartUrgent',
  'zrAdminSmartHandleV1',
  'zrAdminSmartToggle',
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
])need(!smart.includes(forbidden),`admin smart panel must remain fixed/read-only without old collapse or write behavior: ${forbidden}`);

console.log('OK: fixed admin right rail shows rounded today metrics, group-type team counts, inquiry/preview/reservation queues and secondary quick actions without data writes.');
