import type{Business,Product,GameState}from './src/types';
export function businessKey(business:Business):string;
export function starterProducts(business:Business,catalogProducts?:{id:string;name:string;purchaseType:Product['purchaseType'];description:string;price:number|null;availability?:'listed'|'introduced'|'draft';sourceUrl?:string|null;draftBasis?:string;priceNote?:string;checkedAt?:string}[],makeId?:()=>string):Product[];
export function saveBusinessState(state:GameState,business:Business,templates?:Parameters<typeof starterProducts>[1],makeId?:()=>string):GameState;
export function activateBusiness(state:GameState,key:string):GameState;
export function deleteProduct(state:GameState,id:string):GameState;
export function restoreProduct(state:GameState):GameState;
