import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';

const clean=s=>s.replace(/[^A-Za-z0-9+/=]/g,'');
const packed=clean(fs.readFileSync('data1.txt','utf8')+fs.readFileSync('data2.txt','utf8'));
const source=gunzipSync(Buffer.from(packed,'base64')).toString('utf8');
const needles=['가이드맵','가이드 맵','주차 및 인솔','주차안내','주차 안내','guideMap','GuideMap','zrParkingInfoCard','zrGuideModal','본 예약은','예약확정'];
for(const needle of needles){
  let from=0,count=0;
  while(true){
    const at=source.indexOf(needle,from);
    if(at<0)break;
    count++;
    console.log(`\n===== SOURCE INSPECT: ${needle} #${count} @ ${at} =====`);
    console.log(source.slice(Math.max(0,at-1200),Math.min(source.length,at+2200)));
    from=at+needle.length;
    if(count>=6)break;
  }
  if(!count)console.log(`\n===== SOURCE INSPECT: ${needle} NOT FOUND =====`);
}
