import {mediaVisibilityKey,resolveMediaBlur} from "./media-preferences.mjs";
import {appearance} from "./appearance.js?v=motion-1";
import {mockStorage} from "./data/adapters/mock/storage.mjs";
/**
 * Adaptador local das preferências por mídia: estado de apresentação, não
 * altera anexos nem o Core. A UI acessa apenas estes métodos.
 */
const KEY="wapphub-demo-media-blur-v1";
const read=()=>{const value=mockStorage.read(KEY,{});return value&&typeof value==="object"&&!Array.isArray(value)?value:{}};
let overrides=read();
export {mediaVisibilityKey};
export function isMediaBlurred(key){
 return resolveMediaBlur(key,overrides,appearance.blurMedia);
}
export function setMediaBlurred(key,value){
 if(!key)return;
 const next={...overrides,[key]:Boolean(value)};
 mockStorage.write(KEY,next);
 overrides=next;
 window.dispatchEvent(new CustomEvent("wapphub-media-blur-changed",{detail:{key}}));
}
export function toggleMediaBlurred(key){setMediaBlurred(key,!isMediaBlurred(key))}
