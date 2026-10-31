/**
 * Leitura de histórico independente de DOM e de adaptador concreto.
 * @typedef {{conversationId:string,items:Array<object>,nextCursor:string|null}} MessagePage
 * @typedef {{listMessages:(id:string,opts:{before?:string|null,limit?:number})=>Promise<MessagePage>}} MessageHistoryRepository
 */
export function createMessageHistoryService(repository){
 if(typeof repository?.listMessages!=="function")throw new TypeError("MessageHistoryRepository.listMessages é obrigatório");
 return Object.freeze({
  async listMessages(conversationId,options={}){
   if(typeof conversationId!=="string"||!conversationId.trim())throw new TypeError("ID de conversa inválido");
   const result=await repository.listMessages(conversationId,options);
   if(!result||result.conversationId!==conversationId||!Array.isArray(result.items)||
      !(result.nextCursor===null||typeof result.nextCursor==="string")){
    throw new TypeError("Página de histórico inválida");
   }
   return result;
  }
 });
}

/**
 * Janela de histórico: carrega recente primeiro e expande sob demanda.
 * Token invalida leituras anteriores ao trocar de conversa ou iniciar outra consulta.
 * Não contém referências ao DOM e não cria fallback em caso de falha.
 */
export function createMessageHistoryWindow(service,{pageSize=60}={}){
 if(!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>1000)throw new RangeError("Tamanho da página inválido");
 let conversationId=null,items=[],nextCursor=null,generation=0,ready=false;
 const snapshot=()=>({conversationId,items:items.slice(),nextCursor,ready});
 const reset=id=>{generation++;conversationId=id;items=[];nextCursor=null;ready=false};
 async function load(id,mode="refresh"){
  if(id!==conversationId)reset(id);
  if(!id)return snapshot();
  const token=++generation;
  if(mode==="all" && !ready){
   const first=await service.listMessages(id,{limit:pageSize});
   if(token!==generation||conversationId!==id)return null;
   items=first.items;nextCursor=first.nextCursor;ready=true;
  }
  if(mode==="older" && (!ready||!nextCursor))return snapshot();
  if(mode==="all" && ready && !nextCursor)return snapshot();
  if(mode==="older"||mode==="all"){
   let cursor=nextCursor;
   let accumulated=items.slice();
   // Para pesquisa e salto a uma resposta, completar as páginas anteriores.
   do {
    const page=await service.listMessages(id,{before:cursor,limit:pageSize});
    if(token!==generation||conversationId!==id)return null;
    accumulated=[...page.items,...accumulated];
    cursor=page.nextCursor;
   }while(mode==="all"&&cursor);
   items=accumulated;nextCursor=cursor;ready=true;
   return snapshot();
  }
  // Em atualizações de envio/exclusão, preservar a extensão já carregada.
  const length=Math.min(1000,Math.max(pageSize,items.length+1));
  const page=await service.listMessages(id,{limit:length});
  if(token!==generation||conversationId!==id)return null;
  items=page.items;nextCursor=page.nextCursor;ready=true;
  return snapshot();
 }
 return Object.freeze({load,reset,snapshot});
}
