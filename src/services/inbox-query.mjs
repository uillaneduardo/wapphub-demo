import {filterInboxConversations} from "../domain/conversation-query.mjs";

/**
 * Interface de consulta de Inbox independente da origem.
 * @typedef {{list:()=>Promise<Array<object>>,get:(id:string)=>Promise<object|null>}} InboxQueryRepository
 *
 * Os predicados de permissão pertencem somente ao mock. Num adaptador de
 * produção, os resultados devem ser autorizados pelo Core, nunca por esse
 * filtro client-side. Um erro de leitura é propagado; não há fallback mock.
 */
export function createInboxQueryService(repository){
  if(typeof repository?.list!=="function"||typeof repository?.get!=="function"){
    throw new TypeError("InboxQueryRepository inválido");
  }
  return Object.freeze({
    async list(criteria){
      const rows=await repository.list();
      if(!Array.isArray(rows))throw new TypeError("Consulta retornou formato inválido");
      return filterInboxConversations(rows,criteria);
    },
    async get(id){
      if(typeof id!=="string"||!id.trim())throw new TypeError("ID de conversa inválido");
      return repository.get(id);
    }
  });
}
