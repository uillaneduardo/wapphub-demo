// D2: adaptador de interações locais. Nenhuma chamada de rede.
const $=s=>document.querySelector(s);
const el=(tag,cls="",txt)=>{const n=document.createElement(tag);n.className=cls;if(txt!==undefined)n.textContent=txt;return n};
let pendingReply=null,findTerm="",menu=null;
const states=new WeakMap();
const attachmentTypes={image:"Imagem",audio:"Áudio",video:"Vídeo",document:"Documento"};
let onChange=()=>{}, getCurrent=()=>null,getAll=()=>[];
function notify(msg){const t=el("div","toast",msg);$("#toast-region").append(t);setTimeout(()=>t.remove(),4000)}
function normalized(m){return Array.isArray(m)?{direction:m[0],body:m[1],time:m[2],status:m[0]==="out"?"sent":null}:m}
function ensure(c){c.messages=c.messages.map(normalized);return c}
function statusLabel(s){return ({queued:"Na fila",sending:"Enviando…",sent:"Enviada",delivered:"Entregue",read:"Lida",failed:"Falha no envio"})[s]||""}
function control(txt,action,id){const b=el("button","message-action",txt);b.type="button";b.dataset.action=action;b.dataset.msg=id;return b}
export function renderD2(c,container){ensure(c);container.replaceChildren(el("div","date-separator","Hoje"));let matches=0;
 c.messages.forEach((m,i)=>{const searchable=[m.body,m.file?.name,m.reply?.body].join(" ").toLocaleLowerCase("pt-BR");if(findTerm&&!searchable.includes(findTerm))return;matches++;
 const row=el("div","message-row"+(m.direction==="out"?" mine":""));row.dataset.messageId=String(i);
 const bubble=el("div","bubble");
 if(m.reply)bubble.append(el("div","reply-reference",(m.reply.direction==="out"?"Você: ":"Contato: ")+(m.reply.body||m.reply.file?.name||"Anexo").slice(0,110)));
 if(m.file){const f=el("div","file-card"),badge=el("span","file-type",attachmentTypes[m.file.kind]||"Arquivo"),label=el("span","file-label",m.file.name);f.append(badge,label);if(m.file.url){const a=el("a","file-link","Abrir");a.href=m.file.url;a.target="_blank";a.rel="noopener";a.setAttribute("download",m.file.name);f.append(a)}bubble.append(f)}
 if(m.body)bubble.append(el("span","message-text",m.body));
 row.append(bubble);
 const meta=el("span","message-meta",m.time+(m.direction==="out"?" · "+statusLabel(states.get(m)||m.status||"sent"):""));
 if((states.get(m)||m.status)==="failed")meta.classList.add("failed");
 row.append(meta);
 const actions=el("div","message-actions");actions.append(control("Responder","reply",i),control("Encaminhar","forward",i));
 if(m.direction==="out")actions.append(control("Estado","cycle",i));
 if((states.get(m)||m.status)==="failed")actions.append(control("Reenviar","retry",i));
 row.append(actions);container.append(row);
 });if(!matches)container.append(el("p","placeholder",findTerm?"Nenhuma mensagem encontrada.":"Sem mensagens."));container.scrollTop=container.scrollHeight;
}
export function sendD2(c,value){ensure(c);const body=value.trim();if(!body&&!fileDraft)return false;
 const msg={direction:"out",body,time:new Intl.DateTimeFormat("pt-BR",{hour:"2-digit",minute:"2-digit"}).format(new Date()),status:"sent"};
 if(pendingReply)msg.reply={...pendingReply};if(fileDraft){msg.file=fileDraft;fileDraft=null}
 c.messages.push(msg);c.preview=body||"📎 "+msg.file.name;c.time=msg.time;pendingReply=null;updateDraft();return true;
}
let fileDraft=null;
function updateDraft(){document.querySelectorAll(".d2-draft").forEach(draft=>draft.remove());if(!pendingReply&&!fileDraft)return;const bar=el("div","d2-draft"),label=el("span","",pendingReply?"↪ Respondendo: "+(pendingReply.body||pendingReply.file?.name):"📎 "+fileDraft.name),x=el("button","chip","Cancelar");x.type="button";x.onclick=()=>{pendingReply=null;fileDraft=null;updateDraft()};bar.id="d2-draft";bar.append(label,x);$("#composer").prepend(bar)}
function setupAttachment(){const input=el("input");input.type="file";input.accept="image/*,audio/*,video/*,.pdf,.txt,.csv,.doc,.docx";input.hidden=true;document.body.append(input);
 input.addEventListener("change",()=>{const f=input.files?.[0];if(!f)return;if(f.size>20*1024*1024){notify("Arquivo maior que 20 MB. Escolha outro.");input.value="";return}
 const kind=f.type.startsWith("image/")?"image":f.type.startsWith("audio/")?"audio":f.type.startsWith("video/")?"video":"document";
 fileDraft={name:f.name,kind,size:f.size,url:URL.createObjectURL(f)};updateDraft();input.value="";notify("Anexo preparado (apenas neste navegador).")});
 $("#attach-button").addEventListener("click",()=>input.click());
}
function showMenu(items,anchor){menu?.remove();const r=anchor.getBoundingClientRect(),popup=el("div","d2-menu");popup.setAttribute("role","menu");items.forEach(([label,callback])=>{const b=el("button","",label);b.type="button";b.setAttribute("role","menuitem");b.onclick=()=>{popup.remove();menu=null;callback()};popup.append(b)});document.body.append(popup);menu=popup;popup.style.left=Math.min(r.left,innerWidth-208)+"px";popup.style.top=Math.min(r.bottom+4,innerHeight-popup.offsetHeight-8)+"px"}
export function setupD2(getActive,getConversations,refresh){getCurrent=getActive;getAll=getConversations;onChange=refresh;
 $("#messages").addEventListener("click",e=>{const b=e.target.closest("[data-action]");if(!b)return;const c=ensure(getCurrent()),m=c.messages[Number(b.dataset.msg)];if(!m)return;
 if(b.dataset.action==="reply"){pendingReply={direction:m.direction,body:m.body,file:m.file?{name:m.file.name}:undefined};updateDraft();$("#message-input").focus()}
 if(b.dataset.action==="forward"){showMenu(getAll().filter(x=>x.id!==c.id).map(target=>[target.name,()=>{ensure(target);target.messages.push({...m,direction:"out",status:"sent",reply:undefined,forwarded:true,time:new Intl.DateTimeFormat("pt-BR",{hour:"2-digit",minute:"2-digit"}).format(new Date())});target.preview="↪ "+(m.body||m.file?.name||"Anexo");notify("Mensagem encaminhada na demonstração para "+target.name);onChange()}]),b)}
 if(b.dataset.action==="cycle"){const order=["sent","delivered","read","failed"];const current=states.get(m)||m.status||"sent";states.set(m,order[(order.indexOf(current)+1)%order.length]);onChange()}
 if(b.dataset.action==="retry"){states.set(m,"sent");notify("Reenvio simulado.");onChange()}
 });
 $("#find-messages").addEventListener("click",()=>{const q=prompt("Buscar mensagens nesta conversa:",findTerm);if(q===null)return;findTerm=q.trim().toLocaleLowerCase("pt-BR");onChange();notify(findTerm?"Filtro de mensagens ativo. Repita a busca e deixe vazio para limpar.":"Filtro do histórico removido.")});
 setupAttachment();
 $("#emoji-button").addEventListener("click",()=>showMenu(["🙂","👍","❤️","✅","🙏","😂"].map(emoji=>[emoji,()=>{const input=$("#message-input");input.value+=emoji;input.focus()}]),$("#emoji-button")));
 $("#chat-menu").addEventListener("click",()=>showMenu([["Marcar como não lida",()=>{getCurrent().unread=1;onChange();notify("Marcada como não lida (simulação).")}],["Encerrar atendimento",()=>{getCurrent().status="Finalizado";$("#chat-subtitle").textContent="Finalizado";onChange();notify("Atendimento finalizado na demo.")}],["Reabrir atendimento",()=>{getCurrent().status="Em atendimento";$("#chat-subtitle").textContent="Em atendimento";onChange();notify("Atendimento reaberto na demo.")}]],$("#chat-menu")));
 document.addEventListener("pointerdown",e=>{if(menu&&!menu.contains(e.target)&&!e.target.closest("[data-action],#emoji-button,#chat-menu")){menu.remove();menu=null}});
}
export function resetD2Selection(){pendingReply=null;findTerm="";fileDraft=null;updateDraft()}
