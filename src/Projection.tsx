import { useState } from 'react';
import { ArrowDownToLine, ChevronDown, ChevronUp, Info, Table2 } from 'lucide-react';
import { industryFor, teamFor,projectMonthly,outlookPlans } from '../model.mjs';
import OutlookChart from './OutlookChart';
import {Select} from './components';
import { BrandCard } from './Dashboard';
import { Business, Memory, Metrics, Plan, Product, money, number, pct, won,OutlookMonth } from './types';

export default function Projection({forecast:baseline,plan,business,product,products,memory,outlook,onOutlook,onExport,onModel,onMix,horizon,onHorizon}:{forecast:Metrics[];plan:Plan;business:Business|null;product?:Product;memory:Memory;products:Product[];outlook?:OutlookMonth[];onOutlook:(v:OutlookMonth[])=>void;onExport:(rows:Metrics[])=>void;onModel:()=>void;onMix:()=>void;horizon:number;onHorizon:(v:number)=>void}) {
  const [detailed,setDetailed]=useState(false);
  const industry=industryFor(business?.industry||'commerce');
  const months=Array.from({length:6},(_,i)=>outlook?.[i]||{owned:plan.units.owned||0,adPercent:100});
  const forecast=business&&product?projectMonthly({business,product,products,plan,memory,stage:3},outlookPlans(plan,months.slice(0,horizon))):[];
  const updateMonth=(index:number,patch:Partial<OutlookMonth>)=>onOutlook(months.map((m,i)=>i===index?{...m,...patch}:m));
  const hasAds=!!((plan.units.search||0)+(plan.units.social||0)+(plan.units.display||0));
  const hasCreative=!!((plan.units.display||0)+(plan.units.social||0));
  const paused=business&&product?projectMonthly({business,product,products,plan,memory,stage:3},outlookPlans(plan,months.slice(0,horizon).map((m,i)=>({...m,adPercent:i===0?m.adPercent:0})))):[];
  const noAds=paused[1],sameMonth=baseline[1];
  const reduction=sameMonth&&sameMonth.companyRevenue?Math.round((1-(noAds?.companyRevenue||0)/sameMonth.companyRevenue)*100):null;
  const service=product?.purchaseType==='service',subscription=product?.purchaseType==='subscription';
  const multi=(forecast[0]?.productSales?.length||0)>1;
  const hasSubscription=forecast.some(m=>m.productSales?.some(p=>p.salesModel==='subscription'));
  const sum=(key:'revenue'|'spend'|'newOrders'|'attributedRevenue')=>forecast.reduce((a,m)=>a+(key==='revenue'?(m.companyRevenue??m.revenue):key==='attributedRevenue'?(m.companyAttributedRevenue??m.attributedRevenue):m[key]),0);
  const over=forecast.some(m=>m.spend>m.budget);
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
    {group:'R',name:'Referral · 추천 방문',formula:'이전 누적 고객 × 추천 의향',value:m=>`${number(m.referralVisits)}명`},
    {group:'R',name:service?'Revenue · 계약 수요':subscription?'Revenue · 신규 가입':'Revenue · 신규 구매',formula:'재관심 리드 × 구매 전환율',value:m=>`${number(m.demandOrders??m.newOrders)}건`},
    {group:'',name:'방문 → 신규 구매율',formula:'신규 구매 ÷ 전체 방문',value:m=>pct(m.visits?(m.demandOrders??m.newOrders)/m.visits:0,true)},
    {group:'',name:'재관심 → 구매 전환율',formula:'업종 × 가격 장벽 × 신뢰 × 미디어 구매 의도',value:m=>pct(m.closeRate,true)},
    {group:'',name:'재구매 · 갱신',formula:product?.purchaseType==='oneoff'?'단건 상품은 재구매 없음':'해당 상품의 기존 고객 × 구매 방식별 재구매율',value:m=>`${number(m.repeatOrders)}건`},
    ...(service?[
      {group:'h',name:'월 배정 시간',formula:'이 상품에 배정한 수행 시간',value:(m:Metrics)=>`${number(m.monthlyHours||0)}h`},
      {group:'',name:'이번 달 사용 시간',formula:'가용 시간과 이월·신규 작업량 중 작은 값',value:(m:Metrics)=>`${number(m.hoursUsed||0)}h`},
      {group:'✓',name:'서비스 완료 건수',formula:'진행 시간을 누적해 완료한 건수',value:(m:Metrics)=>`${number(m.newOrders)}건`},
      {group:'',name:'기말 이월 작업',formula:'이전 대기 + 신규 수요 − 완료',value:(m:Metrics)=>`${number(m.serviceBacklog||0)}건`},
      {group:'',name:'이월 잔여 작업량',formula:'대기 건수 × 건당 시간 − 진행 시간',value:(m:Metrics)=>`${number(m.servicePipelineHours||0)}h`},
      {group:'',name:'이월 수요 환산액 (매출 제외)',formula:'미완료 건수 × 계약 단가',value:(m:Metrics)=>won(m.backlogValue||0)},
    ]:subscription?[
      {group:'↻',name:'활성 구독자',formula:'기존 갱신 고객 + 신규 가입',value:(m:Metrics)=>`${number(m.activeSubscribers||0)}명`},
      {group:'',name:'갱신 고객',formula:'기존 활성 고객 × (1 − 모의 해지율)',value:(m:Metrics)=>`${number(m.retainedSubscribers||0)}명`},
      {group:'',name:'해지 고객',formula:'기존 활성 고객 − 갱신 고객',value:(m:Metrics)=>`${number(m.churnedSubscribers||0)}명`},
      {group:'',name:'모의 월 해지율',formula:'상품에 직접 설정한 교육용 해지율',value:(m:Metrics)=>pct(m.churnRate||0,true)},
    ]:[]),
    {group:'₩',name:multi?'선택 상품 매출':'예상 매출',formula:service?'완료 건수 × 계약 단가':subscription?'활성 구독자 × 월 구독료':'(신규 구매 + 재구매) × 상품 가격',value:m=>won(m.revenue),highlight:!multi},
    ...(multi?[
      {group:'',name:'기존 다른 상품 매출',formula:'다른 상품의 갱신·재구매·기존 작업 완료',value:(m:Metrics)=>won(m.backgroundRevenue||0)},
      {group:'₩',name:'기업 매출 합계',formula:'선택 상품 매출 + 다른 상품 매출',value:(m:Metrics)=>won(m.companyRevenue??m.revenue),highlight:true},
    ]:[]),
    ...(hasSubscription?[
      {group:'↻',name:'기업 MRR · 월 반복매출',formula:'모든 구독 상품의 활성 고객 × 월 구독료 합계',value:(m:Metrics)=>won(m.companyMrr||0)},
      {group:'',name:'기업 ARR · 연환산',formula:'현재 기업 MRR × 12 (실제 연 매출 예측 아님)',value:(m:Metrics)=>won(m.companyArr||0)},
    ]:[]),
    {group:'',name:'마케팅 유입 귀속 매출',formula:'신규 매출 × 미디어 방문 비중',value:m=>won(m.attributedRevenue)},
    {group:'',name:'자연 · 추천 유입 매출',formula:'신규 매출 − 마케팅 유입 귀속 매출',value:m=>won(m.organicRevenue)},
    {group:'',name:'집행 예산',formula:'이번 달 외부 발행비 + 협찬 원가 + 레퍼럴 수수료',value:m=>won(m.spend)},
    {group:'',name:'미배분 예산',formula:'월 예산 한도 − 집행 예산',value:m=>won(m.unallocated)},
    {group:'%',name:'마케팅 ROAS',formula:'마케팅 유입 귀속 매출 ÷ 집행 예산 × 100',value:m=>pct(m.companyRoas??m.roas),highlight:true},
    {group:'',name:'퍼포먼스 광고 ROAS',formula:'SA·DA·소셜 광고 귀속 매출 ÷ 해당 광고비 × 100',value:m=>pct(m.performanceRoas)},
    {group:'',name:'총매출 / 마케팅비 (MER)',formula:'재구매 포함 전체 매출 ÷ 집행 예산 × 100',value:m=>pct(m.companyMer??m.mer)},
    {group:'',name:service?'계약 수요 CPA':'신규 구매 CPA',formula:'집행 예산 ÷ 신규 구매 수',value:m=>m.cpa===null?'—':won(m.cpa)},
    {group:'',name:'DA·소셜 소재 전환 효율',formula:'소재 사용 개월·품질·형식에 따른 채널별 보정',value:m=>m.channels.filter(c=>c.id==='display'||c.id==='social').map(c=>`${c.id==='display'?'DA':'소셜'} ${(c.creativeAge||0)+1}개월 ×${c.conversionMultiplier?.toFixed(2)}`).join(' / ')||'—'},
    {group:'',name:'DA 소재 제작 시간',formula:'이미지 6h · 숏폼 16h / 세트, 마케터 역량 속도 반영',value:m=>`${m.creativeWorkHours||0}h`},
    {group:'',name:'DA 신규 소재 세트',formula:'교체 주기 또는 이번 달 새로 제작한 채널 수',value:m=>`${m.creativeRefreshes||0}세트`},
    {group:'',name:'퍼포먼스 실효 CPC',formula:'광고 집행비 ÷ 광고 방문 · 업종 참고 CPC와 소재 피로도 반영',value:m=>m.adCpc?won(m.adCpc):'—'},
    {group:'',name:'이번 달 온드 발행',formula:'각 월에 직접 설계한 온드 발행량',value:m=>`${number(m.ownedPublished||0)}편`},
    {group:'',name:'마케터 배정 / 가용 시간',formula:'온드 제작·시딩 접촉 시간 / 내부 인력 월 시간',value:m=>`${m.workHours||0} / ${m.teamCapacity||0}h`},
    {group:'',name:'시딩 접촉 / 예상 발행',formula:'협찬 8% · 유료 30% · 레퍼럴 5%의 기대값',value:m=>`${m.seedingAttempts||0}명 / ${m.expectedPlacements||0}건`},
    {group:'',name:'레퍼럴 수수료',formula:'추천 유입의 신규 매출 × 수수료율 (갱신 제외)',value:m=>won(m.referralFee||0)},
    {group:'',name:'기존 인지도 월 감쇠',formula:'온드·페이드별 전월 인지도 × (1 − 월 유지율)',value:m=>`${m.awarenessLoss||0}점`},
    {group:'',name:'온드 검색 자산',formula:'전월 검색 자산 × 0.96 + 이번 달 온드 발행 효과',value:m=>`${m.memoryAfter.organicAssets}`},
    {group:'✦',name:'월말 브랜드 인지도',formula:`전월 온드 인지도 × ${teamFor(business).awarenessRetention}% + 페이드 × ${Math.max(0,teamFor(business).awarenessRetention-8)}% + 신규 활동 효과`,value:m=>`${m.memoryAfter.awareness} / 100`},
    {group:'',name:'월말 브랜드 신뢰도',formula:'전월 신뢰도 × 0.98 + 미디어별 신뢰 효과',value:m=>`${m.memoryAfter.trust} / 100`},
  ];
  return <div className="view-enter"><section className="projection-intro"><div><span className="eyebrow">THE NEXT {horizon} MONTHS</span><h2>이 예산이, 어떤 성장을 만들까요?</h2><p>{product?`${product.name} · ${won(product.price)} · 월 예산 한도 ${money(plan.budget)}원`:'상품을 등록하고 미디어 믹스를 설정해주세요.'}</p></div><div className="segmented horizon-switch" aria-label="예측 기간">{[3,6].map(n=><button key={n} onClick={()=>onHorizon(n)} className={horizon===n?'active':''}>{n}개월</button>)}</div></section>
    {!!forecast.length&&<section className="card monthly-outlook"><div className="section-title"><h2>월별 전략 시뮬레이션</h2><span>기록에 반영되지 않는 미리보기</span></div><p>온드블로그 발행량과 SA·DA·소셜 광고비를 월마다 바꿔보세요. 나머지 미디어 수량은 이번 달 전략을 유지합니다.</p><div className="outlook-presets"><button className="button secondary small" onClick={()=>onOutlook(months.map(m=>({...m,adPercent:100})))}>광고 유지</button><button className="button secondary small" onClick={()=>onOutlook(months.map((m,i)=>({...m,adPercent:i<2?100:50})))} disabled={!hasAds}>2개월 유지 후 광고 50%</button><button className="button secondary small" onClick={()=>onOutlook(months.map((m,i)=>({...m,adPercent:i===0?100:0})))} disabled={!hasAds}>다음 달부터 광고 중단</button></div>
      {!hasAds&&<p className="outlook-hint">현재 전략에 SA·DA·소셜 광고가 없어요. 미디어 믹스에 광고를 추가하면 광고비 축소를 비교할 수 있습니다.</p>}
      <div className="monthly-plan-scroll"><table className="monthly-plan-table"><thead><tr><th>월</th><th>온드블로그</th><th>광고 집행 비율</th><th>DA 소재</th><th>제작 업무</th><th>예상 집행비</th><th>기업 예상 매출</th><th>오거닉 / 광고 유입</th></tr></thead><tbody>{forecast.map((m,i)=><tr key={m.month} className={(m.workHours||0)>(m.teamCapacity||0)||m.spend>m.budget?'outlook-invalid':''}><th>M{m.month}</th><td><div className="outlook-unit"><input aria-label={`${m.month}개월 차 온드 발행량`} type="number" min={0} max={2000} step={1} value={months[i].owned} onChange={e=>updateMonth(i,{owned:Math.max(0,Math.min(2000,Math.floor(Number(e.target.value))))})}/><span>편</span></div></td><td><Select label={`${m.month}개월 차 광고 집행 비율`} value={String(months[i].adPercent)} onChange={v=>updateMonth(i,{adPercent:Number(v)})} disabled={!hasAds} options={[100,75,50,25,0].map(n=>({value:String(n),label:n?`${n}%`:'중단'}))}/></td><td><Select label={`${m.month}개월 차 DA 소재 제작`} value={months[i].creativeAction||'auto'} onChange={v=>updateMonth(i,{creativeAction:v as OutlookMonth['creativeAction']})} disabled={!hasCreative||!m.channels.some(c=>c.id==='display'||c.id==='social')} options={[{value:'auto',label:'교체 주기 적용'},{value:'refresh',label:'신규 제작'},{value:'reuse',label:'기존 소재 유지'}]}/><div className="creative-month-state">{m.channels.filter(c=>c.id==='display'||c.id==='social').map(c=><span key={c.id}>{c.id==='display'?'DA':'소셜'} {(c.creativeAge||0)+1}개월 · 전환 ×{c.conversionMultiplier?.toFixed(2)}</span>)}</div></td><td>{m.creativeWorkHours||0}h</td><td>{money(m.spend)}원</td><td>{money(m.companyRevenue??m.revenue)}원</td><td><span className="organic-number">{number(m.organicVisits)}</span> / {number(m.performanceVisits||0)}명</td></tr>)}</tbody></table></div>
      {forecast.some(m=>(m.workHours||0)>(m.teamCapacity||0))&&<p className="inline-error">내부 가용 시간을 넘는 월이 있어요. 실제 실행 전 온드 발행량이나 인력 배정을 조정하세요.</p>}
      <div className="outlook-comparison"><div><span>현재 검색 자산</span><b>{number(memory.organicAssets)}</b><small>광고 중단 후에도 월 4% 감쇠하며 유입에 기여</small></div><div><span>다음 달 광고 중단 시 예상 매출</span><b>{won(noAds?.companyRevenue??noAds?.revenue??0)}</b><small>{reduction!==null?`현재 전략 유지 대비 ${Math.abs(reduction)}% ${reduction>=0?'감소':'증가'}`:'전략 유지 시나리오와 비교'} · 온드 계획·다른 미디어 유지</small></div></div>
      <OutlookChart baseline={baseline} forecast={forecast}/><p className="outlook-hint">광고는 당월 방문을 만듭니다. 온드 자산과 브랜드 신뢰가 쌓이면 광고를 줄여도 자연 유입이 남습니다. 구독 갱신·SI 완료 매출은 별도 요인으로 함께 반영돼요.</p>
    </section>}
    <div className="projection-stats"><div><span>{horizon}개월 총 집행</span><strong>₩ {money(sum('spend'))}</strong></div><div><span>{horizon}개월 기업 예상 매출</span><strong className="accent">₩ {money(sum('revenue'))}</strong></div><div><span>{service?'선택 상품 완료 건수':subscription?'선택 상품 신규 가입':'신규 구매 합계'}</span><strong>{number(sum('newOrders'))}<small>건</small></strong></div><div><span>누적 마케팅 ROAS</span><strong>{pct(sum('spend')?Math.round(sum('attributedRevenue')/sum('spend')*100):null)}</strong></div></div>
    <div className={`projection-note ${over?'danger':''}`}><Info size={15}/><span>{over?'배분 금액이 예산 한도를 초과했어요. 미디어 믹스를 조정해야 실행할 수 있습니다.':'월별 설계와 기존 검색 자산·인지도·구독 갱신·진행 작업을 반영해요. 미리보기는 기록에 반영되지 않아요.'}</span></div>
    <section className="card projection-table-card"><div className="section-title"><h2><Table2 size={16}/> AARRR 매출 전망</h2><div className="projection-table-actions"><button className="icon-button" aria-label="매출 전망 CSV 내보내기" disabled={!forecast.length} onClick={()=>onExport(forecast)}><ArrowDownToLine size={16}/></button><button className="text-button" onClick={()=>setDetailed(!detailed)}>{detailed?'핵심만 보기':'계산 과정 보기'}{detailed?<ChevronUp size={14}/>:<ChevronDown size={14}/>}</button></div></div><div className="table-scroll"><table className="projection-table"><thead><tr><th>고객 여정 / 지표</th>{detailed&&<th>계산 기준</th>}{forecast.map(m=><th key={m.month}>{m.month}개월 차<span>{m.month===memory.month+1?'NEXT MONTH':'PROJECTION'}</span></th>)}</tr></thead><tbody>{rows.filter(r=>detailed||r.group).map(r=><tr key={r.name} className={`${r.highlight?'highlight-row':''} ${r.group?'major-row':'minor-row'}`}><th scope="row"><span className={`row-letter ${r.group?'':'empty'}`}>{r.group||'·'}</span>{r.name}</th>{detailed&&<td className="formula-cell">{r.formula}</td>}{forecast.map(m=><td key={m.month}>{r.value(m)}</td>)}</tr>)}</tbody></table></div>{!forecast.length&&<div className="table-empty"><p>상품과 미디어 믹스를 준비하면 예측표가 만들어져요.</p><button className="text-button" onClick={onMix}>미디어 믹스 설계하기</button></div>}<div className="table-footer"><span>Referral은 구매의 필수 단계가 아닌 다음 달 추가 유입 경로예요.</span></div></section>
    <div className="projection-bottom"><section className="card assumptions-card"><div className="section-title"><h2>이 예측의 출발점</h2><button className="text-button" onClick={onModel}>업종 가정 보기</button></div><div className="assumption-grid"><div><span>업종</span><b>{industry.label}</b></div><div><span>가격 기준점</span><b>{won(industry.referencePrice)}</b></div><div><span>리드 생성 · 가격 계수</span><b>× {forecast[0]?.priceLeadMultiplier.toFixed(2)||'—'}</b></div><div><span>구매 전환 · 가격 계수</span><b>× {forecast[0]?.priceCloseMultiplier.toFixed(2)||'—'}</b></div></div><p>같은 업종에서 상품 가격이 높을수록 두 계수가 함께 낮아져요. 인지도 30점 이상과 온드 콘텐츠 자산은 다음 달 오거닉을 만듭니다.</p><small>수치는 교육용 가정입니다. 실제 시장 평균, 순이익 또는 검증된 매출 전망을 의미하지 않아요.</small></section><BrandCard memory={forecast.at(-1)?.memoryAfter||memory} compact/></div>
  </div>;
}

