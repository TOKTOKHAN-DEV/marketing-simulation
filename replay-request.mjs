import {replayRecords} from './timeline.mjs';
export function replayRequest(body,config) {
 if(!body||body.workshopId!==config.workshopId)return{status:409,error:'워크숍이 변경됐어요. 새로고침해주세요.'};
 if(config.openStage===0)return{status:403,error:'워크숍이 아직 시작되지 않았어요.'};
 if(!Array.isArray(body.records)||!body.records.length||!Number.isInteger(body.fromMonth)||body.fromMonth<1||!body.memoryBefore||body.memoryBefore.month!==body.fromMonth-1)return{status:400,error:'재계산할 시작 월과 기록을 확인해주세요.'};
 const result=replayRecords(body.records,body.memoryBefore);
 if(result.error)return{status:400,error:result.error.message,month:result.error.month};
 return{status:200,fromMonth:body.fromMonth,records:result.records,revisedAt:new Date().toISOString()};
}
