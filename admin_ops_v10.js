(()=>{
'use strict';
if(window.__ZR_ADMIN_OPS_V10)return;
window.__ZR_ADMIN_OPS_V10=true;

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateOnly=v=>{const s=String(v||'');const m=s.match(/\d{4}-\d{2}-\d{2}/);return m?m[0]:s.slice(0,10)};
const ACTIVITY_BASIS_KEY='zr_activity_date_basis_v10';
const activityBasis=()=>localStorage.getItem(ACTIVITY_BASIS_KEY)==='reservation'?'reservation':'reception';

/* ===== 단체 구분: 유치원 / 어린이집 분리 ===== */
function patchGroupSelect(sel){
  if(!sel)return;
  const options=[...sel.options];
  const legacy=options.find(o=>{
    const t=String(o.textContent||'').replace(/\s/g,'');
    const v=String(o.value||'').replace(/\s/g,'');
    return ['유치원,어린이집','유치원/어린이집'].includes(t)||['유치원,어린이집','유치원/어린이집'].includes(v);
  });
  if(!legacy)return;
  const cur=sel.value;
  const preserveLegacy=cur===legacy.value && /^zr2eGroupType$/.test(sel.id||'');
  const make=(value,text)=>{const o=document.createElement('option');o.value=value;o.textContent=text;return o};
  const frag=document.createDocumentFragment();
  if(preserveLegacy)frag.appendChild(make(legacy.value,'유치원, 어린이집 (기존 예약)'));
  frag.appendChild(make('유치원','유치원'));
  frag.appendChild(make('어린이집','어린이집'));
  legacy.replaceWith(frag);
  if(preserveLegacy)sel.value=legacy.value;
  else if(cur&&cur!==legacy.value&&[...sel.options].some(o=>o.value===cur))sel.value=cur;
}
function patchGroupTypes(){
  const selectors=['#groupType','#zr2eGroupType','#zr2qGroupType','select[id$="GroupType"]'];
  document.querySelectorAll(selectors.join(',')).forEach(patchGroupSelect);
}

/* ===== 예약현황: 접수일/예약일 기준 ===== */
const oldActivityFiltered=typeof window.activityFilteredBookings==='function'?window.activityFilteredBookings:(typeof activityFilteredBookings==='function'?activityFilteredBookings:null);
function activityBaseWithoutDates(){
  if(!oldActivityFiltered)return typeof bookings==='function'?bookings():[];
  const s=$('activityStart'),e=$('activityEnd'),sv=s?.value||'',ev=e?.value||'';
  try{
    if(s)s.value='';if(e)e.value='';
    const out=oldActivityFiltered();
    return Array.isArray(out)?out:[];
  }catch(err){console.debug('activity base filter',err);return typeof bookings==='function'?bookings():[];}
  finally{if(s)s.value=sv;if(e)e.value=ev;}
}
function activityFilteredV10(){
  const start=$('activityStart')?.value||'',end=$('activityEnd')?.value||'',basis=activityBasis();
  return activityBaseWithoutDates().filter(b=>{
    if(!b||b.__availabilityOnly)return false;
    const key=basis==='reservation'?String(b.date||''):dateOnly(b.createdAt);
    if(start&&key<start)return false;
    if(end&&key>end)return false;
    return true;
  }).sort((a,b)=>{
    const ak=basis==='reservation'?String(a.date||''):dateOnly(a.createdAt),bk=basis==='reservation'?String(b.date||''):dateOnly(b.createdAt);
    return bk.localeCompare(ak)||String(b.createdAt||'').localeCompare(String(a.createdAt||''));
  });
}
window.activityFilteredBookings=activityFilteredV10;
try{activityFilteredBookings=activityFilteredV10}catch{}

function ensureActivityBasisUi(){
  const tab=$('tab-activity');if(!tab)return;
  let sel=$('activityDateBasis');
  if(!sel){
    const search=[...tab.querySelectorAll('button')].find(b=>(b.textContent||'').trim()==='조회하기');
    if(!search)return;
    const wrap=document.createElement('label');wrap.id='activityDateBasisWrap';wrap.style.cssText='display:flex;flex-direction:column;gap:5px;font-size:12px;font-weight:700;min-width:122px';
    wrap.innerHTML='<span>조회 기준</span><select id="activityDateBasis" style="min-height:40px"><option value="reception">접수일 기준</option><option value="reservation">예약일 기준</option></select>';
    search.insertAdjacentElement('beforebegin',wrap);sel=$('activityDateBasis');
    sel.value=activityBasis();
    sel.onchange=()=>{localStorage.setItem(ACTIVITY_BASIS_KEY,sel.value);if(typeof renderActivity==='function')renderActivity();};
  }else sel.value=activityBasis();
}

/* ===== 예약현황 XLSX v10 ===== */
const te=new TextEncoder();
const xmlEsc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const crcTable=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c>>>0}return t})();
const crc32=bytes=>{let c=0xFFFFFFFF;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0};
const u16=n=>[n&255,n>>>8&255],u32=n=>[n&255,n>>>8&255,n>>>16&255,n>>>24&255];
function concatBytes(parts){const len=parts.reduce((s,p)=>s+p.length,0),out=new Uint8Array(len);let o=0;for(const p of parts){out.set(p,o);o+=p.length}return out}
function zipStore(files){
  const locals=[],centrals=[];let offset=0;
  for(const f of files){
    const name=te.encode(f.name),data=typeof f.data==='string'?te.encode(f.data):f.data,crc=crc32(data),flags=0x0800;
    const local=new Uint8Array([0x50,0x4b,0x03,0x04,...u16(20),...u16(flags),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...name]);
    locals.push(local,data);
    const central=new Uint8Array([0x50,0x4b,0x01,0x02,...u16(20),...u16(20),...u16(flags),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...name]);
    centrals.push(central);offset+=local.length+data.length;
  }
  const cs=centrals.reduce((s,p)=>s+p.length,0),e=new Uint8Array([0x50,0x4b,0x05,0x06,...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(cs),...u32(offset),...u16(0)]);
  return concatBytes([...locals,...centrals,e]);
}
const col=n=>{let s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26)}return s};
const cStr=(ref,val,style=0)=>`<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlEsc(val)}</t></is></c>`;
const cNum=(ref,val,style=4)=>`<c r="${ref}" s="${style}" t="n"><v>${Number(val||0)}</v></c>`;
const cBlank=(ref,style=4)=>`<c r="${ref}" s="${style}"/>`;
function activityMealText(b){
  if(b.mealType==='none')return '식사하지 않음';
  if(b.mealType==='lunchbox')return '도시락 지참';
  if(b.mealType==='cafe'){
    const items=(b.cafe?.items||[]).filter(x=>Number(x.qty||0)>0).map(x=>`${x.name||''}×${Number(x.qty||0)}`).join(', ');
    return `카페 주문${items?` / ${items}`:''}`;
  }
  return '';
}
function cancelText(b){
  if(b.status!=='cancelled')return '';
  const src=typeof cancellationSourceText==='function'?cancellationSourceText(b):'취소';
  const dt=b.cancelledAt?dateOnly(b.cancelledAt):'';
  return [src,dt].filter(Boolean).join(' · ');
}
function buildActivityXlsxV10(list){
  const headers=['접수일','예약일','단체명','단체 구분','예약자','전화','입장','퇴장','식사내용','취소','실제 유료인원','실제 인솔자','무료인솔자','매표금액','카페금액','상품샵','여권','카누','기타'];
  let r=1,rows=[];
  rows.push(`<row r="${r}" ht="27" customHeight="1">${headers.map((h,i)=>cStr(`${col(i+1)}${r}`,h,1)).join('')}</row>`);r++;
  for(const b of list){
    const st=b.settlement||{},done=!!st.savedAt,cancelled=b.status==='cancelled';
    const textStyle=done?5:(cancelled?2:0),numStyle=done?6:(cancelled?3:4);
    const actualPaid=done?Number(st.actualPaidCount||0):null;
    const actualFree=done?Number(st.actualFreeChaperone||0):null;
    const actualPaidChap=done?Number(st.actualPaidChaperone||0):null;
    const actualChap=done?actualFree+actualPaidChap:null;
    const vals=[dateOnly(b.createdAt),String(b.date||''),String(b.orgName||''),String(b.groupType||''),String(b.managerName||''),String(b.contact||''),String(b.entryTime||''),String(b.exitTime||''),activityMealText(b),cancelText(b)];
    let cells=vals.map((v,i)=>cStr(`${col(i+1)}${r}`,v,textStyle)).join('');
    const nums=[actualPaid,actualChap,actualFree,done?Number(st.ticketAmount||0):null,done?Number(st.actualCafeAmount||0):null];
    nums.forEach((v,i)=>{const ref=`${col(11+i)}${r}`;cells+=v===null?cBlank(ref,numStyle):cNum(ref,v,numStyle)});
    for(let i=16;i<=19;i++)cells+=cBlank(`${col(i)}${r}`,numStyle);
    rows.push(`<row r="${r}" ht="23" customHeight="1">${cells}</row>`);r++;
  }
  const last=Math.max(1,r-1);
  const sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="2" width="12" customWidth="1"/><col min="3" max="3" width="28" customWidth="1"/><col min="4" max="4" width="15" customWidth="1"/><col min="5" max="6" width="17" customWidth="1"/><col min="7" max="8" width="9" customWidth="1"/><col min="9" max="9" width="30" customWidth="1"/><col min="10" max="10" width="22" customWidth="1"/><col min="11" max="13" width="13" customWidth="1"/><col min="14" max="19" width="14" customWidth="1"/></cols><sheetData>${rows.join('')}</sheetData><autoFilter ref="A1:S${last}"/></worksheet>`;
  const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,#0"/></numFmts><fonts count="2"><font><sz val="10"/><name val="Malgun Gothic"/></font><font><b/><sz val="10"/><name val="Malgun Gothic"/></font></fonts><fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAF4ED"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE7E7E7"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF2A8"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"><color rgb="FFD9DED9"/></left><right style="thin"><color rgb="FFD9DED9"/></right><top style="thin"><color rgb="FFD9DED9"/></top><bottom style="thin"><color rgb="FFD9DED9"/></bottom></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="7"><xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="3" borderId="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="164" fontId="0" fillId="3" borderId="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="4" borderId="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="164" fontId="0" fillId="4" borderId="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  const wb=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="예약현황" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const wr=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  const root=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const types=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;
  return zipStore([{name:'[Content_Types].xml',data:types},{name:'_rels/.rels',data:root},{name:'xl/workbook.xml',data:wb},{name:'xl/_rels/workbook.xml.rels',data:wr},{name:'xl/styles.xml',data:styles},{name:'xl/worksheets/sheet1.xml',data:sheet}]);
}
function downloadActivityXlsxV10(){
  if(typeof adminGuard==='function'&&!adminGuard())return;
  const list=activityFilteredV10();if(!list.length){if(typeof toast==='function')toast('내려받을 예약 현황이 없습니다.');return;}
  try{
    const bytes=buildActivityXlsxV10(list),start=$('activityStart')?.value||'',end=$('activityEnd')?.value||'',basis=activityBasis()==='reservation'?'예약일':'접수일';
    const suffix=start||end?`_${start||'전체'}_${end||'전체'}`:'';
    const blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`주렁주렁_예약현황_${basis}${suffix}.xlsx`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);if(typeof toast==='function')toast('예약 현황 엑셀을 내려받았습니다.');
  }catch(e){console.error(e);if(typeof toast==='function')toast('예약 현황 엑셀 생성 중 오류가 발생했습니다.');}
}
window.downloadActivityExcel=downloadActivityXlsxV10;
window.downloadActivityExcelV10=downloadActivityXlsxV10;
try{downloadActivityExcel=downloadActivityXlsxV10}catch{}
function bindActivityExcel(){
  const tab=$('tab-activity');if(!tab)return;
  [...tab.querySelectorAll('button')].filter(b=>(b.textContent||'').includes('엑셀')).forEach(b=>b.onclick=downloadActivityXlsxV10);
}
const renderActivityBeforeV10=typeof window.renderActivity==='function'?window.renderActivity:(typeof renderActivity==='function'?renderActivity:null);
if(renderActivityBeforeV10){
  const wrapped=function(){const out=renderActivityBeforeV10.apply(this,arguments);setTimeout(()=>{ensureActivityBasisUi();bindActivityExcel()},60);return out};
  window.renderActivity=wrapped;try{renderActivity=wrapped}catch{}
}

/* ===== 자체 포함 결제대금 ===== */
function vendorInfo(b){
  const st=b?.settlement||{},snap=st.vendorSnapshot||b?.outsourcingVendorSnapshot||{},id=st.vendorId||b?.outsourcingVendorId||snap.id||'self';
  if(id==='self')return {id:'self',name:'자체',groupPrice:Number(st.ticketUnitPrice||15000),ticketFeeType:'flat',ticketFeeValue:0,cafeFeeType:'flat',cafeFeeValue:0};
  const cur=(typeof settings==='function'?settings().outsourcingVendors:[]||[]).find(v=>v.id===id);
  return {...(cur||snap),id,name:(cur||snap).name||id};
}
function vendorOptionsV10(){
  const map=new Map([['self','자체']]);
  (typeof settings==='function'?settings().outsourcingVendors||[]:[]).filter(v=>String(v.name||'').trim()).forEach(v=>map.set(v.id,v.name));
  (typeof bookings==='function'?bookings():[]).forEach(b=>{const v=vendorInfo(b);if(v.id&&!map.has(v.id))map.set(v.id,v.name||v.id)});
  return [...map];
}
function ensureOutsourceFilterV10(){
  const el=$('outsourceVendorFilter');if(!el)return;
  const opts=vendorOptionsV10(),sig=JSON.stringify(opts),old=el.value;
  if(el.dataset.zr10Options!==sig){
    el.dataset.zr10Options=sig;
    el.innerHTML='<option value="">전체 (자체 포함)</option>'+opts.map(([id,name])=>`<option value="${esc(id)}">${esc(name)}</option>`).join('');
    if([...el.options].some(o=>o.value===old))el.value=old;
  }
}
function outsourceRowsV10(){
  const start=$('outsourceStart')?.value||'',end=$('outsourceEnd')?.value||'',f=$('outsourceVendorFilter')?.value||'';
  return (typeof bookings==='function'?bookings():[]).filter(b=>{
    if(!b||b.__availabilityOnly)return false;
    if(!(b.status==='confirmed'||b.status==='cancelled'||b.settlement?.savedAt))return false;
    const v=vendorInfo(b);if(f&&v.id!==f)return false;
    if(start&&String(b.date||'')<start)return false;if(end&&String(b.date||'')>end)return false;
    return true;
  }).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.orgName||'').localeCompare(String(b.orgName||''),'ko'));
}
function renderOutsourcePeopleV10(list){
  const fee=$('outsourceKpiFee'),kpi=document.querySelector('#tab-outsourcing .kpi.activity-kpi')||fee?.closest('.kpi');if(!kpi)return;
  let box=$('outsourceKpiPeopleBox');if(!box){box=document.createElement('div');box.className='box';box.id='outsourceKpiPeopleBox';kpi.appendChild(box)}
  const sum=list.filter(b=>b.settlement?.savedAt).reduce((a,b)=>{const st=b.settlement||{};a.paid+=Number(st.actualPaidCount||0);a.paidChap+=Number(st.actualPaidChaperone||0);a.free+=Number(st.actualFreeChaperone||0);return a},{paid:0,paidChap:0,free:0});
  box.innerHTML=`<span class="help">실제 인원</span><b style="display:block;margin-top:4px;font-size:14px;line-height:1.55">유료인원 ${sum.paid}명<br>유료인솔자 ${sum.paidChap}명<br>무료 인솔자 ${sum.free}명</b>`;
}
function renderOutsourcingPaymentsV10(){
  if(!$('tab-outsourcing'))return;
  ensureOutsourceFilterV10();
  const list=outsourceRowsV10(),done=list.filter(b=>b.settlement?.savedAt),tt=done.reduce((s,b)=>s+Number(b.settlement.ticketAmount||0),0),tc=done.reduce((s,b)=>s+Number(b.settlement.actualCafeAmount||0),0),tf=done.reduce((s,b)=>s+Number(b.settlement.totalFee||0),0);
  if($('outsourceKpiTeams'))$('outsourceKpiTeams').textContent=`${list.length}건 (정산 ${done.length})`;
  if($('outsourceKpiTicket'))$('outsourceKpiTicket').textContent=typeof money==='function'?money(tt):tt.toLocaleString()+'원';
  if($('outsourceKpiCafe'))$('outsourceKpiCafe').textContent=typeof money==='function'?money(tc):tc.toLocaleString()+'원';
  if($('outsourceKpiFee'))$('outsourceKpiFee').textContent=typeof money==='function'?money(tf):tf.toLocaleString()+'원';
  renderOutsourcePeopleV10(list);setTimeout(()=>renderOutsourcePeopleV10(outsourceRowsV10()),140);
  const listEl=$('outsourceList');if(!listEl)return;
  listEl.innerHTML=list.length?list.map(b=>{
    const v=vendorInfo(b),st=b.settlement,done=!!st?.savedAt,cancelled=b.status==='cancelled';
    const head=`<div class="row"><div><b>${esc(b.orgName||'')}</b><div class="help">접수 ${dateOnly(b.createdAt)} · 방문 ${esc(b.date||'')}</div></div><span class="status ${done?'confirmed':'pending'}">${esc(v.name)} · ${done?'실제결제 입력':'실제결제 미입력'}</span></div>`;
    const action=`<div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn-soft" onclick="openAdminBookingDetail('${esc(b.id)}')">${done?'결제 수정':'결제 입력'}</button></div>`;
    if(!done)return `<div class="booking-item">${head}<div class="help" style="margin-top:8px">${cancelled?'예약 취소 건입니다.':'실제 인원과 결제금액을 입력하면 매출에 반영됩니다.'}</div>${action}</div>`;
    const snap=st.vendorSnapshot||v,isSelf=v.id==='self';
    const tr=isSelf?'수수료 없음':snap.ticketFeeType==='percent'?`${Number(snap.ticketFeeValue||0)}%`:`유료 1인당 ${typeof money==='function'?money(Number(snap.ticketFeeValue||0)):Number(snap.ticketFeeValue||0).toLocaleString()+'원'}`;
    const cr=isSelf?'수수료 없음':snap.cafeFeeType==='percent'?`${Number(snap.cafeFeeValue||0)}%`:`건당 ${typeof money==='function'?money(Number(snap.cafeFeeValue||0)):Number(snap.cafeFeeValue||0).toLocaleString()+'원'}`;
    const m=n=>typeof money==='function'?money(Number(n||0)):Number(n||0).toLocaleString()+'원';
    return `<div class="booking-item">${head}<div class="detail-grid"><div><b>실제 인원</b><br>유료 ${Number(st.actualPaidCount||0)} / 무료인솔 ${Number(st.actualFreeChaperone||0)} / 유료인솔 ${Number(st.actualPaidChaperone||0)}</div><div><b>적용 단체가</b><br>${m(st.ticketUnitPrice||0)}</div><div><b>매표 매출</b><br>${m(st.ticketAmount||0)}</div><div><b>매표 수수료</b><br>${m(st.ticketFee||0)}<br><span class="help">${tr}</span></div><div><b>카페 매출</b><br>${m(st.actualCafeAmount||0)}</div><div><b>카페 수수료</b><br>${m(st.cafeFee||0)}<br><span class="help">${cr}</span></div></div><div class="calc" style="margin-top:10px"><b>${isSelf?'실제 총매출':'총 수수료 지급액 '+m(st.totalFee||0)+' · 실제 총매출'} ${m(st.totalActualSales||0)}</b>${cancelled?' · 예약취소':''}</div>${action}</div>`;
  }).join(''):'<div class="help">조회 조건에 해당하는 결제대금 예약이 없습니다.</div>';
}
window.renderOutsourcingPayments=renderOutsourcingPaymentsV10;
try{renderOutsourcingPayments=renderOutsourcingPaymentsV10}catch{}
function bindOutsourceV10(){
  ensureOutsourceFilterV10();
  const search=$('outsourceSearch');if(search)search.onclick=renderOutsourcingPaymentsV10;
  const filter=$('outsourceVendorFilter');if(filter)filter.onchange=renderOutsourcingPaymentsV10;
  const tabBtn=$('outsourceTabBtn');if(tabBtn&&!tabBtn.dataset.zr10){tabBtn.dataset.zr10='1';tabBtn.addEventListener('click',()=>setTimeout(renderOutsourcingPaymentsV10,30));}
  const tab=$('tab-outsourcing');const help=tab?[...tab.querySelectorAll('.help')].find(x=>(x.textContent||'').includes('업체별로 조회')):null;
  if(help)help.textContent='자체와 아웃소싱 업체를 함께 조회할 수 있으며 실제 결제 미입력 예약도 표시됩니다.';
}

function refreshAll(){patchGroupTypes();ensureActivityBasisUi();bindActivityExcel();bindOutsourceV10();}
let pending=false;function scheduleRefresh(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;refreshAll()})}
function boot(){
  refreshAll();
  new MutationObserver(scheduleRefresh).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target?.matches?.('[data-tab],#outsourceTabBtn,#adminBtn,#adminLoginSubmit'))setTimeout(refreshAll,60)},true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
