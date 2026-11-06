import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import ts from'typescript';import{project,initialPlan,initialMemory}from'../model.mjs';
import{establishedMemory}from'./content-fixtures.mjs';
const file=readFileSync(new URL('../src/Projection.tsx',import.meta.url),'utf8'),source=file.slice(file.indexOf('export function csvFor'));
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const{csvFor}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('CSV exports the same monthly allowance, revenue reinvestment and spending as the projection engine',()=>{
 const business={id:'b',name:'매출 전망',industry:'commerce',market:'B2C',audience:'',budgetPolicy:{baseBudget:5000000,reinvestmentRate:.4}},product={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:''};
 const forecast=project({business,product,plan:{...initialPlan(),units:{display:50}},memory:initialMemory(),stage:1},6),[header,...rows]=csvFor(forecast).replace(/^\uFEFF/,'').split('\r\n').map(line=>line.split(','));
 for(const[i,row]of rows.entries()){assert.equal(row.length,header.length);const read=key=>Number(row[header.indexOf(key)]);assert.equal(read('월예산한도'),forecast[i].budget);assert.equal(read('집행예산'),forecast[i].spend);assert.equal(read('전월기업매출'),forecast[i].funding.previousRevenue);assert.equal(read('전월매출재투자'),forecast[i].funding.reinvestmentAmount);assert.equal(read('다음달사용가능예산'),forecast[i].funding.nextBudget);}
});
test('CSV includes group-buy revenue, its 25 percent fee and additional ad channel spending',()=>{
 const business={id:'b',name:'공구 매출 전망',industry:'commerce',market:'B2C',audience:''},product={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:''};
 const [m]=project({business,product,plan:{...initialPlan(),units:{tiktok:10,'group-buy':1}},memory:initialMemory(),stage:1},1),[header,row]=csvFor([m]).replace(/^\uFEFF/,'').split('\r\n').map(line=>line.split(','));
 assert.equal(header.length,row.length);assert.equal(Number(row[header.indexOf('공구귀속매출')]),m.groupBuyRevenue);assert.equal(Number(row[header.indexOf('공구수수료')]),m.groupBuyFee);assert.match(row[header.indexOf('추가광고채널')],/틱톡.*집행 1000000/);
});
test('CSV exports the same month-start article counts, content support and referral conversion as the funnel',()=>{
 const business={id:'b',name:'추천 전환',industry:'commerce',market:'B2C',audience:''},product={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:''},memory=establishedMemory({awareness:70,trust:70,advocacy:60,customers:1000,productCustomers:{p:1000}});
 const [m]=project({business,product,plan:{...initialPlan(),units:{display:10}},memory,stage:1},1),[header,row]=csvFor([m]).replace(/^\uFEFF/,'').split('\r\n').map(line=>line.split(',')),read=key=>Number(row[header.indexOf(key)]);
 assert.equal(read('월초온드블로그누적'),200);assert.equal(read('월초온드SNS누적'),20);assert.equal(read('콘텐츠기반광고전환계수'),m.strategy.content.adConversionMultiplier);assert.equal(read('추천전환보너스'),m.strategy.content.referralMultiplier);assert.equal(read('추천방문구매전환율'),m.referralConversionRate);assert.ok(m.referralConversionRate>0);
});
test('cash forecast CSV distinguishes annual capital, recommended allocation and remaining spending limit',()=>{
 const business={id:'b',name:'연간 자금 CSV',industry:'commerce',market:'B2C',audience:'',budgetPolicy:{mode:'cash',totalBudget:36000000,baseBudget:3000000,reinvestmentRate:.3}},product={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:''},forecast=project({business,product,plan:{...initialPlan(),units:{display:60}},memory:initialMemory(),stage:1},3),[header,...rows]=csvFor(forecast).replace(/^\uFEFF/,'').split('\r\n').map(line=>line.split(','));
 for(const[i,row]of rows.entries()){const read=key=>Number(row[header.indexOf(key)]),m=forecast[i];assert.equal(row.length,header.length);assert.equal(read('연간시작자금'),36000000);assert.equal(read('월권장예산'),3000000);assert.equal(read('월예산한도'),m.budget);assert.equal(read('누적마케팅집행'),i*6000000);assert.equal(read('다음달사용가능예산'),m.funding.nextBudget);}
});

test('CSV separates owned and all-blog counts, new organic visits and retained blog visits',()=>{
 const business={id:'b',name:'블로그 CSV',industry:'commerce',market:'B2C',audience:''},product={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:''},memory=establishedMemory({awareness:60,trust:60,blogAudience:100,contentPublished:{p:{owned:50,experience:50,press:50,seeding:50}}});
 const[m]=project({business,product,plan:initialPlan(),memory,stage:1},1),[header,row]=csvFor([m]).replace(/^\uFEFF/,'').split('\r\n').map(line=>line.split(',')),read=key=>Number(row[header.indexOf(key)]);
 assert.equal(header.length,row.length);assert.equal(read('월초온드블로그누적'),50);assert.equal(read('월초전체블로그누적'),200);assert.equal(read('블로그자연신규유입'),m.blogNewVisits);assert.equal(read('블로그자연재방문'),90);assert.equal(read('월말블로그재방문기반'),m.memoryAfter.blogAudience);
});
