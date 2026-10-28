import {providerRepository as mockRepository} from "./adapters/mock/provider-repository.js?v=d6-3";
/**
 * Explicit adapter factory. API mode is intentionally unsupported until
 * the authenticated Core adapter is implemented; never fall back to mock.
 */
export function createProviderRepository(mode="mock"){
 if(mode==="mock")return mockRepository;
 throw new Error("Adaptador Core API ainda não configurado. Nenhum fallback para dados simulados.");
}
