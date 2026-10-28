/**
 * Identidade visual da origem. Plataforma ≠ canal ≠ provider.
 * Compatível com o catálogo salvo antes da existência de channel.platform.
 * Sem DOM, persistência, rede ou dependência da API/Core.
 */
export const platformOptions=Object.freeze([
 {value:"whatsapp",label:"WhatsApp",icon:"origin-whatsapp"},
 {value:"web",label:"Chat Web",icon:"origin-web"},
 {value:"internal",label:"Interno",icon:"origin-internal"},
 {value:"other",label:"Outro canal",icon:"origin-unknown"}
]);
const platforms=Object.fromEntries(platformOptions.map(item=>[item.value,item]));
export function inferChannelPlatform(channel){
 if(!channel)return "other";
 if(platforms[channel.platform])return channel.platform;
 // Compatibilidade dos canais já salvos: inferir só por identidade do canal,
 // nunca tratar todo provider externo como WhatsApp.
 if(["wa-sales","wa-help"].includes(channel.id))return "whatsapp";
 if(channel.id==="web-support")return "web";
 if(channel.id==="team")return "internal";
 const descriptor=String(channel.name||"").toLocaleLowerCase("pt-BR");
 if(/whats\s*app/.test(descriptor))return "whatsapp";
 if(/chat\s*(web|do site)|web\s*chat/.test(descriptor))return "web";
 if(/wapphub\s*[·-]\s*equipe|chat\s*interno/.test(descriptor))return "internal";
 return "other";
}
const states={
 connected:"Conectado", disconnected:"Desconectado",
 reconnecting:"Reconectando", syncing:"Sincronizando",
 failed:"Falha na conexão", error:"Falha na conexão"
};
export function channelIdentity(channel,providers=[]){
 if(!channel||channel.id==="all")return {
  platform:"other",platformLabel:"Origem não identificada",icon:"origin-unknown",
  channelName:"Canal indisponível",providerName:"Provider indisponível",
  providerId:null,channelId:channel?.id||null,status:"unavailable",statusLabel:"Indisponível"
 };
 const platform=inferChannelPlatform(channel);
 const provider=providers.find(item=>item.id===(channel.providerId||channel.provider));
 const status=channel.enabled===false?"disabled":states[channel.state]?channel.state:"unavailable";
 return {
  platform,platformLabel:platforms[platform].label,icon:platforms[platform].icon,
  channelId:channel.id,channelName:channel.name||"Canal sem nome",
  providerId:provider?.id||null,providerName:provider?.name||"Provider indisponível",
  status,statusLabel:status==="disabled"?"Desabilitado":states[status]||"Indisponível"
 };
}
