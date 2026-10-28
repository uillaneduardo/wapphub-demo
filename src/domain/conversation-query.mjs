/**
 * Consultas puras para Inbox e contatos; não dependem do DOM, de storage
 * ou de mocks. A autorização real continua exclusivamente no Core.
 */
const fold=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR");
export function matchesContactSearch(conversation,query,nameOf=c=>c.name) {
  const text=fold(query).trim();
  if (!text) return true;
  const queryWords=text.split(/\s+/).filter(Boolean);
  const haystack=fold([nameOf(conversation),conversation.phone,conversation.preview].join(" "));
  return queryWords.every(word=>haystack.includes(word));
}
export function filterInboxConversations(conversations,{canAccess,channels,selectedChannels=null,filter="all",query="",nameOf,conversationMatchesChannels}) {
  if (!Array.isArray(conversations) || typeof canAccess!=="function" || typeof nameOf!=="function" || typeof conversationMatchesChannels!=="function") throw new TypeError("Consulta de conversas inválida");
  return conversations.filter(c=>
    canAccess(c) &&
    conversationMatchesChannels(c,selectedChannels,channels) &&
    (filter==="all" || filter==="unread"&&c.unread>0 || filter==="mine"&&c.assigned===true) &&
    matchesContactSearch(c,query,nameOf));
}
export function filterAccessibleContacts(conversations,{canAccess,channels,query="",nameOf}) {
  if (!Array.isArray(conversations)) throw new TypeError("Contatos inválidos");
  return conversations.filter(c=>canAccess(c)&&channels.some(channel=>channel.id===c.channelId&&channel.enabled!==false)&&matchesContactSearch(c,query,nameOf));
}
