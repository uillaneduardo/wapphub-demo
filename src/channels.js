import {mockStorage} from "./data/adapters/mock/storage.mjs";
// Catálogo de demonstração: provider (tecnologia) ≠ canal (instância) ≠ caixa de entrada.
const KEY="wapphub-demo-channels-v2";
const initialProviders=[
{id:"native",name:"WappHub Native",kind:"internal",description:"Mensagens internas e widget de suporte"},
{id:"external",name:"WhatsApp (API)",kind:"external",description:"Adaptador de mensagens externo"}
];
const initialChannels=[
{id:"wa-sales",name:"WhatsApp · Comercial",platform:"whatsapp",provider:"external",state:"connected",enabled:true},
{id:"web-support",name:"Chat · Suporte",platform:"web",provider:"native",state:"connected",enabled:true},
{id:"team",name:"WappHub · Equipe",platform:"internal",provider:"native",state:"connected",enabled:true},
{id:"wa-help",name:"WhatsApp · Suporte",platform:"whatsapp",provider:"external",state:"disconnected",enabled:true}
];
const stored=mockStorage.read(KEY,null);
export const providers=Array.isArray(stored?.providers)?stored.providers:structuredClone(initialProviders);
export const channels=[{id:"all",name:"Todas as caixas",provider:null,state:"aggregate",enabled:true},...(Array.isArray(stored?.channels)?stored.channels:structuredClone(initialChannels))];
/**
 * Salva a próxima versão antes de atualizar referências públicas legadas.
 * Mantém arrays e objetos de mesmo ID por compatibilidade com componentes.
 */
const commit=(nextProviders,nextChannels)=>{
 const persistedChannels=nextChannels.filter(c=>c.id!=="all");
 mockStorage.write(KEY,{providers:nextProviders,channels:persistedChannels});
 const reconcile=(target,next)=>{
  const prior=new Map(target.map(item=>[item.id,item]));
  const items=next.map(item=>{
   const existing=prior.get(item.id);
   if(!existing)return item;
   for(const key of Object.keys(existing))if(!(key in item))delete existing[key];
   Object.assign(existing,item);return existing;
  });
  target.splice(0,target.length,...items);
 };
 reconcile(providers,nextProviders);
 reconcile(channels,nextChannels);
 window.dispatchEvent(new Event("demo-channels-updated"));
};
export const getChannel=id=>channels.find(c=>c.id===id)||channels[0];
export function upsertProvider(data,id){
 const nextProviders=structuredClone(providers),nextChannels=structuredClone(channels);
 const old=nextProviders.find(p=>p.id===id);
 if(old)Object.assign(old,{name:data.name,description:data.description});
 else nextProviders.push({id:"p-"+crypto.randomUUID(),name:data.name,kind:"external",description:data.description});
 commit(nextProviders,nextChannels);
}
export function upsertChannel(data,id){
 const nextProviders=structuredClone(providers),nextChannels=structuredClone(channels);
 const old=nextChannels.find(c=>c.id===id);
 if(old)Object.assign(old,{name:data.name,provider:data.provider,platform:data.platform||old.platform||"other"});
 else nextChannels.push({id:"c-"+crypto.randomUUID(),name:data.name,platform:data.platform||"other",provider:data.provider,state:"disconnected",enabled:false});
 commit(nextProviders,nextChannels);
}
export function setChannelEnabled(id,enabled){
 const nextChannels=structuredClone(channels);
 const c=nextChannels.find(item=>item.id===id&&item.id!=="all");
 if(!c)return;
 c.enabled=Boolean(enabled);
 commit(structuredClone(providers),nextChannels);
}
