# WappHub Demo

Demonstração estática da experiência WappHub para homologação da interface e preparação de integração com WappHub Core.

**Stack:** HTML5, CSS puro, JavaScript Vanilla com ES Modules, Nginx e Docker. Sem React, Vue, Angular ou API obrigatória.

## Rotas principais
- Caixa de entrada: /inbox, /inbox/:conversationId e /inbox/:conversationId/details
- Visão geral: /dashboard
- Contatos: /contacts e /contacts/:contactId
- Biblioteca: /media?conversation=...&type=...
- Configurações: /settings/organization, /settings/team, /settings/permissions, /settings/channels, /settings/providers e /settings/appearance
- Providers D6: /settings/providers/new e /settings/providers/:id, com abas /session, /channels, /diagnostics e /events
- Meu perfil: /profile

## Arquitetura
Interface → Services → contrato do Repository → adaptador mock. A migração global dos módulos legados está planejada na issue #61. O domínio de Providers já tem services, contratos puros e fixtures isoladas.

**Dados de Providers são 100% fictícios.** Não há conexão real com WhatsApp, QR escaneável, autenticação real ou telemetria. Não inserir tokens/chaves de produção. Permissões reais devem ser aplicadas pelo Core.

Persistência antiga de canais/providers (wapphub-demo-channels-v2) é preservada. Conexões demonstrativas D6 são armazenadas separadamente em wapphub-demo-provider-connections-v1.

## Testes e publicação
Execute os testes com Node: node --test tests/*.test.mjs. GitHub Actions valida JavaScript, Docker build e smoke HTTP. Publicação GHCR e deploy central devem ser confirmados no workflow do homelab-deploy.

O Nginx usa fallback SPA para páginas, e devolve 404 para assets inexistentes.

## Documentação
- [D8.3 — Persistência consistente em Providers e preferências](docs/D8-3-persistence-consistency.md)
- [D6.1 — Contratos](docs/architecture/D6-1-provider-contracts.md)
- [D6.2 — Lista e assistente](docs/D6-2-provider-interface.md)
- [D6.3 — Detalhes](docs/D6-3-provider-details.md)
- [D6.4 — Matriz de QA](docs/D6-4-qa.md)
- [Roteamento SPA](docs/R1-router.md)
- [Arquitetura pendente #61](https://github.com/uillaneduardo/wapphub-demo/issues/61)
- [Homologação visual #49](https://github.com/uillaneduardo/wapphub-demo/issues/49)
