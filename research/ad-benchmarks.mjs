// Checked 2026-11-05. Published overseas campaign benchmarks, not Korean auction quotes.
// Numbers are a small subset of factual CPC observations, with explicit adjacent-industry mappings.
export const AD_SOURCES={
 search:{title:'WordStream / LocaliQ · Search 2026',url:'https://www.wordstream.com/blog/2026-google-ads-benchmarks',period:'2025.04–2026.03',basis:'Google·Microsoft 검색광고 · 해외 캠페인 표본'},
 social:{title:'WordStream / LocaliQ · Meta 2026',url:'https://www.wordstream.com/blog/facebook-ads-benchmarks-2026',period:'2026 보고서',basis:'Meta 트래픽 목적 캠페인 · 리드 목적 CPC와 다름'},
 campaign:{title:'Google Ads · 캠페인 유형',url:'https://support.google.com/google-ads/answer/2567043?hl=ko',period:'2026-11-05 확인',basis:'검색·디스플레이·동영상 구분 및 소재 요구사항'},
 fatigue:{title:'Amazon Ads · 소재 피로도',url:'https://advertising.amazon.com/en-ca/library/guides/ad-fatigue',period:'2026-11-05 확인',basis:'반복 노출과 CTR·전환율 저하, 소재 교체 원리'},
};
export const CPC_REFERENCE={
 commerce:{searchUsd:4.14,socialUsd:.59,category:'Shopping, Collectibles & Gifts',mapping:'커머스·리빙 → 쇼핑·선물 인접 업종'},
 beauty:{searchUsd:4.62,socialUsd:.50,category:'Beauty & Personal Care',mapping:'뷰티·패션 → 뷰티·퍼스널케어 대표 업종'},
 food:{searchUsd:2.05,socialUsd:.45,category:'Restaurants & Food',mapping:'식품·외식 → 음식·레스토랑'},
 education:{searchUsd:4.81,socialUsd:.70,category:'Education & Instruction',mapping:'교육·클래스 → 교육'},
 saas:{searchUsd:5.87,socialUsd:.70,category:'Business Services',mapping:'SaaS 전용 공개 표본 없음 · 기업 서비스 대용'},
 manufacturing:{searchUsd:5.87,socialUsd:.54,category:'Industrial & Commercial',mapping:'제조·산업재 → 산업·상업'},
 professional:{searchUsd:5.87,socialUsd:.70,category:'Business Services',mapping:'전문 서비스 → 기업 서비스 대용 · 법률·의료 전용값 아님'},
 travel:{searchUsd:2.14,socialUsd:.42,category:'Travel',mapping:'여행·레저 → 여행 대표 업종'},
 other:{searchUsd:5.42,socialUsd:.60,category:'All industries',mapping:'기타 → 전체 업종 참고값'},
};
export function benchmarkFor(industry) {
 const row=CPC_REFERENCE[industry]||CPC_REFERENCE.other;
 const fx=1400; // Fixed classroom scenario rate, deliberately not a live FX quote.
 const search=Math.round(row.searchUsd*fx/10)*10,social=Math.round(row.socialUsd*fx/10)*10;
 return{...row,search,social,display:Math.round(search*.18/10)*10,fx,checkedAt:'2026-11-05',displayBasis:'일반 DA는 SA CPC × 18%의 교육용 추정. 실측 벤치마크 아님.'};
}
