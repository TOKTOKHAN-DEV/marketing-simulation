import test from 'node:test';
import assert from 'node:assert/strict';
import {CHANNELS,MEDIA_SOURCES,CREATIVE_IDS,initialMemory,initialPlan,project,projectMonthly,validateCampaign,calculateSales,campaignFor,clearCreativeActions} from '../model.mjs';
import {scalePaidPlan} from '../funding.mjs';
import {simulate} from '../simulation.mjs';
import {previewRevision} from '../timeline.mjs';
const business={id:'b',name:'국내 미디어 실습',industry:'commerce',market:'B2C',audience:''};
const product={id:'p',businessId:'b',name:'생활 상품',price:30000,purchaseType:'oneoff',value:'',canSponsor:true,sponsorshipCost:9000};
const input=(units,patch={})=>({business,product,products:[product],plan:{...initialPlan(),units},memory:initialMemory(),stage:1,round:1,...patch});
const ads=['tiktok','linkedin','daangn','remember','naver-gfa','kakao'];

test('new domestic media have unique ids and official product sources without claiming observed CPCs',()=>{
 assert.equal(new Set(CHANNELS.map(c=>c.id)).size,CHANNELS.length);
 for(const id of [...ads,'insta-review','video-review','remember-content']){assert.ok(CHANNELS.some(c=>c.id===id));assert.ok(MEDIA_SOURCES[id].url.startsWith('https://'));assert.match(MEDIA_SOURCES[id].basis,/추정|가정/);}
});
test('all new performance media buy clicks, refresh creatives and preserve fatigue and settings through execution',()=>{
 for(const id of ads){
  const plan={...initialPlan(),units:{[id]:10},campaigns:{[id]:{...campaignFor(initialPlan(),id),refreshMonths:0}}},r=input(plan.units,{plan}),before=structuredClone(r);
  assert.equal(validateCampaign(r),null,id);const months=project(r,3),cs=months.map(m=>m.channels[0]);
  assert.deepEqual(r,before);assert.equal(months[0].spend,1000000);assert.ok(months[0].performanceVisits>0);assert.deepEqual(cs.map(c=>c.creativeAge),[0,1,2]);assert.ok(cs[2].conversionMultiplier<cs[0].conversionMultiplier);
  assert.equal(months[0].creativeWorkHours,id==='tiktok'?16:6);assert.equal(months[2].creativeWorkHours,0);assert.ok(months[2].memoryAfter.adCreatives.p[id]);
  assert.equal(validateCampaign({...r,memory:months[0].memoryAfter,round:2}),null,id);
  const renewed=project({...r,memory:months[2].memoryAfter,plan:{...plan,campaigns:{[id]:{...plan.campaigns[id],refreshNow:true}}}},1)[0];assert.equal(renewed.channels[0].creativeAge,0);
 }
});
test('platform format constraints reject unsupported creatives on the server',()=>{
 for(const [id,format] of [['tiktok','image'],['remember','video'],['daangn','video']])assert.match(validateCampaign(input({[id]:10},{plan:{...initialPlan(),units:{[id]:10},campaigns:{[id]:{format}}}})),/소재/);
 assert.deepEqual(CREATIVE_IDS.filter(id=>ads.includes(id)),ads);
});
test('B2B media and local media have product and industry fit rather than universally better conversion',()=>{
 for(const id of ['linkedin','remember']){
  const consumer=project(input({[id]:10}),1)[0],b2b=project(input({[id]:10},{business:{...business,market:'B2B'}}),1)[0];
  assert.equal(consumer.spend,b2b.spend);assert.equal(consumer.performanceVisits,b2b.performanceVisits);assert.ok(b2b.closeRate>consumer.closeRate);
 }
 const local=project(input({daangn:10},{business:{...business,industry:'food'}}),1)[0],industrial=project(input({daangn:10},{business:{...business,industry:'manufacturing',market:'B2B'}}),1)[0];assert.ok(local.closeRate>industrial.closeRate);
});
test('owned SNS, shortform and CRM consume real marketer time and build assets without cash',()=>{
 const m=project(input({'owned-sns':2,'owned-shortform':2,newsletter:2}),1)[0];assert.equal(m.spend,0);assert.equal(m.workHours,28);assert.equal(m.ownedPublished,6);assert.ok(m.memoryAfter.organicAssets>0);
 assert.equal(m.channels.find(c=>c.id==='newsletter').visits,0);
 const warm=project(input({newsletter:2},{memory:{...initialMemory(),customers:1000,productCustomers:{p:1000}}}),1)[0];assert.ok(warm.marketingVisits>0);
 assert.match(validateCampaign(input({'owned-shortform':20})),/가용 시간/);
});
test('booked influencer trials charge publication and product costs separately from cold outreach',()=>{
 const m=project(input({'insta-review':2,'video-review':1}),1)[0];assert.equal(m.spend,527000);assert.equal(m.workHours,2);assert.ok(m.visits>0);assert.ok(m.memoryAfter.trust>initialMemory().trust);
 assert.equal(validateCampaign(input({'insta-review':1})),null);
 for(const id of ['insta-review','video-review'])assert.match(validateCampaign(input({[id]:1},{product:{...product,canSponsor:false},products:undefined})),/협찬 가능/);
 const scale=scalePaidPlan({...initialPlan(),units:{'group-buy':1,'insta-review':2,'influencer-seeding':10}},CHANNELS,5000000,10000000);assert.deepEqual(scale.units,{'group-buy':1,'insta-review':4,'influencer-seeding':10});
});
test('group buying pays exactly 25 percent of its new revenue and counts fees against budget and ROAS',()=>{
 const r=input({'group-buy':1}),m=project(r,1)[0];assert.equal(validateCampaign(r),null);assert.ok(m.revenue>0);assert.equal(m.groupBuyRevenue,m.revenue);assert.equal(m.groupBuyFee,m.revenue*.25);assert.equal(m.spend,m.groupBuyFee);assert.equal(m.channels[0].spend,m.groupBuyFee);assert.equal(m.roas,400);assert.equal(m.workHours,6);
 assert.match(validateCampaign({...r,plan:{...r.plan,budget:m.groupBuyFee-1}}),/예산/);
 const mixed=project(input({'group-buy':1,display:10}),1)[0];assert.ok(mixed.groupBuyRevenue<mixed.revenue);assert.ok(Math.abs(mixed.groupBuyFee-mixed.groupBuyRevenue*.25)<=1);assert.equal(mixed.spend,1000000+mixed.groupBuyFee);
 assert.equal(project(input({}),1)[0].groupBuyFee,0);
});
test('subscription renewals and normal repurchases are excluded from group-buy fees',()=>{
 const p={...product,purchaseType:'subscription',churnRate:0},memory={...initialMemory(),customers:1000,productCustomers:{p:1000}};
 const m=project(input({'group-buy':1},{product:p,products:[p],memory}),1)[0];assert.equal(m.repeatOrders,1000);assert.ok(m.groupBuyFee>0);assert.equal(m.groupBuyRevenue,m.newOrders*p.price);assert.equal(m.groupBuyFee,m.newOrders*p.price*.25);
 const stopped=project(input({},{product:p,products:[p],memory:m.memoryAfter}),1)[0];assert.equal(stopped.groupBuyFee,0);assert.ok(stopped.revenue>0);
});
test('group-buy fees follow delivered service revenue through queues and passive delivery under another product',()=>{
 const p={...product,purchaseType:'service',hoursPerOrder:320,monthlyHours:160};
 const first=calculateSales(p,initialMemory(),1,1,0,0,.25);assert.equal(first.groupBuyFee,0);assert.equal(first.queueAfter.groupBuyCommissionRate,.25);
 const memory={...initialMemory(),month:1,serviceQueues:{p:first.queueAfter}},other={...product,id:'other'};
 const next=project(input({},{product:other,products:[p,other],memory}),1)[0];assert.equal(next.backgroundRevenue,30000);assert.equal(next.groupBuyRevenue,30000);assert.equal(next.groupBuyFee,7500);assert.equal(next.spend,7500);
 assert.equal(validateCampaign(input({},{product:other,products:[p,other],memory})),null);
 const bad=structuredClone(memory);bad.serviceQueues.p.groupBuyCommissionRate=.26;assert.match(validateCampaign(input({},{memory:bad})),/이월/);
});
test('past month edits replay new ads and group-buy costs without mutating recorded plans',()=>{
 const first=simulate(input({'group-buy':1,tiktok:10})),second=simulate(input({'insta-review':2,remember:10},{memory:first.memoryAfter,round:2}));
 const history=[first,second],before=structuredClone(history),draft={...first.plan,units:{...first.plan.units,'group-buy':2}};
 const replay=previewRevision(history,{[first.id]:draft});assert.equal(replay.error,null);assert.deepEqual(history,before);assert.deepEqual(replay.history[1].plan,second.plan);assert.ok(replay.history[0].metrics.groupBuyFee>0);assert.equal(clearCreativeActions(second.plan).units.remember,10);
});
