import {channelIdentity} from "./channel-identity.mjs";
import {createOriginBadge} from "./channel-identity-ui.js?v=origin-1";
import {checkRouteAccess} from "./router/guards.mjs";
import {createRouter} from "./router/router.js?v=r2";
import {pathFor,conversationPath,mediaPath,settingsPath,providerPath} from "./router/routes.mjs";
import {seedMediaFixtures} from "./media-fixtures.js?v=load50-1";
import {renderConversationMedia} from "./media-gallery.js?v=origin-1&playback-2";
import {getProfile,initials} from "./profile-store.js?v=d4-7";
import {initializeAssignments} from "./demo-access-store.js?v=d4-6";
import {adminState} from "./admin-data.js?v=inbox-1";
import {setupChannelPicker} from "./channel-picker.js?v=d5-1";
import {conversationMatchesChannels} from "./channel-filter.mjs?v=d5-1";
import {createInboxQueryService} from "./services/inbox-query.mjs";
import {createMockInboxQueryRepository} from "./data/adapters/mock/inbox-query.mjs";
import {providers} from "./channels.js?v=channels-1";
import {nameOf,avatar,editContact,configureContactIdentity} from "./contact-identity.js?v=channel-popover-1";
import {createContactService} from "./services/contacts.mjs";
import {createMockContactRepository} from "./data/adapters/mock/contact-storage.mjs";
import {showModule,refreshCurrentMediaModule} from "./pages.js?v=d6-4&load50-1&playback-2";
import {channels,getChannel} from "./channels.js?v=channels-1";
import {setupD3,updateD3,canAccess,canSend,currentState,assertCanSend} from "./d3.js?v=d4-6&voice-1";
import {appearance,setAppearance,openAppearanceSettings} from "./appearance.js?v=motion-1";
import {renderD2,sendD2,hasD2Attachment,isD2Searching,setupD2,resetD2Selection} from "./d2.js?v=chat-jump-1&voice-2&controls-1&dates-1&history-1";
import {setupVoiceComposer} from "./voice-composer.mjs?v=voice-2";
import {createChatScrollController} from "./chat-scroll.js";
import {createMessageHistoryService,createMessageHistoryWindow} from "./services/message-history.mjs";
import {createMockMessageHistoryRepository} from "./data/adapters/mock/message-history.mjs";
import {conversations} from "./data.js?v=load50-1&dates-1";
import {createMessageCommandService} from "./services/message-commands.mjs";
import {createMockMessageCommandRepository} from "./data/adapters/mock/message-commands.mjs";
import {normalizeMockConversations} from "./data/adapters/mock/message-store.mjs";
import {createConversationActionService} from "./services/conversation-actions.mjs";
import {createMockConversationActionRepository} from "./data/adapters/mock/conversation-actions.mjs";
import {createConversationReadService} from "./services/conversation-read.mjs";
import {createMockConversationReadRepository} from "./data/adapters/mock/conversation-read.mjs";
const $=s=>document.querySelector(s);const root=$("#app"),list=$("#conversation-list"),messages=$("#messages");
const chatScroll=createChatScrollController({viewport:messages,composer:$("#composer"),workspace:$("#workspace"),button:$("#chat-jump-latest")});
const state={active:"mariana",filter:"all",selectedChannels:null,query:"",theme:appearance.mode};
configureContactIdentity(createContactService(createMockContactRepository()));
const conversationReadService=createConversationReadService(createMockConversationReadRepository(conversations));
const inboxQueryService=createInboxQueryService(createMockInboxQueryRepository(conversations));
const historyWindow=createMessageHistoryWindow(createMessageHistoryService(createMockMessageHistoryRepository(conversations)),{pageSize:60});
const messageCommands=createMessageCommandService(createMockMessageCommandRepository(conversations));
const conversationActions=createConversationActionService(createMockConversationActionRepository(conversations));

seedMediaFixtures(conversations);
normalizeMockConversations(conversations);
initializeAssignments(conversations,adminState().members);

