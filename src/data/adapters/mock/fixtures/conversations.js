import {createLoadConversations} from "./load-conversations.mjs";
// Dados fictícios: nunca representam mensagens reais.
export const conversations=[
{id:"mariana",name:"Mariana Costa",initials:"MC",phone:"+55 (81) 99999-1001",time:"14:32",unread:2,assigned:true,agent:"Você",status:"Em atendimento",preview:"Perfeito, fico no aguardo!",messages:[["in","Olá! Gostaria de saber se meu equipamento já está pronto.","14:16"],["out","Oi, Mariana! Estou verificando a situação para você.","14:19"],["in","Obrigada! Se possível, preciso retirar ainda hoje.","14:23"],["out","Conseguimos finalizar o diagnóstico. Vou confirmar o horário de retirada.","14:28"],["in","Perfeito, fico no aguardo!","14:32"]]},
{id:"ricardo",name:"Ricardo Almeida",initials:"RA",phone:"+55 (81) 99999-1002",time:"14:09",unread:0,assigned:true,agent:"Você",status:"Em atendimento",preview:"Pode enviar o comprovante?",messages:[["in","Boa tarde, preciso da segunda via.","13:53"],["out","Claro, você poderia informar a referência?","14:01"],["in","Pode enviar o comprovante?","14:09"]]},
{id:"empresa",name:"Oficina Horizonte",initials:"OH",phone:"+55 (81) 99999-1003",time:"13:45",unread:1,assigned:false,agent:"Não atribuído",status:"Aguardando atribuição",preview:"Bom dia, precisamos de suporte",messages:[["in","Bom dia, precisamos de suporte para a impressora da recepção.","13:45"]]},
{id:"patricia",name:"Patrícia Nunes",initials:"PN",phone:"+55 (81) 99999-1004",time:"Ontem",unread:0,assigned:true,agent:"Você",status:"Em atendimento",preview:"Muito obrigada pela atenção.",messages:[["in","Muito obrigada pela atenção.","16:22"],["out","Nós que agradecemos, Patrícia!","16:24"]]},
{id:"lucas",name:"Lucas Ferreira",initials:"LF",phone:"+55 (81) 99999-1005",time:"Seg",unread:0,assigned:false,agent:"Não atribuído",status:"Aguardando atribuição",preview:"Preciso alterar meu agendamento",messages:[["in","Preciso alterar meu agendamento, por favor.","11:04"]]},
{id:"ana",name:"Ana Beatriz",initials:"AB",phone:"+55 (81) 99999-1006",time:"Seg",unread:0,assigned:true,agent:"Você",status:"Em atendimento",preview:"Tudo certo, obrigado!",messages:[["in","Tudo certo, obrigado!","10:05"]]}
];
// Vínculo de conversas a instâncias de canal, sem acoplamento ao provider.
const bindings={mariana:"wa-sales",ricardo:"wa-sales",empresa:"web-support",patricia:"wa-help",lucas:"web-support",ana:"team"};
for(const conversation of conversations)conversation.channelId=bindings[conversation.id];
// Carga para inspecionar a Inbox sob volume, sem substituir as seis conversas originais.
conversations.push(...createLoadConversations());
