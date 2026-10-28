/**
 * Cache de leitura sincronizado com o adaptador. API futura deverá usar
 * comandos assíncronos e retornar snapshots sem expor estado mutável.
 */
export function createContactService(repository){
 if(typeof repository?.snapshot!=="function" || typeof repository?.save!=="function")throw new TypeError("ContactRepository inválido");
 let contacts=repository.snapshot();
 return Object.freeze({
  get(id){return {...(contacts[id]||{})}},
  async save(id,fields){
   const saved=await repository.save(id,fields);
   contacts=repository.snapshot();
   return {...saved};
  }
 });
}
