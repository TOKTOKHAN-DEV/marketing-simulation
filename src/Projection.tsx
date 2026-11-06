import { useState } from 'react';
import { ArrowDownToLine, ChevronDown, ChevronUp, Info, Table2 } from 'lucide-react';
import { industryFor, budgetFor,teamFor,initialPlan,seedingRate } from '../model.mjs';
import OutlookChart from './OutlookChart';
import type {AnnualEntry} from '../annual.mjs';
import { BrandCard } from './Dashboard';
import { Business, Memory, Metrics, Product, money, number, pct, won } from './types';

export default function Projection({entries,business,product,memory,onExport,onModel,onMix,onEditMonth}:{entries:AnnualEntry[];business:Business|null;product?:Product;memory:Memory;onExport:(rows:Metrics[])=>void;onModel:()=>void;onMix:()=>void;onEditMonth:(month:number)=>void}) {
  const [detailed,setDetailed]=useState(false),horizon=12;
  const industry=industryFor(business?.industry||'commerce');
  const forecast=entries.flatMap(e=>e.metrics?[e.metrics]:[]);
  const funding=business?budgetFor(business,initialPlan(),memory):null;
  const service=forecast.some(m=>m.salesModel==='service'),subscription=forecast.some(m=>m.salesModel==='subscription');
  const multi=forecast.some(m=>(m.productSales?.length||0)>1);
  const hasSubscription=forecast.some(m=>m.productSales?.some(p=>p.salesModel==='subscription'));
  const sum=(key:'revenue'|'spend'|'newOrders'|'attributedRevenue')=>forecast.reduce((a,m)=>a+(key==='revenue'?(m.companyRevenue??m.revenue):key==='attributedRevenue'?(m.companyAttributedRevenue??m.attributedRevenue):m[key]),0);
  const over=entries.some(e=>e.problem&&e.metrics);
  const rows:{group:string;name:string;formula:string;value:(m:Metrics)=>string;highlight?:boolean}[]=[
    {group:'A',name:'Acquisition · 전체 방문',formula:'미디어 + 오거닉 + 추천 방문',value:m=>`${number(m.visits)}명`},
    {group:'',name:'미디어 유입',formula:'미디어 수량 × 업종 적합도',value:m=>number(m.marketingVisits)},
    {group:'',name:'오거닉 유입',formula:'이전 인지도 + 온드 콘텐츠 자산',value:m=>number(m.organicVisits)},
    {group:'',name:'퍼포먼스 광고 유입',formula:'해당 월 SA·DA·소셜 집행으로 발생한 방문 (다음 달 이월 없음)',value:m=>number(m.performanceVisits||0)},
    {group:'',name:'오거닉 유입 비중',formula:'자연 유입 ÷ 전체 방문',value:m=>pct(m.organicShare||0,true)},
    {group:'A',name:'Activation · 관심 리드',formula:'전체 방문 × 리드 생성률',value:m=>`${number(m.leads)}명`},
    {group:'',name:'리드 생성률',formula:'업종 × 상품 가격 장벽 × 신뢰',value:m=>pct(m.leadRate,true)},
    {group:'R',name:'Retention · 재관심 리드',formula:'관심 리드 × 재관심률',value:m=>`${number(m.retained)}명`},
    {group:'',name:'재관심률',formula:'업종 재관심률 + 이전 신뢰',value:m=>pct(m.retentionRate,true)},
    {group:'R',name:'Referral · 추천 방문',formula:'이전 누적 고객 × 업종 추천율 × 신뢰·추천 관계',value:m=>`${number(m.referralVisits)}명`},
    {group:'',name:'추천 방문 → 신규 구매율',formula:'추천 고객의 별도 전환율 · 블로그 100편 이후 신뢰·추천 보너스',value:m=>m.referralConversionRate===undefined?'—':pct(m.referralConversionRate,true)},
    {group:'R',name:'Revenue · 신규 구매·가입·계약 수요',formula:'재관심 리드 × 구매 전환율',value:m=>`${number(m.demandOrders??m.newOrders)}건`},
    {group:'',name:'방문 → 신규 구매율',formula:'신규 구매 ÷ 전체 방문',value:m=>pct(m.visits?(m.demandOrders??m.newOrders)/m.visits:0,true)},
    {group:'',name:'재관심 → 구매 전환율',formula:'채널별 전환 기여 · 가격·관여도·SA 인지도·광고 편중·소재 효율 반영',value:m=>pct(m.closeRate,true)},
    {group:'',name:'재구매 · 갱신',formula:'선택 상품의 구독 갱신 또는 재구매 · 상품별 판매 구조 반영',value:m=>`${number(m.repeatOrders)}건`},
    ...(service?[
      {group:'h',name:'월 배정 시간',formula:'이 상품에 배정한 수행 시간',value:(m:Metrics)=>`${number(m.monthlyHours||0)}h`},
      {group:'',name:'이번 달 사용 시간',formula:'가용 시간과 이월·신규 작업량 중 작은 값',value:(m:Metrics)=>`${number(m.hoursUsed||0)}h`},
      {group:'✓',name:'서비스 완료 건수',formula:'진행 시간을 누적해 완료한 건수',value:(m:Metrics)=>m.salesModel==='service'?`${number(m.newOrders)}건`:'—'},
      {group:'',name:'기말 이월 작업',formula:'이전 대기 + 신규 수요 − 완료',value:(m:Metrics)=>`${number(m.serviceBacklog||0)}건`},
      {group:'',name:'이월 잔여 작업량',formula:'대기 건수 × 건당 시간 − 진행 시간',value:(m:Metrics)=>`${number(m.servicePipelineHours||0)}h`},
      {group:'',name:'이월 수요 환산액 (매출 제외)',formula:'미완료 건수 × 계약 단가',value:(m:Metrics)=>won(m.backlogValue||0)},
    ]:[]),
    ...(subscription?[
      {group:'↻',name:'활성 구독자',formula:'기존 갱신 고객 + 신규 가입',value:(m:Metrics)=>`${number(m.activeSubscribers||0)}명`},
      {group:'',name:'갱신 고객',formula:'기존 활성 고객 × (1 − 모의 해지율)',value:(m:Metrics)=>`${number(m.retainedSubscribers||0)}명`},
      {group:'',name:'해지 고객',formula:'기존 활성 고객 − 갱신 고객',value:(m:Metrics)=>`${number(m.churnedSubscribers||0)}명`},
      {group:'',name:'모의 월 해지율',formula:'상품에 직접 설정한 교육용 해지율',value:(m:Metrics)=>pct(m.churnRate||0,true)},
    ]:[]),
    {group:'₩',name:multi?'선택 상품 매출':'예상 매출',formula:'해당 월 선택 상품의 구매·완료·구독 갱신 × 단가',value:m=>won(m.revenue),highlight:!multi},
    ...(multi?[
      {group:'',name:'기존 다른 상품 매출',formula:'다른 상품의 갱신·재구매·기존 작업 완료',value:(m:Metrics)=>won(m.backgroundRevenue||0)},
      {group:'₩',name:'기업 매출 합계',formula:'선택 상품 매출 + 다른 상품 매출',value:(m:Metrics)=>won(m.companyRevenue??m.revenue),highlight:true},
    ]:[]),
    ...(hasSubscription?[
      {group:'↻',name:'기업 MRR · 월 반복매출',formula:'모든 구독 상품의 활성 고객 × 월 구독료 합계',value:(m:Metrics)=>won(m.companyMrr||0)},
      {group:'',name:'기업 ARR · 연환산',formula:'현재 기업 MRR × 12 (실제 연 매출 예측 아님)',value:(m:Metrics)=>won(m.companyArr||0)},
    ]:[]),
    {group:'',name:'마케팅 유입 귀속 매출',formula:'신규 매출 × 채널별 전환 기여 가중치',value:m=>won(m.attributedRevenue)},
    {group:'',name:'자연 · 추천 유입 매출',formula:'신규 매출 − 마케팅 유입 귀속 매출',value:m=>won(m.organicRevenue)},
    {group:'₩',name:'집행 상한 · 남은 자금',formula:'연간 시작 자금 + 전월까지 누적 기업 매출 − 누적 집행 (이전 예산 방식은 당시 규칙)',value:m=>won(m.budget)},
    {group:'',name:'권장 마케팅 예산',formula:'월 기본 300만 원 + 전월 매출 × 30% · 실제 집행은 자금 상한 내',value:m=>won(m.funding?.recommendedBudget??m.budget)},
    {group:'',name:'연간 시작 자금',formula:'3,600만 원 · M1부터 사용 가능, 매월 새로 지급되지 않음',value:m=>won(m.funding?.totalBudget||0)},
    {group:'',name:'전월까지 누적 기업 매출',formula:'전 상품의 인식 매출 누계',value:m=>won(m.funding?.cumulativeRevenue||0)},
    {group:'',name:'전월까지 누적 집행',formula:'외부 비용·협찬·레퍼럴·공구 수수료 누계',value:m=>won(m.funding?.cumulativeSpend||0)},
    {group:'',name:'월 권장 기본액',formula:'권장 계산의 기본 300만 원 · 매월 지급되는 추가 자금이 아님',value:m=>won(m.funding?.baseBudget??m.budget)},
    {group:'',name:'전월 기업 매출',formula:'선택 상품 + 다른 상품의 전월 인식 매출',value:m=>won(m.funding?.previousRevenue??0)},
    {group:'',name:'전월 매출 권장 가산',formula:'전월 기업 매출 × 30% · 권장액 계산용, 실제 자금에 중복 가산하지 않음',value:m=>won(m.funding?.reinvestmentAmount??0)},
    {group:'',name:'다음 달 사용 가능 예산',formula:'집행 전 잔액 + 이번 달 기업 매출 − 이번 달 집행비',value:m=>won(m.funding?.nextBudget??m.budget)},
    {group:'',name:'집행 예산',formula:'외부 발행비 + 협찬 원가 + 레퍼럴·공구 수수료',value:m=>won(m.spend)},
    {group:'',name:'미배분 예산',formula:'월 예산 한도 − 집행 예산',value:m=>won(m.unallocated)},
    {group:'%',name:'마케팅 ROAS',formula:'마케팅 유입 귀속 매출 ÷ 집행 예산 × 100',value:m=>pct(m.companyRoas??m.roas),highlight:true},
    {group:'',name:'퍼포먼스 광고 ROAS',formula:'SA·DA·소셜 광고 귀속 매출 ÷ 해당 광고비 × 100',value:m=>pct(m.performanceRoas)},
    {group:'',name:'총매출 / 마케팅비 (MER)',formula:'재구매 포함 전체 매출 ÷ 집행 예산 × 100',value:m=>pct(m.companyMer??m.mer)},
    {group:'',name:service?'계약 수요 CPA':'신규 구매 CPA',formula:'집행 예산 ÷ 신규 구매 수',value:m=>m.cpa===null?'—':won(m.cpa)},
    {group:'',name:'월초 온드블로그 누적',formula:'기업 전체 상품의 온드블로그 발행 합계 · 이번 달 발행은 다음 달 반영',value:m=>m.strategy?.content?`${m.strategy.content.blogCount} / 100편`:'—'},
    {group:'',name:'콘텐츠 기반 광고 전환 계수',formula:'블로그 20편 미만 0 · 이후 블로그 축적·SNS·자산 유지 반영',value:m=>m.strategy?.content?pct(m.strategy.content.adConversionMultiplier,true):'—'},
    {group:'',name:'블로그 기반 추천 전환 보너스',formula:'100편 이후 추천 유입 코호트에만 가중 · 자연 검색·광고와 구분',value:m=>m.strategy?.content?`×${m.strategy.content.referralMultiplier.toFixed(2)}`:'—'},
    {group:'',name:'SA 인지도 전환 보너스',formula:'월초 인지도와 상품 관여도 · SA 전환에만 적용',value:m=>m.strategy?`×${m.strategy.searchBrandMultiplier.toFixed(2)}`:'—'},
    {group:'',name:'누적 광고 편중 효율',formula:'상품별 광고 편중 누적 · 소재 교체로 초기화되지 않음',value:m=>m.strategy?pct(m.strategy.adMultiplier,true):'—'},
    {group:'',name:'메가 협업',formula:'월초 인지도 50·신뢰 50을 모두 충족해야 섭외 가능',value:m=>m.strategy?.brand?(m.strategy.brand.megaEligible?'가능':'불가'):'—'},
    {group:'',name:'시딩 섭외',formula:'월초 인지도·신뢰 조건 충족 시에만 제안 성사',value:m=>m.strategy?.gate.eligible?'가능':'불가'},
    {group:'',name:'광고 소재 전환 효율',formula:'소재 사용 개월·품질·형식에 따른 채널별 보정',value:m=>m.channels.filter(c=>c.group==='performance'&&c.id!=='search').map(c=>`${c.name} ${(c.creativeAge||0)+1}개월 ×${c.conversionMultiplier?.toFixed(2)}`).join(' / ')||'—'},
    {group:'',name:'DA 소재 제작 시간',formula:'이미지 6h · 숏폼 16h / 세트, 마케터 역량 속도 반영',value:m=>`${m.creativeWorkHours||0}h`},
    {group:'',name:'DA 신규 소재 세트',formula:'교체 주기 또는 이번 달 새로 제작한 채널 수',value:m=>`${m.creativeRefreshes||0}세트`},
    {group:'',name:'퍼포먼스 실효 CPC',formula:'광고 집행비 ÷ 광고 방문 · 업종 참고 CPC와 소재 피로도 반영',value:m=>m.adCpc?won(m.adCpc):'—'},
    {group:'',name:'이번 달 온드 발행',formula:'각 월에 직접 설계한 온드 발행량',value:m=>`${number(m.ownedPublished||0)}편`},
    {group:'',name:'마케터 배정 / 가용 시간',formula:'온드 제작·시딩 접촉 시간 / 내부 인력 월 시간',value:m=>`${m.workHours||0} / ${m.teamCapacity||0}h`},
    {group:'',name:'시딩 접촉 / 예상 발행',formula:`협찬 ${pct(seedingRate('gift'),true)} · 유료 ${pct(seedingRate('paid'),true)} · 레퍼럴 ${pct(seedingRate('referral'),true)} 기대값`,value:m=>`${m.seedingAttempts||0}명 / ${m.expectedPlacements||0}건`},
    {group:'',name:'공동구매 귀속 매출',formula:'공구 채널의 신규 전환 기여 매출 · 갱신·재구매 제외',value:m=>won(m.groupBuyRevenue||0)},
    {group:'',name:'공동구매 수수료',formula:'공구 귀속 신규 매출 × 25% · 서비스는 완료 월',value:m=>won(m.groupBuyFee||0)},
    {group:'',name:'레퍼럴 수수료',formula:'추천 유입의 신규 매출 × 수수료율 (갱신 제외)',value:m=>won(m.referralFee||0)},
    {group:'',name:'기존 인지도 월 감쇠',formula:'온드·페이드별 전월 인지도 × (1 − 월 유지율)',value:m=>`${m.awarenessLoss||0}점`},
    {group:'',name:'온드 검색 자산',formula:'전월 검색 자산 × 0.96 + 이번 달 온드 발행 효과',value:m=>`${m.memoryAfter.organicAssets}`},
    {group:'✦',name:'월말 브랜드 인지도',formula:`전월 온드 인지도 × ${teamFor(business).awarenessRetention}% + 페이드 × ${Math.max(0,teamFor(business).awarenessRetention-8)}% + 신규 활동 효과`,value:m=>`${m.memoryAfter.awareness} / 100`},
    {group:'',name:'월말 브랜드 신뢰도',formula:'전월 신뢰도 × 0.98 + 미디어별 신뢰 효과',value:m=>`${m.memoryAfter.trust} / 100`},
  ];
  return <div className="view-enter"><section className="projection-intro"><div><span className="eyebrow">M1 — M12 · ANNUAL PLAN</span><h2>12개월의 전략, 하나의 성장 계획.</h2><p>{business?`${business.name} · 연간 시작 자금 ${won(funding?.totalBudget||36000000)} · 월 권장 300만 원 + 전월 매출 30%`:'비즈니스와 상품을 준비해주세요.'}</p></div><span className="soft-pill">12개월 고정</span></section>
    <section className="card monthly-outlook"><div className="section-title"><h2>M1~M12 미디어 믹스 계획</h2><span>실행 기록 + 저장한 월별 계획</span></div><p>각 달의 상품과 모든 미디어 배정은 ‘설계’에서 바꿀 수 있어요. 미설계 달은 새 집행 없이 계산하며 실행은 M1부터 순서대로 진행합니다.</p>
      <div className="monthly-plan-scroll"><table className="monthly-plan-table annual-plan-table"><thead><tr><th>월 / 편집</th><th>상품 / 상태</th><th>집행 상한</th><th>월 권장액</th><th>집행비</th><th>기업 매출</th></tr></thead><tbody>{entries.map(e=><tr key={e.month} className={e.problem&&e.metrics?'outlook-invalid':''}><th><span>M{e.month}</span><button className="text-button annual-edit" aria-label={`M${e.month} 계획 편집`} onClick={()=>onEditMonth(e.month)}>{e.status==='executed'?'수정':'설계'}<ChevronDown size={11}/></button></th><td><b>{e.product?.name||'상품 필요'}</b><small>{e.status==='executed'?'실행 완료':e.status==='planned'?'계획 저장됨':'미설계 · 새 집행 없음'}{e.problem&&e.metrics?` · ${e.problem}`:''}</small></td><td>{e.metrics?won(e.metrics.budget):'—'}</td><td>{e.metrics?won(e.metrics.funding?.recommendedBudget??e.metrics.budget):'—'}</td><td>{e.metrics?won(e.metrics.spend):'—'}</td><td>{e.metrics?won(e.metrics.companyRevenue??e.metrics.revenue):'—'}</td></tr>)}</tbody></table></div>
      <OutlookChart baseline={[]} forecast={forecast} actualThrough={memory.month}/><p className="outlook-hint">권장은 월 300만 원 + 전월 매출 30%이며 집행 상한은 연간 시작 자금 + 누적 매출 − 누적 집행입니다. 실제 실행한 달의 결과는 보존하고 아직 실행하지 않은 달만 계획을 이어 계산해요.</p>
    </section>
    <div className="projection-stats"><div><span>{horizon}개월 총 집행</span><strong>₩ {money(sum('spend'))}</strong></div><div><span>{horizon}개월 기업 예상 매출</span><strong className="accent">₩ {money(sum('revenue'))}</strong></div><div><span>신규 구매·완료 합계</span><strong>{number(sum('newOrders'))}<small>건</small></strong></div><div><span>누적 마케팅 ROAS</span><strong>{pct(sum('spend')?Math.round(sum('attributedRevenue')/sum('spend')*100):null)}</strong></div></div>
    <div className={`projection-note ${over?'danger':''}`}><Info size={15}/><span>{over?'배분 금액이 예산 한도를 초과했어요. 미디어 믹스를 조정해야 실행할 수 있습니다.':'월별 설계와 기존 검색 자산·인지도·구독 갱신·진행 작업을 반영해요. 미리보기는 기록에 반영되지 않아요.'}</span></div>
    <section className="card projection-table-card"><div className="section-title"><h2><Table2 size={16}/> AARRR 매출 전망</h2><div className="projection-table-actions"><button className="icon-button" aria-label="매출 전망 CSV 내보내기" disabled={!forecast.length} onClick={()=>onExport(forecast)}><ArrowDownToLine size={16}/></button><button className="text-button" onClick={()=>setDetailed(!detailed)}>{detailed?'핵심만 보기':'계산 과정 보기'}{detailed?<ChevronUp size={14}/>:<ChevronDown size={14}/>}</button></div></div><div className="table-scroll"><table className="projection-table"><thead><tr><th>고객 여정 / 지표</th>{detailed&&<th>계산 기준</th>}{forecast.map(m=><th key={m.month}>M{m.month}<span>{m.month<=memory.month?'실행 완료':'계획 예상'}</span></th>)}</tr></thead><tbody>{rows.filter(r=>detailed||r.group).map(r=><tr key={r.name} className={`${r.highlight?'highlight-row':''} ${r.group?'major-row':'minor-row'}`}><th scope="row"><span className={`row-letter ${r.group?'':'empty'}`}>{r.group||'·'}</span>{r.name}</th>{detailed&&<td className="formula-cell">{r.formula}</td>}{forecast.map(m=><td key={m.month}>{r.value(m)}</td>)}</tr>)}</tbody></table></div>{!forecast.length&&<div className="table-empty"><p>상품과 미디어 믹스를 준비하면 예측표가 만들어져요.</p><button className="text-button" onClick={onMix}>미디어 믹스 설계하기</button></div>}<div className="table-footer"><span>Referral은 구매의 필수 단계가 아닌 다음 달 추가 유입 경로예요.</span></div></section>
    <div className="projection-bottom"><section className="card assumptions-card"><div className="section-title"><h2>이 예측의 출발점</h2><button className="text-button" onClick={onModel}>업종 가정 보기</button></div><div className="assumption-grid"><div><span>업종</span><b>{industry.label}</b></div><div><span>가격 기준점</span><b>{won(industry.referencePrice)}</b></div><div><span>리드 생성 · 가격 계수</span><b>× {forecast[0]?.priceLeadMultiplier.toFixed(2)||'—'}</b></div><div><span>구매 전환 · 가격 계수</span><b>× {forecast[0]?.priceCloseMultiplier.toFixed(2)||'—'}</b></div></div><p>같은 업종에서 상품 가격이 높을수록 두 계수가 함께 낮아져요. 온드블로그는 누적 100편 이후 직접·검색 유입이 열립니다. 블로그 20편 미만이면 광고 방문은 많아도 광고 구매 전환은 0이고, 이후 콘텐츠 축적·SNS 운영이 전환을 돕습니다. 광고 편중은 장기 효율을 낮춥니다.</p><small>수치는 교육용 가정입니다. 실제 시장 평균, 순이익 또는 검증된 매출 전망을 의미하지 않아요.</small></section><BrandCard memory={forecast.at(-1)?.memoryAfter||memory} compact/></div>
  </div>;
}

