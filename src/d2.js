import {messageDay,formatMessageDay,refreshChatDateIndicator} from "./chat-dates.js?v=dates-1&route-scope-1";
import {attachMediaBlur} from "./media-blur.js?v=motion-1";
import {mediaVisibilityKey} from "./media-visibility-store.js?v=motion-1";
import {setupSwipeReply} from "./swipe-reply.js?v=swipe-2&area-2&controls-1";
import {createMediaPlayer,openMediaViewer} from "./media-player.js?v=motion-1&playback-2";
import {canAccess} from "./d3.js?v=d4-6";
import {can} from "./permissions.js?v=d4-6";
import {demoDeliveryLabels} from "./domain/message-status.mjs";
import {setupEmojiPicker} from "./emoji-picker.mjs?v=emoji-1";
const $=s=>document.querySelector(s), el=(tag,cl="",text)=>{const n=document.createElement(tag);n.className=cl;if(text!==undefined)n.textContent=text;return n};
let reply=null,file=null,query="",selected=new Set(),selectionMode=false,menu=null,active=()=>null,refresh=()=>{},commands=null,operationQuery=null,conversationActions=null,ensureMessageVisible=null,modal=null,touchTimer=0,touchStart=null,swipeGesture=null;
let emojiPicker=null;
export function closeD2EmojiPicker(){emojiPicker?.close()}
const newId=()=>globalThis.crypto?.randomUUID?.()||"msg-"+Date.now()+"-"+Math.random().toString(36).slice(2);
const notify=t=>{const n=el("div","toast",t);$("#toast-region").append(n);setTimeout(()=>n.remove(),3300)};
const stamp=()=>new Intl.DateTimeFormat("pt-BR",{hour:"2-digit",minute:"2-digit"}).format(new Date());
function draft(){document.querySelectorAll(".d2-draft").forEach(n=>n.remove());if(reply&&active()?.id!==reply.conversationId)reply=null;if(!reply&&!file)return;const bar=el("div","d2-draft");bar.id="d2-draft";bar.append(el("span","",reply?"↪ Respondendo: "+(reply.body||reply.file?.name||"Mídia"):"📎 "+file.name));const cancel=el("button","chip","Cancelar");cancel.type="button";cancel.onclick=e=>{e.preventDefault();e.stopPropagation();reply=null;file=null;draft()};bar.append(cancel);$("#composer").prepend(bar)}
function closeMenu(){menu?.remove();menu=null}
function openMenu(items,x,y){closeMenu();const box=el("div","d2-menu");box.setAttribute("role","menu");items.forEach(([label,fn,disabled=false])=>{const b=el("button","",label);b.type="button";b.disabled=disabled;b.setAttribute("role","menuitem");b.onclick=()=>{closeMenu();fn()};box.append(b)});document.body.append(box);menu=box;box.style.left=Math.max(6,Math.min(x,innerWidth-box.offsetWidth-6))+"px";box.style.top=Math.max(6,Math.min(y,innerHeight-box.offsetHeight-6))+"px";box.querySelector("button")?.focus()}
function closeDialog(){modal?.remove();modal=null}
function dialog(title,content){closeDialog();const backdrop=el("div","d2-overlay");const panel=el("section","d2-dialog");panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.setAttribute("aria-label",title);const head=el("header","d2-dialog-head");head.append(el("strong","",title));const x=el("button","chip","Fechar");x.type="button";x.onclick=closeDialog;head.append(x);panel.append(head,content);backdrop.append(panel);backdrop.addEventListener("click",e=>{if(e.target===backdrop)closeDialog()});document.body.append(backdrop);modal=backdrop;return panel}
function choose(ids){selected=new Set(ids);selectionMode=selected.size>0;refresh();selectionBar()}
function selectionBar(){document.querySelector("#d2-selection")?.remove();if(!selected.size&&!selectionMode)return;const bar=el("div","d2-selection");bar.id="d2-selection";bar.setAttribute("role","toolbar");bar.setAttribute("aria-label","Ações em mensagens selecionadas");bar.append(el("strong","",selected.size?selected.size+" selecionada(s)":"Toque para selecionar"));for(const [text,fn] of [["Encaminhar",()=>forward([...selected])],["Apagar para mim",()=>removeMessages(false)],["Apagar para todos",()=>removeMessages(true)],["Cancelar",()=>choose([])]]){const b=el("button","chip",text);b.type="button";b.disabled=text!=="Cancelar"&&!selected.size||text==="Encaminhar"&&!can("forward")||text==="Apagar para mim"&&!can("deleteMine")||text==="Apagar para todos"&&!can("deleteAll");b.onclick=fn;bar.append(b)}$("#workspace").append(bar)}
function removeMessages(everyone){const key=everyone?"deleteAll":"deleteMine";if(!can(key)){notify("Ação não permitida para o perfil.");return}const c=active(),ids=[...selected];if(!ids.length)return;const content=el("div","d2-body");content.append(el("p","",everyone?"Apagar para todos? O conteúdo será substituído por um aviso.":"Apagar estas mensagens apenas da sua visualização?"));const btn=el("button","d2-primary","Confirmar exclusão");btn.onclick=async()=>{btn.disabled=true;try{await commands.remove(c.id,ids,everyone);selected.clear();selectionMode=false;closeDialog();selectionBar();refresh();notify("Mensagem removida da conversa.")}catch(error){notify("Falha na exclusão: "+error.message);btn.disabled=false}};content.append(btn);dialog(everyone?"Apagar para todos":"Apagar para mim",content)}
async function forward(ids){
 if(!can("forward")){notify("Encaminhamento bloqueado nas permissões.");return}
 const source=active();
 if(!source||!canAccess(source))return;
 let items,recipients;
 try{
  [items,recipients]=await Promise.all([
   operationQuery.getMessages(source.id,ids),
   operationQuery.listRecipients(source.id)
  ]);
 }catch(error){notify("Não foi possível consultar as mensagens: "+error.message);return}
 if(active()?.id!==source.id)return;
 items=items.filter(m=>!m.hidden&&!m.deletedAll);
 if(!items.length){notify("As mensagens selecionadas não estão disponíveis.");return}
 const content=el("div","d2-body"),summary=el("p","",items.length+" mensagem(ns) selecionada(s). Escolha os destinatários.");
 const search=el("input","d2-search");search.type="search";search.placeholder="Buscar por nome ou telefone";search.setAttribute("aria-label","Buscar destinatários");
 const results=el("div","d2-results"),picked=new Set(),footer=el("div","d2-footer"),count=el("span","","0 destinatários");
 const confirm=el("button","d2-primary","Encaminhar");confirm.disabled=true;
 const eligible=()=>recipients.filter(c=>c.id!==source.id&&canAccess(c));
 function render(){
  results.replaceChildren();
  const q=search.value.toLowerCase().replace(/[^a-z0-9À-ÿ]/gi,"");
  let found=0;
  eligible().forEach(c=>{
   const key=(c.name+" "+c.phone).toLowerCase().replace(/[^a-z0-9À-ÿ]/gi,"");
   if(q&&!key.includes(q))return;
   found++;
   const b=el("button","d2-result"+(picked.has(c.id)?" chosen":""));b.type="button";
   b.append(el("strong","",c.name||c.phone),el("small","",c.phone||"Número não informado"));
   const check=el("span","",picked.has(c.id)?"✓":"○");b.prepend(check);
   b.onclick=()=>{picked.has(c.id)?picked.delete(c.id):picked.add(c.id);render()};results.append(b);
  });
  if(!found)results.append(el("p","placeholder","Nenhum destinatário encontrado"));
  count.textContent=picked.size+" destinatário(s)";
  confirm.disabled=!picked.size;
 }
 search.addEventListener("input",render);
 confirm.onclick=async()=>{
  if(active()?.id!==source.id){notify("A conversa foi alterada; selecione novamente.");closeDialog();return}
  confirm.disabled=true;
  try{
   const allowed=await operationQuery.listRecipients(source.id);
   if(active()?.id!==source.id){closeDialog();return}
   const targets=allowed.filter(c=>picked.has(c.id)&&canAccess(c));
   if(targets.length!==picked.size)throw new Error("Destinatários alterados, revise a seleção.");
   const outcome=await commands.forward(source.id,items.map(m=>m.id),targets.map(c=>c.id),{time:stamp()});
   closeDialog();choose([]);refresh();
   notify(outcome.messages+" mensagem(ns) encaminhada(s) para "+outcome.destinations+" destinatário(s).");
  }catch(error){notify("Falha no encaminhamento: "+error.message);confirm.disabled=false}
 };
 footer.append(count,confirm);content.append(summary,search,results,footer);
 dialog("Encaminhar mensagens",content);render();search.focus();
}

