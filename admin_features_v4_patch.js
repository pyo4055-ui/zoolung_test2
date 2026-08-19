(()=>{
  if(window.__ZR_ADMIN_V4_INSTALLED)return;
  window.__ZR_ADMIN_V4_INSTALLED=true;

  const VENDOR_COLOR_KEY='zr_vendor_colors';
  const DEFAULT_VENDOR_COLORS=['#DCEBFF','#FFE1E1','#E5F7E8','#FFF2CC','#EDE3FF','#FFE5CC','#DDF5F2','#F3E2EC','#E8ECEF','#F0E8D8'];
  const SELF_COLOR='#ECEFF1';

  function vendorColorMap(){
    const raw=getStore(VENDOR_COLOR_KEY,{}),out={...raw};
    (settings().outsourcingVendors||[]).slice(0,10).forEach((v,i)=>{
      if(v?.id&&!out[v.id])out[v.id]=DEFAULT_VENDOR_COLORS[i%DEFAULT_VENDOR_COLORS.length];
    });
    return out;
  }
  function vendorInfo(b){
    const st=b?.settlement||{};
    const snap=st.vendorSnapshot||b?.outsourcingVendorSnapshot;
    const id=st.vendorId||b?.outsourcingVendorId||snap?.id||'self';
    if(id==='self')return {id:'self',name:'자체',color:SELF_COLOR};
    const cur=(settings().outsourcingVendors||[]).find(v=>v.id===id);
    return {id,name:snap?.name||cur?.name||id,color:vendorColorMap()[id]||'#E8ECEF'};
  }
  function isSettled(b){return !!(b?.status==='confirmed'&&b?.settlement?.savedAt);}
  function statusBadgeV4(b){
    if(isSettled(b))return '<span class="status zr4-complete">정산완료</span>';
    if(b.status==='pending')return '<span class="status pending">접수 대기</span>';
    if(b.status==='confirmed')return '<span class="status confirmed">예약 확정</span>';
    if(b.status==='cancelled')return '<span class="status rejected">예약 취소</span>';
    if(b.status==='rejected')return '<span class="status rejected">예약 거절</span>';
    return `<span class="status">${escapeHtml(b.status||'-')}</span>`;
  }
  function vendorBadgeV4(b){
    const v=vendorInfo(b);
    return `<span class="status zr4-vendor" style="background:${v.color};border-color:${v.color};color:#25312a">${escapeHtml(v.name)}</span>`;
  }

  function fixCalendarSearchHandler(){
    const btn=$('adminMonthSearch');
    if(btn)btn.onclick=()=>renderAdmin();
  }

  function augmentVendorColorUi(){
    const rows=$('vendorSettingsRows');if(!rows)return;
    const card=rows.closest('.card');
    const head=card?.querySelector('.zr-vendor-head');
    if(head&&!head.querySelector('[data-vendor-color-head]')){
      const h=document.createElement('div');h.dataset.vendorColorHead='1';h.textContent='표시 색';head.appendChild(h);
    }
    const colors=vendorColorMap();
    [...rows.querySelectorAll('[data-vendor-row]')].forEach((row,i)=>{
      if(row.querySelector('[data-vendor-color]'))return;
      const id=settings().outsourcingVendors?.[i]?.id||('vendor'+(i+1));
      const input=document.createElement('input');
      input.type='color';input.dataset.vendorColor=id;input.value=colors[id]||DEFAULT_VENDOR_COLORS[i%DEFAULT_VENDOR_COLORS.length];input.title='예약현황 업체 뱃지 색상';
      row.appendChild(input);
    });
  }
  function saveVendorColorsFromUi(){
    const rows=$('vendorSettingsRows');if(!rows)return;
    const map=vendorColorMap();
    rows.querySelectorAll('[data-vendor-color]').forEach(inp=>{map[inp.dataset.vendorColor]=inp.value;});
    setStore(VENDOR_COLOR_KEY,map);
  }
  function hookVendorColorSave(){
    const btn=$('saveVendorSettings');if(!btn||btn.dataset.zr4ColorHook)return;
    btn.dataset.zr4ColorHook='1';
    const old=btn.onclick;
    btn.onclick=function(e){saveVendorColorsFromUi();if(typeof old==='function')old.call(this,e);setTimeout(augmentVendorColorUi,0);};
  }
  if(typeof renderExtendedSettings==='function'){
    const baseRenderExtendedSettings=renderExtendedSettings;
    renderExtendedSettings=function(){baseRenderExtendedSettings();augmentVendorColorUi();hookVendorColorSave();};
    window.renderExtendedSettings=renderExtendedSettings;
  }

  renderActivity=function(){
    if(!adminGuard())return;
    const list=activityFilteredBookings();
    if($('activityKpiCompleted'))$('activityKpiCompleted').textContent=list.filter(isSettled).length+'건';
    $('activityKpiTotal').textContent=list.length+'건';
    $('activityKpiConfirmed').textContent=list.filter(b=>b.status==='confirmed'&&!isSettled(b)).length+'건';
    $('activityKpiPending').textContent=list.filter(b=>b.status==='pending').length+'건';
    $('activityKpiCancelled').textContent=list.filter(b=>b.status==='cancelled').length+'건';
    $('activityList').innerHTML=list.length?list.map(b=>{
      const st=b.settlement||{};
      return `<div class="booking-item">
        <div class="zr4-badges">${statusBadgeV4(b)}${vendorBadgeV4(b)}</div>
        <div class="row" style="margin-top:7px"><div><b>${escapeHtml(b.orgName)}</b><div class="help">접수 ${dateTimeText(b.createdAt)} · 예약일 ${b.date}</div></div></div>
        <div class="detail-grid">
          <div><b>예약자</b><br>${escapeHtml(b.managerName)}</div><div><b>연락처</b><br>${escapeHtml(b.contact)}</div>
          <div><b>방문시간</b><br>${b.entryTime} ~ ${b.exitTime}</div><div><b>인원</b><br>유료 ${b.paidCount} / 인솔 ${b.chaperoneCount}</div>
          ${isSettled(b)?`<div><b>실제 매표</b><br>${money(st.ticketAmount||0)}</div><div><b>실제 카페</b><br>${money(st.actualCafeAmount||0)}</div>`:''}
          ${b.status==='cancelled'?`<div><b>취소 구분</b><br>${cancellationSourceText(b)}</div><div><b>취소 일시</b><br>${dateTimeText(b.cancelledAt)}</div>`:''}
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn-soft" onclick="openAdminBookingDetail('${b.id}')">자세히</button></div>
      </div>`;
    }).join(''):'<div class="help">선택한 접수기간에 예약 내역이 없습니다.</div>';
  };

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
  const excelCol=n=>{let s='';while(n>0){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}return s;};
  const cStr=(ref,val,style=3)=>`<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(val)}</t></is></c>`;
  const cNum=(ref,val,style=4)=>`<c r="${ref}" s="${style}" t="n"><v>${Number(val||0)}</v></c>`;
  function mealRowsForMonth(ym){
    const out=[],[y,m]=String(ym||'').split('-').map(Number);if(!y||!m)return out;
    for(let d=1,last=new Date(y,m,0).getDate();d<=last;d++)confirmedCafeBookingsForDate(validDateStr(y,m,d)).forEach(b=>out.push(b));
    return out.sort((a,b)=>String(a.date).localeCompare(String(b.date))||(a.mealStart||'99:99').localeCompare(b.mealStart||'99:99')||String(a.orgName||'').localeCompare(String(b.orgName||''),'ko'));
  }
  function buildMealXlsx(ym,list){
    const month=Number(String(ym).slice(5,7))||'',groups=list.map(b=>{
      let items=(b.cafe?.items||[]).filter(it=>Number(it.qty||0)>0).map(it=>({name:it.name||'',qty:Number(it.qty||0),amount:Number(it.subtotal??(Number(it.price||0)*Number(it.qty||0)))}));
      if(!items.length)items=[{name:'미정',qty:'',amount:Number(b.cafe?.amount||0)}];
      return {b,items};
    });
    const total=groups.reduce((s,g)=>s+g.items.reduce((x,it)=>x+Number(it.amount||0),0),0);
    let r=1,rows=[],merges=[];
    rows.push(`<row r="${r}" ht="28" customHeight="1">${cStr(`A${r}`,`${month}월 단체 식사 주문 내역`,1)}</row>`);merges.push(`A${r}:G${r}`);r++;
    rows.push(`<row r="${r}" ht="18" customHeight="1">${cStr(`F${r}`,'최종수정자 :',7)}${cStr(`G${r}`,'',7)}</row>`);r++;
    const now=new Date(),f=n=>String(n).padStart(2,'0'),today=`${now.getFullYear()}-${f(now.getMonth()+1)}-${f(now.getDate())}`;
    rows.push(`<row r="${r}" ht="18" customHeight="1">${cStr(`F${r}`,'최종수정일 :',7)}${cStr(`G${r}`,today,7)}</row>`);r++;
    const heads=['날짜(예약일)','식사시간','단체명','메뉴','수량','금액','특이사항'];
    rows.push(`<row r="${r}" ht="24" customHeight="1">${heads.map((h,i)=>cStr(`${excelCol(i+1)}${r}`,h,2)).join('')}</row>`);r++;
    groups.forEach((g,gi)=>{
      const start=r,end=r+g.items.length-1;
      g.items.forEach((it,i)=>{
        let cells='';
        if(i===0){
          const ds=String(g.b.date||''),dateText=ds.length>=10?`${ds.slice(5,7)}월 ${ds.slice(8,10)}일`:ds;
          cells+=cStr(`A${r}`,dateText,3)+cStr(`B${r}`,g.b.mealStart||'미정',3)+cStr(`C${r}`,g.b.orgName||'',3);
        }
        cells+=cStr(`D${r}`,it.name,3)+(typeof it.qty==='number'?cNum(`E${r}`,it.qty,3):cStr(`E${r}`,it.qty,3))+cNum(`F${r}`,it.amount,4)+cStr(`G${r}`,'',3);
        rows.push(`<row r="${r}" ht="22" customHeight="1">${cells}</row>`);r++;
      });
      if(end>start){merges.push(`A${start}:A${end}`,`B${start}:B${end}`,`C${start}:C${end}`);}
      if(gi<groups.length-1){rows.push(`<row r="${r}" ht="7" customHeight="1"></row>`);r++;}
    });
    rows.push(`<row r="${r}" ht="24" customHeight="1">${cStr(`A${r}`,'합계',5)}${cNum(`F${r}`,total,6)}${cStr(`G${r}`,'',5)}</row>`);merges.push(`A${r}:E${r}`);
    const sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="13" customWidth="1"/><col min="2" max="2" width="10" customWidth="1"/><col min="3" max="3" width="30" customWidth="1"/><col min="4" max="4" width="23" customWidth="1"/><col min="5" max="5" width="9" customWidth="1"/><col min="6" max="6" width="13" customWidth="1"/><col min="7" max="7" width="38" customWidth="1"/></cols><sheetData>${rows.join('')}</sheetData>${merges.length?`<mergeCells count="${merges.length}">${merges.map(x=>`<mergeCell ref="${x}"/>`).join('')}</mergeCells>`:''}</worksheet>`;
    const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,#0"/></numFmts><fonts count="3"><font><sz val="10"/><name val="Malgun Gothic"/></font><font><b/><sz val="10"/><name val="Malgun Gothic"/></font><font><b/><sz val="15"/><name val="Malgun Gothic"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFC000"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="8"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf><xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="164" fontId="1" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
    const workbook=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${month}월 식사주문" sheetId="1" r:id="rId1"/></sheets></workbook>`;
    const wbRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
    const rootRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
    const types=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;
    return zipStore([{name:'[Content_Types].xml',data:types},{name:'_rels/.rels',data:rootRels},{name:'xl/workbook.xml',data:workbook},{name:'xl/_rels/workbook.xml.rels',data:wbRels},{name:'xl/worksheets/sheet1.xml',data:sheet},{name:'xl/styles.xml',data:styles}]);
  }
  function downloadMealXlsxV4(){
    if(!adminGuard())return;
    const ym=$('mealAdminMonth')?.value||'',list=mealRowsForMonth(ym);
    if(!list.length){toast('내려받을 식사 주문 내역이 없습니다.');return;}
    try{
      const bytes=buildMealXlsx(ym,list),month=Number(String(ym).slice(5,7))||'';
      const blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download=`주렁주렁_${month}월_단체식사주문내역.xlsx`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);toast('식사 주문 엑셀을 내려받았습니다.');
    }catch(e){console.error(e);toast('엑셀 생성 중 오류가 발생했습니다.');}
  }
  window.downloadMealExcelV3=downloadMealXlsxV4;
  function hookMealExcel(){const btn=$('downloadMealExcelV3');if(btn){btn.textContent='식사 주문 엑셀로 내려받기 (.xlsx)';btn.onclick=downloadMealXlsxV4;}}

  const style=document.createElement('style');
  style.textContent=`
    .zr4-complete{background:#fff3b8!important;color:#6c5800!important;border:1px solid #ead77e!important}
    .zr4-badges{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.zr4-vendor{font-weight:800}
    .zr-vendor-head,.zr-vendor-row{grid-template-columns:1.18fr .72fr .64fr .72fr .64fr .72fr 56px!important}
    .zr-vendor-row input[type=color]{width:48px;height:38px;padding:3px;cursor:pointer}
    @media(max-width:800px){.zr-vendor-row{grid-template-columns:1fr 1fr!important}.zr-vendor-row input[type=color]{width:100%}}
  `;document.head.appendChild(style);

  fixCalendarSearchHandler();
  if(typeof renderExtendedSettings==='function')renderExtendedSettings();
  augmentVendorColorUi();hookVendorColorSave();hookMealExcel();
  const mealBtn=[...document.querySelectorAll('[data-tab]')].find(x=>x.dataset.tab==='meals');if(mealBtn)mealBtn.addEventListener('click',()=>setTimeout(hookMealExcel,0));
  const settingsBtn=[...document.querySelectorAll('[data-tab]')].find(x=>x.dataset.tab==='settings');if(settingsBtn)settingsBtn.addEventListener('click',()=>setTimeout(()=>{augmentVendorColorUi();hookVendorColorSave();},0));
  if(!$('tab-activity').classList.contains('hidden'))renderActivity();
})();
