import {setupD3,updateD3,canAccess,assertCanSend} from "./d3.js?v=d3";
import {appearance,setAppearance,openAppearanceSettings} from "./appearance.js?v=d3";
import {renderD2,sendD2,setupD2,resetD2Selection} from "./d2.js?v=d3";
import {conversations} from "./data.js?v=d3";
const $=s=>document.querySelector(s);const root=$("#app"),list=$("#conversation-list"),messages=$("#messages");
const state={active:"mariana",filter:"all",query:"",theme:appearance.mode};

const active=()=>conversations.find(c=>c.id===state.active);
const node=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x};
const toast=text=>{const item=node("div","toast",text);$("#toast-region").append(item);setTimeout(()=>item.remove(),3800)};
function renderList(){
 const shown=conversations.filter(c=>canAccess(c)&&(state.filter==="all"||state.filter==="unread"&&c.unread>0||state.filter==="mine"&&c.assigned)&&[c.name,c.preview].some(v=>v.toLocaleLowerCase("pt-BR").includes(state.query.toLocaleLowerCase("pt-BR"))));
 list.replaceChildren();
 for(const c of shown){const b=node("button","conversation"+(state.active===c.id?" selected":""));b.type="button";b.dataset.id=c.id;b.setAttribute("aria-label",c.name+(c.unread?", "+c.unread+" não lidas":""));b.setAttribute("aria-current",state.active===c.id?"true":"false");
 const av=node("span","avatar",c.initials),body=node("span","conversation-content"),head=node("span","conversation-head"),preview=node("span","conversation-preview");
 head.append(node("strong","",c.name),node("time","",c.time));preview.append(node("span","",c.preview));if(c.unread)preview.append(node("span","unread",String(c.unread)));
 body.append(head,preview);b.append(av,body);list.append(b)}
 if(!shown.length)list.append(node("p","placeholder","Nenhuma conversa encontrada."));
 $("#conversation-count").textContent=String(conversations.length);
}
function renderMessages(){if(!canAccess(active())){messages.replaceChildren(node("p","placeholder","Conversa não atribuída. Aguarde autorização de um OWNER ou SUPERVISOR."));return}renderD2(active(),messages)}
function select(id){resetD2Selection();state.active=id;const c=active();c.unread=0;$("#chat-title").textContent=c.name;$("#chat-avatar").textContent=c.initials;$("#chat-subtitle").textContent=c.status;$("#detail-avatar").textContent=c.initials;$("#detail-name").textContent=c.name;$("#detail-phone").textContent=c.phone;$("#detail-agent").textContent=c.agent;$("#detail-status").textContent=c.status;$("#message-input").value="";renderList();renderMessages();root.classList.add("chat-open");updateD3()}
list.addEventListener("click",e=>{const item=e.target.closest("[data-id]");if(item)select(item.dataset.id)});
$("#search").addEventListener("input",e=>{state.query=e.target.value;renderList()});
document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{state.filter=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>{x.classList.toggle("selected",x===b);x.setAttribute("aria-pressed",String(x===b))});renderList()}));
function setDetails(open){root.classList.toggle("details-open",open);$("#details").hidden=!open;$("#details-toggle").setAttribute("aria-expanded",String(open))}
$("#details-toggle").addEventListener("click",()=>setDetails($("#details").hidden));
$("#details-close").addEventListener("click",()=>setDetails(false));
$("#back-button").addEventListener("click",()=>{root.classList.remove("chat-open");setDetails(false)});
$("#theme-toggle").addEventListener("click",()=>{state.theme=state.theme==="light"?"dark":"light";setAppearance({mode:state.theme})});
$("#composer").addEventListener("submit",e=>{e.preventDefault();const input=$("#message-input");if(!assertCanSend(active())||!sendD2(active(),input.value))return;input.value="";input.style.height="";renderMessages();renderList();toast("Mensagem adicionada à demonstração. Nenhum envio externo.");});
$("#message-input").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();$("#composer").requestSubmit()}});
$("#message-input").addEventListener("input",e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,144)+"px"});
$("#inbox-menu").addEventListener("click",()=>toast("WappHub Demo D1 · Interface estática com dados fictícios."));
$("#profile-button").addEventListener("click",()=>openAppearanceSettings());
document.querySelectorAll("[data-nav]").forEach(b=>b.addEventListener("click",()=>{if(b.dataset.nav==="atendimento"){document.querySelectorAll("[data-nav]").forEach(x=>x.classList.toggle("active",x===b));root.classList.remove("chat-open")}else toast("Tela de "+(b.dataset.nav==="contatos"?"contatos":"visão geral")+" prevista na D4.")}));
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#search").focus()}if(e.key==="Escape"&&root.classList.contains("details-open"))setDetails(false)});
setupD2(active,()=>conversations,()=>{renderMessages();renderList();updateD3()});
setupD3(active,()=>{renderMessages();renderList()});
select(state.active);root.classList.remove("chat-open");