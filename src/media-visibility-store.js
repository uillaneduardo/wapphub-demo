import {appearance} from "./appearance.js?v=motion-1";
/**
 * Adaptador local das preferências por mídia: estado de apresentação, não
 * altera anexos nem o Core. A UI acessa apenas estes métodos.
 */
const KEY="wapphub-demo-media-blur-v1";
const read=()=>{try{const value=JSON.parse(localStorage.getItem(KEY)||"{}");return value&&typeof value==="object"&&!Array.isArray(value)?value:{}}catch{return {}}};
let overrides=read();
export function mediaVisibilityKey(conversationId,messageId){
 return encodeURIComponent(String(conversationId||""))+":"+encodeURIComponent(String(messageId||""));
}
export function isMediaBlurred(key){
 if(!key)return false;
 if(Object.hasOwn(overrides,key)&&typeof overrides[key]==="boolean")return overrides[key];
 return appearance.blurMedia;
}
export function setMediaBlurred(key,value){
 if(!key)return;
 overrides[key]=Boolean(value);
 try{localStorage.setItem(KEY,JSON.stringify(overrides))}catch(e){console.warn("Preferência da mídia não pôde ser salva",e)}
 window.dispatchEvent(new CustomEvent("wapphub-media-blur-changed",{detail:{key}}));
}
export function toggleMediaBlurred(key){setMediaBlurred(key,!isMediaBlurred(key))}
