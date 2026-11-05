import test from 'node:test';import assert from 'node:assert/strict';
import {initialMemory,initialPlan,project,projectMonthly,outlookPlans,validateCampaign}from'../model.mjs';
import {DEFAULT_BUDGET_POLICY,budgetFor,memoryForHistory,enableReinvestment}from'../funding.mjs';
import {simulate}from'../simulation.mjs';import {previewRevision,revisionPayload}from'../timeline.mjs';
import {saveBusinessState,activateBusiness,businessKey}from'../business-state.mjs';
const business={id:'b',name:'재투자 회사',industry:'commerce',market:'B2C',audience:'',budgetPolicy:{...DEFAULT_BUDGET_POLICY}};
const product={id:'p',businessId:'b',name:'대표 상품',price:30000,purchaseType:'oneoff',value:'',involvement:'low'};
const input=(units={display:50},patch={})=>({business,product,products:[product],plan:{...initialPlan(),units},memory:initialMemory(),stage:1,round:1,...patch});
test('the default monthly starting budget is five million won and revenue is reinvested once, in the next month',()=>{
 assert.equal(initialPlan().budget,5000000);const first=project(input(),1)[0];assert.equal(first.budget,5000000);assert.equal(first.funding.previousRevenue,0);assert.equal(first.funding.reinvestmentAmount,0);assert.equal(first.memoryAfter.lastRevenue,first.companyRevenue);assert.equal(first.funding.nextBudget,5000000+Math.floor(first.companyRevenue*.4));
 const next=project(input({display:50},{memory:JSON.parse(JSON.stringify(first.memoryAfter))}),1)[0];assert.equal(next.budget,first.funding.nextBudget);assert.ok(next.budget>first.budget);assert.equal(next.spend,5000000);assert.equal(next.unallocated,next.budget-next.spend);
});
test('the funding rule uses total previous company revenue, including other subscriptions and completed services',()=>{
 const sub={...product,id:'sub',purchaseType:'subscription',price:40000,churnRate:0},si={...product,id:'si',purchaseType:'service',price:1000000,hoursPerOrder:40,monthlyHours:40};
 const memory={...initialMemory(),productCustomers:{sub:100},customers:100,serviceQueues:{si:{pendingOrders:1,progressHours:0,marketingShare:0,performanceShare:0}}};
 const first=project(input({},{memory,products:[product,sub,si]}),1)[0];assert.equal(first.companyRevenue,5000000);assert.equal(first.budget,5000000);assert.equal(first.funding.nextBudget,7000000);
 const second=project(input({},{memory:first.memoryAfter,products:[product,sub,si]}),1)[0];assert.equal(second.budget,7000000);assert.equal(second.companyRevenue,4000000);assert.equal(second.funding.nextBudget,6600000);
});
test('budgets fall with revenue; unspent funds and old revenue do not compound or get counted twice',()=>{
 const memory={...initialMemory(),month:2,lastRevenue:10000000};const first=project(input({},{memory}),1)[0];assert.equal(first.budget,9000000);assert.equal(first.spend,0);assert.equal(first.unallocated,9000000);assert.equal(first.companyRevenue,0);
 const next=project(input({},{memory:first.memoryAfter}),1)[0];assert.equal(next.budget,5000000);assert.equal(next.funding.reinvestmentAmount,0);
 const initial=budgetFor(business,initialPlan(),{...initialMemory(),lastRevenue:10000000});assert.equal(initial.availableBudget,5000000);
});
test('server validation uses the real monthly allowance and rejects fabricated policy or prior revenue',()=>{
 const memory={...initialMemory(),month:1,lastRevenue:10000000};assert.equal(validateCampaign(input({display:90},{memory})),null);assert.match(validateCampaign(input({display:91},{memory})),/예산/);assert.match(validateCampaign(input({display:51})),/예산/);
 for(const budgetPolicy of [{baseBudget:-1,reinvestmentRate:.4},{baseBudget:5000000,reinvestmentRate:1.1},{baseBudget:5000000,reinvestmentRate:'40'},{baseBudget:Infinity,reinvestmentRate:.4}])assert.ok(validateCampaign(input({}, {business:{...business,budgetPolicy}})));
 for(const lastRevenue of [-1,Infinity,'10000000'])assert.match(validateCampaign(input({},{memory:{...initialMemory(),lastRevenue}})),/전월 매출/);
});
test('future previews expand paid allocation with available funding, while keeping owned publishing and contact work fixed',()=>{
 const plan={...initialPlan(),units:{display:30,experience:5,owned:5,'influencer-seeding':10}};const rows=project(input(plan.units,{plan}),3);
 assert.ok(rows[1].budget>rows[0].budget);assert.ok(rows[1].channels.find(c=>c.id==='display').units>30);assert.equal(rows[1].channels.find(c=>c.id==='owned').units,5);assert.equal(rows[1].channels.find(c=>c.id==='influencer-seeding').units,10);
 const fixed=project(input(plan.units,{plan}),3,{scalePaid:false});assert.deepEqual(fixed.map(m=>m.channels.find(c=>c.id==='display').units),[30,30,30]);assert.ok(rows[1].spend>fixed[1].spend);
 const plans=outlookPlans(plan,[{owned:5,adPercent:100},{owned:3,adPercent:50},{owned:0,adPercent:0}]);const monthly=projectMonthly(input(plan.units,{plan}),plans);assert.equal(monthly[1].channels.find(c=>c.id==='owned').units,3);assert.equal(monthly[2].performanceVisits,0);assert.equal(monthly[2].funding.previousRevenue,monthly[1].companyRevenue);
});
test('editing an early month recalculates subsequent budgets but preserves their chosen media quantities',()=>{
 let memory=initialMemory();const history=Array.from({length:4},()=>{const r=simulate(input({display:20},{memory,round:memory.month+1}));memory=r.memoryAfter;return r;});
 const result=previewRevision(history,{[history[0].id]:{...history[0].plan,units:{display:40}}});assert.equal(result.error,null);assert.ok(result.history[1].metrics.budget>history[1].metrics.budget);assert.deepEqual(result.history[1].plan,history[1].plan);assert.equal(result.history[1].metrics.channels.find(c=>c.id==='display').units,20);
 assert.deepEqual(revisionPayload(history,{[history[0].id]:{...history[0].plan,units:{display:40}}}).records[0].businessSnapshot.budgetPolicy,DEFAULT_BUDGET_POLICY);
 const shrinking=previewRevision(history,{[history[0].id]:{...history[0].plan,units:{display:0}}});assert.equal(shrinking.history[1].metrics.budget,5000000);
});
test('historical fixed budgets remain exact while existing and newly created companies get the new policy',()=>{
 const {budgetPolicy,...legacy}=business;const old=simulate(input({display:20},{business:legacy,plan:{...initialPlan(),budget:3000000,units:{display:20}}}));const memory=memoryForHistory([old],initialMemory());assert.equal(memory.lastRevenue,old.metrics.companyRevenue);
 const blank={version:2,business:legacy,products:[product],productId:product.id,history:[old],plans:{},notes:'',reflection:'',nextAction:'',view:'business',stage:1};const upgraded=enableReinvestment(blank);assert.deepEqual(upgraded.business.budgetPolicy,DEFAULT_BUDGET_POLICY);assert.equal(upgraded.history,blank.history);assert.equal(upgraded.history[0].businessSnapshot.budgetPolicy,undefined);assert.equal(project(input({display:20},{business:legacy,plan:{...initialPlan(),budget:3000000,units:{display:20}}}),2)[1].budget,3000000);
 const fresh=saveBusinessState(upgraded,{...legacy,name:'다른 회사'});assert.deepEqual(fresh.business.budgetPolicy,DEFAULT_BUDGET_POLICY);const returned=activateBusiness(fresh,businessKey(legacy));assert.equal(memoryForHistory(returned.history,initialMemory()).lastRevenue,old.metrics.companyRevenue);
});

test('reducing early revenue blocks a later saved allocation that no longer fits the reinvestment allowance',()=>{
 const first=simulate(input({display:50})),second=simulate(input({display:89},{memory:first.memoryAfter,round:2}));assert.equal(validateCampaign(input({display:89},{memory:first.memoryAfter,round:2})),null);
 const history=[first,second],before=structuredClone(history),result=previewRevision(history,{[first.id]:{...first.plan,units:{display:0}}});assert.equal(result.error.month,2);assert.match(result.error.message,/예산/);assert.deepEqual(history,before);
});
