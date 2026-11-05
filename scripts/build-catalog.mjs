import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {parse} from 'csv-parse/sync';
import researched from '../research/company-products.mjs';
import {draftProducts} from '../research/product-drafts.mjs';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const target=path.join(root,'src/data/company-catalog.json');
export const normalizeName=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/주식회사|\(주\)|㈜/g,'').normalize('NFD').replace(/\p{M}/gu,'').normalize('NFC').replace(/[\p{P}\p{Z}\s]/gu,'');
const hash=s=>createHash('sha256').update(s).digest('hex').slice(0,12);
const aliases=new Map(researched.flatMap(c=>[c.name,...c.aliases].map(n=>[normalizeName(n),c])));
const genericAudience=market=>({B2C:'개인 고객',B2B:'기업 고객',B2B2C:'기업과 개인 고객',B2G:'공공기관·학교'}[market]||'');
const industryFor=description=>/피부|향수|화장품|헤어/.test(description)?'beauty':/식품|농산|푸드|식음/.test(description)?'food':/수학|교육|필라테스|피트니스|놀이영어/.test(description)?'education':/열교환|제조/.test(description)?'manufacturing':/여행|관광|웨딩/.test(description)?'travel':/AI|소프트웨어|에이전트|자동화|앱|플랫폼/i.test(description)?'saas':'other';
const ideaTitle=s=>{
 if(s.includes('다이어리'))return '라이프 시스템 다이어리';
 if(s.includes('DOIN'))return 'DOINÉ · 향수 브랜드';
 if(s.includes('논문'))return 'AI 논문 에디터';
 if(s.includes('애도'))return '애도 공간 · 디지털 플랫폼';
 if(s.includes('웨딩홀'))return '웨딩홀 월드컵';
 if(s.includes('공시'))return '공시 자동화';
 if(s.includes('영상 편집'))return '영상 편집 전처리 도구';
 return s.replace(/[\r\n]+/g,' ').slice(0,55)||'새로운 사업 아이디어';
};
export function buildCatalog(csvText) {
 const records=parse(csvText,{columns:true,bom:true,skip_empty_lines:true,trim:true});
 for(const column of ['팀/회사','아이템·회사 한 줄','주요 고객'])if(records.length&&!Object.hasOwn(records[0],column))throw new Error(`필수 컬럼 누락: ${column}`);
 const grouped=new Map();
 for(const row of records){
  if(row['상태']&&row['상태']!=='확정')continue;
  const original=(row['팀/회사']||'').trim(),description=(row['아이템·회사 한 줄']||'').trim();
  const isIdea=!original||['없음','미정','준비중','-'].includes(original);
  const lookup=isIdea?null:aliases.get(normalizeName(original));
  const id=lookup?.id||(isIdea?'idea-':'company-')+hash(isIdea?description:normalizeName(original));
  const market=['B2C','B2B','B2B2C','B2G'].includes(row['주요 고객'])?row['주요 고객']:null;
  const existing=grouped.get(id);
  if(existing){if(original&&!existing.aliases.includes(original))existing.aliases.push(original);if(description.length>existing.description.length)existing.description=description.slice(0,300);continue;}
  grouped.set(id,{id,name:isIdea?ideaTitle(description):(lookup?.name||original),aliases:isIdea?[]:[original],kind:isIdea?'idea':'company',description:description.slice(0,300),industry:lookup?.industry||industryFor(description),market,audience:genericAudience(market),source:'application',products:[]});
 }
 return mergeResearch([...grouped.values()]);
}
export function mergeResearch(base){
 const companies=base.map(c=>({id:c.id,name:c.name,aliases:[...new Set(c.aliases||[])],kind:c.kind,description:c.description,industry:c.industry,market:c.market,audience:c.audience,source:c.source,products:[]}));
 for(const r of researched){
  let company=companies.find(c=>c.id===r.id);
  if(!company&&r.source!=='user')continue;
  if(!company){company={id:r.id,name:r.name,aliases:[],kind:'company',description:r.description||'',industry:r.industry,market:r.market||null,audience:r.audience||'',source:'user',products:[]};companies.push(company);}
  company.name=r.name;company.aliases=[...new Set([...company.aliases,...r.aliases])];company.industry=r.industry;
  if(r.audience)company.audience=r.audience;
  if(r.website)company.website=r.website;
  company.products=r.products.map(p=>({id:`${r.id}:${p.id}`,name:p.name,purchaseType:p.purchaseType,price:p.price,sourceUrl:p.sourceUrl,description:p.description,priceNote:p.priceNote,availability:p.availability,checkedAt:p.checkedAt}));
 }
 for(const company of companies)if(!company.products.length)company.products=draftProducts(company);
 companies.sort((a,b)=>a.id==='toktokhan'?-1:b.id==='toktokhan'?1:a.kind!==b.kind?a.kind==='company'?-1:1:a.name.localeCompare(b.name,'ko'));
 return {version:1,checkedAt:'2026-11-05',companies};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const source=path.join(root,'applications-2026-11-01.csv');
 const catalog=existsSync(source)?buildCatalog(readFileSync(source,'utf8')):existsSync(target)?mergeResearch(JSON.parse(readFileSync(target,'utf8')).companies):null;
 if(!catalog)throw new Error('기업 카탈로그 또는 원본 CSV가 필요합니다.');
 mkdirSync(path.dirname(target),{recursive:true});writeFileSync(target,JSON.stringify(catalog,null,2)+'\n');
 console.log(`기업 자동완성: ${catalog.companies.length}개 항목 · 상품 ${catalog.companies.reduce((n,c)=>n+c.products.length,0)}개`);
}
