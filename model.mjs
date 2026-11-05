import {benchmarkFor,AD_SOURCES} from './research/ad-benchmarks.mjs';
export {benchmarkFor,AD_SOURCES};
// Educational model, not empirical industry benchmarks. Shared by preview and server.
export const INDUSTRIES = [
  { id:'commerce',label:'커머스 · 리빙',icon:'store',cpc:650,content:1.1,leadRate:.13,retention:.48,closeRate:.23,referral:.18,referencePrice:45000 },
  { id:'beauty',label:'뷰티 · 패션',icon:'heart',cpc:900,content:1.3,leadRate:.15,retention:.5,closeRate:.2,referral:.22,referencePrice:55000 },
  { id:'food',label:'식품 · 외식',icon:'store',cpc:500,content:1.4,leadRate:.18,retention:.55,closeRate:.27,referral:.24,referencePrice:30000 },
  { id:'education',label:'교육 · 클래스',icon:'book',cpc:1800,content:.8,leadRate:.1,retention:.58,closeRate:.16,referral:.18,referencePrice:250000 },
  { id:'saas',label:'IT · SaaS',icon:'target',cpc:3200,content:.62,leadRate:.085,retention:.65,closeRate:.12,referral:.14,referencePrice:350000 },
  { id:'manufacturing',label:'제조 · 산업재',icon:'flag',cpc:4800,content:.4,leadRate:.065,retention:.7,closeRate:.1,referral:.1,referencePrice:3000000 },
  { id:'professional',label:'전문 서비스',icon:'book',cpc:3800,content:.55,leadRate:.08,retention:.65,closeRate:.14,referral:.2,referencePrice:1000000 },
  { id:'travel',label:'여행 · 레저',icon:'flag',cpc:1300,content:1.2,leadRate:.12,retention:.45,closeRate:.18,referral:.2,referencePrice:300000 },
  { id:'other',label:'기타',icon:'store',cpc:1200,content:1,leadRate:.12,retention:.5,closeRate:.18,referral:.16,referencePrice:100000 },
].map(i=>({...i,cpc:benchmarkFor(i.id).search}));
export const CHANNELS = [
  {id:'experience',name:'블로그 체험단',group:'content',stage:1,cost:100000,unit:'1건',visits:110,impressions:2200,awareness:.8,trust:1.4,advocacy:.8,tag:'사용 경험 · 신뢰',description:'직접 사용한 후기로 구매 불안을 줄여요.',color:'#c7b4f6',intent:1.15},
  {id:'press',name:'블로그 기자단',group:'content',stage:1,cost:150000,unit:'1건',visits:180,impressions:4200,awareness:1.3,trust:.45,advocacy:.2,tag:'정보 확산 · 도달',description:'브랜드 소식을 여러 검색 접점에 노출해요.',color:'#acc6ef',intent:.9},
  {id:'power',name:'파워블로그',group:'content',stage:1,cost:800000,unit:'1건',visits:1400,impressions:24000,awareness:3.5,trust:2.3,advocacy:1,tag:'인지도 · 영향력',description:'영향력 있는 리뷰로 브랜드의 존재감을 높여요.',color:'#e9c190',intent:1.1},
  {id:'seeding',name:'블로그 시딩',group:'content',stage:1,cost:50000,unit:'1건',visits:130,impressions:2200,awareness:.35,trust:.15,advocacy:.15,tag:'검색 유입 · 접점',description:'여러 검색어에서 상품을 만날 기회를 만들어요.',color:'#a7cdab',intent:.8},
  {id:'owned',name:'온드블로그',group:'content',ownership:'owned',hours:4,stage:1,cost:0,unit:'1편',visits:250,impressions:2300,awareness:.6,trust:1.7,advocacy:.6,tag:'전문성 · 검색 자산',description:'직접 쓴 콘텐츠가 다음 달의 검색 자산이 돼요.',color:'#b4b9f6',intent:1.2},
  {id:'cafe',name:'카페 · 커뮤니티 직접 작성',group:'content',ownership:'owned',hours:1,stage:1,cost:0,unit:'1건',visits:180,impressions:2100,awareness:.65,trust:.9,advocacy:1,tag:'맥락 유입 · 공감',description:'관련 커뮤니티에 경험과 정보를 직접 작성해요.',color:'#a9d7b1',intent:1.1},
  {id:'platform',name:'플랫폼 직접 작성',group:'content',ownership:'owned',hours:2,stage:1,cost:0,unit:'1편',visits:120,impressions:1500,awareness:.4,trust:.5,advocacy:.45,tag:'트래픽 · 직접 소통',description:'브런치·링크드인 등에 브랜드의 관점을 전해요.',color:'#c6c9ce',intent:1},
  {id:'micro',name:'마이크로 인플루언서',group:'influencer',stage:2,cost:600000,unit:'1명',visits:850,impressions:18000,awareness:2.2,trust:2,advocacy:2.1,tag:'취향 일치 · 친밀감',description:'소규모 팬덤의 신뢰로 추천과 전환을 만들어요.',color:'#e0b7d5',intent:1.2},
  {id:'expert',name:'분야 전문가',group:'influencer',stage:2,cost:1200000,unit:'1명',visits:1100,impressions:20000,awareness:2.4,trust:3.8,advocacy:1.3,tag:'권위 · 전문 신뢰',description:'복잡하거나 고관여인 상품의 구매 장벽을 낮춰요.',color:'#c6b9e9',intent:1.35},
  {id:'mega',name:'메가 · 숏폼',group:'influencer',stage:2,cost:6500000,minCost:5000000,maxCost:8000000,unit:'1편',visits:4800,impressions:140000,awareness:7,trust:.8,advocacy:1.1,tag:'대규모 인지도',description:'많은 사람에게 알려지지만 구매 관심은 넓게 퍼져요.',color:'#efbaac',intent:.65},
  {id:'mega-long',name:'메가 · 롱폼',group:'influencer',stage:2,cost:40000000,minCost:30000000,maxCost:50000000,unit:'1편',visits:18000,impressions:600000,awareness:14,trust:3,advocacy:2,tag:'심층 소개 · 대규모 도달',description:'긴 영상으로 브랜드와 상품의 맥락을 전해요.',color:'#d6b4e8',intent:.9},
  {id:'influencer-seeding',name:'인플루언서 시딩',group:'influencer',stage:2,cost:0,hours:.25,unit:'1명 접촉',visits:700,impressions:14000,awareness:1.5,trust:1.8,advocacy:1.7,tag:'접촉 → 협의 → 발행',description:'접촉한 모두가 발행하지 않아요. 협찬·유료·레퍼럴 조건을 제안합니다.',color:'#ddc391',intent:1.15},
  {id:'search',name:'SA · 검색광고',group:'performance',stage:3,cost:100000,unit:'10만 원',visits:0,impressions:0,awareness:0,trust:0,advocacy:0,tag:'즉시 트래픽 · 광고 중단 시 소멸',description:'검색 수요를 즉시 연결해요. 광고를 멈추면 광고 유입도 사라집니다.',color:'#c8e79c',intent:1.45},
  {id:'display',name:'DA · 디스플레이',group:'performance',stage:3,cost:100000,unit:'10만 원',visits:0,impressions:0,awareness:0,trust:0,advocacy:0,tag:'배너·영상 · 소재 관리',description:'새로운 관심 고객에게 도달해요. 소재가 오래되면 클릭·전환 효율이 낮아집니다.',color:'#b5b5eb',intent:.82},
  {id:'social',name:'소셜 DA · Meta',group:'performance',stage:3,cost:100000,unit:'10만 원',visits:0,impressions:0,awareness:0,trust:0,advocacy:0,tag:'즉시 트래픽 · 광고 중단 시 소멸',description:'새 고객의 방문을 확보해요. 장기 유입을 위해 온드 자산을 함께 관리하세요.',color:'#9dcce0',intent:.9},
];
export const initialMemory=()=>({awareness:5,trust:8,advocacy:3,organicAssets:0,customers:0,productCustomers:{},serviceQueues:{},month:0});
export const initialPlan=()=>({budget:3000000,units:{},hypothesis:''});
export const industryFor=id=>INDUSTRIES.find(i=>i.id===id)||INDUSTRIES.at(-1);
export const TEAM_LEVELS={starter:{label:'주니어',speed:.7,quality:.8},standard:{label:'일반',speed:1,quality:1},expert:{label:'숙련',speed:1.4,quality:1.2}};
export const teamFor=b=>({headcount:1,hoursPerPerson:120,performance:'standard',awarenessRetention:94,...b?.marketingTeam});
export const seedingFor=plan=>({mode:'gift',fee:300000,commission:10,...plan.seeding});
export const seedingRate=mode=>({gift:.08,paid:.3,referral:.05}[mode]??.08);
export const costFor=(c,plan)=>plan.rates?.[c.id]??c.cost;
export const spendFor=plan=>CHANNELS.reduce((sum,c)=>sum+(plan.units[c.id]||0)*costFor(c,plan),0);
export const CREATIVE_FACTORS={click:[1,.92,.78,.65,.55,.45],conversion:[1,.88,.65,.48,.35,.25]};
export const campaignFor=(plan,id)=>({keyword:'purchase',format:'image',refreshMonths:1,refreshNow:false,skipRefresh:false,...plan.campaigns?.[id]});
export function adStateFor({business,product,plan,memory},id) {
 const settings=campaignFor(plan,id),reference=benchmarkFor(business.industry),team=teamFor(business),level=TEAM_LEVELS[team.performance]||TEAM_LEVELS.standard;
 if(id==='search')return{settings,baseCpc:reference.search,effectiveCpc:reference.search*(settings.keyword==='explore'?.7:1),clickMultiplier:1,conversionMultiplier:1,creativeAge:0,creativeRefreshed:false,creativeHours:0,workHours:2/level.speed,intent:settings.keyword==='explore'?1:1.45,campaignType:'SA'};
 const previous=memory.adCreatives?.[product.id]?.[id];
 const refresh=!previous||previous.format!==settings.format||settings.refreshNow||(!settings.skipRefresh&&settings.refreshMonths>0&&previous.age>=settings.refreshMonths);
 const age=refresh?0:previous.age,quality=refresh?level.quality:(previous.quality??1);
 const index=Math.min(age,5),clickMultiplier=CREATIVE_FACTORS.click[index]*quality*(settings.format==='video'?1.1:1),conversionMultiplier=CREATIVE_FACTORS.conversion[index]*quality*(settings.format==='video'?1.08:1);
 const baseCpc=id==='social'?reference.social:reference.display,creativeHours=refresh?(settings.format==='video'?16:6)/level.speed:0;
 return{settings,baseCpc,effectiveCpc:baseCpc/clickMultiplier,clickMultiplier,conversionMultiplier,creativeAge:age,creativeRefreshed:refresh,creativeHours,workHours:creativeHours,intent:(id==='social'?.9:.82)*conversionMultiplier,quality,campaignType:id==='social'?'SOCIAL_DA':'DA'};
}
export function planSummary({business,product,plan,memory}) {
  const team=teamFor(business),level=TEAM_LEVELS[team.performance]||TEAM_LEVELS.standard;
  const seeding=seedingFor(plan);
  let baseSpend=0,workHours=0,ownedPublished=0,creativeWorkHours=0,creativeRefreshes=0;
  const channels=CHANNELS.filter(c=>(plan.units[c.id]||0)>0).map(c=>{
    const requestedUnits=plan.units[c.id],units=requestedUnits;
    const placements=c.id==='influencer-seeding'?units*seedingRate(seeding.mode):units;
    const ad=c.group==='performance'?adStateFor({business,product,plan,memory},c.id):null;
    const hours=units*(c.hours||0)/level.speed+(ad?.workHours||0);
    creativeWorkHours+=ad?.creativeHours||0;creativeRefreshes+=ad?.creativeRefreshed?1:0;
    const cost=c.id==='influencer-seeding'?placements*(seeding.mode==='gift'?(product.sponsorshipCost??Math.round(product.price*.3)):seeding.mode==='paid'?seeding.fee:0):units*costFor(c,plan);
    workHours+=hours;baseSpend+=cost;if(c.ownership==='owned')ownedPublished+=units;
    return{...c,ownership:c.ownership||'paid',requestedUnits,units,placements,workHours:rounded(hours),spend:Math.round(cost),ad};
  });
  return{channels,baseSpend:Math.round(baseSpend),workHours:rounded(workHours),teamCapacity:team.headcount*team.hoursPerPerson,ownedPublished,creativeWorkHours:rounded(creativeWorkHours),creativeRefreshes,quality:level.quality,team,seeding};
}
const bounded=(n,min,max)=>Math.max(min,Math.min(max,n));
const rounded=n=>Math.round(n*100)/100;
const validText=(v,max=200)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
const finiteIn=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;

