import fs from 'node:fs';

const admin=fs.readFileSync('admin.html','utf8');
const attention=fs.readFileSync('admin_shell_attention_v1.js','utf8');

function need(ok,message){if(!ok){console.error(message);process.exit(1)}}

need(admin.includes('admin_shell_attention_v1.js?v=1'),'admin entry must load the warning attention shell.');
for(const required of [
  'max-width:none!important',
  'margin-left:0!important',
  'margin-right:0!important',
  '[data-zr-admin-item="warning"]',
  "$('zrWarningUrgent')",
  "$('zrWarningRefresh')",
  "classList.toggle('zr-admin-warning-urgent',urgent)",
  "badge.textContent=count>99?'99+':String(count)",
  '긴급 ${count}건',
  '@keyframes zrAdminUrgentPulse',
  'animation:zrAdminUrgentPulse 1.15s ease-in-out infinite',
  '50%{opacity:.55;filter:saturate(1.5) brightness(1.05)}',
  '@media(prefers-reduced-motion:reduce)',
  "setInterval(refreshHiddenWarning,3000)"
])need(attention.includes(required),`admin attention contract missing: ${required}`);

for(const forbidden of [
  'setDoc(',
  'updateDoc(',
  'deleteDoc(',
  'writeBatch(',
  'setStore(',
  'localStorage.setItem(',
  'sessionStorage.setItem(',
  'zr_bookings',
  'reservations',
  'reservationAvailability'
])need(!attention.includes(forbidden),`admin attention helper must remain display-only: ${forbidden}`);

console.log('OK: admin workspace uses full left-side space and urgent warnings visibly pulse with a count badge without writing reservation data.');
