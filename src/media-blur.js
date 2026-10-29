import {isMediaBlurred,toggleMediaBlurred} from "./media-visibility-store.js?v=motion-1";

function icon(name){
 const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
 const use=document.createElementNS(svg.namespaceURI,"use");
 use.setAttribute("href","#i-"+name);
 svg.setAttribute("aria-hidden","true");svg.append(use);return svg;
}
function updateSurface(surface){
 const key=surface.dataset.mediaVisibilityKey;
 if(!key)return;
 const blurred=isMediaBlurred(key);
 surface.classList.toggle("is-media-blurred",blurred);
 const button=surface.querySelector(":scope > .media-blur-toggle");
 if(!button)return;
 button.setAttribute("aria-label",blurred?"Revelar prévia da mídia":"Desfocar prévia da mídia");
 button.setAttribute("aria-pressed",String(!blurred));
 button.title=blurred?"Mostrar mídia":"Ocultar mídia";
 button.replaceChildren(icon(blurred?"eye":"eye-off"));
}
function syncAll(){
 document.querySelectorAll(".media-blur-surface[data-media-visibility-key]").forEach(updateSurface);
}
window.addEventListener("wapphub-media-blur-changed",syncAll);
window.addEventListener("wapphub-appearance-changed",syncAll);

/**
 * Controle visual reutilizável. O elemento surface contém a área da prévia;
 * content é SOMENTE o bitmap/video, nunca legendas nem controles.
 */
export function attachMediaBlur(surface,content,key,{onToggle}={}){
 if(!key)return;
 surface.classList.add("media-blur-surface");
 surface.dataset.mediaVisibilityKey=key;
 content.classList.add("media-blur-content");
 const button=document.createElement("button");
 button.type="button";button.className="media-blur-toggle";
 button.onclick=e=>{
  e.preventDefault();e.stopPropagation();
  try{
   toggleMediaBlurred(key);
   onToggle?.(isMediaBlurred(key));
  }catch{
   const region=document.getElementById("toast-region");
   if(region){
    const toast=document.createElement("div");
    toast.className="toast";toast.setAttribute("role","alert");
    toast.textContent="Não foi possível salvar a preferência desta mídia.";
    region.append(toast);setTimeout(()=>toast.remove(),3800);
   }else{
    button.title="Falha ao salvar a preferência";
    button.setAttribute("aria-label","Não foi possível salvar a preferência desta mídia");
   }
  }
 };
 surface.append(button);
 updateSurface(surface);
 return button;
}
