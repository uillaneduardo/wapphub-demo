/**
 * Normalização única dos dados fictícios no bootstrap.
 * Preserva a referência das conversas, consumida por módulos legados.
 * Nunca deve ser invocada por componentes ou a cada renderização.
 */
export function normalizeMockConversations(conversations) {
  if (!Array.isArray(conversations)) throw new TypeError("Conversas inválidas");
  for (const conversation of conversations) {
    if (!conversation || typeof conversation.id !== "string" || !Array.isArray(conversation.messages)) {
      throw new TypeError("Conversa mock inválida");
    }
    conversation.messages = conversation.messages.map((value, index) => {
      const item = Array.isArray(value)
        ? {direction:value[0], body:value[1], time:value[2], status:"sent"}
        : value;
      if (!item || typeof item !== "object") throw new TypeError("Mensagem mock inválida");
      item.id ??= "demo:"+conversation.id+":"+index;
      item.conversationId = conversation.id;
      return item;
    });
  }
  return conversations;
}
