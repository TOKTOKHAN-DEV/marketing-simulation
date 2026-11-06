import {enableReinvestment} from '../funding.mjs';
import { CHANNELS, AD_IDS, CREATIVE_IDS, adFormatsFor, INDUSTRIES, TEAM_LEVELS } from '../model.mjs';
import { GameState, newState } from './types';

const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown)=>typeof v==='string';
const finite=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
const team=(v:unknown)=>record(v)&&Number.isInteger(v.headcount)&&finite(v.headcount)&&Number(v.headcount)<=50&&finite(v.hoursPerPerson)&&Number(v.hoursPerPerson)<=240&&Object.hasOwn(TEAM_LEVELS,String(v.performance))&&finite(v.awarenessRetention)&&Number(v.awarenessRetention)<=100;
const budgetPolicy=(v:unknown)=>record(v)&&finite(v.baseBudget)&&Number.isInteger(v.baseBudget)&&Number(v.baseBudget)<=100000000&&finite(v.reinvestmentRate)&&Number(v.reinvestmentRate)<=1;
const business=(v:unknown)=>record(v)&&text(v.id)&&text(v.name)&&INDUSTRIES.some(i=>i.id===v.industry)&&['B2C','B2B','B2B2C','B2G'].includes(v.market as string)&&text(v.audience)&&(v.budgetPolicy===undefined||budgetPolicy(v.budgetPolicy))&&(v.marketingTeam===undefined||team(v.marketingTeam));
const product=(v:unknown)=>record(v)&&text(v.id)&&text(v.businessId)&&text(v.name)&&finite(v.price)&&Number(v.price)>=1000&&Number(v.price)<=100000000&&Number.isInteger(v.price)&&['oneoff','repeat','service','subscription'].includes(v.purchaseType as string)&&text(v.value)&&(v.purchaseType!=='service'||(finite(v.hoursPerOrder)&&Number(v.hoursPerOrder)>=.25&&finite(v.monthlyHours)))&&(v.churnRate===undefined||(finite(v.churnRate)&&Number(v.churnRate)<=100))&&(v.priceEstimated===undefined||typeof v.priceEstimated==='boolean')&&(v.templateGenerated===undefined||typeof v.templateGenerated==='boolean')&&(v.involvement===undefined||['low','high'].includes(String(v.involvement)))&&(v.repurchasePossible===undefined||typeof v.repurchasePossible==='boolean')&&(v.canSponsor===undefined||typeof v.canSponsor==='boolean')&&(v.sponsorshipCost===undefined||(finite(v.sponsorshipCost)&&Number.isInteger(v.sponsorshipCost)&&Number(v.sponsorshipCost)<=100000000));
const creativeMemory=(v:unknown)=>record(v)&&Object.values(v).every(row=>record(row)&&Object.entries(row).every(([id,c])=>CREATIVE_IDS.includes(id)&&record(c)&&finite(c.age)&&Number.isInteger(c.age)&&Number(c.age)<=1000&&['image','video'].includes(String(c.format))&&finite(c.quality)&&Number(c.quality)>=.8&&Number(c.quality)<=1.2&&finite(c.lastRefreshMonth)&&Number.isInteger(c.lastRefreshMonth)));
const campaigns=(v:unknown)=>record(v)&&Object.entries(v).every(([id,c])=>AD_IDS.includes(id)&&record(c)&&(c.keyword===undefined||['purchase','explore'].includes(String(c.keyword)))&&(c.format===undefined||adFormatsFor(id).includes(c.format as 'image'|'video'))&&(c.refreshMonths===undefined||[0,1,2,3].includes(Number(c.refreshMonths))&&typeof c.refreshMonths==='number')&&(c.refreshNow===undefined||typeof c.refreshNow==='boolean')&&(c.skipRefresh===undefined||typeof c.skipRefresh==='boolean')&&!(c.refreshNow&&c.skipRefresh));
const strategyMemory=(v:unknown)=>record(v)&&Object.values(v).every(s=>{if(!record(s))return false;const shares=s.shares;return finite(s.adPressure)&&Number(s.adPressure)<=1&&finite(s.concentrationMonths)&&Number.isInteger(s.concentrationMonths)&&record(shares)&&['search','display','influencer','content'].every(k=>finite(shares[k])&&Number(shares[k])<=1);});
const serviceQueue=(q:unknown)=>record(q)&&finite(q.pendingOrders)&&Number.isInteger(q.pendingOrders)&&finite(q.progressHours)&&finite(q.marketingShare)&&Number(q.marketingShare)<=1&&finite(q.performanceShare)&&Number(q.performanceShare)<=Number(q.marketingShare)&&(q.commissionRate===undefined||(finite(q.commissionRate)&&Number(q.commissionRate)<=.5))&&(q.groupBuyCommissionRate===undefined||(finite(q.groupBuyCommissionRate)&&Number(q.groupBuyCommissionRate)<=.25));
const memory=(v:unknown)=>record(v)&&['awareness','trust','advocacy','organicAssets','customers','month'].every(k=>finite(v[k]))&&(v.lastRevenue===undefined||(finite(v.lastRevenue)&&Number(v.lastRevenue)<=1e18))&&(v.adCreatives===undefined||creativeMemory(v.adCreatives))&&(v.contentPublished===undefined||publication(v.contentPublished))&&(v.ownedAwareness===undefined||(finite(v.ownedAwareness)&&Number(v.ownedAwareness)<=Number(v.awareness)+.01))&&(v.strategyStates===undefined||strategyMemory(v.strategyStates))&&record(v.productCustomers)&&Object.values(v.productCustomers).every(finite)&&(v.serviceQueues===undefined||(record(v.serviceQueues)&&Object.values(v.serviceQueues).every(serviceQueue)));
const publication=(v:unknown)=>record(v)&&Object.values(v).every(row=>record(row)&&Object.entries(row).every(([id,n])=>CHANNELS.some(c=>c.id===id)&&finite(n)&&Number.isInteger(n)));
const plan=(v:unknown)=>record(v)&&finite(v.budget)&&text(v.hypothesis)&&(v.campaigns===undefined||campaigns(v.campaigns))&&record(v.units)&&Object.entries(v.units).every(([id,n])=>CHANNELS.some(c=>c.id===id)&&finite(n)&&Number.isInteger(n))&&(v.cadence===undefined||(record(v.cadence)&&Object.entries(v.cadence).every(([id,c])=>CHANNELS.some(k=>k.id===id&&k.group!=='performance')&&['monthly','once'].includes(String(c)))))&&(v.rates===undefined||(record(v.rates)&&Object.entries(v.rates).every(([id,n])=>{const c=CHANNELS.find(c=>c.id===id);return !!c?.minCost&&finite(n)&&Number(n)>=c.minCost&&Number(n)<=c.maxCost!;})))&&(v.seeding===undefined||(record(v.seeding)&&['gift','paid','referral'].includes(String(v.seeding.mode))&&finite(v.seeding.fee)&&finite(v.seeding.commission)&&Number(v.seeding.commission)<=50));
const funding=(v:unknown)=>record(v)&&['fixed','reinvestment'].includes(String(v.mode))&&['baseBudget','reinvestmentRate','previousRevenue','reinvestmentAmount','availableBudget'].every(k=>finite(v[k]))&&Number(v.reinvestmentRate)<=1&&(v.nextBudget===undefined||finite(v.nextBudget));
const metrics=(v:unknown,preview=false)=>record(v)&&['month','budget','spend','marketingVisits','organicVisits','referralVisits','visits','leadRate','leads','retentionRate','retained','closeRate','newOrders','repeatOrders','orders','revenue','attributedRevenue','organicRevenue','priceLeadMultiplier','priceCloseMultiplier'].every(k=>finite(v[k]))&&(preview?typeof v.unallocated==='number'&&Number.isFinite(v.unallocated):finite(v.unallocated))&&(v.funding===undefined||funding(v.funding))&&['roas','mer','performanceRoas','cpa','cpc'].every(k=>v[k]===null||finite(v[k]))&&(v.referralConversionRate===undefined||(finite(v.referralConversionRate)&&Number(v.referralConversionRate)<=1))&&(v.groupBuyFee===undefined||finite(v.groupBuyFee))&&(v.groupBuyRevenue===undefined||finite(v.groupBuyRevenue))&&text(v.narrative)&&memory(v.memoryAfter)&&(v.productSales===undefined||(Array.isArray(v.productSales)&&v.productSales.every(p=>record(p)&&text(p.productId)&&text(p.name)&&finite(p.revenue)&&finite(p.newOrders)&&finite(p.mrr)&&['oneoff','repeat','service','subscription'].includes(p.salesModel as string))))&&Array.isArray(v.channels)&&v.channels.every(c=>record(c)&&text(c.id)&&text(c.name)&&finite(c.spend)&&finite(c.units));
export function validState(v:unknown):v is GameState {
  if(!record(v)||v.version!==2||!(v.business===null||business(v.business))||!Array.isArray(v.products)||v.products.length>50||!v.products.every(product)||!text(v.productId)||!record(v.plans)||!Object.values(v.plans).every(plan)||!Array.isArray(v.history)||!['dashboard','mix','projection','business'].includes(v.view as string)||!Number.isInteger(v.stage)||Number(v.stage)<1||Number(v.stage)>4||!['notes','reflection','nextAction'].every(k=>text(v[k])))return false;
  if(v.planningMonth!==undefined&&(!Number.isInteger(v.planningMonth)||Number(v.planningMonth)<1||Number(v.planningMonth)>12))return false;
  if(record(v.deletedProduct)&&v.deletedProduct.monthlyPlans!==undefined&&(!record(v.deletedProduct.monthlyPlans)||Object.entries(v.deletedProduct.monthlyPlans).some(([month,slot])=>!/^([1-9]|1[0-2])$/.test(month)||!record(slot)||!text(slot.productId)||!plan(slot.plan))))return false;
  if(v.monthlyPlans!==undefined&&(!record(v.monthlyPlans)||Object.entries(v.monthlyPlans).some(([month,slot])=>!/^([1-9]|1[0-2])$/.test(month)||!record(slot)||!text(slot.productId)||!plan(slot.plan))))return false;
  if(v.projectionScaleBudget!==undefined&&typeof v.projectionScaleBudget!=='boolean')return false;
  if(v.productsInitialized!==undefined&&typeof v.productsInitialized!=='boolean')return false;
  if(v.deletedProduct!==undefined&&(!record(v.deletedProduct)||!record(v.deletedProduct.product)||!product(v.deletedProduct.product)||!Number.isInteger(v.deletedProduct.index)||Number(v.deletedProduct.index)<0||Number(v.deletedProduct.index)>49||typeof v.deletedProduct.wasSelected!=='boolean'||!record(v.business)||v.deletedProduct.product.businessId!==v.business.id))return false;
  if(v.businessSessions!==undefined&&(!record(v.businessSessions)||Object.values(v.businessSessions).some(s=>!record(s)||!business(s.business)||Object.hasOwn(s,'businessSessions')||!validState({...s,version:2,stage:1,view:'business',businessSessions:undefined}))))return false;
  if(v.projectionHorizon!==undefined&&v.projectionHorizon!==3&&v.projectionHorizon!==6)return false;
  if(v.outlook!==undefined&&(!record(v.outlook)||Object.values(v.outlook).some(rows=>!Array.isArray(rows)||rows.length>6||!rows.every(row=>record(row)&&Number.isInteger(row.owned)&&finite(row.owned)&&Number(row.owned)<=2000&&finite(row.adPercent)&&[0,25,50,75,100].includes(Number(row.adPercent))&&(row.creativeAction===undefined||['auto','refresh','reuse'].includes(String(row.creativeAction)))))))return false;
  const history=v.history;
  const validHistory=(rows:unknown)=>Array.isArray(rows)&&rows.every(r=>record(r)&&text(r.id)&&business(r.businessSnapshot)&&product(r.productSnapshot)&&plan(r.plan)&&Number.isInteger(r.stage)&&Number(r.stage)>=1&&Number(r.stage)<=4&&memory(r.memoryBefore)&&memory(r.memoryAfter)&&metrics(r.metrics)&&Array.isArray(r.forecast)&&r.forecast.every(m=>metrics(m,true)));
  if(v.editingCampaignId!==undefined&&(!text(v.editingCampaignId)||!history.some(r=>record(r)&&r.id===v.editingCampaignId)))return false;
  if(v.historyDrafts!==undefined&&(!record(v.historyDrafts)||!Object.values(v.historyDrafts).every(plan)||Object.keys(v.historyDrafts).some(id=>!history.some(r=>record(r)&&r.id===id))))return false;
  if(v.revisionUndo!==undefined&&(!record(v.revisionUndo)||!text(v.revisionUndo.revisedAt)||!validHistory(v.revisionUndo.history)))return false;
  return validHistory(v.history);
}

