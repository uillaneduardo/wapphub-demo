# D5.3 — Biblioteca de mídias e players integrados

## Escopo entregue
- Nova entrada **Mídias** na navegação principal, em desktop e na barra inferior mobile.
- Biblioteca de anexos compartilhados com **filtro por conversa**, categoria (Todas, Imagens, Áudios, Vídeos e Documentos), pesquisa por nome/legenda e contadores.
- Mídias recentes dentro de **Detalhes da conversa**, com miniaturas e **Ver todas as mídias** que abre o módulo filtrado para a conversa.
- Mensagens de exemplo com fotos, áudio e vídeos incorporados ao histórico.
- Players customizados para áudio/vídeo com **play/pause, barra para buscar, tempo atual, duração, velocidade 1×/1,5×/2×** e estado de erro. Controle global evita reproduzir duas mídias simultaneamente.
- Modal de visualização para imagem, áudio e vídeo; ações por teclado e fechamento por Escape; layout compacto e responsivo.
- Preservados o tema, as cores de destaque e a navegação existente. Sem barras laterais coloridas ou bordas duplas em seleção.

## Arquitetura para Core
- `src/media-catalog.mjs`: normaliza e filtra referências a anexos existentes nas mensagens, sem DOM, rede ou armazenamento. Oculta arquivos de mensagens removidas na visualização.
- `src/media-gallery.js`: camadas visuais do módulo e da seção de detalhes. Recebe `getConversations` injetado e filtra somente as conversas autorizadas pelo cliente para fins de demo.
- `src/media-player.js`: player/visualizador independente de dados e de provider. Trabalha com `{kind,url,poster,name,caption}`.
- `src/media-fixtures.js`: injeta apenas dados fictícios ao carregar a aplicação; substituível pelo cliente da API do Core. Não existe reenvio ao WhatsApp.
- `src/d2.js`, `src/main.js` e `src/pages.js`: integram sem mover as regras para o DOM.
- Contrato futuro da API: cada mensagem deverá expor `messageId,conversationId,direction,time,media:{id,kind,name,mimeType,size,url,thumbnailUrl,duration}`. O Core valida escopo por organização, membro, canal, arquivo e autorização para gerar URLs de mídia temporárias.
- Mídias de conversas não autorizadas **nunca** deverão ser entregues ao cliente; filtrar somente no frontend não é controle de segurança.

## Fontes e limites dos exemplos
- SVGs de fotos e poster são ilustrações locais originadas neste repositório (`assets/`), não imagens reais de clientes.
- Mensagem de voz produzida localmente como WAV sintético de cinco segundos (sinal de teste, sem fala).
- Vídeos usam o sample CC0 `flower.mp4` hospedado em `interactive-examples.mdn.mozilla.net`, com dependência de conexão e disponibilidade externa. Falhas aparecem no componente; o player não afirma reprodução caso o recurso esteja inacessível.
- Nginx entrega o código e as ilustrações localmente; CSP `media-src` permite somente same-origin, blob local e a origem do exemplo MDN. Para produto real, não autorizar origens arbitrárias nem aceitar URLs fornecidas pelo usuário sem validação.
- A demonstração não implementa download de mídia em lote, CDN, transcodificação, cache offline, streaming adaptativo, histórico remoto ou integração com provider real.

## Homologação desktop/mobile
1. Abrir Mídias na navegação. Verificar contagem e filtro por conversa, seleção de categoria, busca e estados vazios.
2. Abrir Mariana Costa e conferir foto, mensagem de voz e vídeo no histórico; usar os controles de velocidade, tempo e barra.
3. Abrir Detalhes → Mídias e arquivos → Ver todas as mídias. Biblioteca deve abrir filtrada na conversa atual.
4. Abrir prévia da foto, usar Escape ou Fechar e verificar retorno do foco.
5. Abrir áudio e vídeo; iniciar outro player deve pausar o primeiro.
6. Testar perda de conectividade ao vídeo externo: a interface deve informar a indisponibilidade.
7. Verificar conversa sem anexos e restrições de AGENT (via `?diagnostics=1`).
8. Mobile 320/360/390/430px: duas colunas de miniaturas, controles sem cortar, modal contido na tela e barra inferior preservada.
9. Desktop: Full HD, dark/light, zoom 200% e navegação por teclado.
10. CI: `node --test tests/*.test.mjs`, validação sintática, Docker build e smoke test incluindo `assets/` e ES modules.

## PWA
A futura instalação poderá usar manifesto próprio, mas não incluir anexos sensíveis em cache offline antes de política de armazenamento criptografado, expiração, logout e segregação de organização.