export function csvFor(forecast:Metrics[]) {
  const header=['월','상품명','월예산한도','집행예산','미배분','미디어유입','오거닉유입','추천유입','전체방문','리드생성률','리드수','재관심률','재관심리드','구매전환율','신규구매','재구매','선택상품매출','마케팅귀속매출','자연추천매출','마케팅ROAS(%)','퍼포먼스ROAS(%)','MER(%)','인지도','신뢰도','판매구조','계약수요','완료건수','이월작업','배정시간','사용시간','이월잔여시간','활성구독자','신규가입','갱신','해지','모의해지율','상품MRR','상품ARR','기업매출','다른상품매출','기업MRR','기업ARR','기업ROAS(%)','온드발행','마케터사용시간','마케터가용시간','시딩접촉','시딩예상발행','레퍼럴수수료','인지도감쇠','온드유지율','페이드유지율','검색자산','광고유입','오거닉비중','소재제작시간','신규소재세트','퍼포먼스실효CPC','SA_CPC','DA_CPC','소셜_CPC','DA소재사용개월','DA전환계수','소셜소재사용개월','소셜전환계수','SA인지도보너스','누적광고효율','시딩섭외가능','상품관여도','재구매가능','기본마케팅예산','전월기업매출','전월매출재투자','매출재투자율','다음달사용가능예산','공구귀속매출','공구수수료','추가광고채널','월초온드블로그누적','월초온드SNS누적','콘텐츠기반광고전환계수','추천전환보너스','추천방문구매전환율','콘텐츠브랜드상한','메가협업가능','연간시작자금','누적기업매출','누적마케팅집행','월권장예산','다음달권장예산','매출내수수료정산'];
  const rows=forecast.map(m=>[m.month,m.productSales?.[0]?.name||'',m.budget,m.spend,m.unallocated,m.marketingVisits,m.organicVisits,m.referralVisits,m.visits,m.leadRate,m.leads,m.retentionRate,m.retained,m.closeRate,m.newOrders,m.repeatOrders,m.revenue,m.attributedRevenue,m.organicRevenue,m.roas??'',m.performanceRoas??'',m.mer??'',m.memoryAfter.awareness,m.memoryAfter.trust,m.salesModel||'oneoff',m.demandOrders??m.newOrders,m.newOrders,m.serviceBacklog||0,m.monthlyHours||0,m.hoursUsed||0,m.servicePipelineHours||0,m.activeSubscribers||0,m.newSubscribers||0,m.retainedSubscribers||0,m.churnedSubscribers||0,m.churnRate||0,m.mrr||0,m.arr||0,m.companyRevenue??m.revenue,m.backgroundRevenue||0,m.companyMrr||0,m.companyArr||0,m.companyRoas??m.roas??'',m.ownedPublished||0,m.workHours||0,m.teamCapacity||0,m.seedingAttempts||0,m.expectedPlacements||0,m.referralFee||0,m.awarenessLoss||0,m.ownedRetention??'',m.paidRetention??'',m.memoryAfter.organicAssets,m.performanceVisits||0,m.organicShare||0,m.creativeWorkHours||0,m.creativeRefreshes||0,m.adCpc??'',m.channels.find(c=>c.id==='search')?.effectiveCpc??'',m.channels.find(c=>c.id==='display')?.effectiveCpc??'',m.channels.find(c=>c.id==='social')?.effectiveCpc??'',m.channels.some(c=>c.id==='display')?(m.channels.find(c=>c.id==='display')?.creativeAge||0)+1:'',m.channels.find(c=>c.id==='display')?.conversionMultiplier??'',m.channels.some(c=>c.id==='social')?(m.channels.find(c=>c.id==='social')?.creativeAge||0)+1:'',m.channels.find(c=>c.id==='social')?.conversionMultiplier??'',m.strategy?.searchBrandMultiplier??'',m.strategy?.adMultiplier??'',m.strategy?.gate.eligible?'가능':'불가',m.strategy?.profile.involvement??'',m.strategy?.profile.repurchasable?'가능':'없음',m.funding?.baseBudget??m.budget,m.funding?.previousRevenue??0,m.funding?.reinvestmentAmount??0,m.funding?.reinvestmentRate??0,m.funding?.nextBudget??m.budget,m.groupBuyRevenue||0,m.groupBuyFee||0,m.channels.filter(c=>c.group==='performance'&&!['search','display','social'].includes(c.id)).map(c=>`${c.name}: 집행 ${c.spend} / CPC ${c.effectiveCpc} / 소재 ${(c.creativeAge||0)+1}개월`).join(' | '),m.strategy?.content?.blogCount??'',m.strategy?.content?.snsCount??'',m.strategy?.content?.adConversionMultiplier??'',m.strategy?.content?.referralMultiplier??'',m.referralConversionRate??'',m.strategy?.brand?.contentCap??'',m.strategy?.brand?(m.strategy.brand.megaEligible?'가능':'불가'):'',m.funding?.totalBudget??'',m.funding?.cumulativeRevenue??'',m.funding?.cumulativeSpend??'',m.funding?.recommendedBudget??m.budget,m.funding?.nextRecommendedBudget??'',m.funding?.settledFromRevenue||0]);
  return '\uFEFF'+[header,...rows].map(r=>r.map(value=>{const text=String(value);return /[",\r\n]/.test(text)?'"'+text.replaceAll('"','""')+'"':text;}).join(',')).join('\r\n');
}
