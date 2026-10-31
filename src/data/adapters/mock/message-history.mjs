/**
 * Histórico simulado com cursor estável por ID, exclusivamente em memória.
 * A interface recebe cópias, nunca referências às mensagens do catálogo.
 * O Core real deverá filtrar por organização/usuário e validar o cursor.
 */
const prefix="before:";
const cloneMessage=message=>{
 if(!message||typeof message!=="object"||Array.isArray(message))throw new TypeError("Mensagem mock não normalizada");
 return structuredClone(message);
};
export function createMockMessageHistoryRepository(conversations){
 if(!Array.isArray(conversations))throw new TypeError("Conversas inválidas");
 return Object.freeze({
  async listMessages(conversationId,{before=null,limit=60}={}){
   if(typeof conversationId!=="string"||!conversationId.trim())throw new TypeError("ID de conversa inválido");
   if(!Number.isSafeInteger(limit)||limit<1||limit>1000)throw new RangeError("Limite inválido (1 a 1000)");
   const conversation=conversations.find(c=>c.id===conversationId);
   if(!conversation)throw new Error("Conversa não encontrada");
   const messages=conversation.messages;
   if(!Array.isArray(messages))throw new TypeError("Histórico inválido");
   let end=messages.length;
   if(before!==null){
    if(typeof before!=="string"||!before.startsWith(prefix))throw new TypeError("Cursor inválido");
    const id=decodeURIComponent(before.slice(prefix.length));
    end=messages.findIndex(m=>!Array.isArray(m)&&m.id===id);
    if(end<0)throw new Error("Cursor expirado");
   }
   const start=Math.max(0,end-limit);
   const items=messages.slice(start,end).map(cloneMessage);
   return {
    conversationId,
    items,
    nextCursor:start>0?prefix+encodeURIComponent(messages[start].id):null
   };
  }
 });
}
