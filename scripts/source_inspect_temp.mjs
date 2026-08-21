import fs from 'node:fs';
import path from 'node:path';

const needles=['가이드맵','가이드 맵','주차 및 인솔','zrParkingInfoCard','zrGuideModal','position:fixed','bottom:'];
const skip=new Set(['.git','node_modules']);
function walk(dir){
  const out=[];
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(skip.has(ent.name))continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())out.push(...walk(p));
    else if(/\.(js|html|txt|mjs)$/i.test(ent.name))out.push(p);
  }
  return out;
}
for(const file of walk('.')){
  let text='';try{text=fs.readFileSync(file,'utf8')}catch{continue}
  for(const needle of needles){
    let at=text.indexOf(needle);if(at<0)continue;
    console.log(`\n===== FILE INSPECT: ${file} :: ${needle} @ ${at} =====`);
    console.log(text.slice(Math.max(0,at-900),Math.min(text.length,at+1800)));
  }
}
