import test from 'node:test';import assert from 'node:assert/strict';
import{CHANNELS,initialMemory,initialPlan,project,validateCampaign,megaEligibility,isPaidSnsBrandChannel,planSummary}from'../model.mjs';
import{simulate,validateRequest}from'../simulation.mjs';import{previewRevision}from'../timeline.mjs';import{establishedMemory}from'./content-fixtures.mjs';
const business={id:'b',name:'브랜드 상한 실험',industry:'commerce',market:'B2C',audience:'',marketingTeam:{headcount:10,hoursPerPerson:120,performance:'standard',awarenessRetention:94}},product={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:'',canSponsor:true};
const input=(units,memory=establishedMemory({awareness:70,trust:70}),patch={})=>({business,product,plan:{...initialPlan(),budget:100000000,units},memory,stage:1,round:memory.month+1,...patch});

test('every non-breakout medium remains at or below 70 awareness and trust even at high volume',()=>{
 for(const c of CHANNELS.filter(c=>!isPaidSnsBrandChannel(c.id))){const m=project(input({[c.id]:20}),1)[0];assert.ok(m.memoryAfter.awareness<=70,c.id);assert.ok(m.memoryAfter.trust<=70,c.id);}
 const m=project(input({owned:100,'owned-sns':100,cafe:100,experience:100,power:20,display:100}),1)[0];assert.equal(m.memoryAfter.awareness,70);assert.equal(m.memoryAfter.trust,70);
});
test('paid micro, mega short and mega long collaborations can each grow both scores above 90',()=>{
 for(const [id,n]of [['micro',10],['mega',12],['mega-long',2]]){const r=input({[id]:n});assert.equal(validateCampaign(r),null);const rows=project(r,12);assert.ok(rows.some(m=>m.memoryAfter.awareness>=90&&m.memoryAfter.trust>=90),id);assert.ok(rows.every(m=>m.memoryAfter.awareness<=98&&m.memoryAfter.trust<=98));}
});
test('one small paid collaboration does not allow ordinary content to jump from 70 to 98',()=>{
 const m=project(input({owned:100,'owned-sns':100,power:20,micro:1}),1)[0],micro=m.channels.find(c=>c.id==='micro');assert.ok(m.memoryAfter.awareness>70);assert.ok(m.memoryAfter.trust>70);assert.ok(m.memoryAfter.awareness<=70+micro.awarenessGain+.01);assert.ok(m.memoryAfter.trust<=70+micro.trustGain+.01);assert.ok(m.memoryAfter.awareness<80);assert.ok(m.memoryAfter.trust<80);
});
test('owned SNS, influencer trials, seeding, group-buying and experts cannot substitute for micro or mega brand lift',()=>{
 for(const id of ['owned-sns','owned-shortform','insta-review','video-review','influencer-seeding','group-buy','expert'])assert.equal(isPaidSnsBrandChannel(id),false);
 for(const id of ['micro','mega','mega-long'])assert.equal(isPaidSnsBrandChannel(id),true);
});
test('earned paid SNS recognition decays rather than being reset, and ordinary content cannot maintain its excess above 70',()=>{
 const memory=establishedMemory({awareness:90,trust:90,contentPublished:{p:{owned:100,'owned-sns':20,micro:1}}});
 const rows=project(input({owned:20,'owned-sns':4,power:10},memory),8),first=rows[0];assert.equal(first.memoryAfter.awareness,77.4);assert.equal(first.memoryAfter.trust,88.2);assert.ok(first.channels.every(c=>c.awarenessGain===0&&c.trustGain===0));assert.ok(rows.at(-1).memoryAfter.awareness<=70);assert.ok(rows.at(-1).memoryAfter.trust<first.memoryAfter.trust);assert.ok(first.memoryAfter.ownedAwareness<=first.memoryAfter.awareness);
});
test('legacy content-only scores above 70 are bounded on a new run without changing the original memory',()=>{
 const memory=establishedMemory({awareness:98,trust:98,ownedAwareness:98}),before=structuredClone(memory),m=project(input({owned:20},memory),1)[0];assert.equal(m.memoryAfter.awareness,70);assert.equal(m.memoryAfter.trust,70);assert.ok(m.memoryAfter.ownedAwareness<=70);assert.deepEqual(memory,before);
});
test('mega collaboration requires both month-start scores at least 50 regardless of available money',()=>{
 for(const id of ['mega','mega-long'])for(const [awareness,trust]of [[0,100],[100,0],[49.99,50],[50,49.99]]){const memory={...initialMemory(),awareness,trust};assert.equal(megaEligibility(memory).eligible,false);assert.match(validateCampaign(input({[id]:1},memory)),/월초 인지도 50점·신뢰 50점/);const r=input({[id]:1},memory);assert.equal(validateRequest({...r,workshopId:'test'},{openStage:4,workshopId:'test'}).status,400);}
 for(const id of ['mega','mega-long'])assert.equal(validateCampaign(input({[id]:1},{...initialMemory(),awareness:50,trust:50})),null);
});
test('ineligible mega previews create no placements, spend, visits, brand gain or publication history',()=>{
 for(const id of ['mega','mega-long']){const r=input({[id]:2},initialMemory()),summary=planSummary(r),m=project(r,1)[0];assert.equal(summary.channels[0].collaborationBlocked,true);assert.equal(m.spend,0);assert.equal(m.visits,0);assert.equal(m.channels[0].placements,0);assert.equal(m.channels[0].awarenessGain,0);assert.equal(m.channels[0].trustGain,0);assert.equal(m.memoryAfter.contentPublished.p[id],undefined);assert.match(m.narrative,/메가 협업 불가/);}
});
test('same-month ordinary content cannot unlock mega collaboration until the next month',()=>{
 const memory={...initialMemory(),awareness:10,trust:10},first=project(input({owned:100,power:20,mega:1},memory),1)[0];assert.ok(first.memoryAfter.awareness>=50);assert.ok(first.memoryAfter.trust>=50);assert.equal(first.channels.find(c=>c.id==='mega').visits,0);assert.equal(first.memoryAfter.contentPublished.p.mega,undefined);assert.equal(validateCampaign(input({mega:1},first.memoryAfter)),null);
});
test('reducing earlier brand building blocks subsequent mega replay without rewriting the recorded history',()=>{
 const memory={...initialMemory(),awareness:10,trust:10},first=simulate(input({owned:100,power:20},memory)),second=simulate(input({mega:1},first.memoryAfter));assert.equal(validateCampaign(input({mega:1},first.memoryAfter)),null);
 const history=[first,second],before=structuredClone(history),replay=previewRevision(history,{[first.id]:{...first.plan,units:{}}});assert.equal(replay.error.month,2);assert.match(replay.error.message,/메가 인플루언서/);assert.deepEqual(history,before);
});
