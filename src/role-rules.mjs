export const capabilities=[
 {id:"forward",label:"Encaminhar mensagens",description:"Permitir encaminhamento de mensagens"},
 {id:"deleteMine",label:"Excluir para mim",description:"Ocultar mensagens na própria visualização"},
 {id:"deleteAll",label:"Excluir para todos",description:"Solicitar exclusão quando disponível"},
 {id:"manageAssignments",label:"Gerenciar atribuições",description:"Atribuir e redistribuir conversas"},
 {id:"editContacts",label:"Editar contatos",description:"Atualizar nome e foto na plataforma"},
 {id:"manageChannels",label:"Gerenciar canais",description:"Configurar canais e integrações"}
];
const defaults={
 OWNER:{forward:true,deleteMine:true,deleteAll:true,manageAssignments:true,editContacts:true,manageChannels:true},
 SUPERVISOR:{forward:true,deleteMine:true,deleteAll:false,manageAssignments:true,editContacts:true,manageChannels:false},
 AGENT:{forward:true,deleteMine:true,deleteAll:false,manageAssignments:false,editContacts:false,manageChannels:false}
};
export function grantFor(role,key,overrides={}){
 if(!(role in defaults)||!(key in defaults[role]))return false;
 if(role==="OWNER")return true;
 if(role==="AGENT"&&key==="manageAssignments")return false;
 const userGrant=overrides?.[role]?.[key];
 return typeof userGrant==="boolean"?userGrant:defaults[role][key];
}
export function eligibleConversations(conversations,role,memberId){
 return conversations.filter(c=>role!=="AGENT"||Boolean(memberId)&&c.assignedToMemberId===memberId);
}
