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

const bodyAt=html.indexOf('<body');
console.log(`\n===== BODY_START index=${bodyAt} =====`);
console.log(html.slice(bodyAt,Math.min(html.length,bodyAt+7000)));

for(const [label,needle] of [
  ['LOGIN_MODAL_ID','id="adminLoginModal"'],
  ['ADMIN_VIEW','id="adminView"'],
  ['LEGACY_TITLE','단체예약 관리자'],
  ['ADMIN_HEAD_CLASS','admin-head'],
  ['ADMIN_TABS_CLASS','admin-tabs'],
  ['HEADER_TAG','<header'],
  ['SITE_HEADER_CLASS','site-header'],
  ['TOPBAR_CLASS','topbar'],
  ['TOP_BAR_CLASS','top-bar'],
  ['CLOSE_TEXT','닫기'],
  ['CANCEL_TEXT','취소']
])around(label,needle);

const styleNeedles=['.admin-head','.admin-tabs','#adminView','header{','.header','.site-header','.topbar','.top-bar','main{','body{','.modal','.modal-card'];
for(const needle of styleNeedles){
  let pos=0,count=0;
  while((pos=html.indexOf(needle,pos))>=0&&count<8){
    console.log(`\n===== CSS/REF ${needle} #${++count} index=${pos} =====`);
    console.log(html.slice(Math.max(0,pos-450),Math.min(html.length,pos+1200)));
    pos+=needle.length;
  }
}
