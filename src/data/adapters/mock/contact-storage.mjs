import {createMockStorage} from "./storage.mjs";
const KEY="wapphub-demo-contacts-v1";
const isRecord=value=>value!==null && typeof value==="object" && !Array.isArray(value);
const sanitize=value=>{
 const result=Object.create(null);
 if(!isRecord(value))return result;
 for(const [id,fields] of Object.entries(value)){
  if(!id || !isRecord(fields))continue;
  result[id]={
   alias:typeof fields.alias==="string"?fields.alias.slice(0,80):"",
   ...(typeof fields.photo==="string" && /^(https:\/\/|data:image\/(png|jpeg|webp);base64,)/i.test(fields.photo)?{photo:fields.photo}:{})
  };
 }
 return result;
};
/**
 * Único acesso às preferências legadas dos contatos. Mantém a chave v1.
 * Erro de escrita é propagado para o formulário: não simular persistência.
 */
export function createMockContactRepository(storage) {
 const json=arguments.length===0?createMockStorage():createMockStorage(storage);
 let records=sanitize(json.read(KEY,{}));
 return {
  snapshot:()=>structuredClone(records),
  async save(id,fields){
   if(typeof id!=="string" || !id.trim())throw new TypeError("Contato inválido");
   if(!isRecord(fields))throw new TypeError("Alterações inválidas");
   const entry={
    ...records[id],
    ...(Object.hasOwn(fields,"alias")?{alias:String(fields.alias??"").trim().slice(0,80)}:{}),
    ...(Object.hasOwn(fields,"photo")?{photo:fields.photo}:{})
   };
   if(entry.photo!==undefined && (typeof entry.photo!=="string" || !/^(https:\/\/|data:image\/(png|jpeg|webp);base64,)/i.test(entry.photo)))throw new TypeError("Imagem inválida");
   const next={...records,[id]:entry};
   json.write(KEY,next);
   records=sanitize(next);
   return {id,...records[id]};
  }
 };
}
