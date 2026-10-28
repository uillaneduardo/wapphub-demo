/**
 * Regras puras do gesto de resposta, independentes da interface e da API.
 * "in" -> arrasta à direita; "out" -> arrasta à esquerda.
 */
export const SWIPE_START_PX=12;
export const SWIPE_REPLY_PX=62;
export const SWIPE_MAX_PX=86;
const AXIS_PRIORITY=1.2;
export function swipeDirection(direction){return direction==="out"?-1:1}
export function swipeIntent(dx,dy,direction){
 const along=dx*swipeDirection(direction);
 if(Math.abs(dy)>SWIPE_START_PX&&Math.abs(dy)>Math.abs(dx)*1.1)return "vertical";
 if(along<=-SWIPE_START_PX)return "opposite";
 if(along>=SWIPE_START_PX&&along>Math.abs(dy)*AXIS_PRIORITY)return "horizontal";
 return "pending";
}
export function swipeOffset(dx,direction){
 return swipeDirection(direction)*Math.min(SWIPE_MAX_PX,Math.max(0,dx*swipeDirection(direction)));
}
export function shouldReplyFromSwipe(dx,dy,direction){
 return swipeIntent(dx,dy,direction)==="horizontal"&&dx*swipeDirection(direction)>=SWIPE_REPLY_PX;
}
