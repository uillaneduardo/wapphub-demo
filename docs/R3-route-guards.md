# R3 — Proteção de rotas e conclusão do roteamento SPA

## Escopo
Validação de caminhos profundos e permissões **demonstrativas** antes de montar a tela, com comportamento previsível de Voltar/Avançar e mensagens de acesso restrito ou página inexistente. Não substitui RBAC real do WappHub Core.

## Guard de navegação
`src/router/guards.mjs` exporta `checkRouteAccess(route,{conversations,canAccess,channels,role})`, função pura sem DOM, API nem storage.
- Conversa, detalhes, contato e filtro de mídias com ID inexistente → página não encontrada (404 lógico na UI).
- ID existente, mas conversa não atribuída ao AGENT ou canal desabilitado → **Acesso restrito**. Não exibir nome, telefone, histórico ou anexos.
- AGENT → Configurações > Aparência permitido; demais seções administrativas proibidas. A rota `/settings` redireciona para `/settings/appearance` quando perfil AGENT.
- OWNER/SUPERVISOR → seções de configurações existentes permitidas no demonstrativo.
- Filtros de mídia com tipos desconhecidos ou busca superior a 160 caracteres → rota inválida.
- Dashboard e listagem de contatos só utilizam conversas visíveis no perfil/canais habilitados, evitando contagens indevidas.

Mudanças de role, atribuições ou estado dos canais disparam nova avaliação da rota atual. A interface limpa uma conversa que não pode mais ser aberta, sem manter histórico/compositor visível. Esta verificação é somente de UX; o Core precisará rejeitar toda consulta/ação de API sem permissão.

## Nginx
As páginas SPA recebem `index.html` em deep links. Assets inexistentes terminados em extensões de JS/CSS, imagens, documentos, fontes e vídeo/áudio retornam 404, sem entregar HTML indevidamente. Cabeçalhos CSP e `/health` permanecem intactos.

## Histórico e deep links
Navegação via `history.pushState` / `replaceState`; `popstate` reavalia a URL, refaz a seleção e atualiza o título do documento. `/inbox/:id` abre conversa; `/inbox/:id/details` abre detalhes; Voltar no Android retorna à rota anterior. O módulo Mídias aceita `conversation`, `type`, `q`; filtros têm identidade serializável na URL.

## Matriz de homologação
1. Links diretos de cada tela e seção, refresh F5, histórico Voltar/Avançar desktop e Android.
2. Abrir Inbox → conversa → detalhes → voltar → Inbox e conferir presença/ausência do painel.
3. Mídias: filtrar conversa e categoria; navegar para outra rota e retornar, restaurando filtros da URL; pesquisar sem perder o foco.
4. Perfil, Contatos e contato específico: editar e voltar; endereço não deve expor dados pessoais.
5. `?diagnostics=1`: selecionar AGENT, tentar abrir URL de conversa não atribuída, contato correspondente e filtro de mídia: deve mostrar Acesso restrito sem dados. OWNER deve continuar vendo rotas permitidas.
6. Desabilitar canal/alterar atribuição enquanto rota da conversa está aberta e verificar revogação do acesso.
7. Endereços inexistentes e filtros inválidos devem mostrar 404 amigável; `/assets/arquivo-inexistente.png` deve retornar HTTP 404 no Nginx.
8. Verificar controle de foco, estados vazios, tema, mobile 320–430px e desktop Full HD.
9. Executar testes Node, validação sintática, Docker build e smoke no GitHub Actions antes do merge.

## Limites de segurança
**O navegador nunca autoriza operações reais.** O Core precisa conferir organização, usuário, papel, equipe, canal, conversa e escopo das mídias em cada endpoint e evento em tempo real. URLs só carregam IDs e filtros; não enviar números de telefone, tokens, mensagens ou segredos nas query strings.

## Próxima etapa fora do roteamento
Após os três PRs, mapear características ainda não atendidas nas diretrizes iniciais, comparar a demo à issue #61 e priorizar sem iniciar outras alterações sem escopo definido.
