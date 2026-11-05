import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, BarChart3, BookOpen, Box, Check, ChevronRight, Info, LayoutGrid, LockKeyhole, Plus, RefreshCw, SlidersHorizontal, Sparkles, Store, X } from 'lucide-react';
import { CHANNELS,clearCreativeActions,industryFor, initialMemory, initialPlan, project, recommendMix } from '../model.mjs';
import MonthTimeline from './MonthTimeline';
import {previewRevision,revisionPayload,mergeRevision,planForRecord} from '../timeline.mjs';
import Dashboard from './Dashboard';
import {PixelIcon} from './PixelArt';
import Mix from './Mix';
import Projection, { csvFor } from './Projection';
import { BusinessForm, BusinessView, ProductForm } from './Forms';
import { Modal, Select } from './components';
import { loadGame,validState } from './storage';
import { Business, Campaign, Config, GameState, Plan, Product, STAGES, View, money, newState, number, pct, salesLabel, won } from './types';

type DialogName='business'|'product'|'model'|'notes'|'history'|null;
const menu=[{id:'dashboard' as const,label:'대시보드',Icon:LayoutGrid},{id:'mix' as const,label:'미디어 믹스',Icon:SlidersHorizontal},{id:'projection' as const,label:'매출 전망',Icon:BarChart3},{id:'business' as const,label:'비즈니스',Icon:Store}];
function download(content:string,filename:string,type:string) {const url=URL.createObjectURL(new Blob([content],{type}));const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);}

