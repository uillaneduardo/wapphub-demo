import {createOriginBadge} from "./channel-identity-ui.js?v=origin-1";
import {attachMediaBlur} from "./media-blur.js?v=motion-1";
import {mediaVisibilityKey} from "./media-visibility-store.js?v=motion-1";
import {mediaEntries,filterMedia,mediaTotals} from "./media-catalog.mjs";
import {openMediaViewer} from "./media-player.js?v=motion-1&playback-2";
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
function itemCard(item,getOriginForItem){
 const card=el("div","media-card");
 const open=el("button","media-card-open");open.type="button";
 open.setAttribute("aria-label","Abrir "+labels[item.kind]?.toLocaleLowerCase("pt-BR")+": "+item.name+" de "+item.conversationName);
 const picture=thumb(item);
 const meta=el("span","media-card-meta");
 meta.append(el("strong","",item.name),el("small","",item.conversationName+" · "+item.time));
 const identity=getOriginForItem(item);
 if(identity)meta.append(createOriginBadge(identity));

 open.append(picture,meta);
 open.onclick=()=>openMediaViewer(item);
 card.append(open);
 if((item.kind==="image"||item.kind==="video")&&picture.querySelector("img")){
  attachMediaBlur(card,picture.querySelector("img"),mediaVisibilityKey(item.conversationId,item.id));
 }
 return card;
}
export function renderMediaLibrary(root,{getConversations,conversationId="all",type="all",query="",onFilterChange=()=>{},getOriginForItem=()=>null}){
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
 search.placeholder="Buscar arquivos...";search.setAttribute("aria-label","Buscar mídias");search.value=query;
 toolbar.append(selectLabel,search);root.append(toolbar);
 const filters=el("div","media-library-types");filters.setAttribute("role","group");filters.setAttribute("aria-label","Tipo de mídia");
 const status=el("p","media-library-status");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 const cards=el("div","media-library-grid");
 let selectedType=type in labels?type:"all";
 const update=()=>{
  const accessible=mediaEntries(getConversations());
  const narrowed=filterMedia(accessible,{conversationId:select.value,kind:selectedType,query:search.value});
  status.textContent=narrowed.length===1?"1 arquivo encontrado":narrowed.length+" arquivos encontrados";
  const totals=mediaTotals(filterMedia(accessible,{conversationId:select.value,query:search.value}));
  for(const b of filters.querySelectorAll("button")){b.classList.toggle("selected",b.dataset.type===selectedType);b.setAttribute("aria-pressed",String(b.dataset.type===selectedType));b.querySelector("span").textContent=String(totals[b.dataset.type]||0)}
  cards.replaceChildren();
  if(!narrowed.length){cards.append(el("p","media-library-empty","Nenhuma mídia encontrada para esses filtros."));return}
  for(const item of narrowed)cards.append(itemCard(item,getOriginForItem));
 };
 for(const [id,label] of Object.entries(labels)){
  const b=el("button","media-type-tab");b.type="button";b.dataset.type=id;b.setAttribute("aria-pressed",String(id===selectedType));
  b.append(el("strong","",label),el("span","","0"));b.onclick=()=>{selectedType=id;update();onFilterChange({conversationId:select.value,type:selectedType,query:search.value},false)};filters.append(b);
 }
 select.onchange=()=>{update();onFilterChange({conversationId:select.value,type:selectedType,query:search.value},false)};
 search.oninput=()=>{update();onFilterChange({conversationId:select.value,type:selectedType,query:search.value},true)};
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
  const tile=el("div","detail-media-tile");
  const open=el("button","detail-media-open");open.type="button";
  open.setAttribute("aria-label","Abrir "+item.name);open.title=item.name;
  const picture=thumb(item,true);
  open.append(picture);open.onclick=()=>openMediaViewer(item);
  tile.append(open);
  if((item.kind==="image"||item.kind==="video")&&picture.querySelector("img")){
   attachMediaBlur(tile,picture.querySelector("img"),mediaVisibilityKey(item.conversationId,item.id));
  }
  grid.append(tile);
 }
 container.append(grid);
 const all=el("button","detail-media-all","Ver todas as mídias");
 all.type="button";all.onclick=()=>onViewAll(conversation.id);container.append(all);
}
