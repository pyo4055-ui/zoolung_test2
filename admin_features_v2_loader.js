(async()=>{
  try{
    const urls=['admin2_part1.txt','admin2_part2.txt','admin2_part3.txt','admin2_part4.txt'];
    const rs=await Promise.all(urls.map(u=>fetch(`./${u}?v=2`,{cache:'no-store'})));
    if(rs.some(r=>!r.ok)) throw new Error('관리자 확장 기능 데이터를 불러오지 못했습니다.');
    const code=(await Promise.all(rs.map(r=>r.text()))).join('');
    (0,eval)(code);
  }catch(e){
    console.error('admin v2 patch load failed',e);
    if(typeof toast==='function') toast('관리자 확장 기능 로딩에 실패했습니다.');
  }
})();
