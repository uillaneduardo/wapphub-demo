import {renderMediaLibrary} from "./media-gallery.js?v=motion-1";
import {canAccess} from "./d3.js?v=d4-6";
import {getProfile,saveProfile} from "./profile-store.js?v=d4-7";
import {renderProfilePage} from "./profile-panel.js?v=d4-7";
import {nameOf,avatar,editContact} from "./contact-identity.js?v=channel-popover-1";
import {renderSettings} from "./settings.js?v=motion-1";
import {conversations} from "./data.js?v=channels-1";
import {getChannel} from "./channels.js?v=channels-1";
const make=(tag,className="",value)=>{const n=document.createElement(tag);n.className=className;if(value!==undefined)n.textContent=value;return n};
let view=null,currentModule="atendimento",currentOptions={};
function ensure(){if(view)return view;view=make("section","module-view");view.id="module-view";view.setAttribute("aria-label","Módulo");document.body.append(view);return view}
function heading(title,subtitle){const wrap=make("header","module-head");wrap.append(make("h1","",title),make("p","",subtitle));return wrap}
function stat(label,value){const card=make("div","module-stat");card.append(make("span","",label),make("strong","",String(value)));return card}
function overview(){const root=ensure();root.replaceChildren(heading("Visão geral","Acompanhe os principais indicadores dos atendimentos."));const grid=make("div","module-stats");const unread=conversations.reduce((n,c)=>n+(c.unread||0),0);grid.append(stat("Conversas",conversations.length),stat("Não lidas",unread),stat("Em atendimento",conversations.filter(c=>c.status==="Em atendimento").length),stat("Sem atribuição",conversations.filter(c=>!c.assigned).length));root.append(grid);const section=make("section","module-section");section.append(make("h2","","Canais"));for(const c of [...new Set(conversations.map(c=>c.channelId))]){const row=make("div","module-row");row.append(make("strong","",getChannel(c).name),make("span","",String(conversations.filter(x=>x.channelId===c).length)+" conversas"));section.append(row)}root.append(section)}
function contacts({contactId=null,onNavigate=()=>{}}={}){
 const root=ensure();
 if(contactId){
  const c=conversations.find(item=>item.id===contactId&&canAccess(item));
  if(!c){
   root.replaceChildren(heading("Contato indisponível","Não foi possível acessar este contato."));
   const back=make("button","settings-action","Voltar aos contatos");back.type="button";back.onclick=()=>onNavigate("/contacts");root.append(back);return;
  }
  root.replaceChildren(heading(nameOf(c),"Informações do contato"));
  const card=make("section","module-section");
  const identity=make("div","module-contact");
  const meta=make("div","module-contact-name");
  meta.append(make("strong","",nameOf(c)),make("small","",c.phone+" · "+getChannel(c.channelId).name));
  identity.append(avatar(c),meta);card.append(identity);
  const actions=make("div","admin-actions");
  const back=make("button","settings-action","Voltar");back.type="button";back.onclick=()=>onNavigate("/contacts");
  const edit=make("button","settings-primary","Editar contato");edit.type="button";edit.onclick=()=>editContact(c,()=>contacts({contactId,onNavigate}));
  actions.append(back,edit);card.append(actions);root.append(card);
  return;
 }
 root.replaceChildren(heading("Contatos","Encontre contatos pelo nome ou número de telefone."));
 const search=make("input","module-search");search.type="search";search.placeholder="Buscar nome ou número...";search.setAttribute("aria-label","Buscar contatos");
 const results=make("div","module-section");
 const render=()=>{
  results.replaceChildren();
  const q=search.value.toLocaleLowerCase("pt-BR").replace(/[^a-z0-9À-ÿ]/gi,"");
  let found=0;
  for(const c of conversations.filter(canAccess)){
   const key=(nameOf(c)+" "+c.phone).toLocaleLowerCase("pt-BR").replace(/[^a-z0-9À-ÿ]/gi,"");
   if(q&&!key.includes(q))continue;
   found++;
   const row=make("div","module-contact");
   const open=make("button","module-contact-open");
   open.type="button";open.setAttribute("aria-label","Ver contato "+nameOf(c));
   const meta=make("div","module-contact-name");
   meta.append(make("strong","",nameOf(c)),make("small","",c.phone+" · "+getChannel(c.channelId).name));
   open.append(avatar(c),meta);
   open.onclick=()=>onNavigate("/contacts/"+encodeURIComponent(c.id));
   const edit=make("button","chip","Editar");edit.type="button";edit.onclick=()=>editContact(c,render);
   row.append(open,edit);results.append(row);
  }
  if(!found)results.append(make("p","placeholder","Nenhum contato encontrado."));
 };
 search.addEventListener("input",render);
 root.append(search,results);render();
}
export function showModule(name,options={}){currentModule=name;currentOptions=options;const root=ensure();const isChat=name==="atendimento";document.body.classList.toggle("module-active",!isChat);root.hidden=isChat;if(isChat)return;if(name==="not-found"){
  root.replaceChildren(heading("Página não encontrada","O endereço solicitado não corresponde a uma página disponível."));
  const link=make("a","settings-primary","Voltar à caixa de entrada");
  link.href="/inbox";link.dataset.route="";root.append(link);
 }
 if(name==="visao-geral")overview();if(name==="contatos")contacts(options);if(name==="midias")renderMediaLibrary(root,{getConversations:()=>conversations.filter(canAccess),conversationId:options.conversationId||"all",type:options.type||"all",query:options.query||"",onFilterChange:options.onFilterChange});if(name==="configuracoes")renderSettings(root,options);if(name==="perfil")renderProfilePage(root,{getProfile,saveProfile});root.hidden=false;root.scrollTop=0}

export function refreshCurrentMediaModule(){if(currentModule==="midias")showModule(currentModule,currentOptions)}
