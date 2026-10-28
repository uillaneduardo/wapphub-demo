/**
 * Pure route parser and canonical paths. The UI never depends on storage.
 */
export const mainPaths=Object.freeze({
 "atendimento":"/inbox","visao-geral":"/dashboard",
 "contatos":"/contacts","midias":"/media",
 "configuracoes":"/settings","perfil":"/profile"
});
export const settingPaths=Object.freeze({
 organizacao:"organization",equipe:"team",permissoes:"permissions",
 canais:"channels",providers:"providers",aparencia:"appearance"
});
const titles={atendimento:"Caixa de entrada","visao-geral":"Visão geral",contatos:"Contatos",midias:"Mídias",configuracoes:"Configurações",perfil:"Meu perfil"};
const idOk=id=>/^[A-Za-z0-9:_-]{1,128}$/.test(id);
const error=path=>({name:"not-found",path,title:"Página não encontrada",params:{},query:{}});
export function parseRoute(value="/"){
 let url;
 try{url=new URL(value,"https://wapphub.invalid")}catch{return error("/")}
 const path=url.pathname.replace(/\/{2,}/g,"/").replace(/\/$/,"")||"/";
 const query=Object.fromEntries(url.searchParams);
 if(path==="/")return {name:"redirect",path:"/inbox",title:titles.atendimento,params:{},query:{}};
 for(const [name,routePath] of Object.entries(mainPaths)){
  if(path===routePath)return {name,path,title:titles[name],params:{},query};
 }
 const segments=path.split("/").filter(Boolean);
 if(segments[0]==="inbox"&&(segments.length===2||(segments.length===3&&segments[2]==="details"))&&idOk(segments[1])){
  return {name:"atendimento",path,title:"Conversa",params:{conversationId:segments[1],details:segments.length===3},query};
 }
 if(segments[0]==="contacts"&&segments.length===2&&idOk(segments[1])){
  return {name:"contatos",path,title:"Contato",params:{contactId:segments[1]},query};
 }
 if(segments[0]==="settings"&&segments[1]==="providers"&&segments.length>=3&&segments.length<=4){
  if(segments.length===3&&segments[2]==="new")
   return {name:"configuracoes",path,title:"Nova conexão",params:{section:"providers",providerView:"new"},query};
  const id=segments[2];
  if(!idOk(id))return error(path);
  const tab=segments[3]||"overview";
  if(!["overview","session","channels","diagnostics","events"].includes(tab))return error(path);
  return {name:"configuracoes",path,title:"Conexão de Provider",params:{section:"providers",providerView:"detail",providerId:id,providerTab:tab},query};
 }
 if(segments[0]==="settings"&&segments.length===2){
  const entry=Object.entries(settingPaths).find(([,slug])=>slug===segments[1]);
  if(entry)return {name:"configuracoes",path,title:titles.configuracoes,params:{section:entry[0]},query};
 }
 return error(path);
}
export function pathFor(name){return mainPaths[name]||null}
export function conversationPath(id,{details=false}={}){
 return idOk(id)?"/inbox/"+encodeURIComponent(id)+(details?"/details":""):null;
}
export function contactPath(id){return idOk(id)?"/contacts/"+encodeURIComponent(id):null}
export function settingsPath(section){return section in settingPaths?"/settings/"+settingPaths[section]:null}
export function providerPath(id=null,tab="overview"){
 if(id===null)return "/settings/providers";
 if(id==="new")return "/settings/providers/new";
 if(!idOk(id)||!["overview","session","channels","diagnostics","events"].includes(tab))return null;
 return "/settings/providers/"+encodeURIComponent(id)+(tab==="overview"?"":"/"+tab);
}
export function mediaPath({conversationId="all",type="all",query=""}={}){
 const params=new URLSearchParams();
 if(conversationId&&conversationId!=="all")params.set("conversation",conversationId);
 if(type&&type!=="all")params.set("type",type);
 if(query)params.set("q",query);
 return "/media"+(params.size?"?"+params.toString():"");
}
