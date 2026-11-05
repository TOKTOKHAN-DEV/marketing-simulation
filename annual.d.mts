import type{Business,Product,Plan,Memory,Campaign,Metrics,MonthlyPlan}from'./src/types';
export const PLAN_MONTHS:12;
export type AnnualEntry={month:number;productId:string;product?:Product;plan:Plan;metrics:Metrics|null;memoryBefore:Memory;status:'executed'|'planned'|'empty';problem:string|null};
export type AnnualInput={business:Business|null;products:Product[];history:Campaign[];monthlyPlans?:Record<string,MonthlyPlan>;productId:string;legacyPlan?:Plan};
export function annualPlan(input:AnnualInput):{entries:AnnualEntry[];metrics:Metrics[];nextMonth:number};
export function fillAnnualPlans(input:AnnualInput,fromMonth:number,source:MonthlyPlan):Record<string,MonthlyPlan>;
