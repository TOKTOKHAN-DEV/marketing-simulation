// Product structures checked against the official pages on 2026-11-06.
// Prices, CPC multipliers, reach and fit below are classroom assumptions, never platform quotations.
export const MEDIA_SOURCES={
 tiktok:{title:'TikTok · 인피드 광고',url:'https://ads.tiktok.com/resources/help/article/tiktok-auction-in-feed-ads?lang=en',basis:'인피드 영상 광고 구조 확인 · CPC는 Meta 참고값 × 0.9의 교육용 추정'},
 linkedin:{title:'LinkedIn · Sponsored Content',url:'https://www.linkedin.com/help/linkedin/answer/a425628/sponsored-updates---overview?lang=en',basis:'전문가 피드 광고 구조 확인 · CPC는 SA 참고값 × 1.25의 교육용 추정'},
 daangn:{title:'당근 · 피드광고',url:'https://bizschool.daangn.com/displayads',basis:'동네 피드·클릭 과금 구조 확인 · CPC는 Meta 참고값 × 0.8의 교육용 추정'},
 remember:{title:'리멤버 · 타깃광고',url:'https://market.rememberapp.co.kr/targetads',basis:'직장인 타기팅·앱 배너 구조 확인 · CPC는 SA 참고값 × 0.7의 교육용 추정 환산. 실제 계약·과금 방식과 다를 수 있음'},
 'naver-gfa':{title:'네이버 · 디스플레이광고',url:'https://ads.naver.com/help/faq/30',basis:'디스플레이 상품 구조 확인 · CPC는 Meta 참고값 × 1.15의 교육용 추정'},
 kakao:{title:'카카오 · 디스플레이광고',url:'https://business.kakao.com/info/reservedads',basis:'카카오 디스플레이 지면 구조 참고 · CPC는 Meta 참고값 × 0.95의 교육용 추정. 보장형 계약을 게임에서는 예산 블록으로 단순화'},
 'insta-review':{title:'REVU · 제품 리뷰 체험단',url:'https://biz.revu.net/product',basis:'인스타·영상 체험단 구조 확인 · 단가·원가·효과는 교육용 가정'},
 'video-review':{title:'REVU · 유튜브 체험단',url:'https://biz.revu.net/local/products/youtube',basis:'영상 체험단 구조 확인 · 단가·원가·효과는 교육용 가정'},
 'remember-content':{title:'리멤버 커넥트 · 스폰서 콘텐츠',url:'https://brand.rememberapp.co.kr/connect/ads/',basis:'아티클형 광고 구조 확인 · 집행 단가·효과는 교육용 가정'},
};
export const EXTRA_CHANNELS=[
 {id:'owned-sns',name:'인스타그램 온드 피드',group:'content',ownership:'owned',hours:3,stage:1,cost:0,unit:'1편',visits:180,impressions:2400,awareness:.65,trust:1,advocacy:.9,tag:'카드뉴스 · 브랜드 관계',description:'브랜드 계정에 카드뉴스와 사용 이야기를 쌓아요. 초기 도달은 작지만 인지도와 관계를 유지합니다.',color:'#dab2d2',intent:1.05},
 {id:'owned-shortform',name:'온드 숏폼 · 릴스/쇼츠/틱톡',group:'content',ownership:'owned',hours:8,stage:1,cost:0,unit:'1편',visits:500,impressions:8500,awareness:1.1,trust:.7,advocacy:.9,tag:'영상 제작 · 발견 접점',description:'직접 만든 짧은 영상으로 발견될 접점을 늘려요. 제작 시간이 크고 초기 성과는 제한적입니다.',color:'#b3d8db',intent:.85},
 {id:'newsletter',name:'뉴스레터 · CRM 콘텐츠',group:'content',ownership:'owned',hours:3,stage:1,cost:0,unit:'1회',visits:180,impressions:1000,awareness:.2,trust:1.4,advocacy:1.2,tag:'기존 고객 · 재방문',description:'기존 고객에게 유용한 소식을 보내 관계를 유지해요. 누적 고객이 없으면 직접 유입은 0입니다.',color:'#bfc99c',intent:1.3},
 {id:'remember-content',name:'리멤버 · 스폰서 아티클',group:'content',hours:4,stage:1,cost:1500000,unit:'1편',visits:1700,impressions:25000,awareness:2.6,trust:2.8,advocacy:.6,tag:'B2B · 설명형 콘텐츠',description:'직장인에게 제품과 도입 사례를 설명해요. 전문 서비스·B2B 상품의 인지와 신뢰를 쌓는 외부 콘텐츠입니다.',color:'#a5bfd8',intent:1.3},
 {id:'insta-review',name:'인스타그램 체험단',group:'influencer',stage:2,cost:100000,hours:.5,sponsorship:true,unit:'1명',visits:230,impressions:5500,awareness:1.1,trust:1.7,advocacy:1.2,tag:'피드 후기 · 제품 제공',description:'플랫폼에서 모집·선정한 리뷰어의 피드 후기를 집행해요. 발행비와 제품 제공 원가가 함께 발생합니다.',color:'#dfb5d3',intent:1.2},
 {id:'video-review',name:'숏폼 · 영상 체험단',group:'influencer',stage:2,cost:300000,hours:1,sponsorship:true,unit:'1명',visits:600,impressions:12000,awareness:1.7,trust:2,advocacy:1.5,tag:'릴스·쇼츠·틱톡 · 사용 후기',description:'선정된 크리에이터가 실제 사용 영상을 만들어요. 일반 시딩 접촉과 달리 발행 확정형 집행으로 가정합니다.',color:'#bdb7eb',intent:1.15},
 {id:'group-buy',name:'인플루언서 공동구매',group:'influencer',stage:2,cost:0,hours:6,commissionRate:.25,unit:'1회',visits:1300,impressions:15000,awareness:1.2,trust:1.1,advocacy:1.6,tag:'공구 매출 · 수수료 25%',description:'판매 파트너와 공동구매를 운영해요. 이 채널에 귀속된 신규 매출의 25%를 지급하며 기존 재구매·구독 갱신은 제외합니다.',color:'#e6bd8a',intent:1.65},
 ...[
  ['tiktok','틱톡 · 인피드 영상',.7,.11,'숏폼 · 발견형 광고','#aeced3','짧은 영상으로 새로운 고객을 모아요. 영상 소재 제작과 교체가 필요합니다.'],
  ['linkedin','링크드인 · 피드 광고',1.35,.06,'B2B · 직무 타기팅','#a5bfe3','직무·비즈니스 맥락의 잠재 고객을 연결해요. B2B 도입 검토에 적합하지만 클릭 단가는 높게 가정합니다.'],
  ['daangn','당근 · 동네 피드',1.05,.09,'지역 상권 · 근거리 수요','#e6b394','지역 고객에게 매장과 상품을 알려요. 음식·여가·생활 업종에 더 적합하도록 가정합니다.'],
  ['remember','리멤버 · 앱 배너',1.25,.12,'직장인 · B2B 도달','#bec2dc','직장인 앱 배너로 브랜드를 알리고 리드를 모아요. 실제 계약 대신 게임의 100만 원 블록으로 단순화합니다.'],
  ['naver-gfa','네이버 · 성과형 DA',1,.1,'피드·디스플레이 · 전환','#b2d5a5','네이버 디스플레이 접점에서 관심 고객을 모아요. 소재의 최신성과 브랜드 기반이 효율에 영향을 줍니다.'],
  ['kakao','카카오 · 디스플레이',.9,.1,'카카오 지면 · 도달','#ded39b','카카오 디스플레이 지면에 배너·영상으로 도달해요. 실제 계약을 게임 예산 블록으로 단순화합니다.'],
 ].map(([id,name,intent,awareness,tag,color,description])=>({id,name,group:'performance',stage:3,cost:100000,unit:'10만 원',visits:0,impressions:0,awareness,trust:0,advocacy:0,tag,color,description,intent})),
];
export const EXTRA_ADS={
 tiktok:{reference:'social',multiplier:.9,format:'video',ctr:.018,close:3.8},
 linkedin:{reference:'search',multiplier:1.25,ctr:.008,close:3.6},
 daangn:{reference:'social',multiplier:.8,format:'image',ctr:.018,close:4.2},
 remember:{reference:'search',multiplier:.7,format:'image',ctr:.008,close:3.8},
 'naver-gfa':{reference:'social',multiplier:1.15,ctr:.012,close:4.5},
 kakao:{reference:'social',multiplier:.95,ctr:.01,close:4.1},
};