export function csvFor(forecast:Metrics[]) {
  const header=['월','월예산한도','집행예산','미배분','미디어유입','오거닉유입','추천유입','전체방문','리드생성률','리드수','재관심률','재관심리드','구매전환율','신규구매','재구매','선택상품매출','마케팅귀속매출','자연추천매출','마케팅ROAS(%)','퍼포먼스ROAS(%)','MER(%)','인지도','신뢰도','판매구조','계약수요','완료건수','이월작업','배정시간','사용시간','이월잔여시간','활성구독자','신규가입','갱신','해지','모의해지율','상품MRR','상품ARR','기업매출','다른상품매출','기업MRR','기업ARR','기업ROAS(%)','온드발행','마케터사용시간','마케터가용시간','시딩접촉','시딩예상발행','레퍼럴수수료','인지도감쇠','온드유지율','페이드유지율','검색자산','광고유입','오거닉비중','소재제작시간','신규소재세트','퍼포먼스실효CPC','SA_CPC','DA_CPC','소셜_CPC','DA소재사용개월','DA전환계수','소셜소재사용개월','소셜전환계수'];
  const rows=forecast.map(m=>[m.month,m.budget,m.spend,m.unallocated,m.marketingVisits,m.organicVisits,m.referralVisits,m.visits,m.leadRate,m.leads,m.retentionRate,m.retained,m.closeRate,m.newOrders,m.repeatOrders,m.revenue,m.attributedRevenue,m.organicRevenue,m.roas??'',m.performanceRoas??'',m.mer??'',m.memoryAfter.awareness,m.memoryAfter.trust,m.salesModel||'oneoff',m.demandOrders??m.newOrders,m.newOrders,m.serviceBacklog||0,m.monthlyHours||0,m.hoursUsed||0,m.servicePipelineHours||0,m.activeSubscribers||0,m.newSubscribers||0,m.retainedSubscribers||0,m.churnedSubscribers||0,m.churnRate||0,m.mrr||0,m.arr||0,m.companyRevenue??m.revenue,m.backgroundRevenue||0,m.companyMrr||0,m.companyArr||0,m.companyRoas??m.roas??'',m.ownedPublished||0,m.workHours||0,m.teamCapacity||0,m.seedingAttempts||0,m.expectedPlacements||0,m.referralFee||0,m.awarenessLoss||0,m.ownedRetention??'',m.paidRetention??'',m.memoryAfter.organicAssets,m.performanceVisits||0,m.organicShare||0,m.creativeWorkHours||0,m.creativeRefreshes||0,m.adCpc??'',m.channels.find(c=>c.id==='search')?.effectiveCpc??'',m.channels.find(c=>c.id==='display')?.effectiveCpc??'',m.channels.find(c=>c.id==='social')?.effectiveCpc??'',m.channels.some(c=>c.id==='display')?(m.channels.find(c=>c.id==='display')?.creativeAge||0)+1:'',m.channels.find(c=>c.id==='display')?.conversionMultiplier??'',m.channels.some(c=>c.id==='social')?(m.channels.find(c=>c.id==='social')?.creativeAge||0)+1:'',m.channels.find(c=>c.id==='social')?.conversionMultiplier??'']);
  return '\uFEFF'+[header,...rows].map(r=>r.join(',')).join('\r\n');
}
