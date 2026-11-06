import {establishedMemory} from './content-fixtures.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {initialMemory,initialPlan} from '../model.mjs';import {simulate} from '../simulation.mjs';
import {previewRevision,revisionPayload,mergeRevision,replayRecords,planForRecord} from '../timeline.mjs';import {replayRequest} from '../replay-request.mjs';import replayApi from '../api/replay.mjs';
const business={id:'b',name:'월별 수정',industry:'commerce',market:'B2C',audience:''};
const product={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:'',sourceUrl:'https://example.com/item'};
const plan=(units={owned:4,search:3})=>({...initialPlan(),units});
function historyFor(months=4){let memory=establishedMemory();return Array.from({length:months},(_,i)=>{const r=simulate({business,product,products:[product],plan:plan(),memory,stage:i===3?4:1,round:i+1});memory=r.memoryAfter;return r;});}
const config={openStage:4,workshopId:'test'};
test('viewing an old month without changes preserves stored metrics and original inputs',()=>{const history=historyFor(),before=structuredClone(history);const preview=previewRevision(history,{});assert.equal(preview.history,history);assert.equal(preview.changed,0);assert.equal(revisionPayload(history,{}),null);assert.deepEqual(history,before);});
test('changing month one updates all later results without changing their media allocations',()=>{
 const history=historyFor(),before=structuredClone(history),draft={...history[0].plan,units:{owned:15,search:3}};
 const result=previewRevision(history,{[history[0].id]:draft});assert.equal(result.error,null);assert.equal(result.fromMonth,1);assert.equal(result.affected,4);assert.equal(result.changed,1);
 assert.ok(result.history[1].metrics.organicVisits>history[1].metrics.organicVisits);assert.ok(result.history[3].memoryAfter.organicAssets>history[3].memoryAfter.organicAssets);
 for(let i=1;i<history.length;i++){assert.deepEqual(result.history[i].plan,history[i].plan);assert.equal(result.history[i].id,history[i].id);assert.equal(result.history[i].createdAt,history[i].createdAt);}
 assert.deepEqual(history,before);
});
test('editing a middle month preserves the exact earlier records and carries revised memory forward',()=>{
 const history=historyFor(5),drafts={[history[2].id]:plan({owned:1,display:5})};const result=previewRevision(history,drafts);
 assert.equal(result.error,null);assert.equal(result.fromMonth,3);assert.equal(result.affected,3);assert.equal(result.history[0],history[0]);assert.equal(result.history[1],history[1]);
 assert.deepEqual(result.history[3].memoryBefore,result.history[2].memoryAfter);assert.deepEqual(result.history[4].memoryBefore,result.history[3].memoryAfter);
});
test('multiple revised months apply together and historical prices and source metadata remain intact',()=>{
 const history=historyFor(3);const changedProduct={...product,price:50000,name:'가격 변경 상품'};
 history[1]=simulate({business,product:changedProduct,products:[changedProduct],plan:plan(),memory:history[0].memoryAfter,stage:2,round:2});
 history[2]=simulate({business,product:changedProduct,products:[changedProduct],plan:plan(),memory:history[1].memoryAfter,stage:3,round:3});
 const drafts={[history[0].id]:plan({owned:10}),[history[2].id]:plan({owned:1,search:1})};const payload=revisionPayload(history,drafts,'test');
 assert.equal(payload.records[1].productSnapshot.price,50000);assert.equal(payload.records[0].productSnapshot.sourceUrl,undefined);
 const result=replayRequest(payload,config);assert.equal(result.status,200);const merged=mergeRevision(history,result.records,result.revisedAt);
 assert.equal(merged[0].productSnapshot.price,30000);assert.equal(merged[1].productSnapshot.price,50000);assert.equal(merged[1].productSnapshot.sourceUrl,product.sourceUrl);assert.equal(merged[1].metrics.revenue%50000,0);assert.equal(previewRevision(history,drafts).changed,2);
 assert.deepEqual(merged[2].plan,drafts[history[2].id]);assert.ok(merged.every(h=>h.revisedAt===result.revisedAt));
});
test('a changed creative schedule can invalidate a later workload; the server never applies a partial replay',()=>{
 const b={...business,marketingTeam:{headcount:1,hoursPerPerson:56,performance:'standard',awarenessRetention:94}};
 const first=simulate({business:b,product,products:[product],plan:{...plan({owned:1,display:1}),campaigns:{display:{refreshMonths:3}}},memory:initialMemory(),stage:1,round:1});
 const second=simulate({business:b,product,products:[product],plan:{...plan({owned:14,display:1}),campaigns:{display:{refreshMonths:3}}},memory:first.memoryAfter,stage:1,round:2});
 const history=[first,second],before=structuredClone(history),drafts={[first.id]:plan({owned:1})};
 const preview=previewRevision(history,drafts);assert.equal(preview.error.month,2);assert.match(preview.error.message,/가용 시간/);
 const result=replayRequest(revisionPayload(history,drafts,'test'),config);assert.equal(result.status,400);assert.equal(result.month,2);assert.equal(result.records,undefined);assert.deepEqual(history,before);
 const repaired=previewRevision(history,{...drafts,[second.id]:{...second.plan,units:{owned:12,display:1}}});assert.equal(repaired.error,null);assert.equal(repaired.history[1].metrics.creativeWorkHours,6);
});
test('subscription renewals and passive service delivery are recalculated across products',()=>{
 const sub={...product,id:'sub',price:40000,purchaseType:'subscription',churnRate:5};const service={...product,id:'si',price:1000000,purchaseType:'service',hoursPerOrder:320,monthlyHours:160};
 let memory=establishedMemory({awareness:30,trust:40,organicAssets:85,contentPublished:{existing:{owned:85}},productCustomers:{sub:10},customers:10,serviceQueues:{si:{pendingOrders:1,progressHours:0,marketingShare:1,performanceShare:0}}});
 const history=Array.from({length:3},(_,i)=>{const r=simulate({business,product:sub,products:[sub,service],plan:plan({owned:5}),memory,stage:1,round:i+1});memory=r.memoryAfter;return r;});
 const result=previewRevision(history,{[history[0].id]:plan({owned:15})});assert.equal(result.error,null);
 assert.ok(result.history[2].metrics.activeSubscribers>history[2].metrics.activeSubscribers);assert.equal(result.history[1].metrics.backgroundRevenue,1000000);assert.equal(result.history[1].memoryAfter.serviceQueues.si.pendingOrders,0);
});
test('replay rejects unordered records, duplicate IDs, stale workshops and a closed waiting room',()=>{
 const history=historyFor(),payload=revisionPayload(history,{[history[0].id]:plan({owned:10})},'test');
 assert.equal(replayRequest({...payload,workshopId:'old'},config).status,409);assert.equal(replayRequest(payload,{...config,openStage:0}).status,403);
 assert.equal(replayRequest({...payload,fromMonth:2},config).status,400);
 const wrong=structuredClone(payload);wrong.records[1].month=7;assert.equal(replayRequest(wrong,config).status,400);
 const duplicate=structuredClone(payload);duplicate.records[1].id=duplicate.records[0].id;assert.equal(replayRequest(duplicate,config).status,400);
 assert.equal(replayRequest(payload,{...config,openStage:1}).status,200); // Historical lesson tags never restrict strategies.
});
test('Vercel replay endpoint returns a complete suffix and rejects wrong methods or large payloads',()=>{
 const response=()=>({headers:{},statusCode:0,body:null,setHeader(k,v){this.headers[k]=v;return this;},status(n){this.statusCode=n;return this;},json(body){this.body=body;return this;}});
 const old={OPEN_STAGE:process.env.OPEN_STAGE,WORKSHOP_ID:process.env.WORKSHOP_ID};process.env.OPEN_STAGE='4';process.env.WORKSHOP_ID='test';
 try{const history=historyFor(),body=revisionPayload(history,{[history[1].id]:plan({owned:10})},'test'),res=response();replayApi({method:'POST',body},res);assert.equal(res.statusCode,200);assert.equal(res.body.records.length,3);assert.equal(res.body.fromMonth,2);assert.equal(res.headers['Cache-Control'],'no-store');
 const wrong=response();replayApi({method:'GET'},wrong);assert.equal(wrong.statusCode,405);const large=response();replayApi({method:'POST',body:{extra:'a'.repeat(2*1024*1024+1)}},large);assert.equal(large.statusCode,413);
 }finally{for(const[k,v]of Object.entries(old))if(v===undefined)delete process.env[k];else process.env[k]=v;}
});

test('legacy once-only targets replay their actually executed quantities, not the original requested totals',()=>{
 const first=simulate({business,product,plan:plan({owned:4}),memory:initialMemory(),stage:1,round:1});
 first.plan.cadence={owned:'once'};
 const second=simulate({business,product,plan:plan({}),memory:first.memoryAfter,stage:1,round:2});
 second.plan={...plan({owned:4}),cadence:{owned:'once'}};
 const history=[first,second];assert.equal(planForRecord(second).units.owned,0);
 const result=previewRevision(history,{[first.id]:plan({owned:10})});assert.equal(result.error,null);assert.equal(result.changed,1);assert.equal(result.history[1].metrics.ownedPublished,0);assert.equal(result.history[1].plan.units.owned,0);assert.equal(second.plan.units.owned,4);
});
