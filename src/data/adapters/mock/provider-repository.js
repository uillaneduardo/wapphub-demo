import {providerTypes,demoConnections,legacyConnections} from "./provider-fixtures.mjs";
import {CONNECTION_STATES,normalizedConnection,validateConnectionCommand,filteredConnections} from "../../contracts/provider-domain.mjs";
import {channels,providers} from "../../../channels.js?v=channels-1";
import {mockStorage} from "./storage.mjs";

const KEY="wapphub-demo-provider-connections-v1";
const clone=value=>structuredClone(value);
const iso=()=>new Date().toISOString();
function initialState(){
 return {schemaVersion:1,connections:[
  ...legacyConnections(providers,channels),...demoConnections
 ].map(normalizedConnection),events:[]};
}
function restore(){
 const saved=mockStorage.read(KEY,null);
 if(!saved||saved.schemaVersion!==1||!Array.isArray(saved.connections))return initialState();
 const result=initialState();
 // Never overwrite a user's edited connection, and never re-seed a deleted
 // sample on every reload. New default fixture connections belong to fresh state.
 result.connections=saved.connections.map(normalizedConnection).filter(c=>c?.id&&c.name);
 result.events=Array.isArray(saved.events)?saved.events.filter(e=>e&&e.connectionId).slice(-250):[];
 return result;
}
let state=restore(),observers=new Set();
// Transactions roll back ALL in-memory changes if persistence is unavailable.
// Never emit success or alter a connection on a rejected storage write.
function persist(previousState){
 try{mockStorage.write(KEY,state)}catch(error){state=previousState;throw error}
}
function emit(event){for(const cb of observers){try{cb(event)}catch(e){console.error(e)}}}
function writeEvent(id,type,description,severity="info"){
 const event={id:"evt-"+crypto.randomUUID(),connectionId:id,type,severity,description,occurredAt:iso()};
 state.events.push(event);state.events=state.events.slice(-250);return event;
}
function current(id){return state.connections.find(c=>c.id===id)||null}
function snapshot(value){return value?clone(value):null}
const knownChannelIds=()=>new Set(channels.filter(c=>c.id!=="all").map(c=>c.id));
export function createMockProviderRepository(){
 return {
  async listTypes(){return clone(providerTypes)},
  async listConnections(filter={}){return {items:clone(filteredConnections(state.connections,filter)),nextCursor:null}},
  async getConnection(id){return snapshot(current(id))},
  async createConnection(command){
   const error=validateConnectionCommand(command,state.connections);if(error)throw new Error(error);
   const now=iso(),id="conn-"+crypto.randomUUID();
   const item=normalizedConnection({...command,id,state:"not_configured",channelIds:[],createdAt:now,updatedAt:now,session:{state:"not_authenticated",updatedAt:now}});
   const previousState=clone(state);
   state.connections.push(item);
   writeEvent(id,"created","Conexão criada na demonstração.");
   persist(previousState);emit({type:"connection-created",id});return snapshot(item);
  },
  async updateConnection(id,command){
   const item=current(id);if(!item)throw new Error("Conexão não encontrada.");
   const error=validateConnectionCommand({...item,...command,id},state.connections);if(error)throw new Error(error);
   const updated=normalizedConnection({...item,...command,id,channelIds:item.channelIds,createdAt:item.createdAt,updatedAt:iso()});
   const previousState=clone(state);
   state.connections.splice(state.connections.indexOf(item),1,updated);
   writeEvent(id,"updated","Identificação da conexão atualizada.");
   persist(previousState);emit({type:"connection-updated",id});return snapshot(updated);
  },
  async setConnectionState(id,next){
   const item=current(id);if(!item)throw new Error("Conexão não encontrada.");
   if(!CONNECTION_STATES.includes(next))throw new Error("Estado inválido.");
   const previousState=clone(state);
   item.state=next;item.updatedAt=iso();
   item.session={...item.session,updatedAt:item.updatedAt,
    state:next==="connected"||next==="syncing"?"authenticated":next==="awaiting_auth"?"not_authenticated":next};
   writeEvent(id,"state-change","Estado atualizado na simulação: "+next,next==="failed"?"error":"info");
   persist(previousState);emit({type:"connection-state",id});return snapshot(item);
  },
  async updateSession(id,command){
   const item=current(id);if(!item)throw new Error("Conexão não encontrada.");
   const next={...item.session};
   if(command.state!==undefined){
    if(!["not_authenticated","qr_pending","authenticated","disconnected","connecting","failed","legacy"].includes(command.state))
     throw new Error("Estado da sessão inválido.");
    next.state=command.state;
   }
   for(const name of ["expiresAt","lastSyncAt"])if(name in command)next[name]=command[name]||null;
   const previousState=clone(state);
   next.updatedAt=iso();item.session=next;item.updatedAt=next.updatedAt;
   writeEvent(id,"session","Sessão demonstrativa atualizada.");
   persist(previousState);emit({type:"connection-session",id});return snapshot(item);
  },
  async assignChannels(id,ids){
   const item=current(id);if(!item)throw new Error("Conexão não encontrada.");
   if(!Array.isArray(ids)||ids.some(v=>!knownChannelIds().has(v)))throw new Error("Canal inválido.");
   const unique=[...new Set(ids)];
   const previousState=clone(state);
   // one channel can belong to only one organization connection.
   for(const other of state.connections)if(other.id!==id)other.channelIds=other.channelIds.filter(x=>!unique.includes(x));
   item.channelIds=unique;item.updatedAt=iso();
   writeEvent(id,"channels-change","Associações de canais atualizadas na demonstração.");
   persist(previousState);emit({type:"connection-channels",id});return snapshot(item);
  },
  async getHealth(id){
   const item=current(id);if(!item)return null;
   const status=item.enabled===false?"disabled":item.state;
   // Deterministic example snapshots. No telemetry or simulated external I/O.
   return {status,simulated:true,uptimePercent:status==="connected"?99.1:status==="degraded"?88.5:null,
    latencyP95Ms:status==="connected"?145:status==="degraded"?780:null,
    failedEvents:status==="failed"?3:0,pendingMessages:status==="syncing"?12:0,
    lastSyncAt:item.session?.lastSyncAt||null};
  },
  async listEvents(id){
   if(!current(id))return [];
   const stored=state.events.filter(event=>event.connectionId===id);
   return clone(stored.length?stored:[{
    id:"sample:"+id,connectionId:id,type:"sample",
    severity:"info",description:"Registro ilustrativo de inicialização da conexão.",
    occurredAt:current(id).createdAt
   }]);
  },
  subscribe(fn){observers.add(fn);return ()=>observers.delete(fn)}
 };
}
export const providerRepository=createMockProviderRepository();
