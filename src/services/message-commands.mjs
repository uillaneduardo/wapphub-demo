/**
 * Comandos de mensagens: contrato assíncrono, sem DOM ou dependência de mock.
 * O backend deverá revalidar permissões, ownership e organização no futuro.
 */
export function createMessageCommandService(repository) {
  for (const name of ["send","forward","remove"]) {
    if (typeof repository?.[name] !== "function") throw new TypeError("MessageRepository."+name+" é obrigatório");
  }
  return Object.freeze({
    send: (conversationId, message) => repository.send(conversationId, message),
    forward: (sourceId, ids, destinationIds, metadata) => repository.forward(sourceId, ids, destinationIds, metadata),
    remove: (conversationId, ids, everyone) => repository.remove(conversationId, ids, everyone)
  });
}
