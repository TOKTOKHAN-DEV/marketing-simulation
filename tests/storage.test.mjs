import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const compile=source=>ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const typesUrl=moduleUrl(compile(readFileSync(new URL('../src/types.ts',import.meta.url),'utf8')));
const source=compile(readFileSync(new URL('../src/storage.ts',import.meta.url),'utf8')).replace("'../model.mjs'",JSON.stringify(new URL('../model.mjs',import.meta.url).href)).replace("'./types'",JSON.stringify(typesUrl));
const {migrateLegacy,loadGame,validState}=await import(moduleUrl(source));
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
 try{const restored=loadGame('test');assert.equal(restored.business.marketingTeam.performance,'expert');assert.equal(restored.plans['p:2'].cadence.owned,'once');assert.deepEqual(restored.outlook,state.outlook);assert.equal(restored.projectionHorizon,6);assert.equal(restored.history[0].memoryAfter.contentPublished.p.owned,10);assert.equal(restored.history[0].metrics.expectedPlacements,.8);}finally{globalThis.localStorage=original;}
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
