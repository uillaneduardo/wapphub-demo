/** Geometria independente de DOM usada pelo controle de navegação do chat. */
export const JUMP_THRESHOLD = 72;
export const FOLLOW_THRESHOLD = 56;
export function distanceFromBottom({scrollHeight=0,scrollTop=0,clientHeight=0}) {
 return Math.max(0,scrollHeight-scrollTop-clientHeight);
}
export function shouldShowJump(metrics,threshold=JUMP_THRESHOLD) {
 return metrics.clientHeight>0 && distanceFromBottom(metrics)>threshold;
}
export function renderScrollMode({conversationChanged=false,nearBottom=false,searching=false}={}) {
 if(searching)return "search";
 return conversationChanged||nearBottom?"latest":"preserve";
}
