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

      if(!window.__ZR_CUSTOMER_BOOKING_UX_V24){
        const rux=await fetch('./customer_booking_ux_v24.js?v=31',{cache:'no-store'});
        if(!rux.ok)throw new Error('고객 예약 입력 보정 패치를 불러오지 못했습니다.');
        (0,eval)(await rux.text());
      }

      if(!document.getElementById('zrCustomerVisitGuideV16')){
        const r16=await fetch('./customer_visit_guide_v16.js?v=31',{cache:'no-store'});
        if(!r16.ok)throw new Error('고객 방문 안내 기능을 불러오지 못했습니다.');
        let guide16=await r16.text();
        const fnStart=guide16.indexOf('function isEntryControl(el){');
        const fnEnd=guide16.indexOf('\nfunction findVisibleEntry()',fnStart);
        if(fnStart<0||fnEnd<0)throw new Error('고객 방문 안내 시간 판별 함수를 찾지 못했습니다.');
        guide16=guide16.slice(0,fnStart)+
          "function isEntryControl(el){\n  if(!el?.matches?.('select,input')||el.closest('#adminView'))return false;\n  return el.id==='entryTime';\n}"+
          guide16.slice(fnEnd);
        const openNeedle='function openCustomerGuide(control){';
        if(!guide16.includes(openNeedle))throw new Error('고객 방문 안내 팝업 함수를 찾지 못했습니다.');
        guide16=guide16.replace(openNeedle,"function openCustomerGuide(control){if(control?.id!=='entryTime')return;");
        guide16=guide16.replace('function interceptBooking(ev){',"function interceptBooking(ev){if(window.__ZR_FINAL_DIRECT_SUBMIT)return;");
        guide16=guide16.replace('function interceptSubmit(ev){',"function interceptSubmit(ev){if(window.__ZR_FINAL_DIRECT_SUBMIT)return;");
        const marker=document.createElement('script');
        marker.id='zrCustomerVisitGuideV16';
        marker.type='application/json';
        document.body.appendChild(marker);
        (0,eval)(guide16);
      }

      if(!window.__ZR_PLAY_ZOO_GUIDE_GUARD_V27){
        window.__ZR_PLAY_ZOO_GUIDE_GUARD_V27=true;
        document.addEventListener('change',e=>{
          const id=e.target?.id||'';
          if(id!=='playStart'&&id!=='playDuration')return;
          setTimeout(()=>{
            const m=document.getElementById('zrGuideModal');
            if(m&&!m.classList.contains('hidden'))m.classList.add('hidden');
          },45);
        },true);
      }

      if(!window.__ZR_CUSTOMER_GUIDE_FIX_V20){
        const r20=await fetch('./customer_visit_guide_fix_v20.js?v=31',{cache:'no-store'});
        if(!r20.ok)throw new Error('고객 안내 분리 기능을 불러오지 못했습니다.');
        let guide20=await r20.text();
        const playAckNeedle='function playAcknowledged(){';
        if(!guide20.includes(playAckNeedle))throw new Error('놀이터 안내 확인 함수를 찾지 못했습니다.');
        guide20=guide20.replace(playAckNeedle,"function playAcknowledged(){if(window.__ZR_FINAL_DIRECT_SUBMIT)return true;");
        (0,eval)(guide20);
      }

      if(!document.getElementById('zrParkingInfoV31')){
        const p=document.createElement('script');
        p.id='zrParkingInfoV31';
        p.async=false;
        p.src='./parking_info_v31.js?v=34';
        document.body.appendChild(p);
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
