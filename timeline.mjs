import {project,validateCampaign} from './model.mjs';

// Replay only from the earliest changed month; earlier stored results remain exact.
export function replayRecords(records,memoryBefore) {
 let memory=structuredClone(memoryBefore);const results=[],ids=new Set();
 for(const record of records){
  const month=memory?.month+1;
  if(!record||typeof record.id!=='string'||!record.id.trim()||record.id.length>100||ids.has(record.id)||!Number.isInteger(record.stage)||record.stage<1||record.stage>4||record.month!==month)return{records:results,error:{month:Number.isFinite(month)?month:0,message:'월별 기록의 순서나 식별자를 확인해주세요.'}};
  ids.add(record.id);
  const input={business:record.businessSnapshot,product:record.productSnapshot,products:record.productsSnapshot,plan:record.plan,memory,stage:record.stage};
  const problem=validateCampaign(input);
  if(problem)return{records:results,error:{month,message:problem}};
  const forecast=project(input,3),metrics=forecast[0];
  results.push({id:record.id,round:month,plan:structuredClone(record.plan),metrics,forecast,memoryBefore:structuredClone(memory),memoryAfter:metrics.memoryAfter});
  memory=metrics.memoryAfter;
 }
 return{records:results,error:null};
}

const businessFields=['id','name','industry','market','audience','marketingTeam'];
const productFields=['id','businessId','name','price','purchaseType','value','hoursPerOrder','monthlyHours','churnRate','canSponsor','sponsorshipCost'];
const pick=(object,fields)=>Object.fromEntries(fields.filter(key=>object[key]!==undefined).map(key=>[key,object[key]]));
// Legacy once-only plans stored requested totals, not that month's executed quantity.
export function planForRecord(record) {
 const {cadence,...plan}=structuredClone(record.plan);
 for(const[id,mode]of Object.entries(cadence||{}))if(mode==='once')plan.units[id]=record.metrics.channels.find(c=>c.id===id)?.units||0;
 return plan;
}
export function revisionPayload(history,drafts,workshopId='') {
 const index=history.findIndex(h=>drafts[h.id]&&JSON.stringify(drafts[h.id])!==JSON.stringify(planForRecord(h)));
 if(index<0)return null;
 return{workshopId,fromMonth:history[index].metrics.month,memoryBefore:structuredClone(history[index].memoryBefore),records:history.slice(index).map(h=>({id:h.id,month:h.metrics.month,stage:h.stage,businessSnapshot:pick(h.businessSnapshot,businessFields),productSnapshot:pick(h.productSnapshot,productFields),...(h.productsSnapshot?{productsSnapshot:h.productsSnapshot.map(p=>pick(p,productFields))}:{}),plan:structuredClone(drafts[h.id]||planForRecord(h))}))};
}
export function mergeRevision(history,records,revisedAt) {
 const byId=new Map(records.map(r=>[r.id,r]));
 return history.map(h=>byId.has(h.id)?{...h,...byId.get(h.id),...(revisedAt?{revisedAt}:{})}:h);
}
export function previewRevision(history,drafts) {
 const payload=revisionPayload(history,drafts);
 if(!payload)return{history,error:null,fromMonth:null,affected:0,changed:0};
 const result=replayRecords(payload.records,payload.memoryBefore);
 return{history:mergeRevision(history,result.records),error:result.error,fromMonth:payload.fromMonth,affected:payload.records.length,changed:payload.records.filter(r=>drafts[r.id]&&JSON.stringify(r.plan)!==JSON.stringify(planForRecord(history.find(h=>h.id===r.id)))).length};
}
