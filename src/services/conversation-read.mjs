/**
 * Contrato incremental de leitura de conversas na demo.
 * A interface recebe comandos, sem alterar diretamente entidades.
 * O adaptador mock ainda opera sobre o estado legado, preservando referências
 * utilizadas por outras telas. Na migração da issue #61, substituir somente o
 * adaptador; a interface não deve depender desta implementação.
 * @typedef {{ markRead(conversationId: string): Promise<{id:string,unread:number}> }} ConversationReadRepository
 */
export function createConversationReadService(repository) {
  if (!repository || typeof repository.markRead !== "function") {
    throw new TypeError("ConversationReadRepository.markRead é obrigatório");
  }
  return Object.freeze({
    async markRead(conversationId) {
      if (typeof conversationId !== "string" || !conversationId.trim()) {
        throw new TypeError("ID de conversa inválido");
      }
      return repository.markRead(conversationId);
    }
  });
}
