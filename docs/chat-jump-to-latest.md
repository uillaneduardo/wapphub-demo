# UX — Voltar à mensagem mais recente

Implementação da navegação flutuante na demo WappHub, mantendo layout, tokens e padrões existentes.

## Comportamento
- Um botão circular de **seta para baixo** aparece no centro do painel, imediatamente acima do compositor, **somente quando a distância ao final ultrapassa 72px**. Some automaticamente quando se aproxima da mensagem mais recente.
- O clique percorre o histórico até a base com movimento suave; respeita o ajuste **Animações da interface** e `prefers-reduced-motion`.
- Ao abrir outra conversa, a visualização segue para a última mensagem; se o painel estava oculto no mobile, reaplica o alinhamento após o layout. Mudanças de tamanho do compositor e carregamento de imagens não deixam o final invisível.
- Ao ler o histórico, atualizações da mesma conversa preservam `scrollTop` (inclusive nova mensagem, status e seleção). Não há salto não solicitado para o final.
- A busca na conversa continua abrindo os resultados pelo início. O controle fica oculto quando não há conversa acessível ou rolagem possível e durante a barra de seleção de várias mensagens.

## Arquitetura
- `src/chat-scroll-policy.mjs`: regras puras de distância, limiar e destino.
- `src/chat-scroll.js`: controlador DOM com eventos de scroll, resize, imagens e preferência de movimento. Posiciona o botão conforme a altura real do compositor, sem mudar estrutura visual.
- `src/main.js`: captura a posição antes de `renderD2` e restaura ou acompanha a base após a reconstrução do histórico.
- `src/d2.js`: remove o scroll incondicional do render e informa quando a busca está ativa.
- `index.html` e `src/styles.css`: botão acessível com `aria-label`, `aria-controls`, foco por teclado, modo escuro e responsive.

## Roteiro de homologação manual (Android/desktop)
1. Abrir uma conversa com muitas mensagens: ir ao final e verificar que o botão não aparece.
2. Rolar mais de 72px para cima: botão centralizado acima do compositor. Clicar e confirmar rolagem ao final e desaparecimento.
3. Rolar para cima e disparar ações de mensagem/seleção, recebimento e atualização de mídia: leitura antiga deve permanecer no ponto, com botão disponível.
4. Alternar conversas e acessar diretamente `/inbox/mariana`: deve mostrar o final mesmo após thumbnails carregarem.
5. Abrir teclado Android, expandir o compositor e verificar que o botão permanece acima, sem encobrir o campo.
6. Ativar modo escuro, desativar animações e habilitar redução de movimento do SO: clique deve ir ao fim sem transição.
7. Buscar mensagens e marcar várias: botão não deve encobrir a barra de ações.

Sem alterações em Core, providers, storage ou mensagens reais. O usuário realiza homologação no navegador.