function industryFromLegacy(label:string) {
  if(/뷰티|패션/.test(label))return 'beauty';
  if(/식|음료|외식/.test(label))return 'food';
  if(/IT|SaaS|소프트웨어/i.test(label))return 'saas';
  if(/교육|강의/.test(label))return 'education';
  if(/제조|산업/.test(label))return 'manufacturing';
  if(/컨설팅|서비스|금융/.test(label))return 'professional';
  if(/여행|관광/.test(label))return 'travel';
  if(/커머스|리빙|라이프|유통/.test(label))return 'commerce';
  return 'other';
}
export function migrateLegacy(raw:unknown):GameState {
  const state=newState();
  if(!record(raw)||raw.version!==1)return state;
  state.legacyArchive=raw;
  if(text(raw.notes))state.notes=raw.notes;
  if(text(raw.reflection))state.reflection=raw.reflection;
  if(text(raw.nextAction))state.nextAction=raw.nextAction;
  const p=raw.profile;
  if(record(p)&&text(p.name)&&text(p.industry)&&text(p.product)&&finite(p.price)) {
    state.business={id:'migrated-business',name:p.name as string,industry:industryFromLegacy(p.industry as string),market:['B2B','B2B2C'].includes(p.market as string)?p.market as 'B2B'|'B2B2C':'B2C',audience:text(p.audience)?p.audience as string:''};
    state.products=[{id:'migrated-product',businessId:state.business.id,name:p.product as string,price:Number(p.price),purchaseType:'oneoff',value:text(p.problem)?p.problem as string:''}];
    state.productId=state.products[0].id;
  }
  return state;
}
export function migrateMonthlyDrafts(state:GameState):GameState {
  const plans={...state.plans};
  for(const product of state.products){
    const key=`${product.id}:monthly`;
    if(plans[key])continue;
    const legacy=plans[`${product.id}:${Math.min(state.stage,3)}`]||[3,2,1].map(stage=>plans[`${product.id}:${stage}`]).find(Boolean);
    if(legacy)plans[key]=structuredClone(legacy);
  }
  return{...state,plans};
}
export function loadGame(workshopId:string):GameState {
  const current=localStorage.getItem(`marketing-quest:v2:${workshopId}`);
  if(current){const state:unknown=JSON.parse(current);if(!validState(state))throw new Error('저장된 기록의 형식을 확인할 수 없어요. 원본은 보존되어 있습니다.');return enableReinvestment(migrateMonthlyDrafts(state));}
  const previous=localStorage.getItem(`marketing-quest:v1:${workshopId}`);
  return enableReinvestment(previous?migrateLegacy(JSON.parse(previous)):newState());
}

export function restartGame(workshopId:string):GameState {
  const key=`marketing-quest:v2:${workshopId}`,legacyKey=`marketing-quest:v1:${workshopId}`;
  const previous=localStorage.getItem(key),legacy=localStorage.getItem(legacyKey),fresh=newState();
  try{
    localStorage.setItem(key,JSON.stringify(fresh));
    localStorage.removeItem(legacyKey);
  }catch(error){
    // Keep the visible game and its durable source together if a storage write fails.
    try{if(previous===null)localStorage.removeItem(key);else localStorage.setItem(key,previous);if(legacy!==null)localStorage.setItem(legacyKey,legacy);}catch{}
    throw error;
  }
  return fresh;
}
