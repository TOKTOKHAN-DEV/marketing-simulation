// Workshop scenarios, not empirical market coefficients. No stage or calendar locks.
const clamp=(n,lo=0,hi=1)=>Math.max(lo,Math.min(hi,n));
const round=n=>Math.round(n*1000)/1000;
export const BRAND_RULES={contentCap:70,paidSnsCap:98,megaAwareness:50,megaTrust:50};
export const PAID_SNS_BRAND_CHANNELS=['micro','mega','mega-long'];
export const isPaidSnsBrandChannel=id=>PAID_SNS_BRAND_CHANNELS.includes(id);
export const megaEligibility=memory=>({eligible:memory.awareness>=BRAND_RULES.megaAwareness&&memory.trust>=BRAND_RULES.megaTrust,awareness:BRAND_RULES.megaAwareness,trust:BRAND_RULES.megaTrust});
export function brandGrowth({memory,ownedRetention,paidRetention,awarenessGain,ownedAwarenessGain,trustGain,paidSnsAwarenessGain,paidSnsTrustGain}){
 const pastPaidSns=Object.values(memory.contentPublished||{}).some(row=>PAID_SNS_BRAND_CHANNELS.some(id=>(row[id]||0)>0));
 const ownedBefore=Math.min(memory.ownedAwareness||0,memory.awareness),rawOwned=ownedBefore*ownedRetention,rawAwareness=rawOwned+(memory.awareness-ownedBefore)*paidRetention;
 const baseAwareness=pastPaidSns?rawAwareness:Math.min(rawAwareness,BRAND_RULES.contentCap),baseTrust=pastPaidSns?memory.trust*.98:Math.min(memory.trust*.98,BRAND_RULES.contentCap);
 const grow=(base,ordinary,paid)=>{
  const content=Math.min(Math.max(0,ordinary),Math.max(0,BRAND_RULES.contentCap-base));
  const premium=Math.min(Math.max(0,paid),Math.max(0,BRAND_RULES.paidSnsCap-base-content));
  return{value:Math.min(BRAND_RULES.paidSnsCap,base+content+premium),contentScale:ordinary?content/ordinary:0,paidScale:paid?premium/paid:0};
 };
 const a=grow(baseAwareness,awarenessGain-paidSnsAwarenessGain,paidSnsAwarenessGain),t=grow(baseTrust,trustGain-paidSnsTrustGain,paidSnsTrustGain);
 return{awareness:a.value,trust:t.value,ownedAwareness:(rawAwareness?rawOwned*baseAwareness/rawAwareness:0)+ownedAwarenessGain*a.contentScale,awarenessLoss:memory.awareness-baseAwareness,awarenessContentScale:a.contentScale,awarenessPaidScale:a.paidScale,trustContentScale:t.contentScale,trustPaidScale:t.paidScale};
}
export const STRATEGY_RULES={seedingAwareness:20,seedingTrust:25,highSeedingAwareness:25,highSeedingTrust:35,hourValue:25000,blogTarget:100,adBlogMinimum:20,snsTarget:20};
export function contentFoundation(memory){
 const totals={};for(const row of Object.values(memory.contentPublished||{}))for(const[id,n]of Object.entries(row))totals[id]=(totals[id]||0)+n;
 const blogCount=totals.owned||0,snsCount=(totals['owned-sns']||0)+(totals['owned-shortform']||0);
 const blogReady=blogCount>=STRATEGY_RULES.blogTarget,blogReadiness=clamp(blogCount/STRATEGY_RULES.blogTarget),snsReadiness=clamp(snsCount/STRATEGY_RULES.snsTarget);
 const otherAssets=(totals.platform||0)*.12+((totals.cafe||0)+(totals.newsletter||0))*.04,snsAssets=snsCount*.04,totalAssets=blogCount+otherAssets+snsAssets;
 const maintenance=.35+.65*clamp(memory.organicAssets/Math.max(1,totalAssets));
 // A small blog base opens advertising conversion; a mature blog plus SNS supports full efficiency.
 const blogSupport=blogCount<STRATEGY_RULES.adBlogMinimum?0:.15+.85*clamp((blogCount-STRATEGY_RULES.adBlogMinimum)/(STRATEGY_RULES.blogTarget-STRATEGY_RULES.adBlogMinimum));
 const adConversionMultiplier=blogSupport*(.6+.4*snsReadiness)*maintenance;
 const referralMultiplier=1+(blogReady?1.5*maintenance*clamp(memory.trust/50):0);
 const external=['experience','press','power','seeding','cafe','platform','micro','expert','mega','mega-long','influencer-seeding','insta-review','video-review','group-buy','remember-content'].reduce((sum,id)=>sum+(totals[id]||0),0);
 return{blogCount,snsCount,blogTarget:STRATEGY_RULES.blogTarget,adBlogMinimum:STRATEGY_RULES.adBlogMinimum,blogReady,blogReadiness:round(blogReadiness),snsReadiness:round(snsReadiness),maintenance:round(maintenance),adConversionMultiplier:round(adConversionMultiplier),referralMultiplier:round(referralMultiplier),organicAssetShare:totalAssets?((blogReady?blogCount:0)+otherAssets+snsAssets)/totalAssets:0,brandDemandMultiplier:blogReady?1:Math.max(snsReadiness*.3,clamp(external/30)*.3)};
}
export function productProfile(product,referencePrice=100000){
 const involvement=product.involvement??(product.purchaseType==='service'||product.price>=referencePrice*3?'high':'low');
 return{involvement,high:involvement==='high',repurchasable:product.purchaseType==='subscription'||(product.purchaseType!=='service'&&(product.repurchasePossible??product.purchaseType==='repeat'))};
}
export function seedingEligibility(product,memory,referencePrice){
 const profile=productProfile(product,referencePrice),awareness=profile.high?STRATEGY_RULES.highSeedingAwareness:STRATEGY_RULES.seedingAwareness,trust=profile.high?STRATEGY_RULES.highSeedingTrust:STRATEGY_RULES.seedingTrust;
 return{eligible:memory.awareness>=awareness&&memory.trust>=trust,awareness,trust};
}
export function growthStrategy(product,memory,channels,referencePrice){
 const profile=productProfile(product,referencePrice),gate=seedingEligibility(product,memory,referencePrice),content=contentFoundation(memory),mega=megaEligibility(memory);
 const shares={search:0,display:0,influencer:0,content:0};
 for(const c of channels){const key=['search','brand-sa','naver-brand'].includes(c.id)?'search':c.group==='performance'?'display':c.group==='influencer'?'influencer':'content';shares[key]+=c.spend+c.workHours*STRATEGY_RULES.hourValue;}
 const total=Object.values(shares).reduce((a,b)=>a+b,0);for(const k in shares)shares[k]=total?shares[k]/total:0;
 const previous=memory.strategyStates?.[product.id]??{adPressure:0,concentrationMonths:0,shares:{search:0,display:0,influencer:0,content:0}};
 const adShare=shares.search+shares.display,foundation=clamp(Math.min(memory.awareness/50,memory.trust/50,content.adConversionMultiplier));
 const change=Object.keys(shares).reduce((n,k)=>n+Math.abs(shares[k]-(previous.shares[k]||0)),0)/2;
 const axes={ads:adShare,influencer:shares.influencer,content:shares.content},priorAxes={ads:(previous.shares.search||0)+(previous.shares.display||0),influencer:previous.shares.influencer||0,content:previous.shares.content||0};
 const dominant=Object.keys(axes).find(k=>axes[k]>=.8),priorDominant=Object.keys(priorAxes).find(k=>priorAxes[k]>=.8);
 const concentration=total&&dominant?(dominant===priorDominant?(previous.concentrationMonths||0)+1:1):0;
 // No reset from a cosmetic edit or a creative refresh; foundation/diversification repays debt.
 const pressure=clamp(previous.adPressure+(total===0?0:(adShare>.75?(adShare-.75)*.8*(1-foundation*.75):-.15*(shares.content+shares.influencer+.25))),0,1);
 const adMultiplier=1-previous.adPressure*.5;
 const searchBrandMultiplier=1+clamp(memory.awareness/80)*(profile.high?1.5:1);
 const assetReach=.003+clamp(memory.awareness/50)**2*clamp(memory.trust/45),ownedReach=content.blogReady?assetReach:0;
 const relationship=clamp((memory.trust-10)/40)*clamp((memory.advocacy-3)/25)*(content.blogReady?1+.5*content.maintenance:1);
 const phase=memory.awareness<20||memory.trust<25?'launch':!gate.eligible||memory.awareness<40||memory.trust<40?'growth':'advocacy';
 const targets=phase==='launch'?{search:0,display:2,influencer:0,content:8}:phase==='growth'?{search:2,display:2,influencer:0,content:7}:{search:2,display:1,influencer:3,content:4};
 const warnings=[];
 if(memory.awareness>=BRAND_RULES.contentCap||memory.trust>=BRAND_RULES.contentCap)warnings.push('콘텐츠·온드 SNS·광고로 높일 수 있는 인지도·신뢰는 70점까지예요. 마이크로·메가 유료 SNS 협업으로 상한을 넘어 90점 이상을 목표로 하세요.');
 if(channels.some(c=>['mega','mega-long'].includes(c.id))&&!mega.eligible)warnings.push(`메가 협업 불가: 월초 인지도 ${mega.awareness}점·신뢰 ${mega.trust}점이 모두 필요해요. 예산을 늘려도 섭외할 수 없습니다.`);
 if(channels.some(c=>c.id==='owned')&&!content.blogReady)warnings.push(`온드블로그 누적 ${content.blogCount}/${content.blogTarget}편: 100편을 쌓은 다음 달부터 블로그 직접·검색 유입이 열려요. 이번 달 발행분은 다음 달에 반영됩니다.`);
 if(channels.some(c=>c.group==='performance')&&!content.adConversionMultiplier)warnings.push(`광고 방문은 발생하지만 블로그 기반이 없어 광고 구매 전환은 0이에요. 전월까지 온드블로그 ${content.adBlogMinimum}편 이상을 쌓고 SNS를 함께 운영하세요.`);
 else if(channels.some(c=>c.group==='performance')&&content.adConversionMultiplier<.8)warnings.push(`콘텐츠 기반 광고 전환 계수 ${Math.round(content.adConversionMultiplier*100)}%: 블로그 축적·SNS 운영·자산 관리가 필요해요.`);
 if(adShare>.75)warnings.push(`광고 비중 ${Math.round(adShare*100)}%: 당월 유입은 크지만 검색 자산·추천은 쌓이지 않아 장기 효율이 낮아져요.`);
 if(total&&channels.filter(c=>c.id==='owned').reduce((sum,c)=>sum+c.spend+c.workHours*STRATEGY_RULES.hourValue,0)/total>.8&&memory.awareness<20)warnings.push('초기 온드 집중은 유입·매출 회수가 늦어요. 커뮤니티·외부 발행과 DA로 발견되는 접점을 확보하세요.');
 if(concentration>=3)warnings.push(`${concentration}개월째 한 축에 집중하고 있어요. 1–2개월마다 유입·전환·잔여 예산을 비교해 재배분하세요.`);
 if(channels.some(c=>c.id==='influencer-seeding')&&!gate.eligible)warnings.push(`시딩 섭외 불가: 월초 인지도 ${gate.awareness} · 신뢰 ${gate.trust} 이상이 필요해요. 접촉 시간만 사용하고 발행·비용·유입은 0입니다.`);
 return{profile,gate,content,brand:{...BRAND_RULES,megaEligible:mega.eligible},shares,phase,targets,foundation:round(foundation),adMultiplier:round(adMultiplier),searchBrandMultiplier:round(searchBrandMultiplier),ownedReach:round(ownedReach),assetReach:round(assetReach),relationship:round(relationship),change:round(change),concentrationMonths:concentration,warnings,next:{adPressure:round(pressure),concentrationMonths:concentration,shares:Object.fromEntries(Object.entries(shares).map(([k,v])=>[k,round(v)]))}};
}
