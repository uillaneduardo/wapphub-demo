/**
 * Contexto cronológico do chat. Somente apresentação: não modifica timestamps.
 * Datas sem metadados pertencem ao legado da demo e recebem fallback explícito.
 */
const dayKey=date=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");
const localDay=(offset=0)=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+offset);return d};
const dateOnly=value=>{
 if(typeof value!=="string")return null;
 const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
 return match?new Date(Number(match[1]),Number(match[2])-1,Number(match[3]),12):null;
};
export function messageDay(message){
 const raw=message.createdAt??message.timestamp??message.sentAt??message.date;
 if(raw instanceof Date)return Number.isNaN(raw.getTime())?null:dayKey(raw);
 if(typeof raw==="number"){const d=new Date(raw<1e11?raw*1000:raw);return Number.isNaN(d.getTime())?null:dayKey(d)}
 if(typeof raw==="string"){
  const date=dateOnly(raw);
  if(date)return dayKey(date);
  const parsed=new Date(raw);
  if(!Number.isNaN(parsed.getTime()))return dayKey(parsed);
 }
 // Compatibilidade com mocks antigos que só registram HH:mm.
 return dayKey(localDay(Number.isInteger(message.demoDayOffset)?message.demoDayOffset:0));
}
export function formatMessageDay(key){
 const date=dateOnly(key);
 if(!date)return "";
 const today=localDay(),yesterday=localDay(-1);
 if(key===dayKey(today))return "Hoje";
 if(key===dayKey(yesterday))return "Ontem";
 return new Intl.DateTimeFormat("pt-BR",{day:"numeric",month:"long",...(date.getFullYear()!==today.getFullYear()?{year:"numeric"}:{})}).format(date);
}
let stylesheetAdded=false;
function ensureStyles(){
 if(stylesheetAdded)return;
 stylesheetAdded=true;
 const link=document.createElement("link");link.rel="stylesheet";
 link.href=new URL("./chat-dates.css?v=route-scope-1",import.meta.url).href;
 document.head.append(link);
}
let activeViewport=null,overlay=null,routeVisible=false,resizeListenerAttached=false;
/** A data só pertence à rota de uma conversa aberta, nunca às outras telas. */
export function setChatDateIndicatorVisible(visible){
 routeVisible=visible===true;
 if(!routeVisible){
  if(overlay)overlay.hidden=true;
  return;
 }
 if(activeViewport&&overlay)requestAnimationFrame(updateFloating);
}
function updateFloating(){
 if(!overlay)return;
 const showingOtherModule=document.body.classList.contains("module-active");
 const hiddenOnMobile=window.matchMedia?.("(max-width: 760px)")?.matches &&
   !document.getElementById("app")?.classList.contains("chat-open");
 if(!routeVisible||!activeViewport||!activeViewport.isConnected||showingOtherModule||hiddenOnMobile){
  overlay.hidden=true;return;
 }
 const rows=[...activeViewport.querySelectorAll(".message-row[data-message-day]")];
 if(!rows.length){overlay.hidden=true;return}
 const bounds=activeViewport.getBoundingClientRect();
 // A primeira mensagem visível define o dia, inclusive em trechos com várias datas.
 const visible=rows.find(row=>row.getBoundingClientRect().bottom>bounds.top+8)??rows.at(-1);
 const label=formatMessageDay(visible.dataset.messageDay);
 overlay.textContent=label;
 overlay.hidden=!label||bounds.width===0||bounds.height===0;
 overlay.style.top=(bounds.top+12)+"px";
 overlay.style.left=(bounds.left+bounds.width/2)+"px";
}
export function refreshChatDateIndicator(viewport){
 ensureStyles();
 if(activeViewport!==viewport){
  if(activeViewport)activeViewport.removeEventListener("scroll",updateFloating);
  activeViewport=viewport;
  viewport.addEventListener("scroll",updateFloating,{passive:true});
 }
 if(!resizeListenerAttached){window.addEventListener("resize",updateFloating,{passive:true});resizeListenerAttached=true}
 if(!overlay){
  overlay=document.createElement("div");
  overlay.className="chat-floating-date";
  overlay.setAttribute("role","status");
  overlay.setAttribute("aria-live","off");
  overlay.hidden=true;
  document.body.append(overlay);
 }
 requestAnimationFrame(updateFloating);
}
