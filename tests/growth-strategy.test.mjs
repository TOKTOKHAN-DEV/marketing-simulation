import {establishedMemory} from './content-fixtures.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {initialMemory,initialPlan,project,validateCampaign,recommendMix,planSummary,seedingEligibility} from '../model.mjs';
import {simulate} from '../simulation.mjs';
import {revisionPayload,replayRecords} from '../timeline.mjs';
const business={id:'b',name:'전략 실험',industry:'commerce',market:'B2C',audience:''};
const product={id:'p',businessId:'b',name:'기준 상품',price:30000,purchaseType:'oneoff',value:'',involvement:'low',repurchasePossible:true,canSponsor:true};
const input=(units,patch={})=>({business,product,plan:{...initialPlan(),units},memory:initialMemory(),stage:1,...patch});
function run(units,months=12,patch={}){let memory=patch.memory??initialMemory();return Array.from({length:months},()=>{const r=project(input(units,{...patch,memory}),1)[0];memory=r.memoryAfter;return r;});}

test('cold seeding has zero placements, spend, visits and brand effects in every offer mode, despite outreach time',()=>{
 for(const mode of ['gift','paid','referral']){
  const r=input({'influencer-seeding':200},{plan:{...initialPlan(),units:{'influencer-seeding':200},seeding:{mode,fee:300000,commission:20}}});
  const m=project(r,1)[0];assert.equal(validateCampaign(r),null);assert.equal(m.workHours,50);assert.equal(m.expectedPlacements,0);assert.equal(m.spend,0);assert.equal(m.visits,0);assert.equal(m.newOrders,0);assert.equal(m.channels[0].awarenessGain,0);assert.equal(m.channels[0].trustGain,0);assert.match(m.narrative,/시딩 섭외 불가/);
 }
});
test('both awareness and trust are required at the start of the month; high consideration has a stricter gate',()=>{
 for(const memory of [{...initialMemory(),awareness:80,trust:24.99},{...initialMemory(),awareness:19.99,trust:80}])assert.equal(seedingEligibility(product,memory).eligible,false);
 const memory={...initialMemory(),awareness:20,trust:25};assert.equal(seedingEligibility(product,memory).eligible,true);
 assert.equal(seedingEligibility({...product,involvement:'high'},memory).eligible,false);
 assert.equal(seedingEligibility({...product,involvement:'high'},{...memory,awareness:25,trust:35}).eligible,true);
 const first=project(input({experience:10,power:3,'influencer-seeding':10}),1)[0];assert.equal(first.expectedPlacements,0);assert.ok(first.memoryAfter.awareness>=20);assert.ok(first.memoryAfter.trust>=25);
 const second=project(input({'influencer-seeding':10},{memory:first.memoryAfter}),1)[0];assert.equal(second.expectedPlacements,.1);
 const paid=project(input({micro:1}),1)[0];assert.ok(paid.marketingVisits>0); // Buying a placement is distinct from cold seeding.
});
test('SA brand awareness bonus raises SA conversion without manufacturing clicks or boosting unrelated DA cohorts',()=>{
 const low=project(input({search:10,display:10},{memory:establishedMemory({trust:40,awareness:5})}),1)[0];
 const high=project(input({search:10,display:10},{memory:establishedMemory({trust:40,awareness:75})}),1)[0];
 const sa=m=>m.channels.find(c=>c.id==='search'),da=m=>m.channels.find(c=>c.id==='display');
 assert.equal(sa(low).visits,sa(high).visits);assert.ok(sa(high).estimatedConversionRate>sa(low).estimatedConversionRate);assert.equal(da(low).estimatedConversionRate,da(high).estimatedConversionRate);assert.ok(high.strategy.searchBrandMultiplier>low.strategy.searchBrandMultiplier);
});
test('DA-only startup buys visits but has zero ROAS without blog content, despite fresh creatives',()=>{
 const rows=run({display:30});assert.ok(rows.every(m=>m.roas===0&&m.newOrders===0));assert.equal(rows[0].performanceVisits,rows[11].performanceVisits);assert.ok(rows.every(m=>m.repeatOrders===0&&m.referralVisits===0&&m.organicVisits===0));assert.ok(rows.every(m=>m.channels[0].creativeAge===0));assert.equal(rows[11].strategy.adMultiplier,.5);
});
test('performance maximizes immediate traffic while cold owned builds assets with a delayed return',()=>{
 const ads=run({display:30}),owned=run({owned:20});
 assert.ok(ads[0].visits>owned[0].visits*50);assert.ok(owned[0].visits<30);assert.equal(owned[0].revenue,0);assert.equal(owned[0].spend,0);assert.equal(owned[0].workHours,80);
 assert.ok(owned[11].organicVisits>owned[2].organicVisits);assert.ok(owned[11].revenue>owned[0].revenue);assert.ok(owned[11].memoryAfter.organicAssets>0);
 const external=project(input({cafe:20,seeding:10}),1)[0];assert.ok(external.visits>owned[0].visits);assert.ok(external.memoryAfter.awareness>owned[0].memoryAfter.awareness);
});
test('foundation and diversification reduce advertising pressure; creative refresh and cosmetic edits do not reset it',()=>{
 const prior=run({display:30},4).at(-1).memoryAfter;
 const slight=project(input({display:29,owned:1},{memory:prior}),1)[0];
 assert.ok(slight.memoryAfter.strategyStates.p.adPressure>=prior.strategyStates.p.adPressure);
 const balanced=run({display:6,owned:15,cafe:10,experience:8},5,{memory:prior});
 assert.ok(balanced.at(-1).memoryAfter.strategyStates.p.adPressure<prior.strategyStates.p.adPressure);assert.ok(balanced.at(-1).strategy.adMultiplier>balanced[0].strategy.adMultiplier);
 assert.ok(balanced.at(-1).memoryAfter.awareness>prior.awareness);assert.ok(balanced.at(-1).memoryAfter.trust>prior.trust);
 const a=project(input({display:20},{memory:prior,product:{...product,id:'new'}}),1)[0];assert.equal(a.strategy.adMultiplier,1);assert.equal(a.memoryAfter.strategyStates.p.adPressure,prior.strategyStates.p.adPressure);
});
test('one-sided strategies generate a review signal after two months without arbitrary calendar lockouts',()=>{
 const rows=run({cafe:40},4);assert.equal(rows[0].strategy.concentrationMonths,1);assert.equal(rows[2].strategy.concentrationMonths,3);assert.ok(rows[2].strategy.warnings.some(w=>w.includes('1–2개월')));
 assert.equal(validateCampaign(input({search:1,'influencer-seeding':10})),null);
});
test('product consideration and repurchase eligibility change the economic outcome; subscriptions keep their explicit renewal terms',()=>{
 const low=project(input({display:20},{memory:establishedMemory()}),1)[0],high=project(input({display:20},{memory:establishedMemory(),product:{...product,involvement:'high'}}),1)[0];assert.ok(high.newOrders<low.newOrders);
 const memory=establishedMemory({awareness:65,trust:70,advocacy:50,productCustomers:{p:100},customers:100});
 const repeat=project(input({},{memory}),1)[0],single=project(input({},{memory,product:{...product,repurchasePossible:false}}),1)[0];assert.equal(repeat.repeatOrders,8);assert.equal(single.repeatOrders,0);
 const sub=project(input({},{memory,product:{...product,purchaseType:'subscription',churnRate:5,repurchasePossible:false}}),1)[0];assert.equal(sub.retainedSubscribers,95);
 const trustHigh=project(input({display:20},{memory,product:{...product,involvement:'high'}}),1)[0];assert.ok(trustHigh.closeRate>high.closeRate);
});
test('recommendations track brand phase and available resources rather than lesson topic',()=>{
 for(const memory of [initialMemory(),{...initialMemory(),awareness:30,trust:30},{...initialMemory(),awareness:60,trust:60}]){
  const units=recommendMix(1,3000000,business,product,memory),other=recommendMix(4,3000000,business,product,memory);assert.deepEqual(units,other);
  assert.equal(validateCampaign(input(units,{memory})),null);const m=project(input(units,{memory}),1)[0];
  if(memory.awareness<20){assert.equal(units.search??0,0);assert.ok(units.display>0);assert.ok(units.cafe>0);assert.deepEqual(m.strategy.targets,{search:0,display:2,influencer:0,content:8});}
  else if(memory.awareness<40){assert.ok(units.search>0);assert.deepEqual(m.strategy.targets,{search:2,display:2,influencer:0,content:7});}
  else{assert.ok(units.micro>0);assert.deepEqual(m.strategy.targets,{search:2,display:1,influencer:3,content:4});}
 }
});
test('validation and historical replay preserve product strategy traits and advertising pressure',()=>{
 for(const patch of [{involvement:'medium'},{repurchasePossible:'yes'}])assert.match(validateCampaign(input({owned:1},{product:{...product,...patch}})),/상품/);
 const bad={...initialMemory(),strategyStates:{p:{adPressure:2,concentrationMonths:1,shares:{search:0,display:1,influencer:0,content:0}}}};assert.match(validateCampaign(input({display:1},{memory:bad})),/전략 누적/);
 let memory=initialMemory();const history=Array.from({length:4},()=>{const h=simulate(input({display:20},{memory,round:memory.month+1}));memory=h.memoryAfter;return h;});
 const drafts={[history[0].id]:{...history[0].plan,units:{display:6,owned:10,cafe:10}}},payload=revisionPayload(history,drafts,'test');assert.equal(payload.records[0].productSnapshot.involvement,'low');assert.equal(payload.records[0].productSnapshot.repurchasePossible,true);
 const result=replayRecords(payload.records,payload.memoryBefore);assert.equal(result.error,null);assert.ok(result.records.at(-1).memoryAfter.strategyStates.p.adPressure<history.at(-1).memoryAfter.strategyStates.p.adPressure);
});

