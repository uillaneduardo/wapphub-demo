// Catálogo de demonstração: provider (tecnologia) ≠ canal (instância) ≠ caixa de entrada.
const KEY="wapphub-demo-channels-v2";
const initialProviders=[
{id:"native",name:"WappHub Native",kind:"internal",description:"Mensagens internas e widget de suporte"},
{id:"external",name:"WhatsApp (API)",kind:"external",description:"Adaptador de mensagens externo"}
];
const initialChannels=[
{id:"wa-sales",name:"WhatsApp · Comercial",provider:"external",state:"connected",enabled:true},
{id:"web-support",name:"Chat · Suporte",provider:"native",state:"connected",enabled:true},
{id:"team",name:"WappHub · Equipe",provider:"native",state:"connected",enabled:true},
{id:"wa-help",name:"WhatsApp · Suporte",provider:"external",state:"disconnected",enabled:true}
];
let stored=null;try{stored=JSON.parse(localStorage.getItem(KEY)||"null")}catch{}
export const providers=Array.isArray(stored?.providers)?stored.providers:structuredClone(initialProviders);
export const channels=[{id:"all",name:"Todas as caixas",provider:null,state:"aggregate",enabled:true},...(Array.isArray(stored?.channels)?stored.channels:structuredClone(initialChannels))];
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify({providers,channels:channels.filter(c=>c.id!=="all")}))}catch(e){console.warn("Falha ao salvar configuração fictícia",e)};window.dispatchEvent(new Event("demo-channels-updated"))};
export const getChannel=id=>channels.find(c=>c.id===id)||channels[0];
export function upsertProvider(data,id){const old=providers.find(p=>p.id===id);if(old)Object.assign(old,{name:data.name,description:data.description});else providers.push({id:"p-"+crypto.randomUUID(),name:data.name,kind:"external",description:data.description});persist()}
export function upsertChannel(data,id){const old=channels.find(c=>c.id===id);if(old)Object.assign(old,{name:data.name,provider:data.provider});else channels.push({id:"c-"+crypto.randomUUID(),name:data.name,provider:data.provider,state:"disconnected",enabled:false});persist()}
export function setChannelEnabled(id,enabled){const c=channels.find(c=>c.id===id&&c.id!=="all");if(!c)return;c.enabled=Boolean(enabled);persist()}
