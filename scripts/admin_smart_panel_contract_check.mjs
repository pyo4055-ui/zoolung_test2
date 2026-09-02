import fs from 'node:fs';

const admin=fs.readFileSync('admin.html','utf8');
const smart=fs.readFileSync('admin_smart_panel_v1.js','utf8');

function need(ok,message){if(!ok){console.error(message);process.exit(1)}}

need(admin.includes('admin_smart_panel_v1.js?v=1'),'admin entry must load the smart operations panel.');
for(const required of [
  "id='zrAdminSmartPanelV1'",
  "id='zrAdminSmartHandleV1'",
  "id=\"zrSmartToday\"",
  "id=\"zrSmartUrgent\"",
  "id=\"zrSmartInquiry\"",
  "id=\"zrSmartPreview\"",
  "data-smart-go=\"today\"",
  "data-smart-go=\"warning\"",
  "data-smart-go=\"inquiries\"",
  "data-smart-go=\"previewVisit\"",
  "const INQUIRY_KEY='zr_inquiries';",
  "localStorage.getItem('zr_bookings')",
  "localStorage.getItem(INQUIRY_KEY)",
  "document.documentElement.classList.add('zr-admin-smart-open')",
  "padding-right:calc(var(--zr-admin-smart-width) + 32px)!important",
  "setInterval(render,3000)",
  "document.addEventListener('zr:inquiry-replies-changed',render)",
  "document.addEventListener('zr:preview-visits-changed',render)"
])need(smart.includes(required),`admin smart panel contract missing: ${required}`);

for(const forbidden of [
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
])need(!smart.includes(forbidden),`admin smart panel must remain read-only/navigation-only: ${forbidden}`);

console.log('OK: admin smart panel summarizes today reservations, urgent warnings, unanswered inquiries and preview requests, links to existing navigation, can collapse, and performs no data writes.');