export function validateCampaign({business:b,product:p,products,plan,memory:m,stage,availableStage=stage}) {
  if(!b||!validText(b.id,100)||!validText(b.name,60)||!INDUSTRIES.some(i=>i.id===b.industry)||!['B2C','B2B','B2B2C','B2G'].includes(b.market)||typeof b.audience!=='string'||b.audience.length>200)return '비즈니스 정보를 확인해주세요.';
  const validProduct=item=>item&&validText(item.id,100)&&item.businessId===b.id&&validText(item.name,100)&&Number.isInteger(item.price)&&finiteIn(item.price,1000,100000000)&&['oneoff','repeat','service','subscription'].includes(item.purchaseType)&&typeof item.value==='string'&&item.value.length<=300
    &&(item.purchaseType!=='service'||(finiteIn(item.hoursPerOrder,.25,100000)&&finiteIn(item.monthlyHours,0,1000000)))&&(item.churnRate===undefined||finiteIn(item.churnRate,0,100))&&(item.canSponsor===undefined||typeof item.canSponsor==='boolean')&&(item.sponsorshipCost===undefined||(Number.isInteger(item.sponsorshipCost)&&finiteIn(item.sponsorshipCost,0,100000000)));
  if(!validProduct(p))return '상품 가격, 투입 시간 또는 월 해지율을 확인해주세요.';
  if(products!==undefined&&(!Array.isArray(products)||products.length>50||!products.every(validProduct)||new Set(products.map(item=>item.id)).size!==products.length||!products.some(item=>item.id===p.id)))return '함께 계산할 상품 목록을 확인해주세요.';
  if(!plan||!Number.isInteger(plan.budget)||!finiteIn(plan.budget,0,100000000)||!plan.units||typeof plan.units!=='object'||Array.isArray(plan.units)||typeof plan.hypothesis!=='string'||plan.hypothesis.length>2000)return '예산과 미디어 믹스를 확인해주세요.';
  for(const[id,units]of Object.entries(plan.units)) {
    const c=CHANNELS.find(c=>c.id===id);
    if(!c||!Number.isInteger(units)||units<0||units>2000)return '올바른 미디어 수량을 입력해주세요.';
    if(units>0&&c.stage>availableStage)return '아직 열리지 않은 미디어가 포함되어 있어요.';
  }
  if(!m||!['awareness','trust','advocacy'].every(k=>finiteIn(m[k],0,100))||!Number.isInteger(m.month)||!finiteIn(m.month,0,1000)||!finiteIn(m.organicAssets,0,100000)||!finiteIn(m.customers,0,1e9)||!m.productCustomers||typeof m.productCustomers!=='object'||Array.isArray(m.productCustomers)||Object.keys(m.productCustomers).length>100||!Object.values(m.productCustomers).every(n=>Number.isInteger(n)&&finiteIn(n,0,1e9)))return '누적 브랜드 데이터를 확인해주세요.';
  if(m.serviceQueues!==undefined&&(!m.serviceQueues||typeof m.serviceQueues!=='object'||Array.isArray(m.serviceQueues)||Object.keys(m.serviceQueues).length>100||!Object.values(m.serviceQueues).every(q=>q&&Number.isInteger(q.pendingOrders)&&finiteIn(q.pendingOrders,0,1e9)&&finiteIn(q.progressHours,0,100000)&&finiteIn(q.marketingShare,0,1)&&finiteIn(q.performanceShare,0,1)&&q.performanceShare<=q.marketingShare&&(q.commissionRate===undefined||finiteIn(q.commissionRate,0,.5)))))return '이월 서비스 작업 데이터를 확인해주세요.';
  if(m.ownedAwareness!==undefined&&(!finiteIn(m.ownedAwareness,0,100)||m.ownedAwareness>m.awareness+.01))return '온드 인지도 데이터를 확인해주세요.';
  if(m.contentPublished!==undefined&&(!m.contentPublished||Array.isArray(m.contentPublished)||typeof m.contentPublished!=='object'||Object.keys(m.contentPublished).length>100||Object.values(m.contentPublished).some(row=>!row||Array.isArray(row)||typeof row!=='object'||Object.entries(row).some(([id,n])=>!CHANNELS.some(c=>c.id===id)||!Number.isInteger(n)||!finiteIn(n,0,10000000)))))return '누적 발행 데이터를 확인해주세요.';
  if(b.marketingTeam!==undefined&&(!b.marketingTeam||typeof b.marketingTeam!=='object'||Array.isArray(b.marketingTeam)))return '마케터 설정을 확인해주세요.';
  const team=teamFor(b);
  if(!Number.isInteger(team.headcount)||!finiteIn(team.headcount,0,50)||!finiteIn(team.hoursPerPerson,0,240)||!Object.hasOwn(TEAM_LEVELS,team.performance)||!finiteIn(team.awarenessRetention,0,100))return '마케터 인원·업무 시간·역량·인지도 유지율을 확인해주세요.';
  if(plan.cadence!==undefined&&(!plan.cadence||Array.isArray(plan.cadence)||typeof plan.cadence!=='object'||Object.entries(plan.cadence).some(([id,v])=>!CHANNELS.some(c=>c.id===id&&c.group!=='performance')||!['once','monthly'].includes(v))))return '콘텐츠 발행 주기를 확인해주세요.';
  if(plan.rates!==undefined&&(!plan.rates||Array.isArray(plan.rates)||typeof plan.rates!=='object'||Object.entries(plan.rates).some(([id,v])=>{const c=CHANNELS.find(c=>c.id===id);return !c?.minCost||!Number.isInteger(v)||!finiteIn(v,c.minCost,c.maxCost);})))return '메가 인플루언서 단가 범위를 확인해주세요.';
  const seed=seedingFor(plan);
  if(plan.seeding!==undefined&&(!plan.seeding||typeof plan.seeding!=='object'||Array.isArray(plan.seeding)))return '시딩 제안 조건을 확인해주세요.';
  if(!['gift','paid','referral'].includes(seed.mode)||!Number.isInteger(seed.fee)||!finiteIn(seed.fee,0,50000000)||!finiteIn(seed.commission,0,50))return '시딩 비용과 레퍼럴 수수료를 확인해주세요.';
  if(seed.mode==='paid'&&seed.fee<50000&&(plan.units['influencer-seeding']||0)>0)return '유료 시딩은 성사 1건당 5만원 이상을 입력해주세요.';
  if(plan.campaigns!==undefined&&(!plan.campaigns||typeof plan.campaigns!=='object'||Array.isArray(plan.campaigns)||Object.entries(plan.campaigns).some(([id,s])=>!['search','display','social'].includes(id)||!s||typeof s!=='object'||Array.isArray(s)||(s.keyword!==undefined&&!['purchase','explore'].includes(s.keyword))||(s.format!==undefined&&!['image','video'].includes(s.format))||(s.refreshMonths!==undefined&&![0,1,2,3].includes(s.refreshMonths))||(s.refreshNow!==undefined&&typeof s.refreshNow!=='boolean')||(s.skipRefresh!==undefined&&typeof s.skipRefresh!=='boolean')||(s.refreshNow&&s.skipRefresh))))return '광고 전략과 소재 교체 주기를 확인해주세요.';
  if(m.adCreatives!==undefined&&(!m.adCreatives||typeof m.adCreatives!=='object'||Array.isArray(m.adCreatives)||Object.keys(m.adCreatives).length>100||Object.values(m.adCreatives).some(row=>!row||typeof row!=='object'||Array.isArray(row)||Object.entries(row).some(([id,c])=>!['display','social'].includes(id)||!c||!Number.isInteger(c.age)||!finiteIn(c.age,0,1000)||!['image','video'].includes(c.format)||!finiteIn(c.quality,.8,1.2)||!Number.isInteger(c.lastRefreshMonth)||!finiteIn(c.lastRefreshMonth,1,m.month)))))return '광고 소재 이력 데이터를 확인해주세요.';
  const summary=planSummary({business:b,product:p,plan,memory:m});
  if(summary.channels.some(c=>c.id==='influencer-seeding'&&c.units>0)&&seed.mode==='gift'&&!(p.canSponsor??p.purchaseType==='oneoff'))return '이 상품은 제품 협찬이 불가능해요. 유료 또는 레퍼럴 제안을 선택해주세요.';
  if(summary.workHours>summary.teamCapacity)return '내부 마케터의 월 가용 시간을 초과했어요. 발행·접촉 수량을 줄이거나 인력을 조정해주세요.';
  if(project({business:b,product:p,products,plan,memory:m,stage},1)[0].spend>plan.budget)return '집행비와 예상 레퍼럴 수수료가 월 예산을 초과했어요.';
  return null;
}

