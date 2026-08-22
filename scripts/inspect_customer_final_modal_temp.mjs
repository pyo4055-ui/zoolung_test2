import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
const clean=s=>s.replace(/[^A-Za-z0-9+/=]/g,'');
const packed=clean(fs.readFileSync('data1.txt','utf8')+fs.readFileSync('data2.txt','utf8'));
const source=gunzipSync(Buffer.from(packed,'base64')).toString('utf8');
for(const needle of ['예약 전 최종 확인','확인 후 예약 신청','방문 전 꼭 확인해주세요','playStart','playUse']){
  let from=0,count=0;
  while(true){const at=source.indexOf(needle,from);if(at<0)break;count++;console.log(`\n===== ${needle} #${count} @ ${at} =====`);console.log(source.slice(Math.max(0,at-2200),Math.min(source.length,at+5200)));from=at+needle.length;if(count>=8)break}
  if(!count)console.log(`\n===== ${needle} NOT FOUND =====`);
}
