(()=>{
  const BASE_PRICE=15000;
  let adminCreateMode=false;

  function activeVendorSlots(s){
    return (s.outsourcingVendors||[]).filter(v=>String(v.name||'').trim()).slice(0,10);
  }
  function defaultVendors(){
    return [
      {id:'vendor1',name:'정명익',groupPrice:15000,ticketFeeType:'flat',ticketFeeValue:0,cafeFeeType:'flat',cafeFeeValue:0},
      {id:'vendor2',name:'굿모닝',groupPrice:15000,ticketFeeType:'flat',ticketFeeValue:0,cafeFeeType:'flat',cafeFeeValue:0},
      {id:'vendor3',name:'HK',groupPrice:13000,ticketFeeType:'flat',ticketFeeValue:0,cafeFeeType:'flat',cafeFeeValue:0},
      {id:'vendor4',name:'EGL',groupPrice:13000,ticketFeeType:'flat',ticketFeeValue:0,cafeFeeType:'flat',cafeFeeValue:0},
      ...Array.from({length:6},(_,i)=>({id:'vendor'+(i+5),name:'',groupPrice:15000,ticketFeeType:'flat',ticketFeeValue:0,cafeFeeType:'flat',cafeFeeValue:0}))
    ];
  }

  const baseSettings=settings;
  settings=function(){
    const s=baseSettings();
    if(!Number.isFinite(Number(s.autoCloseLimit)))s.autoCloseLimit=s.autoClose===false?0:4;
    s.autoCloseLimit=Math.max(0,Math.min(30,Number(s.autoCloseLimit)||0));
    s.autoClose=s.autoCloseLimit>0;
    if(s.playgroundLimitEnabled===undefined)s.playgroundLimitEnabled=true;
    if(!Array.isArray(s.outsourcingVendors))s.outsourcingVendors=defaultVendors();
    while(s.outsourcingVendors.length<10){
      const n=s.outsourcingVendors.length+1;
      s.outsourcingVendors.push({id:'vendor'+n,name:'',groupPrice:15000,ticketFeeType:'flat',ticketFeeValue:0,cafeFeeType:'flat',cafeFeeValue:0});
    }
    s.outsourcingVendors=s.outsourcingVendors.slice(0,10).map((v,i)=>({
      id:v.id||('vendor'+(i+1)),name:String(v.name||''),groupPrice:Math.max(0,Number(v.groupPrice||0)),
      ticketFeeType:v.ticketFeeType==='percent'?'percent':'flat',ticketFeeValue:Math.max(0,Number(v.ticketFeeValue||0)),
      cafeFeeType:v.cafeFeeType==='percent'?'percent':'flat',cafeFeeValue:Math.max(0,Number(v.cafeFeeValue||0))
    }));
    return s;
  };

  isDateClosed=function(date){
    const s=settings(),limit=Number(s.autoCloseLimit||0),count=bookingCount(date);
    const idx=s.autoCloseOverrideOpen.indexOf(date);
    if(limit>0 && count<limit && idx>=0){s.autoCloseOverrideOpen.splice(idx,1);saveSettings(s)}
    const autoClosed=limit>0 && count>=limit && !s.autoCloseOverrideOpen.includes(date);
    return s.manualClosed.includes(date)||autoClosed;
  };

  const baseTakenPlaySlots=takenPlaySlots;
  takenPlaySlots=function(date,excludeId=null){
    if(settings().playgroundLimitEnabled===false)return new Set();
    return baseTakenPlaySlots(date,excludeId);
  };

  const baseRenderVisitDays=renderVisitDays;
  renderVisitDays=function(){
    if(!adminCreateMode)return baseRenderVisitDays();
    const ym=$("visitMonth").value;
    $("visitDay").innerHTML='<option value="">선택</option>';
    if(!ym)return;
    let [y,m]=ym.split('-').map(Number);
    const last=new Date(y,m,0).getDate(),today=new Date();today.setHours(0,0,0,0);
    const s=settings(),openStart=new Date(s.bookingStart+'T00:00:00'),openEnd=new Date(s.bookingEnd+'T23:59:59');
    for(let d=1;d<=last;d++){
      const dt=new Date(y,m-1,d),date=validDateStr(y,m,d),wd=dt.getDay();
      const closed=isDateClosed(date);
      const disabled=dt<today||dt<openStart||dt>openEnd||closed;
      let tag='';
      if(wd===0||wd===6)tag=' (주말·관리자)';
      if(closed)tag=' (마감)';
      const o=document.createElement('option');o.value=date;o.textContent=`${d}일${tag}`;o.disabled=disabled;$("visitDay").appendChild(o);
    }
  };

  function vendorOptions(){
    const s=settings();
    return [{id:'self',name:'자체',groupPrice:BASE_PRICE,ticketFeeType:'flat',ticketFeeValue:0,cafeFeeType:'flat',cafeFeeValue:0},...activeVendorSlots(s)];
  }
  function vendorById(id){return vendorOptions().find(v=>v.id===id)||null}
  function feeAmount(amount,type,value){
    amount=Math.max(0,Number(amount||0));value=Math.max(0,Number(value||0));
    if(amount<=0)return 0;
    return type==='percent'?Math.round(amount*value/100):Math.round(value);
  }
  function settlementCalcFromEditor(root){
    const vendorId=root.querySelector('[data-field="vendor"]:checked')?.value||'';
    const vendor=vendorById(vendorId);
    const paid=Math.max(0,Number(root.querySelector('[data-field="actualPaid"]')?.value||0));
    const free=Math.max(0,Number(root.querySelector('[data-field="actualFree"]')?.value||0));
    const paidChap=Math.max(0,Number(root.querySelector('[data-field="actualPaidChap"]')?.value||0));
    const cafe=Math.max(0,Number(root.querySelector('[data-field="actualCafe"]')?.value||0));
    const unit=vendor?Number(vendor.groupPrice||0):0;
    const ticket=(paid+paidChap)*unit;
    const total=ticket+cafe;
    return {vendorId,vendor,paid,free,paidChap,cafe,unit,ticket,total};
  }
  window.updateSettlementPreview=function(id,el){
    const root=el?.closest('.zr-settlement-editor')||document.querySelector(`.zr-settlement-editor[data-booking-id="${CSS.escape(id)}"]`);
    if(!root)return;
    const c=settlementCalcFromEditor(root),box=root.querySelector('[data-settlement-preview]');
    if(!c.vendor){box.innerHTML='<span class="danger">결제 구분(자체/아웃소싱 업체)을 선택해주세요.</span>';return}
    box.innerHTML=`<b>실제 매출 계산</b><br>적용 단체가 <b>${money(c.unit)}</b> × (실제 유료 ${c.paid}명 + 실제 유료인솔 ${c.paidChap}명)<br>매표 매출 <b>${money(c.ticket)}</b><br>카페 실제 결제 <b>${money(c.cafe)}</b><br><span class="money">실제 총매출 ${money(c.total)}</span>`;
  };
  window.saveBookingSettlement=function(id,el){
    if(!adminGuard())return;
    const root=el.closest('.zr-settlement-editor'),c=settlementCalcFromEditor(root);
    if(!c.vendor){toast('자체 또는 아웃소싱 업체를 하나 선택해주세요.');return}
    if(c.unit<=0){toast('선택한 업체의 단체가를 설정해주세요.');return}
    const bs=bookings(),b=bs.find(x=>x.id===id);if(!b){toast('예약 정보를 찾지 못했습니다.');return}
    const snap={
      id:c.vendor.id,name:c.vendor.name,groupPrice:c.unit,
      ticketFeeType:c.vendor.ticketFeeType||'flat',ticketFeeValue:Number(c.vendor.ticketFeeValue||0),
      cafeFeeType:c.vendor.cafeFeeType||'flat',cafeFeeValue:Number(c.vendor.cafeFeeValue||0)
    };
    const ticketFee=feeAmount(c.ticket,snap.ticketFeeType,snap.ticketFeeValue);
    const cafeFee=feeAmount(c.cafe,snap.cafeFeeType,snap.cafeFeeValue);
    b.settlement={
      vendorId:snap.id,vendorSnapshot:snap,
      actualPaidCount:c.paid,actualFreeChaperone:c.free,actualPaidChaperone:c.paidChap,
      actualCafeAmount:c.cafe,ticketUnitPrice:c.unit,ticketAmount:c.ticket,totalActualSales:c.total,
      ticketFee,cafeFee,totalFee:ticketFee+cafeFee,savedAt:new Date().toISOString()
    };
    setStore('zr_bookings',bs);
    addActivity('settlement',b,`실제 결제 저장 · ${snap.name}`);
    toast('실제 결제 내역을 저장했습니다.');
    if(!$("dayDetailModal").classList.contains('hidden'))openDay(b.date);
    if(!$("adminBookingDetailModal").classList.contains('hidden')){$("adminBookingDetailContent").innerHTML=adminBookingDetailHtml(b)}
    renderOutsourcingPayments();
  };

  function settlementEditorHtml(b){
    const st=b.settlement||{},selected=st.vendorId||'';
    const actualPaid=st.actualPaidCount??b.paidCount??0;
    const actualFree=st.actualFreeChaperone??b.freeChaperone??0;
    const actualPaidChap=st.actualPaidChaperone??b.paidChaperone??0;
    const actualCafe=st.actualCafeAmount??0;
    const radios=vendorOptions().map(v=>`<label class="zr-radio"><input type="radio" name="vendor_${escapeHtml(b.id)}" data-field="vendor" value="${escapeHtml(v.id)}" ${selected===v.id?'checked':''} onchange="updateSettlementPreview('${b.id}',this)"><span>${escapeHtml(v.name)}${v.id!=='self'?` <small>${money(v.groupPrice||0)}</small>`:''}</span></label>`).join('');
    return `<div class="calc zr-settlement-editor" data-booking-id="${escapeHtml(b.id)}" style="margin-top:14px">
      <b>실제 결제 / 정산 입력</b>
      <div class="help" style="margin-top:5px">접수일 ${dateTimeText(b.createdAt)} · 방문일 ${b.date}</div>
      <div class="zr-radio-grid" style="margin-top:10px">${radios}</div>
      <div class="grid2" style="margin-top:12px">
        <div><label>실제 유료인원</label><input type="number" min="0" data-field="actualPaid" value="${actualPaid}" oninput="updateSettlementPreview('${b.id}',this)"></div>
        <div><label>실제 무료인솔</label><input type="number" min="0" data-field="actualFree" value="${actualFree}" oninput="updateSettlementPreview('${b.id}',this)"></div>
        <div><label>실제 유료인솔</label><input type="number" min="0" data-field="actualPaidChap" value="${actualPaidChap}" oninput="updateSettlementPreview('${b.id}',this)"></div>
        <div><label>카페 실제 결제금액</label><input type="number" min="0" step="100" data-field="actualCafe" value="${actualCafe}" oninput="updateSettlementPreview('${b.id}',this)"></div>
      </div>
      <div class="calc" data-settlement-preview style="margin-top:10px"></div>
      <div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn-primary" onclick="saveBookingSettlement('${b.id}',this)">실제 결제 저장</button></div>
    </div>`;
  }

  const baseAdminBookingDetailHtml=adminBookingDetailHtml;
  adminBookingDetailHtml=function(b){return baseAdminBookingDetailHtml(b)+(b.status==='confirmed'?settlementEditorHtml(b):'')};
  const baseOpenAdminBookingDetail=openAdminBookingDetail;
  window.openAdminBookingDetail=openAdminBookingDetail=function(id){
    if(!adminGuard())return;
    baseOpenAdminBookingDetail(id);
    const root=$("adminBookingDetailContent").querySelector('.zr-settlement-editor');
    if(root)updateSettlementPreview(id,root.querySelector('[data-field="actualPaid"]'));
  };

  renderAdmin=function(){
    if(!adminGuard(false))return;
    const ym=$("adminMonth").value||monthOptions()[0].key;$("adminMonth").value=ym;
    const bs=activeBookings().filter(b=>monthKey(b.date)===ym);
    $("kpiTeams").textContent=bs.length+'팀';$("kpiPeople").textContent=bs.reduce((s,b)=>s+totalPeople(b),0)+'명';$("kpiPending").textContent=bs.filter(b=>b.status==='pending').length+'건';
    const [y,m]=ym.split('-').map(Number),first=new Date(y,m-1,1).getDay(),last=new Date(y,m,0).getDate(),s=settings();
    if($("autoClose"))$("autoClose").checked=s.autoCloseLimit>0;
    $("bookingOpenStart").value=s.bookingStart||'';$("bookingOpenEnd").value=s.bookingEnd||'';
    let html=['일','월','화','수','목','금','토'].map(x=>`<div class="weekday">${x}</div>`).join('');
    for(let i=0;i<first;i++)html+='<div></div>';
    for(let d=1;d<=last;d++){
      const date=validDateStr(y,m,d),dayBs=activeBookings().filter(b=>b.date===date),closed=isDateClosed(date),ppl=dayBs.reduce((sum,b)=>sum+totalPeople(b),0),pendingCount=dayBs.filter(b=>b.status==='pending').length;
      html+=`<div class="day ${closed?'closed':''}"><div class="num" style="display:flex;justify-content:space-between;gap:6px;align-items:center;flex-wrap:wrap"><span>${d}일</span><span style="display:flex;gap:5px;align-items:center;flex-wrap:wrap">${pendingCount?`<span class="status pending">접수 ${pendingCount}건</span>`:''}${closed?'<span class="status rejected">마감</span>':''}</span></div><div class="meta">${dayBs.length}팀 / ${ppl}명</div><button class="btn-soft" onclick="openDay('${date}')">자세히</button></div>`;
    }
    $("adminCalendar").innerHTML=html;
    renderExtendedSettings();
  };

  window.openDay=function(date){
    if(!adminGuard())return;
    const all=bookings().filter(b=>b.date===date),s=settings(),manual=s.manualClosed.includes(date),limit=Number(s.autoCloseLimit||0),autoOverride=s.autoCloseOverrideOpen.includes(date),autoReached=limit>0&&bookingCount(date)>=limit;
    let html=`<h2>${date} 예약 상세</h2><div class="help">${activeBookings().filter(b=>b.date===date).length}팀 / ${activeBookings().filter(b=>b.date===date).reduce((x,b)=>x+totalPeople(b),0)}명</div><div class="top-actions" style="margin:12px 0"><button class="${manual?'btn-soft':'btn-danger'}" onclick="toggleManualClose('${date}')">${manual?'수동 마감 해제':'수동 마감'}</button>${autoReached?`<button class="${autoOverride?'btn-gray':'btn-soft'}" onclick="toggleAutoCloseOverride('${date}')">${autoOverride?'자동마감 다시 적용':'자동마감 해제'}</button>`:''}</div>${autoReached&&autoOverride?`<div class="help warn">이 날짜는 ${limit}팀 이상이지만 관리자가 자동마감을 해제한 상태입니다.</div>`:''}`;
    if(!all.length)html+='<div class="help">예약이 없습니다.</div>';
    all.forEach(b=>{
      const st=b.status==='pending'?'<span class="status pending">접수</span>':b.status==='confirmed'?'<span class="status confirmed">확정</span>':b.status==='cancelled'?'<span class="status rejected">취소</span>':'<span class="status rejected">거절</span>';
      const mt={lunchbox:'도시락',cafe:'카페 주문',none:'식사 없음'}[b.mealType];
      html+=`<div class="booking-item"><div class="row"><div><b>${escapeHtml(b.orgName)}</b><div class="help">${escapeHtml(b.groupType||'-')}<br>접수 ${dateTimeText(b.createdAt)}</div></div>${st}</div><div class="detail-grid"><div>유료 ${b.paidCount} / 인솔 ${b.chaperoneCount}<br>무료 인솔 ${b.freeChaperone}</div><div>동물원 ${b.entryTime}~${b.exitTime}</div><div>식사 ${mt}${b.mealStart?`<br>${b.mealStart}~${b.mealEnd}`:''}</div><div>놀이터 ${(b.playUse==='no'||!b.playStart)?'이용 안 함':`${b.playStart}~${b.playEnd}`}</div><div>예약자 ${escapeHtml(b.managerName)}<br>${escapeHtml(b.contact)}</div><div>예약금액 ${money(b.totalAmount)}<br>현장결제</div>${b.status==='cancelled'?`<div><b>취소 구분</b><br>${cancellationSourceText(b)}</div><div><b>취소 일시</b><br>${dateTimeText(b.cancelledAt)}</div>`:''}</div>${b.status==='pending'?`<div class="top-actions" style="margin-top:12px"><button class="btn-primary" onclick="requestBookingStatus('${b.id}','confirmed')">예약 확정</button><button class="btn-danger" onclick="requestBookingStatus('${b.id}','rejected')">거절</button><button class="btn-gray" onclick="requestBookingStatus('${b.id}','cancelled')">취소 처리</button></div>`:b.status==='confirmed'?`<div class="top-actions" style="margin-top:12px"><button class="btn-danger" onclick="requestBookingStatus('${b.id}','cancelled')">예약 취소 처리</button></div>`:''}${b.status==='confirmed'?settlementEditorHtml(b):''}</div>`;
    });
    $("dayDetailContent").innerHTML=html;openModal('dayDetailModal');
    $("dayDetailContent").querySelectorAll('.zr-settlement-editor').forEach(root=>updateSettlementPreview(root.dataset.bookingId,root.querySelector('[data-field="actualPaid"]')));
  };

  const baseSetBookingStatus=setBookingStatus;
  window.setBookingStatus=setBookingStatus=function(id,status){
    if(!adminGuard())return;
    baseSetBookingStatus(id,status);
    const b=bookings().find(x=>x.id===id),s=settings(),limit=Number(s.autoCloseLimit||0);
    if(b&&limit>0&&bookingCount(b.date)<limit){
      const i=s.autoCloseOverrideOpen.indexOf(b.date);if(i>=0){s.autoCloseOverrideOpen.splice(i,1);saveSettings(s)}
    }
  };

  function renderOutsourcingPayments(){
    const wrap=$("tab-outsourcing");if(!wrap)return;
    const start=$("outsourceStart")?.value||'',end=$("outsourceEnd")?.value||'';
    const list=bookings().filter(b=>b.settlement&&b.settlement.vendorId&&b.settlement.vendorId!=='self'&&(!start||b.date>=start)&&(!end||b.date<=end)).sort((a,b)=>String(a.date).localeCompare(String(b.date))||new Date(a.createdAt)-new Date(b.createdAt));
    const tTicket=list.reduce((s,b)=>s+Number(b.settlement.ticketAmount||0),0),tCafe=list.reduce((s,b)=>s+Number(b.settlement.actualCafeAmount||0),0),tFee=list.reduce((s,b)=>s+Number(b.settlement.totalFee||0),0);
    $("outsourceKpiTeams").textContent=list.length+'건';$("outsourceKpiTicket").textContent=money(tTicket);$("outsourceKpiCafe").textContent=money(tCafe);$("outsourceKpiFee").textContent=money(tFee);
    $("outsourceList").innerHTML=list.length?list.map(b=>{
      const st=b.settlement,v=st.vendorSnapshot||{};
      const ticketRule=v.ticketFeeType==='percent'?`${v.ticketFeeValue}%`:`건당 ${money(v.ticketFeeValue||0)}`;
      const cafeRule=v.cafeFeeType==='percent'?`${v.cafeFeeValue}%`:`건당 ${money(v.cafeFeeValue||0)}`;
      return `<div class="booking-item"><div class="row"><div><b>${escapeHtml(b.orgName)}</b><div class="help">접수 ${dateTimeText(b.createdAt)} · 방문 ${b.date}</div></div><span class="status confirmed">${escapeHtml(v.name||'-')}</span></div><div class="detail-grid"><div><b>실제 인원</b><br>유료 ${st.actualPaidCount||0} / 무료인솔 ${st.actualFreeChaperone||0} / 유료인솔 ${st.actualPaidChaperone||0}</div><div><b>적용 단체가</b><br>${money(st.ticketUnitPrice||0)}</div><div><b>매표 매출</b><br>${money(st.ticketAmount||0)}</div><div><b>매표 수수료</b><br>${money(st.ticketFee||0)}<br><span class="help">${ticketRule}</span></div><div><b>카페 매출</b><br>${money(st.actualCafeAmount||0)}</div><div><b>카페 수수료</b><br>${money(st.cafeFee||0)}<br><span class="help">${cafeRule}</span></div></div><div class="calc" style="margin-top:10px"><b>총 수수료 지급액 ${money(st.totalFee||0)}</b> · 실제 총매출 ${money(st.totalActualSales||0)}</div></div>`;
    }).join(''):'<div class="help">조회 기간에 저장된 아웃소싱 실제 결제 내역이 없습니다.</div>';
  }
  window.renderOutsourcingPayments=renderOutsourcingPayments;

  function vendorSettingsRowsHtml(){
    return settings().outsourcingVendors.map((v,i)=>`<div class="zr-vendor-row" data-vendor-row="${i}"><input type="text" data-vf="name" value="${escapeHtml(v.name)}" placeholder="업체명"><input type="number" min="0" step="100" data-vf="groupPrice" value="${v.groupPrice||''}" placeholder="단체가"><select data-vf="ticketFeeType"><option value="flat" ${v.ticketFeeType!=='percent'?'selected':''}>건당</option><option value="percent" ${v.ticketFeeType==='percent'?'selected':''}>퍼센트</option></select><input type="number" min="0" step="0.1" data-vf="ticketFeeValue" value="${v.ticketFeeValue||''}" placeholder="매표 수수료"><select data-vf="cafeFeeType"><option value="flat" ${v.cafeFeeType!=='percent'?'selected':''}>건당</option><option value="percent" ${v.cafeFeeType==='percent'?'selected':''}>퍼센트</option></select><input type="number" min="0" step="0.1" data-vf="cafeFeeValue" value="${v.cafeFeeValue||''}" placeholder="카페 수수료"></div>`).join('');
  }
  function renderExtendedSettings(){
    if(!$("tab-settings"))return;
    const s=settings();
    if($("autoCloseLimitValue"))$("autoCloseLimitValue").textContent=Number(s.autoCloseLimit||0)+'팀';
    if($("playgroundLimitEnabled"))$("playgroundLimitEnabled").checked=s.playgroundLimitEnabled!==false;
    if($("vendorSettingsRows"))$("vendorSettingsRows").innerHTML=vendorSettingsRowsHtml();
  }
  window.renderExtendedSettings=renderExtendedSettings;

  function saveVendorSettings(){
    if(!adminGuard())return;
    const s=settings(),rows=[...document.querySelectorAll('.zr-vendor-row')],seen=new Set(),vendors=[];
    for(let i=0;i<10;i++){
      const row=rows[i];if(!row)continue;
      const name=row.querySelector('[data-vf="name"]').value.trim(),groupPrice=Math.max(0,Number(row.querySelector('[data-vf="groupPrice"]').value||0));
      if(name){
        if(seen.has(name)){toast('같은 업체명은 두 번 등록할 수 없습니다.');return}seen.add(name);
        if(groupPrice<=0){toast(`${name}의 단체가를 입력해주세요.`);return}
      }
      vendors.push({id:s.outsourcingVendors[i]?.id||('vendor'+(i+1)),name,groupPrice:groupPrice||15000,ticketFeeType:row.querySelector('[data-vf="ticketFeeType"]').value,ticketFeeValue:Math.max(0,Number(row.querySelector('[data-vf="ticketFeeValue"]').value||0)),cafeFeeType:row.querySelector('[data-vf="cafeFeeType"]').value,cafeFeeValue:Math.max(0,Number(row.querySelector('[data-vf="cafeFeeValue"]').value||0))});
    }
    s.outsourcingVendors=vendors;saveSettings(s);toast('아웃소싱 업체 설정을 저장했습니다.');renderExtendedSettings();
    if(!$("dayDetailModal").classList.contains('hidden')){const title=$("dayDetailContent").querySelector('h2')?.textContent||'';const date=title.slice(0,10);if(/^\d{4}-\d{2}-\d{2}$/.test(date))openDay(date)}
  }

  function setAutoCloseLimit(delta){
    if(!adminGuard())return;
    const s=settings();s.autoCloseLimit=Math.max(0,Math.min(30,Number(s.autoCloseLimit||0)+delta));s.autoClose=s.autoCloseLimit>0;saveSettings(s);renderExtendedSettings();renderAdmin();renderVisitDays();
  }
  function setPlayLimit(v){if(!adminGuard())return;const s=settings();s.playgroundLimitEnabled=!!v;saveSettings(s);refreshPlayStarts();toast(v?'놀이터 시간별 마감 제한을 사용합니다.':'놀이터 시간별 마감 제한을 해제했습니다.');}

  function startAdminBooking(){
    if(!adminGuard())return;
    adminCreateMode=true;window.zrAdminCreateMode=true;
    clearBookingForm();
    $("managerName").readOnly=false;$("contact").readOnly=false;
    $("adminView").style.display='none';$("startView").classList.add('hidden');$("customerView").classList.remove('hidden');
    const banner=$("adminCreateBanner");if(banner)banner.classList.remove('hidden');
    renderVisitDays();refreshSummary();window.scrollTo({top:0,behavior:'smooth'});
  }
  function exitAdminBooking(){
    adminCreateMode=false;window.zrAdminCreateMode=false;
    $("managerName").readOnly=true;$("contact").readOnly=true;
    $("customerView").classList.add('hidden');$("adminView").style.display='block';
    const banner=$("adminCreateBanner");if(banner)banner.classList.add('hidden');
    renderAdmin();
  }
  window.startAdminBooking=startAdminBooking;window.exitAdminBooking=exitAdminBooking;

  const originalSubmit=$("submitBooking").onclick;
  $("submitBooking").onclick=function(){
    if(!adminCreateMode)return originalSubmit.call(this);
    if(!adminGuard())return;
    if(submissionLocked)return;submissionLocked=true;$("submitBooking").disabled=true;
    const err=validateBooking();
    if(err){toast(err);submissionLocked=false;$("submitBooking").disabled=false;return}
    const b=bookingData();
    if(isDateClosed(b.date)){toast('해당 날짜는 마감 상태입니다. 캘린더에서 마감을 먼저 해제해주세요.');submissionLocked=false;$("submitBooking").disabled=false;return}
    if(b.playUse==='yes'&&settings().playgroundLimitEnabled!==false){const taken=takenPlaySlots(b.date);for(let t=toMin(b.playStart);t<toMin(b.playEnd);t+=30){if(taken.has(toTime(t))){toast('선택한 놀이터 시간이 이미 마감되었습니다.');submissionLocked=false;$("submitBooking").disabled=false;return}}}
    b.status='confirmed';b.createdByAdmin=true;b.confirmedAt=new Date().toISOString();b.statusUpdatedAt=b.confirmedAt;
    const bs=bookings();bs.push(b);setStore('zr_bookings',bs);addActivity('submitted',b,'관리자 예약 등록');addActivity('confirmed',b,'관리자 예약 확정');
    submissionLocked=false;$("submitBooking").disabled=false;toast('관리자 예약을 확정 상태로 등록했습니다.');exitAdminBooking();
  };

  function install(){
    const style=document.createElement('style');style.textContent=`
      .zr-stepper{display:inline-grid;grid-template-columns:42px 88px 42px;gap:6px;align-items:center}.zr-stepper button{padding:9px}.zr-stepper strong{text-align:center;padding:9px;border:1px solid var(--line);border-radius:10px;background:#fff}.zr-radio-grid{display:flex;gap:8px;flex-wrap:wrap}.zr-radio{display:flex;align-items:center;gap:6px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:#fff;font-size:13px}.zr-radio input{width:auto}.zr-vendor-head,.zr-vendor-row{display:grid;grid-template-columns:1.25fr .8fr .7fr .8fr .7fr .8fr;gap:7px;align-items:center}.zr-vendor-row{margin-top:7px}.zr-vendor-row input,.zr-vendor-row select{padding:9px}.zr-vendor-head{font-size:12px;font-weight:800;color:var(--muted)}@media(max-width:800px){.zr-vendor-head{display:none}.zr-vendor-row{grid-template-columns:1fr 1fr}.zr-radio-grid{display:grid;grid-template-columns:1fr 1fr}}`;
    document.head.appendChild(style);

    const notice=$("customerView").querySelector('.notice');
    const banner=document.createElement('div');banner.id='adminCreateBanner';banner.className='notice hidden';banner.innerHTML='<b>관리자 예약 등록 모드</b><br>관리자는 주말도 예약일로 선택할 수 있습니다. 등록 시 즉시 예약 확정 상태로 저장됩니다.<div style="margin-top:10px"><button class="btn-gray" onclick="exitAdminBooking()">관리자 캘린더로 돌아가기</button></div>';
    notice.parentNode.insertBefore(banner,notice);

    const calCard=$("adminCalendar").closest('.card');
    const row=document.createElement('div');row.style.cssText='display:flex;justify-content:flex-end;margin:10px 0 2px';row.innerHTML='<button class="btn-primary" id="adminCreateBooking">+ 관리자 예약 등록</button>';calCard.insertBefore(row,$("adminCalendar"));$("adminCreateBooking").onclick=startAdminBooking;

    const oldCloseCard=$("autoClose").closest('.card');
    $("autoClose").style.display='none';
    oldCloseCard.innerHTML=`<h2>예약 마감 설정</h2><div class="grid2"><div><label>하루 자동마감 팀 수</label><div class="zr-stepper"><button class="btn-gray" id="autoCloseMinus">−</button><strong id="autoCloseLimitValue">4팀</strong><button class="btn-soft" id="autoClosePlus">＋</button></div><div class="help" style="margin-top:7px">0팀이면 자동마감을 사용하지 않습니다.</div></div><div><label class="switchline"><input type="checkbox" id="playgroundLimitEnabled"> 놀이터 시간별 마감 제한 사용</label><div class="help" style="margin-top:7px">체크: 같은 시간은 한 단체만 예약 · 체크 해제: 모든 단체가 같은 놀이터 시간을 선택할 수 있습니다.</div></div></div><input type="checkbox" id="autoClose" style="display:none">`;
    $("autoCloseMinus").onclick=()=>setAutoCloseLimit(-1);$("autoClosePlus").onclick=()=>setAutoCloseLimit(1);$("playgroundLimitEnabled").onchange=e=>setPlayLimit(e.target.checked);

    const settingsSection=$("tab-settings");
    const vendorCard=document.createElement('div');vendorCard.className='card';vendorCard.innerHTML=`<h2>아웃소싱 업체 설정</h2><div class="help">예약 상세의 결제 구분에 <b>자체 + 아래 입력한 업체</b>가 표시됩니다. 업체는 최대 10개까지 등록할 수 있습니다. 실제 결제 저장 시 당시 설정값을 별도로 보관하므로 이후 수수료율을 바꿔도 과거 정산값은 바뀌지 않습니다.</div><div class="zr-vendor-head" style="margin-top:12px"><div>업체 이름</div><div>단체가</div><div>매표 방식</div><div>매표 값</div><div>카페 방식</div><div>카페 값</div></div><div id="vendorSettingsRows"></div><div class="help" style="margin-top:8px">건당은 예약 1건 기준입니다. 카페 건당 수수료는 실제 카페 결제금액이 0원보다 클 때만 적용됩니다.</div><div style="display:flex;justify-content:flex-end;margin-top:12px"><button class="btn-primary" id="saveVendorSettings">아웃소싱 설정 저장</button></div>`;
    const smsCard=$("saveSmsSettings").closest('.card');settingsSection.insertBefore(vendorCard,smsCard);$("saveVendorSettings").onclick=saveVendorSettings;

    const lockedBox=[...smsCard.querySelectorAll('.calc')].find(x=>x.textContent.includes('수정할 수 없는 자동입력 항목'));
    if(lockedBox)lockedBox.innerHTML='<b>수정할 수 없는 자동입력 항목</b><br>단체명: <b>[예약 단체명 자동입력]</b><br>방문일: <b>[예약 방문일 자동입력]</b><br>입장시간: <b>[예약 입장시간 자동입력]</b>';

    const tabs=document.querySelector('.admin-tabs');
    const btn=document.createElement('button');btn.className='btn-gray';btn.id='outsourceTabBtn';btn.textContent='아웃소싱 결제대금';tabs.insertBefore(btn,[...tabs.children].find(x=>x.dataset.tab==='settings'));
    const sec=document.createElement('section');sec.id='tab-outsourcing';sec.className='hidden';sec.innerHTML=`<div class="card" style="margin-top:14px"><h2>아웃소싱 결제대금</h2><div class="grid3"><div><label>방문일 시작</label><input type="date" id="outsourceStart"></div><div><label>방문일 종료</label><input type="date" id="outsourceEnd"></div><div style="display:flex;align-items:end"><button class="btn-primary" id="outsourceSearch">조회하기</button></div></div><div class="help" style="margin-top:8px">예약 상세에서 <b>실제 결제 저장</b>을 완료한 아웃소싱 예약만 방문일 기준으로 집계합니다.</div></div><div class="kpi activity-kpi" style="margin-top:14px"><div class="box"><span class="help">정산 건수</span><b id="outsourceKpiTeams">0건</b></div><div class="box"><span class="help">매표 매출</span><b id="outsourceKpiTicket">0원</b></div><div class="box"><span class="help">카페 매출</span><b id="outsourceKpiCafe">0원</b></div><div class="box"><span class="help">총 수수료</span><b id="outsourceKpiFee">0원</b></div></div><div class="card" style="margin-top:14px"><div id="outsourceList"></div></div>`;
    $("tab-activity").after(sec);
    const now=new Date(),f=n=>String(n).padStart(2,'0');$("outsourceStart").value=`${now.getFullYear()}-${f(now.getMonth()+1)}-01`;$("outsourceEnd").value=`${now.getFullYear()}-${f(now.getMonth()+1)}-${f(now.getDate())}`;
    $("outsourceSearch").onclick=renderOutsourcingPayments;
    btn.onclick=()=>{if(!adminGuard())return;document.querySelectorAll('.admin-tabs button').forEach(x=>x.className='btn-gray');btn.className='btn-primary';['calendar','activity','meals','menuadmin','inquiries','settings'].forEach(t=>$("tab-"+t).classList.add('hidden'));sec.classList.remove('hidden');renderOutsourcingPayments()};
    document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>sec.classList.add('hidden')));
    const settingsBtn=[...document.querySelectorAll('[data-tab]')].find(x=>x.dataset.tab==='settings');if(settingsBtn)settingsBtn.addEventListener('click',()=>setTimeout(renderExtendedSettings,0));

    renderExtendedSettings();renderAdmin();
  }

  const baseRefreshAdminCurrentTab=refreshAdminCurrentTab;
  refreshAdminCurrentTab=function(){
    if(!adminGuard())return;
    if($("tab-outsourcing")&&!$("tab-outsourcing").classList.contains('hidden')){renderOutsourcingPayments();renderVisitDays();refreshPlayStarts();toast('관리자 화면을 새로고침했습니다.');return}
    baseRefreshAdminCurrentTab();renderExtendedSettings();
  };
  $("adminRefresh").onclick=refreshAdminCurrentTab;

  install();
})();
