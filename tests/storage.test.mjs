import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const compile=source=>ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const typesUrl=moduleUrl(compile(readFileSync(new URL('../src/types.ts',import.meta.url),'utf8')));
const source=compile(readFileSync(new URL('../src/storage.ts',import.meta.url),'utf8')).replace("'../model.mjs'",JSON.stringify(new URL('../model.mjs',import.meta.url).href)).replace("'./types'",JSON.stringify(typesUrl)).replace("'../funding.mjs'",JSON.stringify(new URL('../funding.mjs',import.meta.url).href));
const {migrateLegacy,migrateMonthlyDrafts,loadGame,restartGame,validState}=await import(moduleUrl(source));
const {newState}=await import(typesUrl);
const legacy={version:1,profile:{name:'이전 기업',industry:'IT / 소프트웨어',market:'B2B',audience:'작은 팀',product:'구독 서비스',price:200000,problem:'반복 업무'},results:[{id:'old-result'}],notes:'소중한 노트',reflection:'발견',nextAction:'다음 행동'};
test('legacy business and product migrate separately without losing notes or original experiments',()=>{const before=structuredClone(legacy);const game=migrateLegacy(legacy);assert.equal(game.business.name,'이전 기업');assert.equal(game.business.industry,'saas');assert.equal(game.products[0].name,'구독 서비스');assert.equal(game.products[0].businessId,game.business.id);assert.equal(game.products[0].price,200000);assert.equal(game.notes,'소중한 노트');assert.deepEqual(game.legacyArchive.results,legacy.results);assert.equal(game.history.length,0);assert.equal(validState(game),true);assert.deepEqual(legacy,before);});
test('saved v2 state restores using its own workshop namespace',()=>{const game=newState();game.notes='저장된 노트';const map=new Map([['marketing-quest:v2:test',JSON.stringify(game)],['unrelated','keep']]);const original=globalThis.localStorage;globalThis.localStorage={getItem:key=>map.get(key)??null};try{assert.deepEqual(loadGame('test'),game);assert.equal(loadGame('other').notes,'');assert.equal(map.get('unrelated'),'keep');}finally{globalThis.localStorage=original;}});
test('migration reads but does not delete or overwrite legacy records',()=>{const map=new Map([['marketing-quest:v1:test',JSON.stringify(legacy)]]);const original=globalThis.localStorage;globalThis.localStorage={getItem:key=>map.get(key)??null};try{const game=loadGame('test');assert.equal(game.products.length,1);assert.equal(map.size,1);assert.deepEqual(JSON.parse(map.get('marketing-quest:v1:test')),legacy);}finally{globalThis.localStorage=original;}});
test('invalid or partial states are rejected without overwriting their source',()=>{const bad=JSON.stringify({...newState(),history:[{id:'broken'}]});const original=globalThis.localStorage;globalThis.localStorage={getItem:()=>bad};try{assert.throws(()=>loadGame('test'));assert.equal(globalThis.localStorage.getItem('any'),bad);assert.equal(validState({version:2}),false);}finally{globalThis.localStorage=original;}});
test('monthly publishing, marketer allocation, seeding terms and cumulative publication counters survive browser storage',async()=>{
 const {simulate}=await import('../simulation.mjs');const {initialMemory}=await import('../model.mjs');
 const b={id:'b',name:'저장 테스트',industry:'commerce',market:'B2C',audience:'',marketingTeam:{headcount:1,hoursPerPerson:80,performance:'expert',awarenessRetention:95}};
 const p={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:'',canSponsor:true,sponsorshipCost:9000};
 const plan={budget:1000000,units:{owned:10,'influencer-seeding':10},cadence:{owned:'once'},rates:{mega:6500000},seeding:{mode:'gift',fee:300000,commission:10},hypothesis:''};
 const result=simulate({business:b,product:p,plan,memory:initialMemory(),stage:2,round:1});
 const state={...newState(),projectionHorizon:6,business:b,products:[p],productId:'p',plans:{'p:2':plan},outlook:{'p:1':[{owned:10,adPercent:100},{owned:4,adPercent:0}]},history:[result]};assert.equal(validState(state),true);
 const original=globalThis.localStorage;globalThis.localStorage={getItem:()=>JSON.stringify(state)};
 try{const restored=loadGame('test');assert.equal(restored.business.marketingTeam.performance,'expert');assert.equal(restored.plans['p:2'].cadence.owned,'once');assert.deepEqual(restored.outlook,state.outlook);assert.equal(restored.projectionHorizon,6);assert.equal(restored.history[0].memoryAfter.contentPublished.p.owned,10);assert.equal(restored.history[0].metrics.expectedPlacements,0);}finally{globalThis.localStorage=original;}
 for(const patch of [{marketingTeam:{...b.marketingTeam,headcount:-1}},{marketingTeam:{...b.marketingTeam,performance:'fake'}}])assert.equal(validState({...state,business:{...b,...patch}}),false);
 assert.equal(validState({...state,plans:{bad:{...plan,cadence:{owned:'daily'}}}}),false);
 assert.equal(validState({...state,outlook:{bad:[{owned:10,adPercent:101}]}}),false);
 assert.equal(validState({...state,outlook:{bad:[{owned:-1,adPercent:50}]}}),false);
 assert.equal(validState({...state,projectionHorizon:12}),false);
});
test('ad strategies, creative ages and per-month refresh decisions restore without losing campaign history',async()=>{
 const {simulate}=await import('../simulation.mjs');const {initialMemory}=await import('../model.mjs');
 const b={id:'b',name:'소재 저장',industry:'commerce',market:'B2C',audience:''};const p={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:''};
 const plan={budget:1000000,units:{display:5,social:5},hypothesis:'',campaigns:{display:{format:'video',refreshMonths:3},social:{format:'image',refreshMonths:2}}};
 const result=simulate({business:b,product:p,plan,memory:initialMemory(),stage:3,round:1});
 const state={...newState(),business:b,products:[p],productId:'p',plans:{'p:3':plan},history:[result],outlook:{'p:1':[{owned:4,adPercent:50,creativeAction:'refresh'}]}};assert.equal(validState(state),true);
 const old=globalThis.localStorage;globalThis.localStorage={getItem:()=>JSON.stringify(state)};
 try{const restored=loadGame('test');assert.equal(restored.history[0].memoryAfter.adCreatives.p.display.age,1);assert.equal(restored.history[0].memoryAfter.adCreatives.p.display.format,'video');assert.equal(restored.plans['p:3'].campaigns.social.refreshMonths,2);assert.equal(restored.outlook['p:1'][0].creativeAction,'refresh');}finally{globalThis.localStorage=old;}
 assert.equal(validState({...state,plans:{bad:{...plan,campaigns:{display:{refreshMonths:7}}}}}),false);
 const broken=structuredClone(state);broken.history[0].memoryAfter.adCreatives.p.display.age=-1;assert.equal(validState(broken),false);
});

