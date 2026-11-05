import data from './data/company-catalog.json';
import type { Business, Product } from './types';
export type CatalogProduct={id:string;name:string;purchaseType:Product['purchaseType'];price:number|null;sourceUrl:string|null;description:string;priceNote:string;availability:'listed'|'introduced'|'draft';draftBasis?:string;checkedAt:string};
export type CatalogCompany={id:string;name:string;aliases:string[];kind:'company'|'idea';description:string;industry:string;market:Business['market']|null;audience:string;source:'application'|'user';website?:string;products:CatalogProduct[]};
export const companies=data.companies as CatalogCompany[];
export const normalizeCompanyName=(s:string)=>s.normalize('NFKC').toLowerCase().replace(/주식회사|\(주\)|㈜/g,'').normalize('NFD').replace(/\p{M}/gu,'').normalize('NFC').replace(/[\p{P}\p{Z}\s]/gu,'');
export function findCompany(business:Pick<Business,'name'|'catalogCompanyId'>):CatalogCompany|undefined {
  return companies.find(c=>c.id===business.catalogCompanyId)||companies.find(c=>[c.name,...c.aliases].some(n=>normalizeCompanyName(n)===normalizeCompanyName(business.name)));
}
export function searchCompanies(query:string,limit=8) {
  const q=normalizeCompanyName(query);
  if(!q)return companies.filter(c=>c.kind==='company').slice(0,limit);
  return companies.map(c=>({company:c,score:normalizeCompanyName(c.name)===q?5:normalizeCompanyName(c.name).startsWith(q)?4:[c.name,...c.aliases].some(n=>normalizeCompanyName(n).includes(q))?3:normalizeCompanyName(c.description).includes(q)?1:0})).filter(r=>r.score>0).sort((a,b)=>b.score-a.score).slice(0,limit).map(r=>r.company);
}
