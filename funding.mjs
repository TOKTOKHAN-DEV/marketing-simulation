export const DEFAULT_BUDGET_POLICY={baseBudget:5000000,reinvestmentRate:.4};
export function budgetFor(business,plan,memory){
 const policy=business?.budgetPolicy;
 const previousRevenue=memory.month>0?(memory.lastRevenue??0):0;
 const baseBudget=policy?.baseBudget??plan.budget;
 const reinvestmentRate=policy?.reinvestmentRate??0;
 const reinvestmentAmount=policy?Math.floor(previousRevenue*reinvestmentRate):0;
 return{mode:policy?'reinvestment':'fixed',baseBudget,reinvestmentRate,previousRevenue,reinvestmentAmount,availableBudget:baseBudget+reinvestmentAmount};
}
export function memoryForHistory(history,fallback){
 const last=history.at(-1);if(!last)return fallback;
 const revenue=last.metrics.companyRevenue??last.metrics.revenue;
 return last.memoryAfter.lastRevenue===revenue?last.memoryAfter:{...last.memoryAfter,lastRevenue:revenue};
}
// Only future previews scale purchased placements. Actual monthly execution keeps the chosen quantities.
export function scalePaidPlan(plan,channels,baseBudget,currentBudget){
 const factor=baseBudget>0?currentBudget/baseBudget:1;
 return{...plan,units:Object.fromEntries(Object.entries(plan.units).map(([id,n])=>{
  const c=channels.find(c=>c.id===id),paid=c&&c.ownership!=='owned'&&id!=='influencer-seeding';
  return[id,paid?Math.max(0,Math.min(2000,Math.floor(n*factor+1e-9))):n];
 }))};
}
// Upgrade active/saved companies; historical snapshots retain their original fixed-budget rules.
export function enableReinvestment(state){
 const business=state.business?{...state.business,budgetPolicy:state.business.budgetPolicy??{...DEFAULT_BUDGET_POLICY}}:null;
 const businessSessions=state.businessSessions?Object.fromEntries(Object.entries(state.businessSessions).map(([key,s])=>[key,{...s,business:{...s.business,budgetPolicy:s.business.budgetPolicy??{...DEFAULT_BUDGET_POLICY}}}])):undefined;
 return{...state,business,...(businessSessions?{businessSessions}:{})};
}
