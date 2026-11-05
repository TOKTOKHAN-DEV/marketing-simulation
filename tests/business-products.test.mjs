import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {starterProducts,saveBusinessState,activateBusiness,businessKey,deleteProduct,restoreProduct} from '../business-state.mjs';
import {initialMemory,initialPlan,validateCampaign} from '../model.mjs';
import {simulate} from '../simulation.mjs';
const company=JSON.parse(readFileSync(new URL('../src/data/company-catalog.json',import.meta.url),'utf8')).companies.find(c=>c.id==='toktokhan');
const blank=()=>({version:2,business:null,products:[],productId:'',plans:{},history:[],notes:'',reflection:'',nextAction:'',view:'business',stage:1});
const business=(name='새로운 회사',industry='commerce')=>({id:'form-placeholder',name,industry,market:'B2C',audience:''});
const ids=()=>{let n=0;return()=>`generated-${++n}`;};

test('selecting a known business creates its actual product categories with public and example prices clearly separated',()=>{
 const b={...business('똑똑한개발자','saas'),catalogCompanyId:company.id};
 const state=saveBusinessState(blank(),b,company.products,ids());
 assert.equal(state.products.length,company.products.length);assert.ok(state.products.some(p=>p.name.includes('pluuug')));
 const si=state.products.find(p=>p.catalogProductId==='toktokhan:si'),sub=state.products.find(p=>p.catalogProductId==='toktokhan:pluuug-basic');
 assert.equal(si.purchaseType,'service');assert.ok(si.hoursPerOrder>0);assert.equal(si.priceEstimated,true);assert.equal(si.sourceAvailability,'listed');assert.match(si.sourceNote,/교육용 예시/);
 assert.equal(sub.purchaseType,'subscription');assert.equal(sub.price,40000);assert.equal(sub.priceEstimated,false);assert.equal(sub.churnRate,5);
 assert.ok(state.products.every(p=>p.businessId===state.business.id));assert.equal(state.productId,state.products[0].id);
});
test('an unknown company gets editable industry drafts that are ready for simulation across all industries',()=>{
 for(const industry of ['commerce','beauty','food','education','saas','manufacturing','professional','travel','other']){
  const state=saveBusinessState(blank(),business('미등록 기업',industry),[],ids());assert.equal(state.products.length,2);
  for(const p of state.products){assert.equal(p.sourceAvailability,'draft');assert.equal(p.priceEstimated,true);assert.ok(!p.sourceUrl);assert.match(p.sourceBasis,/초안/);assert.equal(validateCampaign({business:state.business,product:p,products:state.products,plan:initialPlan(),memory:initialMemory(),stage:1}),null);}
  if(industry==='saas')assert.equal(state.products[0].purchaseType,'subscription');
  if(industry==='education')assert.equal(state.products[0].purchaseType,'service');
 }
});
test('switching companies starts an isolated simulation and restores earlier edits, deletions, selection and history when returning',()=>{
 const makeId=ids();let a=saveBusinessState(blank(),business('회사 A'),[],makeId);const keyA=businessKey(a.business);
 a.products[0]={...a.products[0],name:'직접 수정한 상품',price:39000,templateGenerated:false};
 const record=simulate({business:a.business,product:a.products[0],products:a.products,plan:{...initialPlan(),units:{owned:2,display:2}},memory:initialMemory(),stage:1,round:1});
 a={...a,history:[record],notes:'회사 A 전략',plans:{[`${a.productId}:monthly`]:{...initialPlan(),units:{cafe:5}}},editingCampaignId:record.id,historyDrafts:{[record.id]:{...record.plan,units:{owned:1}}}};
 a=deleteProduct(a,a.products[1].id);const before=structuredClone(a);
 const b=saveBusinessState(a,business('회사 B','food'),[],makeId);assert.deepEqual(a,before);assert.equal(b.history.length,0);assert.equal(b.notes,'');assert.deepEqual(b.plans,{});assert.equal(b.editingCampaignId,undefined);assert.equal(b.historyDrafts,undefined);assert.equal(b.deletedProduct,undefined);assert.notEqual(b.business.id,a.business.id);assert.ok(b.products.every(p=>p.businessId===b.business.id));
 const returned=activateBusiness(b,keyA);assert.equal(returned.business.id,a.business.id);assert.deepEqual(returned.products,a.products);assert.deepEqual(returned.history,a.history);assert.deepEqual(returned.historyDrafts,a.historyDrafts);assert.equal(returned.notes,'회사 A 전략');assert.deepEqual(returned.plans,a.plans);assert.equal(returned.products.length,1);assert.equal(returned.productId,a.productId);assert.ok(returned.deletedProduct);
 const again=activateBusiness(returned,businessKey(b.business));assert.deepEqual(again.products,b.products);assert.equal(again.history.length,0);
});
test('editing the same business preserves manual product changes and does not resurrect deleted products',()=>{
 const makeId=ids(),state=saveBusinessState(blank(),business(),[],makeId);
 const deleted=deleteProduct(deleteProduct(state,state.products[0].id),state.products[1].id);
 const saved=saveBusinessState(deleted,{...deleted.business,audience:'새 고객'});assert.equal(saved.products.length,0);assert.equal(saved.productId,'');assert.equal(saved.business.audience,'새 고객');
 assert.equal(activateBusiness(state,businessKey(state.business)),state);
});
test('changing the sector of a manual company updates generated drafts while preserving user-edited products',()=>{
 const makeId=ids();const state=saveBusinessState(blank(),business(),[],makeId);state.products[0]={...state.products[0],name:'내가 만든 상품',templateGenerated:false};
 const updated=saveBusinessState(state,{...state.business,industry:'saas'},[],makeId);
 assert.equal(updated.business.id,state.business.id);assert.ok(updated.products.some(p=>p.name==='내가 만든 상품'));assert.ok(updated.products.some(p=>p.purchaseType==='subscription'));assert.ok(!updated.products.some(p=>p.id===state.products[1].id));
});
test('deleting the selected product selects a neighbour, keeps original snapshots and supports undo including the last product',()=>{
 let state=saveBusinessState(blank(),business(),[],ids());const p=state.products[0];const record=simulate({business:state.business,product:p,products:state.products,plan:initialPlan(),memory:initialMemory(),stage:1,round:1});state.history=[record];
 const before=structuredClone(state),removed=deleteProduct(state,p.id);assert.deepEqual(state,before);assert.equal(removed.productId,state.products[1].id);assert.deepEqual(removed.history,state.history);assert.equal(removed.history[0].productSnapshot.id,p.id);
 const restored=restoreProduct(removed);assert.deepEqual(restored.products,state.products);assert.equal(restored.productId,p.id);
 const empty=deleteProduct(deleteProduct(state,p.id),state.products[1].id);assert.equal(empty.products.length,0);assert.equal(empty.productId,'');assert.equal(restoreProduct(empty).products.length,1);assert.equal(deleteProduct(state,'missing'),state);
});