function affinity(c,industry,market) {
  let fit=1;
  if(['beauty','food','travel'].includes(industry)&&['experience','power','micro','social'].includes(c.id))fit*=1.2;
  if(['saas','manufacturing','professional'].includes(industry)){
    if(['owned','platform','expert','search'].includes(c.id))fit*=1.3;
    if(['mega','mega-long','seeding','social'].includes(c.id))fit*=.65;
  }
  if(market!=='B2C'&&['expert','platform','search','owned'].includes(c.id))fit*=1.16;
  if(['B2B','B2G'].includes(market)&&['mega','mega-long','micro','influencer-seeding'].includes(c.id))fit*=.8;
  return fit;
}

export function brandDescription(memory) {
  const{awareness:a,trust:t,advocacy:v}=memory;
  return {title:a<20?'아직은 낯선 브랜드':a<40?'한 번쯤 들어본 브랜드':a<65?'궁금해서 찾아보는 브랜드':'먼저 떠오르는 브랜드',
    recognition:a<30?'검색과 추천에서 만나는 접점을 조금 더 쌓아보세요.':'반복된 노출이 브랜드 검색과 자발적인 방문으로 이어지고 있어요.',
    trust:t<30?'고객은 아직 “믿어도 될까?”를 고민해요. 실제 경험과 전문성이 필요해요.':t<60?'사용 후기와 전문 콘텐츠가 쌓여 구매에 대한 불안이 줄었어요.':'고객이 상품의 설명과 추천을 신뢰하는 단계예요.',
    advocacy:v<30?'자발적인 추천은 아직 적어요. 공유하고 싶은 사용 경험을 만들어보세요.':'좋은 경험을 주위에 이야기하는 고객이 늘고 있어요.'};
}

