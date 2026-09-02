import fs from 'node:fs';
import zlib from 'node:zlib';

const clean=s=>s.replace(/[^A-Za-z0-9+/=]/g,'');
const a=clean(fs.readFileSync('data1.txt','utf8'));
const b=clean(fs.readFileSync('data2.txt','utf8'));
const html=zlib.gunzipSync(Buffer.from(a+b,'base64')).toString('utf8');

function around(label,needle,radius=900){
  const i=html.indexOf(needle);
  console.log(`\n===== ${label} :: ${needle} :: index=${i} =====`);
  if(i<0)return;
  console.log(html.slice(Math.max(0,i-radius),Math.min(html.length,i+needle.length+radius)));
}

for(const [label,needle] of [
  ['LOGIN_MODAL_ID','id="adminLoginModal"'],
  ['LOGIN_MODAL_SINGLE','id=\'adminLoginModal\''],
  ['ADMIN_VIEW','id="adminView"'],
  ['LEGACY_TITLE','단체예약 관리자'],
  ['ADMIN_HEAD_CLASS','admin-head'],
  ['ADMIN_TABS_CLASS','admin-tabs'],
  ['CLOSE_TEXT','닫기'],
  ['CANCEL_TEXT','취소']
])around(label,needle);

const styleNeedles=['.admin-head','.admin-tabs','#adminView','.modal','.modal-card'];
for(const needle of styleNeedles){
  let pos=0,count=0;
  while((pos=html.indexOf(needle,pos))>=0&&count<5){
    console.log(`\n===== CSS/REF ${needle} #${++count} index=${pos} =====`);
    console.log(html.slice(Math.max(0,pos-350),Math.min(html.length,pos+1000)));
    pos+=needle.length;
  }
}
