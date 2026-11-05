import test from'node:test';import assert from'node:assert/strict';
import{annualPlan,fillAnnualPlans,PLAN_MONTHS}from'../annual.mjs';import{initialPlan,initialMemory,project,validateCampaign}from'../model.mjs';import{simulate}from'../simulation.mjs';import{deleteProduct,restoreProduct,saveBusinessState,activateBusiness,businessKey}from'../business-state.mjs';
const business={id:'b',name:'연간 계획',industry:'commerce',market:'B2C',audience:'',budgetPolicy:{baseBudget:5000000,reinvestmentRate:.4}};
const product={id:'p',businessId:'b',name:'대표 상품',price:30000,purchaseType:'oneoff',value:'',involvement:'low'};
const input=(patch={})=>({business,products:[product],history:[],monthlyPlans:{},productId:'p',...patch});
const slot=units=>({productId:'p',plan:{...initialPlan(),units}});
test('the annual plan always contains exactly M1 through M12 including unexecuted future months',()=>{
 const year=annualPlan(input());assert.equal(PLAN_MONTHS,12);assert.deepEqual(year.entries.map(e=>e.month),Array.from({length:12},(_,i)=>i+1));assert.equal(year.metrics.length,12);assert.ok(year.entries.every(e=>e.status==='empty'&&e.metrics.spend===0));assert.ok(year.entries.every(e=>e.metrics.budget===5000000));
 const future=annualPlan(input({monthlyPlans:{12:slot({display:20})}}));assert.equal(future.entries[11].status,'planned');assert.equal(future.entries[11].metrics.spend,2000000);assert.equal(future.entries[11].memoryBefore.month,11);assert.equal(future.entries[10].status,'empty');
});
test('monthly product choices and allocations are independent and feed the next month funding',()=>{
 const second={...product,id:'sub',name:'월 구독',purchaseType:'subscription',price:40000,churnRate:5};
 const monthlyPlans={1:slot({display:40}),2:{productId:'sub',plan:{...initialPlan(),units:{search:10}}},3:slot({owned:4})};const source=input({products:[product,second],monthlyPlans}),before=structuredClone(source),year=annualPlan(source);
 assert.deepEqual(source,before);assert.equal(year.entries[1].productId,'sub');assert.equal(year.entries[1].metrics.budget,5000000+Math.floor(year.entries[0].metrics.companyRevenue*.4));assert.equal(year.entries[1].metrics.channels.find(c=>c.id==='search').units,10);assert.equal(year.entries[2].metrics.channels[0].units,4);
});
test('executed results remain exact while future drafts use the actual latest customer, brand and revenue memory',()=>{
 const first=simulate({business,product,products:[product],plan:slot({display:30}).plan,memory:initialMemory(),stage:1,round:1});
 const source=input({history:[first],monthlyPlans:{1:slot({owned:10}),2:slot({display:20})}}),year=annualPlan(source);
 assert.equal(year.entries[0].metrics,first.metrics);assert.equal(year.entries[0].status,'executed');assert.equal(year.nextMonth,2);assert.equal(year.entries[1].metrics.funding.previousRevenue,first.metrics.companyRevenue);assert.equal(year.entries[1].memoryBefore.awareness,first.memoryAfter.awareness);
});
test('copying a mix fills only empty future months, scales paid allocations and leaves explicit saved plans intact',()=>{
 const source=input({monthlyPlans:{1:slot({display:50,owned:5}),4:slot({cafe:3})}}),before=structuredClone(source);
 const plans=fillAnnualPlans(source,1,source.monthlyPlans[1]);assert.deepEqual(source,before);assert.equal(Object.keys(plans).length,12);assert.deepEqual(plans[4],source.monthlyPlans[4]);assert.ok(plans[2].plan.units.display>50);assert.equal(plans[2].plan.units.owned,5);assert.ok(!Object.hasOwn(plans,13));assert.equal(Object.keys(fillAnnualPlans(source,13,source.monthlyPlans[1])).length,2);
});
test('execution stops at M12 but the complete annual result and historical records remain available',()=>{
 let memory=initialMemory();const history=[];
 for(let month=1;month<=12;month++){const request={business,product,products:[product],plan:slot({owned:1}).plan,memory,stage:1,round:month};assert.equal(validateCampaign(request),null);const h=simulate(request);history.push(h);memory=h.memoryAfter;}
 assert.match(validateCampaign({business,product,plan:initialPlan(),memory,stage:1}),/12개월/);assert.deepEqual(project({business,product,plan:initialPlan(),memory,stage:1},12),[]);const year=annualPlan(input({history}));assert.equal(year.entries.length,12);assert.ok(year.entries.every(e=>e.status==='executed'));assert.equal(year.entries[11].metrics,history[11].metrics);
});
test('deleting a product removes its future plans and undo restores them without overwriting newer work',()=>{
 const other={...product,id:'other'},state={version:2,business,products:[product,other],productId:'p',history:[],plans:{},monthlyPlans:{3:slot({display:10}),5:{productId:'other',plan:initialPlan()}},notes:'',reflection:'',nextAction:'',view:'business',stage:1};
 const removed=deleteProduct(state,'p');assert.equal(removed.monthlyPlans[3],undefined);assert.deepEqual(restoreProduct(removed).monthlyPlans,state.monthlyPlans);
 const changed={...removed,monthlyPlans:{...removed.monthlyPlans,3:{productId:'other',plan:slot({owned:1}).plan}}};assert.equal(restoreProduct(changed).monthlyPlans[3].productId,'other');
});
test('annual slots and selected planning month travel with their own business session',()=>{
 const state={version:2,business,products:[product],productId:'p',history:[],plans:{},monthlyPlans:{7:slot({owned:3})},planningMonth:7,notes:'',reflection:'',nextAction:'',view:'mix',stage:1};
 const other=saveBusinessState(state,{...business,name:'다른 기업'});assert.equal(other.monthlyPlans,undefined);assert.equal(other.planningMonth,undefined);const restored=activateBusiness(other,businessKey(business));assert.deepEqual(restored.monthlyPlans,state.monthlyPlans);assert.equal(restored.planningMonth,7);
});
