# R2 — Rotas profundas e parâmetros das telas

Extensão incremental do router Vanilla JS da R1, sem biblioteca de rotas nem backend.

## Convenções

| URL | Comportamento |
|---|---|
| `/inbox` | Caixa de entrada; no mobile exibe a lista |
| `/inbox/:conversationId` | Conversa aberta, inclusive após refresh |
| `/inbox/:conversationId/details` | Abre detalhes da conversa |
| `/contacts` | Lista de contatos |
| `/contacts/:contactId` | Informações e edição do contato |
| `/media?conversation=ID&type=video&q=texto` | Biblioteca com filtros inicializados pela URL |
| `/settings/organization` | Organização |
| `/settings/team` | Usuários e equipes |
| `/settings/permissions` | Permissões e atribuições |
| `/settings/channels` | Canais |
| `/settings/providers` | Providers e integrações |
| `/settings/appearance` | Aparência |

As rotas de contato usam os IDs de exemplo das conversas; o Core terá IDs estáveis de contatos próprios no futuro.

## Navegação e estado
- Clicar uma conversa escreve a rota no histórico; Voltar no Android ou no navegador devolve a tela anterior. O botão interno Voltar leva a `/inbox`.
- Abertura e fechamento dos detalhes geram URLs distintas e respondem a `popstate`.
- O botão **Ver todas as mídias** navega a `/media?conversation=...`.
- Na biblioteca, seleção de conversa e tipo cria entrada de histórico; pesquisa digita usando `replaceState`, sem refazer o campo nem perder o foco.
- Configurações atualiza o caminho ao trocar seção por menu desktop ou select mobile; links diretos inicializam a seção correta.
- Contatos tem rota específica, botão Voltar e Editar, preservando a mesma camada de dados simulados.
- O parser é puro em `src/router/routes.mjs`; navegação é responsabilidade de `src/router/router.js`; telas recebem opções/callbacks.
- Parâmetros de ID têm formato restrito: caracteres alfanuméricos, dois-pontos, underline e hífen; até 128 caracteres.

## R3 / limites
As telas ainda usam os objetos mock existentes. R3 verificará acesso, remoção/reatribuição, estados inválidos e navegação não autorizada. Filtros na UI são somente visuais; o Core será responsável pelo controle de acesso real.

## Homologação
Desktop e mobile: ir a cada URL diretamente, atualizar (F5), voltar/avançar, navegar para conversa, abrir/fechar detalhes, selecionar mídia por conversa/tipo e pesquisa, alternar abas das Configurações; verificar cabeçalho, botões e valores restaurados a partir do endereço.
