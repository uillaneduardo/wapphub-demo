# Compositor de voz (demo) — v2

O microfone do compositor usa captura local e grava trechos reais pelo navegador. Esta funcionalidade não envia ao WhatsApp, usa o adaptador mock da demonstração.

## Fluxo
1. **Microfone:** solicitar autorização e iniciar uma gravação, com tempo decorrido e barras responsivas ao volume do microfone enquanto a captação estiver ativa.
2. **Pausar:** encerra e decodifica o trecho atual, mantendo-o no rascunho. O usuário pode **ouvir, pausar a escuta e navegar pelo tempo** do áudio parcial, com duração finita e barra de progresso.
3. **Retomar:** inicia um novo trecho no mesmo rascunho. O trecho pausado continua preservado e a duração exclui intervalos de pausa.
4. **Lixeira:** descarta todos os trechos, interrompe o microfone e libera URLs.
5. **Enviar:** tanto gravando quanto pausado, **finaliza e envia diretamente**, sem etapa adicional de stop ou prévia obrigatória. Os segmentos decodificados são concatenados em um WAV PCM mono 16 bits (seekable) antes do envio simulado. A mensagem aparece na conversa e na biblioteca de mídias.

O botão de envio de **texto** permanece inativo enquanto a gravação estiver ativa. O microfone é liberado no descarte, troca de conversa, perda de permissão, saída da página e após o envio. O compositor segue as restrições de envio da demo.

## Player e swipe
O player de áudio usa duração real da mídia; se ela estiver indefinida ou infinita (WebM do MediaRecorder), tenta a duração registrada na mensagem e o intervalo seekable do navegador. A posição é atualizada também entre os eventos timeupdate. A onda sonora **decorativa e fixa foi removida** das mensagens enviadas/recebidas; permanecem controles reais de play, progresso, duração e velocidade.

O gesto de arrastar para responder pode começar em toda a linha da mensagem, inclusive em áreas de áudio não interativas. Preserva os sliders de busca de áudio, links, vídeo, texto editável e ações individuais. A intenção horizontal só é bloqueada após deslocamento suficiente, preservando a rolagem vertical.

## Homologação Android + desktop
- Gravar, pausar por mais de 10s e retomar; verificar que o intervalo não cresce enquanto pausado.
- Em pausa, reproduzir o trecho parcial e mover o seek para metade e fim.
- Enviar diretamente durante a gravação e diretamente da pausa; conferir o player da mensagem enviada, duração correta e bolinha acompanhando o áudio.
- Verificar que o desenho de onda fictícia desapareceu das mensagens já enviadas.
- Descartar e trocar de conversa durante a captura; verificar liberação do microfone.
- Arrastar para responder a partir do corpo da mensagem ou espaço ao redor de um áudio; controles de play e da barra continuam utilizáveis.
- Testar acesso ao microfone negado, ausência de suporte, modo escuro, largura de 360px e movimento reduzido.

**Limitação:** a navegação do áudio ainda em gravação exige tocar em **Pausar**, porque o navegador precisa finalizar o trecho corrente antes de decodificar e criar uma mídia navegável. Na retomada, a gravação continua do ponto pausado. O WAV garante navegação no arquivo final, mas utiliza mais memória que um formato compactado. Os dados da demo são temporários.
