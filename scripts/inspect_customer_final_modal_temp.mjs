import fs from 'node:fs';
import path from 'node:path';
import {gunzipSync} from 'node:zlib';

const needles=['예약 전 최종 확인','확인 후 예약 신청','최종 확인','submitBooking','zrGuideModal','zrPlayGuideModal'];
function walk(dir='.'){
  const out=[];
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules'].includes(ent.name))continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())out.push(...walk(p));
    else if(/\.(js|mjs|html|txt)$/i.test(ent.name))out.push(p);
  }
  return out;
}
for(const file of walk()){
  let text='';try{text=fs.readFileSync(file,'utf8')}catch{continue}
  for(const needle of needles){
    const at=text.indexOf(needle);if(at<0)continue;
    console.log(`\n===== FILE ${file} :: ${needle} @ ${at} =====`);
    console.log(text.slice(Math.max(0,at-1800),Math.min(text.length,at+5200)));
  }
}
const clean=s=>s.replace(/[^A-Za-z0-9+/=]/g,'');
const packed=clean(fs.readFileSync('data1.txt','utf8')+fs.readFileSync('data2.txt','utf8'));
const source=gunzipSync(Buffer.from(packed,'base64')).toString('utf8');
for(const needle of ['submitBooking','playStart','playUse']){
  const at=source.indexOf(needle);if(at>=0){console.log(`\n===== PACKED BASE ${needle} @ ${at} =====`);console.log(source.slice(Math.max(0,at-1800),Math.min(source.length,at+5200)))}
}
