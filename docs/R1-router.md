# R1 — Router nativo do WappHub Demo

Stack preservada: HTML5, CSS puro e ES Modules JavaScript Vanilla. Sem servidor de renderização, dependência de router ou alteração da camada de dados.

## Rotas principais
`/` redireciona por `replaceState` para `/inbox`. `/inbox`, `/dashboard`, `/contacts`, `/media`, `/settings` e `/profile` exibem os módulos existentes. Caminhos desconhecidos têm uma tela amigável de página não encontrada. A atualização do navegador e links diretos funcionam com fallback para `/index.html`.

`src/router/routes.mjs` implementa o contrato puro `parseRoute()/pathFor()`; `src/router/router.js` gerencia `pushState`, `replaceState`, `popstate` e links internos; `src/main.js` conecta a navegação principal. A URL é a fonte de verdade do módulo ativo.

## Infra
- `<base href="/">` evita quebrar referências a CSS, JS e imagens ao carregar `/settings`, etc.
- `location / { try_files $uri $uri/ /index.html; }` dá suporte a deep links.
- As extensões estáticas continuam verificadas com `try_files $uri =404`, sem retornar o HTML como mídia inexistente.
- Preservados CSP, headers, /health e o build estático Nginx.

## Etapas seguintes
- R2: parâmetros de conversa, detalhes, filtros de mídia e sub-seções de Configurações, preservando o histórico no mobile.
- R3: proteção de rotas da demo, 404/acesso negado, hardening e documentação de comportamento.
Os guards de interface não são substitutos da autorização do Core.

## Aceite
`node --test tests/*.test.mjs`, Docker build, Nginx, /health e smoke; validar `/inbox`, `/dashboard`, `/contacts`, `/media`, `/settings`, `/profile` por acesso direto, voltar/avançar e refresh no desktop e mobile.
