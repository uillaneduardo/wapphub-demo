import {mockStorage} from "./storage.mjs";
const KEY="wapphub-demo-emoji-preferences-v1";
const DEFAULTS={recent:[],tone:""};
const VALID_TONES=new Set(["","🏻","🏼","🏽","🏾","🏿"]);
/** Persistência de preferência exclusivamente ilustrativa e opcional na demo. */
export function createMockEmojiPreferences(storage=mockStorage){
 const sanitize=value=>({
  recent:Array.isArray(value?.recent)?[...new Set(value.recent.filter(x=>typeof x==="string"&&x.length<=32))].slice(0,28):[],
  tone:VALID_TONES.has(value?.tone)?value.tone:""
 });
 return Object.freeze({
  read(){return sanitize(storage.read(KEY,DEFAULTS))},
  save(value){const next=sanitize(value);storage.write(KEY,next);return next}
 });
}
export const emojiPreferences=createMockEmojiPreferences();
