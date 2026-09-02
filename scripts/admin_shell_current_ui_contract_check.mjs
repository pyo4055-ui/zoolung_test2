import fs from 'node:fs';

const admin=fs.readFileSync('admin.html','utf8');
const ui=fs.readFileSync('admin_shell_current_ui_fix_v1.js','utf8');
function need(ok,message){if(!ok){console.error(message);process.exit(1)}}

need(admin.includes('admin_shell_current_ui_fix_v1.js?v=1'),'admin entry must load the current shell cleanup.');
for(const required of [
  "id='zrAdminShellCurrentUiFixV1Style'",
  "btn.id='zrAdminShellRefresh'",
  "btn.textContent='새로고침'",
  "allButtonsByText('새로고침')",
  "const labels=['새로고침','고객 화면','로그아웃']",
  "'단체예약 관리자'",
  "zr-admin-legacy-chrome-hidden",
  "zr-admin-legacy-time-pill-hidden",
  ".zr-admin-smart-summary-card",
  ".zr-admin-smart-type-list",
  "#tab-today{margin-top:0!important}"
])need(ui.includes(required),`admin current UI cleanup missing: ${required}`);
for(const forbidden of ['setDoc(','updateDoc(','deleteDoc(','writeBatch(','setStore(','localStorage.setItem(','sessionStorage.setItem(','zr_bookings','scheduleSharedMemos'])need(!ui.includes(forbidden),`admin current UI cleanup must remain UI-only: ${forbidden}`);
console.log('OK: old admin top chrome/time pill is hidden, one rounded refresh remains in the new header, and right summary cards are visually separated without data writes.');
