// Public product research checked on 2026-11-05. Prices are snapshots, not live quotes.
// Delivery hours, capacity and churn are deliberately NOT claimed as company facts.
const product=(id,name,purchaseType,price,sourceUrl,description,priceNote='',availability='listed')=>({id,name,purchaseType,price,sourceUrl,description,priceNote,availability,checkedAt:'2026-11-05'});
export default [
 {id:'toktokhan',name:'똑똑한개발자',aliases:['TOKTOKHAN.DEV','toktokhan','플러그','pluuug','똑개'],industry:'saas',market:'B2B',audience:'외주 개발과 거래·업무관리 솔루션이 필요한 기업',description:'외주 SI 개발과 pluuug 거래관리 SaaS를 제공하는 IT 기업',source:'user',website:'https://www.toktokhan.dev/',products:[
  product('si','외주 SI · 웹/앱 개발','service',null,'https://www.toktokhan.dev/','웹·앱과 사내 시스템의 기획·디자인·개발·운영','프로젝트별 견적. 계약 금액과 투입 시간은 직접 입력하세요.'),
  product('pluuug-basic','pluuug Basic','subscription',40000,'https://www.pluuug.com/pricing','1인 비즈니스의 영업·견적·계약·정산 관리','월간 월 40,000원, 연간 약정 월 32,000원 표시. VAT 별도.'),
  product('pluuug-team','pluuug Team','subscription',120000,'https://www.pluuug.com/pricing','팀의 고객·영업·거래 관리와 멤버 협업','월간 월 120,000원, 연간 약정 월 96,000원 표시. VAT 별도.'),
  product('pluuug-agency','pluuug Agency','subscription',240000,'https://www.pluuug.com/pricing','리소스·권한을 포함한 에이전시 거래 운영','월간 월 240,000원, 연간 약정 월 192,000원 표시. VAT 별도.')
 ]},
 {id:'modooshuttle',name:'모두의셔틀',aliases:[],industry:'professional',website:'https://www.modooshuttle.com/',products:[
  product('commute','출퇴근 셔틀 멤버십','subscription',null,'https://www.modooshuttle.com/','집과 회사 근처를 연결하는 출근길 셔틀 이용','노선별 요금과 결제 주기를 확인한 뒤 월 기준 단가를 입력하세요.'),
  product('corporate','기업 통근 셔틀 운영','service',null,'https://biz.modooshuttle.com/','임직원 전용 통근 셔틀의 차량 견적·운영·현황 관리','운행 노선·기간별 견적. 계약 단위와 운영 투입 시간은 직접 입력하세요.'),
  product('charter','전세버스 대절','service',null,'https://biz.modooshuttle.com/','통학·통원·워크숍·관광 목적의 차량 대절','일정·차종·탑승 인원에 따른 견적을 직접 입력하세요.')
 ]},
 {id:'strangeplanet',name:'스트레인지플래닛',aliases:['스트레인지 플래닛'],industry:'food',website:'https://strangeplanet.co.kr/',products:[product('microgarden','마이크로가든','oneoff',null,'https://www.gipa.or.kr/business/05_2.php?mode=read&no=695','도심 유휴공간에 설치하는 모듈형 스마트팜','기관 기업소개에서 제품 확인. 구성·견적은 직접 확인하세요.','introduced')]},
 {id:'docenty',name:'도슨티',aliases:['Docenty'],industry:'saas',website:'https://www.docenty.ai/',products:[
  product('geo-basic','도슨티 GEO 베이직','subscription',190000,'https://geo.docenty.ai/','AI 검색에서 브랜드 노출을 측정·분석하는 플랜','월 190,000원. 공식 요금 조건과 VAT를 원문에서 확인하세요.'),
  product('geo-standard','도슨티 GEO 스탠다드','subscription',490000,'https://geo.docenty.ai/','AI 검색 노출 측정과 콘텐츠 생성','월 490,000원. 공식 요금 조건과 VAT를 원문에서 확인하세요.'),
  product('geo-premium','도슨티 GEO 프리미엄','subscription',990000,'https://geo.docenty.ai/','AI 검색 최적화 콘텐츠와 승인형 자동 발행','월 990,000원. 공식 요금 조건과 VAT를 원문에서 확인하세요.'),
  product('chatbot','도슨티 AI 챗봇','subscription',null,'https://www.docenty.ai/','기업 및 온라인 쇼핑몰의 AI 고객응대 자동화','요금·계약 단위 확인 후 월 단가를 입력하세요.')
 ]},
 {id:'soma',name:'소마 (SOMA)',aliases:['SOMA','소마'],industry:'professional',products:[]},
 {id:'serkan',name:'세르칸',aliases:['TEAM SERKAN / 세르칸','SERKAN','TEAM SERKAN'],industry:'professional',website:'https://serkan.co.kr/',products:[
  product('collaboration','브랜드 광고 · 협업 콘텐츠','service',null,'https://serkan.co.kr/','남성 자기관리 미디어의 광고·제품 협찬·공동 프로그램 협업','공식 비즈니스 협업 안내 확인. 제작·운영 범위별 단가는 직접 입력하세요.')
 ]},
 {id:'ppolo',name:'PPOLO',aliases:[],industry:'other',website:'https://ppolo.org/',products:[product('running','PPOLO 러닝 게임','oneoff',null,'https://ppolo.org/','떨어진 러너가 실시간으로 함께 달리는 러닝 게임','공식 서비스 소개 확인. 유료 상품과 판매 구조는 확인 후 설정하세요.','introduced')]},
 {id:'tatli',name:'더타틀르컴퍼니',aliases:['타틀르','TATLI'],industry:'food',website:'https://www.tatli.co.kr/',products:[
  product('biscuit','카라멜라이즈드 비스킷 스프레드','oneoff',7980,'https://www.tatli.co.kr/all','비스킷 풍미의 스프레드','공식 상품 목록의 표시가. 옵션·행사에 따라 변동. 검색 자료로 확인.'),
  product('strawberry','동결건조 딸기 드라제 초콜릿','oneoff',12800,'https://www.tatli.co.kr/all','동결건조 딸기와 초콜릿을 조합한 간식','공식 상품 목록의 표시가. 옵션·행사에 따라 변동. 검색 자료로 확인.'),
  product('kadayif','메르칸 구운 카다이프 250g','oneoff',7800,'https://www.tatli.co.kr/all','디저트 제조용 구운 카다이프','공식 상품 목록의 표시가. 옵션·행사에 따라 변동. 검색 자료로 확인.')
 ]},
 {id:'wayo',name:'와요',aliases:[],industry:'education',products:[]},
 {id:'taxipot',name:'택시팟',aliases:['TaxiPot'],industry:'travel',products:[product('taxipot','택시팟 · 군인 택시 동승 매칭','oneoff',null,'https://apps.apple.com/kr/app/id6773295827','장병의 택시 동승과 비용 나누기를 돕는 앱','앱 소개 확인. 유료 과금 상품·매출 단가는 직접 확인하세요.','introduced')]},
 {id:'contentskick',name:'콘텐츠킥',aliases:['(주)콘텐츠킥','CONTENTS KICK'],industry:'saas',website:'https://www.contentskick.com/',products:[product('story-kick','Story Kick','subscription',null,'https://www.contentskick.com/','시나리오 진단·창작을 돕는 AI 스토리 플랫폼','공식 제품 소개 확인. 판매·요금·구독 조건은 미확인.','introduced')]},
 {id:'beaurit',name:'뷰릿',aliases:['뷰릿 /(주)파인유얼뷰티','뷰릿/(주)파인유얼뷰티','뷰릿(파인유얼뷰티)','파인유얼뷰티','Beaurit'],industry:'education',website:'https://www.beaurit.net/',products:[
  product('pilates-set','뷰릿 홈필라테스 SET','oneoff',108000,'https://www.beaurit.net/product/뷰릿-홈필라테스-set/11/','베이직바와 티칭밴드로 구성한 홈필라테스 도구','공식 판매가 108,000원. 옵션·행사·배송 조건 확인.'),
  product('leg-band','뷰릿 다리밴드','oneoff',89800,'https://www.beaurit.net/','홈필라테스를 위한 다리 밴드','공식 메인 상품 목록 판매가. 옵션·행사에 따라 변동.'),
  product('topping-2','뷰릿토핑 2 단품','oneoff',187000,'https://www.beaurit.net/','VOD를 함께 제공하는 홈마사지 도구','확인 당시 11월 행사 판매가. 행사 종료·옵션에 따라 변동.')
 ]},
 {id:'infinite-monkey',name:'무한원숭이',aliases:[],industry:'education',website:'https://www.infinitemonkey.kr/',products:[]},
 {id:'gentlecore',name:'젠틀코어',aliases:[],industry:'beauty',products:[]},
 {id:'phytolution',name:'파이톨루션',aliases:[],industry:'food',products:[]},
 {id:'dailypay',name:'데일리페이',aliases:[],industry:'professional',website:'https://bigpi.daily-pay.co.kr/company/',products:[product('advance','데일리페이 선정산 서비스','oneoff',null,'https://bigpi.daily-pay.co.kr/company/','온라인 판매자의 정산 전 자금 유동화를 지원','서비스 수수료 매출을 단가로 입력하세요. 선정산 원금은 매출로 넣지 않습니다.')]},
 {id:'eventus',name:'이벤터스',aliases:['EVENTUS'],industry:'saas',website:'https://event-us.kr/',products:[product('event-platform','이벤터스 행사 운영 플랫폼','oneoff',null,'https://event-us.kr/hostcenter/plan','행사 개설·홍보·참가자 관리 솔루션','선택 솔루션·계약에 따른 가격과 판매 단위를 직접 확인하세요.')]},
 {id:'sponess',name:'스포니스',aliases:['(주)스포니스','SPONESS'],industry:'professional',website:'https://sponess.com/',products:[]},
 {id:'banzo',name:'반조',aliases:['BANZO','손보다','SONBODA'],industry:'professional',website:'https://banzo.co.kr/',products:[product('sonboda','손보다-단','service',1500000,'https://banzo.co.kr/','상담·착용 피팅을 거쳐 판매하는 기능성 손가락 의수','기본 제품 가격 150만원. 60분 예약 상담 안내. 전체 건당 투입 시간과 조건은 직접 확인하세요.')]},
 {id:'logmatrix',name:'Log Matrix (LM)',aliases:['Log Matrix','LM'],industry:'education',products:[]},
 // The application describes a travel archive app. Do not attach a same-name
 // unattended-space vendor without evidence that it is the applicant's company.
 {id:'muinlab',name:'무인화연구소',aliases:[],industry:'saas',products:[]},
 {id:'unicornplace',name:'유니콘플레이스',aliases:[],industry:'education',products:[
  product('monthly','피트니스 월 구독 멤버십','subscription',null,'https://play.google.com/store/apps/details?id=im.unicon.app&hl=ko','제휴 피트니스센터를 앱에서 선택·결제·출입하는 월 자동 결제 회원권','개발사 앱 소개에서 월 구독 확인. 센터·옵션별 실제 월 요금은 직접 입력하세요.'),
  product('pass','피트니스 기간권','oneoff',null,'https://play.google.com/store/apps/details?id=im.unicon.app&hl=ko','1·3·6개월 등 원하는 기간을 한 번 결제해 이용하는 피트니스 회원권','기간권 전체 판매가를 입력하세요. 기간에 따른 비용·이용 제공의 월별 안분은 하지 않습니다.')
 ]},
 {id:'hklogistics',name:'에이치케이로지스틱스',aliases:['배차킹','HK로지스틱스'],industry:'professional',website:'https://www.baechaking.com/',products:[product('freight','배차킹 화물운송','service',null,'https://www.baechaking.com/','기업용 화물의 배차·운송과 관리','건당 매출 기준과 운영 투입 시간을 직접 설정하세요.')]},
 {id:'soscience',name:'SoScience',aliases:[],industry:'saas',products:[]},
 {id:'swirlx',name:'스월엑스',aliases:['SwirlX','스웰엑스'],industry:'manufacturing',products:[]},
 {id:'lexviz',name:'렉스비즈',aliases:['주식회사 렉스비즈','LexViz'],industry:'saas',website:'https://lexviz.co.kr/',products:[
  product('herelaw','Herelaw','subscription',null,'https://lexviz.co.kr/','사건 기록과 서면 작업을 돕는 법률 업무 AI','공식 제품 소개·베타 안내. 판매 조건과 월 과금은 직접 확인하세요.','introduced'),
  product('court-check','Herelaw Court Check','subscription',null,'https://courtcheck.herelaw.io/about','법원·판사 정보를 정리하는 법률 실무 지원','공식 서비스 확인. 유료 상품과 월 과금 조건은 직접 확인하세요.','introduced')
 ]},
 {id:'rivera',name:'리베라',aliases:[],industry:'saas',products:[]},
 {id:'hostandard',name:'호스탠다드',aliases:['주식회사 호스탠다드','HOSTANDARD'],industry:'professional',website:'https://www.hostandard.kr/',products:[product('turnover','공유숙박 턴오버 운영','service',null,'https://www.hostandard.kr/','숙소의 청소·린넨·비품·완료 확인을 통합 운영','객실별 견적과 건당 운영 시간을 직접 입력하세요.')]},
 {id:'fairit',name:'페어릿',aliases:['Fairit  페어릿','Fairit','Fairit 페어릿'],industry:'travel',products:[]},
 {id:'autonavi',name:'오토내비',aliases:['AutoNavi'],industry:'saas',website:'https://autonavi.co.kr/',products:[product('autonavi-paid','오토내비 유료 플랜','subscription',null,'https://autonavi.co.kr/','배달앱의 주소를 지도앱 길안내로 자동 연결','유료 플랜은 공식 확인. 가격과 결제 주기는 직접 확인하세요.') ]},
 {id:'welkit',name:'웰킷',aliases:['웰킷 / KLOW','KLOW','클로우','WelKit'],industry:'professional',website:'https://klow.kr/shop/about',products:[product('export','KLOW 수출·물류 운영','service',null,'https://klow.kr/shop/about','브랜드 수출·검수·물류를 연결하는 글로벌 커머스 운영','서비스 수수료 또는 계약 매출을 기준으로 단가와 투입 시간을 설정하세요.') ]}
];
