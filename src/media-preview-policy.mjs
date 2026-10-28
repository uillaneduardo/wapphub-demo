/** Preferências de visualização. Regras puras e sem dependência do navegador. */
export const MEDIA_PREVIEW_DEFAULT=true;
export function normalizeMediaPreviewSettings(raw){
 const enabled=typeof raw?.enabled==="boolean"?raw.enabled:MEDIA_PREVIEW_DEFAULT;
 const overrides={};
 if(raw?.overrides&&typeof raw.overrides==="object"&&!Array.isArray(raw.overrides)){
  for(const [id,value] of Object.entries(raw.overrides)){
   if(id.length<=220&&typeof value==="boolean"&&value!==enabled)overrides[id]=value;
  }
 }
 return {enabled,overrides};
}
export function isMediaPreviewBlurred(settings,id,kind){
 if(!["image","video"].includes(kind))return false;
 const normalized=normalizeMediaPreviewSettings(settings);
 return typeof normalized.overrides[id]==="boolean"?normalized.overrides[id]:normalized.enabled;
}
export function withMediaPreviewDefault(settings,enabled){
 const current=normalizeMediaPreviewSettings(settings);
 return normalizeMediaPreviewSettings({...current,enabled:Boolean(enabled)});
}
export function withMediaPreviewOverride(settings,id,blurred){
 const current=normalizeMediaPreviewSettings(settings);
 if(!id||typeof id!=="string")return current;
 if(Boolean(blurred)===current.enabled)delete current.overrides[id];
 else current.overrides[id]=Boolean(blurred);
 return current;
}
