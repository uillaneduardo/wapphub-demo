/** Regras puras da preferência de desfoque, sem DOM/storage/provider. */
export function mediaVisibilityKey(conversationId,messageId){
 return encodeURIComponent(String(conversationId||""))+":"+encodeURIComponent(String(messageId||""));
}
export function resolveMediaBlur(key,overrides,defaultBlur){
 if(!key)return false;
 const value=overrides?.[key];
 return typeof value==="boolean"?value:Boolean(defaultBlur);
}
