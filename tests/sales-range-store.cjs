const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../admin_sales_range_store_v1.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../admin_sales_model_v1.js'),'utf8').replace('window.ZRSalesModel','globalThis.ZRSalesModel').replace('window.ZRSalesModel','globalThis.ZRSalesModel'),ctx);
(async()=>{let calls=0,time=0;const data=[{id:'a',date:'2026-09-01',status:'confirmed',settlement:{savedAt:'x',ticketAmount:100,actualCafeAmount:20}},{id:'b',date:'2026-09-30',status:'cancelled',settlement:{savedAt:'x',ticketAmount:900}},{id:'c',date:'2026-10-01',status:'confirmed',settlement:{savedAt:'x',ticketAmount:300}}];
const cache=ctx.ZRSalesRangeStore.create(async(s,e)=>{calls++;return data.filter(b=>b.date>=s&&b.date<e)},{ttl:60,now:()=>time});
const range=['2026-09-01','2026-10-01'];const [a,b]=await Promise.all([cache.load(...range),cache.load(...range)]);assert.equal(calls,1);assert.equal(a.length,2);assert.equal(a,b);
await cache.load(...range);assert.equal(calls,1);time=61;await cache.load(...range);assert.equal(calls,2);
const union=await cache.loadMany([range,['2026-01-01','2027-01-01']]);assert.equal(union.length,3);
const original=ctx.ZRSalesModel.create(()=>data),scoped=ctx.ZRSalesModel.create(()=>a);assert.equal(original.aggregateRows(original.rowsForMonth('2026-09')).total,120);assert.deepEqual(JSON.stringify(scoped.aggregateRows(scoped.rowsForMonth('2026-09'))),JSON.stringify(original.aggregateRows(original.rowsForMonth('2026-09'))));
let tries=0;const failing=ctx.ZRSalesRangeStore.create(async()=>{if(++tries===1)throw Error('offline');return []});await assert.rejects(failing.load(...range));await failing.load(...range);assert.equal(tries,2);
const beforeCover=calls;await cache.load('2026-08-01','2026-09-01');assert.equal(calls,beforeCover);
cache.clear();await cache.load(...range);assert.equal(calls,4);
console.log('PASS: range boundaries, request deduplication, TTL, overlapping periods, cancellation exclusion, sales parity, failure retry, cache reset');
})().catch(e=>{console.error(e);process.exitCode=1});

