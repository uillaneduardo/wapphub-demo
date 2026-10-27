import {getProfile,initials} from "./profile-store.js?v=d4-7";
import {initializeAssignments} from "./demo-access-store.js?v=d4-6";
import {adminState} from "./admin-data.js?v=inbox-1";
import {setupChannelPicker} from "./channel-picker.js?v=d5-1";
import {conversationMatchesChannels} from "./channel-filter.mjs?v=d5-1";
import {providers} from "./channels.js?v=channels-1";
import {nameOf,avatar,editContact} from "./contact-identity.js?v=channel-popover-1";
import {showModule} from "./pages.js?v=d5-1";
import {channels,getChannel} from "./channels.js?v=channels-1";
import {setupD3,updateD3,canAccess,assertCanSend} from "./d3.js?v=d4-6";
import {appearance,setAppearance,openAppearanceSettings} from "./appearance.js?v=d5-1";
import {renderD2,sendD2,setupD2,resetD2Selection} from "./d2.js?v=d4-6";
import {conversations} from "./data.js?v=channels-1";
const $=s=>document.querySelector(s);const root=$("#app"),list=$("#conversation-list"),messages=$("#messages");
const state={active:"mariana",filter:"all",selectedChannels:null,query:"",theme:appearance.mode};
initializeAssignments(conversations,adminState().members);

