import {createProviderRepository} from "../data/create-provider-repository.js";
/**
 * Services are the only dependency used by provider screens.
 * Inject a compatible repository for Core API integration in the future.
 */
export function createProviderService(repository){
 if(!repository)throw new Error("Repositório de Providers obrigatório.");
 return Object.freeze({
  listTypes:()=>repository.listTypes(),
  listConnections:filters=>repository.listConnections(filters),
  getConnection:id=>repository.getConnection(id),
  createConnection:command=>repository.createConnection(command),
  updateConnection:(id,command)=>repository.updateConnection(id,command),
  setConnectionState:(id,state)=>repository.setConnectionState(id,state),
  updateSession:(id,command)=>repository.updateSession(id,command),
  assignChannels:(id,ids)=>repository.assignChannels(id,ids),
  getHealth:id=>repository.getHealth(id),
  listEvents:id=>repository.listEvents(id),
  subscribe:listener=>repository.subscribe(listener)
 });
}
export const providerService=createProviderService(createProviderRepository("mock"));
