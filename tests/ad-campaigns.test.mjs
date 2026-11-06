import {establishedMemory} from './content-fixtures.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {benchmarkFor,AD_SOURCES,CHANNELS,allocationStep,nextAllocation,recommendMix,initialPlan,initialMemory,project,projectMonthly,outlookPlans,validateCampaign,clearCreativeActions} from '../model.mjs';
import {scalePaidPlan} from '../funding.mjs';
const business={id:'b',name:'광고 실습',industry:'commerce',market:'B2C',audience:''};
const product={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:''};
const input=(patch={})=>({business,product,plan:{...initialPlan(),budget:10000000,units:{display:30},campaigns:{display:{format:'image',refreshMonths:0}}},memory:establishedMemory(),stage:3,...patch});
test('each performance allocation block spends one million won and existing amounts keep their value',()=>{
 for(const c of CHANNELS.filter(c=>c.group==='performance'&&!['brand-sa','naver-brand'].includes(c.id))){
  const units=nextAllocation(c,0,1),plan={...initialPlan(),units:{[c.id]:units}};
  const first=project(input({plan}),1)[0];assert.equal(first.spend,1000000);assert.ok(first.performanceVisits>0);assert.equal(units/allocationStep(c),1);
  assert.equal(project(input({plan:{...plan,units:{[c.id]:nextAllocation(c,units,1)}}}),1)[0].spend,2000000);
  assert.equal(nextAllocation(c,units,-1),0);assert.equal(nextAllocation(c,0,-1),0);
  assert.equal(project(input({plan:{...plan,units:{[c.id]:15}}}),1)[0].spend,1500000);
  assert.equal(nextAllocation(c,15,1),20);assert.equal(nextAllocation(c,15,-1),10);assert.equal(nextAllocation(c,2000,1),2000);
 }
 const content=CHANNELS.find(c=>c.id==='experience');assert.equal(nextAllocation(content,0,1),1);
});
test('recommended and expanded performance allocations stay in million-won blocks within funding',()=>{
 for(const budget of [500000,1500000,5000000,100000000]){
  const units=recommendMix(1,budget,business,product),plan={...initialPlan(),budget,units};
  assert.equal(validateCampaign(input({plan})),null);
  for(const c of CHANNELS.filter(c=>c.group==='performance'))assert.equal((units[c.id]||0)%allocationStep(c),0);
 }
 const plan={...initialPlan(),units:{search:10,display:20,social:10,owned:3,'influencer-seeding':10}},before=structuredClone(plan);
 const scaled=scalePaidPlan(plan,CHANNELS,5000000,7800000);
 assert.deepEqual(scaled.units,{search:10,display:30,social:10,owned:3,'influencer-seeding':10});assert.deepEqual(plan,before);
 const legacy={...initialPlan(),units:{display:15}};assert.deepEqual(scalePaidPlan(legacy,CHANNELS,5000000,5000000),legacy);
});
test('CPC references preserve source USD data and make display estimation explicit',()=>{
 const b=benchmarkFor('education');assert.equal(b.searchUsd,4.81);assert.equal(b.socialUsd,.70);assert.equal(b.search,6730);assert.equal(b.social,980);assert.equal(b.fx,1400);assert.match(b.displayBasis,/推定|추정/);assert.ok(b.mapping.includes('교육'));
 assert.equal(benchmarkFor('saas').category,'Business Services');assert.ok(benchmarkFor('saas').mapping.includes('대용'));
 assert.ok(AD_SOURCES.search.url.includes('2026'));assert.ok(AD_SOURCES.social.url.includes('2026'));assert.equal(benchmarkFor('missing').search,benchmarkFor('other').search);
});
test('industry and ad network change actual purchased clicks under the same spend',()=>{
 const p={...initialPlan(),units:{search:10,social:10,display:10}};
 const retail=project(input({plan:p}),1)[0],saas=project(input({plan:p,business:{...business,industry:'saas',market:'B2B'}}),1)[0];
 const sa=retail.channels.find(c=>c.id==='search'),da=retail.channels.find(c=>c.id==='display');
 assert.ok(da.visits>sa.visits);assert.ok(retail.channels.find(c=>c.id==='search').visits>saas.channels.find(c=>c.id==='search').visits);
 assert.equal(sa.effectiveCpc,5000);assert.equal(da.baseCpc,benchmarkFor('commerce').display);
 assert.equal(retail.performanceVisits,retail.channels.reduce((sum,c)=>sum+c.visits,0));
 assert.equal(retail.spend,3000000);assert.equal(retail.adCpc,Math.round(retail.spend/retail.performanceVisits));
});
test('unchanged display creative loses conversion efficiency by its third month despite equal ad spend',()=>{
 const m=project(input(),3);const c=m.map(x=>x.channels.find(c=>c.id==='display'));
 assert.deepEqual(m.map(m=>m.spend),[3000000,3000000,3000000]);assert.deepEqual(c.map(c=>c.creativeAge),[0,1,2]);assert.deepEqual(c.map(c=>c.conversionMultiplier),[1,.88,.65]);
 assert.ok(c[2].visits<c[0].visits);assert.ok(c[2].effectiveCpc>c[0].effectiveCpc);assert.ok(m[2].closeRate<m[0].closeRate);assert.ok(m[2].revenue<m[0].revenue);
 assert.deepEqual(m.map(m=>m.creativeWorkHours),[6,0,0]);
});
test('monthly refresh restores creative efficiency and consumes more production time than quarterly refresh',()=>{
 const monthly=project(input({plan:{...input().plan,campaigns:{display:{format:'image',refreshMonths:1}}}}),4);
 const quarterly=project(input({plan:{...input().plan,campaigns:{display:{format:'image',refreshMonths:3}}}}),4);
 assert.deepEqual(monthly.map(m=>m.creativeWorkHours),[6,6,6,6]);assert.deepEqual(quarterly.map(m=>m.creativeWorkHours),[6,0,0,6]);
 assert.equal(monthly[2].channels[0].conversionMultiplier,1);assert.equal(quarterly[2].channels[0].conversionMultiplier,.65);
 assert.ok(monthly[2].revenue>quarterly[2].revenue);assert.equal(quarterly[3].channels[0].creativeAge,0);
});
test('creative production competes with owned publishing for the same marketer capacity',()=>{
 const b={...business,marketingTeam:{headcount:1,hoursPerPerson:40,performance:'standard',awarenessRetention:94}};
 const p={...initialPlan(),units:{owned:10,display:1},campaigns:{display:{format:'image',refreshMonths:1}}};
 assert.match(validateCampaign(input({business:b,plan:p})),/가용 시간/);
 assert.equal(validateCampaign(input({business:b,plan:{...p,units:{owned:8,display:1}}})),null);
 const image=project(input({plan:p}),1)[0],video=project(input({plan:{...p,campaigns:{display:{format:'video',refreshMonths:1}}}}),1)[0];
 assert.equal(image.creativeWorkHours,6);assert.equal(video.creativeWorkHours,16);assert.equal(video.spend,image.spend);assert.ok(video.workHours>image.workHours);
});
test('search keyword strategies affect CPC and intent without applying display creative fatigue',()=>{
 const plan={...initialPlan(),units:{search:20},campaigns:{search:{keyword:'purchase'}}};const purchase=project(input({plan}),3);
 const broad=project(input({plan:{...plan,campaigns:{search:{keyword:'explore'}}}}),1)[0];
 assert.ok(broad.channels[0].visits>purchase[0].channels[0].visits);assert.ok(broad.closeRate<purchase[0].closeRate);
 assert.deepEqual(purchase.map(m=>m.creativeWorkHours),[0,0,0]);assert.deepEqual(purchase.map(m=>m.workHours),[2,2,2]);assert.deepEqual(purchase.map(m=>m.channels[0].effectiveCpc),Array(3).fill(5000));
});
test('creative memory is product-specific and ages while paused or another product runs',()=>{
 const first=project(input(),1)[0];
 const other=project(input({product:{...product,id:'other'},memory:first.memoryAfter,plan:{...initialPlan(),units:{}}}),1)[0];
 assert.equal(other.memoryAfter.adCreatives.p.display.age,2);
 const resumed=project(input({memory:JSON.parse(JSON.stringify(other.memoryAfter))}),1)[0];assert.equal(resumed.channels[0].creativeAge,2);assert.equal(resumed.creativeWorkHours,0);
 const freshProduct=project(input({product:{...product,id:'new'},memory:other.memoryAfter}),1)[0];assert.equal(freshProduct.channels[0].creativeAge,0);assert.equal(freshProduct.creativeWorkHours,6);
});
test('explicit refresh applies only to its planned month, while automatic cycle remains available',()=>{
 const before=project(input(),2)[1].memoryAfter;const plan={...input().plan,campaigns:{display:{format:'image',refreshMonths:0,refreshNow:true}}};
 const sequence=outlookPlans(plan,[{owned:0,adPercent:100},{owned:0,adPercent:100},{owned:0,adPercent:100,creativeAction:'refresh'}]);
 const m=projectMonthly(input({memory:before}),sequence);assert.deepEqual(m.map(m=>m.creativeWorkHours),[6,0,6]);
 assert.equal(clearCreativeActions(plan).campaigns.display.refreshNow,false);assert.equal(plan.campaigns.display.refreshNow,true);
});
test('no budget allocation means no creative production, and missing first assets cannot be skipped',()=>{
 const empty=project(input({plan:{...input().plan,units:{}}}),1)[0];assert.equal(empty.creativeWorkHours,0);assert.deepEqual(empty.memoryAfter.adCreatives,{});
 const skip={...input().plan,campaigns:{display:{format:'image',refreshMonths:0,skipRefresh:true}}};const first=project(input({plan:skip}),1)[0];assert.equal(first.creativeWorkHours,6);assert.equal(first.channels[0].creativeRefreshed,true);
});
test('invalid creative settings and fabricated ages or quality are rejected',()=>{
 for(const campaigns of [{search:{keyword:'fake'}},{display:{format:'audio'}},{display:{refreshMonths:1.5}},{display:{refreshMonths:-1}},{display:{refreshNow:'yes'}},{display:{refreshNow:true,skipRefresh:true}},{fake:{}}])assert.ok(validateCampaign(input({plan:{...input().plan,campaigns}})));
 const good=project(input(),1)[0].memoryAfter;assert.equal(validateCampaign(input({memory:good})),null);
 for(const patch of [{age:-1},{age:1.5},{quality:9},{lastRefreshMonth:good.month+1},{format:'audio'}]){const memory=structuredClone(good);Object.assign(memory.adCreatives.p.display,patch);assert.match(validateCampaign(input({memory})),/소재 이력/);}
});
