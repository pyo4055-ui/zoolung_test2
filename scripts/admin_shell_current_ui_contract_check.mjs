import fs from 'node:fs';

const admin=fs.readFileSync('admin.html','utf8');
const ui=fs.readFileSync('admin_shell_current_ui_fix_v1.js','utf8');
const safari=fs.readFileSync('admin_safari_theme_v1.css','utf8');
const safari2=fs.readFileSync('admin_safari_theme_v2.css','utf8');
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
  "link.href='./admin_safari_theme_v1.css?v=1'",
  "link.id='zrAdminSafariThemeV2'",
  "link.href='./admin_safari_theme_v2.css?v=1'",
  "function decorateBrand()",
  "zr-admin-brand-dongtan",
  "function decorateActionButtons()",
  "zr-safari-popup-trigger",
  "zr-safari-payment-trigger"
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
for(const required of [
  '--zr-safari-blue:#2f6b86',
  '--zr-safari-orange-strong:#db7618',
  'background-blend-mode:multiply!important',
  '.zr-admin-brand-dongtan',
  '.zr-admin-shell-collapse',
  'background:var(--zr-safari-wood)!important;color:#fff!important',
  'button.zr-safari-popup-trigger',
  'button.zr-safari-payment-trigger',
  '#adminCalendar .day:nth-child(7n+1)',
  '#adminCalendar .day:nth-child(7n)',
  '#tab-today .zr-today-db.ok',
  '#tab-today .zr-today-metric.em',
  '#tab-today .zr-today-time',
  '.zr-admin-smart-summary-card:first-child',
  '.zr-admin-smart-quick button:first-child'
])need(safari2.includes(required),`admin safari v2 theme missing: ${required}`);
for(const forbidden of ['setDoc(','updateDoc(','deleteDoc(','writeBatch(','setStore(','localStorage.setItem(','sessionStorage.setItem(','zr_bookings','scheduleSharedMemos'])need(!safari2.includes(forbidden),`admin safari v2 theme must remain visual-only: ${forbidden}`);
console.log('OK: safari lodge v2 keeps green as a restrained status signal, uses orange/wood/blue brand actions, separates weekends and preserves distinct detail/payment actions without data writes.');
