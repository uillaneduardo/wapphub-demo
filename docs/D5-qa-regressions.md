# D5.1 — Revisão de regressões da demonstração

## Escopo
Esta entrega verifica por inspeção de código e testes automatizados os pontos sensíveis da D4: seleção multicanal, não lidos, mudança de perfil e atribuições, tema e carregamento dos módulos ES. Não equivale a uma homologação visual completa.

## Correções
1. **Seleção de canais** — `null` corresponde a todos os canais habilitados; `Set([])` corresponde a nenhum canal, nunca a todos. Quando a visão está em Todos e o usuário desmarca um canal, os demais continuam selecionados. Contador e texto refletem filtros ativos.
2. **Conversa ativa** — se a conversa deixa de pertencer aos canais filtrados ou de estar acessível ao perfil, ela é descartada e a interface volta à lista no mobile. Buscar, abrir detalhes e opções ficam desabilitados quando não há conversa.
3. **Não lidos** — a abertura inicial do mobile não marca a conversa como lida; somente a abertura efetiva a marca. No desktop, a conversa inicialmente visível pode ser marcada como lida.
4. **Aparência** — o shell e Configurações compartilham a mesma instância do módulo. Trocar o tema usa o estado atual, não uma cópia desatualizada. Falhas de armazenamento são tratadas sem impedir a montagem da aplicação. Texto antigo de protótipo removido da interface.
5. **Entrega de módulos ES** — arquivo `.mjs` servido com `application/javascript` e `X-Content-Type-Options: nosniff`. CI testa MIME, presença dos módulos, CSS, build e endpoint /health.
6. **Cache** — URLs versionadas da entrada e imports alterados para evitar referências antigas.

## Critérios de validação automatizada
- `node --test tests/*.test.mjs`: casos de filtro, role, perfil, busca, cabeçalho, acessibilidade estática e regressões D5.
- `node --input-type=module --check` para scripts JavaScript.
- Docker build e smoke test HTTP, incluindo respostas de módulos `.mjs` e seu Content-Type.

## Homologação visual pendente
Nenhum navegador integrado à execução atual garante a validação do site real. É necessário executar em:
- Mobile: 320px, 360px, 390px e 430px, em modo claro/escuro e retrato/paisagem;
- Desktop: Full HD, zoom 100% e 200% (incluindo foco e teclado);
- Atendimento: seleção todos/um/múltiplos/nenhum, busca, abrir conversa, responder/encaminhar, seleção múltipla e mensagens não lidas;
- AGENT: acessar `?diagnostics=1`, alterar perfil e confirmar revogação imediata de conversas não atribuídas;
- Admin: usuários/equipes, canais/providers, permissões e atribuições, editar contato com foto e perfil pessoal;
- Navegação: barra inferior, retorno da conversa, detalhes em tela inteira, Escape e ausência de overflow.

A etapa D5 só deverá ser encerrada depois de evidências reais dessa homologação; PR verde não comprova ausência de problemas visuais.

## Preparação PWA
Manter implantação HTTPS e componentes responsivos; criar futuramente manifesto, ícones e política de instalação. Não habilitar service worker/cache offline para conversas, fotos, anexos e dados pessoais sem definir segurança de armazenamento, expiração, logout e isolamento por organização. O manifesto não será habilitado nesta entrega.
