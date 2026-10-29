# Compositor de voz (demo)

O compositor de /inbox/:conversationId permite gravar uma mensagem com o microfone local. Esta é uma **simulação de envio**; não chama o WappHub Core ou o provider Baileys.

## Fluxo e estados

- **Inativo**: microfone ao lado de Enviar; texto e anexos continuam com o fluxo existente.
- **Solicitando microfone**: o navegador pede permissão. Cancelar interrompe a solicitação lógica e descarta qualquer stream concedido depois.
- **Gravando**: status, ponto pulsante, duração real (sem tempo pausado), intensidade sonora quando Web Audio está disponível, botões de pausar, parar e descartar.
- **Pausado**: a gravação fica preservada em um único MediaRecorder; retomar continua no mesmo áudio, sem contabilizar a pausa.
- **Parando**: aguarda o último bloco do MediaRecorder e constrói um Blob de áudio.
- **Prévia**: reproduzir/pausar, navegar na linha do tempo, descartar ou enviar. Enviar áudio fica indisponível durante a reprodução, voltando ao pausar ou ao final.
- **Enviando**: bloqueia interações duplicadas e usa sendD2/serviço de comandos/adapter mock. O áudio aparece como mensagem na conversa e na biblioteca de mídias.

O **Enviar mensagem** original permanece bloqueado enquanto qualquer estado de voz está ativo. A gravação descartada revoga sua object URL e encerra tracks de microfone, analisador e temporizadores. Uma gravação enviada transfere a URL para a mensagem mock; não a revoga antes de deixar o player utilizá-la. O gravador também é descartado ao trocar de conversa, navegar para outro módulo, perder acesso à conversa ou fechar a página.

Anexos pendentes devem ser enviados ou descartados antes da gravação; o estado de resposta citada é preservado. Os formatos são escolhidos via MediaRecorder.isTypeSupported, sem dependências externas. Requer contexto seguro (HTTPS ou localhost) e permissão do microfone.

## Matriz de homologação no navegador

1. Permitir microfone, gravar alguns segundos, pausar, esperar e retomar: contador não deve incluir o tempo pausado.
2. Parar, reproduzir, pausar e arrastar a barra: o conteúdo deve ser audível e a posição deve atualizar.
3. Verificar que **Enviar mensagem** não atua durante gravação/prévia e **Enviar áudio** só atua após parar, quando a prévia não estiver reproduzindo.
4. Descartar enquanto grava, depois de pausar e durante a prévia: a interface volta ao texto, sem criar mensagem.
5. Enviar áudio e confirmar player na conversa, prévia “Mensagem de voz” na lista e item no gerenciamento de mídias.
6. Trocar de conversa durante gravação/solicitação de permissão e verificar que o microfone é liberado.
7. Testar navegador sem autorização, estado desconectado, perfil sem acesso e atendimento finalizado.
8. Repetir em tela estreita (360px), tema escuro e preferência de movimento reduzido.

Testes unitários em tests/voice-composer.test.mjs cobrem duração, cálculo das pausas e negociação MIME. A demo não persiste áudios capturados após recarregar a página, assim como outras mensagens locais.
