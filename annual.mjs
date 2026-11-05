import {initialPlan,initialMemory,project,validateCampaign,clearCreativeActions,CHANNELS} from './model.mjs';
import {memoryForHistory,scalePaidPlan} from './funding.mjs';
export const PLAN_MONTHS=12;
export function annualPlan({business,products,history,monthlyPlans={},productId,legacyPlan}){
 let memory=memoryForHistory(history,initialMemory());const nextMonth=memory.month+1,entries=[];
 for(let month=1;month<=PLAN_MONTHS;month++){
  const record=history.find(h=>h.metrics.month===month);
  if(record){entries.push({month,productId:record.productSnapshot.id,product:record.productSnapshot,plan:record.plan,metrics:record.metrics,memoryBefore:record.memoryBefore,status:'executed',problem:null});continue;}
  const saved=monthlyPlans[month],product=products.find(p=>p.id===(saved?.productId||productId))||products[0];
  const plan=saved?.plan||(month===nextMonth&&legacyPlan?legacyPlan:initialPlan());
  if(!product||!business){entries.push({month,productId:product?.id||'',product,plan,metrics:null,memoryBefore:memory,status:'empty',problem:'상품을 먼저 준비해주세요.'});continue;}
  const input={business,product,products,plan,memory,stage:1};
  const metrics=project(input,1)[0]||null,problem=validateCampaign(input);
  entries.push({month,productId:product.id,product,plan,metrics,memoryBefore:memory,status:saved||Object.values(plan.units).some(n=>n>0)?'planned':'empty',problem});
  if(metrics)memory=metrics.memoryAfter;
 }
 return{entries,metrics:entries.flatMap(e=>e.metrics?[e.metrics]:[]),nextMonth};
}
export function fillAnnualPlans(input,fromMonth,source){
 if(!Number.isInteger(fromMonth)||fromMonth<1||fromMonth>PLAN_MONTHS)return input.monthlyPlans||{};
 const monthlyPlans={...input.monthlyPlans};const reference=annualPlan(input).entries.find(e=>e.month===fromMonth);
 if(!reference?.metrics)return monthlyPlans;
 for(let month=fromMonth+1;month<=PLAN_MONTHS;month++){
  if(month<input.history.length+1||monthlyPlans[month])continue;
  const entry=annualPlan({...input,monthlyPlans}).entries.find(e=>e.month===month);
  const plan=clearCreativeActions(scalePaidPlan(source.plan,CHANNELS,reference.metrics.budget,entry?.metrics?.budget??reference.metrics.budget));
  monthlyPlans[month]={productId:source.productId,plan};
 }
 return monthlyPlans;
}
