/**
 * Fonte mock para ações do compositor.
 * Projeta somente metadados de destinatários e retorna cópias independentes
 * das mensagens. Não emite mensagens para provedores externos.
 */
export function createMockMessageOperationQueryRepository(conversations){
 if(!Array.isArray(conversations))throw new TypeError("Conversas inválidas");
 const ensure=id=>{
  const c=conversations.find(x=>x.id===id);
  if(!c)throw new Error("Conversa não encontrada");
  if(!Array.isArray(c.messages))throw new TypeError("Histórico inválido");
  return c;
 };
 const clone=message=>structuredClone(message);
 const find=(conversation,id)=>conversation.messages.find(m=>!Array.isArray(m)&&m.id===id)||null;
 return Object.freeze({
  async getMessage(conversationId,messageId){
   const conversation=ensure(conversationId);
   const message=find(conversation,messageId);
   return message?clone(message):null;
  },
  async getMessages(conversationId,ids){
   const conversation=ensure(conversationId);
   return [...new Set(ids)].map(id=>find(conversation,id)).filter(Boolean).map(clone);
  },
  async listRecipients(sourceId){
   ensure(sourceId);
   return conversations.filter(c=>c.id!==sourceId).map(c=>({
    id:c.id,
    name:String(c.name||""),
    phone:String(c.phone||""),
    assignedToMemberId:c.assignedToMemberId??null,
    assigned:Boolean(c.assigned),
    status:String(c.status||""),
    channelId:String(c.channelId||"")
   }));
  }
 });
}
