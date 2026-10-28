import {setupSwipeReply} from "./swipe-reply.js?v=swipe-1";
import {resolveReplyTarget} from "./reply-navigation.mjs?v=reply-1";
import {createMediaPlayer,openMediaViewer} from "./media-player.js?v=media-1";
import {canAccess} from "./d3.js?v=d4-6";
import {can} from "./permissions.js?v=d4-6";
const $=s=>document.querySelector(s), el=(tag,cl="",text)=>{const n=document.createElement(tag);n.className=cl;if(text!==undefined)n.textContent=text;return n};
let reply=null,file=null,query="",selected=new Set(),selectionMode=false,menu=null,active=()=>null,all=()=>[],refresh=()=>{},modal=null,touchTimer=0,touchStart=null,swipeGesture=null;
const statuses=["sent","delivered","read","failed"], labels={sent:"Enviada",delivered:"Entregue",read:"Lida",failed:"Falha no envio"};
const newId=()=>globalThis.crypto?.randomUUID?.()||"msg-"+Date.now()+"-"+Math.random().toString(36).slice(2);
const normalize=c=>{c.messages=c.messages.map((m,i)=>{const item=Array.isArray(m)?{direction:m[0],body:m[1],time:m[2],status:"sent"}:m;item.id??="demo:"+c.id+":"+i;item.conversationId=c.id;return item});return c};
const byId=(c,id)=>normalize(c).messages.find(m=>m.id===id);
const notify=t=>{const n=el("div","toast",t);$("#toast-region").append(n);setTimeout(()=>n.remove(),3300)};
const stamp=()=>new Intl.DateTimeFormat("pt-BR",{hour:"2-digit",minute:"2-digit"}).format(new Date());
function draft(){document.querySelectorAll(".d2-draft").forEach(n=>n.remove());if(reply&&active()?.id!==reply.conversationId)reply=null;if(!reply&&!file)return;const bar=el("div","d2-draft");bar.id="d2-draft";bar.append(el("span","",reply?"↪ Respondendo: "+(reply.body||reply.file?.name||"Mídia"):"📎 "+file.name));const cancel=el("button","chip","Cancelar");cancel.type="button";cancel.onclick=e=>{e.preventDefault();e.stopPropagation();reply=null;file=null;draft()};bar.append(cancel);$("#composer").prepend(bar)}
function closeMenu(){menu?.remove();menu=null}
function openMenu(items,x,y){closeMenu();const box=el("div","d2-menu");box.setAttribute("role","menu");items.forEach(([label,fn,disabled=false])=>{const b=el("button","",label);b.type="button";b.disabled=disabled;b.setAttribute("role","menuitem");b.onclick=()=>{closeMenu();fn()};box.append(b)});document.body.append(box);menu=box;box.style.left=Math.max(6,Math.min(x,innerWidth-box.offsetWidth-6))+"px";box.style.top=Math.max(6,Math.min(y,innerHeight-box.offsetHeight-6))+"px";box.querySelector("button")?.focus()}
function closeDialog(){modal?.remove();modal=null}
function dialog(title,content){closeDialog();const backdrop=el("div","d2-overlay");const panel=el("section","d2-dialog");panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.setAttribute("aria-label",title);const head=el("header","d2-dialog-head");head.append(el("strong","",title));const x=el("button","chip","Fechar");x.type="button";x.onclick=closeDialog;head.append(x);panel.append(head,content);backdrop.append(panel);backdrop.addEventListener("click",e=>{if(e.target===backdrop)closeDialog()});document.body.append(backdrop);modal=backdrop;return panel}
function choose(ids){selected=new Set(ids);selectionMode=selected.size>0;refresh();selectionBar()}
function selectionBar(){document.querySelector("#d2-selection")?.remove();if(!selected.size&&!selectionMode)return;const bar=el("div","d2-selection");bar.id="d2-selection";bar.setAttribute("role","toolbar");bar.setAttribute("aria-label","Ações em mensagens selecionadas");bar.append(el("strong","",selected.size?selected.size+" selecionada(s)":"Toque para selecionar"));for(const [text,fn] of [["Encaminhar",()=>forward([...selected])],["Apagar para mim",()=>removeMessages(false)],["Apagar para todos",()=>removeMessages(true)],["Cancelar",()=>choose([])]]){const b=el("button","chip",text);b.type="button";b.disabled=text!=="Cancelar"&&!selected.size||text==="Encaminhar"&&!can("forward")||text==="Apagar para mim"&&!can("deleteMine")||text==="Apagar para todos"&&!can("deleteAll");b.onclick=fn;bar.append(b)}$("#workspace").append(bar)}
function removeMessages(everyone){const key=everyone?"deleteAll":"deleteMine";if(!can(key)){notify("Ação não permitida para o perfil.");return}const c=normalize(active()),ids=[...selected];if(!ids.length)return;const content=el("div","d2-body");content.append(el("p","",everyone?"Apagar para todos? O conteúdo será substituído por um aviso.":"Apagar estas mensagens apenas da sua visualização?"));const btn=el("button","d2-primary","Confirmar exclusão");btn.onclick=()=>{for(const i of ids){const m=byId(c,i);if(!m)continue;if(everyone){m.body="Mensagem apagada";delete m.file;m.deletedAll=true}else m.hidden=true}selected.clear();selectionMode=false;closeDialog();selectionBar();refresh();notify("Mensagem removida da conversa.")};content.append(btn);dialog(everyone?"Apagar para todos":"Apagar para mim",content)}
function forward(ids){if(!can("forward")){notify("Encaminhamento bloqueado nas permissões.");return}
 const source=normalize(active()),items=ids.map(i=>byId(source,i)).filter(m=>m&&!m.hidden&&!m.deletedAll);if(!items.length)return;
 const content=el("div","d2-body"),summary=el("p","",items.length+" mensagem(ns) selecionada(s). Escolha os destinatários.");
 const search=el("input","d2-search");search.type="search";search.placeholder="Buscar por nome ou telefone";search.setAttribute("aria-label","Buscar destinatários");
 const results=el("div","d2-results"),picked=new Set(),footer=el("div","d2-footer"),count=el("span","","0 destinatários");
 const confirm=el("button","d2-primary","Encaminhar");confirm.disabled=true;
 function render(){results.replaceChildren();const q=search.value.toLowerCase().replace(/[^a-z0-9À-ÿ]/gi,"");let found=0;all().filter(c=>c.id!==source.id&&canAccess(c)).forEach(c=>{const key=(c.name+" "+c.phone).toLowerCase().replace(/[^a-z0-9À-ÿ]/gi,"");if(q&&!key.includes(q))return;found++;const b=el("button","d2-result"+(picked.has(c.id)?" chosen":""));b.type="button";b.append(el("strong","",c.name||c.phone),el("small","",c.phone||"Número não informado"));const check=el("span","",picked.has(c.id)?"✓":"○");b.prepend(check);b.onclick=()=>{picked.has(c.id)?picked.delete(c.id):picked.add(c.id);render()};results.append(b)});if(!found)results.append(el("p","placeholder","Nenhum destinatário encontrado"));count.textContent=picked.size+" destinatário(s)";confirm.disabled=!picked.size}
 search.addEventListener("input",render);confirm.onclick=()=>{const now=stamp();for(const c of all().filter(c=>picked.has(c.id))){normalize(c);for(const m of items){c.messages.push({...m,id:newId(),conversationId:c.id,direction:"out",time:now,status:"sent",forwarded:true,reply:undefined,hidden:false});}c.preview="↪ "+(items.at(-1).body||items.at(-1).file?.name||"Arquivo");c.time=now}closeDialog();choose([]);refresh();notify(items.length+" mensagem(ns) encaminhada(s) para "+picked.size+" destinatário(s).")};
 footer.append(count,confirm);content.append(summary,search,results,footer);dialog("Encaminhar mensagens",content);render();search.focus();
}
let replyJumpTimer=null;
function jumpToOriginal(reference){
 const conversation=active();
 if(!conversation||!reference)return;
 normalize(conversation);
 const original=resolveReplyTarget(conversation,reference);
 if(!original){notify("A mensagem original não está disponível nesta conversa.");return}
 // O filtro de busca pode ter ocultado a referência: restaurar o histórico.
 if(query){
  query="";
  const input=$("#message-search-input");if(input)input.value="";
  refresh();
 }
 const area=$("#messages");
 const row=[...area.querySelectorAll("[data-message-id]")].find(node=>node.dataset.messageId===original.id);
 if(!row){notify("Não foi possível localizar a mensagem original.");return}
 if(replyJumpTimer)clearTimeout(replyJumpTimer);
 for(const previous of area.querySelectorAll(".reply-jump-highlight"))previous.classList.remove("reply-jump-highlight");
 row.classList.add("reply-jump-highlight");
 row.focus({preventScroll:true});
 const motion=window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches?"instant":"smooth";
 row.scrollIntoView({behavior:motion==="instant"?"auto":"smooth",block:"center"});
 replyJumpTimer=setTimeout(()=>{row.classList.remove("reply-jump-highlight");replyJumpTimer=null},1900);
}
function action(action,i){const c=normalize(active()),m=byId(c,i);if(!m)return;
 if(action==="reply"){reply={conversationId:c.id,messageId:m.id,body:m.body,direction:m.direction,file:m.file?{name:m.file.name}:undefined};draft();$("#message-input").focus()}
 if(action==="forward")forward([i]);
 if(action==="select")choose([...selected,i]);
 if(action==="deleteMine"){choose([i]);removeMessages(false)}
 if(action==="deleteAll"){choose([i]);removeMessages(true)}
 if(action==="copy")navigator.clipboard?.writeText(m.body||"").then(()=>notify("Texto copiado.")).catch(()=>notify("Não foi possível copiar."));
 if(action==="cycle"){m.status=statuses[(statuses.indexOf(m.status)+1)%statuses.length];refresh()}
 if(action==="retry"){m.status="sent";refresh();notify("Reenvio solicitado.")}
}
function context(i,x,y){const m=byId(active(),i);if(!m)return;openMenu([["Responder",()=>action("reply",i)],["Copiar texto",()=>action("copy",i),!m.body],["Encaminhar",()=>action("forward",i),!can("forward")],["Selecionar mensagens",()=>action("select",i)],["Apagar para mim",()=>action("deleteMine",i),!can("deleteMine")],["Apagar para todos",()=>action("deleteAll",i),!can("deleteAll")]],x,y)}
export function renderD2(c,container){normalize(c);container.replaceChildren(el("div","date-separator","Hoje"));let n=0;c.messages.forEach((m,i)=>{if(m.hidden)return;if(query&&!(m.body+" "+(m.file?.name||"")).toLowerCase().includes(query))return;n++;const row=el("div","message-row"+(m.direction==="out"?" mine":"")+(selected.has(m.id)?" d2-picked":""));row.dataset.messageId=m.id;row.tabIndex=0;const b=el("div","bubble");if(m.file)b.classList.add("has-media");if(m.reply){
 const ref=el("button","reply-reference","↪ "+(m.reply.body||m.reply.file?.name||"Mídia"));
 ref.type="button";
 ref.dataset.replyTarget=m.reply.messageId||"";
 ref.setAttribute("aria-label","Ir para mensagem respondida: "+(m.reply.body||m.reply.file?.name||"Mídia"));
 ref.title="Ir para mensagem original";
 b.append(ref);
}if(m.forwarded)b.append(el("div","d2-forwarded","Encaminhada"));if(m.file){
 const mediaKind=m.file.kind;
 if(mediaKind==="audio"||mediaKind==="video"){
   b.append(createMediaPlayer(m.file,{compact:true}));
 }else if(mediaKind==="image"&&m.file.url){
   const preview=el("button","message-image");preview.type="button";
   preview.setAttribute("aria-label","Ver imagem: "+m.file.name);
   const img=el("img");img.src=m.file.url;img.alt=m.file.name||"Imagem recebida";img.loading="lazy";
   preview.append(img);preview.onclick=()=>openMediaViewer({...m.file,kind:"image",caption:m.body||""});
   b.append(preview);
 }else{
   const f=el("div","file-card");f.append(el("span","file-type",(m.file.kind||"Arquivo").toUpperCase()),el("span","file-label",m.file.name));
   if(m.file.url){const a=el("a","file-link","Abrir");a.href=m.file.url;a.download=m.file.name;f.append(a)}
   b.append(f);
 }
}if(m.body)b.append(el("span","message-text",m.body));row.append(b,el("span","message-meta",m.time+(m.direction==="out"?" · "+(labels[m.status]||"Enviada"):"")));const controls=el("div","message-actions");for(const [text,a] of [["Responder","reply"],["Encaminhar","forward"],["Mais","context"]]){const btn=el("button","message-action",text);btn.type="button";btn.dataset.action=a;btn.dataset.msg=m.id;controls.append(btn)}row.append(controls);container.append(row)});if(!n)container.append(el("p","placeholder","Nenhuma mensagem encontrada."));container.scrollTop=query?0:container.scrollHeight;
const searchCount=$("#message-search-count"),clear=$("#message-search-clear");
if(searchCount)searchCount.textContent=query?(n===1?"1 resultado":n+" resultados"):"";
if(clear)clear.hidden=!query;
selectionBar()}
export function sendD2(c,value){normalize(c);const body=value.trim();if(!body&&!file)return false;const m={id:newId(),conversationId:c.id,direction:"out",body,time:stamp(),status:"sent"};if(reply&&reply.conversationId===c.id&&byId(c,reply.messageId))m.reply={...reply};if(file){m.file=file;file=null}c.messages.push(m);c.preview=body||"📎 "+m.file.name;c.time=m.time;reply=null;draft();return true}
export function resetD2Selection(){swipeGesture?.cancel();if(replyJumpTimer){clearTimeout(replyJumpTimer);replyJumpTimer=null}$("#messages")?.querySelectorAll(".reply-jump-highlight").forEach(row=>row.classList.remove("reply-jump-highlight"));reply=null;file=null;query="";selected.clear();selectionMode=false;const search=$("#message-search"),field=$("#message-search-input");if(search)search.hidden=true;if(field)field.value="";draft();closeDialog();closeMenu();selectionBar()}
export function setupD2(getActive,getAll,onChange){active=getActive;all=getAll;refresh=onChange;const area=$("#messages");
 swipeGesture=setupSwipeReply({
  area,onReply:id=>action("reply",id),
  isSelectionActive:()=>selectionMode||selected.size>0,
  onGestureStart:()=>{clearTimeout(touchTimer);touchStart=null;closeMenu()}
 });
 area.addEventListener("click",e=>{
  const quote=e.target.closest("[data-reply-target]");
  if(!quote)return;
  e.preventDefault();e.stopPropagation();
  const messageRow=quote.closest("[data-message-id]");
  const message=messageRow&&active()?byId(active(),messageRow.dataset.messageId):null;
  if(message?.reply)jumpToOriginal(message.reply);
 });
 area.addEventListener("click",e=>{const b=e.target.closest("[data-action]");if(!b)return;const i=b.dataset.msg;if(b.dataset.action==="context"){const r=b.getBoundingClientRect();context(i,r.left,r.bottom);return}action(b.dataset.action,i)});
 area.addEventListener("click",e=>{if((!selected.size&&!selectionMode)||e.target.closest("[data-action],[data-reply-target],a,button,input,video,audio"))return;const row=e.target.closest("[data-message-id]");if(!row)return;const id=row.dataset.messageId;selected.has(id)?selected.delete(id):selected.add(id);refresh()});
 area.addEventListener("contextmenu",e=>{const row=e.target.closest("[data-message-id]");if(!row)return;e.preventDefault();context(row.dataset.messageId,e.clientX,e.clientY)});
 area.addEventListener("keydown",e=>{const row=e.target.closest("[data-message-id]");if(row&&(e.key==="ContextMenu"||(e.shiftKey&&e.key==="F10"))){e.preventDefault();const r=row.getBoundingClientRect();context(row.dataset.messageId,r.left,r.top)}});
 area.addEventListener("touchstart",e=>{if(e.target.closest("[data-reply-target],button,input,video,audio"))return;const row=e.target.closest("[data-message-id]");if(!row)return;touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY};clearTimeout(touchTimer);touchTimer=setTimeout(()=>{touchTimer=0;swipeGesture?.cancel();if(touchStart)context(row.dataset.messageId,touchStart.x,touchStart.y)},550)},{passive:true});
 area.addEventListener("touchmove",e=>{if(touchStart&&Math.hypot(e.touches[0].clientX-touchStart.x,e.touches[0].clientY-touchStart.y)>12)clearTimeout(touchTimer)},{passive:true});
 area.addEventListener("touchend",()=>clearTimeout(touchTimer));
 const upload=el("input");upload.type="file";upload.hidden=true;document.body.append(upload);$("#attach-button").onclick=()=>upload.click();upload.addEventListener("change",()=>{const f=upload.files[0];if(!f)return;if(f.size>20*1024*1024){notify("Tamanho máximo permitido: 20 MB.");return}const kind=f.type.startsWith("image/")?"image":f.type.startsWith("audio/")?"audio":f.type.startsWith("video/")?"video":"document";file={name:f.name,kind,url:URL.createObjectURL(f)};draft();upload.value=""});
 const searchBox=$("#message-search"),searchInput=$("#message-search-input"),searchClear=$("#message-search-clear"),searchClose=$("#message-search-close");
 function closeSearch(){query="";searchInput.value="";searchBox.hidden=true;refresh();$("#find-messages").focus()}
 $("#find-messages").onclick=()=>{searchBox.hidden=false;searchInput.focus();searchInput.select();};
 searchInput.addEventListener("input",()=>{query=searchInput.value.trim().toLocaleLowerCase("pt-BR");refresh()});
 searchInput.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();closeSearch()}});
 searchClear.onclick=()=>{searchInput.value="";query="";refresh();searchInput.focus()};
 searchClose.onclick=closeSearch;
 $("#emoji-button").onclick=e=>{const r=e.currentTarget.getBoundingClientRect();openMenu(["🙂","👍","❤️","✅"].map(s=>[s,()=>{$("#message-input").value+=s;$("#message-input").focus()}]),r.left,r.top-160)};
 $("#chat-menu").onclick=e=>{const r=e.currentTarget.getBoundingClientRect();openMenu([["Selecionar mensagens",()=>{selectionMode=true;selected.clear();selectionBar()}],["Marcar como não lida",()=>{const c=active();if(!c)return;c.unread=1;refresh();if(innerWidth<=760)$("#app").classList.remove("chat-open")}],["Encerrar atendimento",()=>{const c=active();if(!c)return;c.status="Finalizado";refresh()}],["Reabrir atendimento",()=>{const c=active();if(!c)return;c.status="Em atendimento";refresh()}]],r.left,r.bottom)};
 document.addEventListener("pointerdown",e=>{if(menu&&!menu.contains(e.target)&&!e.target.closest("[data-action],#emoji-button,#chat-menu"))closeMenu()});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeMenu();closeDialog();if(selectionMode||selected.size)choose([])}});
}
