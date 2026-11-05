import type {Business,Product,Plan,Memory,Campaign} from './src/types';
export type ReplayRecord={id:string;month:number;stage:number;businessSnapshot:Business;productSnapshot:Product;productsSnapshot?:Product[];plan:Plan};
export type ReplayResult=Pick<Campaign,'id'|'round'|'plan'|'metrics'|'forecast'|'memoryBefore'|'memoryAfter'>;
export type ReplayError={month:number;message:string};
export function replayRecords(records:ReplayRecord[],memoryBefore:Memory):{records:ReplayResult[];error:ReplayError|null};
export function planForRecord(record:Campaign):Plan;
export function revisionPayload(history:Campaign[],drafts:Record<string,Plan>,workshopId?:string):{workshopId:string;fromMonth:number;memoryBefore:Memory;records:ReplayRecord[]}|null;
export function mergeRevision(history:Campaign[],records:ReplayResult[],revisedAt?:string):Campaign[];
export function previewRevision(history:Campaign[],drafts:Record<string,Plan>):{history:Campaign[];error:ReplayError|null;fromMonth:number|null;affected:number;changed:number};