const active=()=>conversations.find(c=>c.id===state.active);
const node=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x};
const toast=text=>{const item=node("div","toast",text);$("#toast-region").append(item);setTimeout(()=>item.remove(),3800)};
function renderList(){
 const shown=conversations.filter(c=>canAccess(c)&&conversationMatchesChannels(c,state.selectedChannels,channels)&&(state.filter==="all"||state.filter==="unread"&&c.unread>0||state.filter==="mine"&&c.assigned)&&[nameOf(c),c.phone,c.preview].some(v=>v.toLocaleLowerCase("pt-BR").includes(state.query.toLocaleLowerCase("pt-BR"))));
 list.replaceChildren();
 for(const c of shown){const b=node("button","conversation"+(state.active===c.id?" selected":""));b.type="button";b.dataset.id=c.id;b.setAttribute("aria-label",nameOf(c)+(c.unread?", "+c.unread+" não lidas":""));b.setAttribute("aria-current",state.active===c.id?"true":"false");
 const av=avatar(c),body=node("span","conversation-content"),head=node("span","conversation-head"),preview=node("span","conversation-preview");
 head.append(node("strong","",nameOf(c)),node("time","",c.time));preview.append(node("span","",c.preview));if(c.unread)preview.append(node("span","unread",String(c.unread)));
 body.append(head,preview);b.append(av,body);list.append(b)}
 if(!shown.length)list.append(node("p","placeholder","Nenhuma conversa encontrada."));
 $("#conversation-count").textContent=String(shown.length);
}
function renderMessages(){if(!active()){messages.replaceChildren(node("p","placeholder","Nenhuma conversa disponível nos canais selecionados."));return}if(!canAccess(active())){messages.replaceChildren(node("p","placeholder","Conversa não atribuída. Aguarde autorização de um OWNER ou SUPERVISOR."));return}renderD2(active(),messages)}
function select(id,{openChat=true,markRead=openChat}={}){resetD2Selection();state.active=id;const c=active();if(markRead)c.unread=0;$("#chat-title").textContent=nameOf(c);$("#chat-avatar").replaceWith(Object.assign(avatar(c),{id:"chat-avatar"}));$("#chat-subtitle").textContent=c.status+" · "+getChannel(c.channelId).name;$("#detail-avatar").replaceWith(Object.assign(avatar(c,"avatar large"),{id:"detail-avatar"}));$("#detail-name").textContent=nameOf(c);$("#detail-phone").textContent=c.phone;$("#detail-agent").textContent=c.agent;$("#detail-status").textContent=c.status;$("#detail-channel").textContent=getChannel(c.channelId).name;$("#message-input").value="";renderList();renderMessages();$("#details-toggle").disabled=false;$("#find-messages").disabled=false;$("#chat-menu").disabled=false;if(openChat)root.classList.add("chat-open");updateD3()}
function clearActive(){
 resetD2Selection();state.active=null;
 $("#chat-title").textContent="Selecione uma conversa";
 $("#chat-subtitle").textContent="";
 $("#details").hidden=true;
 root.classList.remove("details-open","chat-open");
 $("#details-toggle").setAttribute("aria-expanded","false");
 $("#details-toggle").disabled=true;
 $("#find-messages").disabled=true;
 $("#chat-menu").disabled=true;
 renderList();renderMessages();updateD3();
}
function onChannelSelection(next){
 state.selectedChannels=next;
 const candidates=conversations.filter(c=>canAccess(c)&&conversationMatchesChannels(c,next,channels));
 if(!candidates.some(c=>c.id===state.active))clearActive();
 renderList();
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
window.addEventListener("demo-channels-updated",()=>channelPicker.refresh());
window.addEventListener("demo-assignments-updated",()=>{onChannelSelection(channelPicker.getSelection());const current=active();if(current){$("#detail-agent").textContent=current.agent;$("#detail-status").textContent=current.status;}renderMessages();updateD3()});
list.addEventListener("click",e=>{const item=e.target.closest("[data-id]");if(item)select(item.dataset.id)});
$("#search").addEventListener("input",e=>{state.query=e.target.value;renderList()});
document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{state.filter=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>{x.classList.toggle("selected",x===b);x.setAttribute("aria-pressed",String(x===b))});renderList()}));
function setDetails(open){root.classList.toggle("details-open",open);$("#details").hidden=!open;$("#details-toggle").setAttribute("aria-expanded",String(open))}
$("#details-toggle").addEventListener("click",()=>setDetails($("#details").hidden));
$("#details-close").addEventListener("click",()=>setDetails(false));
$("#back-button").addEventListener("click",()=>{root.classList.remove("chat-open");setDetails(false)});
$("#theme-toggle").addEventListener("click",()=>setAppearance({mode:appearance.mode==="light"?"dark":"light"}));
$("#composer").addEventListener("submit",e=>{e.preventDefault();const input=$("#message-input");if(!active()||!assertCanSend(active())||!sendD2(active(),input.value))return;input.value="";input.style.height="";renderMessages();renderList();});
$("#message-input").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();$("#composer").requestSubmit()}});
$("#message-input").addEventListener("input",e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,144)+"px"});
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
$("#profile-button").addEventListener("click",()=>{document.querySelector("#profile-popover")?.remove();const menu=document.createElement("div");menu.id="profile-popover";menu.className="profile-popover";menu.setAttribute("role","menu");for(const [label,handler] of [["Meu perfil",()=>{showModule("perfil");document.querySelectorAll("[data-nav]").forEach(b=>b.classList.remove("active"))}],["Sair",()=>toast("O encerramento de sessão estará disponível após a autenticação.")]]){const button=document.createElement("button");button.type="button";button.textContent=label;button.setAttribute("role","menuitem");button.onclick=()=>{menu.remove();handler()};menu.append(button)}document.body.append(menu);menu.querySelector("button")?.focus();const dismiss=e=>{if(!menu.contains(e.target)&&e.target!==$("#profile-button")){menu.remove();document.removeEventListener("pointerdown",dismiss)}};document.addEventListener("pointerdown",dismiss)});
const contactEditButton=document.createElement("button");contactEditButton.className="chip";contactEditButton.type="button";contactEditButton.textContent="Editar contato";contactEditButton.onclick=()=>{if(!active())return;editContact(active(),()=>{const id=state.active;select(id);renderList()})};document.querySelector(".contact-card")?.append(contactEditButton);

document.querySelectorAll("[data-nav]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-nav]").forEach(x=>x.classList.toggle("active",x===b));showModule(b.dataset.nav);if(b.dataset.nav==="atendimento")root.classList.remove("chat-open")}));

document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#search").focus()}if(e.key==="Escape"&&root.classList.contains("details-open"))setDetails(false)});
setupD2(active,()=>conversations,()=>{const c=active();if(c){$("#detail-status").textContent=c.status;$("#detail-agent").textContent=c.agent}renderMessages();renderList();updateD3()});
setupD3(active,()=>{onChannelSelection(channelPicker.getSelection());renderMessages()});
select(state.active,{openChat:false,markRead:window.matchMedia("(min-width:761px)").matches});onChannelSelection(channelPicker.getSelection());root.classList.remove("chat-open");