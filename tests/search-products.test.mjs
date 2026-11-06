import test from 'node:test';import assert from 'node:assert/strict';
import{CHANNELS,initialPlan,initialMemory,project,validateCampaign,brandSearchDemand,searchCpcFor,nextAllocation,allocationStep}from'../model.mjs';
import{simulate}from'../simulation.mjs';import{scalePaidPlan,DEFAULT_BUDGET_POLICY}from'../funding.mjs';import{establishedMemory}from'./content-fixtures.mjs';import{annualPlan}from'../annual.mjs';
const business={id:'b',name:'검색 상품',industry:'commerce',market:'B2C',audience:'',budgetPolicy:{...DEFAULT_BUDGET_POLICY}},product={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:''};
const input=(units,patch={})=>({business,product,products:[product],memory:initialMemory(),stage:3,plan:{...initialPlan(),units},...patch});
test('keyword CPC uses the classroom market setting across industries and preserves the explore option',()=>{
 for(const industry of ['commerce','saas','manufacturing'])for(const market of ['B2C','B2B','B2B2C','B2G']){
  const r=input({search:10},{business:{...business,industry,market}}),m=project(r,1)[0],cpc=market==='B2C'?5000:20000;
  assert.equal(m.channels[0].effectiveCpc,cpc);assert.equal(m.performanceVisits,1000000/cpc);assert.equal(m.spend,1000000);assert.equal(validateCampaign(r),null);
  const explore=project({...r,plan:{...r.plan,campaigns:{search:{keyword:'explore'}}}},1)[0];assert.equal(explore.channels[0].effectiveCpc,cpc*.7);assert.ok(explore.performanceVisits>m.performanceVisits);
 }
});
test('cold brands cannot buy self-name demand; CPC self-name saves unused allocation but fixed Naver fees still apply',()=>{
 for(const id of ['brand-sa','naver-brand']){
  const r=input({[id]:id==='brand-sa'?10:1}),m=simulate(r).metrics;
  assert.equal(m.performanceVisits,0);assert.equal(m.newOrders,0);assert.equal(m.spend,id==='brand-sa'?0:4000000);assert.equal(m.creativeWorkHours,0);assert.equal(m.memoryAfter.adCreatives.p,undefined);
 }
});
test('self-name SA is cheaper, demand-limited and records only actual click spend in the cash ledger',()=>{
 const memory=establishedMemory({awareness:30,trust:30}),r=input({'brand-sa':10},{memory}),m=simulate(r).metrics;
 assert.equal(searchCpcFor('B2B','brand-sa'),2000);assert.equal(searchCpcFor('B2C','brand-sa'),500);
 assert.equal(m.performanceVisits,200);assert.equal(m.spend,100000);assert.equal(m.channels[0].effectiveCpc,500);assert.equal(m.funding.nextBudget,36000000+m.companyRevenue-100000);
 const more=project(input({'brand-sa':100},{memory}),1)[0];assert.equal(more.performanceVisits,200);assert.equal(more.spend,100000);
 const warm=project(input({'brand-sa':10},{memory:establishedMemory({awareness:50,trust:50})}),1)[0];assert.ok(warm.performanceVisits>m.performanceVisits);assert.ok(warm.channels[0].searchBrandMultiplier>m.channels[0].searchBrandMultiplier);
});
test('self-name and Naver share one brand-demand pool instead of duplicating branded traffic',()=>{
 const memory=establishedMemory({awareness:50,trust:50}),m=project(input({'brand-sa':100,'naver-brand':1},{memory}),1)[0];
 assert.ok(m.performanceVisits<=brandSearchDemand(memory));assert.ok(m.channels.every(c=>c.visits>0));assert.equal(m.spend,m.channels.reduce((n,c)=>n+c.spend,0));assert.equal(m.workHours,8);assert.equal(m.creativeRefreshes,0);
});
test('Naver sells one monthly 3–5 million package and cannot grow into multiple contracts during scaling',()=>{
 const c=CHANNELS.find(c=>c.id==='naver-brand');assert.equal(allocationStep(c),1);assert.equal(nextAllocation(c,0,1),1);assert.equal(nextAllocation(c,1,1),1);assert.equal(nextAllocation(c,1,-1),0);
 const memory=establishedMemory({awareness:50,trust:50});let previous=0;
 for(const rate of [3000000,4000000,5000000]){
  const r=input({'naver-brand':1},{memory,plan:{...initialPlan(),units:{'naver-brand':1},rates:{'naver-brand':rate}}}),m=simulate(r).metrics;
  assert.equal(m.spend,rate);assert.ok(m.performanceVisits>previous);previous=m.performanceVisits;
  assert.equal(scalePaidPlan(r.plan,CHANNELS,3000000,30000000).units['naver-brand'],1);
 }
 assert.ok(validateCampaign(input({'naver-brand':2})));assert.ok(validateCampaign(input({'naver-brand':1},{plan:{...initialPlan(),units:{'naver-brand':1},rates:{'naver-brand':2000000}}})));
});
test('branded traffic still requires a blog foundation before any ad purchases and has no display fatigue',()=>{
 for(const id of ['brand-sa','naver-brand']){
  const r=input({[id]:id==='brand-sa'?10:1},{memory:{...initialMemory(),awareness:50,trust:50}}),rows=project(r,3);
  assert.ok(rows.every(m=>m.performanceVisits>0&&m.newOrders===0&&m.roas===0&&m.creativeWorkHours===0));assert.ok(rows.every(m=>m.channels[0].searchBrandMultiplier>1));
 }
});
test('a saved marketing plan at zero cash cannot create phantom content or revive the annual forecast',()=>{
 const memory={...initialMemory(),month:6,cumulativeSpend:36000000},r=input({owned:20,'owned-sns':5,display:10},{memory}),before=structuredClone(r),m=project(r,1)[0];
 assert.match(validateCampaign(r),/0원/);assert.equal(m.spend,0);assert.equal(m.workHours,0);assert.equal(m.performanceVisits,0);assert.equal(m.memoryAfter.contentPublished.p.owned,undefined);assert.equal(m.memoryAfter.organicAssets,0);assert.deepEqual(r,before);
 const history=[];let cursor=initialMemory();for(let i=0;i<6;i++){const record=simulate(input({display:60},{memory:cursor}));history.push(record);cursor=record.memoryAfter;}const monthlyPlans=Object.fromEntries(Array.from({length:6},(_,i)=>[i+7,{productId:'p',plan:r.plan}]));
 const forecast=annualPlan({business,products:[product],history,monthlyPlans,productId:'p'}).entries.filter(e=>e.month>=7);
 assert.equal(forecast.length,6);assert.ok(forecast.every(e=>e.metrics.spend===0&&e.metrics.workHours===0&&e.metrics.companyRevenue===0&&e.metrics.memoryAfter.organicAssets===0));
});
