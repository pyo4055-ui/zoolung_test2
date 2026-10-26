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
    const headers=['접수일','접수자','예약일','예약업체','지역','기관','예약명','담당자','연락처','도착','퇴장','소인','인솔자','예상매출','식사여부','주차(차량)','취소','특이사항','소인','유료인솔자','무료인솔자','총입장','매출','카페','상품','카누','먹이','여권','DM','식사시간','놀이터 이용'];
    const grouped={9:['이용시간',2],11:['예약인원',3],18:['실제입장',5],23:['부대매출',5]},covered=new Set(),merges=['A1:H2'];
    for(const [i,[name,n]] of Object.entries(grouped)){for(let j=Number(i)+1;j<Number(i)+n;j++)covered.add(j);merges.push(`${col(Number(i)+1)}4:${col(Number(i)+n)}4`)}
    const periods=[...new Set(list.map(b=>String(b.date||'').slice(0,7)).filter(Boolean))];
    const title=periods.length===1?`${periods[0].slice(0,4)}년 동탄점 ${Number(periods[0].slice(5))}월 단체`:'주렁주렁 동탄점 단체 예약접수';
    const rows=[`<row r="1" ht="26" customHeight="1">${cStr('A1',title,5)}</row>`,`<row r="2" ht="12" customHeight="1"/>`];
    rows.push(`<row r="4" ht="22" customHeight="1">${headers.map((h,i)=>{if(covered.has(i))return cStr(col(i+1)+'4','',1);if(grouped[i])return cStr(col(i+1)+'4',grouped[i][0],1);merges.push(`${col(i+1)}4:${col(i+1)}5`);return cStr(col(i+1)+'4',h,1)}).join('')}</row>`);
    rows.push(`<row r="5" ht="22" customHeight="1">${headers.map((h,i)=>cStr(col(i+1)+'5',grouped[i]||covered.has(i)?h:'',1)).join('')}</row>`);
    let r=6;
    for(const b of list){
      const original=b.legacyImport?.edited||b.legacyImport?.original||{},st=b.settlement,settled=!!st?.savedAt,cancelled=b.status==='cancelled',textStyle=cancelled?2:settled?6:0,numberStyle=cancelled?3:settled?7:4;
      const actual=k=>settled&&st[k]!=null?Number(st[k]):'';
      const extras=category=>{if(!settled)return '';if(Array.isArray(st.additionalSales)){const items=st.additionalSales.filter(x=>x.category===category);return items.length?items.reduce((n,x)=>n+Number(x.amount||0),0):''}const key={shop:'actualShopAmount',canoe:'actualCanoeAmount',feed:'actualFeedAmount',passport:'actualPassportAmount'}[category];return st[key]!=null?Number(st[key]):''};
      const a=actual('actualPaidCount'),p=actual('actualPaidChaperone'),f=actual('actualFreeChaperone');
      const values=[String(b.createdAt||'').slice(0,10),original['접수자']||b.createdByName||'',String(b.date||''),b.outsourcingVendorSnapshot?.name||st?.vendorSnapshot?.name||original['예약업체']||(b.outsourcingVendorId==='self'?'자체':''),original['지역']||'',b.groupType||'',b.orgName||'',b.managerName||'',b.contact||'',b.entryTime||'',b.exitTime||'',b.paidCount??'',b.chaperoneCount??'',b.totalAmount??'',{none:'X',lunchbox:'도시락',cafe:'카페주문'}[b.mealType]||original['식사여부']||'',original['주차여부']||'',cancelled?'취소':'',b.notes||'',a,p,f,[a,p,f].every(v=>v!=='')?a+p+f:'',actual('ticketAmount'),actual('actualCafeAmount'),extras('shop'),extras('canoe'),extras('feed'),extras('passport'),original['DM']||'',b.mealStart?[b.mealStart,b.mealEnd].filter(Boolean).join('~'):original['식사시간']||'',b.playUse==='yes'?[b.playStart,b.playEnd].filter(Boolean).join('~'):original['놀이터 이용']||''];
      rows.push(`<row r="${r}" ht="34" customHeight="1">${values.map((v,i)=>typeof v==='number'&&Number.isFinite(v)?cNum(col(i+1)+r,v,numberStyle):cStr(col(i+1)+r,v,textStyle)).join('')}</row>`);r++;
    }
    const widths=[13,12,13,14,10,14,28,12,18,9,9,9,9,15,14,12,10,45,9,12,12,10,16,16,15,15,15,15,10,15,15];
    const sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:AE${r-1}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="5" topLeftCell="A6" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${rows.join('')}</sheetData><mergeCells count="${merges.length}">${merges.map(ref=>`<mergeCell ref="${ref}"/>`).join('')}</mergeCells><pageMargins left="0.2" right="0.2" top="0.3" bottom="0.3" header="0" footer="0"/><pageSetup paperSize="8" orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>`;
    const xf=(font,fill,num=0)=>`<xf numFmtId="${num}" fontId="${font}" fillId="${fill}" borderId="1" xfId="0" applyAlignment="1" applyNumberFormat="1"><alignment horizontal="${num?'right':'center'}" vertical="center" wrapText="1"/></xf>`;
    const styles=`<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0"/></numFmts><fonts count="3"><font><sz val="10"/><name val="Malgun Gothic"/></font><font><b/><sz val="10"/><name val="Malgun Gothic"/></font><font><b/><sz val="20"/><name val="Malgun Gothic"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD9D9D9"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"><color rgb="FF000000"/></left><right style="thin"><color rgb="FF000000"/></right><top style="thin"><color rgb="FF000000"/></top><bottom style="thin"><color rgb="FF000000"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="8">${xf(0,0)}${xf(1,2)}${xf(0,2)}${xf(0,2,164)}${xf(0,0,164)}${xf(2,3)}${xf(0,3)}${xf(0,3,164)}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

    const workbook=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="예약정보" sheetId="1" r:id="rId1"/></sheets></workbook>`;
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
