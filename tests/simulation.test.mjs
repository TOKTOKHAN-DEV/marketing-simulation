import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {readConfig,simulate,validateRequest} from '../simulation.mjs';
import {CHANNELS,INDUSTRIES,brandDescription,initialMemory,initialPlan,project,recommendMix,spendFor} from '../model.mjs';
const business={id:'b1',name:'테스트 사업',industry:'commerce',market:'B2C',audience:'30대 직장인'};
const product={id:'p1',businessId:'b1',name:'주방 세제',price:30000,purchaseType:'oneoff',value:'세정력과 친환경'};
const request=(overrides={})=>({stage:1,round:1,workshopId:'test',business:{...business},product:{...product},plan:{budget:3000000,units:{owned:4,experience:5,power:1},hypothesis:''},memory:initialMemory(),...overrides});
const config={openStage:1,workshopId:'test'};
test('runtime config refreshes stage and workshop without restart',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'quest-v2-'));
 try{writeFileSync(path.join(root,'.env.local'),'OPEN_STAGE=1\nWORKSHOP_ID=test');assert.equal(readConfig(root).openStage,1);writeFileSync(path.join(root,'.env.local'),'OPEN_STAGE=4\nWORKSHOP_ID=next');assert.equal(readConfig(root).openStage,4);assert.equal(readConfig(root).workshopId,'next');writeFileSync(path.join(root,'.env.local'),'OPEN_STAGE=invalid');assert.equal(readConfig(root).openStage,0);}finally{rmSync(root,{recursive:true});}
});
test('valid campaign accepted',()=>assert.equal(validateRequest(request(),config),null));
test('server blocks closed stage and waiting room',()=>{assert.equal(validateRequest(request({stage:2}),config).status,403);assert.equal(validateRequest(request(),{...config,openStage:0}).status,403);});
test('server rejects stale workshop and invalid rounds',()=>{assert.equal(validateRequest(request({workshopId:'old'}),config).status,409);for(const round of [0,1.5,'1',NaN])assert.equal(validateRequest(request({round}),config).status,400);});
test('all campaign media are available from the first simulation month regardless of lesson topic',()=>{for(const id of ['micro','expert','search','display','social','influencer-seeding'])assert.equal(validateRequest(request({plan:{...initialPlan(),units:{[id]:1}}}),config),null,id);});
test('all media become available in their intended stage',()=>{for(const c of CHANNELS){const r=request({stage:c.stage,plan:{...initialPlan(),budget:100000000,units:{[c.id]:1}}});assert.equal(validateRequest(r,{...config,openStage:3}),null,c.id);}});
test('overspending is rejected, while unallocated money is not spent',()=>{assert.equal(validateRequest(request({plan:{...initialPlan(),budget:100000,units:{power:1}}}),config).status,400);const m=simulate(request()).metrics;assert.equal(m.spend,1300000);assert.equal(m.unallocated,1700000);});
test('invalid media quantities, ids, budgets and hypotheses are rejected',()=>{
 const plans=[{units:{owned:-1}},{units:{owned:1.5}},{units:{owned:Infinity}},{units:{bogus:1}},{units:[]},{budget:-1},{budget:100000001},{budget:'3000000'},{budget:NaN},{hypothesis:12},{hypothesis:'x'.repeat(2001)}];
 for(const patch of plans)assert.equal(validateRequest(request({plan:{...initialPlan(),units:{owned:1},...patch}}),config).status,400);
});
test('business and separate product relationship are validated',()=>{for(const patch of [{businessId:'other'},{price:0},{price:1.1},{price:1e9},{price:'30000'},{name:' '},{purchaseType:'other'}])assert.equal(validateRequest(request({product:{...product,...patch}}),config).status,400);assert.equal(validateRequest(request({business:{...business,industry:'fake'}}),config).status,400);});
test('invalid brand memory is rejected',()=>{for(const patch of [{awareness:101},{trust:-1},{customers:Infinity},{month:1.5},{productCustomers:[]},{productCustomers:{p1:-2}}])assert.equal(validateRequest(request({memory:{...initialMemory(),...patch}}),config).status,400);});
test('higher price lowers both lead entry and purchase conversion rates',()=>{const prices=[1000,30000,300000,3000000,30000000];const months=prices.map(price=>project(request({product:{...product,price}}),1)[0]);for(let i=1;i<months.length;i++){assert.ok(months[i].leadRate<months[i-1].leadRate);assert.ok(months[i].closeRate<months[i-1].closeRate);assert.ok(months[i].leads<=months[i-1].leads);assert.ok(months[i].newOrders<=months[i-1].newOrders);}});
test('industry affects content traffic and paid acquisition independently',()=>{const mix={...initialPlan(),units:{owned:3,search:10}};const retail=project(request({stage:3,plan:mix}),1)[0];const manufacturing=project(request({stage:3,plan:mix,business:{...business,industry:'manufacturing'}}),1)[0];assert.ok(retail.channels.find(c=>c.id==='owned').visits>manufacturing.channels.find(c=>c.id==='owned').visits);assert.ok(retail.channels.find(c=>c.id==='search').visits>manufacturing.channels.find(c=>c.id==='search').visits);});
test('blog types differ in both unit economics and brand effects',()=>{const seed=project(request({plan:{...initialPlan(),units:{seeding:16}}}),1)[0];const power=project(request({plan:{...initialPlan(),units:{power:1}}}),1)[0];assert.equal(seed.spend,power.spend);assert.notEqual(seed.marketingVisits,power.marketingVisits);assert.ok(power.memoryAfter.awareness>seed.memoryAfter.awareness);const experience=project(request({plan:{...initialPlan(),units:{experience:1}}}),1)[0];assert.ok(experience.memoryAfter.trust-initialMemory().trust>experience.memoryAfter.awareness-initialMemory().awareness);});
test('brand recognition threshold increases next-month organic traffic',()=>{const low=project(request({memory:{...initialMemory(),awareness:29}}),1)[0];const high=project(request({memory:{...initialMemory(),awareness:45,trust:30}}),1)[0];assert.equal(low.organicVisits,0);assert.ok(high.organicVisits>0);});
test('owned content earns organic traffic in the following month, never instantly',()=>{const months=project(request({plan:{...initialPlan(),units:{owned:4}}}),3);assert.equal(months[0].organicVisits,0);assert.ok(months[1].organicVisits>0);assert.ok(months[2].organicVisits>months[1].organicVisits);});
test('new awareness affects the next month, not the current month',()=>{const months=project(request({stage:2,plan:{...initialPlan(),budget:12000000,units:{mega:4}},memory:{...initialMemory(),awareness:25,trust:30}}),2);assert.ok(months[0].memoryAfter.awareness>=30);assert.equal(months[0].organicVisits,0);assert.ok(months[1].organicVisits>0);});
test('referrals are next-month acquisition, not a mandatory step before buying',()=>{const first=project(request({memory:{...initialMemory(),trust:40,advocacy:25}}),2);assert.equal(first[0].referralVisits,0);assert.ok(first[0].newOrders>0);assert.ok(first[1].referralVisits>0);});
test('retention and orders remain bounded by their upstream cohorts',()=>{for(const industry of INDUSTRIES)for(const price of [1000,50000,100000000]){const m=project(request({business:{...business,industry:industry.id},product:{...product,price}}),1)[0];assert.ok(m.leads<=m.visits);assert.ok(m.retained<=m.leads);assert.ok(m.newOrders<=m.retained);assert.ok(m.revenue>=0);}});
test('one-off products do not receive invented recurring revenue',()=>{const m=project(request({memory:{...initialMemory(),productCustomers:{p1:1000},customers:1000}}),1)[0];assert.equal(m.repeatOrders,0);});
test('subscription churn is removed from the active renewal cohort',()=>{const r=request({product:{...product,purchaseType:'subscription'},plan:{...initialPlan(),units:{}},memory:{...initialMemory(),productCustomers:{p1:100},customers:100}});const months=project(r,3);assert.equal(months[0].repeatOrders,65);assert.equal(months[0].memoryAfter.productCustomers.p1,65);assert.equal(months[1].repeatOrders,42);assert.ok(months[2].repeatOrders<months[1].repeatOrders);});
test('recurring purchases use the selected product customer pool only',()=>{const memory={...initialMemory(),trust:50,advocacy:28,productCustomers:{p1:100,p2:900},customers:1000};const m=project(request({memory,product:{...product,purchaseType:'repeat'}}),1)[0];assert.equal(m.repeatOrders,8);const newProduct=project(request({memory,product:{...product,id:'p3',purchaseType:'repeat'}}),1)[0];assert.equal(newProduct.repeatOrders,0);});
test('revenue attribution separates ROAS from blended MER',()=>{const m=project(request({product:{...product,purchaseType:'repeat'},memory:{...initialMemory(),awareness:60,organicAssets:8,customers:100,productCustomers:{p1:100}}}),1)[0];assert.equal(m.revenue,(m.newOrders+m.repeatOrders)*product.price);assert.equal(m.attributedRevenue+m.organicRevenue,m.newOrders*product.price);assert.equal(m.roas,Math.round(m.attributedRevenue/m.spend*100));assert.equal(m.mer,Math.round(m.revenue/m.spend*100));assert.ok(m.mer>m.roas);assert.equal(m.performanceRoas,null);});
test('performance ROAS uses only search and social advertising cost',()=>{const r=request({stage:3,plan:{...initialPlan(),units:{search:10,owned:4}}});const m=project(r,1)[0];const adVisits=m.channels.find(c=>c.id==='search').visits;const ad=m.channels.find(c=>c.id==='search');const adShare=ad.conversionShare;const adRevenue=Math.round(m.newOrders*product.price*adShare);assert.equal(m.performanceRoas,Math.round(adRevenue/1000000*100));});
test('zero spend and zero conversions produce null cost ratios, never NaN',()=>{const m=project(request({plan:{...initialPlan(),units:{}}}),1)[0];assert.equal(m.revenue,0);assert.equal(m.roas,null);assert.equal(m.cpa,null);assert.equal(m.cpc,null);});
test('recommendations respect resources and are independent of lesson tags',()=>{for(const budget of [50000,100000,3000000,100000000]){const units=recommendMix(1,budget,business,product,initialMemory());assert.deepEqual(units,recommendMix(3,budget,business,product,initialMemory()));assert.equal(validateRequest(request({plan:{...initialPlan(),budget,units}}),config),null);}});
test('increasing a medium quantity has diminishing traffic returns',()=>{const one=project(request({plan:{...initialPlan(),units:{seeding:1}}}),1)[0];const ten=project(request({plan:{...initialPlan(),units:{seeding:10}}}),1)[0];assert.ok(ten.marketingVisits<10*one.marketingVisits);});
test('forecast preserves inputs and advances exactly one month at a time',()=>{const r=request(),before=structuredClone(r);const months=project(r,6);assert.deepEqual(r,before);assert.equal(months.length,6);assert.deepEqual(months.map(m=>m.month),[1,2,3,4,5,6]);assert.deepEqual(project(r,6),months);});
test('server execution stores only first month as applied memory and preserves snapshots',()=>{const r=request(),out=simulate(r);assert.equal(out.forecast.length,3);assert.equal(out.memoryAfter.month,1);assert.deepEqual(out.metrics,out.forecast[0]);r.product.price=999;r.business.name='changed';r.plan.units.owned=99;assert.equal(out.productSnapshot.price,30000);assert.equal(out.businessSnapshot.name,'테스트 사업');assert.equal(out.plan.units.owned,4);});
test('qualitative brand perception progresses with accumulated recognition',()=>{assert.notEqual(brandDescription(initialMemory()).title,brandDescription({...initialMemory(),awareness:70}).title);assert.notEqual(brandDescription(initialMemory()).trust,brandDescription({...initialMemory(),trust:70}).trust);});
test('opened media can be mixed while recording an earlier learning stage',()=>{
 const r=request({stage:1,plan:{...initialPlan(),units:{owned:2,micro:1,search:2}}});
 assert.equal(validateRequest(r,{...config,openStage:4}),null);
 const result=simulate(r);assert.equal(result.stage,1);assert.ok(result.metrics.channels.some(c=>c.id==='search'));
});
test('lesson opening and waiting room are separate from unrestricted media selection',()=>{
 const r=request({stage:1,availableStage:4,plan:{...initialPlan(),units:{search:1}}});
 assert.equal(validateRequest(r,{...config,openStage:1}),null);
 assert.equal(validateRequest(r,{...config,openStage:0}).status,403);
 assert.equal(validateRequest({...r,stage:4},{...config,openStage:1}).status,403);
 assert.equal(validateRequest({...r,stage:4},{...config,openStage:4}),null);
});

test('one annual timeline runs M1 through M12 independently of lesson topics and rejects M13',()=>{
 let memory=initialMemory();const months=[];
 for(let month=1;month<=12;month++){
  const r=request({stage:1,round:month,memory,plan:{...initialPlan(),units:{owned:2,search:1,micro:1}}});
  assert.equal(validateRequest(r,config),null);const result=simulate(r);assert.equal(result.round,month);months.push(result.metrics.month);memory=result.memoryAfter;
 }
 assert.deepEqual(months,Array.from({length:12},(_,i)=>i+1));assert.ok(memory.organicAssets>0);assert.equal(validateRequest(request({memory,round:13}),config).status,400);
});
test('review topic can record another month and stale month numbers cannot reset the timeline',()=>{
 const first=simulate(request());const next=request({stage:4,round:2,memory:first.memoryAfter});
 assert.equal(validateRequest(next,{...config,openStage:4}),null);const result=simulate(next);assert.equal(result.metrics.month,2);assert.equal(result.stage,4);
 assert.equal(validateRequest({...next,round:1},{...config,openStage:4}).status,400);
 assert.equal(validateRequest({...next,round:3},{...config,openStage:4}).status,400);
});
