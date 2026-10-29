import {distanceFromBottom,shouldShowJump,FOLLOW_THRESHOLD,renderScrollMode} from "./chat-scroll-policy.mjs";

/**
 * Controlador da rolagem do histórico.
 * Apenas esta camada conhece o viewport, a posição e o botão; mensagens continuam
 * sendo renderizadas pelo D2. Nenhuma preferência ou estado é persistido.
 */
export function createChatScrollController({viewport,composer,workspace,button}) {
 if(!viewport||!composer||!workspace||!button)throw new TypeError("Elementos do chat obrigatórios");
 let conversationId=null,pinned=true,jumping=false,frame=0;
 const distance=()=>distanceFromBottom(viewport);
 const atBottom=()=>distance()<=FOLLOW_THRESHOLD;
 const visible=()=>Boolean(conversationId)&&shouldShowJump(viewport);
 const sync=()=>{button.hidden=!visible()};
 const layout=()=>{workspace.style.setProperty("--chat-jump-composer-height",composer.getBoundingClientRect().height+"px")};
 const snap=()=>{if(viewport.clientHeight>0)viewport.scrollTop=viewport.scrollHeight};
 const reducedMotion=()=>document.documentElement.dataset.animations==="off"||window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
 const onScroll=()=>{
  if(jumping && !atBottom()){sync();return}
  jumping=false;pinned=atBottom();sync();
 };
 const onGeometryChange=()=>{
  layout();
  if(pinned&&conversationId)snap();
  sync();
 };
 const onUserGesture=()=>{jumping=false};
 const jump=()=>{
  if(!conversationId)return;
  jumping=true;pinned=true;
  viewport.scrollTo({top:viewport.scrollHeight,behavior:reducedMotion()?"auto":"smooth"});
  sync();
 };
 viewport.addEventListener("scroll",onScroll,{passive:true});
 viewport.addEventListener("wheel",onUserGesture,{passive:true});
 viewport.addEventListener("touchstart",onUserGesture,{passive:true});
 viewport.addEventListener("load",onGeometryChange,true);
 viewport.addEventListener("loadedmetadata",onGeometryChange,true);
 button.addEventListener("click",jump);
 const observer=typeof ResizeObserver==="function"?new ResizeObserver(onGeometryChange):null;
 if(observer){observer.observe(viewport);observer.observe(composer)}
 else window.addEventListener("resize",onGeometryChange);
 layout();sync();
 return Object.freeze({
  /** Chamar antes de substituir os elementos do histórico. */
  capture(nextId){
   const changed=conversationId!==nextId;
   const snapshot={id:nextId,top:viewport.scrollTop,mode:renderScrollMode({conversationChanged:changed,nearBottom:pinned||atBottom()})};
   if(changed){conversationId=nextId;pinned=Boolean(nextId);jumping=false}
   return snapshot;
  },
  /** Chamar após o DOM ser reconstruído; o RAF cobre o mobile inicialmente oculto. */
  commit(snapshot,{searching=false}={}){
   if(snapshot.id!==conversationId)return;
   const mode=renderScrollMode({conversationChanged:snapshot.mode==="latest",nearBottom:false,searching});
   if(!conversationId){pinned=false;button.hidden=true}
   else if(mode==="search"){pinned=false;jumping=false;viewport.scrollTop=0}
   else if(mode==="latest"){pinned=true;snap()}
   else{pinned=false;viewport.scrollTop=snapshot.top}
   if(observer){
    observer.disconnect();observer.observe(viewport);observer.observe(composer);
    viewport.querySelectorAll(".message-row").forEach(row=>observer.observe(row));
   }
   layout();sync();
   cancelAnimationFrame(frame);
   frame=requestAnimationFrame(()=>{
    if(snapshot.id!==conversationId)return;
    if(pinned&&!searching)snap();
    sync();
   });
  },
  refresh:onGeometryChange,
  destroy(){
   cancelAnimationFrame(frame);observer?.disconnect();
   if(!observer)window.removeEventListener("resize",onGeometryChange);
   viewport.removeEventListener("scroll",onScroll);
   viewport.removeEventListener("wheel",onUserGesture);
   viewport.removeEventListener("touchstart",onUserGesture);
   viewport.removeEventListener("load",onGeometryChange,true);
   viewport.removeEventListener("loadedmetadata",onGeometryChange,true);
   button.removeEventListener("click",jump);
  }
 });
}
