// Workshop scenarios, not empirical market coefficients. No stage or calendar locks.
const clamp=(n,lo=0,hi=1)=>Math.max(lo,Math.min(hi,n));
const round=n=>Math.round(n*1000)/1000;
export const STRATEGY_RULES={seedingAwareness:20,seedingTrust:25,highSeedingAwareness:25,highSeedingTrust:35,hourValue:25000};
export function productProfile(product,referencePrice=100000){
 const involvement=product.involvement??(product.purchaseType==='service'||product.price>=referencePrice*3?'high':'low');
 return{involvement,high:involvement==='high',repurchasable:product.purchaseType==='subscription'||(product.purchaseType!=='service'&&(product.repurchasePossible??product.purchaseType==='repeat'))};
}
export function seedingEligibility(product,memory,referencePrice){
 const profile=productProfile(product,referencePrice),awareness=profile.high?STRATEGY_RULES.highSeedingAwareness:STRATEGY_RULES.seedingAwareness,trust=profile.high?STRATEGY_RULES.highSeedingTrust:STRATEGY_RULES.seedingTrust;
 return{eligible:memory.awareness>=awareness&&memory.trust>=trust,awareness,trust};
}
export function growthStrategy(product,memory,channels,referencePrice){
 const profile=productProfile(product,referencePrice),gate=seedingEligibility(product,memory,referencePrice);
 const shares={search:0,display:0,influencer:0,content:0};
 for(const c of channels){const key=c.id==='search'?'search':c.group==='performance'?'display':c.group==='influencer'?'influencer':'content';shares[key]+=c.spend+c.workHours*STRATEGY_RULES.hourValue;}
 const total=Object.values(shares).reduce((a,b)=>a+b,0);for(const k in shares)shares[k]=total?shares[k]/total:0;
 const previous=memory.strategyStates?.[product.id]??{adPressure:0,concentrationMonths:0,shares:{search:0,display:0,influencer:0,content:0}};
 const adShare=shares.search+shares.display,foundation=clamp(Math.min(memory.awareness/50,memory.trust/50,memory.organicAssets/25));
 const change=Object.keys(shares).reduce((n,k)=>n+Math.abs(shares[k]-(previous.shares[k]||0)),0)/2;
 const axes={ads:adShare,influencer:shares.influencer,content:shares.content},priorAxes={ads:(previous.shares.search||0)+(previous.shares.display||0),influencer:previous.shares.influencer||0,content:previous.shares.content||0};
 const dominant=Object.keys(axes).find(k=>axes[k]>=.8),priorDominant=Object.keys(priorAxes).find(k=>priorAxes[k]>=.8);
 const concentration=total&&dominant?(dominant===priorDominant?(previous.concentrationMonths||0)+1:1):0;
 // No reset from a cosmetic edit or a creative refresh; foundation/diversification repays debt.
 const pressure=clamp(previous.adPressure+(total===0?0:(adShare>.75?(adShare-.75)*.8*(1-foundation*.75):-.15*(shares.content+shares.influencer+.25))),0,1);
 const adMultiplier=1-previous.adPressure*.5;
 const searchBrandMultiplier=1+clamp(memory.awareness/80)*(profile.high?1.5:1);
 const ownedReach=.003+clamp(memory.awareness/50)**2*clamp(memory.trust/45);
 const relationship=clamp((memory.trust-10)/40)*clamp((memory.advocacy-3)/25);
 const phase=memory.awareness<20||memory.trust<25?'launch':!gate.eligible||memory.awareness<40||memory.trust<40?'growth':'advocacy';
 const targets=phase==='launch'?{search:0,display:2,influencer:0,content:8}:phase==='growth'?{search:2,display:2,influencer:0,content:7}:{search:2,display:1,influencer:3,content:4};
 const warnings=[];
 if(adShare>.75)warnings.push(`광고 비중 ${Math.round(adShare*100)}%: 당월 유입은 크지만 검색 자산·추천은 쌓이지 않아 장기 효율이 낮아져요.`);
 if(total&&channels.filter(c=>c.id==='owned').reduce((sum,c)=>sum+c.spend+c.workHours*STRATEGY_RULES.hourValue,0)/total>.8&&memory.awareness<20)warnings.push('초기 온드 집중은 유입·매출 회수가 늦어요. 커뮤니티·외부 발행과 DA로 발견되는 접점을 확보하세요.');
 if(concentration>=3)warnings.push(`${concentration}개월째 한 축에 집중하고 있어요. 1–2개월마다 유입·전환·잔여 예산을 비교해 재배분하세요.`);
 if(channels.some(c=>c.id==='influencer-seeding')&&!gate.eligible)warnings.push(`시딩 섭외 불가: 월초 인지도 ${gate.awareness} · 신뢰 ${gate.trust} 이상이 필요해요. 접촉 시간만 사용하고 발행·비용·유입은 0입니다.`);
 return{profile,gate,shares,phase,targets,foundation:round(foundation),adMultiplier:round(adMultiplier),searchBrandMultiplier:round(searchBrandMultiplier),ownedReach:round(ownedReach),relationship:round(relationship),change:round(change),concentrationMonths:concentration,warnings,next:{adPressure:round(pressure),concentrationMonths:concentration,shares:Object.fromEntries(Object.entries(shares).map(([k,v])=>[k,round(v)]))}};
}