const active=()=>conversations.find(c=>c.id===state.active);
const node=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x};
const toast=text=>{const item=node("div","toast",text);$("#toast-region").append(item);setTimeout(()=>item.remove(),3800)};
const voiceComposer=setupVoiceComposer({
 getConversation:active,
 canStart:assertCanSend,
 canTextSend:canSend,
 hasPendingAttachment:hasD2Attachment,
 onSend:(conversation,media)=>sendD2(conversation,"",media),
 onSent:conversation=>{
  renderMessages();renderList();
  if(active()?.id===conversation.id)renderConversationMedia(conversation,$("#detail-media"),openConversationMedia);
 },
 notify:toast
});
const originOf=c=>channelIdentity(channels.find(channel=>channel.id===c?.channelId),providers);
function renderOrigin(c){
 const header=$("#chat-origin");
 if(!c){
  header.replaceChildren();
  for(const id of ["detail-platform","detail-channel","detail-provider","detail-connection"])$("#"+id).replaceChildren();
  return;
 }
 const identity=originOf(c);
 header.replaceChildren(createOriginBadge(identity,{provider:true,status:true}));
 $("#detail-platform").replaceChildren(createOriginBadge(identity,{compact:true}));
 $("#detail-channel").textContent=identity.channelName;
 $("#detail-provider").textContent=identity.providerName;
 const status=node("span","origin-connection",identity.statusLabel);
 status.dataset.state=identity.status;
 $("#detail-connection").replaceChildren(status);
}

