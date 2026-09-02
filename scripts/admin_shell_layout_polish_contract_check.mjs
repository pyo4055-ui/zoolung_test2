import fs from 'node:fs';

const admin=fs.readFileSync('admin.html','utf8');
const polish=fs.readFileSync('admin_shell_layout_polish_v1.js','utf8');
const specificity=fs.readFileSync('admin_shell_layout_specificity_fix_v1.js','utf8');

function need(ok,message){if(!ok){console.error(message);process.exit(1)}}

need(admin.includes('admin_shell_layout_polish_v1.js?v=1'),'admin entry must load the rounded three-panel workspace polish after the smart panel.');
need(admin.includes('admin_shell_layout_specificity_fix_v1.js?v=1'),'admin entry must load the final column spacing guard after the workspace polish.');

for(const required of [
  "--zr-shell-bg:#f4efe9",
  "--zr-shell-panel:#fffdfa",
  "--zr-admin-smart-width:300px",
  ".zr-admin-shell-rail{",
  "border-radius:20px!important",
  ".zr-admin-shell-header{",
  "border-radius:16px!important",
  "html.zr-admin-shell-mounted .zr-admin-smart-toggle{display:none!important}",
  "html.zr-admin-shell-mounted .zr-admin-smart-panel{display:flex!important",
  "html.zr-admin-shell-mounted body #adminView{",
  "margin:calc(var(--zr-shell-gap) + var(--zr-admin-header-height) + 12px)",
  "background:var(--zr-shell-panel)!important",
  "#tab-today .zr-today-meta{font-size:13.5px!important}",
  "#tab-today .zr-today-note{font-size:13px!important}",
  "id=\"zrAdminShellSearch\"",
  "placeholder=\"메뉴 검색 (Ctrl+K)\"",
  "id=\"zrAdminShellHeaderEdit\"",
  "$('zrAdminShellRail')?.querySelector('.zr-admin-shell-edit')?.click()",
  "document.documentElement.classList.add('zr-admin-smart-open')",
  "root.classList.add('zr-admin-shell-resizing')",
  "setTimeout(()=>root.classList.remove('zr-admin-shell-resizing'),210)",
  "replace(/\\s*\\/\\s*/g,' › ')"
])need(polish.includes(required),`admin rounded workspace polish missing: ${required}`);

for(const required of [
  'html.zr-admin-smart-open.zr-admin-shell-mounted .zr-admin-shell-header',
  'right:calc(var(--zr-admin-smart-width) + (var(--zr-shell-gap) * 2))!important',
  'html.zr-admin-smart-open.zr-admin-shell-mounted body #adminView',
  'padding-right:18px!important'
])need(specificity.includes(required),`admin column spacing guard missing: ${required}`);

for(const source of [polish,specificity])for(const forbidden of [
  'setDoc(',
  'updateDoc(',
  'deleteDoc(',
  'writeBatch(',
  'setStore(',
  'localStorage.setItem(',
  'sessionStorage.setItem(',
  'firebase-firestore',
  'collection(db',
  'addDoc(',
  "localStorage.getItem('zr_bookings')",
  "localStorage.getItem('zr_inquiries')"
])need(!source.includes(forbidden),`admin workspace polish must remain UI-only: ${forbidden}`);

console.log('OK: admin uses rounded left/center/right panels, a rounded searchable top header, a fixed non-collapsible right summary, larger readable center content, stable three-column spacing, and a no-reflow left rail transition without data writes.');