test('all catalog products generate valid simulation inputs with their original provenance',()=>{
 const companies=JSON.parse(readFileSync(new URL('../src/data/company-catalog.json',import.meta.url),'utf8')).companies;
 for(const c of companies){const b={...business(c.name,c.industry),market:c.market||'B2C',audience:c.audience},products=starterProducts(b,c.products);for(const p of products)assert.equal(validateCampaign({business:b,product:p,products,plan:initialPlan(),memory:initialMemory(),stage:1}),null,`${c.name} · ${p.name}`);}
});
test('recognizing an existing manually named company does not discard its products or timeline',()=>{
 let state=saveBusinessState(blank(),business(' (주) 똑똑한 개발자 ','saas'),[],ids());state.products[0].name='기존 맞춤 상품';state.notes='기존 학습';
 const saved=saveBusinessState(state,{...state.business,name:'똑똑한개발자',catalogCompanyId:'toktokhan'},company.products,ids());
 assert.equal(saved.business.id,state.business.id);assert.equal(saved.products[0].name,'기존 맞춤 상품');assert.equal(saved.notes,state.notes);assert.equal(saved.products.length,state.products.length);
});
test('deleting a subscription excludes future renewals while preserving previously recognized revenue',()=>{
 let state=saveBusinessState(blank(),{...business(company.name,'saas'),catalogCompanyId:company.id},company.products,ids());const sub=state.products.find(p=>p.catalogProductId==='toktokhan:pluuug-basic'),si=state.products.find(p=>p.purchaseType==='service');
 const first=simulate({business:state.business,product:si,products:state.products,plan:initialPlan(),memory:{...initialMemory(),customers:100,productCustomers:{[sub.id]:100}},stage:1,round:1});state.history=[first];
 assert.equal(first.metrics.companyMrr,3800000);
 const removed=deleteProduct(state,sub.id),next=simulate({business:removed.business,product:si,products:removed.products,plan:initialPlan(),memory:first.memoryAfter,stage:1,round:2});
 assert.equal(next.metrics.companyMrr,0);assert.equal(removed.history[0].metrics.companyMrr,3800000);assert.ok(removed.history[0].productsSnapshot.some(p=>p.id===sub.id));
});
