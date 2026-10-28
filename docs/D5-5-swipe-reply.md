# D5.5 — Arrastar para responder (mobile e desktop)

## Comportamento
- **Mensagem recebida** (`direction: "in"`): arrastar o balão para a **direita**.
- **Mensagem enviada** (`direction: "out"`): arrastar o balão para a **esquerda**.
- O gesto funciona com **toque, caneta ou botão principal do mouse**, usando Pointer Events (sem implementação separada por plataforma).
- Um ícone de resposta aparece progressivamente quando o arrasto começa; ao alcançar o limite de 62 px, o indicador muda para a cor de destaque. Ao soltar, o balão volta ao lugar, o compositor abre o rascunho de resposta e recebe o foco.
- Arrastos curtos, na direção errada ou verticalmente predominantes não geram resposta. Rolagem vertical continua nativa.
- Em telas touch, o gesto horizontal iniciado em áreas de texto do balão tem prioridade, sem interromper a rolagem da conversa.

## Restrições e alternativas
- O gesto é ignorado enquanto o usuário estiver no **modo de seleção múltipla**.
- O gesto não inicia sobre **botões, links, campo de texto, resposta citada, controles de áudio/vídeo, player, documentos e outros elementos interativos**, preservando play/pause, barras de duração, visualização de imagem e clique nas referências.
- O toque prolongado ainda permite abrir o menu contextual; ao começar um arrasto horizontal, o temporizador de toque prolongado é cancelado.
- A resposta continua acessível pelas opções de contexto e pelos botões desktop, sem depender de gestos.
- O movimento respeita `prefers-reduced-motion`. O feedback não utiliza faixas coloridas laterais, bordas duplas ou sombras.
- Quando a conversa muda, o gesto pendente é cancelado. Gestos descartados não disparam cliques ou seleção acidental.

## Organização do código
- `src/swipe-reply.mjs`: regras puras para eixo, direção, deslocamento e ativação (12 px para início horizontal, 62 px para executar resposta, limite visual de 86 px). Não acessa DOM, armazenamento ou Core.
- `src/swipe-reply.js`: eventos do navegador e UI temporária; recebe `{area,onReply,isSelectionActive,onGestureStart}`; não conhece as entidades do provider ou persistência.
- `src/d2.js`: conecta `onReply(id)` à mesma ação `action("reply",id)` existente, com a mesma estrutura `reply:{conversationId,messageId,...}`.
- `src/styles.css`: translação de balão e affordance visual.
- `index.html`: símbolo SVG de resposta reutilizável.

## Teste e homologação
1. Mobile Android: deslizar mensagem de entrada para a direita e saída para a esquerda, verificar rascunho/teclado.
2. Desktop: arrastar com mouse segurando botão esquerdo, testando ambas as direções.
3. Desktop touch/pen: repetir os gestos.
4. Arrastar verticalmente o histórico, sem ativar respostas.
5. Arrastar horizontalmente menos de 62 px: não ativar resposta.
6. Tocar no player, buscar posição do vídeo/áudio, abrir foto, clicar em citação de resposta: nenhuma dessas ações deve virar swipe.
7. Selecionar múltiplas mensagens e arrastar: não iniciar resposta.
8. Pressionar e segurar: menu contextual permanece acessível.
9. Trocar de conversa durante o gesto e verificar que o balão não fica deslocado.
10. Validar dark/light, 320–430 px, desktop Full HD e `prefers-reduced-motion`.

## Integração futura
Não requer endpoint novo. A interface continuará chamando a ação responder fornecendo o `messageId` e `conversationId` originais; o Core deve validar a referência e a permissão quando a mensagem for efetivamente enviada.
