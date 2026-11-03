# Edição de mensagens e inventário de estados da UI

## Escopo da entrega

Ações da demo: opção **Editar mensagem** no menu contextual de mensagens de texto de saída, diálogo com texto atual, comando assíncrono com revisão esperada e rótulo **Editada** no balão. A opção **Detalhes da mensagem** abre uma linha do tempo com todas as versões preservadas, texto, data e hora. O mock não transmite nem persiste essas edições fora da sessão da página.

O comando mock impede editar entrada, mídia, mensagem encaminhada, apagada ou oculta. O corpo deve ter 1–4096 caracteres após trim; textos idênticos e versões concorrentes são recusados. Não há limite temporal no mock: a política por tipo de provider será definida no Core. No envio real, direction=out não é prova de autoria; verificar senderUserId, organização, permissões e capacidades da conexão no backend.

## Contrato recomendado para o Core

- `Message`: id, organizationId, conversationId, senderUserId, providerConnectionId, providerMessageId opcional, body, createdAt, editedAt nullable, revision, editable, editPolicy, status.
- `MessageRevision`: messageId, revision, body, changedAt, changedByUserId, source, immutable; revisão 1 corresponde ao conteúdo original.
- `PATCH /api/v1/conversations/{conversationId}/messages/{messageId}`: corpo `{body,expectedRevision}`; validar autorização, tipo, política/tempo e idempotência; retornar 409 por revisão divergente, 403 por ausência de acesso, 422 por conteúdo inválido.
- `GET /api/v1/conversations/{conversationId}/messages/{messageId}/revisions`: páginas imutáveis, ordenadas, acessíveis somente a leitores autorizados conforme política da organização.
- Evento `message.updated`: organizationId, conversationId, messageId, revision, editedAt, changedFields, eventId, sequence. Reconexão usa cursor de eventos; não confiar na entrega do WebSocket como persistência.
- Se provider externo não aceitar editar, a API deve rejeitar claramente. Se a edição externa falhar, não apresentar estado confirmado indevidamente. Especificar estados pendente/confirmado/falha no adaptador.

## Matriz de estados que a API precisará atender

| Domínio | Estados / transições | Estratégia |
| --- | --- | --- |
| Mensagem enviada | draft, pending, accepted, dispatched, delivered, read, failed, retrying | POST + WebSocket; sincronizar cursor |
| Edição | idle, editing, submitting, confirmed, conflict, rejected, failed | PATCH + message.updated |
| Mensagem recebida | received, unread, read, deleted, expired | HTTP paginado + WebSocket |
| Anexos | selected, uploading, processing, available, failed, expired | HTTP para upload e status; evento de conclusão |
| Conversa | open, assigned, unassigned, archived, closed, unread | HTTP + WebSocket |
| Participante | active, removed, left, typing, online, offline | HTTP para membros, WebSocket efêmero para presença |
| Provider | enabled, disabled, awaiting_auth, connecting, connected, syncing, degraded, disconnected, failed | HTTP para configuração, eventos para estado e health |
| Rede cliente | online, reconnecting, offline, resyncing, stale | WebSocket + resync HTTP |
| Autorização | allowed, denied, expired, revoked | Core autoritativo; evento para invalidar estado |

Estados acima são proposta de contrato, não uma afirmação de implementação no Core. Separar status de entrega, processamento do Provider, sessão de transporte e estado da conversa. Para mudanças externas, usar capabilities por tecnologia/conexão.

## QA

- Editar texto próprio, salvar e confirmar rótulo, versão 1 original e versão 2 editada.
- Editar novamente e manter todas as revisões ordenadas e os horários ISO UTC formatados em pt-BR.
- Verificar mensagem recebida, mídia, encaminhada e excluída sem edição disponível.
- Trocar de conversa durante a edição e não executar comando na conversa errada.
- Testar conflitos de revisão e erro sem falso sucesso.
- Validar responsividade, teclado, tema claro/escuro, seleção, menus e histórico paginado.
- Antes de produção: persistir no Core, auditar autor, aplicar limites por provider e verificar reconciliação em múltiplos clientes.
