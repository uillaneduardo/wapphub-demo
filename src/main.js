import {nameOf,avatar,editContact} from "./contact-identity.js?v=identity-1";
import {showModule} from "./pages.js?v=inbox-1";
import {channels,getChannel} from "./channels.js?v=channels-1";
import {setupD3,updateD3,canAccess,assertCanSend} from "./d3.js?v=inbox-1";
import {appearance,setAppearance,openAppearanceSettings} from "./appearance.js?v=channels-1";
import {renderD2,sendD2,setupD2,resetD2Selection} from "./d2.js?v=inbox-1";
import {conversations} from "./data.js?v=channels-1";
const $=s=>document.querySelector(s);const root=$("#app"),list=$("#conversation-list"),messages=$("#messages");
const state={active:"mariana",filter:"all",channel:"all",query:"",theme:appearance.mode};

const active=()=>conversations.find(c=>c.id===state.active);
const node=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x};
const toast=text=>{const item=node("div","toast",text);$("#toast-region").append(item);setTimeout(()=>item.remove(),3800)};
function renderList(){
 const shown=conversations.filter(c=>canAccess(c)&&(state.channel==="all"||c.channelId===state.channel)&&(state.filter==="all"||state.filter==="unread"&&c.unread>0||state.filter==="mine"&&c.assigned)&&[nameOf(c),c.phone,c.preview].some(v=>v.toLocaleLowerCase("pt-BR").includes(state.query.toLocaleLowerCase("pt-BR"))));
 list.replaceChildren();
 for(const c of shown){const b=node("button","conversation"+(state.active===c.id?" selected":""));b.type="button";b.dataset.id=c.id;b.setAttribute("aria-label",nameOf(c)+(c.unread?", "+c.unread+" não lidas":""));b.setAttribute("aria-current",state.active===c.id?"true":"false");
 const av=avatar(c),body=node("span","conversation-content"),head=node("span","conversation-head"),preview=node("span","conversation-preview");
 head.append(node("strong","",nameOf(c)),node("time","",c.time));preview.append(node("span","",c.preview));if(c.unread)preview.append(node("span","unread",String(c.unread)));
 body.append(head,preview);b.append(av,body);list.append(b)}
 if(!shown.length)list.append(node("p","placeholder","Nenhuma conversa encontrada."));
 $("#conversation-count").textContent=String(shown.length);
}
function renderMessages(){if(!canAccess(active())){messages.replaceChildren(node("p","placeholder","Conversa não atribuída. Aguarde autorização de um OWNER ou SUPERVISOR."));return}renderD2(active(),messages)}
function select(id){resetD2Selection();state.active=id;const c=active();c.unread=0;$("#chat-title").textContent=nameOf(c);$("#chat-avatar").replaceWith(Object.assign(avatar(c),{id:"chat-avatar"}));$("#chat-subtitle").textContent=c.status+" · "+getChannel(c.channelId).name;$("#detail-avatar").replaceWith(Object.assign(avatar(c,"avatar large"),{id:"detail-avatar"}));$("#detail-name").textContent=nameOf(c);$("#detail-phone").textContent=c.phone;$("#detail-agent").textContent=c.agent;$("#detail-status").textContent=c.status;$("#detail-channel").textContent=getChannel(c.channelId).name;$("#message-input").value="";renderList();renderMessages();root.classList.add("chat-open");updateD3()}
function refreshChannelOptions(){const select=$("#channel-select"),selected=state.channel;select.replaceChildren();for(const c of channels.filter(c=>c.id==="all"||c.enabled)){const option=document.createElement("option");option.value=c.id;option.textContent=c.name;select.append(option)}if(!channels.some(c=>c.id===selected&&c.enabled))state.channel="all";select.value=state.channel;}
window.addEventListener("demo-channels-updated",()=>{refreshChannelOptions();setChannel(state.channel)});
function setChannel(id){
 const channel=getChannel(id);
 state.channel=channel.enabled||channel.id==="all"?channel.id:"all";
 $("#channel-select").value=state.channel;
 const visible=conversations.filter(c=>canAccess(c)&&(state.channel==="all"||c.channelId===state.channel));
 if(!visible.some(c=>c.id===state.active)){
   if(visible.length)select(visible[0].id);
   else {
     resetD2Selection();
     messages.replaceChildren(node("p","placeholder","Nenhuma conversa disponível neste canal."));
     $("#chat-title").textContent=channel.name;
     $("#chat-subtitle").textContent="Sem conversas";
   }
 }
 renderList();
}
$("#channel-select").addEventListener("change",e=>setChannel(e.target.value));
list.addEventListener("click",e=>{const item=e.target.closest("[data-id]");if(item)select(item.dataset.id)});
$("#search").addEventListener("input",e=>{state.query=e.target.value;renderList()});
document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{state.filter=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>{x.classList.toggle("selected",x===b);x.setAttribute("aria-pressed",String(x===b))});renderList()}));
function setDetails(open){root.classList.toggle("details-open",open);$("#details").hidden=!open;$("#details-toggle").setAttribute("aria-expanded",String(open))}
$("#details-toggle").addEventListener("click",()=>setDetails($("#details").hidden));
$("#details-close").addEventListener("click",()=>setDetails(false));
$("#back-button").addEventListener("click",()=>{root.classList.remove("chat-open");setDetails(false)});
$("#theme-toggle").addEventListener("click",()=>{state.theme=state.theme==="light"?"dark":"light";setAppearance({mode:state.theme})});
$("#composer").addEventListener("submit",e=>{e.preventDefault();const input=$("#message-input");if(!assertCanSend(active())||!sendD2(active(),input.value))return;input.value="";input.style.height="";renderMessages();renderList();});
$("#message-input").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();$("#composer").requestSubmit()}});
$("#message-input").addEventListener("input",e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,144)+"px"});
$("#profile-button").addEventListener("click",()=>{document.querySelector("#profile-popover")?.remove();const menu=document.createElement("div");menu.id="profile-popover";menu.className="profile-popover";menu.setAttribute("role","menu");for(const [label,handler] of [["Meu perfil",()=>{const box=document.createElement("div");box.className="d2-overlay";const card=document.createElement("section");card.className="d2-dialog";card.innerHTML="<header class='d2-dialog-head'><strong>Meu perfil</strong></header><div class='d2-body'><p>Usuário</p><p>Nome de exibição: Uillan Eduardo</p><p>Gerencie os dados de perfil e identificação utilizados nas mensagens.</p></div>";const close=document.createElement("button");close.className="chip";close.type="button";close.textContent="Fechar";close.onclick=()=>box.remove();card.querySelector("header").append(close);box.append(card);document.body.append(box)}],["Sair",()=>toast("O encerramento de sessão estará disponível após a autenticação.")]]){const button=document.createElement("button");button.type="button";button.textContent=label;button.setAttribute("role","menuitem");button.onclick=()=>{menu.remove();handler()};menu.append(button)}document.body.append(menu);menu.querySelector("button")?.focus();const dismiss=e=>{if(!menu.contains(e.target)&&e.target!==$("#profile-button")){menu.remove();document.removeEventListener("pointerdown",dismiss)}};document.addEventListener("pointerdown",dismiss)});
const contactEditButton=document.createElement("button");contactEditButton.className="chip";contactEditButton.type="button";contactEditButton.textContent="Editar contato";contactEditButton.onclick=()=>editContact(active(),()=>{const id=state.active;select(id);renderList()});document.querySelector(".contact-card")?.append(contactEditButton);

document.querySelectorAll("[data-nav]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-nav]").forEach(x=>x.classList.toggle("active",x===b));showModule(b.dataset.nav);if(b.dataset.nav==="atendimento")root.classList.remove("chat-open")}));

document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#search").focus()}if(e.key==="Escape"&&root.classList.contains("details-open"))setDetails(false)});
setupD2(active,()=>conversations,()=>{renderMessages();renderList();updateD3()});
setupD3(active,()=>{renderMessages();renderList()});
select(state.active);refreshChannelOptions();setChannel("all");root.classList.remove("chat-open");