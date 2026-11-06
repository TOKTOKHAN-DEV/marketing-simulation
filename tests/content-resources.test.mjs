import {establishedMemory} from './content-fixtures.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {initialMemory,initialPlan,project,validateCampaign,planSummary,projectMonthly,outlookPlans,calculateSales,CHANNELS,teamFor} from '../model.mjs';
const business={id:'b',name:'브랜드',industry:'commerce',market:'B2C',audience:'소비자'};
const product={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:'',canSponsor:true,sponsorshipCost:9000};
const warm=establishedMemory({awareness:30,trust:40,advocacy:28});
const input=(patch={})=>({business,product,plan:{...initialPlan(),units:{owned:10}},memory:initialMemory(),stage:3,...patch});
test('owned-only month runs with no incremental cash and a finite workload, never infinite ROAS',()=>{
 const r=input({plan:{...initialPlan(),budget:0,units:{owned:10}}});assert.equal(validateCampaign(r),null);
 const m=project(r,1)[0];assert.equal(m.spend,0);assert.equal(m.workHours,40);assert.equal(m.ownedPublished,10);assert.equal(m.roas,null);assert.equal(m.marketingVisits,0);assert.equal(m.visits,0);
});
test('each monthly plan executes its own quantity and preserves search assets between months',()=>{
 const plans=[{...initialPlan(),units:{owned:10}},{...initialPlan(),units:{owned:0}},{...initialPlan(),units:{owned:4}}];
 const months=projectMonthly(input(),plans);
 assert.deepEqual(months.map(m=>m.ownedPublished),[10,0,4]);assert.deepEqual(months.map(m=>m.workHours),[40,0,16]);
 assert.equal(months[1].organicVisits,0);assert.ok(months[1].memoryAfter.organicAssets<months[0].memoryAfter.organicAssets);
 assert.ok(months[2].memoryAfter.organicAssets>months[1].memoryAfter.organicAssets);
});
test('legacy publication cadence no longer suppresses the new monthly quantity',()=>{
 const plan={...initialPlan(),units:{power:1,owned:10},cadence:{owned:'once',power:'once'}};
 const first=project(input({plan}),1)[0];const saved=JSON.parse(JSON.stringify(first.memoryAfter));
 const next=project(input({memory:saved,plan:{...plan,units:{power:1,owned:12}}}),1)[0];
 assert.equal(next.ownedPublished,12);assert.equal(next.channels.find(c=>c.id==='power').spend,800000);
 assert.equal(next.memoryAfter.contentPublished.p.owned,22);assert.equal(validateCampaign(input({memory:saved,plan})),null);
});
test('owned and paid awareness have different monthly retention and a configurable monthly weight',()=>{
 const memory={...initialMemory(),awareness:50,ownedAwareness:30};const plan={...initialPlan(),budget:0,units:{}};
 const normal=project(input({memory,plan}),1)[0];assert.equal(normal.memoryAfter.awareness,45.4);assert.equal(normal.memoryAfter.ownedAwareness,28.2);assert.equal(normal.awarenessLoss,4.6);
 const stronger=project(input({memory,plan,business:{...business,marketingTeam:{...teamFor(business),awarenessRetention:99}}}),1)[0];
 assert.ok(stronger.memoryAfter.awareness>normal.memoryAfter.awareness);
});
test('marketer capacity gates publishing, and proficiency changes production time and quality',()=>{
 const team={headcount:1,hoursPerPerson:20,performance:'standard',awarenessRetention:94};
 assert.match(validateCampaign(input({business:{...business,marketingTeam:team}})),/가용 시간/);
 const starter=project(input({business:{...business,marketingTeam:{...team,hoursPerPerson:120,performance:'starter'}}}),1)[0];
 const expert=project(input({business:{...business,marketingTeam:{...team,hoursPerPerson:120,performance:'expert'}}}),1)[0];
 assert.ok(expert.workHours<starter.workHours);assert.equal(expert.marketingVisits,0);assert.equal(starter.marketingVisits,0);assert.ok(expert.memoryAfter.organicAssets>starter.memoryAfter.organicAssets);assert.equal(expert.spend,0);
 assert.match(validateCampaign(input({business:{...business,marketingTeam:{...team,headcount:0}}})),/가용 时间|가용 시간/);
});
test('ten gift seeding contacts are less than one expected publication, using internal outreach time and accepted gifts only',()=>{
 const plan={...initialPlan(),units:{'influencer-seeding':10},seeding:{mode:'gift',fee:300000,commission:10}};
 const m=project(input({plan,memory:warm}),1)[0];assert.equal(m.seedingAttempts,10);assert.equal(m.expectedPlacements,.1);assert.equal(m.workHours,2.5);assert.equal(m.spend,900);
 assert.equal(validateCampaign(input({plan})),null);assert.match(validateCampaign(input({plan,product:{...product,canSponsor:false}})),/協찬|협찬/);
});
test('unavailable sponsorship can be replaced with a paid or referral offer',()=>{
 const p={...product,canSponsor:false};
 for(const mode of ['paid','referral']){const plan={...initialPlan(),units:{'influencer-seeding':10},seeding:{mode,fee:300000,commission:10}};assert.equal(validateCampaign(input({plan,product:p})),null);const m=project(input({plan,product:p,memory:warm}),1)[0];assert.equal(m.expectedPlacements,mode==='paid'?1:.1);if(mode==='paid')assert.equal(m.spend,300000);}
});
test('a hundred eligible contacts yield one gift, ten paid or one referral placement at the new rates',()=>{
 for(const [mode,placements] of [['gift',1],['paid',10],['referral',1]]){
  const plan={...initialPlan(),units:{'influencer-seeding':100},seeding:{mode,fee:300000,commission:10}},m=project(input({plan,memory:warm}),1)[0];
  assert.equal(validateCampaign(input({plan,memory:warm})),null);assert.equal(m.expectedPlacements,placements);assert.equal(m.seedingAttempts,100);assert.equal(m.workHours,25);
  if(mode==='gift')assert.equal(m.spend,9000);if(mode==='paid')assert.equal(m.spend,3000000);
 }
});
test('referral commissions apply to new converted sales only and count against budget',()=>{
 const plan={...initialPlan(),budget:100000000,units:{'influencer-seeding':400},seeding:{mode:'referral',fee:300000,commission:20}};
 const m=project(input({plan,memory:warm}),1)[0];assert.ok(m.newOrders>0);assert.ok(Math.abs(m.referralFee-m.attributedRevenue*.2)<=1);assert.ok(m.referralFee<m.newOrders*product.price*.2);assert.equal(m.spend,m.referralFee);
 assert.match(validateCampaign(input({memory:warm,plan:{...plan,budget:0}})),/예산/);
 const subscription={...product,purchaseType:'subscription',churnRate:0};
 const renewed=calculateSales(subscription,{...initialMemory(),productCustomers:{p:100}},2,1,0,.1);assert.equal(renewed.referralFee,6000);assert.equal(renewed.repeatOrders,100);
});
test('service referral commissions wait for completion and survive passive delivery under another product',()=>{
 const p={...product,purchaseType:'service',hoursPerOrder:320,monthlyHours:160};
 const first=calculateSales(p,initialMemory(),1,1,0,.1);assert.equal(first.referralFee,0);assert.equal(first.queueAfter.commissionRate,.1);
 const memory={...initialMemory(),serviceQueues:{p:first.queueAfter}};
 const r=input({product:{...product,id:'second'},products:[p,{...product,id:'second'}],memory,plan:{...initialPlan(),units:{}}});
 const next=project(r,1)[0];assert.equal(next.backgroundRevenue,30000);assert.equal(next.referralFee,3000);assert.equal(next.spend,3000);
});
test('mega short and long formats enforce the instructor price ranges on the server',()=>{
 for(const [id,low,high]of [['mega',5000000,8000000],['mega-long',30000000,50000000]]){
  assert.equal(CHANNELS.find(c=>c.id===id).minCost,low);
  for(const rate of [low,high]){const plan={...initialPlan(),budget:100000000,units:{[id]:1},rates:{[id]:rate}};assert.equal(validateCampaign(input({plan,memory:establishedMemory({awareness:50,trust:50})})),null);assert.equal(project(input({plan,memory:establishedMemory({awareness:50,trust:50})}),1)[0].spend,rate);}
  for(const rate of [low-1,high+1])assert.match(validateCampaign(input({plan:{...initialPlan(),units:{[id]:1},rates:{[id]:rate}}})),/단가 범위/);
 }
});
test('malformed new resource settings cannot bypass validation',()=>{
 for(const patch of [{cadence:{owned:'daily'}},{cadence:{search:'once'}},{rates:{owned:0}},{seeding:{mode:'bogus',fee:1,commission:1}},{seeding:{mode:'paid',fee:-1,commission:1}},{seeding:{mode:'referral',fee:1,commission:51}}])assert.ok(validateCampaign(input({plan:{...initialPlan(),units:{owned:1},...patch}})));
 for(const patch of [{contentPublished:{p:{fake:2}}},{contentPublished:{p:{owned:1.5}}},{ownedAwareness:10}])assert.ok(validateCampaign(input({memory:{...initialMemory(),...patch}})));
});

