/** Fixtures exclusivamente fictícias, não representam serviços reais. */
export const providerTypes=Object.freeze([
 {id:"baileys",name:"WhatsApp Web (Baileys)",platform:"whatsapp",authMode:"qr",description:"Sessão Web vinculada por QR, independente do WhatsApp Cloud API.",capabilities:["Texto e mídia","QR de vinculação","Eventos de sessão","Sincronização"]},
 {id:"cloud-api",name:"WhatsApp Cloud API",platform:"whatsapp",authMode:"api",description:"Integração oficial com credenciais gerenciadas pelo Core no futuro.",capabilities:["Mensagens","Templates","Webhooks","Diagnóstico"]},
 {id:"native-webchat",name:"WappHub Native / Webchat",platform:"web",authMode:"native",description:"Chat web e comunicação interna hospedados na plataforma.",capabilities:["Widget web","Equipe interna","Identidade do contato"]},
 {id:"custom",name:"Provider personalizado",platform:"other",authMode:"manual",description:"Exemplo genérico para futuros adaptadores.",capabilities:["Configuração manual"]}
]);
const date="2026-10-28T12:00:00.000Z";
export const demoConnections=[
 {id:"demo-baileys-commercial",name:"WhatsApp Comercial · Baileys",typeId:"baileys",state:"connected",enabled:true,description:"Conexão ilustrativa conectada.",channelIds:[],teamId:"team-sales",session:{state:"authenticated",lastSyncAt:date,updatedAt:date}},
 {id:"demo-baileys-support",name:"WhatsApp Suporte · Baileys",typeId:"baileys",state:"syncing",enabled:true,description:"Exemplo de sincronização em andamento.",channelIds:[],teamId:"team-support",session:{state:"authenticated",lastSyncAt:null,updatedAt:date}},
 {id:"demo-baileys-finance",name:"WhatsApp Financeiro · Baileys",typeId:"baileys",state:"disconnected",enabled:true,description:"Exemplo sem sessão ativa.",channelIds:[],teamId:null,session:{state:"disconnected",updatedAt:date}},
 {id:"demo-cloud-meta",name:"WhatsApp Cloud API · Exemplo",typeId:"cloud-api",state:"awaiting_auth",enabled:false,description:"Exemplo sem token ou credencial real.",channelIds:[],teamId:null,session:{state:"not_authenticated",updatedAt:date}}
].map(item=>({...item,createdAt:date,updatedAt:date}));
export function legacyConnections(providers=[],channels=[]){
 const linked=channels.filter(ch=>ch.id!=="all");
 return providers.map(p=>({
  id:"legacy:"+p.id,name:p.name,typeId:p.kind==="internal"?"native-webchat":"cloud-api",
  description:p.description||"Conexão preservada do cadastro anterior.",
  legacyProviderId:p.id,channelIds:linked.filter(c=>c.provider===p.id).map(c=>c.id),
  teamId:null,enabled:true,
  state:linked.some(c=>c.provider===p.id&&c.state==="connected")?"connected":"disconnected",
  session:{state:"legacy",updatedAt:date},createdAt:date,updatedAt:date
 }));
}
