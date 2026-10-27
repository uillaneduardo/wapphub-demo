import {mediaEntries,filterMedia,mediaTotals} from "./media-catalog.mjs";
import {openMediaViewer} from "./media-player.js?v=media-1";
const el=(tag,cls="",text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const labels={all:"Todas",image:"Imagens",audio:"Áudios",video:"Vídeos",document:"Documentos"};
function thumb(item,small=false){
 const box=el("span","media-thumb media-thumb-"+item.kind+(small?" is-small":""));
 if(item.kind==="image"||item.kind==="video"){
  const img=el("img");img.src=item.kind==="image"?item.url:(item.poster||"");
  img.alt="";img.loading="lazy";img.onerror=()=>{img.remove();box.classList.add("media-thumb-fallback")};
  box.append(img);
 }
 const sym={image:"▧",video:"▶",audio:"♪",document:"▤"}[item.kind];
 const icon=el("span","media-thumb-icon",sym);icon.setAttribute("aria-hidden","true");
 box.append(icon);return box;
}
function itemCard(item){
 const button=el("button","media-card");button.type="button";
 button.setAttribute("aria-label","Abrir "+labels[item.kind]?.toLocaleLowerCase("pt-BR")+": "+item.name+" de "+item.conversationName);
 const meta=el("span","media-card-meta");
 meta.append(el("strong","",item.name),el("small","",item.conversationName+" · "+item.time));
 button.append(thumb(item),meta);button.onclick=()=>openMediaViewer(item);
 return button;
}
export function renderMediaLibrary(root,{getConversations,conversationId="all"}){
 root.replaceChildren();
 const head=el("header","module-head");
 head.append(el("h1","","Mídias"),el("p","","Encontre e visualize arquivos compartilhados nas conversas."));
 root.append(head);
 const toolbar=el("div","media-library-toolbar");
 const selectLabel=el("label","media-library-filter");selectLabel.append(el("span","","Conversa"));
 const select=el("select","media-library-select");select.setAttribute("aria-label","Filtrar mídias por conversa");
 const all=el("option","","Todas as conversas");all.value="all";select.append(all);
 for(const c of getConversations()){const op=el("option","",c.name||c.phone||"Contato");op.value=c.id;select.append(op)}
 select.value=[...select.options].some(x=>x.value===conversationId)?conversationId:"all";
 selectLabel.append(select);
 const search=el("input","module-search media-library-search");search.type="search";
 search.placeholder="Buscar arquivos...";search.setAttribute("aria-label","Buscar mídias");
 toolbar.append(selectLabel,search);root.append(toolbar);
 const filters=el("div","media-library-types");filters.setAttribute("role","group");filters.setAttribute("aria-label","Tipo de mídia");
 const status=el("p","media-library-status");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 const cards=el("div","media-library-grid");
 let type="all";
 const update=()=>{
  const accessible=mediaEntries(getConversations());
  const narrowed=filterMedia(accessible,{conversationId:select.value,kind:type,query:search.value});
  status.textContent=narrowed.length===1?"1 arquivo encontrado":narrowed.length+" arquivos encontrados";
  const totals=mediaTotals(filterMedia(accessible,{conversationId:select.value,query:search.value}));
  for(const b of filters.querySelectorAll("button")){b.classList.toggle("selected",b.dataset.type===type);b.setAttribute("aria-pressed",String(b.dataset.type===type));b.querySelector("span").textContent=String(totals[b.dataset.type]||0)}
  cards.replaceChildren();
  if(!narrowed.length){cards.append(el("p","media-library-empty","Nenhuma mídia encontrada para esses filtros."));return}
  for(const item of narrowed)cards.append(itemCard(item));
 };
 for(const [id,label] of Object.entries(labels)){
  const b=el("button","media-type-tab");b.type="button";b.dataset.type=id;b.setAttribute("aria-pressed",String(id==="all"));
  b.append(el("strong","",label),el("span","","0"));b.onclick=()=>{type=id;update()};filters.append(b);
 }
 select.onchange=update;search.oninput=update;
 root.append(filters,status,cards);update();
}
export function renderConversationMedia(conversation,container,onViewAll){
 container.replaceChildren();
 if(!conversation)return;
 const items=mediaEntries([conversation]);
 const head=el("div","detail-media-title");
 head.append(el("strong","","Mídias e arquivos"),el("span","",String(items.length)));
 container.append(head);
 if(!items.length){container.append(el("p","detail-media-empty","Nenhum arquivo compartilhado nesta conversa."));return}
 const grid=el("div","detail-media-grid");
 for(const item of items.slice(-4).reverse()){
  const b=el("button","detail-media-tile");b.type="button";b.setAttribute("aria-label","Abrir "+item.name);b.title=item.name;b.append(thumb(item,true));b.onclick=()=>openMediaViewer(item);grid.append(b);
 }
 container.append(grid);
 const all=el("button","detail-media-all","Ver todas as mídias");
 all.type="button";all.onclick=()=>onViewAll(conversation.id);container.append(all);
}
