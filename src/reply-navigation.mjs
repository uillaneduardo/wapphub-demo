/**
 * Resolução de mensagens respondidas. Contrato independente de DOM,
 * armazenamento e do provider. A UI só navega após validar o escopo.
 */
export function resolveReplyTarget(conversation, reference) {
 if(!conversation || !reference || typeof reference.messageId!=="string")return null;
 if(reference.conversationId!==conversation.id)return null;
 const messages=conversation.messages||[];
 const message=messages.find(item=>!Array.isArray(item)&&item?.id===reference.messageId);
 if(!message||message.hidden)return null;
 return message;
}