export function calculateSales(p,m,demandOrders,marketingShare,performanceShare=0,commissionRate=0) {
  const existing=m.productCustomers[p.id]||0;
  const result={salesModel:p.purchaseType,demandOrders,newOrders:demandOrders,repeatOrders:0,
    serviceOpeningBacklog:0,serviceBacklog:0,hoursPerOrder:0,monthlyHours:0,hoursUsed:0,progressHours:0,servicePipelineHours:0,serviceCapacity:0,backlogValue:0,
    openingSubscribers:0,newSubscribers:0,churnedSubscribers:0,retainedSubscribers:0,activeSubscribers:0,churnRate:0,mrr:0,arr:0};
  let queueAfter=null,paidShare=marketingShare,adShare=performanceShare,feeRate=commissionRate;
  if(p.purchaseType==='service') {
    const previous=m.serviceQueues?.[p.id]||{pendingOrders:0,progressHours:0,marketingShare:0,performanceShare:0};
    const totalJobs=previous.pendingOrders+demandOrders;
    const h=p.hoursPerOrder,available=p.monthlyHours;
    paidShare=totalJobs?(previous.pendingOrders*previous.marketingShare+demandOrders*marketingShare)/totalJobs:0;
    feeRate=totalJobs?(previous.pendingOrders*(previous.commissionRate||0)+demandOrders*commissionRate)/totalJobs:0;
    adShare=totalJobs?(previous.pendingOrders*previous.performanceShare+demandOrders*performanceShare)/totalJobs:0;
    const hoursUsed=Math.min(available,Math.max(0,totalJobs*h-previous.progressHours));
    const completed=Math.min(totalJobs,Math.floor((previous.progressHours+hoursUsed+1e-8)/h));
    const pending=totalJobs-completed;
    const progress=pending?Math.round((previous.progressHours+hoursUsed-completed*h)*1000000)/1000000:0;
    queueAfter={pendingOrders:pending,progressHours:progress,marketingShare:pending?paidShare:0,performanceShare:pending?adShare:0,commissionRate:pending?feeRate:0};
    Object.assign(result,{newOrders:completed,serviceOpeningBacklog:previous.pendingOrders,serviceBacklog:pending,hoursPerOrder:h,monthlyHours:available,hoursUsed,progressHours:progress,servicePipelineHours:Math.max(0,pending*h-progress),serviceCapacity:Math.floor((available+previous.progressHours)/h),backlogValue:pending*p.price});
  } else if(p.purchaseType==='subscription') {
    const churn=(p.churnRate??35)/100;
    const renewed=Math.floor(existing*(1-churn));
    const active=renewed+demandOrders;
    Object.assign(result,{repeatOrders:renewed,openingSubscribers:existing,newSubscribers:demandOrders,churnedSubscribers:existing-renewed,retainedSubscribers:renewed,activeSubscribers:active,churnRate:churn,mrr:active*p.price,arr:active*p.price*12});
  } else if(p.purchaseType==='repeat')result.repeatOrders=Math.floor(existing*.08);
  const orders=result.newOrders+result.repeatOrders,revenue=orders*p.price;
  const attributedRevenue=Math.round(result.newOrders*p.price*paidShare);
  const performanceRevenue=Math.round(result.newOrders*p.price*adShare);
  return {...result,orders,revenue,attributedRevenue,organicRevenue:result.newOrders*p.price-attributedRevenue,performanceRevenue,
    referralFee:Math.round(result.newOrders*p.price*feeRate),nextProductCustomers:p.purchaseType==='subscription'?result.activeSubscribers:existing+result.newOrders,queueAfter};
}

