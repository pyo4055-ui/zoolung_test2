import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

let failed=false;
const fail=m=>{failed=true;console.error('FAIL:',m)};
const read=p=>fs.readFileSync(p,'utf8');

for(const file of ['admin_tab_active_fix_v1.js','admin_features_v2_loader.js']){
  try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'})}
  catch(e){fail(`${file} syntax: ${e.stderr?.toString()||e.message}`)}
}

const fix=read('admin_tab_active_fix_v1.js');
const loader=read('admin_features_v2_loader.js');

for(const needle of [
  "#adminView .admin-tabs button",
  "clicked.id!=='zrScheduleTabBtn'",
  "clicked.id!=='zrGuideAdminTab'",
  "gray('zrScheduleTabBtn')",
  "gray('zrGuideAdminTab')",
  "btn.className='btn-gray'"
])if(!fix.includes(needle))fail(`admin tab active cleanup missing: ${needle}`);

if(!loader.includes("['zrAdminTabActiveFixV1','./admin_tab_active_fix_v1.js?v=1']"))fail('admin tab active fix is not loaded by active admin loader');

if(failed){console.error('\nAdmin tab active contract failed.');process.exit(1)}
console.log('Admin tab active contract passed.');
