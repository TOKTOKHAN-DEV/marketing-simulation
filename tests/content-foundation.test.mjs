import test from 'node:test';import assert from 'node:assert/strict';
import{CHANNELS,initialMemory,initialPlan,project,validateCampaign,contentFoundation}from'../model.mjs';
import{simulate}from'../simulation.mjs';import{previewRevision}from'../timeline.mjs';
import{establishedMemory}from'./content-fixtures.mjs';
const business={id:'b',name:'콘텐츠 기반 실험',industry:'commerce',market:'B2C',audience:''},product={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:''};
const input=(units,memory=initialMemory(),patch={})=>({business,product,plan:{...initialPlan(),units},memory,stage:1,round:memory.month+1,...patch});
const blogMemory=(n,extra={})=>({...initialMemory(),awareness:80,trust:80,advocacy:60,organicAssets:n,contentPublished:{p:{owned:n}},...extra});

test('owned blog traffic stays exactly zero through 99 posts even with high awareness, trust and accumulated assets',()=>{
 for(const n of [0,1,20,50,99]){
  const m=project(input({owned:1},blogMemory(n)),1)[0];assert.equal(m.channels[0].visits,0);assert.equal(m.assetVisits,0);assert.equal(m.brandVisits,0);assert.equal(m.visits,0);assert.equal(m.revenue,0);assert.equal(m.memoryAfter.contentPublished.p.owned,n+1);
 }
});
test('the hundredth article is recorded now and opens direct and organic blog reach in the following month',()=>{
 const first=project(input({owned:1},blogMemory(99)),1)[0];assert.equal(first.visits,0);assert.equal(first.strategy.content.blogReady,false);assert.equal(first.memoryAfter.contentPublished.p.owned,100);
 const next=project(input({owned:1},JSON.parse(JSON.stringify(first.memoryAfter))),1)[0];assert.equal(next.strategy.content.blogReady,true);assert.ok(next.channels[0].visits>0);assert.ok(next.organicVisits>0);
});
test('a small SNS allocation does not unlock the search assets of 99 immature blog posts',()=>{
 const withBlog=blogMemory(99,{organicAssets:99.04,contentPublished:{p:{owned:99,'owned-sns':1}}}),snsOnly={...withBlog,organicAssets:.04,contentPublished:{p:{'owned-sns':1}}};
 const mixed=project(input({},withBlog),1)[0],social=project(input({},snsOnly),1)[0];assert.equal(mixed.assetVisits,social.assetVisits);assert.equal(mixed.strategy.content.blogReady,false);
});
test('ten articles each month produce zero acquisition in M1 through M10, then start opening in M11',()=>{
 const rows=project(input({owned:10}),12);assert.ok(rows.slice(0,10).every(m=>m.visits===0&&m.revenue===0));assert.equal(rows[9].memoryAfter.contentPublished.p.owned,100);assert.ok(rows[10].visits>0);assert.equal(rows[10].strategy.content.blogCount,100);
});
test('every performance network buys traffic and leads but zero purchases without blog or SNS content',()=>{
 for(const c of CHANNELS.filter(c=>c.group==='performance'&&!['brand-sa','naver-brand'].includes(c.id))){
  const r=input({[c.id]:10});assert.equal(validateCampaign(r),null);
  const m=project(r,1)[0];assert.ok(m.performanceVisits>0);assert.ok(m.leads>0);assert.equal(m.channels[0].estimatedConversionRate,0);assert.equal(m.newOrders,0);assert.equal(m.revenue,0);assert.equal(m.roas,0);assert.equal(m.performanceRoas,0);assert.match(m.narrative,/광고 구매 전환은 0/);
 }
});
test('paid-only advertising cannot create its own conversion foundation over twelve months',()=>{
 const rows=project(input({display:30}),12);assert.ok(rows.every(m=>m.performanceVisits>0&&m.roas===0&&m.newOrders===0&&m.referralVisits===0&&m.repeatOrders===0&&m.organicVisits===0));assert.ok(rows.at(-1).strategy.adMultiplier<rows[0].strategy.adMultiplier);assert.equal(rows.at(-1).strategy.content.blogCount,0);
});
test('advertising conversions unlock gradually after 20 blogs and benefit from SNS, without creating extra clicks',()=>{
 const cold=project(input({display:30},blogMemory(19)),1)[0],early=project(input({display:30},blogMemory(20)),1)[0],mature=project(input({display:30},blogMemory(100)),1)[0],social=project(input({display:30},establishedMemory({awareness:80,trust:80})),1)[0];
 assert.equal(cold.channels[0].estimatedConversionRate,0);assert.ok(early.channels[0].estimatedConversionRate>0);assert.ok(mature.channels[0].estimatedConversionRate>early.channels[0].estimatedConversionRate);assert.ok(social.channels[0].estimatedConversionRate>mature.channels[0].estimatedConversionRate);assert.equal(cold.performanceVisits,social.performanceVisits);
});
test('same-month bulk publication and fabricated brand awareness cannot bypass month-start content gating',()=>{
 const r=input({owned:100,display:10},{...initialMemory(),awareness:98,trust:98},{business:{...business,marketingTeam:{headcount:5,hoursPerPerson:120,performance:'standard',awarenessRetention:94}}});assert.equal(validateCampaign(r),null);
 const first=project(r,1)[0];assert.equal(first.channels.find(c=>c.id==='display').estimatedConversionRate,0);assert.equal(first.newOrders,0);assert.equal(first.memoryAfter.contentPublished.p.owned,100);
 const next=project({...r,plan:{...initialPlan(),units:{display:10}},memory:first.memoryAfter},1)[0];assert.ok(next.channels[0].estimatedConversionRate>0);
});
test('one hundred mature blog posts strengthen referral conversion and referral visits without boosting unrelated influencer cohorts',()=>{
 const common={customers:1000,productCustomers:{p:1000}},low=project(input({micro:1},blogMemory(99,common)),1)[0],high=project(input({micro:1},blogMemory(100,common)),1)[0];
 assert.ok(high.referralVisits>low.referralVisits);assert.ok(high.referralConversionRate>low.referralConversionRate);assert.equal(high.channels[0].estimatedConversionRate,low.channels[0].estimatedConversionRate);assert.equal(low.strategy.content.referralMultiplier,1);assert.ok(high.strategy.content.referralMultiplier>1);
 const nobody=project(input({},blogMemory(100)),1)[0];assert.equal(nobody.referralVisits,0);assert.equal(nobody.referralConversionRate,0);
});
test('content is company-wide across products, and SNS, paid blog posts and ad creative refreshes do not count toward 100 owned blogs',()=>{
 const memory=establishedMemory({contentPublished:{a:{owned:50,'owned-sns':20},b:{owned:50,experience:500,display:100}}}),m=project(input({display:10},memory,{product:{...product,id:'another'}}),1)[0];assert.equal(m.strategy.content.blogCount,100);assert.ok(m.channels[0].estimatedConversionRate>0);
 const noBlog=establishedMemory({contentPublished:{a:{'owned-sns':100,experience:200,display:100}}});assert.equal(contentFoundation(noBlog).blogCount,0);assert.equal(project(input({display:10},noBlog),1)[0].channels[0].estimatedConversionRate,0);
});
test('past content supports ads, but maintenance decay and advertising concentration reduce ROAS after content is abandoned',()=>{
 const rows=project(input({display:30},establishedMemory({awareness:70,trust:70})),12);assert.ok(rows[0].performanceRoas>0);assert.ok(rows.at(-1).performanceRoas<rows[0].performanceRoas);assert.ok(rows.at(-1).strategy.content.maintenance<rows[0].strategy.content.maintenance);assert.equal(rows[0].performanceVisits,rows.at(-1).performanceVisits);
});
test('editing article counts in an earlier month recalculates subsequent conversion gates while preserving the source history',()=>{
 const first=simulate(input({owned:10},blogMemory(10))),second=simulate(input({display:10},first.memoryAfter)),history=[first,second],before=structuredClone(history);assert.ok(second.metrics.channels[0].estimatedConversionRate>0);
 const revision=previewRevision(history,{[first.id]:{...first.plan,units:{owned:0}}});assert.equal(revision.error,null);assert.equal(revision.history[1].metrics.channels[0].estimatedConversionRate,0);assert.deepEqual(history,before);
});
