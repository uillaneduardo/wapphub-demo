import {resolveMediaDuration} from "./audio-utils.mjs";
import {attachMediaBlur} from "./media-blur.js?v=motion-1";
import {mediaVisibilityKey,setMediaBlurred} from "./media-visibility-store.js?v=motion-1";
/** Player de apresentação. Trabalha com objetos {kind,url,poster,name}, sem armazenamento/API. */
const el=(tag,cls="",text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const icon=(name)=>{const s=document.createElementNS("http://www.w3.org/2000/svg","svg"),u=document.createElementNS(s.namespaceURI,"use");u.setAttribute("href","#i-"+name);s.append(u);s.setAttribute("aria-hidden","true");return s};
const clock=seconds=>{
 if(!Number.isFinite(seconds)||seconds<0)return "0:00";
 const total=Math.floor(seconds);
 return Math.floor(total/60)+":"+String(total%60).padStart(2,"0");
};
export function createMediaPlayer(file,{compact=false,visibilityKey=null}={}){
 const video=file.kind==="video";
 const wrap=el("div","media-player "+(video?"media-player-video":"media-player-audio")+(compact?" is-compact":""));
 const media=el(video?"video":"audio","media-element");media.preload="metadata";
 if(video){media.playsInline=true;media.setAttribute("playsinline","");if(file.poster)media.poster=file.poster}
 media.src=file.url;
 media.setAttribute("aria-label",file.name|| (video?"Vídeo":"Áudio"));
 if(video){const stage=el("div","media-video-stage");stage.append(media);wrap.append(stage);if(visibilityKey)attachMediaBlur(stage,media,visibilityKey,{onToggle:blurred=>{if(blurred&&!media.paused)media.pause()}})}

 const controls=el("div","media-controls");
 const play=el("button","media-play");play.type="button";play.setAttribute("aria-label","Reproduzir "+(video?"vídeo":"áudio"));play.append(icon("play"));
 const timeline=el("input","media-progress");timeline.type="range";timeline.min="0";timeline.max="1000";timeline.step="1";timeline.value="0";timeline.setAttribute("aria-label","Posição de reprodução");
 const elapsed=el("span","media-time","0:00");
 const end=el("span","media-duration","0:00");
 const sep=el("span","media-time-separator","/");
 const speed=el("button","media-speed","1×");speed.type="button";speed.title="Velocidade de reprodução";speed.setAttribute("aria-label","Velocidade: 1 vez");
 controls.append(play,timeline,elapsed,sep,end,speed);wrap.append(controls);
 const error=el("p","media-error");error.hidden=true;error.setAttribute("role","alert");wrap.append(error);
 const speeds=[1,1.5,2];
 let frame=null, dragging=false, pendingSeek=null;
 const duration=()=>resolveMediaDuration(media,Number(file.durationSeconds));
 const refresh=()=>{
  const length=duration();
  const position=Number.isFinite(media.currentTime)?Math.max(0,media.currentTime):0;
  elapsed.textContent=clock(position);
  end.textContent=length>0?clock(length):"--:--";
  if(!dragging){
    timeline.value=length?String(Math.min(1000,Math.max(0,Math.round(position/length*1000)))):"0";
  }
  timeline.disabled=!length;
  timeline.style.setProperty("--media-played",Number(timeline.value)/10+"%");
  play.replaceChildren(icon(media.paused?"play":"pause"));
  play.setAttribute("aria-label",(media.paused?"Reproduzir ":"Pausar ")+(video?"vídeo":"áudio"));
 };
 const stopFrames=()=>{if(frame!==null)cancelAnimationFrame(frame);frame=null};
 const tick=()=>{
   refresh();
   if(!media.paused&&!media.ended)frame=requestAnimationFrame(tick);
   else frame=null;
 };
 const update=()=>{
   refresh();
   if(!media.paused&&!media.ended&&frame===null)frame=requestAnimationFrame(tick);
   else if(media.paused||media.ended)stopFrames();
 };
 function seekTo(ratio){
   const length=duration();
   if(!length)return;
   const position=Math.max(0,Math.min(length,ratio*length));
   pendingSeek=position;
   try{media.currentTime=position} catch { /* ainda sem metadados */ }
   refresh();
 }
 play.onclick=async()=>{
   if(media.paused){
     try{
       await media.play();
       error.hidden=true;
     }catch{
       error.hidden=false;
       error.textContent="Não foi possível reproduzir este arquivo.";
     }
   } else media.pause();
   update();
 };
 timeline.addEventListener("input",()=>{
   dragging=true;
   timeline.style.setProperty("--media-played",Number(timeline.value)/10+"%");
   const length=duration();
   elapsed.textContent=length?clock(length*Number(timeline.value)/1000):"0:00";
   seekTo(Number(timeline.value)/1000);
 });
 const finishDrag=()=>{dragging=false;refresh()};
 timeline.addEventListener("change",finishDrag);
 timeline.addEventListener("pointerup",finishDrag);
 timeline.addEventListener("pointercancel",finishDrag);
 timeline.addEventListener("blur",finishDrag);
 speed.onclick=()=>{
   const next=speeds[(speeds.indexOf(media.playbackRate)+1)%speeds.length];
   media.playbackRate=next;speed.textContent=next+"×";
   speed.setAttribute("aria-label","Velocidade: "+String(next).replace(".",",")+" vezes");
 };
 for(const event of ["loadedmetadata","durationchange","timeupdate","ended","pause","play","seeked","seeking"])media.addEventListener(event,update);
 media.addEventListener("loadedmetadata",()=>{
   if(pendingSeek!==null){const seek=pendingSeek;pendingSeek=null;try{media.currentTime=seek}catch{}}
 });
 media.addEventListener("play",()=>{
   if(video&&visibilityKey)setMediaBlurred(visibilityKey,false);
   for(const other of document.querySelectorAll(".media-element")) {
     if(other!==media&&!other.paused)other.pause();
   }
 });
 media.addEventListener("error",()=>{error.textContent="Mídia indisponível. Verifique a conexão e tente novamente.";error.hidden=false;play.disabled=true});
 if(video)media.addEventListener("click",()=>play.click());
 update();
 return wrap;
}
export function openMediaViewer(item){
 const previous=document.activeElement;
 const overlay=el("div","media-lightbox");
 const panel=el("section","media-lightbox-panel");panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");panel.setAttribute("aria-label",item.name||"Visualizar mídia");
 const head=el("header","media-lightbox-head");const name=el("strong","",item.name||"Mídia");
 const close=el("button","icon-button");close.type="button";close.setAttribute("aria-label","Fechar visualização");close.append(icon("close"));head.append(name,close);panel.append(head);
 const body=el("div","media-lightbox-body");
 if(item.kind==="image"){const img=el("img","media-viewer-image");img.src=item.url;img.alt=item.caption||item.name||"Imagem";body.append(img)}
 else if(item.kind==="audio"||item.kind==="video")body.append(createMediaPlayer(item,{visibilityKey:item.kind==="video"?mediaVisibilityKey(item.conversationId,item.id):null}));
 else {const a=el("a","settings-action","Abrir arquivo");a.href=item.url;a.target="_blank";a.rel="noopener noreferrer";body.append(a)}
 if(item.caption){body.append(el("p","media-viewer-caption",item.caption))}
 panel.append(body);overlay.append(panel);document.body.append(overlay);
 const dismiss=()=>{panel.querySelectorAll("audio,video").forEach(m=>m.pause());overlay.remove();previous?.focus?.()};
 close.onclick=dismiss;overlay.onclick=e=>{if(e.target===overlay)dismiss()};
 overlay.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();dismiss()}});
 close.focus();
}
