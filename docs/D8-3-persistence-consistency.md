# D8.3 — Consistência transacional da persistência mock (#61)

## Escopo

A demo continua HTML/CSS/JS Vanilla, estática e desconectada do Core real. Esta fase complementa D8.2 e migra os três fluxos que ainda faziam acesso direto ao armazenamento:

| Módulo | Chave legada mantida | Política |
| --- | --- | --- |
| `src/appearance.js` | `wapphub-demo-appearance-v1` | Não gravar ao carregar; persistir antes de aplicar tema, acento, animação e blur |
| `src/media-visibility-store.js` | `wapphub-demo-media-blur-v1` | Persistir override de mídia antes de atualizar cache/emissão de evento |
| `src/data/adapters/mock/provider-repository.js` | `wapphub-demo-provider-connections-v1` | Retornar erro e restaurar estado anterior em qualquer falha de gravação |

Os três reutilizam `src/data/adapters/mock/storage.mjs`, introduzido em D8.2. Nenhuma chave é renomeada ou apagada; fixtures D6 e registros personalizados seguem intactos.

## Semântica de gravação

1. Leitura com armazenamento indisponível, ausente ou inválido mantém os defaults demonstrativos, sem sobrescrever as preferências antigas.
2. Escrita bem-sucedida confirma a alteração, atualiza a memória e emite o evento de UI.
3. Bloqueio por privacidade, quota ou erro de serialização rejeita a operação. **Não há confirmação falsa**, mutação residual de estado de provider nem perda de alterações anteriores.
4. Em Providers, criação, edição, status de serviço, sessão, associações de canais e log ilustrativo de eventos retornam ao snapshot anterior em caso de falha. As notificações de sucesso só ocorrem após a persistência.
5. Controles de aparência e blur indicam erro sem alterar a opção efetivamente aplicada; no blur, o aviso reutiliza a região de toast existente.

**Limites:** a implementação é mock/localStorage e não possui transação de banco real, controle de concorrência entre abas, assinatura de eventos em tempo real, nem autenticação/autorização de produção. O Core será a fonte autoritativa dessas operações no futuro.

## Validação

- `node --test tests/*.test.mjs` (inclui `tests/d8-3-preferences-providers.test.mjs`).
- CI: sintaxe JS/MJS, build Docker e smoke de Nginx.
- Homologação manual: recarregar preferências antigas, editar Providers, simular armazenamento bloqueado/quota, conferir que os estados e eventos não avançam e que o aviso aparece. Verificar Android/desktop e confirmar deploy central no homelab (#49).

## Próxima migração

Continuar #61 com separação dos estados de mensagens e conversas ainda acoplados a `src/d2.js`, `src/main.js` e aos arrays da demo. Preservar contratos assíncronos, IDs, canais e comportamentos homologados antes de introduzir qualquer adaptador Core API.
