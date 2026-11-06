// Draft categories, not claims about these companies' actual products or prices.
// Use the application description to disambiguate names before applying sector patterns.
const profiles={
 wayo:['원어민 놀이영어 수업',[
  ['play','원어민 놀이영어 수업','service','원어민 선생님과 놀이 활동으로 영어를 경험하는 수업'],
  ['kit','영어 놀이 키트','oneoff','수업과 연계해 집에서 활용하는 영어 놀이 교구 세트']]],
 'infinite-monkey':['학교용 교과 퀴즈 프로그램',[
  ['league','교과 기반 레이싱 퀴즈 리그','service','학교 유휴기간에 학생들이 비슷한 실력끼리 교과 내용을 복습하는 리그 운영'],
  ['school','학교용 퀴즈 운영 도구','subscription','교사의 문제 구성·리그 운영·학습 현황 확인을 돕는 도구']]],
 soma:['청소년 정서 케어 앱',[
  ['care','캐릭터 감정 기록 · 셀프케어','subscription','동물 캐릭터와 함께 감정을 기록하고 일상 케어 루틴을 이어가는 앱'],
  ['program','학교 · 기관 정서 케어 프로그램','service','학교·청소년 기관에 감정 기록 활동과 운영 프로그램을 제공']]],
 muinlab:['여행 기록 앱 (무인공간 운영 업체와 동일 기업 여부 미확인)',[
  ['travel-archive','여행 기록 아카이브','subscription','사진·장소·메모를 여행별로 정리하고 저장하는 프리미엄 기능'],
  ['travel-book','여행 기록 포토북','oneoff','앱에 모은 여행 기록을 인쇄용 포토북으로 제작']]],
 phytolution:['여성 건강 식품',[
  ['food','여성 데일리 케어 식품','oneoff','여성의 일상 건강 관리를 위한 천연물 기반 식품 상품군'],
  ['bundle','여성 케어 식품 묶음 패키지','oneoff','일정 기간 섭취를 고려한 식품 세트 구성. 실제 효능·인증·제품 형태는 미확인']]],
 sponess:['신체 분석 · 운동 코칭 플랫폼',[
  ['analysis','스마트폰 신체 기능 분석','oneoff','움직임을 기록하고 운동 계획 수립에 참고할 분석 리포트를 제공'],
  ['exercise','맞춤 운동 콘텐츠','subscription','분석 결과에 맞는 운동 콘텐츠와 실천 기록을 제공']]],
 logmatrix:['교육기관용 수학 콘텐츠',[
  ['questions','수능 수학 문항 패키지','oneoff','상위권 수험생용 신규 수학 문항과 해설을 교육기관에 공급'],
  ['license','수학 콘텐츠 정기 공급','subscription','문항 업데이트와 학생 반응 기반 학습 리포트를 정기 제공']]],
 swirlx:['산업용 열교환기 제조',[
  ['exchanger','산업용 열교환기','oneoff','고객의 열 관리 요구에 맞춘 열교환기 제품군'],
  ['engineering','열교환기 설계 · 실증 지원','service','설치 환경별 열교환기 사양 설계와 성능 검증을 지원']]],
 fairit:['여행자 소비 커뮤니티',[
  ['travel-pass','여행 소비 정보 프리미엄 패스','oneoff','여행 기간 동안 현지 가격·소비 후기 정보를 확인하는 이용권'],
  ['partner','현지 상점 제휴 콘텐츠','service','상점 정보를 여행자에게 소개하는 제휴 콘텐츠 제작·운영']]],
 'idea-a36ddcb3b9a0':['다이어리 · 디지털 플래너',[
  ['planner','라이프 시스템 다이어리','oneoff','목표·일상·가계부를 연결하는 다이어리 또는 템플릿'],
  ['workshop','라이프 시스템 설계 워크숍','service','개인의 목표와 재정 기록 습관을 설계하는 워크숍']]],
 'idea-03966330022c':['피부관리 플랫폼',[
  ['routine','생애주기 스킨케어 루틴','subscription','시기별 피부 고민에 맞는 일상 관리 콘텐츠와 기록 기능'],
  ['consulting','맞춤 피부관리 상담','service','고객의 피부 고민과 생활 습관을 바탕으로 관리 방향을 안내']]],
 'idea-606d4411a57a':['영상 제작 지원 SaaS',[
  ['preprocess','영상 편집 전처리 도구','subscription','소스 영상의 분류·구간 정리·편집 준비를 자동화'],
  ['workflow','편집 워크플로 구축','service','제작팀의 소스 관리와 편집 전처리 흐름을 연동']]],
 'idea-2efd81c7c19f':['웨딩 비교 · 상담 플랫폼',[
  ['comparison','웨딩홀 맞춤 비교 리포트','oneoff','예산·지역·취향에 따라 후보 웨딩홀을 비교'],
  ['consulting','웨딩홀 상담 · 예약 지원','service','조건에 맞는 웨딩홀 탐색과 상담 예약을 지원']]],
 'idea-d4ae1c6ca17a':['연구자용 AI 편집 SaaS',[
  ['editor','AI 논문 에디터','subscription','논문의 구조·표현·수정 작업을 돕는 편집 환경'],
  ['team','연구실 공동 편집 플랜','subscription','여러 연구자의 문서 검토와 수정 이력을 함께 관리']]],
 'idea-3bf03f73cba9':['향수 브랜드',[
  ['discovery','DOINÉ 향수 디스커버리 세트','oneoff','여러 향을 소량으로 경험하며 취향을 찾는 샘플 세트'],
  ['perfume','DOINÉ 향수 본품','oneoff','샘플 경험과 취향 진단을 바탕으로 선택하는 향수 본품']]]
};

