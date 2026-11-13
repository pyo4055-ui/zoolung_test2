/* Read-only, page-local sales cache. Never writes partial results to zr_bookings. */
(()=>{'use strict';
function create(fetchRange,{ttl=60000,now=Date.now}={}){
  const cache=new Map(),pending=new Map();let generation=0;
  function load(start,end){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||start>=end)return Promise.reject(new Error('조회 기간을 확인해주세요.'));
    const key=start+'|'+end,hit=cache.get(key);
    if(hit&&now()-hit.at<ttl)return Promise.resolve(hit.rows);
    for(const [range,value] of cache){const [from,to]=range.split('|');if(from<=start&&to>=end&&now()-value.at<ttl)return Promise.resolve(value.rows.filter(row=>row.date>=start&&row.date<end))}
    if(pending.has(key))return pending.get(key);
    const epoch=generation;
    const promise=Promise.resolve().then(()=>fetchRange(start,end)).then(rows=>{
      if(epoch===generation)cache.set(key,{rows,at:now()});return rows;
    }).finally(()=>{if(pending.get(key)===promise)pending.delete(key)});
    pending.set(key,promise);return promise;
  }
  return Object.freeze({load,clear(){generation++;cache.clear();pending.clear()},async loadMany(ranges){
    const lists=await Promise.all(ranges.map(([start,end])=>load(start,end)));
    return [...new Map(lists.flat().map(row=>[String(row.id),row])).values()];
  }});
}
globalThis.ZRSalesRangeStore=Object.freeze({create});
})();
