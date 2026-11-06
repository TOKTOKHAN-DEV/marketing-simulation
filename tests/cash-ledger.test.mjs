import test from 'node:test';import assert from 'node:assert/strict';
import{initialMemory,initialPlan,project,validateCampaign}from'../model.mjs';import{DEFAULT_BUDGET_POLICY,budgetFor,memoryForHistory,allocationBudget,enableReinvestment}from'../funding.mjs';
import{simulate}from'../simulation.mjs';import{previewRevision}from'../timeline.mjs';import{annualPlan}from'../annual.mjs';import{establishedMemory}from'./content-fixtures.mjs';
const business={id:'b',name:'연간 자금 실험',industry:'commerce',market:'B2C',audience:'',budgetPolicy:{...DEFAULT_BUDGET_POLICY}},product={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:''};
const input=(units={},memory=initialMemory(),patch={})=>({business,product,products:[product],plan:{...initialPlan(),units},memory,stage:1,round:memory.month+1,...patch});

test('the annual 36-million capital is available in M1 while the recommendation starts at 3 million',()=>{
 const f=budgetFor(business,initialPlan(),initialMemory());assert.equal(f.totalBudget,36000000);assert.equal(f.availableBudget,36000000);assert.equal(f.recommendedBudget,3000000);assert.equal(allocationBudget(f),3000000);assert.equal(f.reinvestmentRate,.3);
 assert.equal(validateCampaign(input({display:60})),null);const m=project(input({display:60}),1)[0];assert.equal(m.spend,6000000);assert.equal(m.revenue,0);assert.equal(m.funding.nextBudget,30000000);assert.equal(m.memoryAfter.cumulativeSpend,6000000);
});
test('monthly allowance does not replenish the already-issued annual capital and unspent funds carry forward',()=>{
 const first=simulate(input({display:60})),second=simulate(input({},first.memoryAfter));assert.equal(second.metrics.budget,30000000);assert.equal(second.metrics.funding.recommendedBudget,3000000);assert.equal(second.metrics.funding.nextBudget,30000000);assert.equal(second.memoryAfter.cumulativeSpend,6000000);
});
test('recommendations use only prior company revenue, while the cap uses gross cumulative revenue exactly once',()=>{
 const memory={...initialMemory(),month:2,lastRevenue:10000000,cumulativeRevenue:18000000,cumulativeSpend:20000000},f=budgetFor(business,initialPlan(),memory);assert.equal(f.availableBudget,34000000);assert.equal(f.recommendedBudget,6000000);assert.equal(f.reinvestmentAmount,3000000);assert.equal(f.availableBudget,36000000+18000000-20000000);
 const m=project(input({},memory),1)[0];assert.equal(m.funding.nextBudget,34000000);assert.equal(m.funding.nextRecommendedBudget,3000000);assert.equal(m.memoryAfter.cumulativeRevenue,18000000);
});
test('all products contribute subscription and service revenue to next month capital and recommendation',()=>{
 const sub={...product,id:'sub',price:40000,purchaseType:'subscription',churnRate:0},service={...product,id:'si',price:1000000,purchaseType:'service',hoursPerOrder:40,monthlyHours:40},memory={...initialMemory(),month:1,cumulativeRevenue:10000000,cumulativeSpend:15000000,productCustomers:{sub:100},customers:100,serviceQueues:{si:{pendingOrders:1,progressHours:0,marketingShare:0,performanceShare:0}}};
 const m=project(input({},memory,{products:[product,sub,service]}),1)[0];assert.equal(m.budget,31000000);assert.equal(m.companyRevenue,5000000);assert.equal(m.funding.nextBudget,36000000);assert.equal(m.funding.nextRecommendedBudget,4500000);assert.equal(m.memoryAfter.cumulativeRevenue,15000000);
});
test('six early 6-million cold ad campaigns exhaust capital, and every new marketing activity is then blocked',()=>{
 let memory=initialMemory();for(let i=0;i<6;i++){const r=input({display:60},memory);assert.equal(validateCampaign(r),null);memory=simulate(r).memoryAfter;}
 assert.equal(budgetFor(business,initialPlan(),memory).availableBudget,0);
 for(const units of [{display:10},{owned:1},{'owned-sns':1},{'group-buy':1},{'influencer-seeding':1}])assert.match(validateCampaign(input(units,memory)),/0원/);
 assert.equal(validateCampaign(input({},memory)),null);const pass=simulate(input({},memory));assert.equal(pass.metrics.spend,0);assert.equal(pass.metrics.revenue,0);assert.equal(pass.metrics.funding.nextBudget,0);assert.equal(pass.memoryAfter.month,7);
});
test('a zero-cash pass recognizes existing subscription income and reopens spending the following month',()=>{
 const sub={...product,id:'sub',price:40000,purchaseType:'subscription',churnRate:0},memory={...initialMemory(),month:2,cumulativeRevenue:0,cumulativeSpend:36000000,customers:100,productCustomers:{sub:100}},r=input({},memory,{products:[product,sub]});assert.equal(validateCampaign(r),null);
 const m=simulate(r);assert.equal(m.metrics.budget,0);assert.equal(m.metrics.companyRevenue,4000000);assert.equal(m.metrics.funding.nextBudget,4000000);const f=budgetFor(business,initialPlan(),m.memoryAfter);assert.equal(f.recommendedBudget,4200000);assert.equal(allocationBudget(f),4000000);
 assert.equal(validateCampaign(input({display:40},m.memoryAfter,{products:[product,sub]})),null);assert.match(validateCampaign(input({display:50},m.memoryAfter,{products:[product,sub]})),/예산/);
});
test('existing deferred commissions settle from delivered revenue even when cash is zero, without funding new acquisition',()=>{
 const service={...product,id:'si',price:1000000,purchaseType:'service',hoursPerOrder:40,monthlyHours:40},memory={...initialMemory(),month:2,cumulativeRevenue:0,cumulativeSpend:36000000,serviceQueues:{si:{pendingOrders:1,progressHours:0,marketingShare:1,performanceShare:0,groupBuyCommissionRate:.25}}},r=input({},memory,{products:[product,service]});
 assert.equal(validateCampaign(r),null);const m=simulate(r);assert.equal(m.metrics.companyRevenue,1000000);assert.equal(m.metrics.spend,250000);assert.equal(m.metrics.funding.settledFromRevenue,250000);assert.equal(m.metrics.unallocated,0);assert.equal(m.metrics.funding.nextBudget,750000);assert.equal(m.memoryAfter.cumulativeSpend,36250000);
 assert.match(validateCampaign(input({owned:1},memory,{products:[product,service]})),/0원/);
});
test('same-month sales cannot be borrowed to fund new upfront marketing',()=>{
 const sub={...product,id:'sub',price:40000,purchaseType:'subscription',churnRate:0},memory={...initialMemory(),month:1,cumulativeRevenue:0,cumulativeSpend:35000000,customers:100,productCustomers:{sub:100}};
 assert.match(validateCampaign(input({display:20},memory,{products:[product,sub]})),/예산/);assert.equal(validateCampaign(input({display:10},memory,{products:[product,sub]})),null);
});
test('history reconstructs ledger totals for old records and active companies migrate without rewriting past snapshots',()=>{
 const {budgetPolicy,...oldBusiness}=business,record=simulate(input({display:10},initialMemory(),{business:oldBusiness})),legacy=structuredClone(record);delete record.memoryAfter.cumulativeRevenue;delete record.memoryAfter.cumulativeSpend;const memory=memoryForHistory([record],initialMemory());assert.equal(memory.cumulativeSpend,record.metrics.spend);assert.equal(memory.cumulativeRevenue,record.metrics.companyRevenue);
 const state={business:{...oldBusiness,budgetPolicy:{baseBudget:5000000,reinvestmentRate:.4}},history:[legacy],businessSessions:{other:{business:oldBusiness}}},upgraded=enableReinvestment(state);assert.deepEqual(upgraded.business.budgetPolicy,DEFAULT_BUDGET_POLICY);assert.deepEqual(upgraded.businessSessions.other.business.budgetPolicy,DEFAULT_BUDGET_POLICY);assert.equal(upgraded.history,state.history);
});
test('historical revisions replay cumulative cash through the suffix while keeping the original source immutable',()=>{
 const first=simulate(input({display:60})),second=simulate(input({display:60},first.memoryAfter)),history=[first,second],before=structuredClone(history),result=previewRevision(history,{[first.id]:{...first.plan,units:{display:100}}});assert.equal(result.error,null);assert.equal(result.history[1].metrics.budget,26000000);assert.equal(result.history[1].memoryAfter.cumulativeSpend,16000000);assert.deepEqual(history,before);
});
test('the annual forecast carries remaining cash through planned passes instead of injecting monthly grants',()=>{
 const monthlyPlans=Object.fromEntries(Array.from({length:12},(_,i)=>[i+1,{productId:'p',plan:{...initialPlan(),units:i<6?{display:60}:{}}}])),year=annualPlan({business,products:[product],history:[],monthlyPlans,productId:'p'});assert.equal(year.entries[5].metrics.funding.nextBudget,0);assert.ok(year.entries.slice(6).every(e=>e.metrics.budget===0&&e.metrics.spend===0&&e.problem===null));
});
test('cash policy and cumulative ledger validation reject malformed or nonzero starting balances',()=>{
 for(const patch of [{mode:'cash',totalBudget:-1},{mode:'cash',totalBudget:'36000000'},{mode:'other',totalBudget:36000000}])assert.ok(validateCampaign(input({},initialMemory(),{business:{...business,budgetPolicy:{...DEFAULT_BUDGET_POLICY,...patch}}})));
 for(const patch of [{cumulativeRevenue:-1},{cumulativeSpend:Infinity},{cumulativeRevenue:100}])assert.ok(validateCampaign(input({}, {...initialMemory(),...patch})));
 const missing={...initialMemory(),month:1};delete missing.cumulativeRevenue;assert.match(validateCampaign(input({},missing)),/누적/);
});
