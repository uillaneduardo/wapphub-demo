# D4.5.2 — Refinamento mobile e busca de mensagens

## Contexto
Correção visual derivada de capturas reais do celular. Preservar o design neutro baseado em shadcn, os ícones Lucide, a navegação inferior e o comportamento da versão desktop.

## Configurações mobile
- A antiga lista de abas horizontal era cortada quando o usuário rolava até Canais/Providers. Foi substituída por um **seletor nativo compacto de seção**, enquanto o desktop mantém a navegação lateral.
- Linhas de equipes, membros, convites, canais e providers usam um **grupo de ações** para alinhar estado e botões consistentemente.
- Em celular, informações ocupam a primeira linha; botões ficam agrupados à direita abaixo das informações, sem sobreposição nem quebra arbitrária de alinhamento.
- Nomes, e-mails e descrições longos fazem quebra de texto dentro do card, sem estouro horizontal.

## Busca nas mensagens
- O botão de lupa do cabeçalho abre uma **barra de busca integrada ao WappHub**, abaixo do cabeçalho da conversa.
- Filtro ao digitar, contagem de resultados, opção Limpar, opção Fechar e suporte a Escape; a busca não abre mais `window.prompt` do navegador.
- Resultados vazios usam o estado vazio existente. Ao fechar, o histórico completo volta a ser exibido.
- Mudança de conversa encerra busca para evitar vazamento de estado entre conversas.
- No mobile a caixa e ações se distribuem em duas linhas discretas, com espaços adequados para toque; desktop usa a mesma função em uma linha.

## Homologação
1. Mobile 320 / 360 / 390 / 430 px: alternar as seis seções por select, confirmar que o título não é cortado.
2. Em Usuários e equipes: botões Editar alinhados consistentemente; testa nomes/e-mails longos.
3. Em Canais: botão Editar e habilitar/desabilitar agrupados abaixo da informação; sem overflow.
4. Em Providers: ambos botões Editar alinhados no mesmo local.
5. Na conversa: abrir busca com a lupa, digitar texto existente, confirmar contagem e filtragem.
6. Consultar termo inexistente, conferir estado vazio, limpar, fechar e retornar ao histórico.
7. Trocar conversa com busca ativa e verificar que foi resetada.
8. Confirmar funcionamento dos temas claro/escuro, teclado e navegação inferior.
9. Desktop: menu lateral das configurações e pesquisa inline funcionais.

## Testes automatizados
`node --test tests/*.test.mjs` e sintaxe JS no workflow CI. Build Docker e smoke test antes de publicação e deploy do homelab.
