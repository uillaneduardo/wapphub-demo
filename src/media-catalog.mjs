/**
 * Catálogo de mídia: transforma mensagens em referências de anexos.
 * Regras puras, sem DOM, localStorage ou chamadas HTTP. Core poderá fornecer
 * a mesma estrutura normalizada no futuro.
 */
const kinds=new Set(["image","audio","video","document"]);
export function mediaKind(file){
 if(!file||typeof file!=="object")return null;
 const kind=String(file.kind||"").toLowerCase();
 if(kinds.has(kind))return kind;
 const type=String(file.type||file.mimeType||"").toLowerCase();
 if(type.startsWith("image/"))return "image";
 if(type.startsWith("audio/"))return "audio";
 if(type.startsWith("video/"))return "video";
 return kind==="file"?"document":null;
}
export function mediaEntries(conversations){
 const result=[];
 for(const c of conversations){
  for(const [index,message] of (c.messages||[]).entries()){
   if(Array.isArray(message)||!message||message.hidden||message.deletedAll)continue;
   const file=message.file,kind=mediaKind(file);
   if(!kind||!file?.url)continue;
   result.push({
    id:String(message.id||c.id+":"+index),conversationId:c.id,channelId:c.channelId||null,
    conversationName:c.name||c.phone||"Contato",kind,name:file.name||"Arquivo",
    url:file.url,poster:file.poster||null,caption:message.body||"",
    time:message.time||c.time||"",direction:message.direction||"in",
    mimeType:file.mimeType||null
   });
  }
 }
 return result;
}
export function filterMedia(items,{conversationId="all",kind="all",query=""}={}){
 const q=query.trim().toLocaleLowerCase("pt-BR");
 return items.filter(item=>
  (conversationId==="all"||item.conversationId===conversationId)&&
  (kind==="all"||item.kind===kind)&&
  (!q||[item.name,item.caption,item.conversationName].some(x=>String(x||"").toLocaleLowerCase("pt-BR").includes(q)))
 );
}
export function mediaTotals(items){
 const total={all:items.length,image:0,audio:0,video:0,document:0};
 for(const item of items)if(item.kind in total)total[item.kind]++;
 return total;
}
