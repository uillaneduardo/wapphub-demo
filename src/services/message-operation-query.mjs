/**
 * Consulta de dados necessários às ações de mensagens. Serviço sem estado e sem DOM.
 * O adaptador de produção deverá aplicar autenticação, organização e RBAC no Core.
 * Nenhuma validação de acesso no frontend constitui autorização.
 */
export function createMessageOperationQueryService(repository){
 for(const name of ["getMessage","getMessages","listRecipients"]){
  if(typeof repository?.[name]!=="function")throw new TypeError("MessageOperationQueryRepository."+name+" é obrigatório");
 }
 const checkId=(id,label)=>{
  if(typeof id!=="string"||!id.trim())throw new TypeError(label+" inválido");
 };
 return Object.freeze({
  async getMessage(conversationId,messageId){
   checkId(conversationId,"ID da conversa");
   checkId(messageId,"ID da mensagem");
   const message=await repository.getMessage(conversationId,messageId);
   if(message===null)return null;
   if(!message||typeof message!=="object"||message.id!==messageId||message.conversationId!==conversationId)
    throw new TypeError("Mensagem consultada inválida");
   return message;
  },
  async getMessages(conversationId,ids){
   checkId(conversationId,"ID da conversa");
   if(!Array.isArray(ids)||!ids.length||ids.some(id=>typeof id!=="string"||!id.trim()))
    throw new TypeError("IDs das mensagens inválidos");
   const result=await repository.getMessages(conversationId,ids);
   if(!Array.isArray(result)||result.some(message=>!message||message.conversationId!==conversationId||!ids.includes(message.id)))
    throw new TypeError("Lista de mensagens inválida");
   return result;
  },
  async listRecipients(conversationId){
   checkId(conversationId,"ID da conversa");
   const recipients=await repository.listRecipients(conversationId);
   if(!Array.isArray(recipients)||recipients.some(c=>!c||typeof c.id!=="string"||typeof c.name!=="string"))
    throw new TypeError("Lista de destinatários inválida");
   return recipients;
  }
 });
}