test('recommendations account for video creative workload and proficiency when allocating internal content',()=>{
 const team={headcount:1,hoursPerPerson:40,performance:'starter',awarenessRetention:94},b={...business,marketingTeam:team};
 const plan={...initialPlan(),campaigns:{display:{format:'video',refreshMonths:1}}};
 const units=recommendMix(1,3000000,b,product,initialMemory(),plan);
 const request=input(units,{business:b,plan:{...plan,units}});
 assert.equal(validateCampaign(request),null);assert.ok(planSummary(request).workHours<=40);
});

test('phased mix gives up some early traffic but builds organic, referrals and repeat revenue over twelve months',()=>{
 const ads=run({display:30});let memory=initialMemory();const mixed=[];
 for(let i=0;i<12;i++){const units=recommendMix(1,3000000,business,product,memory),m=project(input(units,{memory}),1)[0];mixed.push(m);memory=m.memoryAfter;}
 assert.ok(ads[0].visits>mixed[0].visits);assert.equal(ads[0].revenue,0);assert.ok(mixed[0].revenue>=ads[0].revenue);
 assert.ok(mixed.at(-1).organicVisits>0);assert.ok(mixed.at(-1).referralVisits>0);assert.ok(mixed.at(-1).repeatOrders>0);
 assert.ok(mixed.at(-1).revenue>ads.at(-1).revenue);assert.ok(mixed.at(-1).strategy.adMultiplier>ads.at(-1).strategy.adMultiplier);
 assert.deepEqual([...new Set(mixed.map(m=>m.strategy.phase))],['launch','growth','advocacy']);
});

test('repurchase products prioritize community relationship work within the content mix',()=>{
 const limited={...business,marketingTeam:{headcount:1,hoursPerPerson:100,performance:'standard',awarenessRetention:94}};
 const repeat=recommendMix(1,3000000,limited,product,initialMemory());
 const oneoff=recommendMix(1,3000000,limited,{...product,repurchasePossible:false},initialMemory());
 assert.ok((repeat.cafe||0)>(oneoff.cafe||0));
 const memory={...initialMemory(),awareness:30,trust:40,advocacy:20};
 const loyal=project(input({cafe:10},{memory}),1)[0],single=project(input({cafe:10},{memory,product:{...product,repurchasePossible:false}}),1)[0];
 assert.ok(loyal.memoryAfter.advocacy>single.memoryAfter.advocacy);
});
