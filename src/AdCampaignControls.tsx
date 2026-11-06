import {ExternalLink,RefreshCw} from 'lucide-react';
import {isSearchAd,searchCpcFor,brandSearchDemand,adStateFor,benchmarkFor,AD_SOURCES,MEDIA_SOURCES,adFormatsFor,campaignFor} from '../model.mjs';
import {Select} from './components';
import {AdCampaign,Business,Channel,Memory,Plan,Product,won,number} from './types';

export function CpcReferencePanel({business}:{business:Business}) {
 const b=benchmarkFor(business.industry);
 return <details className="cpc-research"><summary>광고 단가 · 강의 설정 / 해외 참고 자료</summary><p>실제 게임의 일반 키워드 CPC: {business.market} {won(searchCpcFor(business.market))} · 자사명 CPC {won(searchCpcFor(business.market,'brand-sa'))}. 네이버 브랜드 검색 월 300–500만 원. 모두 강의용 설정이며 국내 시장 평균·실제 견적을 뜻하지 않습니다.</p><p>{b.mapping} · {b.category}</p><div className="cpc-research-grid"><div><span>해외 SA 참고 · 게임 단가와 별도</span><b>{won(b.search)}</b><small>원문 US$ {b.searchUsd}</small><a href={AD_SOURCES.search.url} target="_blank" rel="noreferrer">검색광고 출처<ExternalLink size={11}/></a></div><div><span>DA · 일반 디스플레이</span><b>{won(b.display)}</b><small>SA × 18% 교육용 추정</small><small>실측 업종 평균 아님</small></div><div><span>소셜 DA · Meta 2026</span><b>{won(b.social)}</b><small>트래픽 목적 · 원문 US$ {b.socialUsd}</small><a href={AD_SOURCES.social.url} target="_blank" rel="noreferrer">Meta 출처<ExternalLink size={11}/></a></div></div><p>고정 교육 환산 1달러 = {number(b.fx)}원 · 국내 네이버/카카오 실측 CPC가 아닙니다. 인접 업종 대용값은 위에 표시했어요. 확인일 {b.checkedAt}.</p><small>SA는 Google·Microsoft 검색 캠페인, 소셜은 Meta 트래픽 캠페인 참고값입니다. 캠페인·국가·키워드가 달라 직접적인 플랫폼 우열 비교를 뜻하지 않아요.</small><div className="ad-research-links"><a href={AD_SOURCES.campaign.url} target="_blank" rel="noreferrer">Google 캠페인 유형<ExternalLink size={11}/></a><a href={AD_SOURCES.fatigue.url} target="_blank" rel="noreferrer">소재 피로도 참고<ExternalLink size={11}/></a></div></details>;
}