test('performance ads generate traffic and small DA awareness without creating search assets, trust or advocacy',()=>{
 const m=project(input({plan:{...initialPlan(),units:{search:10,social:10}}}),1)[0];
 assert.ok(m.performanceVisits>0);assert.equal(m.memoryAfter.organicAssets,0);
 assert.ok(m.memoryAfter.awareness>initialMemory().awareness);assert.ok(m.memoryAfter.trust<initialMemory().trust);
 assert.equal(m.channels.find(c=>c.id==='search').awarenessGain,0);for(const c of m.channels)assert.equal(c.trustGain,0);assert.ok(m.memoryAfter.advocacy<initialMemory().advocacy);
 const stopped=project(input({memory:m.memoryAfter,plan:{...initialPlan(),units:{}}}),1)[0];
 assert.equal(stopped.performanceVisits,0);assert.equal(stopped.organicVisits,0);
});
test('owned groundwork protects more revenue after ads stop than ads alone',()=>{
 const owned={...initialPlan(),units:{owned:10}},ads={...initialPlan(),units:{search:20}},stop={...initialPlan(),units:{}};
 const prepared=projectMonthly(input({memory:establishedMemory({awareness:20,trust:30})}),[owned,owned,owned,ads,stop,stop]);
 const unprepared=projectMonthly(input(),[ads,ads,ads,ads,stop,stop]);
 assert.equal(prepared[4].performanceVisits,0);assert.equal(unprepared[4].performanceVisits,0);
 assert.ok(prepared[4].organicVisits>unprepared[4].organicVisits);assert.ok(prepared[4].revenue>unprepared[4].revenue);
 assert.ok(prepared[5].revenue>=unprepared[5].revenue);
 assert.ok(prepared[5].organicVisits>0);assert.equal(unprepared[5].organicVisits,0);
});
test('outlook scales only monthly ads while explicitly setting owned quantity',()=>{
 const base={...initialPlan(),units:{search:10,social:4,power:1,owned:10},cadence:{owned:'once'}};
 const before=structuredClone(base);const plans=outlookPlans(base,[{owned:4,adPercent:100},{owned:6,adPercent:50},{owned:0,adPercent:0}]);
 assert.deepEqual(plans.map(p=>p.units.search),[10,0,0]);assert.deepEqual(plans.map(p=>p.units.social),[4,0,0]);assert.deepEqual(plans.map(p=>p.units.owned),[4,6,0]);
 assert.deepEqual(plans.map(p=>p.units.power),[1,1,1]);assert.deepEqual(base,before);
 const r=input(),snapshot=structuredClone(r);const forecast=projectMonthly(r,plans);assert.deepEqual(r,snapshot);assert.deepEqual(forecast.map(m=>m.month),[1,2,3]);assert.equal(forecast[2].performanceVisits,0);
});
