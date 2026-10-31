# D8.6 — Leituras de operações de mensagens

## Escopo

Após a paginação de histórico D8.5, os controles da conversa ainda consultavam as mensagens diretamente do array mutável. Esta etapa separa as consultas de operações, sem alterar o design.

- src/services/message-operation-query.mjs: contratos assíncronos getMessage, getMessages e listRecipients.
- src/data/adapters/mock/message-operation-query.mjs: mensagens por snapshots isolados e metadados projetados de destinatários.
- src/d2.js: contexto, resposta, cópia, reenvio, encaminhamento, referências citadas e validação de rascunho passam pelo serviço.
- src/main.js: serviço mock é injetado no módulo. Nenhuma requisição externa.
- MessageCommandService mantém a mutação de domínio para envio, reenvio, exclusão e encaminhamento.

A interface ainda lê metadados da conversa ativa para apresentação e RBAC simulado; não consulta diretamente as mensagens mutáveis para executar ações.

## Concorrência, erros e permissões

As consultas falhas retornam erro explícito e não usam fallback mock. Após consultas assíncronas, o identificador da conversa ativa é revalidado antes de abrir o menu ou agir. O encaminhamento consulta novamente os destinatários na confirmação.

**A demo não oferece autorização real.** Na produção, o Core deve autorizar identidade, organização, destinatários, exclusões, reenvios e idempotência. Nada aqui conecta o WhatsApp ou o Core real.

## Próximas etapas da issue #61

Concluir o desacoplamento dos metadados da conversa, consolidar estados de envio pendente/erro/rollback e migrar mídias e configuração remanescente. Depois formalizar adaptador Core com endpoints reais verificados, sem ativar na demo.

## Homologação

1. Enviar texto, emoji, áudio e anexo com e sem citação; confirmar prévia e player.
2. Responder a mensagem recente e antiga; carregar páginas anteriores e usar o salto por citação.
3. Abrir menu, copiar, simular falha/reenvio, excluir local e para todos.
4. Selecionar mensagens e encaminhar a vários destinatários; validar que aparecem apenas no destino.
5. Trocar de conversa rapidamente durante uma consulta ou com o modal de encaminhamento aberto.
6. Testar Android/desktop, tema claro/escuro e perfis simulados AGENT, OWNER e SUPERVISOR.

Testes automatizados e smoke HTTP não substituem a homologação visual no homelab.
