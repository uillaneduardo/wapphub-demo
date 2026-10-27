// Apenas catálogo de canais fictícios; o Core será a fonte da verdade.
export const channels=[
{id:"all",name:"Todas as caixas",provider:null,state:"aggregate"},
{id:"wa-sales",name:"WhatsApp · Comercial",provider:"external",state:"connected"},
{id:"web-support",name:"Chat · Suporte",provider:"native",state:"connected"},
{id:"team",name:"WappHub · Equipe",provider:"native",state:"connected"},
{id:"wa-help",name:"WhatsApp · Suporte",provider:"external",state:"disconnected"}
];
export function getChannel(id){return channels.find(c=>c.id===id)||channels[0]}
