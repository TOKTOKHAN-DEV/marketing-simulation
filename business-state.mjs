import {industryFor} from './model.mjs';
const normalize=s=>s.normalize('NFKC').toLowerCase().replace(/주식회사|\(주\)|㈜|[\p{P}\p{Z}\s]/gu,'');
export const businessKey=b=>b.catalogCompanyId?`catalog:${b.catalogCompanyId}`:`manual:${normalize(b.name)}`;
const SESSION_FIELDS=['business','products','productId','plans','history','notes','reflection','nextAction','editingCampaignId','historyDrafts','revisionUndo','projectionHorizon','outlook','productsInitialized','deletedProduct'];
const sessionOf=state=>Object.fromEntries(SESSION_FIELDS.filter(k=>state[k]!==undefined).map(k=>[k,structuredClone(state[k])]));
const sectorProducts={
 commerce:[['대표 생활 상품','oneoff','핵심 고객의 일상 문제를 해결하는 대표 상품'],['실속 묶음 세트','oneoff','대표 상품을 함께 구성한 묶음 상품']],
 beauty:[['데일리 케어 제품','oneoff','일상 관리에 사용하는 뷰티 제품'],['프리미엄 케어 세트','oneoff','여러 제품으로 구성한 케어 패키지']],
 food:[['대표 식품 패키지','oneoff','핵심 고객의 취향을 반영한 식품'],['식품 묶음 세트','oneoff','반복 구매를 고려한 식품 세트']],
 education:[['입문 교육 프로그램','service','핵심 고객을 위한 수업과 교육 과정'],['월간 학습 콘텐츠','subscription','정기적으로 제공하는 학습 자료와 콘텐츠']],
 saas:[['소프트웨어 월 이용 플랜','subscription','핵심 업무를 돕는 소프트웨어'],['도입·연동 구축 서비스','service','고객의 업무 환경에 맞춘 초기 구축']],
 manufacturing:[['맞춤 제조 제품','oneoff','사용 환경에 맞춰 공급하는 제조 제품'],['설계·설치 지원','service','제품 도입을 위한 설계와 설치 지원']],
 professional:[['전문 서비스 프로젝트','service','고객의 과제를 해결하는 프로젝트'],['월간 자문 서비스','subscription','고객에게 정기적으로 제공하는 자문']],
 travel:[['여행 체험 패키지','service','여행 준비와 현지 경험을 지원하는 프로그램'],['여행 준비 상품','oneoff','여행 준비에 필요한 상품']],
 other:[['대표 상품','oneoff','핵심 고객의 문제를 해결하는 대표 상품'],['맞춤 서비스','service','고객 상황에 맞춘 서비스']]
};
export function starterProducts(business,catalogProducts=[],makeId=()=>crypto.randomUUID()){
 const ref=industryFor(business.industry).referencePrice;
 const rows=catalogProducts.length?catalogProducts:(sectorProducts[business.industry]||sectorProducts.other).map(([name,purchaseType,description],i)=>({id:`industry:${business.industry}:${i}`,name,purchaseType,description,price:null,availability:'draft',draftBasis:'선택한 업종의 일반적인 판매 구조를 바탕으로 생성한 상품 초안입니다. 실제 출시 상품·판매 가격이 아닙니다.'}));
 return rows.slice(0,50).map((p,i)=>{
  const sample=p.purchaseType==='subscription'?Math.max(10000,Math.round(ref*.2/1000)*1000):p.purchaseType==='service'?ref*3:ref*(i===0?1:2);
  const price=p.price??sample;
  return{id:makeId(),businessId:business.id,name:p.name,price,purchaseType:p.purchaseType,value:p.description,templateGenerated:true,priceEstimated:p.price==null,
   ...(p.purchaseType==='service'?{hoursPerOrder:business.industry==='education'||business.industry==='travel'?8:40,monthlyHours:160}:{}),...(p.purchaseType==='subscription'?{churnRate:5}:{}),
   repurchasePossible:['food','beauty','commerce'].includes(business.industry)&&p.purchaseType==='oneoff',canSponsor:p.purchaseType==='oneoff',sponsorshipCost:p.purchaseType==='oneoff'?Math.round(price*.3):0,
   catalogProductId:p.id,sourceAvailability:p.availability||'draft',...(p.sourceUrl?{sourceUrl:p.sourceUrl}:{}),sourceBasis:p.draftBasis,
   sourceNote:[p.priceNote,p.price==null?'가격·투입 시간·해지율은 교육용 예시입니다. 실제 판매 조건에 맞춰 수정해주세요.':'공개 표시 가격을 불러왔습니다. 투입 시간·해지율은 교육용 예시입니다.'].filter(Boolean).join(' '),...(p.checkedAt?{sourceCheckedAt:p.checkedAt}:{})};
 });
}
export function saveBusinessState(state,incoming,templates=[],makeId=()=>crypto.randomUUID()){
 const same=state.business&&(businessKey(state.business)===businessKey(incoming)||(!state.business.catalogCompanyId&&normalize(state.business.name)===normalize(incoming.name)));
 if(same){
  const business={...incoming,id:state.business.id};
  const refreshIndustry=state.business.industry!==business.industry&&!business.catalogCompanyId;
  let products=state.products;
  if(refreshIndustry&&products.some(p=>p.templateGenerated))products=[...starterProducts(business,templates,makeId),...products.filter(p=>!p.templateGenerated)].slice(0,50);
  else if(!state.productsInitialized&&products.length===0)products=starterProducts(business,templates,makeId);
  return{...state,business,products,productId:products.some(p=>p.id===state.productId)?state.productId:products[0]?.id||'',productsInitialized:true,view:'business',editingCampaignId:undefined};
 }
 const businessSessions={...state.businessSessions};
 if(state.business)businessSessions[businessKey(state.business)]=sessionOf(state);
 const stored=businessSessions[businessKey(incoming)];
 delete businessSessions[businessKey(incoming)];
 const business=stored?{...incoming,id:stored.business.id}:{...incoming,id:makeId()};
 const target=stored?{...structuredClone(stored),business}:{business,products:starterProducts(business,templates,makeId),productId:'',plans:{},history:[],notes:'',reflection:'',nextAction:'',productsInitialized:true};
 return{...state,...Object.fromEntries(SESSION_FIELDS.map(k=>[k,undefined])),...target,productId:target.products.some(p=>p.id===target.productId)?target.productId:target.products[0]?.id||'',businessSessions,view:'business',editingCampaignId:undefined};
}
export function activateBusiness(state,key){
 if(state.business&&businessKey(state.business)===key)return state;
 const target=state.businessSessions?.[key];
 return target?saveBusinessState(state,target.business):state;
}
export function deleteProduct(state,id){
 const index=state.products.findIndex(p=>p.id===id);if(index<0)return state;
 const products=state.products.filter(p=>p.id!==id),product=state.products[index];
 return{...state,products,productsInitialized:true,productId:state.productId===id?(products[Math.min(index,products.length-1)]?.id||''):state.productId,editingCampaignId:undefined,deletedProduct:{product:structuredClone(product),index,wasSelected:state.productId===id}};
}
export function restoreProduct(state){
 const deleted=state.deletedProduct;if(!deleted||state.products.length>=50)return state;
 if(state.products.some(p=>p.id===deleted.product.id))return{...state,deletedProduct:undefined};
 const products=[...state.products];products.splice(deleted.index,0,deleted.product);
 return{...state,products,productId:deleted.wasSelected?deleted.product.id:state.productId,deletedProduct:undefined};
}
