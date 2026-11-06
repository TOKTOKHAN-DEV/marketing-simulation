import type{Business,Plan,Memory,Campaign,Channel,GameState,BudgetPolicy,Funding}from './src/types';
export const DEFAULT_BUDGET_POLICY:BudgetPolicy;
export function budgetFor(business:Business|null,plan:Plan,memory:Memory):Funding;
export function allocationBudget(funding:Funding):number;
export function memoryForHistory(history:Campaign[],fallback:Memory):Memory;
export function scalePaidPlan(plan:Plan,channels:Channel[],baseBudget:number,currentBudget:number):Plan;
export function enableReinvestment(state:GameState):GameState;
