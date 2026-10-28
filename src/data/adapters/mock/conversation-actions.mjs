/** Somente memória local. Estados não representam atendimento real. */
export function createMockConversationActionRepository(conversations) {
  if (!Array.isArray(conversations)) throw new TypeError("Conversas inválidas");
  const find = id => {
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) throw new Error("Conversa não encontrada");
    return conversation;
  };
  return {
    async markUnread(id) {
      const conversation=find(id);
      conversation.unread=1;
      return {id,unread:conversation.unread};
    },
    async setAttendanceStatus(id,status) {
      if (!["Finalizado","Em atendimento"].includes(status)) throw new Error("Status de atendimento inválido");
      const conversation=find(id);
      conversation.status=status;
      return {id,status:conversation.status};
    }
  };
}
