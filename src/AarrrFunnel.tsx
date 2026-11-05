import {useId} from 'react';
import {ArrowDownLeft,ArrowUpRight,Users} from 'lucide-react';
import {Metrics,number,pct,won} from './types';

export default function AarrrFunnel({metrics:m,preview=false}:{metrics?:Metrics;preview?:boolean}) {
  const id=useId().replace(/:/g,'');
  const demand=m?.demandOrders??m?.newOrders??0;
  const steps=[
    {name:'Acquisition',ko:'방문 유입',count:m?.visits||0,unit:'명',detail:`오거닉 ${number(m?.organicVisits||0)}명`},
    {name:'Activation',ko:'관심 · 리드',count:m?.leads||0,unit:'명',detail:`방문 → 리드 ${pct(m?.leadRate||0,true)}`},
    {name:'Retention',ko:'재관심',count:m?.retained||0,unit:'명',detail:`리드 → 재관심 ${pct(m?.retentionRate||0,true)}`},
    {name:'Revenue',ko:m?.salesModel==='service'?'신규 계약 수요':'신규 구매',count:demand,unit:'건',detail:`재관심 → 구매 ${pct(m?.closeRate||0,true)}`},
  ];
  const max=Math.max(steps[0].count,1),center=116;
  // Square-root scaling keeps small downstream cohorts visible; exact counts are printed.
  const half=steps.map(s=>s.count?Math.max(4,Math.sqrt(Math.min(s.count/max,1))*88):0);
  const widths=[...half,half[3]];
  const segment=(i:number,pad=0)=>{
    const x=i*240,next=x+240,a=widths[i]?widths[i]+pad:0,b=widths[i+1]?widths[i+1]+pad:0;
    return `M${x} ${center-a} C${x+120} ${center-a},${x+120} ${center-b},${next} ${center-b} L${next} ${center+b} C${x+120} ${center+b},${x+120} ${center+a},${x} ${center+a} Z`;
  };
  return <section className="card aarrr-funnel" aria-label="AARRR 고객 여정 깔때기">
    <div className="section-title"><h2>AARRR <span>고객이 매출로 이어지는 흐름</span></h2><span>{preview?'이번 달 예상':m?`${m.month}개월 차 결과`:'첫 실행을 기다리는 중'}</span></div>
    <div className="funnel-scroll"><div className="funnel-canvas">
      <div className="funnel-headings">{steps.map((s,i)=><div key={s.name}><span>{i<2?'A':'R'} <small>{s.name}</small></span><b>{s.ko}</b></div>)}</div>
      <svg className="funnel-stream" viewBox="0 0 960 232" preserveAspectRatio="none" role="img" aria-label={steps.map(s=>`${s.ko} ${number(s.count)}${s.unit}`).join(', ')}>
        <defs><linearGradient id={`stream-${id}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#accbff"/><stop offset=".6" stopColor="#7ca7f2"/><stop offset="1" stopColor="#548dff"/></linearGradient></defs>
        {[0,1,2,3].map(i=><g key={i}><path d={segment(i,10)} fill={`url(#stream-${id})`} opacity={.18+i*.035}/><path d={segment(i)} fill={`url(#stream-${id})`} opacity={.35+i*.13}/><line x1={i*240} y1="9" x2={i*240} y2="223" stroke="#666c84" strokeOpacity=".5"/></g>)}<line x1="959" y1="9" x2="959" y2="223" stroke="#666c84" strokeOpacity=".5"/>
        {!m&&<line x1="0" y1={center} x2="960" y2={center} stroke="#727b97" strokeDasharray="5 7"/>}
      </svg>
      <div className="funnel-counts">{steps.map(s=><div key={s.name}><strong>{number(s.count)}<small>{s.unit}</small></strong></div>)}</div>
      <div className="funnel-details">{steps.map(s=><span key={s.name}>{s.detail}</span>)}</div>
    </div></div>
    <div className="funnel-branches"><div><Users size={15}/><span><b>R · Referral</b> 추천 유입 {number(m?.referralVisits||0)}명</span><small><ArrowUpRight size={12}/>이번 달 전체 방문에 포함</small></div><div><ArrowDownLeft size={15}/><span>인식 매출 <b>{won(m?.revenue||0)}</b></span><small>{m?.salesModel==='service'?`완료 ${number(m.newOrders)}건 · 대기 ${number(m.serviceBacklog||0)}건`:m?.salesModel==='subscription'?`활성 구독 ${number(m.activeSubscribers||0)}명 · 갱신 포함`:'신규 판매 + 재구매'}</small></div></div>
    <p className="funnel-footnote">띠 두께는 가독성을 위해 제곱근 비율로 표시합니다. 추천 유입은 구매의 필수 단계가 아닌 추가 유입 경로예요.</p>
  </section>;
}