test('stage-based drafts migrate into one product draft without changing originals or current monthly work',()=>{
 const state=newState();state.stage=2;state.products=[{id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:''}];
 state.plans={'p:1':{budget:100000,units:{owned:1},hypothesis:'콘텐츠 실험'},'p:2':{budget:1000000,units:{micro:1,search:2},hypothesis:'진행 중 전략'}};
 const before=structuredClone(state),migrated=migrateMonthlyDrafts(state);assert.deepEqual(state,before);assert.deepEqual(migrated.plans['p:monthly'],state.plans['p:2']);
 const changed={...migrated,stage:3};assert.deepEqual(migrateMonthlyDrafts(changed).plans['p:monthly'],state.plans['p:2']);
 assert.deepEqual(migrated.plans['p:1'],state.plans['p:1']);assert.deepEqual(migrated.plans['p:2'],state.plans['p:2']);
});
test('more than nine monthly records and review-topic runs survive reload',async()=>{
 const {simulate}=await import('../simulation.mjs');const {initialMemory}=await import('../model.mjs');
 const b={id:'b',name:'연속 실험',industry:'commerce',market:'B2C',audience:''},p={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:''};
 const state={...newState(),business:b,products:[p],productId:'p'};let memory=initialMemory();
 for(let month=1;month<=12;month++){const r=simulate({business:b,product:p,plan:{budget:100000,units:{search:1},hypothesis:''},memory,stage:month===12?4:1,round:month});state.history.push(r);memory=r.memoryAfter;}
 assert.equal(validState(state),true);const old=globalThis.localStorage;globalThis.localStorage={getItem:()=>JSON.stringify(state)};
 try{const restored=loadGame('continuous');assert.equal(restored.history.length,12);assert.equal(restored.history.at(-1).metrics.month,12);assert.equal(restored.history.at(-1).round,12);assert.equal(restored.history.at(-1).stage,4);}finally{globalThis.localStorage=old;}
});
test('historical month drafts, selection and one-level undo survive a browser reload',async()=>{
 const {simulate}=await import('../simulation.mjs');const {initialMemory}=await import('../model.mjs');const {previewRevision}=await import('../timeline.mjs');
 const b={id:'b',name:'수정 복원',industry:'commerce',market:'B2C',audience:''},p={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:''};
 const first=simulate({business:b,product:p,plan:{budget:3000000,units:{owned:4},hypothesis:''},memory:initialMemory(),stage:1,round:1});
 const state={...newState(),business:b,products:[p],productId:'p',history:[first],editingCampaignId:first.id,historyDrafts:{[first.id]:{...first.plan,units:{owned:8}}}};
 assert.equal(validState(state),true);const old=globalThis.localStorage;globalThis.localStorage={getItem:()=>JSON.stringify(state)};
 try{const restored=loadGame('revision');assert.equal(restored.editingCampaignId,first.id);assert.equal(restored.historyDrafts[first.id].units.owned,8);assert.equal(restored.history[0].plan.units.owned,4);}finally{globalThis.localStorage=old;}
 const revised=previewRevision(state.history,state.historyDrafts);const applied={...state,history:revised.history,historyDrafts:{},revisionUndo:{history:state.history,revisedAt:new Date().toISOString()}};
 assert.equal(validState(applied),true);assert.equal(applied.revisionUndo.history[0].plan.units.owned,4);assert.equal(applied.history[0].plan.units.owned,8);
 assert.equal(validState({...state,editingCampaignId:'missing'}),false);assert.equal(validState({...state,historyDrafts:{missing:first.plan}}),false);
});

