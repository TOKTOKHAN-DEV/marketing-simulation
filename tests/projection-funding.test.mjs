import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import ts from'typescript';import{project,initialPlan,initialMemory}from'../model.mjs';
const file=readFileSync(new URL('../src/Projection.tsx',import.meta.url),'utf8'),source=file.slice(file.indexOf('export function csvFor'));
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const{csvFor}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('CSV exports the same monthly allowance, revenue reinvestment and spending as the projection engine',()=>{
 const business={id:'b',name:'매출 전망',industry:'commerce',market:'B2C',audience:'',budgetPolicy:{baseBudget:5000000,reinvestmentRate:.4}},product={id:'p',businessId:'b',name:'상품',price:30000,purchaseType:'oneoff',value:''};
 const forecast=project({business,product,plan:{...initialPlan(),units:{display:50}},memory:initialMemory(),stage:1},6),[header,...rows]=csvFor(forecast).replace(/^\uFEFF/,'').split('\r\n').map(line=>line.split(','));
 for(const[i,row]of rows.entries()){assert.equal(row.length,header.length);const read=key=>Number(row[header.indexOf(key)]);assert.equal(read('월예산한도'),forecast[i].budget);assert.equal(read('집행예산'),forecast[i].spend);assert.equal(read('전월기업매출'),forecast[i].funding.previousRevenue);assert.equal(read('전월매출재투자'),forecast[i].funding.reinvestmentAmount);assert.equal(read('다음달사용가능예산'),forecast[i].funding.nextBudget);}
});
