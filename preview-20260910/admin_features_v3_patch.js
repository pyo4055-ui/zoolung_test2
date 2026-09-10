(()=>{
  if(window.__ZR_ADMIN_V3_INSTALLED)return;
  window.__ZR_ADMIN_V3_INSTALLED=true;

  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  const paidAdmissionCount=st=>Math.max(0,Number(st?.actualPaidCount||0))+Math.max(0,Number(st?.actualPaidChaperone||0));
  const pctOrFlat=(amount,type,value,multiplier=1)=>{
    amount=Math.max(0,Number(amount||0));value=Math.max(0,Number(value||0));
    if(type==='percent')return Math.round(amount*value/100);
    return Math.round(value*Math.max(0,Number(multiplier||0)));
  };
  const vendorSnapshotFor=b=>{
    const st=b?.settlement||{};
    if(st.vendorSnapshot)return st.vendorSnapshot;
    if(b?.outsourcingVendorSnapshot)return b.outsourcingVendorSnapshot;
    const id=st.vendorId||b?.outsourcingVendorId;
    const list=settings().outsourcingVendors||[];
    return list.find(v=>v.id===id)||null;
  };
  const isComplete=b=>!!(b&&b.status==='confirmed'&&b.settlement&&b.settlement.savedAt);

  function normalizeSettlement(b,markNow=false){
    if(!b?.settlement)return false;
    const st=b.settlement,snap=vendorSnapshotFor(b)||st.vendorSnapshot||{};
    const vendorId=st.vendorId||b.outsourcingVendorId||snap.id||'self';
    const paid=paidAdmissionCount(st),unit=Math.max(0,Number(st.ticketUnitPrice??snap.groupPrice??0));
    const ticket=Math.round(paid*unit),cafe=Math.max(0,Number(st.actualCafeAmount||0));
    const isSelf=vendorId==='self';
    const ticketFee=isSelf?0:pctOrFlat(ticket,snap.ticketFeeType,snap.ticketFeeValue,paid);
    const cafeFee=isSelf||cafe<=0?0:pctOrFlat(cafe,snap.cafeFeeType,snap.cafeFeeValue,1);
    const before=JSON.stringify({ticketAmount:st.ticketAmount,totalActualSales:st.totalActualSales,ticketFee:st.ticketFee,cafeFee:st.cafeFee,totalFee:st.totalFee,status:b.settlementStatus});
    st.ticketAmount=ticket;
    st.totalActualSales=ticket+cafe;
    st.ticketFee=ticketFee;
    st.cafeFee=cafeFee;
    st.totalFee=ticketFee+cafeFee;
    b.settlementStatus='completed';
    if(markNow){
      const now=new Date().toISOString();
      st.savedAt=now;b.settlementCompletedAt=now;
    }else if(!b.settlementCompletedAt)b.settlementCompletedAt=st.savedAt||new Date().toISOString();
    return before!==JSON.stringify({ticketAmount:st.ticketAmount,totalActualSales:st.totalActualSales,ticketFee:st.ticketFee,cafeFee:st.cafeFee,totalFee:st.totalFee,status:b.settlementStatus});
  }
  function normalizeAllSettlements(){
    const bs=bookings();let changed=false;
    bs.forEach(b=>{if(normalizeSettlement(b,false))changed=true;});
    if(changed)setStore('zr_bookings',bs);
  }
  function normalizeOne(id,markNow=false){
    const bs=bookings(),b=bs.find(x=>x.id===id);if(!b||!b.settlement)return;
    normalizeSettlement(b,markNow);setStore('zr_bookings',bs);
  }

  if(typeof window.zr2SaveSettlement==='function'){
    const base=window.zr2SaveSettlement;
    window.zr2SaveSettlement=function(id,el){
      base(id,el);
      normalizeOne(id,true);
      if(typeof renderActivity==='function')renderActivity();
      if(typeof window.renderOutsourcingPayments==='function')window.renderOutsourcingPayments();
      markVisibleCompletion();
    };
  }
  if(typeof window.saveBookingVendor==='function'){
    const base=window.saveBookingVendor;
    window.saveBookingVendor=function(id,vendorId){
      base(id,vendorId);normalizeOne(id,false);
      if(typeof window.renderOutsourcingPayments==='function')window.renderOutsourcingPayments();
      markVisibleCompletion();
    };
  }

  function hookEditSave(){
    const btn=document.getElementById('zr2EditSave');
    if(!btn||btn.dataset.v3Hooked)return;
    btn.dataset.v3Hooked='1';
    const old=btn.onclick;
    btn.onclick=function(e){
      const id=document.getElementById('zr2EditId')?.value||'';
      if(typeof old==='function')old.call(this,e);
      if(id)normalizeOne(id,false);
      if(typeof renderActivity==='function')renderActivity();
      if(typeof window.renderOutsourcingPayments==='function')window.renderOutsourcingPayments();
      markVisibleCompletion();
    };
  }

  renderActivity=function(){
    if(!adminGuard())return;
    normalizeAllSettlements();
    const list=activityFilteredBookings();
    ensureCompletedKpi();
    $('activityKpiTotal').textContent=list.length+'건';
    $('activityKpiConfirmed').textContent=list.filter(b=>b.status==='confirmed'&&!isComplete(b)).length+'건';
    $('activityKpiPending').textContent=list.filter(b=>b.status==='pending').length+'건';
    $('activityKpiCancelled').textContent=list.filter(b=>b.status==='cancelled').length+'건';
    $('activityKpiCompleted').textContent=list.filter(isComplete).length+'건';
    $('activityList').innerHTML=list.length?list.map(b=>{
      const badge=isComplete(b)?'<span class="status confirmed">정산완료</span>':adminStatusBadge(b.status);
      const st=b.settlement;
      return `<div class="booking-item"><div class="row"><div><b>${escapeHtml(b.orgName)}</b><div class="help">접수 ${dateTimeText(b.createdAt)} · 예약일 ${b.date}</div></div>${badge}</div><div class="detail-grid"><div><b>예약자</b><br>${escapeHtml(b.managerName)}</div><div><b>연락처</b><br>${escapeHtml(b.contact)}</div><div><b>방문시간</b><br>${b.entryTime} ~ ${b.exitTime}</div><div><b>인원</b><br>유료 ${b.paidCount} / 인솔 ${b.chaperoneCount}</div>${isComplete(b)?`<div><b>실제 매표</b><br>${money(st.ticketAmount||0)}</div><div><b>실제 카페</b><br>${money(st.actualCafeAmount||0)}</div>`:''}${b.status==='cancelled'?`<div><b>취소 구분</b><br>${cancellationSourceText(b)}</div><div><b>취소 일시</b><br>${dateTimeText(b.cancelledAt)}</div>`:''}</div><div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn-soft" onclick="openAdminBookingDetail('${b.id}')">자세히</button></div></div>`;
    }).join(''):'<div class="help">선택한 접수기간에 예약 내역이 없습니다.</div>';
  };
  function ensureCompletedKpi(){
    if(document.getElementById('activityKpiCompleted'))return;
    const wrap=document.querySelector('.activity-kpi');if(!wrap)return;
    const box=document.createElement('div');box.className='box';box.innerHTML='<span class="help">완료</span><b id="activityKpiCompleted">0건</b>';wrap.appendChild(box);
  }

  function markVisibleCompletion(){
    const detail=document.getElementById('adminBookingDetailContent');
    if(detail&&!document.getElementById('adminBookingDetailModal')?.classList.contains('hidden')){
      const id=(detail.textContent.match(/예약번호\s*(B\d+)/)||[])[1];
      const b=id?bookings().find(x=>x.id===id):null;
      if(isComplete(b)){
        const badge=detail.querySelector('.row .status');if(badge){badge.textContent='정산완료';badge.className='status confirmed';}
      }
    }
    const day=document.getElementById('dayDetailContent');
    if(day&&!document.getElementById('dayDetailModal')?.classList.contains('hidden')){
      day.querySelectorAll('.zr2-settle[data-id]').forEach(settle=>{
        const b=bookings().find(x=>x.id===settle.dataset.id);if(!isComplete(b))return;
        const item=settle.closest('.booking-item'),badge=item?.querySelector('.row .status');if(badge){badge.textContent='정산완료';badge.className='status confirmed';}
      });
    }
  }
  if(typeof window.openAdminBookingDetail==='function'){
    const base=window.openAdminBookingDetail;
    window.openAdminBookingDetail=function(id){base(id);markVisibleCompletion();};
    openAdminBookingDetail=window.openAdminBookingDetail;
  }
  if(typeof window.openDay==='function'){
    const base=window.openDay;
    window.openDay=function(date){base(date);markVisibleCompletion();};
    openDay=window.openDay;
  }

  if(typeof window.renderOutsourcingPayments==='function'){
    const base=window.renderOutsourcingPayments;
    window.renderOutsourcingPayments=function(){
      normalizeAllSettlements();base();
      document.querySelectorAll('#outsourceList .booking-item .detail-grid').forEach(grid=>{
        const ticketRule=grid.children?.[3]?.querySelector('.help');
        if(ticketRule&&/^건당\s/.test(ticketRule.textContent))ticketRule.textContent=ticketRule.textContent.replace(/^건당\s/,'유료 1인당 ');
      });
    };
    renderOutsourcingPayments=window.renderOutsourcingPayments;
  }

  if(typeof renderExtendedSettings==='function'){
    const base=renderExtendedSettings;
    renderExtendedSettings=function(){
      base();
      const rows=document.getElementById('vendorSettingsRows');
      const card=rows?.closest('.card');
      if(card){
        [...card.querySelectorAll('.help')].forEach(h=>{
          if(h.textContent.includes('건당은 예약 1건 기준입니다.'))h.innerHTML='매표 <b>건당</b>은 실제 유료입장 1인 기준입니다. (실제 유료인원 + 실제 유료인솔) × 건당 수수료로 계산합니다. 카페 건당 수수료는 예약 1건 기준이며 실제 카페 결제금액이 0원보다 클 때만 적용됩니다.';
        });
      }
    };
  }

  function mealBookingsForMonth(ym){
    const out=[];
    const [y,m]=String(ym||'').split('-').map(Number);if(!y||!m)return out;
    const last=new Date(y,m,0).getDate();
    for(let d=1;d<=last;d++){
      const date=validDateStr(y,m,d);
      confirmedCafeBookingsForDate(date).forEach(b=>out.push(b));
    }
    return out.sort((a,b)=>String(a.date).localeCompare(String(b.date))||(a.mealStart||'99:99').localeCompare(b.mealStart||'99:99')||String(a.orgName||'').localeCompare(String(b.orgName||''),'ko'));
  }
  const krMealDate=date=>{const s=String(date||'');return s.length>=10?`${s.slice(5,7)}월 ${s.slice(8,10)}일`:s;};
  function downloadMealExcelV3(){
    if(!adminGuard())return;
    const ym=$('mealAdminMonth')?.value||'';
    const list=mealBookingsForMonth(ym);
    if(!list.length){toast('내려받을 식사 주문 내역이 없습니다.');return;}
    const month=Number(String(ym).slice(5,7))||'';
    const rows=[];
    list.forEach(b=>{
      const items=(b.cafe?.items||[]).filter(it=>Number(it.qty||0)>0);
      if(items.length){
        rows.push({b,items:items.map(it=>({name:it.name||'',qty:Number(it.qty||0),amount:Number(it.subtotal??(Number(it.price||0)*Number(it.qty||0))) }))});
      }else{
        rows.push({b,items:[{name:'미정',qty:'',amount:Number(b.cafe?.amount||0)}]});
      }
    });
    const total=rows.reduce((s,g)=>s+g.items.reduce((x,it)=>x+Number(it.amount||0),0),0);
    const now=new Date(),f=n=>String(n).padStart(2,'0'),today=`${now.getFullYear()}-${f(now.getMonth()+1)}-${f(now.getDate())}`;
    const styleCell=(txt,style='Cell',type='String',extra='')=>`<Cell ss:StyleID="${style}" ${extra}><Data ss:Type="${type}">${esc(txt)}</Data></Cell>`;
    let xml=`<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n<Styles>
      <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="맑은 고딕" ss:Size="10"/></Style>
      <Style ss:ID="Title"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1" ss:Size="15"/><Interior ss:Color="#FFC000" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="2"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="2"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2"/></Borders></Style>
      <Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:Bold="1"/><Interior ss:Color="#FFC000" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
      <Style ss:ID="Cell"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
      <Style ss:ID="Money"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><NumberFormat ss:Format="#,##0"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
      <Style ss:ID="Total"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:Bold="1"/><Interior ss:Color="#FFFF00" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
      <Style ss:ID="TotalMoney"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Font ss:Bold="1"/><Interior ss:Color="#FFFF00" ss:Pattern="Solid"/><NumberFormat ss:Format="#,##0"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders></Style>
    </Styles><Worksheet ss:Name="${month}월 식사주문"><Table>
      <Column ss:Width="90"/><Column ss:Width="70"/><Column ss:Width="210"/><Column ss:Width="170"/><Column ss:Width="62"/><Column ss:Width="92"/><Column ss:Width="270"/>
      <Row ss:Height="34">${styleCell(`${month}월 단체 식사 주문 내역`,'Title','String','ss:MergeAcross="6"')}</Row>
      <Row ss:Height="18"><Cell ss:Index="6"><Data ss:Type="String">최종수정자 :</Data></Cell><Cell><Data ss:Type="String"></Data></Cell></Row>
      <Row ss:Height="18"><Cell ss:Index="6"><Data ss:Type="String">최종수정일 :</Data></Cell><Cell><Data ss:Type="String">${today}</Data></Cell></Row>
      <Row ss:Height="27">${['날짜(예약일)','식사시간','단체명','메뉴','수량','금액','특이사항'].map(h=>styleCell(h,'Header')).join('')}</Row>`;
    rows.forEach((g,gi)=>{
      const n=g.items.length;
      g.items.forEach((it,i)=>{
        xml+='<Row ss:Height="24">';
        if(i===0){
          const merge=n>1?`ss:MergeDown="${n-1}"`:'';
          xml+=styleCell(krMealDate(g.b.date),'Cell','String',merge);
          xml+=styleCell(g.b.mealStart||'미정','Cell','String',merge);
          xml+=styleCell(g.b.orgName||'','Cell','String',merge);
        }
        xml+=styleCell(it.name,'Cell');
        xml+=styleCell(it.qty,'Cell',typeof it.qty==='number'?'Number':'String');
        xml+=styleCell(Number(it.amount||0),'Money','Number');
        xml+=styleCell('','Cell');
        xml+='</Row>';
      });
      if(gi<rows.length-1)xml+='<Row ss:Height="8"><Cell/><Cell/><Cell/><Cell/><Cell/><Cell/><Cell/></Row>';
    });
    xml+=`<Row ss:Height="26">${styleCell('합계','Total','String','ss:MergeAcross="4"')}${styleCell(total,'TotalMoney','Number')}${styleCell('','Total')}</Row></Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><Selected/><FreezePanes/><FrozenNoSplit/><SplitHorizontal>4</SplitHorizontal><TopRowBottomPane>4</TopRowBottomPane></WorksheetOptions></Worksheet></Workbook>`;
    const blob=new Blob(['\ufeff',xml],{type:'application/vnd.ms-excel;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`주렁주렁_${month}월_단체식사주문내역.xls`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast('식사 주문 엑셀을 내려받았습니다.');
  }
  window.downloadMealExcelV3=downloadMealExcelV3;
  function installMealExcelButton(){
    const tab=document.getElementById('tab-meals'),card=tab?.querySelector('.card');if(!card||document.getElementById('downloadMealExcelV3'))return;
    const wrap=document.createElement('div');wrap.style.cssText='display:flex;justify-content:flex-end;margin-top:12px';wrap.innerHTML='<button class="btn-soft" id="downloadMealExcelV3">식사 주문 엑셀로 내려받기</button>';card.appendChild(wrap);document.getElementById('downloadMealExcelV3').onclick=downloadMealExcelV3;
  }

  const style=document.createElement('style');style.textContent='.activity-kpi{grid-template-columns:repeat(5,1fr)!important}@media(max-width:760px){.activity-kpi{grid-template-columns:1fr 1fr!important}}@media(max-width:560px){.activity-kpi{grid-template-columns:1fr!important}}';document.head.appendChild(style);
  normalizeAllSettlements();
  ensureCompletedKpi();
  installMealExcelButton();
  hookEditSave();
  if(typeof renderExtendedSettings==='function')renderExtendedSettings();
  if(typeof window.renderOutsourcingPayments==='function')window.renderOutsourcingPayments();
  markVisibleCompletion();
})();