test('product consideration, repurchase flags and accumulated strategy pressure survive reload; malformed new fields fail safely',async()=>{
 const {simulate}=await import('../simulation.mjs');const {initialMemory}=await import('../model.mjs');
 const business={id:'b',name:'전략 저장',industry:'commerce',market:'B2C',audience:''};
 const product={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:'',involvement:'high',repurchasePossible:true};
 const plan={budget:3000000,units:{display:30},hypothesis:''};
 const record=simulate({business,product,plan,memory:initialMemory(),stage:1,round:1});
 const state={...newState(),business,products:[product],productId:'p',history:[record]};assert.equal(validState(state),true);
 const old=globalThis.localStorage;globalThis.localStorage={getItem:()=>JSON.stringify(state)};
 try{const restored=loadGame('growth');assert.equal(restored.products[0].involvement,'high');assert.equal(restored.products[0].repurchasePossible,true);assert.ok(restored.history[0].memoryAfter.strategyStates.p.adPressure>0);}finally{globalThis.localStorage=old;}
 assert.equal(validState({...state,products:[{...product,involvement:'bogus'}]}),false);assert.equal(validState({...state,products:[{...product,repurchasePossible:'yes'}]}),false);
 const bad=structuredClone(state);bad.history[0].memoryAfter.strategyStates.p.adPressure=2;assert.equal(validState(bad),false);
});

