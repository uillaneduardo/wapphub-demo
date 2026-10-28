/**
 * Tabela de rotas do frontend estático. Não lê DOM, rede ou fixtures.
 * Somente o router conhece os caminhos públicos.
 */
export const mainPaths=Object.freeze({
 "atendimento":"/inbox","visao-geral":"/dashboard",
 "contatos":"/contacts","midias":"/media",
 "configuracoes":"/settings","perfil":"/profile"
});
const titles={atendimento:"Caixa de entrada","visao-geral":"Visão geral",contatos:"Contatos",midias:"Mídias",configuracoes:"Configurações",perfil:"Meu perfil"};
export function parseRoute(value="/"){
 let url;
 try{url=new URL(value,"https://wapphub.invalid")}catch{return {name:"not-found",path:"/",title:"Página não encontrada",params:{},query:{}}}
 const path=url.pathname.replace(/\/{2,}/g,"/").replace(/\/$/,"")||"/";
 if(path==="/")return {name:"redirect",path:"/inbox",title:titles.atendimento,params:{},query:{}};
 for(const [name,routePath] of Object.entries(mainPaths)){
  if(path===routePath)return {name,path,title:titles[name],params:{},query:Object.fromEntries(url.searchParams)};
 }
 return {name:"not-found",path,title:"Página não encontrada",params:{},query:{}};
}
export function pathFor(name){return mainPaths[name]||null}
