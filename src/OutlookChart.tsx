import {Metrics,money} from './types';
export default function OutlookChart({baseline,forecast}:{baseline:Metrics[];forecast:Metrics[]}) {
  const max=Math.max(100000,...baseline.map(m=>m.companyRevenue??m.revenue),...forecast.map(m=>m.companyRevenue??m.revenue))*1.15;
  const x=(i:number)=>56+i*510/Math.max(forecast.length-1,1),y=(n:number)=>158-n/max*130;
  const path=(rows:Metrics[])=>rows.map((m,i)=>`${i?'L':'M'}${x(i)} ${y(m.companyRevenue??m.revenue)}`).join(' ');
  return <div className="outlook-chart"><div className="outlook-legend"><span><i/>이번 달 전략 유지</span><span><i/>월별 설계</span></div><svg viewBox="0 0 600 195" role="img" aria-label="이번 달 전략 유지와 월별 설계의 기업 예상 매출 비교">{[0,.5,1].map(r=><g key={r}><line x1="56" x2="580" y1={y(max*r)} y2={y(max*r)} stroke="#41485c" strokeDasharray="3 5"/><text x="0" y={y(max*r)+3} fontSize="9" fill="#a3a7b9">{money(max*r)}</text></g>)}<path d={path(baseline)} fill="none" stroke="#a6a4bd" strokeWidth="2" strokeDasharray="5 5"/><path d={path(forecast)} fill="none" stroke="#c9dda1" strokeWidth="2.5"/>{forecast.map((m,i)=><g key={m.month}><circle cx={x(i)} cy={y(m.companyRevenue??m.revenue)} r="4" fill="#c9dda1"><title>{m.month}개월 차 기업 예상 매출 {money(m.companyRevenue??m.revenue)}원</title></circle><text x={x(i)} y="184" textAnchor="middle" fontSize="9" fill="#afb4c2">M{m.month}</text></g>)}</svg></div>;
}