export default function AdCampaignControls({channel:c,plan,onChange,business,product,memory,disabled}:{channel:Channel;plan:Plan;onChange:(v:Plan)=>void;business:Business;product:Product;memory:Memory;disabled:boolean}) {
 const state=adStateFor({business,product,plan,memory},c.id),settings=campaignFor(plan,c.id);
 const update=(patch:Partial<AdCampaign>)=>onChange({...plan,campaigns:{...plan.campaigns,[c.id]:{...settings,...patch}}});
 const hasCreative=!!memory.adCreatives?.[product.id]?.[c.id],active=!!plan.units[c.id];
 return <div className="ad-campaign-controls">
  <div className="ad-cpc">{c.id==='naver-brand'?<><span>월 정액 · 클릭당 과금 없음</span><small>300·400·500만 원 패키지 · 월 1개 계약</small></>:<><span>{isSearchAd(c.id)?'강의 설정 CPC':'추정 CPC'} <b>{won(state.baseCpc)}</b></span><small>전략·소재 반영 약 {won(Math.round(state.effectiveCpc))}</small></>}</div>
  {['brand-sa','naver-brand'].includes(c.id)&&<p>월초 브랜드 검색 수요 약 {number(brandSearchDemand(memory))}명. 자사명 SA·네이버 브랜드 검색이 이 수요를 나눠 확보합니다. {c.id==='brand-sa'?'실제 확보한 클릭만 과금해요.':'월 정액은 검색 수요가 없어도 전액 발생해요.'}</p>}
  {c.id==='search'?<><Select label="SA 키워드 전략" value={settings.keyword} onChange={v=>update({keyword:v as AdCampaign['keyword']})} disabled={disabled} options={[{value:'purchase',label:'구매 의도 키워드',detail:'참고 CPC × 1 · 높은 구매 의도'},{value:'explore',label:'탐색 키워드',detail:'CPC × 0.7 · 넓은 유입, 낮은 구매 의도'}]}/><p>집행하는 달에 키워드·문안 운영 {state.workHours.toFixed(1)}h를 배정해요. 배너·영상 제작과 소재 피로도는 적용하지 않습니다.</p></>:isSearchAd(c.id)?<p>브랜드 검색 문안·영역 운영 {state.workHours.toFixed(1)}h를 배정합니다. 인지도와 콘텐츠 기반이 전환에 함께 반영됩니다.</p>:<>
    <Select label={`${c.name} 소재 형식`} value={settings.format} onChange={v=>update({format:v as AdCampaign['format']})} disabled={disabled} options={[{value:'image',label:'이미지·배너',detail:'새 소재 세트당 일반 역량 6시간'},{value:'video',label:'숏폼 영상',detail:'새 소재 세트당 일반 역량 16시간'}].filter(o=>adFormatsFor(c.id).includes(o.value as 'image'|'video'))}/>
    <Select label={`${c.name} 소재 교체 주기`} value={String(settings.refreshMonths)} onChange={v=>update({refreshMonths:Number(v) as AdCampaign['refreshMonths'],skipRefresh:false})} disabled={disabled} options={[{value:'1',label:'매월 신규 소재 제작'},{value:'2',label:'2개월마다 교체'},{value:'3',label:'3개월마다 교체'},{value:'0',label:'교체 없이 기존 소재 유지'}]}/>
    <div className={`creative-status ${state.creativeAge>=2?'creative-stale':''}`}><span>{state.creativeRefreshed?(hasCreative?'이번 달 소재 교체':'첫 집행에 소재 제작 필요'):`동일 소재 ${state.creativeAge+1}개월째`}</span><b>전환 효율 ×{state.conversionMultiplier.toFixed(2)}</b><small>{active?`이번 달 제작 ${state.creativeHours.toFixed(1)}시간`:'광고를 배정하면 제작 시간이 합산됩니다.'}</small>{hasCreative&&<button className="text-button" disabled={disabled} onClick={()=>update({refreshNow:!settings.refreshNow,skipRefresh:false})}><RefreshCw size={12}/>{settings.refreshNow?'이번 달 교체 취소':'이번 달 바로 새로 제작'}</button>}</div>
    <p>동일 소재 3개월째에는 기본 전환 효율 ×0.65. 신규 제작으로 회복하지만 마케터 시간을 사용해요.</p>
  </>}
  <small className="ad-model-note">{c.id==='naver-brand'?<>월 300–500만 원은 강의용 패키지 가정입니다. 실제 상품은 유형·검색량·계약 기간에 따라 달라요. <a href="https://ads.naver.com/help/faq/1006" target="_blank" rel="noreferrer">네이버 공식 안내<ExternalLink size={11}/></a></>:MEDIA_SOURCES[c.id]?.basis||'키워드 보정·감쇠율·제작 시간은 게임용 가정입니다.'}{MEDIA_SOURCES[c.id]&&<> · <a href={MEDIA_SOURCES[c.id].url} target="_blank" rel="noreferrer">공식 상품 안내<ExternalLink size={11}/></a></>}</small>
 </div>;
}