function monthFor({business:b,product:p,products,plan,memory:m}) {
  const industry=industryFor(b.industry),summary=planSummary({business:b,product:p,plan,memory:m});
  let spend=summary.baseSpend,gainA=0,gainOwned=0,gainT=0,gainV=0,assets=0;
  const channels=summary.channels.map(c=>{
    const units=c.units,effective=c.placements<1?c.placements:Math.pow(c.placements,.86),fit=affinity(c,b.industry,b.market);
    const quality=c.ownership==='owned'?summary.quality:1;
    const traffic=c.group==='performance'?c.spend/c.ad.effectiveCpc:c.visits*industry.content;
    const visits=Math.floor(traffic*(c.group==='performance'?1:effective*fit*quality));
    const impressions=c.group==='performance'?Math.floor(visits/(c.id==='search'?.0664:c.id==='social'?.0193:.008)):Math.floor(c.impressions*effective*fit*quality);
    const brandUnits=(c.placements<1?c.placements:Math.pow(c.placements,.72))*1.6*quality;
    gainA+=c.awareness*brandUnits*fit;if(c.ownership==='owned')gainOwned+=c.awareness*brandUnits*fit;
    gainT+=c.trust*brandUnits*fit;gainV+=c.advocacy*brandUnits;
    if(c.ownership==='owned')assets+=units*(c.id==='owned'?1:.35)*quality;
    return{id:c.id,name:c.name,group:c.group,ownership:c.ownership,requestedUnits:c.requestedUnits,units,placements:rounded(c.placements),workHours:c.workHours,spend:c.spend,visits,impressions,intent:c.ad?.intent??c.intent,...(c.ad?{campaignType:c.ad.campaignType,baseCpc:c.ad.baseCpc,effectiveCpc:rounded(c.ad.effectiveCpc),creativeAge:c.ad.creativeAge,creativeRefreshed:c.ad.creativeRefreshed,creativeHours:rounded(c.ad.creativeHours),clickMultiplier:rounded(c.ad.clickMultiplier),conversionMultiplier:rounded(c.ad.conversionMultiplier),creativeFormat:c.ad.settings.format}:{}),awarenessGain:rounded(c.awareness*brandUnits*fit),trustGain:rounded(c.trust*brandUnits*fit)};
  });
  const marketingVisits=channels.reduce((a,c)=>a+c.visits,0);
  // This month's brand investment changes NEXT month's organic acquisition.
  const assetVisits=Math.floor(m.organicAssets*85*industry.content);
  const brandVisits=Math.floor((m.awareness>=30?Math.pow(m.awareness-29,1.32)*18:0)*industry.content);
  const organicVisits=assetVisits+brandVisits;
  const referralVisits=Math.floor(m.customers*industry.referral*(.5+m.advocacy/65));
  const visits=marketingVisits+organicVisits+referralVisits;
  const priceRatio=p.price/industry.referencePrice;
  const priceLead=1/(1+Math.pow(priceRatio,.65)),priceClose=1/(1+Math.pow(priceRatio,.85));
  const trustFactor=.8+m.trust/160;
  const leadRate=bounded(industry.leadRate*priceLead*trustFactor,0,.65);
  const leads=Math.floor(visits*leadRate);
  const retentionRate=bounded(industry.retention+m.trust/800,0,.9);
  const retained=Math.floor(leads*retentionRate);
  const intent=visits?(channels.reduce((a,c)=>a+c.visits*c.intent,0)+organicVisits+referralVisits)/visits:1;
  const closeRate=bounded(industry.closeRate*priceClose*trustFactor*intent,0,.8);
  const performanceSpend=channels.filter(c=>c.group==='performance').reduce((a,c)=>a+c.spend,0);
  const performanceVisits=channels.filter(c=>c.group==='performance').reduce((a,c)=>a+c.visits,0);
  const demandOrders=Math.floor(retained*closeRate);
  const {queueAfter,nextProductCustomers,performanceRevenue,...sales}=calculateSales(p,m,demandOrders,visits?marketingVisits/visits:0,visits?performanceVisits/visits:0,visits&&summary.seeding.mode==='referral'?(channels.find(c=>c.id==='influencer-seeding')?.visits||0)/visits*summary.seeding.commission/100:0);
  const {newOrders,revenue,attributedRevenue}=sales;
  const serviceQueues={...(m.serviceQueues||{})};
  if(queueAfter)serviceQueues[p.id]=queueAfter;
  const productCustomers={...m.productCustomers,[p.id]:nextProductCustomers};
  const productSales=[{productId:p.id,name:p.name,...sales}];
  let extraCustomers=0;
  // Other products keep renewing subscriptions and delivering their existing queues.
  // New acquisition is attributed only to the product chosen for this campaign.
  for(const other of products||[]) {
    if(other.id===p.id)continue;
    const {queueAfter:queue,nextProductCustomers:customers,performanceRevenue:_ad,...passive}=calculateSales(other,m,0,0,0);
    productCustomers[other.id]=customers;if(queue)serviceQueues[other.id]=queue;
    extraCustomers+=passive.newOrders;productSales.push({productId:other.id,name:other.name,...passive});
  }
  const companyRevenue=productSales.reduce((sum,s)=>sum+s.revenue,0);
  const companyAttributedRevenue=productSales.reduce((sum,s)=>sum+s.attributedRevenue,0);
  const companyMrr=productSales.reduce((sum,s)=>sum+s.mrr,0);
  spend+=productSales.reduce((sum,s)=>sum+(s.referralFee||0),0);
  const ownedRetention=summary.team.awarenessRetention/100,paidRetention=Math.max(0,ownedRetention-.08);
  const ownedBefore=Math.min(m.ownedAwareness||0,m.awareness),paidBefore=m.awareness-ownedBefore;
  const ownedAfter=ownedBefore*ownedRetention+gainOwned;
  const totalAwareness=ownedAfter+paidBefore*paidRetention+gainA-gainOwned;
  const cappedAwareness=bounded(totalAwareness,0,98);
  const contentPublished=structuredClone(m.contentPublished||{});
  contentPublished[p.id]={...(contentPublished[p.id]||{})};
  for(const c of channels)contentPublished[p.id][c.id]=(contentPublished[p.id][c.id]||0)+c.units;
  const adCreatives=structuredClone(m.adCreatives||{});
  for(const row of Object.values(adCreatives))for(const creative of Object.values(row))creative.age=Math.min(1000,creative.age+1);
  for(const c of summary.channels){if(c.ad&&c.id!=='search'){
    adCreatives[p.id]??={};adCreatives[p.id][c.id]={age:Math.min(1000,c.ad.creativeAge+1),format:c.ad.settings.format,quality:c.ad.quality,lastRefreshMonth:c.ad.creativeRefreshed?m.month+1:m.adCreatives[p.id][c.id].lastRefreshMonth};
  }}
  const memoryAfter={awareness:rounded(cappedAwareness),ownedAwareness:rounded(totalAwareness?ownedAfter*cappedAwareness/totalAwareness:0),trust:rounded(bounded(m.trust*.98+gainT,0,98)),advocacy:rounded(bounded(m.advocacy*.98+gainV,0,98)),organicAssets:rounded(m.organicAssets*.96+assets),customers:m.customers+newOrders+extraCustomers,productCustomers,serviceQueues,contentPublished,adCreatives,month:m.month+1};
  const dominant=[...channels].filter(c=>c.units>0).sort((a,b)=>b.awarenessGain-a.awarenessGain)[0];
  let narrative=dominant?`${dominant.name} 중심으로 활동했어요. ${dominant.awarenessGain>dominant.trustGain?'브랜드를 알아보는 접점':'고객이 신뢰할 근거'}가 늘었습니다. ${memoryAfter.awareness>=30?'인지도가 30점을 넘어 다음 달 자연 검색 유입에 기여해요.':'오거닉 확산까지 인지도를 조금 더 쌓아보세요.'}`:'이번 달 새 발행 없이 기존 자산으로 운영했어요. 인지도는 월 유지율에 따라 감소합니다.';
  if(p.purchaseType==='service')narrative+=` 이번 달 ${sales.hoursUsed}시간을 사용해 ${newOrders}건을 완료했어요. 미완료 ${sales.serviceBacklog}건은 다음 달로 이월하며, 완료된 건만 매출로 계산해요.`;
  if(p.purchaseType==='subscription')narrative+=` 신규 ${sales.newSubscribers}명, 해지 ${sales.churnedSubscribers}명으로 현재 활성 구독자는 ${sales.activeSubscribers}명이에요.`;
  return{creativeWorkHours:summary.creativeWorkHours,creativeRefreshes:summary.creativeRefreshes,adCpc:performanceVisits?Math.round(performanceSpend/performanceVisits):null,assetVisits,brandVisits,performanceVisits,organicShare:visits?organicVisits/visits:0,organicReadiness:rounded(Math.min(100,m.organicAssets*2+(m.ownedAwareness||0)*.5)),workHours:summary.workHours,teamCapacity:summary.teamCapacity,ownedPublished:summary.ownedPublished,expectedPlacements:rounded(channels.find(c=>c.id==='influencer-seeding')?.placements||0),seedingAttempts:channels.find(c=>c.id==='influencer-seeding')?.units||0,awarenessLoss:rounded(m.awareness-ownedBefore*ownedRetention-paidBefore*paidRetention),ownedRetention,paidRetention,month:m.month+1,budget:plan.budget,spend,unallocated:plan.budget-spend,marketingVisits,organicVisits,referralVisits,visits,leadRate,leads,retentionRate,retained,closeRate,...sales,referralFee:productSales.reduce((sum,s)=>sum+(s.referralFee||0),0),companyRevenue,companyAttributedRevenue,companyRoas:spend?Math.round(companyAttributedRevenue/spend*100):null,companyMer:spend?Math.round(companyRevenue/spend*100):null,backgroundRevenue:companyRevenue-revenue,companyMrr,companyArr:companyMrr*12,productSales,
    roas:spend?Math.round(attributedRevenue/spend*100):null,mer:spend?Math.round(revenue/spend*100):null,performanceRoas:performanceSpend?Math.round(performanceRevenue/performanceSpend*100):null,
    cpa:demandOrders?Math.round(spend/demandOrders):null,cpc:marketingVisits?Math.round(spend/marketingVisits):null,priceLeadMultiplier:priceLead,priceCloseMultiplier:priceClose,channels,memoryAfter,narrative};
}
export function project(input,horizon=3) {
  let memory=structuredClone(input.memory);const result=[];
  for(let i=0;i<bounded(Math.floor(horizon),1,6);i++){
    const month=monthFor({...input,memory});result.push(month);memory=month.memoryAfter;
  }
  return result;
}
// Each plan describes that particular month. No publication cadence is applied.
export function projectMonthly(input,plans) {
  let memory=structuredClone(input.memory);const result=[];
  for(const plan of plans.slice(0,6)){
    const month=monthFor({...input,plan,memory});result.push(month);memory=month.memoryAfter;
  }
  return result;
}
export function outlookPlans(plan,outlook) {
  return outlook.map((month,index)=>{
    const campaigns={...plan.campaigns};
    for(const id of ['display','social']){
      campaigns[id]={...campaignFor(plan,id),refreshNow:month.creativeAction==='refresh'||(index===0&&month.creativeAction!=='reuse'&&!!plan.campaigns?.[id]?.refreshNow),skipRefresh:month.creativeAction==='reuse'};
    }
    return{...plan,cadence:undefined,campaigns,units:{...plan.units,owned:month.owned,...Object.fromEntries(CHANNELS.filter(c=>c.group==='performance').map(c=>[c.id,Math.floor((plan.units[c.id]||0)*month.adPercent/100)]))}};
  });
}
export const clearCreativeActions=plan=>({...plan,campaigns:plan.campaigns?Object.fromEntries(Object.entries(plan.campaigns).map(([id,s])=>[id,{...s,refreshNow:false,skipRefresh:false}])):undefined});
export function recommendMix(stage,budget,business,product,memory) {
  const units={};let remaining=budget;
  const team=teamFor(business),speed=(TEAM_LEVELS[team.performance]||TEAM_LEVELS.standard).speed;
  units.owned=Math.min(4,Math.floor(team.headcount*team.hoursPerPerson*speed/4));
  const ids=stage>=3?['search','experience','social']:stage>=2?['micro','experience','power']:['experience','power','seeding'];
  for(const id of ids){const c=CHANNELS.find(c=>c.id===id);if(c.cost<=remaining){units[id]=1;remaining-=c.cost;}}
  const primary=CHANNELS.find(c=>c.id===ids[0]);
  units[primary.id]=Math.min(2000,(units[primary.id]||0)+Math.floor(remaining/primary.cost));
  return units;
}
