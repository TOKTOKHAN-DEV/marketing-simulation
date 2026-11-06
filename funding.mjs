export const DEFAULT_BUDGET_POLICY={mode:'cash',baseBudget:3000000,reinvestmentRate:.3,totalBudget:36000000};
export function budgetFor(business,plan,memory){
 const policy=business?.budgetPolicy;
 const previousRevenue=memory.month>0?(memory.lastRevenue??0):0;
 const baseBudget=policy?.baseBudget??plan.budget;
 const reinvestmentRate=policy?.reinvestmentRate??0;
 const reinvestmentAmount=policy?Math.floor(previousRevenue*reinvestmentRate):0;
 if(policy?.mode==='cash'){
  const cumulativeRevenue=memory.month>0?(memory.cumulativeRevenue??0):0,cumulativeSpend=memory.month>0?(memory.cumulativeSpend??0):0;
  return{mode:'cash',baseBudget,reinvestmentRate,previousRevenue,reinvestmentAmount,totalBudget:policy.totalBudget,cumulativeRevenue,cumulativeSpend,recommendedBudget:baseBudget+reinvestmentAmount,availableBudget:Math.max(0,policy.totalBudget+cumulativeRevenue-cumulativeSpend)};
 }
 return{mode:policy?'reinvestment':'fixed',baseBudget,reinvestmentRate,previousRevenue,reinvestmentAmount,availableBudget:baseBudget+reinvestmentAmount};
}
export function memoryForHistory(history,fallback){
 const last=history.at(-1);if(!last)return fallback;
 const revenue=last.metrics.companyRevenue??last.metrics.revenue;
 const cumulativeRevenue=history.reduce((sum,r)=>sum+(r.metrics.companyRevenue??r.metrics.revenue),0),cumulativeSpend=history.reduce((sum,r)=>sum+r.metrics.spend,0);
 return{...last.memoryAfter,lastRevenue:revenue,cumulativeRevenue,cumulativeSpend};
}
export const allocationBudget=funding=>Math.min(funding.recommendedBudget??funding.availableBudget,funding.availableBudget);
// Only future previews scale purchased placements. Actual monthly execution keeps the chosen quantities.
export function scalePaidPlan(plan,channels,baseBudget,currentBudget){
 const factor=baseBudget>0?currentBudget/baseBudget:1;
 return{...plan,units:Object.fromEntries(Object.entries(plan.units).map(([id,n])=>{
  const c=channels.find(c=>c.id===id),paid=c&&c.ownership!=='owned'&&!c.commissionRate&&id!=='influencer-seeding';
  const step=c?.group==='performance'&&!c.maxUnits?10:1;
  return[id,paid&&factor!==1?Math.max(0,Math.min(c.maxUnits??2000,Math.floor(n*factor/step+1e-9)*step)):n];
 }))};
}
// Upgrade active/saved companies; historical snapshots retain their original fixed-budget rules.
export function enableReinvestment(state){
 const upgrade=b=>({...b,budgetPolicy:b.budgetPolicy?.mode==='cash'?b.budgetPolicy:{...DEFAULT_BUDGET_POLICY}});
 const business=state.business?upgrade(state.business):null;
 const businessSessions=state.businessSessions?Object.fromEntries(Object.entries(state.businessSessions).map(([key,s])=>[key,{...s,business:upgrade(s.business)}])):undefined;
 return{...state,business,...(businessSessions?{businessSessions}:{})};
}
