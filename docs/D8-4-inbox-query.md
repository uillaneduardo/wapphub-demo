# #61 — Consulta assíncrona da Inbox (migração incremental)

## Objetivo e limite

A Inbox passa a consumir `createInboxQueryService` em vez de filtrar diretamente `src/data.js`. O serviço recebe um contrato de repositório assíncrono; na demo ele usa `createMockInboxQueryRepository` e continua totalmente local. Não há integração com Core, autorização real nem mudança no layout.

Este PR **não conclui** as fases B/C de #61. Conversas abertas e histórico continuam consumindo o estado legado para manter os fluxos homologados, e a migração desses módulos deve ocorrer em PRs separados.

## Implementação

- `src/data/adapters/mock/inbox-query.mjs`: `list(): Promise<ConversationSummary[]>` e `get(id): Promise<ConversationSummary|null>`. Projeta campos de metadados para novos objetos sem expor `messages` ou referências mutáveis.
- `src/services/inbox-query.mjs`: aplica o contrato de filtro no domínio existente; propaga erros de leitura e valida respostas.
- `src/main.js`: renderiza a lista e revalida canais pelo serviço. Contadores, identificação de canal, filtros por busca, não lidas e atribuídas usam summaries retornados.
- Requisições assíncronas carregam número de geração; respostas antigas não sobrescrevem resultados de filtros mais recentes.
- Falha no repositório exibe mensagem clara na Inbox e feedback, **sem** trocar silenciosamente para o mock.
- Nenhuma alteração em chaves de armazenamento local. A normalização das mensagens, estado de leitura, contatos, ações e arquivos existentes é preservada.

## Contrato futuro Core

O transporte deverá fornecer `list` / `get` por conexão/usuário autenticado, com filtros e paginação no servidor; UI nunca deve decidir autorização. Os predicados `canAccess` e permissões aqui são exclusivamente ilustrativos do mock. Estados `loading`, `error` e `retry` serão consolidados quando o adaptador HTTP/WebSocket existir. **Não** incluir tokens de produção ou dados do WhatsApp na demo.

## Homologação

1. Abrir /inbox no desktop e no Android; conferir 56 conversas e canal/origem.
2. Alternar “Todas”, “Não lidas”, “Minhas”; pesquisar por nome ou telefone.
3. Selecionar 1 canal, vários canais, nenhum canal e voltar a todos; lista e conversa ativa devem permanecer coerentes.
4. Verificar atribuições (OWNER/SUPERVISOR/AGENT, sem conversas não atribuídas para AGENT), contador de não lidas ao abrir, “Marcar como não lida”.
5. Enviar texto e áudio e conferir atualização da prévia, player e detalhes; não perder mensagens.
6. Trocar filtros rapidamente e assegurar que uma consulta antiga não repõe resultado incorreto.
7. Recarregar rotas profundas e voltar/avançar; testar filtros após alterações de canal.
8. Repetir com 320/360/390/430px e FullHD, dois temas e estado de conexão indisponível no diagnóstico.

## Próxima entrega #61

Migrar seleção/histórico de mensagens para serviço de leitura e snapshots paginados, preservando referências de mídia, funcionalidades de reply, encaminhamento, exclusão e scroll. Em seguida separar canais/atribuições do estado global e formalizar o adapter Core **sem ativá-lo na demo**.
