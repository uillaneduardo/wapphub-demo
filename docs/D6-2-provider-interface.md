# D6.2 — Interface de conexões e assistente

## Interfaces
`/settings/providers`: listagem compacta das conexões da organização com busca textual, filtro por tecnologia, filtro por estado, resumo e ação Nova conexão. **Todos os estados, métricas e dados são fictícios.** Busca/seleção atualiza a query string sem recarregar a aplicação.

`/settings/providers/new`: assistente com quatro passos: **Tecnologia → Identificação → Autenticação ilustrativa → Revisão e criação**. O formulário pede nome, descrição opcional e equipe. A etapa de autenticação esclarece o que Baileys (QR), Cloud API (credenciais) ou Native exigirão na integração futura, mas **não solicita credencial real**, não gera QR utilizável e não conecta a serviço.

`/settings/providers/:id`: rota de detalhes criada e guardada, com conteúdo expandido na D6.3. O botão de voltar à listagem funciona via History API.

## Contrato técnico
A UI usa apenas `providerRepository` (métodos assíncronos) e o catálogo de tipos; dados mock e storage ficam em `src/data/adapters/mock`. As preferências e canais existentes permanecem intocados. O assistente cria nova conexão inicialmente `not_configured`, sem vincular automaticamente nenhum canal. Estado do serviço ≠ sessão/autenticação ≠ sincronização ≠ canal.

## QA
CI Node, Docker build e smoke HTTP. Homologação adicional: abrir Nova conexão, escolher tecnologia, voltar entre passos, digitar campos, testar validação, verificar URL/reload, criar conexão e conferir persistência no navegador. Conferir 320–430px, zoom e teclado. PR D6.3 estenderá detalhes, sessão, canais, diagnóstico e eventos.
