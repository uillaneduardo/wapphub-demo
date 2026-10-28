# Issue #61 — D7: normalização e ciclo de vida de mensagens (mock)

## Escopo desta entrega

- O bootstrap chama `normalizeMockConversations` **uma vez**, após `seedMediaFixtures`; a interface não normaliza dados ao renderizar ou buscar mensagens.
- O serviço de comandos expõe `cycleDemoStatus` e `retryDemo`. Os valores são exclusivamente ilustrativos, sem recibos, fila, entrega ou reenvio reais.
- O menu contextual oferece **Simular próximo estado** em mensagens de saída e **Simular reenvio** apenas quando o estado simulado é falha. As etiquetas deixam explícita a simulação.
- Marcar como não lida, encerrar e reabrir atendimento passam pelo contrato `ConversationActionService`, com adaptador mock e snapshots de retorno.
- A UI mantém a mesma estrutura e as permissões fictícias existentes.

## Contratos futuros do Core

A API real precisa usar comandos autorizados pelo servidor por organização, usuário, atribuição e estado da conversa. Status de entrega vem de eventos do provider, nunca de cliques para simular; reenvio exige idempotência, controle de duplicidade, confirmação de fila e correlação por mensagem. Os modelos atuais não garantem esses requisitos.

## Pendente na #61

Migração dos demais estados/fixtures, persistência única, assinatura de eventos, lista e detalhes de conversas e isolamento de perfil/contatos. A homologação visual Android/desktop e o deploy no homelab permanecem nas issues #49/#70.

## Testes

`node --test tests/*.test.mjs`, validação de sintaxe de todos os módulos, build Docker e smoke HTTP do CI. Confirmar manualmente: simular estado de uma mensagem enviada até falha; simular reenvio; encerrar/reabrir; marcar como não lida; atualizar rota e testar mídias, replies e seleção.