const sectorProfiles={
 commerce:['온라인 커머스',[['item','대표 상품','oneoff','핵심 고객의 수요를 반영한 대표 소비재 상품']]],
 beauty:['뷰티 브랜드',[['care','데일리 케어 제품','oneoff','일상적인 뷰티 관리를 위한 제품군']]],
 food:['식품 브랜드',[['food','대표 식품 패키지','oneoff','사업 소개를 바탕으로 구성한 식품 상품군']]],
 education:['교육 서비스',[['class','교육 프로그램','service','대상 고객에게 맞춘 수업·교육 운영 프로그램']]],
 saas:['업무용 SaaS',[['software','소프트웨어 이용 플랜','subscription','사업 소개의 핵심 기능을 제공하는 소프트웨어 이용권']]],
 manufacturing:['제조업',[['equipment','맞춤 제조 제품','oneoff','고객의 사용 환경에 맞춰 공급하는 제조 제품군']]],
 professional:['전문 서비스',[['service','전문 서비스 패키지','service','고객 과제를 해결하는 프로젝트 단위 서비스']]],
 travel:['여행 서비스',[['travel','여행 지원 패키지','service','여행 준비와 현지 경험을 지원하는 서비스']]],
 other:['초기 사업',[['pilot','핵심 서비스 파일럿','service','사업 소개의 핵심 가치를 검증하는 소규모 서비스']]]
};

export function draftProducts(company){
 const [sector,items]=profiles[company.id]||sectorProfiles[company.industry]||sectorProfiles.other;
 return items.map(([id,name,purchaseType,description])=>({
  id:`${company.id}:draft-${id}`,name,purchaseType,description,price:null,sourceUrl:null,
  availability:'draft',checkedAt:'2026-11-05',
  draftBasis:`신청 사업 설명과 ${sector}의 일반적인 상품 구성을 바탕으로 만든 초안입니다. 실제 상품명·출시 여부·판매 조건은 확인되지 않았습니다.`,
  priceNote:'초안 상품군입니다. 판매 가격과 계약 단위는 직접 입력하세요.'
 }));
}
