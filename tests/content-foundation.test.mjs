import test from 'node:test';import assert from 'node:assert/strict';
import{CHANNELS,initialMemory,initialPlan,project,validateCampaign,contentFoundation}from'../model.mjs';
import{simulate}from'../simulation.mjs';import{previewRevision}from'../timeline.mjs';
import{establishedMemory}from'./content-fixtures.mjs';
const business={id:'b',name:'콘텐츠 기반 실험',industry:'commerce',market:'B2C',audience:''},product={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:''};
const input=(units,memory=initialMemory(),patch={})=>({business,product,plan:{...initialPlan(),units},memory,stage:1,round:memory.month+1,...patch});
const blogMemory=(n,extra={})=>({...initialMemory(),awareness:80,trust:80,advocacy:60,organicAssets:n,contentPublished:{p:{owned:n}},...extra});

test('owned blog traffic stays exactly zero through 199 posts even with high awareness, trust and accumulated assets',()=>{
 for(const n of [0,1,20,50,99,100,199]){
  const m=project(input({owned:1},blogMemory(n)),1)[0];assert.equal(m.channels[0].visits,0);assert.equal(m.assetVisits,0);assert.equal(m.brandVisits,0);assert.equal(m.visits,0);assert.equal(m.revenue,0);assert.equal(m.memoryAfter.contentPublished.p.owned,n+1);
 }
});
test('the two-hundredth article is recorded now and opens direct and organic blog reach in the following month',()=>{
 const first=project(input({owned:1},blogMemory(199)),1)[0];assert.equal(first.visits,0);assert.equal(first.strategy.content.blogReady,false);assert.equal(first.memoryAfter.contentPublished.p.owned,200);
 const next=project(input({owned:1},JSON.parse(JSON.stringify(first.memoryAfter))),1)[0];assert.equal(next.strategy.content.blogReady,true);assert.ok(next.channels[0].visits>0);assert.ok(next.organicVisits>0);
});
test('a small SNS allocation does not unlock the search assets of 199 immature blog posts',()=>{
 const withBlog=blogMemory(199,{organicAssets:199.04,contentPublished:{p:{owned:199,'owned-sns':1}}}),snsOnly={...withBlog,organicAssets:.04,contentPublished:{p:{'owned-sns':1}}};
 const mixed=project(input({},withBlog),1)[0],social=project(input({},snsOnly),1)[0];assert.equal(mixed.assetVisits,social.assetVisits);assert.equal(mixed.strategy.content.blogReady,false);
});
test('twenty articles each month produce zero acquisition in M1 through M10, then start opening in M11',()=>{
 const rows=project(input({owned:20}),12);assert.ok(rows.slice(0,10).every(m=>m.visits===0&&m.revenue===0));assert.equal(rows[9].memoryAfter.contentPublished.p.owned,200);assert.ok(rows[10].visits>0);assert.equal(rows[10].strategy.content.blogCount,200);
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
 const r=input({owned:200,display:10},{...initialMemory(),awareness:98,trust:98},{business:{...business,marketingTeam:{headcount:10,hoursPerPerson:120,performance:'standard',awarenessRetention:94}}});assert.equal(validateCampaign(r),null);
 const first=project(r,1)[0];assert.equal(first.channels.find(c=>c.id==='display').estimatedConversionRate,0);assert.equal(first.newOrders,0);assert.equal(first.memoryAfter.contentPublished.p.owned,200);
 const next=project({...r,plan:{...initialPlan(),units:{display:10}},memory:first.memoryAfter},1)[0];assert.ok(next.channels[0].estimatedConversionRate>0);
});
test('two hundred mature blog posts strengthen referral conversion and referral visits without boosting unrelated influencer cohorts',()=>{
 const common={customers:1000,productCustomers:{p:1000}},low=project(input({micro:1},blogMemory(199,common)),1)[0],high=project(input({micro:1},blogMemory(200,common)),1)[0];
 assert.ok(high.referralVisits>low.referralVisits);assert.ok(high.referralConversionRate>low.referralConversionRate);assert.equal(high.channels[0].estimatedConversionRate,low.channels[0].estimatedConversionRate);assert.equal(low.strategy.content.referralMultiplier,1);assert.ok(high.strategy.content.referralMultiplier>1);
 const nobody=project(input({},blogMemory(200)),1)[0];assert.equal(nobody.referralVisits,0);assert.equal(nobody.referralConversionRate,0);
});
test('all five blog types count company-wide, while SNS, cafe and ad creatives do not',()=>{
 const memory=establishedMemory({contentPublished:{a:{owned:50,'owned-sns':20,experience:30,press:20},b:{power:50,seeding:50,display:100,cafe:100}}}),m=project(input({display:10},memory,{product:{...product,id:'another'}}),1)[0];
 assert.equal(m.strategy.content.blogCount,200);assert.equal(m.strategy.content.ownedBlogCount,50);assert.equal(m.strategy.content.blogReady,true);assert.ok(m.channels[0].estimatedConversionRate>0);
 const noBlog=establishedMemory({contentPublished:{a:{'owned-sns':100,cafe:200,display:100}}});assert.equal(contentFoundation(noBlog).blogCount,0);assert.equal(project(input({display:10},noBlog),1)[0].channels[0].estimatedConversionRate,0);
});
test('past content supports ads, but maintenance decay and advertising concentration reduce ROAS after content is abandoned',()=>{
 const rows=project(input({display:30},establishedMemory({awareness:70,trust:70})),12);assert.ok(rows[0].performanceRoas>0);assert.ok(rows.at(-1).performanceRoas<rows[0].performanceRoas);assert.ok(rows.at(-1).strategy.content.maintenance<rows[0].strategy.content.maintenance);assert.equal(rows[0].performanceVisits,rows.at(-1).performanceVisits);
});
test('editing article counts in an earlier month recalculates subsequent conversion gates while preserving the source history',()=>{
 const first=simulate(input({owned:10},blogMemory(10))),second=simulate(input({display:10},first.memoryAfter)),history=[first,second],before=structuredClone(history);assert.ok(second.metrics.channels[0].estimatedConversionRate>0);
 const revision=previewRevision(history,{[first.id]:{...first.plan,units:{owned:0}}});assert.equal(revision.error,null);assert.equal(revision.history[1].metrics.channels[0].estimatedConversionRate,0);assert.deepEqual(history,before);
});

