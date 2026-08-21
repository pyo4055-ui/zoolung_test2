(async()=>{
  try{
    const urls=['admin2_part1.txt','admin2_part2.txt','admin2_part3.txt','admin2_part4.txt'];
    const rs=await Promise.all(urls.map(u=>fetch(`./${u}?v=2`,{cache:'no-store'})));
    if(rs.some(r=>!r.ok)) throw new Error('관리자 확장 기능 데이터를 불러오지 못했습니다.');
    const code=(await Promise.all(rs.map(r=>r.text()))).join('');
    (0,eval)(code);
    try{
      const r3=await fetch('./admin_features_v3_patch.js?v=3',{cache:'no-store'});
      if(!r3.ok)throw new Error('관리자 v3 패치를 불러오지 못했습니다.');
      (0,eval)(await r3.text());
      const r31=await fetch('./admin_features_v3_excel_fix.js?v=31',{cache:'no-store'});
      if(!r31.ok)throw new Error('식사 엑셀 보정 패치를 불러오지 못했습니다.');
      (0,eval)(await r31.text());
      const r4=await fetch('./admin_features_v4_patch.js?v=4',{cache:'no-store'});
      if(!r4.ok)throw new Error('관리자 v4 패치를 불러오지 못했습니다.');
      (0,eval)(await r4.text());
      const r5=await fetch('./admin_features_v5_patch.js?v=5',{cache:'no-store'});
      if(!r5.ok)throw new Error('관리자 v5 패치를 불러오지 못했습니다.');
      (0,eval)(await r5.text());
      const r6=await fetch('./admin_features_v6_patch.js?v=6',{cache:'no-store'});
      if(!r6.ok)throw new Error('관리자 v6 패치를 불러오지 못했습니다.');
      (0,eval)(await r6.text());
      const r7=await fetch('./admin_features_v7_patch.js?v=7',{cache:'no-store'});
      if(!r7.ok)throw new Error('관리자 v7 패치를 불러오지 못했습니다.');
      (0,eval)(await r7.text());
      const r8=await fetch('./admin_features_v8_patch.js?v=8',{cache:'no-store'});
      if(!r8.ok)throw new Error('관리자 v8 패치를 불러오지 못했습니다.');
      (0,eval)(await r8.text());
      const r9=await fetch('./admin_features_v9_patch.js?v=9',{cache:'no-store'});
      if(!r9.ok)throw new Error('관리자 v9 패치를 불러오지 못했습니다.');
      (0,eval)(await r9.text());

      if(!window.__ZR_CUSTOMER_BOOKING_UX_V22){
        const rux=await fetch('./customer_booking_ux_v22.js?v=22',{cache:'no-store'});
        if(!rux.ok)throw new Error('고객 예약 입력 보정 패치를 불러오지 못했습니다.');
        (0,eval)(await rux.text());
      }

      if(!document.getElementById('zrCustomerVisitGuideV16')){
        const r16=await fetch('./customer_visit_guide_v16.js?v=22',{cache:'no-store'});
        if(!r16.ok)throw new Error('고객 방문 안내 기능을 불러오지 못했습니다.');
        let guide16=await r16.text();
        const oldEntry=`  const key=\`${'${el.id||\'\'} ${el.name||\'\'} ${el.getAttribute(\'aria-label\')||\'\'} ${el.placeholder||\'\'}'}\`.toLowerCase();\n  if(/(^|[^a-z])(entry|admission)(time)?([^a-z]|$)|entrytime|admissiontime/.test(key))return true;\n  const txt=labelText(el).replace(/\\s/g,'');\n  if(txt.includes('입장시간'))return true;\n  return txt.includes('입장')&&!txt.includes('퇴장')&&txt.length<80;`;
        const newEntry=`  const key=\`${'${el.id||\'\'} ${el.name||\'\'} ${el.getAttribute(\'aria-label\')||\'\'} ${el.placeholder||\'\'}'}\`.toLowerCase();\n  if(/play|playground/.test(key))return false;\n  if(/exit|leave|departure|checkout/.test(key))return false;\n  let local='';\n  if(el.id){try{document.querySelectorAll(\`label[for=\"\${CSS.escape(el.id)}\"]\`).forEach(l=>local+=' '+l.textContent)}catch{}}\n  const own=el.closest('label');if(own)local+=' '+own.textContent;\n  const prev=el.previousElementSibling;if(prev&&!prev.matches?.('input,select,textarea,button'))local+=' '+(prev.textContent||'');\n  local=local.replace(/\\s/g,'');\n  if(local.includes('놀이터')||local.includes('퇴장'))return false;\n  if(/(^|[^a-z])(entry|admission)(time)?([^a-z]|$)|entrytime|admissiontime/.test(key))return true;\n  if(local.includes('입장시간')||local.includes('입장'))return true;\n  const txt=labelText(el).replace(/\\s/g,'');\n  if(txt.includes('놀이터')||txt.includes('퇴장'))return false;\n  return txt.includes('입장')&&txt.length<80;`;
        if(!guide16.includes(oldEntry))throw new Error('고객 방문 안내 시간 판별 패치 위치를 찾지 못했습니다.');
        guide16=guide16.replace(oldEntry,newEntry);
        const marker=document.createElement('script');
        marker.id='zrCustomerVisitGuideV16';
        marker.type='application/json';
        document.body.appendChild(marker);
        (0,eval)(guide16);
      }
      if(!document.getElementById('zrCustomerVisitGuideFixV20')){
        const g=document.createElement('script');
        g.id='zrCustomerVisitGuideFixV20';
        g.async=false;
        g.src='./customer_visit_guide_fix_v20.js?v=21';
        document.body.appendChild(g);
      }

      const waitSchedule=setInterval(()=>{
        if(!window.zrReservationFirebase)return;
        clearInterval(waitSchedule);
        if(document.getElementById('zrAdminScheduleScript'))return;
        const s=document.createElement('script');
        s.id='zrAdminScheduleScript';
        s.src='./admin_schedule_tab.js?v=1';
        document.body.appendChild(s);
      },300);
      setTimeout(()=>clearInterval(waitSchedule),15000);
    }catch(e3){
      console.error('admin latest patch load failed',e3);
      if(typeof toast==='function')toast('최신 관리자 기능 일부를 불러오지 못했습니다.');
    }
  }catch(e){
    console.error('admin v2 patch load failed',e);
    if(typeof toast==='function') toast('관리자 확장 기능 로딩에 실패했습니다.');
  }
})();