let replyJumpTimer=null;
let recentlySentMessageId=null;
async function jumpToOriginal(reference){
 const conversation=active();
 if(!conversation||!reference)return;
 if(reference.conversationId&&reference.conversationId!==conversation.id)return;
 const targetId=reference.messageId||reference.id;
 if(!targetId){notify("A referência não contém uma mensagem válida.");return}
 let original;
 try{original=await operationQuery.getMessage(conversation.id,targetId)}
 catch(error){notify("Falha ao consultar mensagem original: "+error.message);return}
 if(active()?.id!==conversation.id)return;
 if(!original||original.hidden){notify("A mensagem original não está disponível nesta conversa.");return}
 // O filtro de busca pode ter ocultado a referência: restaurar o histórico.
 if(query){
  query="";
  const input=$("#message-search-input");if(input)input.value="";
  await refresh();
 }
 if(active()?.id!==conversation.id)return;
 const area=$("#messages");
 let row=[...area.querySelectorAll("[data-message-id]")].find(node=>node.dataset.messageId===original.id);
 if(!row&&ensureMessageVisible){
  try{await ensureMessageVisible(original.id)}catch(error){notify("Falha ao buscar a mensagem original: "+error.message);return}
  if(active()?.id!==conversation.id)return;
  row=[...area.querySelectorAll("[data-message-id]")].find(node=>node.dataset.messageId===original.id);
 }
 if(!row){notify("Não foi possível localizar a mensagem original.");return}
 if(replyJumpTimer)clearTimeout(replyJumpTimer);
 for(const previous of area.querySelectorAll(".reply-jump-highlight"))previous.classList.remove("reply-jump-highlight");
 row.classList.add("reply-jump-highlight");
 row.focus({preventScroll:true});
 const motion=document.documentElement.dataset.animations==="off"||window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches?"instant":"smooth";
 row.scrollIntoView({behavior:motion==="instant"?"auto":"smooth",block:"center"});
 replyJumpTimer=setTimeout(()=>{row.classList.remove("reply-jump-highlight");replyJumpTimer=null},1900);
}
async function action(kind,id){
 const c=active();if(!c||!canAccess(c))return;
 let m;
 try{m=await operationQuery.getMessage(c.id,id)}
 catch(error){notify("Falha ao consultar mensagem: "+error.message);return}
 if(!m||m.hidden||active()?.id!==c.id||!canAccess(active()))return;
 if(kind==="reply"){
  reply={conversationId:c.id,messageId:m.id,body:m.body,direction:m.direction,file:m.file?{name:m.file.name}:undefined};
  draft();$("#message-input").focus();
 }
 if(kind==="forward")void forward([id]);
 if(kind==="select")choose([...selected,id]);
 if(kind==="deleteMine"){choose([id]);removeMessages(false)}
 if(kind==="deleteAll"){choose([id]);removeMessages(true)}
 if(kind==="copy"){
  try{await navigator.clipboard.writeText(m.body||"");notify("Texto copiado.")}
  catch{notify("Não foi possível copiar.")}
 }
 if(kind==="cycle"||kind==="retry"){
  try{
   const result=kind==="cycle"?await commands.cycleDemoStatus(c.id,id):await commands.retryDemo(c.id,id);
   refresh();notify(kind==="cycle"?"Estado simulado: "+demoDeliveryLabels[result.status]:"Reenvio simulado (sem contato com o provider).");
  }catch(error){notify("Não foi possível simular a ação: "+error.message)}
 }
}
async function context(id,x,y){
 const c=active();if(!c||!canAccess(c))return;
 let m;
 try{m=await operationQuery.getMessage(c.id,id)}
 catch(error){notify("Falha ao consultar mensagem: "+error.message);return}
 if(!m||m.hidden||active()?.id!==c.id||!canAccess(active()))return;
 const options=[
  ["Responder",()=>action("reply",id)],
  ["Copiar texto",()=>action("copy",id),!m.body],
  ["Encaminhar",()=>action("forward",id),!can("forward")],
  ["Selecionar mensagens",()=>action("select",id)],
  ["Apagar para mim",()=>action("deleteMine",id),!can("deleteMine")],
  ["Apagar para todos",()=>action("deleteAll",id),!can("deleteAll")]
 ];
 if(m.direction==="out"&&!m.deletedAll){
  options.push(["Simular próximo estado",()=>action("cycle",id)]);
  if(m.status==="failed")options.push(["Simular reenvio",()=>action("retry",id)]);
 }
 openMenu(options,x,y);
}

