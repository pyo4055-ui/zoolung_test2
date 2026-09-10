(()=>{
  if(window.__ZR_ADMIN_V6_INSTALLED)return;
  window.__ZR_ADMIN_V6_INSTALLED=true;

  const currentVendor=id=>(settings().outsourcingVendors||[]).find(v=>v.id===id)||null;
  const assignedVendorId=b=>b?.settlement?.vendorId||b?.outsourcingVendorId||'';
  const fallbackVendor=b=>b?.settlement?.vendorSnapshot||b?.outsourcingVendorSnapshot||null;
  const paidAdmissions=st=>Math.max(0,Number(st?.actualPaidCount||0))+Math.max(0,Number(st?.actualPaidChaperone||0));
  const calcFee=(amount,type,value,multiplier=1)=>{
    amount=Math.max(0,Number(amount||0));value=Math.max(0,Number(value||0));
    if(type==='percent')return Math.round(amount*value/100);
    return Math.round(value*Math.max(0,Number(multiplier||0)));
  };
  const feeRuleText=(type,value,kind)=>type==='percent'?`${Number(value||0)}%`:(kind==='ticket'?`유료 1인당 ${money(Number(value||0))}`:`건당 ${money(Number(value||0))}`);

  function syncSettlementToCurrentRules(b){
    const st=b?.settlement;if(!st||!st.savedAt)return false;
    const id=assignedVendorId(b);if(!id||id==='self')return false;
    const cur=currentVendor(id),old=fallbackVendor(b)||{};
    const rule=cur||old;if(!rule)return false;
    const paid=paidAdmissions(st),ticket=Math.max(0,Number(st.ticketAmount||0)),cafe=Math.max(0,Number(st.actualCafeAmount||0));
    const ticketType=rule.ticketFeeType==='percent'?'percent':'flat',ticketValue=Math.max(0,Number(rule.ticketFeeValue||0));
    const cafeType=rule.cafeFeeType==='percent'?'percent':'flat',cafeValue=Math.max(0,Number(rule.cafeFeeValue||0));
    const ticketFee=calcFee(ticket,ticketType,ticketValue,paid);
    const cafeFee=cafe<=0?0:calcFee(cafe,cafeType,cafeValue,1);
    const snap={
      ...(st.vendorSnapshot||old),
      id,
      name:cur?.name||old.name||id,
      groupPrice:Number(st.ticketUnitPrice??old.groupPrice??cur?.groupPrice??0),
      ticketFeeType:ticketType,ticketFeeValue:ticketValue,
      cafeFeeType:cafeType,cafeFeeValue:cafeValue
    };
    const before=JSON.stringify([st.ticketFee,st.cafeFee,st.totalFee,st.vendorSnapshot]);
    st.vendorSnapshot=snap;
    st.ticketFee=ticketFee;st.cafeFee=cafeFee;st.totalFee=ticketFee+cafeFee;
    return before!==JSON.stringify([st.ticketFee,st.cafeFee,st.totalFee,st.vendorSnapshot]);
  }
  function syncAllSettlementRules(){
    const bs=bookings();let changed=false;
    bs.forEach(b=>{if(syncSettlementToCurrentRules(b))changed=true;});
    if(changed)setStore('zr_bookings',bs);
    return changed;
  }

  function updateVendorHelp(){
    const rows=$('vendorSettingsRows'),card=rows?.closest('.card');if(!card)return;
    const helps=[...card.querySelectorAll('.help')];
    const top=helps.find(x=>x.textContent.includes('실제 결제 저장 시')||x.textContent.includes('과거 정산값'));
    if(top)top.innerHTML='예약 상세의 결제 구분에 <b>자체 + 아래 입력한 업체</b>가 표시됩니다. 업체는 최대 10개까지 등록할 수 있습니다. <b>수수료 방식/값을 변경하면 기존 정산완료 건도 현재 수수료 설정으로 다시 계산됩니다.</b> 단체가는 실제 결제 저장 당시 금액을 유지합니다.';
    const bottom=helps.find(x=>x.textContent.includes('건당은')||x.textContent.includes('유료 1인당'));
    if(bottom)bottom.innerHTML='매표 <b>건당</b>은 실제 유료입장 1인 기준입니다. (실제 유료인원 + 실제 유료인솔) × 건당 수수료로 계산합니다. 카페 건당 수수료는 실제 카페 결제금액이 0원보다 클 때 예약 1건 기준으로 적용됩니다.';
  }

  if(typeof renderExtendedSettings==='function'){
    const base=renderExtendedSettings;
    renderExtendedSettings=function(){base();updateVendorHelp();hookVendorSettingsSave();};
    window.renderExtendedSettings=renderExtendedSettings;
  }
  function hookVendorSettingsSave(){
    const btn=$('saveVendorSettings');if(!btn||btn.dataset.zr6Hook)return;
    btn.dataset.zr6Hook='1';
    const old=btn.onclick;
    btn.onclick=function(e){
      if(typeof old==='function')old.call(this,e);
      setTimeout(()=>{
        syncAllSettlementRules();updateVendorHelp();
        if(typeof window.renderOutsourcingPayments==='function')window.renderOutsourcingPayments();
        if(typeof renderActivity==='function'&&!$('tab-activity')?.classList.contains('hidden'))renderActivity();
      },0);
    };
  }

  if(typeof window.renderOutsourcingPayments==='function'){
    const base=window.renderOutsourcingPayments;
    window.renderOutsourcingPayments=function(){syncAllSettlementRules();base();installOutsourceExcelButton();};
    renderOutsourcingPayments=window.renderOutsourcingPayments;
  }

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
  const cStr=(ref,val,style=0)=>`<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(val)}</t></is></c>`;
  const cNum=(ref,val,style=0)=>`<c r="${ref}" s="${style}" t="n"><v>${Number(val||0)}</v></c>`;
  const cBlank=(ref,style=0)=>`<c r="${ref}" s="${style}"/>`;
  const cFormula=(ref,formula,cached,style=0)=>`<c r="${ref}" s="${style}"><f>${xmlEsc(formula)}</f><v>${Number(cached||0)}</v></c>`;
  const fmtDate=d=>{const s=String(d||'');return s.length>=10?`${s.slice(5,7)}월 ${s.slice(8,10)}일`:s;};
  const safeSheetName=(name,i)=>{let s=String(name||`업체${i+1}`).replace(/[\\\/?*\[\]:]/g,' ').trim()||`업체${i+1}`;return s.slice(0,31);};
  const titleFor=(start,end,vendorName)=>{
    const s=String(start||''),e=String(end||'');
    if(/^\d{4}-\d{2}-\d{2}$/.test(s)&&/^\d{4}-\d{2}-\d{2}$/.test(e)&&s.slice(0,7)===e.slice(0,7))return `${s.slice(0,4)}년 ${s.slice(5,7)}월 동탄 주렁주렁 (${vendorName})`;
    return `${s||'전체'}${e&&e!==s?' ~ '+e:''} 동탄 주렁주렁 (${vendorName})`;
  };
  const vendorRuleFor=(id,b)=>currentVendor(id)||fallbackVendor(b)||{id,name:id,ticketFeeType:'flat',ticketFeeValue:0,cafeFeeType:'flat',cafeFeeValue:0};

  function filteredOutsourceBookings(){
    syncAllSettlementRules();
    const start=$('outsourceStart')?.value||'',end=$('outsourceEnd')?.value||'',filter=$('outsourceVendorFilter')?.value||'';
    return bookings().filter(b=>{
      const id=assignedVendorId(b);return id&&id!=='self'&&(!filter||id===filter)&&(!start||b.date>=start)&&(!end||b.date<=end);
    }).sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.orgName||'').localeCompare(String(b.orgName||''),'ko'));
  }

  function sheetXmlForVendor(vendor,rows,title){
    const ticketRule=feeRuleText(vendor.ticketFeeType,vendor.ticketFeeValue,'ticket');
    const cafeRule=feeRuleText(vendor.cafeFeeType,vendor.cafeFeeValue,'cafe');
    const headers=['입장 날짜','단체명','입장','입장매출',`매표 수수료 (${ticketRule})`,'카페매출',`카페 수수료 (${cafeRule})`,'총 수수료','비고'];
    let r=1,xmlRows=[];
    xmlRows.push(`<row r="${r}" ht="28" customHeight="1">${cStr(`A${r}`,title,1)}</row>`);r++;
    xmlRows.push(`<row r="${r}" ht="24" customHeight="1">${headers.map((h,i)=>cStr(`${String.fromCharCode(65+i)}${r}`,h,2)).join('')}</row>`);r++;
    let totalTicket=0,totalTicketFee=0,totalCafe=0,totalCafeFee=0,totalFee=0,totalAdmissions=0;
    rows.forEach(b=>{
      const st=b.settlement,done=!!(st&&st.savedAt),ad=done?paidAdmissions(st):0,ticket=done?Number(st.ticketAmount||0):0,ticketFee=done?Number(st.ticketFee||0):0,cafe=done?Number(st.actualCafeAmount||0):0,cafeFee=done?Number(st.cafeFee||0):0,fee=done?Number(st.totalFee||0):0;
      totalAdmissions+=ad;totalTicket+=ticket;totalTicketFee+=ticketFee;totalCafe+=cafe;totalCafeFee+=cafeFee;totalFee+=fee;
      const note=b.status==='cancelled'?'예약취소':done?'':'실제결제 미입력';
      let cells=cStr(`A${r}`,fmtDate(b.date),3)+cStr(`B${r}`,b.orgName||'',3);
      cells+=done?cNum(`C${r}`,ad,3):cBlank(`C${r}`,3);
      cells+=done?cNum(`D${r}`,ticket,4):cBlank(`D${r}`,4);
      cells+=done?cNum(`E${r}`,ticketFee,4):cBlank(`E${r}`,4);
      cells+=done?cNum(`F${r}`,cafe,4):cBlank(`F${r}`,4);
      cells+=done?cNum(`G${r}`,cafeFee,4):cBlank(`G${r}`,4);
      cells+=done?cNum(`H${r}`,fee,4):cBlank(`H${r}`,4);
      cells+=cStr(`I${r}`,note,3);
      xmlRows.push(`<row r="${r}" ht="22" customHeight="1">${cells}</row>`);r++;
    });
    const firstData=3,lastData=Math.max(2,r-1);
    let totalCells=cStr(`A${r}`,'합계',5)+cBlank(`B${r}`,5);
    if(rows.length){
      totalCells+=cFormula(`C${r}`,`SUM(C${firstData}:C${lastData})`,totalAdmissions,5)+cFormula(`D${r}`,`SUM(D${firstData}:D${lastData})`,totalTicket,6)+cFormula(`E${r}`,`SUM(E${firstData}:E${lastData})`,totalTicketFee,6)+cFormula(`F${r}`,`SUM(F${firstData}:F${lastData})`,totalCafe,6)+cFormula(`G${r}`,`SUM(G${firstData}:G${lastData})`,totalCafeFee,6)+cFormula(`H${r}`,`SUM(H${firstData}:H${lastData})`,totalFee,6);
    }else{
      totalCells+=cNum(`C${r}`,0,5)+cNum(`D${r}`,0,6)+cNum(`E${r}`,0,6)+cNum(`F${r}`,0,6)+cNum(`G${r}`,0,6)+cNum(`H${r}`,0,6);
    }
    totalCells+=cBlank(`I${r}`,5);xmlRows.push(`<row r="${r}" ht="24" customHeight="1">${totalCells}</row>`);
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="2" topLeftCell="A3" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="12" customWidth="1"/><col min="2" max="2" width="31" customWidth="1"/><col min="3" max="3" width="9" customWidth="1"/><col min="4" max="8" width="16" customWidth="1"/><col min="9" max="9" width="22" customWidth="1"/></cols><sheetData>${xmlRows.join('')}</sheetData><mergeCells count="1"><mergeCell ref="A1:I1"/></mergeCells><autoFilter ref="A2:I${r}"/></worksheet>`;
  }

  function buildOutsourceXlsx(groups,start,end){
    const files=[],sheetDefs=[],rels=[];
    groups.forEach((g,i)=>{
      const idx=i+1,name=safeSheetName(g.vendor.name, i),title=titleFor(start,end,g.vendor.name);
      sheetDefs.push(`<sheet name="${xmlEsc(name)}" sheetId="${idx}" r:id="rId${idx}"/>`);
      rels.push(`<Relationship Id="rId${idx}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx}.xml"/>`);
      files.push({name:`xl/worksheets/sheet${idx}.xml`,data:sheetXmlForVendor(g.vendor,g.rows,title)});
    });
    const styleRelId=groups.length+1;
    rels.push(`<Relationship Id="rId${styleRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>`);
    const workbook=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheetDefs.join('')}</sheets></workbook>`;
    const wbRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join('')}</Relationships>`;
    const rootRels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
    const overrides=groups.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('');
    const types=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${overrides}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;
    const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,#0"/></numFmts><fonts count="3"><font><sz val="10"/><name val="Malgun Gothic"/></font><font><b/><sz val="10"/><name val="Malgun Gothic"/></font><font><b/><sz val="14"/><name val="Malgun Gothic"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD9D9D9"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF2F2F2"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="7"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf><xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="164" fontId="1" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
    files.push({name:'[Content_Types].xml',data:types},{name:'_rels/.rels',data:rootRels},{name:'xl/workbook.xml',data:workbook},{name:'xl/_rels/workbook.xml.rels',data:wbRels},{name:'xl/styles.xml',data:styles});
    return zipStore(files);
  }

  function downloadOutsourceExcel(){
    if(!adminGuard())return;
    const list=filteredOutsourceBookings(),filter=$('outsourceVendorFilter')?.value||'',start=$('outsourceStart')?.value||'',end=$('outsourceEnd')?.value||'';
    if(!list.length){toast('조회 조건에 해당하는 아웃소싱 예약이 없습니다.');return;}
    const ids=filter?[filter]:[...new Set(list.map(assignedVendorId))];
    const groups=ids.map(id=>{
      const sample=list.find(b=>assignedVendorId(b)===id),vendor=vendorRuleFor(id,sample)||{id,name:id};
      return {vendor,rows:list.filter(b=>assignedVendorId(b)===id)};
    }).filter(g=>g.rows.length);
    try{
      const bytes=buildOutsourceXlsx(groups,start,end),selected=filter?(groups[0]?.vendor?.name||'업체'):'전체';
      const range=(start&&end&&start.slice(0,7)===end.slice(0,7))?start.slice(0,7):`${start||'전체'}_${end||''}`;
      const safe=String(selected).replace(/[\\/:*?"<>|]/g,'_');
      const blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download=`${range}_동탄_주렁주렁_${safe}_아웃소싱결제대금.xlsx`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);toast('아웃소싱 결제대금 엑셀을 내려받았습니다.');
    }catch(e){console.error(e);toast('아웃소싱 엑셀 생성 중 오류가 발생했습니다.');}
  }
  window.downloadOutsourceExcel=downloadOutsourceExcel;
  function installOutsourceExcelButton(){
    const tab=$('tab-outsourcing'),card=tab?.querySelector('.card');if(!card)return;
    let btn=$('outsourceExcel');
    if(!btn){
      const actions=card.querySelector('#outsourceSearch')?.parentElement?.parentElement;
      const wrap=document.createElement('div');wrap.style.cssText='display:flex;justify-content:flex-end;gap:8px;margin-top:10px';wrap.innerHTML='<button class="btn-soft" id="outsourceExcel">엑셀 내려받기 (.xlsx)</button>';
      if(actions)actions.after(wrap);else card.appendChild(wrap);btn=$('outsourceExcel');
    }
    btn.onclick=downloadOutsourceExcel;
  }

  syncAllSettlementRules();
  updateVendorHelp();hookVendorSettingsSave();installOutsourceExcelButton();
  if(typeof window.renderOutsourcingPayments==='function'&&!$('tab-outsourcing')?.classList.contains('hidden'))window.renderOutsourcingPayments();
})();