test('paid blogs build search assets but paid exposure remains separate from organic until 200 posts',()=>{
 for(const id of ['experience','press','power','seeding']){
  const r=input({[id]:1},blogMemory(198,{organicAssets:0,contentPublished:{p:{[id]:198}}})),first=project(r,1)[0];
  assert.ok(first.marketingVisits>0,id);assert.equal(first.organicVisits,0);assert.equal(first.blogOrganicVisits,0);assert.equal(first.memoryAfter.blogAudience,0);assert.ok(first.memoryAfter.organicAssets>0);
  const second=project({...r,memory:first.memoryAfter},1)[0];assert.equal(second.organicVisits,0);assert.equal(second.memoryAfter.contentPublished.p[id],200);
  const third=project({...r,plan:{...initialPlan(),units:{}},memory:second.memoryAfter},1)[0];assert.equal(third.marketingVisits,0);assert.ok(third.organicVisits>0,id);assert.ok(third.blogOrganicVisits>0,id);assert.ok(third.memoryAfter.blogAudience>0,id);
 }
});
test('organic blog visitors build a slowly decaying return audience after marketing stops, while ads stop instantly',()=>{
 const first=simulate(input({display:30},blogMemory(200))),memory=JSON.parse(JSON.stringify(first.memoryAfter)),rows=project(input({},memory),6);
 assert.ok(first.metrics.performanceVisits>0);assert.ok(memory.blogAudience>0);assert.ok(rows.every(m=>m.performanceVisits===0&&m.marketingVisits===0&&m.spend===0&&m.blogReturningVisits>0&&m.organicVisits>0));
 assert.equal(rows[0].blogReturningVisits,Math.floor(memory.blogAudience*.9));assert.ok(rows.at(-1).memoryAfter.organicAssets<rows[0].memoryAfter.organicAssets);
 // Isolate an existing audience with no fresh search or brand discovery.
 const stale=blogMemory(200,{awareness:0,trust:0,organicAssets:0,blogAudience:1000}),decay=project(input({},stale),4);
 assert.deepEqual(decay.map(m=>m.blogReturningVisits),[900,810,729,656]);assert.ok(decay.every(m=>m.blogNewVisits===0&&m.performanceVisits===0));
});
test('pure advertising cannot seed a retained organic-blog audience or create traffic in the off month',()=>{
 const first=simulate(input({display:30}));assert.ok(first.metrics.performanceVisits>0);assert.equal(first.memoryAfter.blogAudience,0);
 const off=project(input({},first.memoryAfter),1)[0];assert.equal(off.performanceVisits,0);assert.equal(off.blogReturningVisits,0);assert.equal(off.visits,0);
});
test('blog audience is bounded and old memory without it still runs; invalid audience values are rejected',()=>{
 const legacy=blogMemory(200);delete legacy.blogAudience;assert.equal(validateCampaign(input({},legacy)),null);assert.ok(project(input({},legacy),1)[0].memoryAfter.blogAudience>0);
 for(const blogAudience of [-1,Infinity,1e9+1,'100'])assert.match(validateCampaign(input({},{...legacy,blogAudience})),/재방문 기반/);
 assert.equal(project(input({},blogMemory(199,{blogAudience:1000})),1)[0].blogReturningVisits,0);
});

test('revising a month below 200 also removes later blog acquisition and its retained audience',()=>{
 const first=simulate(input({owned:1},blogMemory(199))),second=simulate(input({},first.memoryAfter)),third=simulate(input({},second.memoryAfter)),history=[first,second,third],before=structuredClone(history);
 assert.ok(second.metrics.blogNewVisits>0);assert.ok(third.metrics.blogReturningVisits>0);
 const revised=previewRevision(history,{[first.id]:{...first.plan,units:{}}});assert.equal(revised.error,null);assert.ok(revised.history.slice(1).every(r=>r.metrics.blogOrganicVisits===0&&r.memoryAfter.blogAudience===0));assert.deepEqual(history,before);
});
