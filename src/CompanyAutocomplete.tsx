import {Command} from 'cmdk';
import {useState} from 'react';
import {Building2,Lightbulb,Search} from 'lucide-react';
import {CatalogCompany,searchCompanies} from './catalog';

export default function CompanyAutocomplete({value,onChange,onSelect}:{value:string;onChange:(v:string)=>void;onSelect:(c:CatalogCompany)=>void}) {
  const [open,setOpen]=useState(false);
  const matches=searchCompanies(value);
  return <Command shouldFilter={false} className="company-command" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setOpen(false);}} onKeyDown={e=>{if(e.key==='Escape'&&open){e.preventDefault();e.stopPropagation();setOpen(false);}if(e.key==='ArrowDown')setOpen(true);}}>
    <div className="company-search-input"><Command.Input aria-label="비즈니스 이름" required maxLength={60} pattern=".*\S.*" autoComplete="off" placeholder="기업명 검색 또는 직접 입력" value={value} onFocus={()=>setOpen(true)} onValueChange={v=>{onChange(v);setOpen(true);}}/><Search size={16}/></div>
    {open&&matches.length>0&&<Command.List className="company-suggestions" aria-label="기업 자동완성"><div className="company-list-heading">참여 기업 · 사업 아이템에서 불러오기</div>{matches.map(c=><Command.Item key={c.id} value={c.id} onMouseDown={e=>e.preventDefault()} onSelect={()=>{onSelect(c);setOpen(false);}} className="company-option"><span className={`company-option-icon ${c.kind==='idea'?'idea':''}`}>{c.kind==='idea'?<Lightbulb size={17}/>:<Building2 size={17}/>}</span><span><b>{c.name}</b><small>{c.description}</small></span><span className="company-option-tag">{c.kind==='idea'?'사업 아이템':c.products.length?`${c.products.length}개 상품군`:'기업'}</span></Command.Item>)}<div className="company-list-footer">기업 선택 후 저장하면 해당 기업의 상품도 함께 준비돼요.</div></Command.List>}
    {!!value.trim()&&!matches.length&&<div className="company-no-match" role="status">등록된 기업이 없어요. 아래 업종에 맞는 상품 초안을 준비합니다.</div>}
  </Command>;
}
