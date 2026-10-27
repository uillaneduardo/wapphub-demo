export const enabledChannels = channels => channels.filter(c => c.id !== 'all' && c.enabled !== false);
export const normalizeSelection = (selection, channels) => {
  if (selection == null) return null;
  const enabled = new Set(enabledChannels(channels).map(c => c.id));
  const ids = [...new Set(selection)].filter(id => enabled.has(id));
  return ids.length ? new Set(ids) : null;
};
export const conversationMatchesChannels = (conversation, selection, channels) => enabledChannels(channels).some(c => c.id === conversation.channelId && (selection === null || selection.has(c.id)));
export const selectionLabel = (selection, channels) => {
  if (selection === null) return 'Todos os canais';
  const names = enabledChannels(channels).filter(c => selection.has(c.id)).map(c => c.name);
  return names.length === 1 ? names[0] : names.length + ' canais selecionados';
};
