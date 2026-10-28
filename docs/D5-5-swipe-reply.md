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
- `src/swipe-reply.mjs`: regras puras para eixo, direção, deslocamento e ativação (8 px para início horizontal, 38 px para executar no touch ou 52 px no mouse/caneta, limite visual de 120 px). Não acessa DOM, armazenamento ou Core.
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

## Ajuste D5.5.1 — Homologação Android
O gesto anterior era encerrado prematuramente em alguns celulares porque a interpretação de rolagem e os `pointercancel` do navegador podiam interromper o arrasto. Além disso, o gatilho de 62 px exigia deslocamento excessivo.

- No mobile com suporte a Touch Events, eventos de `touchmove` são tratados com `passive:false` e `preventDefault()` **somente depois** de identificar um movimento horizontal intencional; rolagem vertical segue nativa. Mouse e caneta continuam com Pointer Events.
- O limite foi reduzido para **38 px no toque** e **52 px no mouse/caneta**. A translação máxima visual é de **120 px**.
- Ao alcançar o limite, a opção fica **armada** até a soltura mesmo se o dedo recuar ligeiramente, evitando perder a resposta por retorno curto. Arrastar para o lado errado, rolar verticalmente ou interromper o toque ainda cancela.
- Os controles de áudio/vídeo, botões, respostas citadas, links e o modo de seleção múltipla continuam excluídos.
- Arquivos JavaScript e CSS receberam nova versão na URL para impedir carregamento do gesto anterior pelo cache.

### Critérios práticos de homologação
No Android, abra uma mensagem de texto recebida e arraste **um pequeno trecho à direita**, até o indicador de resposta mudar de cor. Solte para abrir o rascunho de resposta. Repita para mensagens enviadas deslizando à esquerda, depois teste rolagem longa, gesto curto, áudio/vídeo e seleção múltipla. Se o navegador cancelar mesmo assim, registrar modelo do aparelho, navegador e gravação de tela com a sequência de movimento.
