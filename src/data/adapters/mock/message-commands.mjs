import {nextDemoDeliveryStatus} from "../../../domain/message-status.mjs";
/**
 * Adaptador temporário da demo para o catálogo mutável legado.
 * Nunca emite mensagens externas. Em implementação Core, autorização e
 * idempotência deverão ser verificadas no servidor.
 */
export function createMockMessageCommandRepository(conversations) {
  const find=id=>conversations.find(c=>c.id===id);
  const ensure=id=>{const c=find(id);if(!c)throw new Error("Conversa não encontrada");return c};
  const newId=()=>globalThis.crypto?.randomUUID?.()||"msg-"+Date.now()+"-"+Math.random().toString(36).slice(2);
  return {
    async send(id,message) {
      const c=ensure(id);
      if(!message||message.conversationId!==id||(!message.body?.trim()&&!message.file))throw new Error("Mensagem inválida");
      if(c.messages.some(m=>!Array.isArray(m)&&m.id===message.id))return {id:message.id};
      c.messages.push({...message});
      c.preview=message.body||(message.file?.kind==="audio"?"🎙 Mensagem de voz":"📎 "+message.file.name);c.time=message.time;
      return {id:message.id};
    },
    async forward(sourceId,ids,destinationIds,{time}={}) {
      const source=ensure(sourceId);
      const messages=ids.map(id=>source.messages.find(m=>!Array.isArray(m)&&m.id===id)).filter(m=>m&&!m.hidden&&!m.deletedAll);
      if(!messages.length||!destinationIds.length)throw new Error("Seleção inválida");
      let count=0;
      for(const id of [...new Set(destinationIds)]) {
        if(id===sourceId)continue;
        const target=ensure(id);
        for(const m of messages) target.messages.push({...m,id:newId(),conversationId:id,direction:"out",time,status:"sent",forwarded:true,reply:undefined,hidden:false});
        target.preview="↪ "+(messages.at(-1).body||messages.at(-1).file?.name||"Arquivo");
        target.time=time;count++;
      }
      return {messages:messages.length,destinations:count};
    },
    async cycleDemoStatus(id,messageId) {
      const c=ensure(id);
      const message=c.messages.find(m=>!Array.isArray(m)&&m.id===messageId);
      if(!message||message.direction!=="out"||message.hidden||message.deletedAll) throw new Error("Mensagem enviada não encontrada");
      message.status=nextDemoDeliveryStatus(message.status);
      return {id:message.id,status:message.status,simulated:true};
    },
    async retryDemo(id,messageId) {
      const c=ensure(id);
      const message=c.messages.find(m=>!Array.isArray(m)&&m.id===messageId);
      if(!message||message.direction!=="out"||message.status!=="failed"||message.hidden||message.deletedAll) throw new Error("Somente mensagens com falha podem ser simuladas novamente");
      message.status="sent";
      return {id:message.id,status:message.status,simulated:true};
    },
    async remove(id,ids,everyone) {
      const conversation=ensure(id);
      let count=0;
      for(const messageId of [...new Set(ids)]) {
        const m=conversation.messages.find(item=>!Array.isArray(item)&&item.id===messageId);
        if(!m)continue;
        if(everyone){m.body="Mensagem apagada";delete m.file;m.deletedAll=true}
        else m.hidden=true;
        count++;
      }
      return {count};
    }
  };
}
