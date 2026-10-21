// One public outsourcing render entry; named steps preserve the previous execution order.
(()=>{
  if(window.ZROutsourceViews)return;
  const base=window.renderOutsourcingPayments,steps=new Map();
  window.ZROutsourceViews=Object.freeze({register(id,step){steps.set(id,step)}});
  if(typeof base!=='function')return;
  window.renderOutsourcingPayments=function(){
    const active=[...steps.values()];
    for(const step of active.slice().reverse())step.before?.();
    base();
    for(const step of active)step.after?.();
  };
})();

/* source: admin_features_v3_patch.js */
(()=>{
  if(window.__ZR_ADMIN_V3_INSTALLED)return;
  window.__ZR_ADMIN_V3_INSTALLED=true;

  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  const isComplete=b=>!!(b&&b.status==='confirmed'&&b.settlement&&b.settlement.savedAt);

  function normalizeSettlement(b,markNow=false){
    return window.ZRSettlementRules.normalizeLegacySettlement(b,markNow,record=>{
      const st=record.settlement||{};
      return st.vendorSnapshot||record.outsourcingVendorSnapshot||(settings().outsourcingVendors||[]).find(v=>v.id===(st.vendorId||record.outsourcingVendorId))||null;
    },()=>new Date().toISOString());
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
    btn.onclick=async function(e){
      const id=document.getElementById('zr2EditId')?.value||'';
      if(typeof old!=='function')return false;
      const result=await old.call(this,e);
      if(result===false||!document.getElementById('zr2EditModal')?.classList.contains('hidden'))return result;
      if(id)normalizeOne(id,false);
      if(typeof renderActivity==='function')renderActivity();
      if(typeof window.renderOutsourcingPayments==='function')window.renderOutsourcingPayments();
      markVisibleCompletion();
      return true;
    };
  }

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
  // Completion and status controls share one entry per detail view.
  function detailRenderEntry(base){
    const steps=new Map();
    const entry=function(value){
      const active=[...steps.values()];
      for(const step of active)step.before?.(value);
      base(value);
      markVisibleCompletion();
      for(const step of active)step.after?.(value);
    };
    entry.__zrDetailRenderSteps=Object.freeze({register(id,step){steps.set(id,step)}});
    return entry;
  }
  if(typeof window.openAdminBookingDetail==='function'){
    window.openAdminBookingDetail=detailRenderEntry(window.openAdminBookingDetail);
    openAdminBookingDetail=window.openAdminBookingDetail;
  }
  if(typeof window.openDay==='function'){
    window.openDay=detailRenderEntry(window.openDay);
    openDay=window.openDay;
  }

  window.ZROutsourceViews.register('settlement-normalization',{before:normalizeAllSettlements,after:function(){
      document.querySelectorAll('#outsourceList .booking-item .detail-grid').forEach(grid=>{
        const ticketRule=grid.children?.[3]?.querySelector('.help');
        if(ticketRule&&/^건당\s/.test(ticketRule.textContent))ticketRule.textContent=ticketRule.textContent.replace(/^건당\s/,'유료 1인당 ');
      });
  }});

  window.ZRAdminSettingsViews.register('vendor-help',function(){
      const rows=document.getElementById('vendorSettingsRows');
      const card=rows?.closest('.card');
      if(card){
        [...card.querySelectorAll('.help')].forEach(h=>{
          if(h.textContent.includes('건당은 예약 1건 기준입니다.'))h.innerHTML='매표 <b>건당</b>은 실제 유료입장 1인 기준입니다. (실제 유료인원 + 실제 유료인솔) × 건당 수수료로 계산합니다. 카페 건당 수수료는 예약 1건 기준이며 실제 카페 결제금액이 0원보다 클 때만 적용됩니다.';
        });
      }
  });

  function installMealExcelButton(){
    const tab=document.getElementById('tab-meals'),card=tab?.querySelector('.card');if(!card||document.getElementById('downloadMealExcelV3'))return;
    const wrap=document.createElement('div');wrap.style.cssText='display:flex;justify-content:flex-end;margin-top:12px';wrap.innerHTML='<button class="btn-soft" id="downloadMealExcelV3">식사 주문 엑셀로 내려받기</button>';card.appendChild(wrap);
  }

  const style=document.createElement('style');style.textContent='.activity-kpi{grid-template-columns:repeat(5,1fr)!important}@media screen{.activity-kpi{grid-template-columns:repeat(auto-fit,minmax(min(100%,160px),1fr))!important}}@media(max-width:760px){.activity-kpi{grid-template-columns:1fr 1fr!important}}@media(max-width:560px){.activity-kpi{grid-template-columns:1fr!important}}';document.head.appendChild(style);
  normalizeAllSettlements();
  ensureCompletedKpi();
  installMealExcelButton();
  hookEditSave();
  if(typeof renderExtendedSettings==='function')renderExtendedSettings();
  if(typeof window.renderOutsourcingPayments==='function')window.renderOutsourcingPayments();
  markVisibleCompletion();
})();

