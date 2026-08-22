import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const file='customer_guide_map_admin_ui_v2.js';
const text=fs.readFileSync(file,'utf8');

try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'})}
catch(e){fail(`syntax: ${e.stderr?.toString()||e.message}`)}

for(const needle of [
  "let guideMapDraft=''",
  'let guideMapDirty=false',
  "input.dataset.zrGuideMapDirty='1'",
  "input.addEventListener('input',rememberDraft)",
  "input.addEventListener('blur',()=>{queueMicrotask(restoreDraft)",
  "btn.addEventListener('click',restoreDraft,true)",
  'restoreDraft();renderPreview()'
])if(!text.includes(needle))fail(`guide map draft protection missing: ${needle}`);

for(const forbidden of ['setDoc','getFirestore','onSnapshot','customerGuides','firebase-firestore']){
  if(text.includes(forbidden))fail(`admin UI must not own guide map persistence: ${forbidden}`);
}

if(failed){console.error('\nGuide map draft contract failed.');process.exit(1)}
console.log('Guide map draft contract passed.');
