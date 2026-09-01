import fs from 'node:fs';

const admin=fs.readFileSync('admin.html','utf8');
const bootstrap=fs.readFileSync('admin_entry_bootstrap_v1.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const bridgeMarker=String.raw`<script src="./reservation_firebase_bridge.js?v=1"><\/script></body>`;

function need(ok,message){
  if(!ok){console.error(message);process.exit(1)}
}

need(admin.includes("fetch('./index.html?v=admin-entry-1'"),'admin.html must reuse the frozen reservation runtime instead of copying business logic.');
need(admin.includes('admin_entry_bootstrap_v1.js?v=1'),'admin.html must inject the dedicated admin bootstrap.');
need(admin.includes('reservation_firebase_bridge.js?v=1'),'admin.html must preserve the existing reservation Firebase bridge.');
need(!admin.includes('setDoc(')&&!admin.includes('updateDoc(')&&!admin.includes('deleteDoc(')&&!admin.includes('setStore('),'admin.html must remain an entry-only compatibility shell with no data writes.');

need(bootstrap.includes("$('adminLoginModal')"),'dedicated admin entry must use the existing admin login modal.');
need(bootstrap.includes("$('adminLoginSubmit')"),'dedicated admin entry must preserve the existing login submit control.');
need(bootstrap.includes("$('adminPassword')"),'dedicated admin entry must preserve the existing password field.');
need(bootstrap.includes("window.openModal==='function'"),'dedicated admin entry must forward to the existing modal behavior when available.');
need(bootstrap.includes("#startView")&&bootstrap.includes("#customerView")&&bootstrap.includes("#successView")&&bootstrap.includes("#cancelSuccessView"),'dedicated admin entry must hide customer-only surfaces.');
need(bootstrap.includes("#adminLogout"),'dedicated admin entry must return logout to the admin login gate, not the customer landing page.');
need(!bootstrap.includes('setDoc(')&&!bootstrap.includes('updateDoc(')&&!bootstrap.includes('deleteDoc(')&&!bootstrap.includes('setStore('),'admin entry bootstrap must be UI-only and must not write reservation data.');

need(index.includes("fetch('./data1.txt?v=27'")&&index.includes("fetch('./data2.txt?v=27'"),'customer index frozen runtime loader contract changed unexpectedly.');
need(index.includes('./admin_features_v2_loader.js?v=31')&&index.includes('./reservation_firebase_bridge.js?v=1'),'customer index shared runtime dependencies changed unexpectedly.');
need(index.includes(bridgeMarker),'admin compatibility entry injection point no longer exists in index.html.');

console.log('OK: dedicated admin.html is an isolated entry shell over the existing runtime; customer index and all reservation/data behavior remain unchanged.');
