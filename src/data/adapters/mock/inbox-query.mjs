/**
 * Leitura da Inbox simulada, sem DOM, sem persistência e sem provider.
 *
 * Não expõe mensagens nem referências dos objetos mutáveis legados.
 * A autorização real continua obrigatoriamente no WappHub Core.
 */
const META_FIELDS=[
  "id","name","initials","phone","photo","channelId","time","preview",
  "unread","assigned","assignedToMemberId","agent","status","subject"
];

export function createMockInboxQueryRepository(conversations){
  if(!Array.isArray(conversations))throw new TypeError("Conversas mock inválidas");
  const project=conversation=>{
    const result={};
    for(const key of META_FIELDS){
      const value=conversation[key];
      if(value===null||["string","number","boolean"].includes(typeof value))result[key]=value;
    }
    return result;
  };
  return Object.freeze({
    async list(){
      return conversations.map(project);
    },
    async get(conversationId){
      if(typeof conversationId!=="string"||!conversationId.trim())throw new TypeError("ID de conversa inválido");
      const found=conversations.find(item=>item.id===conversationId);
      return found?project(found):null;
    }
  });
}