/* source: admin_features_v3_excel_fix.js */
(()=>{
  if(window.__ZR_V3_EXCEL_FIX)return;window.__ZR_V3_EXCEL_FIX=true;
  const help=document.querySelector('#tab-activity .card .help');if(help&&help.textContent.includes('확정·거절·취소'))help.innerHTML=help.innerHTML.replace('확정·거절·취소','확정·수정·취소');
})();

/* source: admin_features_v4_patch.js */
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
    btn.onclick=async function(e){const colors={...vendorColorMap()};$('vendorSettingsRows')?.querySelectorAll('[data-vendor-color]').forEach(input=>{colors[input.dataset.vendorColor]=input.value});const result=typeof old==='function'?await old.call(this,e):false;if(result!==true)return result;setStore(VENDOR_COLOR_KEY,colors);$('vendorSettingsRows')?.querySelectorAll('[data-vendor-color]').forEach(input=>{if(colors[input.dataset.vendorColor])input.value=colors[input.dataset.vendorColor]});augmentVendorColorUi();window.ZRAdminFormDrafts?.saved('vendor');return true;};
  }
  window.ZRAdminSettingsViews.register('vendor-color',function(){augmentVendorColorUi();hookVendorColorSave();});

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
        <div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn-soft" onclick="openAdminBookingDetail('${window.ZRDisplaySafety.inlineString(b.id)}')">자세히</button></div>
      </div>`;
    }).join(''):'<div class="help">선택한 접수기간에 예약 내역이 없습니다.</div>';
  };

  const te=new TextEncoder();
  const xmlEsc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  const zipStore=window.ZRExcelArchive.zipStore;
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
    rows.push(`<row r="${r}" ht="18" customHeight="1">${cStr(`F${r}`,'최종수정자 :',7)}${cStr(`G${r}`,String(localStorage.getItem('zr_admin_display_name_v1')||'').trim(),7)}</row>`);r++;
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
          const mealTime=g.b.schedulePublished?(g.b.customerSchedule?.segments?.find(segment=>segment.type==='meal')?.start||g.b.mealStart||'미정'):'스케줄X';
          cells+=cStr(`A${r}`,dateText,3)+cStr(`B${r}`,mealTime,3)+cStr(`C${r}`,g.b.orgName||'',3);
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


/* source: admin_features_v5_patch.js */
(()=>{
  if(window.__ZR_ADMIN_V5_INSTALLED)return;
  window.__ZR_ADMIN_V5_INSTALLED=true;

  const style=document.createElement('style');
  style.textContent=`
    .zr4-complete{background:#ece7ff!important;color:#5942a8!important;border:1px solid #cfc4ff!important}
    .status.pending{background:#fff0d8!important;color:#9a5b00!important;border-color:#f2d29e!important}
    .zr5-refresh{background:#e8f1ff!important;color:#245d9a!important;border:1px solid #bfd5f2!important;font-weight:800!important}
    .zr5-refresh:hover{filter:brightness(.98)}
  `;
  document.head.appendChild(style);

  function paintRefresh(){
    const root=document.getElementById('adminView')||document;
    root.querySelectorAll('button').forEach(btn=>{
      if((btn.textContent||'').trim().includes('새로고침'))btn.classList.add('zr5-refresh');
    });
  }

  paintRefresh();
  document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(paintRefresh,0)));
  const obs=new MutationObserver(()=>paintRefresh());
  const admin=document.getElementById('adminView');
  if(admin)obs.observe(admin,{childList:true,subtree:true});
})();


/* source: admin_features_v6_patch.js */
(()=>{
  if(window.__ZR_ADMIN_V6_INSTALLED)return;
  window.__ZR_ADMIN_V6_INSTALLED=true;

  const currentVendor=id=>(settings().outsourcingVendors||[]).find(v=>v.id===id)||null;
  const {assignedVendorId,fallbackVendor,paidAdmissions}=window.ZRSettlementRules;
  const feeRuleText=(type,value,kind)=>type==='percent'?`${Number(value||0)}%`:(kind==='ticket'?`유료 1인당 ${money(Number(value||0))}`:`건당 ${money(Number(value||0))}`);

  function syncSettlementToCurrentRules(b){return window.ZRSettlementRules.syncToCurrentRules(b,currentVendor)}
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

  window.ZRAdminSettingsViews.register('vendor-help',function(){updateVendorHelp();hookVendorSettingsSave();});
  function hookVendorSettingsSave(){
    const btn=$('saveVendorSettings');if(!btn||btn.dataset.zr6Hook)return;
    btn.dataset.zr6Hook='1';
    const old=btn.onclick;
    btn.onclick=async function(e){
      const result=typeof old==='function'?await old.call(this,e):false;if(result!==true)return result;
      setTimeout(()=>{
        syncAllSettlementRules();updateVendorHelp();
        if(typeof window.renderOutsourcingPayments==='function')window.renderOutsourcingPayments();
        if(typeof renderActivity==='function'&&!$('tab-activity')?.classList.contains('hidden'))renderActivity();
      },0);return true;
    };
  }

  window.ZROutsourceViews.register('current-rules-and-export',{before:syncAllSettlementRules,after:installOutsourceExcelButton});

  const te=new TextEncoder();
  const xmlEsc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
  const zipStore=window.ZRExcelArchive.zipStore;
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
      if(!b||b.__availabilityOnly||!b.settlement?.savedAt||['cancelled','rejected'].includes(b.status))return false;
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
      a.href=url;a.download=`${range}_동탄_주렁주렁_${safe}_아웃소싱결제대금.xlsx`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);toast('아웃소싱 정산 엑셀을 내려받았습니다.');
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


/* source: admin_features_v7_patch.js */
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
  const zipStore=window.ZRExcelArchive.zipStore;
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
    // V10 owns the filtered KPI and replaces this legacy element.
    if(window.__ZR_ADMIN_OPS_V10)return;
    const fee=$('outsourceKpiFee');if(!fee)return;
    const wrap=fee.closest('.kpi')||fee.parentElement?.parentElement;if(!wrap)return;
    let box=$('outsourceKpiPeopleBox');
    if(!box){
      box=document.createElement('div');box.className='box';box.id='outsourceKpiPeopleBox';box.innerHTML='<span class="help">실제 인원</span><b id="outsourceKpiPeople" style="font-size:14px;line-height:1.55">유료 0명<br>유료인솔 0명<br>무료인솔 0명</b>';wrap.appendChild(box);
    }
    const list=outsourceFilteredForKpi();
    const sums=list.reduce((a,b)=>{const st=b.settlement;if(st?.savedAt){a.paid+=Number(st.actualPaidCount||0);a.pc+=Number(st.actualPaidChaperone||0);a.fc+=Number(st.actualFreeChaperone||0);}return a;},{paid:0,pc:0,fc:0});
    const people=$('outsourceKpiPeople');if(!people)return;
    const html=`유료 ${sums.paid}명<br>유료인솔 ${sums.pc}명<br>무료인솔 ${sums.fc}명`;
    if(people.innerHTML!==html)people.innerHTML=html;
  }

  window.ZROutsourceViews.register('layout-and-people',{after:function(){setTimeout(()=>{arrangeOutsource();ensureOutsourcePeopleKpi();},0)}});
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


/* source: admin_features_v8_patch.js */
(()=>{
  if(window.__ZR_ADMIN_V8_INSTALLED)return;
  window.__ZR_ADMIN_V8_INSTALLED=true;

  const style=document.createElement('style');
  style.textContent=`
    #adminCalendar .day.zr8-manual-closed{
      background:#f0f2f3!important;
      border-color:#c9ced2!important;
      box-shadow:none!important;
    }
    #adminCalendar .day.zr8-manual-closed:hover{
      background:#e9ecee!important;
    }
    #adminCalendar .day.zr8-manual-closed .status.zr8-manual-badge{
      background:#dfe3e5!important;
      color:#4f585e!important;
      border-color:#c3c9cc!important;
    }
  `;
  document.head.appendChild(style);

  function manualClosedSet(){
    try{return new Set(settings().manualClosed||[]);}catch{return new Set();}
  }

  function paintManualClosedDays(){
    const root=document.getElementById('adminCalendar');
    if(!root)return;
    const manual=manualClosedSet();
    root.querySelectorAll('.day').forEach(day=>{
      const detailBtn=[...day.querySelectorAll('button')].find(btn=>String(btn.getAttribute('onclick')||'').includes('openDay('));
      const code=detailBtn?.getAttribute('onclick')||'';
      const match=code.match(/openDay\(['\"](\d{4}-\d{2}-\d{2})['\"]\)/);
      const date=match?.[1]||'';
      const isManual=!!date&&manual.has(date);
      day.classList.toggle('zr8-manual-closed',isManual);
      day.querySelectorAll('.status.rejected').forEach(badge=>{
        if((badge.textContent||'').trim()==='마감')badge.classList.toggle('zr8-manual-badge',isManual);
      });
    });
  }

  // One calendar render/toggle adapter; later appearance steps register here.
  const calendarSteps={afterRender(){},afterToggle(){}};
  window.ZRCalendarRenderSteps=calendarSteps;
  if(typeof renderAdmin==='function'){
    const baseRenderAdmin=renderAdmin;
    renderAdmin=function(){
      const out=baseRenderAdmin.apply(this,arguments);
      paintManualClosedDays();
      calendarSteps.afterRender();
      return out;
    };
    window.renderAdmin=renderAdmin;
  }

  if(typeof window.toggleManualClose==='function'){
    const baseToggleManualClose=window.toggleManualClose;
    window.toggleManualClose=function(){
      const out=baseToggleManualClose.apply(this,arguments);
      setTimeout(paintManualClosedDays,0);
      calendarSteps.afterToggle();
      return out;
    };
    try{toggleManualClose=window.toggleManualClose;}catch{}
  }

  paintManualClosedDays();
})();


/* source: admin_features_v9_patch.js */
(()=>{
  if(window.__ZR_ADMIN_V9_INSTALLED)return;
  window.__ZR_ADMIN_V9_INSTALLED=true;

  const pad=n=>String(n).padStart(2,'0');

  function paintManualClosedDaysV9(){
    const root=document.getElementById('adminCalendar');
    const ym=document.getElementById('adminCalendar')?.dataset.renderedMonth||'';
    if(!root||!/^\d{4}-\d{2}$/.test(ym))return;
    let manual=[];
    try{manual=settings().manualClosed||[];}catch{}
    const manualSet=new Set(manual);

    root.querySelectorAll('.day').forEach(day=>{
      const first=day.querySelector('.num > span:first-child')||day.querySelector('.num span');
      const m=(first?.textContent||'').trim().match(/^(\d{1,2})일/);
      if(!m)return;
      const date=`${ym}-${pad(Number(m[1]))}`;
      const on=manualSet.has(date);

      if(on){
        day.dataset.zr9Manual='1';
        day.style.setProperty('background','#eef0f1','important');
        day.style.setProperty('border-color','#c5cacf','important');
        day.style.setProperty('box-shadow','none','important');
      }else if(day.dataset.zr9Manual==='1'){
        delete day.dataset.zr9Manual;
        day.style.removeProperty('background');
        day.style.removeProperty('border-color');
        day.style.removeProperty('box-shadow');
      }

      [...day.querySelectorAll('.status')].forEach(badge=>{
        if((badge.textContent||'').trim()!=='마감')return;
        if(on){
          badge.dataset.zr9Manual='1';
          badge.style.setProperty('background','#d9dde0','important');
          badge.style.setProperty('color','#4e565c','important');
          badge.style.setProperty('border-color','#bcc2c6','important');
        }else if(badge.dataset.zr9Manual==='1'){
          delete badge.dataset.zr9Manual;
          badge.style.removeProperty('background');
          badge.style.removeProperty('color');
          badge.style.removeProperty('border-color');
        }
      });
    });
  }

  function outsourceRowsV9(){
    const start=document.getElementById('outsourceStart')?.value||'';
    const end=document.getElementById('outsourceEnd')?.value||'';
    const vendor=document.getElementById('outsourceVendorFilter')?.value||'';
    let bs=[];
    try{bs=bookings();}catch{return []}
    return bs.filter(b=>{
      const id=b?.settlement?.vendorId||b?.outsourcingVendorId||'';
      if(!id||id==='self')return false;
      if(vendor&&id!==vendor)return false;
      if(start&&String(b.date||'')<start)return false;
      if(end&&String(b.date||'')>end)return false;
      return !!b?.settlement?.savedAt;
    });
  }

  function renderOutsourcePeopleV9(){
    // The V10 renderer owns the active query and its people totals.
    if(window.__ZR_ADMIN_OPS_V10)return;
    const fee=document.getElementById('outsourceKpiFee');
    const kpi=document.querySelector('#tab-outsourcing .kpi.activity-kpi')||fee?.closest('.kpi');
    if(!fee||!kpi)return;

    let box=document.getElementById('outsourceKpiPeopleBox');
    if(!box){
      box=document.createElement('div');
      box.className='box';
      box.id='outsourceKpiPeopleBox';
      const feeBox=fee.closest('.box');
      if(feeBox)feeBox.insertAdjacentElement('afterend',box);else kpi.appendChild(box);
    }

    const sum=outsourceRowsV9().reduce((a,b)=>{
      const st=b.settlement||{};
      a.paid+=Math.max(0,Number(st.actualPaidCount||0));
      a.paidChap+=Math.max(0,Number(st.actualPaidChaperone||0));
      a.freeChap+=Math.max(0,Number(st.actualFreeChaperone||0));
      return a;
    },{paid:0,paidChap:0,freeChap:0});

    const html=`<span class="help">실제 인원</span><b id="outsourceKpiPeople" style="display:block;margin-top:4px;font-size:14px;line-height:1.55">유료인원 ${sum.paid}명<br>유료인솔자 ${sum.paidChap}명<br>무료 인솔자 ${sum.freeChap}명</b>`;
    if(box.innerHTML!==html)box.innerHTML=html;
  }

  window.ZRCalendarRenderSteps.afterRender=function(){
    paintManualClosedDaysV9();
  };
  window.ZRCalendarRenderSteps.afterToggle=function(){
    paintManualClosedDaysV9();
  };

  window.ZROutsourceViews.register('people-summary',{after:function(){setTimeout(renderOutsourcePeopleV9,0);setTimeout(renderOutsourcePeopleV9,60)}});

  const search=document.getElementById('outsourceSearch');
  if(search)search.addEventListener('click',()=>{setTimeout(renderOutsourcePeopleV9,0);setTimeout(renderOutsourcePeopleV9,80);});
  ['outsourceStart','outsourceEnd','outsourceVendorFilter'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.addEventListener('change',()=>setTimeout(renderOutsourcePeopleV9,0));
  });
  document.querySelectorAll('[data-tab],#outsourceTabBtn').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>{
    paintManualClosedDaysV9();renderOutsourcePeopleV9();
  },30)));

  function addScript(id,src,onload){
    const found=document.getElementById(id);
    if(found){onload?.();return}
    const s=document.createElement('script');s.id=id;s.src=src;if(onload)s.onload=onload;document.body.appendChild(s);
  }
  function loadAdminScheduleTab(){
    if(!window.zrReservationFirebase){setTimeout(loadAdminScheduleTab,300);return}
    addScript('zrAdminScheduleScript','./admin_schedule_tab_v14.js?v=release-1792578553900',()=>{
      addScript('zrCustomerScheduleScript','./customer_schedule_view_v3.js?v=release-1792578553900');
      addScript('zrCustomerBookingRulesScript','./customer_booking_rules_v3.js?v=release-1792578553900');
      addScript('zrAdminScheduleExcelScript','./admin_schedule_excel_v3.js?v=release-1792578553900');
      addScript('zrScheduleUiFixV4','./schedule_ui_fix_v4.js?v=release-1792578553900');
    });
  }

  setTimeout(()=>{
    paintManualClosedDaysV9();renderOutsourcePeopleV9();
    addScript('zrStaffLoginFixV14','./reservation_staff_login_fix_v14.js?v=release-1792578553900');
    addScript('zrAdminOpsV10','./admin_ops_v10.js?v=release-1792578553900',()=>addScript('zrAdminOpsV11Patch','./admin_ops_v11_patch.js?v=release-1792578553900'));
    loadAdminScheduleTab();
  },0);
})();
