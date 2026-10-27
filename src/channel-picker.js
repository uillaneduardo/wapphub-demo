import {availableChannels,normalizeSelection,selectionLabel} from "./channel-filter.mjs";
const create=(tag,cls,text)=>{
 const n=document.createElement(tag);
 if(cls)n.className=cls;
 if(text!==undefined)n.textContent=text;
 return n;
};
/** Adaptador visual desacoplado da camada de dados. */
export function setupChannelPicker({trigger,popover,list,summary,badge,getChannels,getProviders,onChange}){
 let selection=null;
 const channels=()=>getChannels();
 const title=()=>selectionLabel(selection,channels());
 function setOpen(open){
  popover.hidden=!open;
  trigger.setAttribute("aria-expanded",String(open));
  if(open)popover.querySelector("input")?.focus();
 }
 function render(){
  selection=normalizeSelection(selection,channels());
  list.replaceChildren();
  const all=availableChannels(channels());
  const allRow=create("label","channel-menu-choice channel-menu-all");
  const allCheck=create("input");
  allCheck.type="checkbox";allCheck.dataset.channelId="all";allCheck.checked=selection===null;
  const allCopy=create("span","channel-menu-copy");
  allCopy.append(create("strong","","Todos os canais"),create("small","","Exibir todas as caixas habilitadas"));
  allRow.append(allCheck,allCopy);
  allCheck.addEventListener("change",()=>{selection=null;changed("all")});
  list.append(allRow);
  for(const provider of getProviders()){
   const items=all.filter(c=>c.provider===provider.id);
   if(!items.length)continue;
   const section=create("div","channel-menu-section");
   section.append(create("span","channel-menu-group",provider.name));
   for(const channel of items){
    const row=create("label","channel-menu-choice");
    const check=create("input");
    check.type="checkbox";check.dataset.channelId=channel.id;
    check.checked=selection===null||selection.has(channel.id);
    const copy=create("span","channel-menu-copy");
    copy.append(create("strong","",channel.name));
    const state=create("small","",channel.state==="connected"?"Conectado":"Desconectado");
    copy.append(state);
    row.append(check,copy);
    check.addEventListener("change",()=>{
      const next=selection===null?new Set([channel.id]):new Set(selection);
      if(selection!==null){if(check.checked)next.add(channel.id);else next.delete(channel.id)}
      selection=normalizeSelection(next,channels());
      changed(channel.id);
    });
    section.append(row);
   }
   list.append(section);
  }
  if(!all.length)list.append(create("p","channel-menu-empty","Nenhum canal habilitado."));
  summary.textContent=title();
  badge.textContent=selection===null?"":String(selection.size);
  badge.hidden=selection===null;
  trigger.classList.toggle("is-filtered",selection!==null);
  trigger.title="Canais: "+title();
  trigger.setAttribute("aria-label","Filtrar canais: "+title());
 }
 function changed(focusId){render();if(!popover.hidden&&focusId){[...popover.querySelectorAll("input")].find(x=>x.dataset.channelId===focusId)?.focus()}onChange(selection===null?null:new Set(selection))}
 trigger.addEventListener("click",()=>setOpen(popover.hidden));
 document.addEventListener("pointerdown",e=>{if(!popover.hidden&&!popover.contains(e.target)&&!trigger.contains(e.target))setOpen(false)});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!popover.hidden){e.preventDefault();setOpen(false);trigger.focus()}});
 window.addEventListener("resize",()=>{if(!popover.hidden)setOpen(false)});
 render();
 return {
  getSelection:()=>selection===null?null:new Set(selection),
  refresh:()=>{render();onChange(selection===null?null:new Set(selection))},
  close:()=>setOpen(false)
 };
}
