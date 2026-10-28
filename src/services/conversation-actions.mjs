/**
 * Contrato assíncrono de comandos demonstrativos de atendimento.
 * O futuro Core deve validar RBAC, organização e atribuição no servidor.
 */
export function createConversationActionService(repository) {
  for (const method of ["markUnread","setAttendanceStatus"]) {
    if (typeof repository?.[method] !== "function") {
      throw new TypeError("ConversationActionRepository."+method+" é obrigatório");
    }
  }
  return Object.freeze({
    markUnread: id => repository.markUnread(id),
    setAttendanceStatus: (id,status) => repository.setAttendanceStatus(id,status)
  });
}
