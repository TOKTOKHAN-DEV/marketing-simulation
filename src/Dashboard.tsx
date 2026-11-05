import { ArrowRight, ArrowUpRight, CircleHelp, Leaf, Plus, Sparkles, TrendingUp } from 'lucide-react';
import { brandDescription } from '../model.mjs';
import SalesSummary from './SalesSummary';
import AarrrFunnel from './AarrrFunnel';
import PixelWorld from './PixelWorld';
import { PixelPlant } from './components';
import { Business, Campaign, Memory, Metrics, Product, money, number, pct, won } from './types';

export function GrowthChart({history,forecast}:{history:Campaign[];forecast:Metrics[]}) {
  const actual=[0,...history.map(r=>r.metrics.companyRevenue??r.metrics.revenue)];
  const future=forecast.map(m=>m.companyRevenue??m.revenue);
  const all=[...actual,...future],max=Math.max(...all,100000)*1.25;
  const x=(i:number)=>42+i*(530/Math.max(all.length-1,3)),y=(n:number)=>164-n/max*126;
  const path=(values:number[],offset=0)=>values.map((n,i)=>`${i?'L':'M'}${x(i+offset)},${y(n)}`).join(' ');
  const actualPath=path(actual);
  return <div className="growth-chart"><svg viewBox="0 0 600 200" role="img" aria-label="실행한 월 매출과 현재 미디어 믹스 기준 향후 3개월 예상 매출"><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c9b7f5" stopOpacity=".17"/><stop offset="100%" stopColor="#c9b7f5" stopOpacity="0"/></linearGradient></defs>{[0,.5,1].map(v=><g key={v}><line x1="42" y1={y(max*v)} x2="580" y2={y(max*v)} stroke="#303236" strokeDasharray="3 5"/><text x="0" y={y(max*v)+4} fill="#777d7a" fontSize="9">{money(max*v)}</text></g>)}<path d={`${actualPath} L${x(actual.length-1)},164 L42,164 Z`} fill="url(#chart-fill)"/><path d={actualPath} fill="none" stroke="#c9b7f5" strokeWidth="2.5" strokeLinejoin="round"/>{future.length>0&&<path d={path([actual.at(-1)||0,...future],actual.length-1)} fill="none" stroke="#cfef9d" strokeWidth="2" strokeDasharray="5 6" strokeLinejoin="round"/>}{actual.map((n,i)=><circle key={i} cx={x(i)} cy={y(n)} r="3.5" fill="#c9b7f5"><title>{i}개월 차 매출 {won(n)}</title></circle>)}{future.map((n,i)=><circle key={`future-${i}`} cx={x(actual.length+i)} cy={y(n)} r="3" fill="#cfef9d"><title>{actual.length+i}개월 차 예상 {won(n)}</title></circle>)}{all.map((_,i)=><text key={i} x={x(i)} y="189" fill="#777d7a" fontSize="9" textAnchor="middle">M{i}</text>)}</svg><div className="chart-legend"><span><i/>실행 매출</span><span><i/>예상 매출</span><small>실행한 캠페인 + 다음 3개월</small></div></div>;
}

export function BrandCard({memory,compact=false}:{memory:Memory;compact?:boolean}) {
  const brand=brandDescription(memory);
  return <section className={`card brand-card ${compact?'compact':''}`}><div className="section-title"><h2><Sparkles size={15}/> 브랜드의 온도</h2><span className="soft-pill">정성 리포트</span></div><div className="brand-scene"><div className="pixel-stars">✦<span>+</span></div><PixelPlant small/><span className="brand-level">LEVEL {Math.floor(memory.awareness/20)+1}</span></div><h3>“{brand.title}”</h3><p className="brand-caption">{brand.recognition}</p><div className="brand-bars">{([{key:'awareness',label:'인지도',color:'lime'},{key:'trust',label:'신뢰도',color:'lavender'},{key:'advocacy',label:'추천 의향',color:'peach'}] as const).map(r=><div key={r.key}><span>{r.label}</span><div className={r.color}><i style={{width:`${memory[r.key]}%`}}/></div><b>{Math.round(memory[r.key])}</b></div>)}</div>{!compact&&<div className="brand-thought"><Leaf size={14}/><p>{brand.trust}</p></div>}</section>;
}

export default function Dashboard({business,product,history,memory,forecast,onBusiness,onManageBusiness,onProduct,onMix,onProjection,onModel}:{business:Business|null;product?:Product;history:Campaign[];memory:Memory;forecast:Metrics[];onBusiness:()=>void;onManageBusiness:()=>void;onProduct:()=>void;onMix:()=>void;onProjection:()=>void;onModel:()=>void}) {
  const spend=history.reduce((s,r)=>s+r.metrics.spend,0),revenue=history.reduce((s,r)=>s+(r.metrics.companyRevenue??r.metrics.revenue),0),attributed=history.reduce((s,r)=>s+(r.metrics.companyAttributedRevenue??r.metrics.attributedRevenue),0);
  const last=[...history].reverse().find(r=>r.productSnapshot.id===product?.id);
  const latestSales=history.at(-1)?.metrics.productSales?.find(s=>s.productId===product?.id)||last?.metrics;
  return <div className="view-enter">
    <PixelWorld month={memory.month} businessName={business?.name} onBusiness={business?onManageBusiness:onBusiness} onMix={onMix} onProjection={onProjection} prompt={!business?{title:'당신의 비즈니스로 첫 모험을 시작하세요.',label:'비즈니스 만들기',action:onBusiness}:!product?{title:'어떤 상품으로 고객을 만나볼까요?',label:'첫 상품 만들기',action:onProduct}:undefined}/>
    <div className="finance-grid"><section className="finance-card revenue"><span>기업 누적 매출 <ArrowUpRight size={16}/></span><strong>₩ {money(revenue)}</strong><small>전체 상품 · {history.length}개월 실행</small></section><section className="finance-card"><span>누적 마케팅 집행</span><strong>₩ {money(spend)}</strong><small>미배분 예산 제외</small></section><section className="finance-card"><span>마케팅 ROAS <button aria-label="ROAS 계산 기준" onClick={onModel}><CircleHelp size={14}/></button></span><strong>{pct(spend?Math.round(attributed/spend*100):null)}</strong><small>마케팅 유입 귀속 매출 ÷ 집행비</small></section></div>
    <AarrrFunnel metrics={last?.metrics}/><SalesSummary metrics={latestSales} month={memory.month}/>
    <div className="overview-grid"><section className="card revenue-chart-card"><div className="section-title"><h2>성장 곡선 <span>월별 매출</span></h2><button className="text-button" onClick={onProjection}>매출 전망<ArrowUpRight size={13}/></button></div><div className="chart-head"><span>한 번의 노출보다, 쌓이는 성장.</span><span className="soft-pill"><TrendingUp size={12}/> {memory.month}개월의 기록</span></div><GrowthChart history={history} forecast={forecast}/><div className="chart-note"><span className="mini-icon"><Leaf size={16}/></span><p>브랜드 온드 검색 자산과 브랜드 인지도는 광고를 줄인 뒤에도 자연 유입을 만듭니다.</p></div></section><BrandCard memory={memory}/></div>
    {business&&product&&<button className="next-action-card" onClick={onMix}><span className="next-icon"><Plus size={20}/></span><span><b>{history.length?'다음 달에는 어떤 조합으로 성장할까요?':'첫 번째 미디어 믹스를 설계해보세요.'}</b><small>각 미디어의 단가와 역할을 비교하고, 예산을 배분하세요.</small></span><ArrowRight size={21}/></button>}
  </div>;
}
