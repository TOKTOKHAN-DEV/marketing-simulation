import {Clock3,Repeat2} from 'lucide-react';
import {Metrics,money,number,pct,won} from './types';
export default function SalesSummary({metrics:m,month,compact=false}:{metrics?:Partial<Metrics>;month?:number;compact?:boolean}) {
  if(!m||!['service','subscription'].includes(m.salesModel||''))return null;
  const service=m.salesModel==='service';
  const items=service?[
    {label:'완료 · 매출 인식',value:`${number(m.newOrders||0)}건`},
    {label:'사용 / 배정 시간',value:`${number(m.hoursUsed||0)} / ${number(m.monthlyHours||0)}h`},
    {label:'이월 작업',value:`${number(m.serviceBacklog||0)}건`},
    {label:'이월 잔여 작업량',value:`${number(Math.round((m.servicePipelineHours||0)*10)/10)}h`},
  ]:[
    {label:'MRR · 월 반복매출',value:`${money(m.mrr||0)}원`},
    {label:'ARR · 현재 MRR × 12',value:`${money(m.arr||0)}원`},
    {label:'활성 구독자',value:`${number(m.activeSubscribers||0)}명`},
    {label:'이번 달 해지',value:`${number(m.churnedSubscribers||0)}명`},
  ];
  return <section className={`sales-summary ${compact?'compact':''} ${service?'service':'subscription'}`}><div className="sales-summary-heading"><span>{service?<Clock3 size={14}/>:<Repeat2 size={14}/>} {service?'시간 투입형 · 처리 용량':'구독형 · 반복매출'}</span>{month!==undefined&&<small>{month}개월 차 · 선택 상품</small>}</div><div className="sales-summary-grid">{items.map(i=><div key={i.label}><span>{i.label}</span><b>{i.value}</b></div>)}</div><p>{service?`수요 ${number(m.demandOrders||0)}건 + 이전 대기 ${number(m.serviceOpeningBacklog||0)}건 중 완료한 건만 매출로 계산해요.`:`신규 ${number(m.newSubscribers||0)}명 · 갱신 ${number(m.retainedSubscribers||0)}명 · 모의 월 해지율 ${pct(m.churnRate||0,true)}. ARR은 연환산 지표예요.`}</p></section>;
}
