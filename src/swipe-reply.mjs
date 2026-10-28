/**
 * Regras de gesto independentes do DOM, do Core e da persistência.
 * Resposta à direita para recebidas e à esquerda para enviadas.
 */
export const SWIPE_START_PX=8;
export const SWIPE_REPLY_TOUCH_PX=38;
export const SWIPE_REPLY_PX=52;
export const SWIPE_MAX_PX=120;
const AXIS_PRIORITY=1.15;
export function swipeDirection(direction){return direction==="out"?-1:1}
export function swipeIntent(dx,dy,direction){
 const along=dx*swipeDirection(direction);
 if(Math.abs(dy)>SWIPE_START_PX&&Math.abs(dy)>Math.abs(dx)*1.1)return "vertical";
 if(along<=-SWIPE_START_PX)return "opposite";
 if(along>=SWIPE_START_PX&&along>Math.abs(dy)*AXIS_PRIORITY)return "horizontal";
 return "pending";
}
export function swipeThreshold(pointerType="mouse"){
 return pointerType==="touch"?SWIPE_REPLY_TOUCH_PX:SWIPE_REPLY_PX;
}
export function swipeOffset(dx,direction){
 return swipeDirection(direction)*Math.min(SWIPE_MAX_PX,Math.max(0,dx*swipeDirection(direction)));
}
export function shouldReplyFromSwipe(dx,dy,direction,pointerType="mouse"){
 return swipeIntent(dx,dy,direction)==="horizontal"&&dx*swipeDirection(direction)>=swipeThreshold(pointerType);
}