let inboxRenderGeneration=0;
const inboxCriteria=selectedChannels=>({
 canAccess,channels,selectedChannels,filter:state.filter,query:state.query,
 nameOf,conversationMatchesChannels
});
async function renderList(){
 const generation=++inboxRenderGeneration;
 try{
 const shown=await inboxQueryService.list(inboxCriteria(state.selectedChannels));
 // Requisições antigas não podem substituir os filtros ou contadores atuais.
 if(generation!==inboxRenderGeneration)return;
 list.replaceChildren();
 for(const c of shown){const b=node("button","conversation"+(state.active===c.id?" selected":""));b.type="button";b.dataset.id=c.id;b.setAttribute("aria-label",nameOf(c)+(c.unread?", "+c.unread+" não lidas":""));b.setAttribute("aria-current",state.active===c.id?"true":"false");
 const av=avatar(c),body=node("span","conversation-content"),head=node("span","conversation-head"),preview=node("span","conversation-preview");
 head.append(node("strong","",nameOf(c)),node("time","",c.time));preview.append(node("span","",c.preview));if(c.unread)preview.append(node("span","unread",String(c.unread)));
 const origin=createOriginBadge(originOf(c),{status:true});origin.classList.add("conversation-origin");
 b.setAttribute("aria-label",b.getAttribute("aria-label")+", canal "+originOf(c).channelName);
 body.append(head,preview,origin);b.append(av,body);list.append(b)}
 if(!shown.length)list.append(node("p","placeholder","Nenhuma conversa encontrada."));
 $("#conversation-count").textContent=String(shown.length);
 }catch(error){
  if(generation!==inboxRenderGeneration)return;
  list.replaceChildren(node("p","placeholder","Não foi possível carregar as conversas."));
  $("#conversation-count").textContent="0";
  toast("Falha ao consultar a caixa de entrada: "+error.message);
 }
}
let historyRenderGeneration=0;
async function renderMessages({more=false,all=false}={}){
 const generation=++historyRenderGeneration;
 const conversation=active(),allowed=Boolean(conversation&&canAccess(conversation));
 if(!conversation){
  const before=chatScroll.capture(null);
  historyWindow.reset(null);
  messages.replaceChildren(node("p","placeholder","Nenhuma conversa disponível nos canais selecionados."));
  chatScroll.commit(before);return;
 }
 if(!allowed){
  const before=chatScroll.capture(null);
  historyWindow.reset(null);
  messages.replaceChildren(node("p","placeholder","Conversa não atribuída. Aguarde autorização de um OWNER ou SUPERVISOR."));
  chatScroll.commit(before);return;
 }
 const olderButton=messages.querySelector(".history-load-older");
 if(olderButton){olderButton.disabled=true;olderButton.textContent="Carregando mensagens…"}
 try{
  const history=await historyWindow.load(conversation.id,all||isD2Searching()?"all":more?"older":"refresh");
  if(!history||generation!==historyRenderGeneration||active()?.id!==conversation.id)return;
  // Capturar somente depois da consulta: outra renderização não deve
  // consumir o estado "abrir conversa no final" antes do primeiro commit.
  const before=chatScroll.capture(allowed?conversation.id:null);
  const priorHeight=messages.scrollHeight,priorTop=messages.scrollTop;
  const result=renderD2({...conversation,messages:history.items},messages);
  if(history.nextCursor&&!isD2Searching()){
   const loadButton=node("button","chip history-load-older","Carregar mensagens anteriores");
   loadButton.type="button";
   loadButton.setAttribute("aria-label","Carregar mensagens anteriores desta conversa");
   loadButton.addEventListener("click",()=>{void renderMessages({more:true})});
   messages.prepend(loadButton);
  }
  chatScroll.commit(before,result);
  // Prepend preserva a posição visual do leitor em históricos longos.
  if(more&&priorHeight>0)messages.scrollTop=priorTop+Math.max(0,messages.scrollHeight-priorHeight);
 }catch(error){
  if(generation!==historyRenderGeneration||active()?.id!==conversation.id)return;
  const before=chatScroll.capture(allowed?conversation.id:null);
  const retry=node("button","chip","Tentar novamente");
  retry.type="button";retry.addEventListener("click",()=>{void renderMessages()});
  messages.replaceChildren(node("p","placeholder","Não foi possível carregar o histórico."),retry);
  chatScroll.commit(before);
  toast("Falha ao consultar mensagens: "+error.message);
 }
}
function select(id,{openChat=true,markRead=openChat}={}){voiceComposer.setConversation(id);resetD2Selection();state.active=id;const c=active();if(markRead)void conversationReadService.markRead(id).then(()=>renderList()).catch(error=>toast("Falha ao marcar conversa como lida: "+error.message));$("#chat-title").textContent=nameOf(c);$("#chat-avatar").replaceWith(Object.assign(avatar(c),{id:"chat-avatar"}));$("#chat-subtitle").textContent=c.status+" · "+originOf(c).channelName;$("#detail-avatar").replaceWith(Object.assign(avatar(c,"avatar large"),{id:"detail-avatar"}));$("#detail-name").textContent=nameOf(c);$("#detail-phone").textContent=c.phone;$("#detail-agent").textContent=c.agent;$("#detail-status").textContent=c.status;$("#detail-channel").textContent=getChannel(c.channelId).name;renderOrigin(c);renderConversationMedia(c,$("#detail-media"),openConversationMedia);$("#message-input").value="";$("#message-input").style.height="";renderList();renderMessages();$("#details-toggle").disabled=false;$("#find-messages").disabled=false;$("#chat-menu").disabled=false;if(openChat)root.classList.add("chat-open");updateD3()}
function clearActive(){
 voiceComposer.setConversation(null);
 resetD2Selection();state.active=null;
 $("#chat-title").textContent="Selecione uma conversa";
 $("#chat-subtitle").textContent="";renderOrigin(null);
 $("#details").hidden=true;$("#detail-media").replaceChildren();
 root.classList.remove("details-open","chat-open");
 $("#details-toggle").setAttribute("aria-expanded","false");
 $("#details-toggle").disabled=true;
 $("#find-messages").disabled=true;
 $("#chat-menu").disabled=true;
 renderList();renderMessages();updateD3();
}
let channelSelectionGeneration=0;
async function onChannelSelection(next){
 state.selectedChannels=next;
 const generation=++channelSelectionGeneration;
 try{
  const candidates=await inboxQueryService.list({...inboxCriteria(next),filter:"all",query:""});
  if(generation!==channelSelectionGeneration)return;
  if(!candidates.some(c=>c.id===state.active))clearActive();
  renderList();
 }catch(error){
  if(generation!==channelSelectionGeneration)return;
  toast("Falha ao atualizar canais da Inbox: "+error.message);
  renderList();
 }
}
const channelPicker=setupChannelPicker({
 trigger:$("#channel-filter-trigger"),
 popover:$("#channel-filter-popover"),
 list:$("#channel-filter-options"),
 summary:$("#channel-filter-summary"),
 badge:$("#channel-filter-badge"),
 getChannels:()=>channels,
 getProviders:()=>providers,
 onChange:onChannelSelection
});
window.addEventListener("demo-channels-updated",()=>{channelPicker.refresh();renderOrigin(active());renderList();router?.refresh()});
window.addEventListener("demo-assignments-updated",()=>{onChannelSelection(channelPicker.getSelection());voiceComposer.syncPermissions();const current=active();if(current){$("#detail-agent").textContent=current.agent;$("#detail-status").textContent=current.status;}renderMessages();updateD3();router?.refresh();refreshCurrentMediaModule()});
list.addEventListener("click",e=>{const item=e.target.closest("[data-id]");if(item)router.navigate(conversationPath(item.dataset.id))});
$("#search").addEventListener("input",e=>{state.query=e.target.value;renderList()});
document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{state.filter=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>{x.classList.toggle("selected",x===b);x.setAttribute("aria-pressed",String(x===b))});renderList()}));
function openConversationMedia(conversationId){
 router.navigate(mediaPath({conversationId}));
}
function setDetails(open){root.classList.toggle("details-open",open);$("#details").hidden=!open;$("#details-toggle").setAttribute("aria-expanded",String(open))}
$("#details-toggle").addEventListener("click",()=>{if(active())router.navigate(conversationPath(active().id,{details:$("#details").hidden}))});
$("#details-close").addEventListener("click",()=>{if(active())router.navigate(conversationPath(active().id))});
$("#back-button").addEventListener("click",()=>router.navigate("/inbox"));
$("#theme-toggle").addEventListener("click",()=>setAppearance({mode:appearance.mode==="light"?"dark":"light"}));
$("#composer").addEventListener("submit",async e=>{e.preventDefault();if(voiceComposer.isActive())return;const input=$("#message-input"),conversation=active();if(!conversation||!assertCanSend(conversation))return;const submit=$("#composer").querySelector('button[type="submit"]');if(submit?.disabled)return;if(submit)submit.disabled=true;try{if(!await sendD2(conversation,input.value))return;input.value="";input.style.height="";renderMessages();renderList()}catch(error){toast("Falha ao enviar mensagem: "+error.message)}finally{if(submit)submit.disabled=voiceComposer.isActive()||!canSend(active())}});
$("#message-input").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();$("#composer").requestSubmit()}});
$("#message-input").addEventListener("input",e=>{if(!e.target.value){e.target.style.height="";return}e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,144)+"px"});
function renderProfileAvatar(){
 const button=$("#profile-button"),profile=getProfile();
 button.textContent=initials(profile);
 button.setAttribute("aria-label","Menu do usuário: "+(profile.displayName||profile.name));
 if(profile.photo&&/^data:image\/(png|jpeg|webp);base64,/i.test(profile.photo)){
  const image=document.createElement("img");image.alt="";image.src=profile.photo;image.onerror=()=>image.remove();button.append(image);
 }
}
window.addEventListener("demo-profile-updated",renderProfileAvatar);
renderProfileAvatar();
$("#profile-button").addEventListener("click",()=>{document.querySelector("#profile-popover")?.remove();const menu=document.createElement("div");menu.id="profile-popover";menu.className="profile-popover";menu.setAttribute("role","menu");for(const [label,handler] of [["Meu perfil",()=>router.navigate("/profile")],["Sair",()=>toast("O encerramento de sessão estará disponível após a autenticação.")]]){const button=document.createElement("button");button.type="button";button.textContent=label;button.setAttribute("role","menuitem");button.onclick=()=>{menu.remove();handler()};menu.append(button)}document.body.append(menu);menu.querySelector("button")?.focus();const dismiss=e=>{if(!menu.contains(e.target)&&e.target!==$("#profile-button")){menu.remove();document.removeEventListener("pointerdown",dismiss)}};document.addEventListener("pointerdown",dismiss)});
const contactEditButton=document.createElement("button");contactEditButton.className="chip";contactEditButton.type="button";contactEditButton.textContent="Editar contato";contactEditButton.onclick=()=>{if(!active())return;editContact(active(),()=>{const id=state.active;select(id);renderList()})};document.querySelector(".contact-card")?.append(contactEditButton);

