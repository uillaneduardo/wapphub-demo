/**
 * Frontend route checks for the static prototype; the real Core must validate
 * authorization for each request. These checks never grant server-side access.
 */
export function checkRouteAccess(route,{conversations=[],canAccess=()=>false,channels=[],role="OWNER"}={}){
 const result=(status)=>({status});
 if(route.name==="not-found")return result("not-found");
 if(route.name==="redirect")return result("allowed");
 if(route.name==="configuracoes"&&role==="AGENT"&&route.params.section!=="aparencia"){
  if(!route.params.section)return {status:"redirect",path:"/settings/appearance"};
  return result("forbidden");
 }
 const id=route.params.conversationId||route.params.contactId||
  (route.name==="midias"&&route.query.conversation!=="all"?route.query.conversation:null);
 if(id){
  const match=conversations.find(c=>c.id===id);
  if(!match)return result("not-found");
  if(!canAccess(match)||!channels.some(ch=>ch.id===match.channelId&&ch.enabled!==false))return result("forbidden");
 }
 if(route.name==="midias"){
  const type=route.query.type||"all";
  if(!["all","image","audio","video","document"].includes(type))return result("not-found");
  if((route.query.q||"").length>160)return result("not-found");
 }
 return result("allowed");
}
