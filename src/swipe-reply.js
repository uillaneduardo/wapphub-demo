import {swipeIntent,swipeOffset,swipeThreshold,swipeDirection,SWIPE_START_PX} from "./swipe-reply.mjs?v=swipe-2";

/**
 * Reconhecedor de gesto independente do armazenamento e dos providers.
 * No Android, Touch Events mantêm o controle horizontal após o browser
 * iniciar a análise de rolagem; mouse/caneta usam Pointer Events.
 */
export function setupSwipeReply({area,onReply,isSelectionActive,onGestureStart}){
 let gesture=null,suppressClickUntil=0,suppressMessageId=null;
 const excluded="input[type=range],textarea,select,a,video,audio,[contenteditable],[data-action],[data-reply-target],.message-actions";
 const touchSupported="ontouchstart" in window;
 function clear(){
  if(!gesture)return;
  const g=gesture;gesture=null;
  g.row.classList.remove("swipe-reply-active","swipe-reply-ready");
  g.row.style.removeProperty("--swipe-reply-translate");
  g.row.querySelector(".swipe-reply-cue")?.remove();
  document.body.classList.remove("is-swipe-reply-dragging");
  if(g.captured&&area.hasPointerCapture?.(g.pointerId)){
   try{area.releasePointerCapture(g.pointerId)}catch{}
  }
 }
 function cueFor(row){
  const indicator=document.createElement("span");
  indicator.className="swipe-reply-cue";
  indicator.setAttribute("aria-hidden","true");
  const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
  const use=document.createElementNS(svg.namespaceURI,"use");
  use.setAttribute("href","#i-reply-swipe");svg.append(use);
  indicator.append(svg);row.append(indicator);
 }
 function start(e,kind,id){
  if(gesture||isSelectionActive())return;
  const target=e.target;
  if(!(target instanceof Element)||target.closest(excluded))return;
  const row=target.closest("[data-message-id]");
  if(!row||!area.contains(row))return;
  gesture={
   kind,pointerId:id,row,id:row.dataset.messageId,
   direction:row.classList.contains("mine")?"out":"in",
   downX:e.clientX,downY:e.clientY,started:false,armed:false,captured:false
  };
 }
 function move(x,y,event){
  if(!gesture)return;
  const g=gesture,dx=x-g.downX,dy=y-g.downY;
  const intent=swipeIntent(dx,dy,g.direction);
  if(!g.started){
   if(intent==="vertical"||intent==="opposite"){clear();return}
   if(intent!=="horizontal")return;
   g.started=true;g.row.classList.add("swipe-reply-active");cueFor(g.row);
   document.body.classList.add("is-swipe-reply-dragging");
   onGestureStart?.();
   if(g.kind==="pointer"&&g.pointerId!==null){
    try{area.setPointerCapture(g.pointerId);g.captured=true}catch{}
   }
  }
  if(event?.cancelable)event.preventDefault();
  const offset=swipeOffset(dx,g.direction);
  g.row.style.setProperty("--swipe-reply-translate",offset+"px");
  if(dx*swipeDirection(g.direction)>=swipeThreshold(g.kind==="touch"?"touch":"mouse"))g.armed=true;
  g.row.classList.toggle("swipe-reply-ready",g.armed);
 }
 function end(x,y){
  if(!gesture)return;
  const g=gesture;
  const dx=x-g.downX,dy=y-g.downY;
  const triggered=g.started&&g.armed&&
   dx*swipeDirection(g.direction)>=SWIPE_START_PX&&
   swipeIntent(dx,dy,g.direction)==="horizontal";
  if(g.started){suppressClickUntil=performance.now()+420;suppressMessageId=g.id}
  const id=g.id;clear();
  if(triggered&&!isSelectionActive())onReply(id);
 }
 function findTouch(list,id){for(const touch of list)if(touch.identifier===id)return touch;return null}
 // Touch Events: native vertical scroll is preserved until axis lock.
 // Horizontal drags use preventDefault only after a clear horizontal intent.
 if(touchSupported){
  area.addEventListener("touchstart",e=>{
   if(e.touches.length!==1)return;
   const t=e.changedTouches[0];start({clientX:t.clientX,clientY:t.clientY,target:e.target},"touch",t.identifier);
  },{passive:true});
  area.addEventListener("touchmove",e=>{
   if(gesture?.kind!=="touch")return;
   if(e.touches.length!==1){clear();return}
   const t=findTouch(e.touches,gesture.pointerId);
   if(t)move(t.clientX,t.clientY,e);
  },{passive:false});
  area.addEventListener("touchend",e=>{
   if(gesture?.kind!=="touch")return;
   const t=findTouch(e.changedTouches,gesture.pointerId);
   if(t)end(t.clientX,t.clientY);
  },{passive:true});
  area.addEventListener("touchcancel",()=>{if(gesture?.kind==="touch")clear()},{passive:true});
 }
 // Mouse and stylus: pointer capture keeps the drag active over empty space.
 area.addEventListener("pointerdown",e=>{
  if(e.pointerType==="touch"&&touchSupported)return;
  if(e.isPrimary===false||(e.pointerType==="mouse"&&e.button!==0))return;
  start(e,"pointer",e.pointerId);
  if(gesture&&e.pointerType==="mouse"&&e.cancelable&&!e.target.closest("button,input,a"))e.preventDefault();
 });
 area.addEventListener("pointermove",e=>{
  if(gesture?.kind!=="pointer"||e.pointerId!==gesture.pointerId)return;
  move(e.clientX,e.clientY,e);
 });
 area.addEventListener("pointerup",e=>{
  if(gesture?.kind==="pointer"&&e.pointerId===gesture.pointerId)end(e.clientX,e.clientY);
 });
 area.addEventListener("pointercancel",e=>{
  if(gesture?.kind==="pointer"&&e.pointerId===gesture.pointerId)clear();
 });
 area.addEventListener("lostpointercapture",e=>{
  if(gesture?.kind==="pointer"&&e.pointerId===gesture.pointerId)clear();
 });
 area.addEventListener("scroll",()=>{if(gesture&&!gesture.started)clear()},{passive:true});
 // Touch devices synthesize a click after release; do not select the dragged bubble.
 area.addEventListener("click",e=>{
  if(performance.now()>suppressClickUntil)return;
  const row=e.target.closest("[data-message-id]");
  if(row?.dataset.messageId!==suppressMessageId)return;
  e.preventDefault();e.stopImmediatePropagation();
 },true);
 return {cancel:clear};
}
