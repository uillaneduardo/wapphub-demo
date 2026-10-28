import {normalizeMediaPreviewSettings,isMediaPreviewBlurred,withMediaPreviewDefault,withMediaPreviewOverride} from "./media-preview-policy.mjs?v=blur-1";
// Adapter temporário de persistência da demo, isolado da interface.
// Migração para src/data/adapters/mock prevista na issue #61.
const KEY="wapphub-demo-media-previews-v1";
function read(){
 try{return normalizeMediaPreviewSettings(JSON.parse(localStorage.getItem(KEY)||"null"))}
 catch{return normalizeMediaPreviewSettings(null)}
}
let state=read();
function save(next){
 state=next;
 try{localStorage.setItem(KEY,JSON.stringify(state))}catch(error){console.warn("Preferência de mídias não pôde ser salva",error)}
 window.dispatchEvent(new Event("wapphub-media-preview-change"));
}
export const mediaPreviewPreferences={
 isEnabled:()=>state.enabled,
 isBlurred:(id,kind)=>isMediaPreviewBlurred(state,id,kind),
 setEnabled:enabled=>save(withMediaPreviewDefault(state,enabled)),
 setBlurred:(id,blurred)=>save(withMediaPreviewOverride(state,id,blurred))
};
