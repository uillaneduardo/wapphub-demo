# D6.4 — Matriz de qualidade e homologação

## Entregas do domínio Providers
**D6.1 (#73):** tipos de tecnologia, conexões da organização, fixtures, migração compatível e repository mock.
**D6.2 (#74):** lista, busca/filtros, assistente de quatro etapas, rotas SPA.
**D6.3 (#75):** edição, sessão/QR fictício, canais, diagnóstico e eventos.
**D6.4:** service desacoplado dos adapters concretos, verificação de sintaxe em todos os módulos JS/MJS, testes de persistência e documentação consolidada.

## QA funcional — a validar no navegador após deploy
- [ ] /settings/providers: lista as conexões preexistentes e exemplos Baileys/Cloud/Native, com status e filtro por nome/tipo/estado; refresh não repovoa configurações.
- [ ] /settings/providers/new: tecnologias, validação nome duplicado/curto, voltar e avançar; salvar mostra detalhes e não chama API real.
- [ ] /settings/providers/:id: alterar nome/equipe e recarregar.
- [ ] /session: QR ilustrativo **não escaneável**, expiração e renovação, ações de simulação e confirmação para desvinculação.
- [ ] /channels: associação de canais existentes sem duplicação, sem alterar o transporte técnico original.
- [ ] /diagnostics: status, métricas claramente rotuladas fictícias, sem promessas de saúde ou sincronização reais.
- [ ] /events: timeline de eventos da demo sem conteúdo privado.
- [ ] Navegação /settings/providers ↔ new ↔ :id ↔ tabs; reload/deep links, Voltar/Avançar Android e desktop.
- [ ] Perfil AGENT não administra Providers; OWNER/SUPERVISOR respeitam permissões demonstrativas (não substitui o Core).
- [ ] Dispositivos 320/360/390/430px e Full HD; sem overflow, contraste claro/escuro, alvos de toque, foco, zoom 200%, animações ON/OFF e movimento reduzido.
- [ ] Testar canal/provider legado salvo em localStorage e que os dados não são sobrescritos.

## CI
Automatizado: testes Node, checagem de sintaxe em todas as subpastas de src (JS/MJS), Docker build e smoke HTTP de rotas profundas. CI não executa testes visuais em navegador real, portanto os itens acima só devem ser marcados após homologação do usuário.

## Arquitetura pendente da issue #61
A nova UI de Providers depende exclusivamente de `providerService`, que delega para um contrato compatível com adaptadores mock/Core. O modo Core ainda **não está disponível**; tentar selecioná-lo gera erro explícito, sem fallback silencioso para mocks. Os módulos legados da Inbox, mensagens, contatos, equipes, canais e preferências continuam aguardando migração gradual B/C da #61. **Não considerar a #61 concluída**.

## Segurança
Nenhum QR, token, evento, número ou métrica da D6 é real. A simulação não constitui diagnóstico do provider, recuperação de mensagens ou autenticação efetiva. RBAC real e tenant isolation devem existir no Core.
