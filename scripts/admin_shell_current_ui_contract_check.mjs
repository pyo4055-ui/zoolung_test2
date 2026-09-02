import fs from 'node:fs';

const admin=fs.readFileSync('admin.html','utf8');
const ui=fs.readFileSync('admin_shell_current_ui_fix_v1.js','utf8');
const safari=fs.readFileSync('admin_safari_theme_v1.css','utf8');
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
  "#tab-today{margin-top:0!important}",
  "link.id='zrAdminSafariThemeV1'",
  "link.href='./admin_safari_theme_v1.css?v=1'"
])need(ui.includes(required),`admin current UI cleanup missing: ${required}`);
for(const forbidden of ['setDoc(','updateDoc(','deleteDoc(','writeBatch(','setStore(','localStorage.setItem(','sessionStorage.setItem(','zr_bookings','scheduleSharedMemos'])need(!ui.includes(forbidden),`admin current UI cleanup must remain UI-only: ${forbidden}`);
for(const required of [
  '--zr-safari-brown:#4b171d',
  '--zr-safari-orange:#e38a26',
  '--zr-safari-leaf:#49674b',
  '.zr-admin-shell-logo-slot',
  'data:image/jpeg;base64,',
  '.zr-admin-smart-summary-card:first-child',
  '#adminView .btn-soft',
  '#adminView .day button',
  '#adminLoginModal .modal-card:before'
])need(safari.includes(required),`admin safari theme missing: ${required}`);
console.log('OK: old admin chrome stays hidden and the Zoolung safari theme keeps warm brand colors, logo placement and non-spreadsheet admin controls without data writes.');
