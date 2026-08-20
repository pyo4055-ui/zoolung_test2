(()=>{
  if(window.__ZR_ADMIN_V9_INSTALLED)return;
  window.__ZR_ADMIN_V9_INSTALLED=true;

  const pad=n=>String(n).padStart(2,'0');

  function paintManualClosedDaysV9(){
    const root=document.getElementById('adminCalendar');
    const ym=document.getElementById('adminMonth')?.value||'';
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

  if(typeof renderAdmin==='function'){
    const base=renderAdmin;
    renderAdmin=function(){
      const out=base.apply(this,arguments);
      setTimeout(paintManualClosedDaysV9,0);
      setTimeout(paintManualClosedDaysV9,50);
      return out;
    };
    try{window.renderAdmin=renderAdmin;}catch{}
  }

  if(typeof window.toggleManualClose==='function'){
    const base=window.toggleManualClose;
    window.toggleManualClose=function(){
      const out=base.apply(this,arguments);
      setTimeout(paintManualClosedDaysV9,0);
      setTimeout(paintManualClosedDaysV9,80);
      return out;
    };
    try{toggleManualClose=window.toggleManualClose;}catch{}
  }

  if(typeof window.renderOutsourcingPayments==='function'){
    const base=window.renderOutsourcingPayments;
    window.renderOutsourcingPayments=function(){
      const out=base.apply(this,arguments);
      setTimeout(renderOutsourcePeopleV9,0);
      setTimeout(renderOutsourcePeopleV9,60);
      return out;
    };
    try{renderOutsourcingPayments=window.renderOutsourcingPayments;}catch{}
  }

  const search=document.getElementById('outsourceSearch');
  if(search)search.addEventListener('click',()=>{setTimeout(renderOutsourcePeopleV9,0);setTimeout(renderOutsourcePeopleV9,80);});
  ['outsourceStart','outsourceEnd','outsourceVendorFilter'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.addEventListener('change',()=>setTimeout(renderOutsourcePeopleV9,0));
  });
  document.querySelectorAll('[data-tab],#outsourceTabBtn').forEach(btn=>btn.addEventListener('click',()=>setTimeout(()=>{
    paintManualClosedDaysV9();renderOutsourcePeopleV9();
  },30)));

  function addScript(id,src,onload){
    if(document.getElementById(id)){onload?.();return}
    const s=document.createElement('script');s.id=id;s.src=src;if(onload)s.onload=onload;document.body.appendChild(s);
  }
  function loadAdminScheduleTab(){
    if(!window.zrReservationFirebase){setTimeout(loadAdminScheduleTab,300);return}
    addScript('zrAdminScheduleScript','./admin_schedule_tab_v3.js?v=3',()=>{
      addScript('zrCustomerScheduleScript','./customer_schedule_view_v3.js?v=12');
      addScript('zrCustomerBookingRulesScript','./customer_booking_rules_v3.js?v=3');
      addScript('zrAdminScheduleExcelScript','./admin_schedule_excel_v3.js?v=3');
      addScript('zrScheduleUiFixV4','./schedule_ui_fix_v4.js?v=4');
      addScript('zrSchedulePublishToggleV5','./schedule_publish_toggle_v5.js?v=5');
      addScript('zrScheduleContentManagerV13','./schedule_content_manager_v13.js?v=13');
    });
  }

  setTimeout(()=>{
    paintManualClosedDaysV9();renderOutsourcePeopleV9();
    addScript('zrAdminOpsV10','./admin_ops_v10.js?v=10',()=>addScript('zrAdminOpsV11Patch','./admin_ops_v11_patch.js?v=12'));
    loadAdminScheduleTab();
  },0);
})();