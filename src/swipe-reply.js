import {swipeIntent,swipeOffset,shouldReplyFromSwipe,SWIPE_REPLY_PX} from "./swipe-reply.mjs";

/**
 * Adaptador de gesto para mensagens renderizadas. Não altera dados, APIs nem
 * permissões: onReply entrega o ID à ação Responder já existente.
 */
export function setupSwipeReply({area,onReply,isSelectionActive,onGestureStart}){
 let gesture=null,suppressClickUntil=0;
 const excluded="button,input,textarea,select,a,video,audio,[contenteditable],[data-action],[data-reply-target],.media-player,.file-card";
 function clear(){
  if(!gesture)return;
  const {row,pointerId,captured}=gesture;
  row.classList.remove("swipe-reply-active","swipe-reply-ready");
  row.style.removeProperty("--swipe-reply-translate");
  row.querySelector(".swipe-reply-cue")?.remove();
  document.body.classList.remove("is-swipe-reply-dragging");
  if(captured&&area.hasPointerCapture?.(pointerId)){
   try{area.releasePointerCapture(pointerId)}catch{}
  }
  gesture=null;
 }
 function cueFor(row){
  const indicator=document.createElement("span");indicator.className="swipe-reply-cue";
  indicator.setAttribute("aria-hidden","true");
  const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
  const use=document.createElementNS(svg.namespaceURI,"use");
  use.setAttribute("href","#i-reply-swipe");svg.append(use);indicator.append(svg);
  row.append(indicator);
 }
 function onDown(e){
  if(gesture||isSelectionActive()||e.isPrimary===false||(e.pointerType==="mouse"&&e.button!==0))return;
  if(e.target.closest(excluded))return;
  const row=e.target.closest("[data-message-id]");
  if(!row||!area.contains(row)||!e.target.closest(".bubble"))return;
  if(e.pointerType==="mouse"&&e.cancelable)e.preventDefault();
  gesture={pointerId:e.pointerId,downX:e.clientX,downY:e.clientY,
   row,id:row.dataset.messageId,direction:row.classList.contains("mine")?"out":"in",
   started:false,captured:false};
 }
 function onMove(e){
  if(!gesture||e.pointerId!==gesture.pointerId)return;
  const g=gesture,dx=e.clientX-g.downX,dy=e.clientY-g.downY;
  const intent=swipeIntent(dx,dy,g.direction);
  if(!g.started){
   if(intent==="vertical"||intent==="opposite"){clear();return}
   if(intent!=="horizontal")return;
   g.started=true;g.row.classList.add("swipe-reply-active");
   cueFor(g.row);
   document.body.classList.add("is-swipe-reply-dragging");
   onGestureStart?.();
   try{area.setPointerCapture(e.pointerId);g.captured=true}catch{}
  }
  if(e.cancelable)e.preventDefault();
  const offset=swipeOffset(dx,g.direction);
  g.row.style.setProperty("--swipe-reply-translate",offset+"px");
  g.row.classList.toggle("swipe-reply-ready",Math.abs(dx)>=SWIPE_REPLY_PX&&intent==="horizontal");
 }
 function onUp(e){
  if(!gesture||e.pointerId!==gesture.pointerId)return;
  const g=gesture,dx=e.clientX-g.downX,dy=e.clientY-g.downY;
  const triggered=g.started&&shouldReplyFromSwipe(dx,dy,g.direction);
  if(g.started)suppressClickUntil=performance.now()+380;
  const id=g.id;
  clear();
  if(triggered&&!isSelectionActive())onReply(id);
 }
 area.addEventListener("pointerdown",onDown);
 area.addEventListener("pointermove",onMove);
 area.addEventListener("pointerup",onUp);
 area.addEventListener("pointercancel",e=>{if(gesture?.pointerId===e.pointerId)clear()});
 area.addEventListener("lostpointercapture",e=>{if(gesture?.pointerId===e.pointerId)clear()});
 area.addEventListener("scroll",()=>{if(gesture)clear()},{passive:true});
 // Evita selecionar mensagens ou abrir controles após arrastar.
 area.addEventListener("click",e=>{
  if(performance.now()>suppressClickUntil)return;
  e.preventDefault();e.stopImmediatePropagation();
 },true);
 return {cancel:clear};
}
