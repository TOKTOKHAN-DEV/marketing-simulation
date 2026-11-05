import * as SelectPrimitive from '@radix-ui/react-select';
import * as Dialog from '@radix-ui/react-dialog';
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { ReactNode, useId } from 'react';

export function Select({label,value,onChange,options,placeholder='선택해주세요',className='',disabled=false}:{label:string;value:string;onChange:(v:string)=>void;options:{value:string;label:string;detail?:string}[];placeholder?:string;className?:string;disabled?:boolean}) {
  return <SelectPrimitive.Root value={value} onValueChange={onChange} disabled={disabled}>
    <SelectPrimitive.Trigger aria-label={label} className={`select-trigger ${className}`}><SelectPrimitive.Value placeholder={placeholder}/><SelectPrimitive.Icon><ChevronDown size={16}/></SelectPrimitive.Icon></SelectPrimitive.Trigger>
    <SelectPrimitive.Portal><SelectPrimitive.Content className="select-content" position="popper" sideOffset={7} collisionPadding={12}><SelectPrimitive.ScrollUpButton className="select-scroll"><ChevronUp size={15}/></SelectPrimitive.ScrollUpButton><SelectPrimitive.Viewport>{options.map(o=><SelectPrimitive.Item className="select-item" key={o.value} value={o.value}><span className="select-item-copy"><SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>{o.detail&&<small>{o.detail}</small>}</span><SelectPrimitive.ItemIndicator className="select-item-indicator"><Check size={15}/></SelectPrimitive.ItemIndicator></SelectPrimitive.Item>)}</SelectPrimitive.Viewport><SelectPrimitive.ScrollDownButton className="select-scroll"><ChevronDown size={15}/></SelectPrimitive.ScrollDownButton></SelectPrimitive.Content></SelectPrimitive.Portal>
  </SelectPrimitive.Root>;
}
export function Modal({open,onClose,title,description,children,wide=false,alert=false,onInitialFocus}:{alert?:boolean;onInitialFocus?:()=>void;open:boolean;onClose:()=>void;title:string;description:string;children:ReactNode;wide?:boolean}) {
  return <Dialog.Root open={open} onOpenChange={v=>{if(!v)onClose();}}><Dialog.Portal><Dialog.Overlay className="dialog-overlay"/><Dialog.Content role={alert?'alertdialog':'dialog'} onOpenAutoFocus={e=>{if(onInitialFocus){e.preventDefault();onInitialFocus();}}} className={`dialog-content ${wide?'wide':''}`}><div className="dialog-heading"><div><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{description}</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="창 닫기"><X size={20}/></Dialog.Close></div>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}
export function Field({label,children,optional=false}:{label:string;children:ReactNode;optional?:boolean}) {
  const id=useId();return <div className="field"><div id={id} className="field-label">{label}{optional&&<span>선택</span>}</div><div role="group" aria-labelledby={id}>{children}</div></div>;
}
export function PixelPlant({small=false}:{small?:boolean}) {
  return <svg className={small?'pixel-plant small':'pixel-plant'} viewBox="0 0 100 100" shapeRendering="crispEdges" aria-hidden="true"><path fill="#b7d887" d="M46 36h8v33h-8z"/><path fill="#83a46b" d="M27 24h12v5h10v7h5v13H39v-6h-8v-8h-4z"/><path fill="#c6e89c" d="M55 13h17v6h8v14h-6v9H61v9H49V33h6z"/><path fill="#9abd7e" d="M55 19h9v16h-9z"/><path fill="#c4b2e9" d="M28 63h46v10h-5v18H34V73h-6z"/><path fill="#9581b6" d="M34 75h35v16H34zM39 91h25v5H39z"/><path fill="#dbcbf6" d="M35 65h7v10h-7z"/><path fill="#ead99c" d="M16 43h4v5h5v4h-5v5h-4v-5h-5v-4h5zM81 7h3v5h5v3h-5v5h-3v-5h-5v-3h5z"/><path fill="#e9e6ed" d="M43 78h4v4h-4zM57 78h4v4h-4z"/><path fill="#d9c5ed" d="M49 84h6v3h-6z"/></svg>;
}
