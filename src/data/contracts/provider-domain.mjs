/**
 * WappHub Demo: contratos puros do domínio Provider.
 * ProviderType (tecnologia) != OrganizationConnection (instância)
 * != Channel (instância pública da Inbox).
 * API do Core pode implementar estas funções sem trocar a UI.
 */
export const CONNECTION_STATES=Object.freeze([
 "not_configured","awaiting_auth","connecting","connected",
 "syncing","degraded","disconnected","failed","disabled"
]);
export const STATE_LABELS=Object.freeze({
 not_configured:"Não configurado",awaiting_auth:"Aguardando autenticação",
 connecting:"Conectando",connected:"Conectado",
 syncing:"Sincronizando",degraded:"Degradado",
 disconnected:"Desconectado",failed:"Falha",disabled:"Desabilitado"
});
const types=new Set(["baileys","cloud-api","native-webchat","custom"]);
export function normalizedConnection(item){
 if(!item||typeof item!=="object")return null;
 const type=types.has(item.typeId)?item.typeId:"custom";
 const state=CONNECTION_STATES.includes(item.state)?item.state:"not_configured";
 return {
  id:String(item.id||""),name:String(item.name||"").trim().slice(0,80),
  description:String(item.description||"").slice(0,240),
  typeId:type,state,enabled:item.enabled!==false,
  teamId:item.teamId||null,channelIds:Array.isArray(item.channelIds)?[...new Set(item.channelIds.filter(v=>typeof v==="string"))]:[],
  legacyProviderId:item.legacyProviderId||null,
  session:{
   state:item.session?.state||"not_authenticated",
   lastSyncAt:item.session?.lastSyncAt||null,
   updatedAt:item.session?.updatedAt||null,
   expiresAt:item.session?.expiresAt||null
  },
  createdAt:item.createdAt||"2026-10-28T12:00:00.000Z",
  updatedAt:item.updatedAt||"2026-10-28T12:00:00.000Z"
 };
}
export function validateConnectionCommand(command,existing=[]){
 const name=String(command?.name||"").trim();
 if(name.length<3||name.length>80)return "O nome deve ter de 3 a 80 caracteres.";
 if(!types.has(command.typeId))return "Selecione um tipo de provider válido.";
 if(existing.some(x=>x.name.toLocaleLowerCase("pt-BR")===name.toLocaleLowerCase("pt-BR")&&x.id!==command.id))return "Já existe uma conexão com esse nome.";
 return null;
}
export function filteredConnections(items,{search="",state="all",type="all"}={}){
 const q=String(search).trim().toLocaleLowerCase("pt-BR");
 return items.filter(x=>(state==="all"||x.state===state)&&(type==="all"||x.typeId===type)&&
  (!q||[x.name,x.description,x.typeId].some(text=>String(text).toLocaleLowerCase("pt-BR").includes(q))));
}
/**
 * @typedef {{id:string,name:string,description:string,platform:string,capabilities:string[],authMode:string}} ProviderType
 * @typedef {{id:string,typeId:string,name:string,description:string,state:string,enabled:boolean,teamId:string|null,channelIds:string[],session:object}} OrganizationConnection
 * @typedef {{status:string,uptimePercent:number|null,latencyP95Ms:number|null,failedEvents:number,pendingMessages:number,lastSyncAt:string|null,simulated:true}} HealthSnapshot
 * @typedef {{id:string,connectionId:string,type:string,severity:string,description:string,occurredAt:string}} ProviderEvent
 * @typedef {{items:OrganizationConnection[],nextCursor:null}} ConnectionPage
 * @typedef {{
 * listTypes:()=>Promise<ProviderType[]>,
 * listConnections:(filter?:object)=>Promise<ConnectionPage>,
 * getConnection:(id:string)=>Promise<OrganizationConnection|null>,
 * createConnection:(data:object)=>Promise<OrganizationConnection>,
 * updateConnection:(id:string,data:object)=>Promise<OrganizationConnection>,
 * setConnectionState:(id:string,state:string)=>Promise<OrganizationConnection>,
 * assignChannels:(id:string,ids:string[])=>Promise<OrganizationConnection>,
 * updateSession:(id:string,command:object)=>Promise<OrganizationConnection>,
 * getHealth:(id:string)=>Promise<HealthSnapshot|null>,
 * listEvents:(id:string)=>Promise<ProviderEvent[]>,
 * subscribe:(fn:(event:object)=>void)=>()=>void
 * }} ProviderRepository
 */