export function renderD2(c,container){container.replaceChildren();let n=0,lastDay=null;c.messages.forEach((m,i)=>{if(m.hidden)return;if(query&&!(m.body+" "+(m.file?.name||"")).toLowerCase().includes(query))return;n++;
 const day=messageDay(m);
 if(day!==lastDay){const separator=el("div","date-separator chat-day-separator",formatMessageDay(day));separator.dataset.day=day;container.append(separator);lastDay=day}
 const row=el("div","message-row"+(m.direction==="out"?" mine":"")+(selected.has(m.id)?" d2-picked":""));row.dataset.messageId=m.id;row.dataset.messageDay=day;if(m.id===recentlySentMessageId)row.classList.add("message-just-sent");row.tabIndex=0;const b=el("div","bubble");if(m.file)b.classList.add("has-media");if(m.reply){
 const ref=el("button","reply-reference","↪ "+(m.reply.body||m.reply.file?.name||"Mídia"));
 ref.type="button";
 ref.dataset.replyTarget=m.reply.messageId||"";
 ref.setAttribute("aria-label","Ir para mensagem respondida: "+(m.reply.body||m.reply.file?.name||"Mídia"));
 ref.title="Ir para mensagem original";
 b.append(ref);
}if(m.forwarded)b.append(el("div","d2-forwarded","Encaminhada"));if(m.file){
 const mediaKind=m.file.kind;
 if(mediaKind==="audio"||mediaKind==="video"){
   b.append(createMediaPlayer(m.file,{compact:true,visibilityKey:mediaVisibilityKey(c.id,m.id)}));
 }else if(mediaKind==="image"&&m.file.url){
   const preview=el("button","message-image");preview.type="button";
   preview.setAttribute("aria-label","Ver imagem: "+m.file.name);
   const img=el("img");img.src=m.file.url;img.alt=m.file.name||"Imagem recebida";img.loading="lazy";
   preview.append(img);
   preview.onclick=()=>openMediaViewer({...m.file,kind:"image",caption:m.body||"",conversationId:c.id,id:m.id});
   const frame=el("div","message-image-frame");
   frame.append(preview);
   attachMediaBlur(frame,img,mediaVisibilityKey(c.id,m.id));
   b.append(frame);
 }else{
   const f=el("div","file-card");f.append(el("span","file-type",(m.file.kind||"Arquivo").toUpperCase()),el("span","file-label",m.file.name));
   if(m.file.url){const a=el("a","file-link","Abrir");a.href=m.file.url;a.download=m.file.name;f.append(a)}
   b.append(f);
 }
}if(m.body)b.append(el("span","message-text",m.body));row.append(b,el("span","message-meta",m.time+(m.direction==="out"?" · "+(demoDeliveryLabels[m.status]||"Estado simulado"):"")));const controls=el("div","message-actions");for(const [text,a] of [["Responder","reply"],["Encaminhar","forward"],["Mais","context"]]){const btn=el("button","message-action",text);btn.type="button";btn.dataset.action=a;btn.dataset.msg=m.id;controls.append(btn)}row.append(controls);container.append(row)});if(!n)container.append(el("p","placeholder","Nenhuma mensagem encontrada."));
const searchCount=$("#message-search-count"),clear=$("#message-search-clear");
if(searchCount)searchCount.textContent=query?(n===1?"1 resultado":n+" resultados"):"";
if(clear)clear.hidden=!query;
selectionBar();recentlySentMessageId=null;refreshChatDateIndicator(container);return {searching:Boolean(query)}}
export function hasD2Attachment(){return Boolean(file)}
export function isD2Searching(){return Boolean(query)}
export async function sendD2(c,value,mediaOverride=null){
 const body=value.trim();
 if(!body&&!file&&!mediaOverride)return false;
 if(file&&mediaOverride)throw new Error("Envie ou descarte o anexo antes do áudio");
 const draftReply=reply&&reply.conversationId===c.id?{...reply}:null;
 const draftFile=file;
 const m={id:newId(),conversationId:c.id,direction:"out",body,time:stamp(),createdAt:new Date().toISOString(),status:"sent"};
 if(draftReply){
  const original=await operationQuery.getMessage(c.id,draftReply.messageId);
  if(original&&!original.hidden)m.reply=draftReply;
 }
 if(draftFile||mediaOverride)m.file=mediaOverride||draftFile;
 await commands.send(c.id,m);
 recentlySentMessageId=m.id;
 if(active()?.id===c.id){
  if(file===draftFile)file=null;
  if(reply?.messageId===draftReply?.messageId)reply=null;
  draft();
 }
 return true;
}
export function resetD2Selection(){closeD2EmojiPicker();swipeGesture?.cancel();if(replyJumpTimer){clearTimeout(replyJumpTimer);replyJumpTimer=null}$("#messages")?.querySelectorAll(".reply-jump-highlight").forEach(row=>row.classList.remove("reply-jump-highlight"));reply=null;file=null;query="";selected.clear();selectionMode=false;const search=$("#message-search"),field=$("#message-search-input");if(search)search.hidden=true;if(field)field.value="";draft();closeDialog();closeMenu();selectionBar()}
export function setupD2(getActive,getAll,onChange,messageCommands,attendanceCommands,loadMessage=null,queries){active=getActive;refresh=onChange;commands=messageCommands;operationQuery=queries;conversationActions=attendanceCommands;ensureMessageVisible=loadMessage;emojiPicker=setupEmojiPicker({trigger:$("#emoji-button"),input:$("#message-input")});const area=$("#messages");
 $("#voice-start").addEventListener("click",closeD2EmojiPicker);
 $("#attach-button").addEventListener("click",closeD2EmojiPicker);
 $("#composer").addEventListener("submit",closeD2EmojiPicker);
 swipeGesture=setupSwipeReply({
  area,onReply:id=>action("reply",id),
  isSelectionActive:()=>selectionMode||selected.size>0,
  onGestureStart:()=>{clearTimeout(touchTimer);touchStart=null;closeMenu()}
 });
 area.addEventListener("click",async e=>{
  const quote=e.target.closest("[data-reply-target]");
  if(!quote)return;
  e.preventDefault();e.stopPropagation();
  const conversation=active(),messageRow=quote.closest("[data-message-id]");
  if(!conversation||!messageRow)return;
  try{
   const message=await operationQuery.getMessage(conversation.id,messageRow.dataset.messageId);
   if(active()?.id===conversation.id&&message?.reply)await jumpToOriginal(message.reply);
  }catch(error){notify("Falha ao consultar resposta citada: "+error.message)}
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

 async function updateConversation(kind){
 const conversation=active();
 if(!canAccess(conversation)){notify("Acesso à conversa indisponível.");return}
 try{
  if(kind==="unread"){
   await conversationActions.markUnread(conversation.id);
   if(innerWidth<=760)$("#app").classList.remove("chat-open");
  }else{
   await conversationActions.setAttendanceStatus(conversation.id,kind==="close"?"Finalizado":"Em atendimento");
  }
  refresh();
 }catch(error){notify("Falha na atualização do atendimento: "+error.message)}
}
$("#chat-menu").onclick=e=>{
 const r=e.currentTarget.getBoundingClientRect();
 openMenu([
  ["Selecionar mensagens",()=>{selectionMode=true;selected.clear();selectionBar()}],
  ["Marcar como não lida",()=>updateConversation("unread")],
  ["Encerrar atendimento",()=>updateConversation("close")],
  ["Reabrir atendimento",()=>updateConversation("open")]
 ],r.left,r.bottom);
};
 document.addEventListener("pointerdown",e=>{if(menu&&!menu.contains(e.target)&&!e.target.closest("[data-action],#emoji-button,#chat-menu"))closeMenu()});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeMenu();closeDialog();if(selectionMode||selected.size)choose([])}});
}
