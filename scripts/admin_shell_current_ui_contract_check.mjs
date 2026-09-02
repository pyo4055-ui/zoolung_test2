import fs from 'node:fs';

const admin=fs.readFileSync('admin.html','utf8');
const ui=fs.readFileSync('admin_shell_current_ui_fix_v1.js','utf8');
const safari3=fs.readFileSync('admin_safari_theme_v3.css','utf8');
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
  "['zrAdminSafariThemeV1','zrAdminSafariThemeV2']",
  "link.id='zrAdminSafariThemeV3'",
  "link.href='./admin_safari_theme_v3.css?v=2'",
  "function decorateBrand()",
  "zr-admin-brand-dongtan",
  "function decorateCalendar()",
  "zr-cal-sat",
  "zr-cal-sun",
  "zr-cal-has-booking",
  "function decorateActionButtons()",
  "zr-safari-popup-trigger",
  "zr-safari-payment-trigger"
])need(ui.includes(required),`admin current UI cleanup missing: ${required}`);
for(const forbiddenLink of [
  "link.id='zrAdminSafariThemeV1'",
  "link.href='./admin_safari_theme_v1.css?v=1'",
  "link.id='zrAdminSafariThemeV2'",
  "link.href='./admin_safari_theme_v2.css?v=1'"
])need(!ui.includes(forbiddenLink),`legacy safari theme must not be loaded anymore: ${forbiddenLink}`);
for(const forbidden of ['setDoc(','updateDoc(','deleteDoc(','writeBatch(','setStore(','localStorage.setItem(','sessionStorage.setItem(','zr_bookings','scheduleSharedMemos'])need(!ui.includes(forbidden),`admin current UI cleanup must remain UI-only: ${forbidden}`);

for(const required of [
  '--zr-v3-orange:#fc5404',
  '--zr-v3-green:#004b2a',
  '--zr-v3-brown:#470910',
  '--zr-v3-blue:#2f6b86',
  '--zr-v3-leaf:#004b2a',
  'data:image/png;base64,',
  '.zr-admin-shell-logo-slot',
  '#zrAdminShellRail .zr-admin-shell-collapse',
  '.zr-admin-shell-item.is-active',
  '#adminCalendar .day.zr-cal-sat',
  '#adminCalendar .day.zr-cal-sun',
  '#adminCalendar .day.zr-cal-has-booking',
  '#adminCalendar .day.zr-cal-today',
  '#adminCalendar .day>button',
  '#zrActivityOrgModalBtn',
  '.zr-act-today-btn',
  '.zr-act-excel-btn',
  '#tab-today .zr-today-db.ok',
  '#tab-today .zr-today-metric.em',
  '.zr-admin-smart-summary-card:first-child',
  'button.zr-safari-popup-trigger',
  'button.zr-safari-payment-trigger',
  '#adminLoginModal .modal-card:before'
])need(safari3.includes(required),`admin safari v3 theme missing: ${required}`);
for(const forbidden of ['setDoc(','updateDoc(','deleteDoc(','writeBatch(','setStore(','localStorage.setItem(','sessionStorage.setItem(','zr_bookings','scheduleSharedMemos'])need(!safari3.includes(forbidden),`admin safari v3 theme must remain visual-only: ${forbidden}`);

console.log('OK: admin loads one safari v3 visual layer only; Zoolung orange + deep green lead the brand, brown stays secondary, weekends remain blue/coral, and reservation data remains untouched.');