test('saved business sessions and product deletion undo survive reload without mixing companies',async()=>{
 const {saveBusinessState,businessKey,activateBusiness,deleteProduct}=await import('../business-state.mjs');
 let count=0;const makeId=()=>`store-${++count}`,b=(name,industry)=>({id:'form',name,industry,market:'B2C',audience:''});
 let a=saveBusinessState(newState(),b('기업 A','saas'),[],makeId);a.notes='A 기업 노트';a=deleteProduct(a,a.products[0].id);
 const state=saveBusinessState(a,b('기업 B','food'),[],makeId);assert.equal(validState(state),true);
 const old=globalThis.localStorage;globalThis.localStorage={getItem:()=>JSON.stringify(state)};
 try{const restored=loadGame('companies');assert.equal(restored.business.name,'기업 B');assert.ok(restored.products.every(p=>p.businessId===restored.business.id));const returned=activateBusiness(restored,businessKey(a.business));assert.equal(returned.notes,'A 기업 노트');assert.equal(returned.products.length,1);assert.equal(returned.deletedProduct.product.id,a.deletedProduct.product.id);assert.equal(validState(returned),true);}finally{globalThis.localStorage=old;}
 const broken=structuredClone(state);broken.businessSessions[businessKey(a.business)].products[0].price=-1;assert.equal(validState(broken),false);
 const badUndo=structuredClone(state);badUndo.deletedProduct={product:state.products[0],index:-1,wasSelected:true};assert.equal(validState(badUndo),false);
 assert.equal(validState({...state,products:[{...state.products[0],priceEstimated:'yes'}]}),false);
});

test('reinvestment settings, previous revenue and funding forecasts survive reload; legacy history remains exact',async()=>{
 const {simulate}=await import('../simulation.mjs');const {initialMemory,initialPlan}=await import('../model.mjs');const {memoryForHistory,DEFAULT_BUDGET_POLICY}=await import('../funding.mjs');
 const business={id:'b',name:'재투자 저장',industry:'commerce',market:'B2C',audience:'',budgetPolicy:{baseBudget:5000000,reinvestmentRate:.4}},product={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:''};
 const record=simulate({business,product,products:[product],plan:{...initialPlan(),units:{display:50}},memory:initialMemory(),stage:1,round:1});
 const state={...newState(),business,products:[product],productId:'p',history:[record],projectionScaleBudget:false};assert.equal(validState(state),true);
 const old=globalThis.localStorage;globalThis.localStorage={getItem:()=>JSON.stringify(state)};
 try{const loaded=loadGame('reinvest');assert.deepEqual(loaded.business.budgetPolicy,DEFAULT_BUDGET_POLICY);assert.equal(loaded.projectionScaleBudget,false);assert.equal(memoryForHistory(loaded.history,initialMemory()).lastRevenue,record.metrics.companyRevenue);assert.equal(loaded.history[0].forecast[1].budget,record.metrics.funding.nextBudget);}finally{globalThis.localStorage=old;}
 const broken=structuredClone(state);broken.business.budgetPolicy.reinvestmentRate=4;assert.equal(validState(broken),false);const bad=structuredClone(state);bad.history[0].memoryAfter.lastRevenue=-1;assert.equal(validState(bad),false);
 const {budgetPolicy,...legacy}=business,legacyRecord=simulate({business:legacy,product,plan:{...initialPlan(),budget:3000000},memory:initialMemory(),stage:1,round:1});const legacyState={...state,business:legacy,history:[legacyRecord]};globalThis.localStorage={getItem:()=>JSON.stringify(legacyState)};
 try{const upgraded=loadGame('legacy-funding');assert.equal(upgraded.business.budgetPolicy.baseBudget,3000000);assert.deepEqual(upgraded.history,JSON.parse(JSON.stringify(legacyState.history)));assert.equal(upgraded.history[0].businessSnapshot.budgetPolicy,undefined);}finally{globalThis.localStorage=old;}
});
test('an overspending future preview is retained as a warning without corrupting valid executed history',async()=>{
 const {simulate}=await import('../simulation.mjs');const {initialMemory,initialPlan}=await import('../model.mjs');
 const business={id:'b',name:'미래 예산 검증',industry:'commerce',market:'B2C',audience:'',budgetPolicy:{baseBudget:5000000,reinvestmentRate:.4},marketingTeam:{headcount:2,hoursPerPerson:120,performance:'standard',awarenessRetention:94}},product={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:'',canSponsor:true,sponsorshipCost:9000};
 const record=simulate({business,product:{...product,sponsorshipCost:300000},plan:{...initialPlan(),units:{display:30,experience:20,owned:20,'influencer-seeding':400}},memory:initialMemory(),stage:1,round:1});assert.ok(record.metrics.unallocated>=0);assert.ok(record.forecast.some(m=>m.unallocated<0));const state={...newState(),business,products:[product],productId:'p',history:[record]};assert.equal(validState(state),true);const bad=structuredClone(state);bad.history[0].metrics.unallocated=-1;assert.equal(validState(bad),false);
});