export default function App() {
  const [config,setConfig]=useState<Config|null>(null);
  const [state,setState]=useState<GameState>(newState);
  const [ready,setReady]=useState(false);
  const [error,setError]=useState('');
  const [storageError,setStorageError]=useState('');
  const [saved,setSaved]=useState(true);
  const [toast,setToast]=useState('');
  const [dialog,setDialog]=useState<DialogName>(null);
  const [editProduct,setEditProduct]=useState<Product|undefined>();
  const [running,setRunning]=useState(false);
  const inFlight=useRef(false);
  const load=async()=>{
    setError('');
    try {
      const res=await fetch('/api/session',{cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(!res.ok)throw new Error('워크숍 설정을 불러오지 못했어요.');
      const c:Config=await res.json();
      if(!Number.isInteger(c.openStage)||c.openStage<0||c.openStage>4||typeof c.workshopId!=='string')throw new Error('워크숍 설정을 확인해주세요.');
      let game=newState();
      try{game=loadGame(c.workshopId);}catch(e){setStorageError(e instanceof Error?e.message:'브라우저 저장소를 읽을 수 없어요.');}
      setConfig(c);setState(game);setReady(true);
    }catch(e){setError(e instanceof Error?e.message:'연결에 실패했어요. 다시 시도해주세요.');}
  };
  useEffect(()=>{void load();},[]);
  useEffect(()=>{
    if(!ready||!config||storageError)return;
    setSaved(false);
    try{localStorage.setItem(`marketing-quest:v2:${config.workshopId}`,JSON.stringify(state));}
    catch{setStorageError('브라우저에 저장하지 못했어요. 기록을 내보내 보관해주세요.');}
    const id=window.setTimeout(()=>setSaved(true),450);return()=>clearTimeout(id);
  },[state,config,ready,storageError]);
  useEffect(()=>{if(toast){const id=window.setTimeout(()=>setToast(''),4500);return()=>clearTimeout(id);}},[toast]);
  const patch=(p:Partial<GameState>)=>setState(prev=>({...prev,...p}));
  const horizon=state.projectionHorizon||3;
  const setHorizon=(value:number)=>patch({projectionHorizon:value===6?6:3});
  const navigate=(view:View)=>{patch({view});window.scrollTo({top:0,behavior:'smooth'});};
  const stage=Math.min(state.stage,config?.openStage||1);
  const editing=state.view==='mix'?state.history.find(h=>h.id===state.editingCampaignId):undefined;
  const workingBusiness=editing?.businessSnapshot||state.business;
  const product=editing?.productSnapshot||state.products.find(p=>p.id===state.productId)||state.products[0];
  const planKey=`${product?.id||'new'}:monthly`;
  const plan=editing?(state.historyDrafts?.[editing.id]||planForRecord(editing)):(state.plans[planKey]||initialPlan());
  const revision=useMemo(()=>previewRevision(state.history,state.historyDrafts||{}),[state.history,state.historyDrafts]);
  const pendingRevision=revision.changed>0;
  const memory=editing?(revision.history.find(h=>h.id===editing.id)?.memoryBefore||editing.memoryBefore):(state.history.at(-1)?.memoryAfter||initialMemory());
  const productsForPreview=editing?(editing.productsSnapshot||[editing.productSnapshot]):state.products;
  const preview=useMemo(()=>workingBusiness&&product?project({business:workingBusiness,product,products:productsForPreview,plan,memory,stage},editing?1:horizon):[],[workingBusiness,product,productsForPreview,plan,memory,horizon,stage,editing]);
  const setPlan=(value:Plan)=>setState(prev=>{
    if(editing){const historyDrafts={...prev.historyDrafts};if(JSON.stringify(value)===JSON.stringify(planForRecord(editing)))delete historyDrafts[editing.id];else historyDrafts[editing.id]=value;return{...prev,historyDrafts};}
    return{...prev,plans:{...prev.plans,[planKey]:value}};
  });
  const selectMonth=(id?:string)=>{patch({editingCampaignId:id,view:'mix'});window.scrollTo({top:0,behavior:'smooth'});};
  const reusable=[...(editing?state.history.slice(0,state.history.findIndex(h=>h.id===editing.id)):state.history)].reverse().find(h=>h.productSnapshot.id===product?.id);
  const reuse=()=>{if(reusable){setPlan({...clearCreativeActions(planForRecord(reusable)),cadence:undefined});setToast('이전 전략을 불러왔어요. 선택한 달에 맞게 조정하세요.');}};
  const applyRevision=async()=>{
    if(inFlight.current||!config)return;
    if(revision.error){setToast(`${revision.error.month}개월 차: ${revision.error.message}`);return;}
    const payload=revisionPayload(state.history,state.historyDrafts||{},config.workshopId);if(!payload)return;
    inFlight.current=true;setRunning(true);
    try{
      const response=await fetch('/api/replay',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(30000),body:JSON.stringify(payload)});
      const result=await response.json();if(!response.ok)throw new Error(`${result.month?`${result.month}개월 차: `:''}${result.error||'다시 계산하지 못했어요.'}`);
      if(!Array.isArray(result.records)||result.records.length!==payload.records.length||result.records.some((r:Campaign,i:number)=>r.id!==payload.records[i].id||r.metrics?.month!==payload.records[i].month))throw new Error('재계산 결과를 확인하지 못했어요. 원래 기록은 유지됩니다.');
      const history=mergeRevision(state.history,result.records,result.revisedAt);
      if(!validState({...state,history,historyDrafts:{}}))throw new Error('재계산 결과의 형식을 확인하지 못했어요.');
      setState(prev=>({...prev,history,historyDrafts:{},revisionUndo:{history:prev.history,revisedAt:result.revisedAt},view:'mix'}));
      setToast(`${payload.fromMonth}개월 차부터 ${result.records.length}개월의 결과를 다시 계산했어요.`);window.scrollTo({top:0,behavior:'smooth'});
    }catch(e){setToast(e instanceof Error?e.message:'재계산하지 못했어요. 원래 결과는 유지됩니다.');}
    finally{setRunning(false);inFlight.current=false;}
  };
  const undoRevision=()=>{if(state.revisionUndo&&!pendingRevision&&!running){patch({history:state.revisionUndo.history,revisionUndo:undefined,historyDrafts:{}});setToast('수정 적용 전 결과로 되돌렸어요.');}};
  const openProduct=(p?:Product)=>{if(!state.business){setDialog('business');return;}if(!p&&state.products.length>=50){setToast('상품은 50개까지 등록할 수 있어요.');return;}setEditProduct(p);setDialog('product');};
  const selectProduct=(id:string)=>{patch({productId:id,editingCampaignId:undefined});setToast('선택한 상품으로 지표와 미디어 믹스를 전환했어요.');};
  const saveBusiness=(business:Business)=>{patch({business,view:'business'});setDialog(null);setToast(state.business?'비즈니스 정보를 저장했어요.':'비즈니스를 만들었어요. 이제 상품을 별도로 추가해주세요.');};
  const saveProduct=(p:Product)=>{patch({products:state.products.some(x=>x.id===p.id)?state.products.map(x=>x.id===p.id?p:x):[...state.products,p],productId:p.id});setDialog(null);setToast(editProduct?'상품 정보를 저장했어요.':'상품을 만들었어요. 미디어 믹스를 설계해보세요.');};
  const chooseStage=(id:number)=>{
    if(id>(config?.openStage||0)){setToast('아직 열리지 않은 교육 주제예요. 강사의 안내 후 새로고침해주세요.');return;}
    patch({stage:id,view:id===4?'projection':state.view});
  };
  const run=async()=>{
    if(inFlight.current)return;
    if(editing){await applyRevision();return;}
    if(pendingRevision){setToast('과거 달의 수정안을 먼저 적용하거나 취소해주세요.');return;}
    if(!state.business){setDialog('business');return;}
    if(!product){openProduct();return;}
    if((config?.openStage||0)===0||stage>(config?.openStage||0)){setToast('현재 실행할 수 없는 단계예요.');return;}
    inFlight.current=true;setRunning(true);
    try {
      const res=await fetch('/api/simulate',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(15000),body:JSON.stringify({stage,round:memory.month+1,workshopId:config!.workshopId,business:state.business,product,products:state.products,plan,memory})});
      const result=await res.json();
      if(!res.ok)throw new Error(result.error||'실행하지 못했어요.');
      setState(prev=>({...prev,history:[...prev.history,result as Campaign],revisionUndo:undefined,plans:{...prev.plans,[planKey]:{...clearCreativeActions(plan),units:{},hypothesis:'',cadence:undefined}},view:'dashboard'}));
      setToast(`${result.metrics.month}개월 차 완료! 매출과 브랜드 변화를 확인하세요.`);
      window.scrollTo({top:0,behavior:'smooth'});
    }catch(e){setToast(e instanceof Error?e.message:'서버에 연결할 수 없어요.');}
    finally{setRunning(false);inFlight.current=false;}
  };
  const exportAll=()=>{download(JSON.stringify({workshop:config,exportedAt:new Date().toISOString(),...state},null,2),`marketing-quest-${new Date().toISOString().slice(0,10)}.json`,'application/json');setToast('전체 진행 기록을 내보냈어요.');};
  const exportCSV=(rows:import('./types').Metrics[])=>download(csvFor(rows),`marketing-projection-${horizon}months.csv`,'text/csv;charset=utf-8');
  const industry=industryFor(state.business?.industry||'commerce');

  if(!ready)return <div className="loading-screen"><PixelIcon type="flag" size={45}/><h1>모험을 준비하고 있어요.</h1><p>{error||'다음 성장을 준비하고 있어요.'}</p>{error?<button className="button primary" onClick={load}><RefreshCw size={15}/>다시 연결하기</button>:<span className="spinner"/>}</div>;
  return <div className="app-shell">
    <header className="app-header"><button className="home-control" onClick={()=>navigate('dashboard')}>← 대시보드</button><div className="stage-control"><Select label="교육 주제 설정" value={String(stage)} onChange={value=>chooseStage(Number(value))} disabled={running||config!.openStage===0} options={STAGES.map(s=>({value:String(s.id),label:`${s.name} · 교육 주제`,detail:s.id>config!.openStage?'아직 열리지 않은 교육 주제':s.id===4?'회고와 실험을 함께 진행할 수 있어요':'실험 순서·기간과 관계없는 강의 주제'}))}/></div><div className="header-actions"><span className={`save-state ${storageError?'danger':''}`}><span className="status-dot"/>{storageError?'저장 오류':saved?'저장됨':'저장 중'}</span><button className="icon-button" aria-label="전략 노트 열기" onClick={()=>setDialog('notes')}><BookOpen size={18}/></button><button className="business-chip" onClick={()=>navigate('business')}><span>{state.business?.name.slice(0,1)||'+'}</span><b>{state.business?.name||'내 비즈니스'}</b></button></div></header>
    <main className="main-content">
      {storageError&&<div className="error-banner" role="alert"><Info size={16}/><span>{storageError}</span><button onClick={exportAll}>기록 내보내기</button></div>}
      <div className="page-heading"><div><span className="eyebrow"><span className="pixel-dot"/> {state.view==='dashboard'?'YOUR BUSINESS, NEXT LEVEL.':state.view==='mix'?'MAKE YOUR NEXT MOVE.':state.view==='projection'?'FROM BUDGET TO GROWTH.':'THE START OF YOUR JOURNEY.'}</span><h1>{state.view==='dashboard'?'우리 브랜드, 잘 자라고 있나요?':state.view==='mix'?'좋은 조합이, 좋은 성장을.':state.view==='projection'?'숫자로 그려보는 다음 성장.':'비즈니스와 상품, 따로 또 같이.'}</h1><p>{state.view==='dashboard'?'고객의 여정과 브랜드의 변화를 한눈에.':state.view==='mix'?'많이 알리는 것과, 깊이 신뢰받는 것의 균형을 찾아보세요.':state.view==='projection'?'AARRR로 연결한 예산부터 매출까지의 흐름.':'하나의 비즈니스에 여러 상품을 만들어 실험할 수 있어요.'}</p></div>{product&&state.view!=='business'&&<div className="product-picker"><span>실험할 상품</span>{editing?<span className="historical-product">{product.name}<small>{won(product.price)} · 당시 상품 설정</small></span>:<Select label="실험할 상품" value={product.id} onChange={selectProduct} options={state.products.map(p=>({value:p.id,label:p.name,detail:`${salesLabel(p.purchaseType)} · ${won(p.price)}${p.purchaseType==='subscription'?' / 월':''}`}))} disabled={running}/>}</div>}</div>
      {state.view==='dashboard'&&<Dashboard business={state.business} product={product} history={state.history} memory={memory} forecast={preview.slice(0,3)} onBusiness={()=>setDialog('business')} onManageBusiness={()=>navigate('business')} onProduct={()=>openProduct()} onMix={()=>navigate('mix')} onProjection={()=>navigate('projection')} onModel={()=>setDialog('model')}/>}
      {state.view==='mix'&&(!state.business||!product)&&<section className="card prerequisite-card"><Box size={35}/><h2>{state.business?'상품을 먼저 만들어주세요.':'비즈니스부터 시작해보세요.'}</h2><p>업종과 상품 가격이 정해지면, 나의 미디어 믹스를 설계할 수 있어요.</p><button className="button primary" onClick={()=>openProduct()}><Plus size={15}/>{state.business?'상품 만들기':'비즈니스 만들기'}</button></section>}
      {state.view==='mix'&&workingBusiness&&product&&<><MonthTimeline history={state.history} editingId={editing?.id} drafts={state.historyDrafts||{}} revision={revision} running={running} canUndo={!!state.revisionUndo} applyDisabled={config!.openStage===0} onSelect={selectMonth} onApply={applyRevision} onDiscard={()=>patch({historyDrafts:{}})} onUndo={undoRevision}/><Mix plan={plan} onChange={setPlan} stage={stage} openStage={config!.openStage} preview={preview} business={workingBusiness} product={product} memory={memory} running={running} onRun={editing?applyRevision:run} editingMonth={editing?.metrics.month} revisionPending={pendingRevision} revisionProblem={revision.error?`${revision.error.month}개월 차: ${revision.error.message}`:!editing&&pendingRevision?'과거 달의 수정안을 먼저 적용하거나 취소해주세요.':undefined} canReuse={!!reusable} onReuse={reuse} onRecommend={()=>{setPlan({...plan,cadence:{},units:recommendMix(3,Math.max(0,plan.budget),workingBusiness,product,memory)});setToast('예산 안에서 시작용 믹스를 채웠어요. 자유롭게 바꿔보세요.');}} onBusiness={()=>setDialog('business')} onModel={()=>setDialog('model')} onProjection={()=>navigate('projection')}/></>}
      {state.view==='projection'&&<><Projection forecast={preview} plan={plan} business={state.business} product={product} memory={memory} onExport={exportCSV} products={state.products} outlook={state.outlook?.[`${product?.id}:${memory.month}`]} onOutlook={value=>patch({outlook:{...state.outlook,[`${product?.id}:${memory.month}`]:value}})} onModel={()=>setDialog('model')} onMix={()=>navigate('mix')} horizon={horizon} onHorizon={setHorizon}/>{stage===4&&config!.openStage>=4&&<section className="card reflection-card"><span className="eyebrow">REFLECT · TAKE IT TO YOUR BUSINESS</span><h2>오늘의 발견을, 다음 행동으로.</h2><label>가장 크게 달라진 생각은?<textarea maxLength={5000} value={state.reflection} onChange={e=>patch({reflection:e.target.value})} placeholder="숫자와 브랜드 인식의 변화에서 발견한 점을 기록하세요."/></label><label>다음 7일 안에 실행할 한 가지는?<textarea maxLength={5000} value={state.nextAction} onChange={e=>patch({nextAction:e.target.value})} placeholder="어떤 상품을, 어떤 미디어에서, 어떤 예산으로 실행할까요?"/></label><div className="reflection-actions"><button className="button secondary" onClick={()=>window.print()}>리포트 인쇄 / PDF</button><button className="button primary" onClick={exportAll}><ArrowDownToLine size={15}/>전체 기록 내보내기</button></div></section>}</>}
      {state.view==='business'&&<BusinessView business={state.business} products={state.products} productId={product?.id||''} onBusiness={()=>setDialog('business')} onProduct={openProduct} onSelect={selectProduct}/>}
      <footer className="app-footer"><span><span className="status-dot"/>이 브라우저에 자동 저장돼요.</span><div><button onClick={()=>setDialog('history')}>진행 기록</button><span>·</span><button onClick={()=>setDialog('model')}>시뮬레이션 기준</button></div><span>SMALL STEPS. REAL LEARNING.</span></footer>
    </main>
    <nav className="bottom-nav" aria-label="메인 메뉴">{menu.map(({id,label})=><button key={id} aria-current={state.view===id?'page':undefined} className={state.view===id?'active':''} onClick={()=>navigate(id)}><PixelIcon type={{dashboard:'flag',mix:'book',projection:'target',business:'store'}[id]} size={24}/><span>{label}</span>{state.view===id&&<i/>}</button>)}</nav>
    <Modal open={dialog==='business'} onClose={()=>setDialog(null)} title={state.business?'비즈니스 수정':'먼저, 비즈니스부터.'} description="업종을 정하면 우리 사업의 고객 여정이 달라져요."><BusinessForm key={dialog==='business'?'open':'closed'} business={state.business} onSave={saveBusiness}/></Modal>
    <Modal open={dialog==='product'&&!!state.business} onClose={()=>setDialog(null)} title={editProduct?'상품 수정':'어떤 상품을 판매하나요?'} description="상품은 별도로 등록해요. 가격과 구매 방식이 매출에 반영됩니다.">{state.business&&<ProductForm key={`${dialog}:${editProduct?.id||'new'}`} product={editProduct} business={state.business} onSave={saveProduct}/>}</Modal>
    <Modal open={dialog==='notes'} onClose={()=>setDialog(null)} title="나의 전략 노트" description="강의의 발견과 다음 실험 아이디어. 입력하는 대로 저장돼요."><textarea className="notes-editor" maxLength={20000} value={state.notes} onChange={e=>patch({notes:e.target.value})} placeholder="오늘 내 사업에 적용하고 싶은 것은…"/><div className="notes-footer"><span>{number(state.notes.length)} / 20,000</span><button className="text-button" onClick={exportAll}><ArrowDownToLine size={14}/>전체 기록 내보내기</button></div></Modal>
    <Modal open={dialog==='history'} onClose={()=>setDialog(null)} title="우리 브랜드의 성장 기록" description="각 실행은 1개월입니다. 이전 상품 정보와 미디어 믹스도 함께 보관해요." wide><div className="history-list">{state.history.length?state.history.map(h=><details key={h.id}><summary><span className="history-month">M{h.metrics.month}</span><div><b>{h.productSnapshot.name}</b><span>교육 주제: {STAGES[h.stage-1].name} · 기업 매출 {won(h.metrics.companyRevenue??h.metrics.revenue)} · ROAS {pct(h.metrics.roas)}</span></div><ChevronRight size={15}/></summary><div className="history-detail"><p>{h.metrics.narrative}</p><span>실행 당시 업종 {industryFor(h.businessSnapshot.industry).label} · 상품 가격 {won(h.productSnapshot.price)}</span><div className="history-channels">{h.metrics.channels.map(c=><span key={c.id}>{c.name} ×{c.units}</span>)}</div>{h.plan.hypothesis&&<p>가설: {h.plan.hypothesis}</p>}<button className="button secondary small" onClick={()=>{setDialog(null);selectMonth(h.id);}}>이 달 전략 수정<ArrowRight size={13}/></button></div></details>):<div className="empty-record"><BookOpen size={28}/><p>아직 실행한 캠페인이 없어요.</p><button className="text-button" onClick={()=>{setDialog(null);navigate('mix');}}>첫 미디어 믹스 만들기<ArrowRight size={14}/></button></div>}{state.legacyArchive!==undefined&&<p className="quiet-note">이전 버전 기록은 전체 JSON 내보내기의 legacyArchive에 보존돼요.</p>}</div><button className="button secondary full-width" onClick={exportAll}><ArrowDownToLine size={15}/>전체 기록 JSON 내보내기</button></Modal>
    <Modal open={dialog==='model'} onClose={()=>setDialog(null)} title="숫자는 이렇게 연결돼요." description="아래 수치는 게임을 위한 교육용 가정이며 실제 시장 평균이 아닙니다." wide><div className="model-overview"><span>{industry.label} · {state.business?.market||'B2C'}</span><div><div><span>SA 참고 CPC</span><b>{won(industry.cpc)}</b></div><div><span>콘텐츠 트래픽</span><b>× {industry.content}</b></div><div><span>기본 리드 생성률</span><b>{pct(industry.leadRate,true)}</b></div><div><span>기본 구매 전환율</span><b>{pct(industry.closeRate,true)}</b></div></div></div><div className="model-rules"><div><span>01</span><div><h3>가격이 높으면, 두 번의 문턱이 높아져요.</h3><p>업종별 가격 기준점({won(industry.referencePrice)}) 대비 상품 가격이 오르면 방문 → 리드, 재관심 → 구매 비율이 함께 낮아져요.</p><code>리드 가격 계수 = 1 / (1 + 가격비^0.65)<br/>구매 가격 계수 = 1 / (1 + 가격비^0.85)</code></div></div><div><span>02</span><div><h3>미디어마다 역할과 단가가 달라요.</h3><p>블로그 시딩은 접점과 유입, 인플루언서 시딩은 접촉 후 협의를 거쳐 발행합니다. 체험단은 신뢰, 파워블로그는 인지, 온드블로그는 전문성과 검색 자산을 만듭니다. 수량이 늘수록 효율은 점차 낮아져요.</p></div></div><div><span>03</span><div><h3>브랜드가 쌓이면, 유입의 출처가 바뀌어요.</h3><p>이전 월 인지도 30점부터 자연 검색 유입이 생겨요. 온드 콘텐츠는 내부 마케터 시간을 사용하며 검색 자산을 남겨요. 매달 이번 달 실행량을 정하고 실행한 뒤 다음 달 전략을 다시 설계합니다. 온드·페이드 인지도에 서로 다른 월 유지율을 적용하고, 검색 자산도 매달 4% 감쇠합니다.</p></div></div><div><span>04</span><div><h3>매출과 ROAS는 구분해서 읽어요.</h3><p>ROAS는 마케팅 활동 유입에 배분한 매출 ÷ 추가 집행비입니다. 온드만 운영해 비용이 0원이면 ROAS는 계산하지 않아요. SA·DA·소셜 광고는 당월 트래픽만 확보하며 온드 검색 자산이나 브랜드 효과를 남기지 않습니다. 구독 갱신 매출은 ROAS에 넣지 않아요. 시간 투입형은 이월 작업의 유입 출처를 이어받아 완료 월에 귀속합니다. 전체 매출 / 마케팅비는 MER로 별도 표시합니다.</p></div></div><div><span>05</span><div><h3>AARRR은 반드시 하나의 직선은 아니에요.</h3><p>리드 → 재관심 → 신규 구매로 전환합니다. 기존 고객의 추천은 다음 달 방문에 추가돼요. 재관심은 이번 달 리드의 후속 관심을 뜻하며, 방문은 중복 제거를 가정한 모형상의 수치입니다.</p></div></div></div><div className="model-rules sales-model-rules"><div><span>06</span><div><h3>상품의 판매 구조에 따라 매출을 계산해요.</h3><p>단일 상품은 판매 수량 × 단가, 시간 투입형은 배정 시간 안에서 완료한 건 × 계약 단가로 계산합니다. 미완료 작업은 이월하며 여러 달이 걸리는 프로젝트도 진행 시간을 누적해요. 구독은 신규 가입과 기존 고객의 갱신·해지를 반영합니다. 다른 상품의 구독 갱신과 진행 작업도 매월 계속 계산해요.</p></div></div></div><div className="model-bottom">인건비·상품 원가·마진·시장 규모·계절성은 반영하지 않아요. 같은 예산과 상품이라도 실제 성과는 다를 수 있습니다.</div></Modal>
    {toast&&<div className="toast" role="status"><Sparkles size={16}/><span>{toast}</span><button aria-label="알림 닫기" onClick={()=>setToast('')}><X size={15}/></button></div>}
  </div>;
}
