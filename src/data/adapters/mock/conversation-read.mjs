/**
 * Ponte transitória para o estado legado da demo.
 * Não efetua persistência ou operações de rede. Retorna um snapshot,
 * não a referência mutável da conversa.
 */
export function createMockConversationReadRepository(conversations) {
  if (!Array.isArray(conversations)) throw new TypeError("Conversas inválidas");
  return {
    async markRead(id) {
      const conversation = conversations.find(item => item.id === id);
      if (!conversation) throw new Error("Conversa não encontrada");
      conversation.unread = 0;
      return { id: conversation.id, unread: conversation.unread };
    }
  };
}