test('M1-M12 monthly plans and selected future month restore; M13 and malformed entries are rejected',()=>{
 const business={id:'b',name:'12개월 저장',industry:'commerce',market:'B2C',audience:''},product={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:''},plan={budget:5000000,units:{owned:2},hypothesis:''};
 const state={...newState(),business,products:[product],productId:'p',monthlyPlans:{1:{productId:'p',plan},12:{productId:'p',plan:{...plan,units:{display:20}}}},planningMonth:12};assert.equal(validState(state),true);
 const old=globalThis.localStorage;globalThis.localStorage={getItem:()=>JSON.stringify(state)};try{const loaded=loadGame('annual');assert.equal(loaded.planningMonth,12);assert.equal(loaded.monthlyPlans[12].plan.units.display,20);}finally{globalThis.localStorage=old;}
 assert.equal(validState({...state,planningMonth:13}),false);assert.equal(validState({...state,monthlyPlans:{13:{productId:'p',plan}}}),false);assert.equal(validState({...state,monthlyPlans:{1:{productId:'p',plan:{...plan,units:{bogus:1}}}}}),false);
});

test('full restart removes all current workshop businesses, plans and history without touching other workshops',()=>{
 const game={...newState(),business:{id:'b',name:'기존 기업',industry:'commerce',market:'B2C',audience:''},notes:'전략 노트',reflection:'회고',nextAction:'행동',monthlyPlans:{12:{productId:'p',plan:{budget:5000000,units:{display:10},hypothesis:'가설'}}},planningMonth:12,businessSessions:{archived:{notes:'보관 기업 기록'}},legacyArchive:{notes:'이전 버전 원본'}};
 const map=new Map([['marketing-quest:v2:restart',JSON.stringify(game)],['marketing-quest:v1:restart',JSON.stringify(legacy)],['marketing-quest:v2:other','다른 워크숍 기록'],['unrelated','유지']]);const old=globalThis.localStorage;globalThis.localStorage={getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};
 try{const fresh=restartGame('restart');assert.deepEqual(fresh,newState());assert.equal(validState(fresh),true);assert.deepEqual(loadGame('restart'),newState());assert.equal(map.has('marketing-quest:v1:restart'),false);assert.equal(map.get('marketing-quest:v2:other'),'다른 워크숍 기록');assert.equal(map.get('unrelated'),'유지');assert.ok(!map.get('marketing-quest:v2:restart').includes('전략 노트'));assert.equal(game.notes,'전략 노트');}finally{globalThis.localStorage=old;}
});
test('a failed restart write preserves the existing durable game and legacy record',()=>{
 const map=new Map([['marketing-quest:v2:fail','original'],['marketing-quest:v1:fail','legacy']]),before=[...map],old=globalThis.localStorage;
 globalThis.localStorage={getItem:key=>map.get(key)??null,setItem:()=>{throw new Error('storage blocked');},removeItem:key=>map.delete(key)};
 try{assert.throws(()=>restartGame('fail'),/storage blocked/);assert.deepEqual([...map],before);}finally{globalThis.localStorage=old;}
});
test('a failed legacy cleanup rolls back the primary restart instead of silently losing visible progress',()=>{
 const map=new Map([['marketing-quest:v2:fail','original'],['marketing-quest:v1:fail','legacy']]),before=[...map],old=globalThis.localStorage;
 globalThis.localStorage={getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>{if(key==='marketing-quest:v1:fail')throw new Error('cleanup failed');map.delete(key);}};
 try{assert.throws(()=>restartGame('fail'),/cleanup failed/);assert.deepEqual([...map],before);}finally{globalThis.localStorage=old;}
});
test('new domestic media, creative memory, group-buy fees and service commission queues survive reload',async()=>{
 const {simulate}=await import('../simulation.mjs'),{initialPlan,initialMemory}=await import('../model.mjs');
 const business={id:'b',name:'새 미디어 저장',industry:'commerce',market:'B2C',audience:''},product={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:'',canSponsor:true,sponsorshipCost:9000};
 const plan={...initialPlan(),budget:100000000,units:{tiktok:10,linkedin:10,daangn:10,remember:10,'naver-gfa':10,kakao:10,'insta-review':1,'video-review':1,'group-buy':1,'owned-shortform':1,newsletter:1},campaigns:{tiktok:{format:'video',refreshMonths:2},remember:{format:'image',refreshMonths:3}}};
 const record=simulate({business,product,plan,memory:initialMemory(),stage:1,round:1});record.memoryAfter.serviceQueues.old={pendingOrders:1,progressHours:10,marketingShare:1,performanceShare:0,groupBuyCommissionRate:.25};
 const state={...newState(),business,products:[product],productId:'p',plans:{'p:monthly':plan},monthlyPlans:{12:{productId:'p',plan}},history:[record]};assert.equal(validState(state),true);
 const old=globalThis.localStorage;globalThis.localStorage={getItem:()=>JSON.stringify(state)};
 try{const loaded=loadGame('domestic');assert.deepEqual(loaded.plans['p:monthly'],plan);assert.deepEqual(loaded.monthlyPlans[12].plan,plan);assert.equal(loaded.history[0].metrics.groupBuyFee,record.metrics.groupBuyFee);assert.equal(loaded.history[0].memoryAfter.adCreatives.p.tiktok.format,'video');assert.equal(loaded.history[0].memoryAfter.serviceQueues.old.groupBuyCommissionRate,.25);}finally{globalThis.localStorage=old;}
 const bad=structuredClone(state);bad.history[0].memoryAfter.serviceQueues.old.groupBuyCommissionRate=.26;assert.equal(validState(bad),false);
});
test('cash ledger, recommendations and zero-cash passes restore without changing recorded funding',async()=>{
 const {simulate}=await import('../simulation.mjs'),{initialMemory,initialPlan}=await import('../model.mjs'),{DEFAULT_BUDGET_POLICY,memoryForHistory}=await import('../funding.mjs');
 const business={id:'b',name:'자금 복원',industry:'commerce',market:'B2C',audience:'',budgetPolicy:{...DEFAULT_BUDGET_POLICY}},product={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:''},first=simulate({business,product,plan:{...initialPlan(),units:{display:360}},memory:initialMemory(),stage:1,round:1}),pass=simulate({business,product,plan:initialPlan(),memory:first.memoryAfter,stage:1,round:2});
 const state={...newState(),business,products:[product],productId:'p',history:[first,pass]};assert.equal(first.metrics.funding.nextBudget,0);assert.equal(pass.metrics.budget,0);assert.equal(validState(state),true);
 const old=globalThis.localStorage;globalThis.localStorage={getItem:()=>JSON.stringify(state)};
 try{const loaded=loadGame('cash');assert.deepEqual(loaded.business.budgetPolicy,DEFAULT_BUDGET_POLICY);assert.deepEqual(loaded.history,JSON.parse(JSON.stringify(state.history)));const memory=memoryForHistory(loaded.history,initialMemory());assert.equal(memory.cumulativeSpend,36000000);assert.equal(memory.cumulativeRevenue,0);}finally{globalThis.localStorage=old;}
 const bad=structuredClone(state);bad.history[1].memoryAfter.cumulativeSpend=-1;assert.equal(validState(bad),false);
});
