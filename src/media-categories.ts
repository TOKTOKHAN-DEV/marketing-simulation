export type MediaCategory={
  id:'blog'|'sns'|'other'|'performance';
  name:string;
  description:string;
  channelIds:readonly string[];
};

// Navigation follows the publishing channel. Strategy roles and saved channel IDs stay independent.
export const MEDIA_CATEGORIES:readonly MediaCategory[]=[
  {id:'blog',name:'블로그',description:'온드 운영부터 체험단·기자단·시딩까지.',channelIds:['owned','experience','press','power','seeding']},
  {id:'sns',name:'SNS',description:'브랜드 계정·숏폼·크리에이터·체험단·공동구매.',channelIds:['owned-sns','owned-shortform','insta-review','video-review','micro','mega','mega-long','influencer-seeding','group-buy']},
  {id:'other',name:'기타',description:'카페·커뮤니티·뉴스레터·전문가·외부 아티클.',channelIds:['cafe','platform','newsletter','expert','remember-content']},
  {id:'performance',name:'퍼포먼스',description:'검색·피드·배너 광고를 100만 원 단위로.',channelIds:['search','display','social','tiktok','linkedin','daangn','remember','naver-gfa','kakao']},
];