document.querySelectorAll("[data-nav]").forEach(b=>b.addEventListener("click",()=>router.navigate(pathFor(b.dataset.nav))));

document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#search").focus()}if(e.key==="Escape"&&root.classList.contains("details-open"))setDetails(false)});
setupD2(active,()=>conversations,()=>{const c=active();if(c){$("#detail-status").textContent=c.status;$("#detail-agent").textContent=c.agent;renderConversationMedia(c,$("#detail-media"),openConversationMedia);}const pending=renderMessages();renderList();updateD3();return pending},messageCommands,conversationActions,async()=>{await renderMessages({all:true})});
setupD3(active,()=>{onChannelSelection(channelPicker.getSelection());voiceComposer.syncPermissions();renderMessages();router?.refresh();refreshCurrentMediaModule()});
select(state.active,{openChat:false,markRead:window.matchMedia("(min-width:761px)").matches});onChannelSelection(channelPicker.getSelection());root.classList.remove("chat-open");
const router=createRouter({render:route=>{
 voiceComposer.onRouteChange(route.name==="atendimento");
 const gate=checkRouteAccess(route,{conversations,canAccess,channels,role:currentState().role});
 if(gate.status==="redirect"){router.navigate(gate.path,{replace:true});return}
 if(gate.status==="forbidden"||gate.status==="not-found"){
  setDetails(false);root.classList.remove("chat-open");
  clearActive();
  showModule(gate.status==="forbidden"?"access-denied":"not-found");
  document.title=(gate.status==="forbidden"?"Acesso restrito":"Página não encontrada")+" · WappHub";
  document.querySelectorAll("[data-nav]").forEach(b=>{b.classList.remove("active");b.setAttribute("aria-current","false")});
  return;
 }
 document.querySelectorAll("[data-nav]").forEach(button=>{
  const isCurrent=button.dataset.nav===route.name;
  button.classList.toggle("active",isCurrent);
  button.setAttribute("aria-current",isCurrent?"page":"false");
 });
 if(route.name==="atendimento"){
  showModule("atendimento");
  const id=route.params.conversationId;
  if(id){
   const conversation=conversations.find(c=>c.id===id);
   if(!conversation){showModule("not-found");return}
   select(id,{openChat:true,markRead:true});
   setDetails(Boolean(route.params.details));
  }else{
   voiceComposer.onRouteChange(false);
   if(active()&&(!canAccess(active())||getChannel(active().channelId).enabled===false))clearActive();
   root.classList.remove("chat-open");
   setDetails(false);
   renderList();renderMessages();updateD3();
  }
  return;
 }
 if(route.name==="midias"){
  showModule("midias",{
   conversationId:route.query.conversation||"all",type:route.query.type||"all",query:route.query.q||"",
   onFilterChange:(filters,replace=false)=>router.navigate(mediaPath(filters),{replace,render:false})
  });
  setDetails(false);return;
 }
 if(route.name==="configuracoes"){
  showModule("configuracoes",{
   sectionId:route.params.section||"organizacao",
   providerRoute:{...route.params,query:route.query},
   onProviderNavigate:path=>router.navigate(path),
   onSectionChange:section=>router.navigate(settingsPath(section))
  });
  return;
 }
 if(route.name==="contatos"){
  showModule("contatos",{contactId:route.params.contactId||null,onNavigate:url=>router.navigate(url)});
  return;
 }
 showModule(route.name==="not-found"?"not-found":route.name);
}});
