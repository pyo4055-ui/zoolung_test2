(()=>{
  if(window.__ZR_ADMIN_V7_INSTALLED)return;
  window.__ZR_ADMIN_V7_INSTALLED=true;

  /* ---------- 공통 엑셀 버튼 UI ---------- */
  const EXCEL_TEXT='엑셀 내려받기';
  const excelButtonClass='zr7-excel-btn';
  function styleExcelButton(btn){
    if(!btn)return;
    btn.textContent=EXCEL_TEXT;
    btn.classList.remove('btn-primary','btn-soft','btn-gray','btn-danger');
    btn.classList.add(excelButtonClass);
  }
  function buttonsWithExcel(root){
    return [...(root||document).querySelectorAll('button')].filter(b=>(b.textContent||'').includes('엑셀'));
  }
  function placeBeside(btn,anchor){
    if(!btn||!anchor)return;
    const parent=anchor.parentElement;
    if(!parent)return;
    parent.style.display='flex';
    parent.style.alignItems='flex-end';
    parent.style.gap='8px';
    parent.style.flexWrap='wrap';
    anchor.insertAdjacentElement('afterend',btn);
  }

  /* ---------- 실제 XLSX 생성기 (예약현황용) ---------- */
  const te=new TextEncoder();
  const xmlEsc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  const crcTable=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c>>>0;}return t;})();
  const crc32=bytes=>{let c=0xFFFFFFFF;for(const b of bytes)c=crcTable[(c^b)&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0;};
  const u16=n=>[n&255,(n>>>8)&255],u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];
  function concatBytes(parts){const len=parts.reduce((s,p)=>s+p.length,0),out=new Uint8Array(len);let o=0;for(const p of parts){out.set(p,o);o+=p.length;}return out;}
  function zipStore(files){
    const locals=[],centrals=[];let offset=0;
    for(const f of files){
      const name=te.encode(f.name),data=typeof f.data==='string'?te.encode(f.data):f.data,crc=crc32(data),flags=0x0800;
      const local=new Uint8Array([0x50,0x4b,0x03,0x04,...u16(20),...u16(flags),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...name]);
      locals.push(local,data);
      const central=new Uint8Array([0x50,0x4b,0x01,0x02,...u16(20),...u16(20),...u16(flags),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...name]);
      centrals.push(central);offset+=local.length+data.length;
    }
    const centralSize=centrals.reduce((s,p)=>s+p.length,0),eocd=new Uint8Array([0x50,0x4b,0x05,0x06,...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(centralSize),...u32(offset),...u16(0)]);
    return concatBytes([...locals,...centrals,eocd]);
  }
  const col=n=>{let s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}return s;};
  const cStr=(ref,val,style=0)=>`<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(val)}</t></is></c>`;
  const cNum=(ref,val,style=0)=>`<c r="${ref}" s="${style}" t="n"><v>${Number(val||0)}</v></c>`;

  function activityMealText(b){
    if(b.mealType==='none')return '식사하지 않음';
    if(b.mealType==='lunchbox')return `도시락 지참${b.mealStart?` (${b.mealStart}${b.mealEnd?'~'+b.mealEnd:''})`:''}`;
    if(b.mealType==='cafe'){
      const items=(b.cafe?.items||[]).filter(x=>Number(x.qty||0)>0).map(x=>`${x.name||''}×${Number(x.qty||0)}`).join(', ');
      return `카페 주문${b.mealStart?` (${b.mealStart}${b.mealEnd?'~'+b.mealEnd:''})`:''}${items?` / ${items}`:''}`;
    }
    return '';
  }
  function activityCancelText(b){
    if(b.status!=='cancelled')return '';
    const src=typeof cancellationSourceText==='function'?cancellationSourceText(b):'취소';
    const dt=b.cancelledAt&&typeof dateTimeText==='function'?dateTimeText(b.cancelledAt):'';
    return [src,dt].filter(Boolean).join(' · ');
  }
  function receptionText(b){
    return b.createdAt&&typeof dateTimeText==='function'?dateTimeText(b.createdAt):String(b.createdAt||'');
  }
  function buildActivityXlsx(list){
    const headers=['접수일','예약일','예약자','전화','입장','퇴장','식사내용','취소','유료인원','인솔자','무료인솔자','매표금액','카페금액'];
    let rows=[],r=1;
    rows.push(`<row r="${r}" ht="26" customHeight="1">${headers.map((h,i)=>cStr(`${col(i+1)}${r}`,h,1)).join('')}</row>`);r++;
    list.forEach(b=>{
      const cancelled=b.status==='cancelled';
      const sText=cancelled?2:0,sNum=cancelled?3:4;
      const values=[
        receptionText(b),String(b.date||''),String(b.managerName||''),String(b.contact||''),String(b.entryTime||''),String(b.exitTime||''),activityMealText(b),activityCancelText(b),
        Number(b.paidCount||0),Number(b.chaperoneCount||0),Number(b.freeChaperone||0),Number(b.entryAmount||0),Number(b.cafe?.amount||0)
      ];
      const cells=values.map((v,i)=>i>=8?cNum(`${col(i+1)}${r}`,v,sNum):cStr(`${col(i+1)}${r}`,v,sText)).join('');
      rows.push(`<row r="${r}" ht="23" customHeight="1">${cells}</row>`);r++;
    });
    const sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="21" customWidth="1"/><col min="2" max="2" width="13" customWidth="1"/><col min="3" max="4" width="18" customWidth="1"/><col min="5" max="6" width="10" customWidth="1"/><col min="7" max="7" width="34" customWidth="1"/><col min="8" max="8" width="28" customWidth="1"/><col min="9" max="11" width="11" customWidth="1"/><col min="12" max="13" width="15" customWidth="1"/></cols><sheetData>${rows.join('')}</sheetData><autoFilter ref="A1:M${Math.max(1,r-1)}"/></worksheet>`;
    const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,#0"/></numFmts><fonts count="2"><font><sz val="10"/><name val="Malgun Gothic"/></font><font><b/><sz val="10"/><name val="Malgun Gothic"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAF4ED"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE7E7E7"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"><color rgb="FFD9DED9"/></left><right style="thin"><color rgb="FFD9DED9"/></right><top style="thin"><color rgb="FFD9DED9"/></top><bottom style="thin"><color rgb="FFD9DED9"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="164" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
    const workbook=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="예약현황" sheetId="1" r:id="rId1"/></sheets></workbook>`;
    const wbRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
    const rootRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
    const types=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;
    return zipStore([{name:'[Content_Types].xml',data:types},{name:'_rels/.rels',data:rootRels},{name:'xl/workbook.xml',data:workbook},{name:'xl/_rels/workbook.xml.rels',data:wbRels},{name:'xl/worksheets/sheet1.xml',data:sheet},{name:'xl/styles.xml',data:styles}]);
  }

  function downloadActivityXlsxV7(){
    if(!adminGuard())return;
    const list=typeof activityFilteredBookings==='function'?activityFilteredBookings():bookings();
    if(!list.length){toast('내려받을 예약 현황이 없습니다.');return;}
    try{
      const bytes=buildActivityXlsx(list),start=$('activityStart')?.value||'',end=$('activityEnd')?.value||'';
      const suffix=start||end?`_${start||'전체'}_${end||'전체'}`:'';
      const blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download=`주렁주렁_예약현황${suffix}.xlsx`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);toast('예약 현황 엑셀을 내려받았습니다.');
    }catch(e){console.error(e);toast('예약 현황 엑셀 생성 중 오류가 발생했습니다.');}
  }
  window.downloadActivityExcel=downloadActivityXlsxV7;
  window.downloadActivityExcelV7=downloadActivityXlsxV7;
  try{downloadActivityExcel=downloadActivityXlsxV7;}catch{}

  /* ---------- 예약현황 / 식사현황 / 아웃소싱 버튼 위치 통일 ---------- */
  function arrangeActivity(){
    const tab=$('tab-activity');if(!tab)return;
    const btn=buttonsWithExcel(tab)[0];if(btn){styleExcelButton(btn);btn.onclick=downloadActivityXlsxV7;}
    const search=[...tab.querySelectorAll('button')].find(b=>(b.textContent||'').trim()==='조회하기');
    if(btn&&search)placeBeside(btn,search);
  }
  function arrangeMeals(){
    const tab=$('tab-meals'),btn=$('downloadMealExcelV3')||buttonsWithExcel(tab)[0];if(!tab||!btn)return;
    styleExcelButton(btn);
    const monthBtn=[...tab.querySelectorAll('button')].find(b=>(b.textContent||'').includes('이번 달'));
    if(monthBtn)placeBeside(btn,monthBtn);
  }
  function arrangeOutsource(){
    const tab=$('tab-outsourcing');if(!tab)return;
    const btn=buttonsWithExcel(tab)[0],search=$('outsourceSearch');
    if(btn){styleExcelButton(btn);if(search)placeBeside(btn,search);}
  }

  /* ---------- 아웃소싱 KPI: 실제 인원 ---------- */
  function assignedVendorId(b){return b?.settlement?.vendorId||b?.outsourcingVendorId||'';}
  function outsourceFilteredForKpi(){
    const start=$('outsourceStart')?.value||'',end=$('outsourceEnd')?.value||'',vendor=$('outsourceVendorFilter')?.value||'';
    return bookings().filter(b=>{
      const id=assignedVendorId(b);
      return id&&id!=='self'&&(!vendor||id===vendor)&&(!start||b.date>=start)&&(!end||b.date<=end);
    });
  }
  function ensureOutsourcePeopleKpi(){
    const fee=$('outsourceKpiFee');if(!fee)return;
    const wrap=fee.closest('.kpi')||fee.parentElement?.parentElement;if(!wrap)return;
    let box=$('outsourceKpiPeopleBox');
    if(!box){
      box=document.createElement('div');box.className='box';box.id='outsourceKpiPeopleBox';box.innerHTML='<span class="help">실제 인원</span><b id="outsourceKpiPeople" style="font-size:14px;line-height:1.55">유료 0명<br>유료인솔 0명<br>무료인솔 0명</b>';wrap.appendChild(box);
    }
    const list=outsourceFilteredForKpi();
    const sums=list.reduce((a,b)=>{const st=b.settlement;if(st?.savedAt){a.paid+=Number(st.actualPaidCount||0);a.pc+=Number(st.actualPaidChaperone||0);a.fc+=Number(st.actualFreeChaperone||0);}return a;},{paid:0,pc:0,fc:0});
    $('outsourceKpiPeople').innerHTML=`유료 ${sums.paid}명<br>유료인솔 ${sums.pc}명<br>무료인솔 ${sums.fc}명`;
  }

  if(typeof window.renderOutsourcingPayments==='function'){
    const base=window.renderOutsourcingPayments;
    window.renderOutsourcingPayments=function(){const out=base();setTimeout(()=>{arrangeOutsource();ensureOutsourcePeopleKpi();},0);return out;};
    try{renderOutsourcingPayments=window.renderOutsourcingPayments;}catch{}
  }
  if(typeof renderMealStatus==='function'){
    const baseMeal=renderMealStatus;
    renderMealStatus=function(){const out=baseMeal();setTimeout(arrangeMeals,0);return out;};
    try{window.renderMealStatus=renderMealStatus;}catch{}
  }
  if(typeof renderActivity==='function'){
    const baseAct=renderActivity;
    renderActivity=function(){const out=baseAct();setTimeout(arrangeActivity,0);return out;};
    try{window.renderActivity=renderActivity;}catch{}
  }

  const style=document.createElement('style');
  style.textContent=`
    .${excelButtonClass}{background:#e8f5ed!important;color:#236244!important;border:1px solid #b9d9c6!important;font-weight:800!important;padding:10px 14px!important;border-radius:10px!important;cursor:pointer!important}
    .${excelButtonClass}:hover{background:#dff0e6!important}
    #outsourceKpiPeopleBox b{display:block;margin-top:4px}
    @media(max-width:760px){#outsourceKpiPeopleBox b{font-size:13px!important}}
  `;document.head.appendChild(style);

  arrangeActivity();arrangeMeals();arrangeOutsource();ensureOutsourcePeopleKpi();
  document.querySelectorAll('[data-tab],#outsourceTabBtn').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>{arrangeActivity();arrangeMeals();arrangeOutsource();ensureOutsourcePeopleKpi();},0)));
})();
