# D8.1 — Fixtures, consultas e identidade de contatos (#61)

## Implementação entregue

1. **Conversas:** fixture de demonstração realocada para `src/data/adapters/mock/fixtures/conversations.js`. `src/data.js` continua como reexportação compatível. IDs, canais, mensagens e referências compartilhadas são preservados para evitar regressões.
2. **Consultas:** `src/domain/conversation-query.mjs` oferece filtros puros reutilizados pela Inbox e pela tela Contatos. Visibilidade (filtro ilustrativo), canal habilitado, busca sem distinção de acentos, nomes/telefones e estados "não lidas"/"minhas" continuam suportados.
3. **Contatos:** leitura/gravação de `localStorage` retirada de `src/contact-identity.js`. Um serviço injetado pelo bootstrap fornece snapshots de identidade e gravação assíncrona via adaptador mock.
4. **Compatibilidade:** chave existente `wapphub-demo-contacts-v1` mantida; fotos e aliases previamente salvos são preservados. Erros de gravação aparecem no formulário existente, sem sucesso falso.

## Restrições e limites

- Ainda existem dependências de arrays legados em `pages.js`, `main.js`, `settings.js`, atribuições e módulo de mensagens. Esta etapa **não** conclui a migração arquitetural #61.
- Os filtros de acesso são apenas ilustrativos; Core é autoridade para RBAC, isolamento de organização e validação de comandos.
- Somente identidade local de contatos migrou para o adaptador; demais chaves de persistência são tratadas em PRs futuros.
- Não existe API de contatos ou sincronização com provider.

## Validação

`node --test tests/*.test.mjs` e CI: sintaxe JS/MJS, Docker build e smoke HTTP. Homologar no navegador: busca por acentos/telefone, contatos ocultos do AGENT, edição e recarga de alias/foto, proteção de drafts, canal desabilitado, layout mobile/desktop. A homologação visual e confirmação de deploy permanecem pendentes em #49.
