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
    }catch(e3){
      console.error('admin latest patch load failed',e3);
      if(typeof toast==='function')toast('최신 관리자 기능 일부를 불러오지 못했습니다.');
    }
  }catch(e){
    console.error('admin v2 patch load failed',e);
    if(typeof toast==='function') toast('관리자 확장 기능 로딩에 실패했습니다.');
  }
})();
