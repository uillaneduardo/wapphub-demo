# D5.4 — Estrutura das mensagens e navegação por resposta

## O comportamento da imagem
A visualização ampliada usa o nome do arquivo em **file.name** como título. A descrição apresentada abaixo é **message.body** — a legenda digitada durante o envio do anexo. Não há legenda quando `body` está vazio. Essas informações não são editadas pelo visualizador.

## Formato atualmente usado pela demonstração
As conversas estão em `src/data.js`, inicialmente como tuplas `[direction,body,time]`, e são normalizadas em `src/d2.js` para objetos. Os anexos de exemplo são acrescentados por `src/media-fixtures.js`. A estrutura normalizada na memória é:

```js
{
 id: "sample:reply:mariana",       // Identificador estável na conversa
 conversationId: "mariana",
 direction: "out",                 // "in" ou "out"
 body: "Recebi o vídeo, obrigado!",// Texto ou legenda da mídia
 time: "14:29",                   // Hora de exibição da demo
 status: "read",                  // "sent" | "delivered" | "read" | "failed"
 reply: {                        // Opcional, quando é resposta
   conversationId: "mariana",
   messageId: "sample:video:mariana",
   body: "",
   direction: "in",
   file: {name: "Vídeo recebido"}
 },
 file: {                         // Opcional, quando existe anexo
   kind: "video",                 // "image" | "audio" | "video" | "document"
   name: "Vídeo recebido",
   url: "https://.../flower.mp4",
   mimeType: "video/mp4",
   poster: "./assets/video-poster.svg"
 },
 forwarded: false,               // Opcional: mensagem encaminhada
 hidden: false,                  // Ocultada para a visualização atual
 deletedAll: false               // Apagada para todos
}
```

Na aplicação, texto e anexo podem coexistir: `body` é a legenda do anexo quando `file` existe. Nem todas as propriedades opcionais aparecem em todas as mensagens. O `status` representa estado ilustrativo na demonstração; os campos de data ainda não são timestamps completos.

A mensagem pertence a uma **conversa**, e esta conversa tem um **canal**, que é vinculado a um **provider**. Por isso os anexos não devem ser armazenados como entidades autônomas de outro provider na interface: o Core deverá expor suas referências de maneira normalizada.

## Navegação da resposta
1. Ao responder, a mensagem nova guarda a referência `reply.conversationId` + `reply.messageId`, junto de um resumo da mensagem original (`body` ou `file.name`).
2. A referência é um botão acessível e acionável, não mais um elemento decorativo.
3. Ao tocar/clicar, `src/reply-navigation.mjs` valida se o alvo pertence à **mesma conversa**, existe e não foi ocultado.
4. Se a busca no histórico oculta a mensagem, o filtro é limpo e a conversa é renderizada novamente.
5. A mensagem recebe foco, é centralizada com rolagem suave e destacada brevemente com cor de fundo discreta, sem faixa lateral ou bordas duplas. `prefers-reduced-motion` é respeitado.
6. Se o alvo não existe ou foi ocultado, é exibido aviso e a navegação não ocorre. A seleção múltipla e as ações de mídia permanecem independentes.
7. Há mensagem de demonstração em resposta ao vídeo da Mariana para facilitar a validação após atualizar a aplicação.

## Contrato futuro recomendado para o Core
```json
{
  "id": "msg_uuid",
  "organizationId": "org_uuid",
  "conversationId": "conv_uuid",
  "channelId": "channel_uuid",
  "providerMessageId": "external_id_or_null",
  "direction": "in",
  "type": "image",
  "body": "Legenda opcional",
  "sentAt": "2026-10-27T23:29:00Z",
  "deliveryStatus": "delivered",
  "replyToMessageId": "msg_uuid_or_null",
  "replySnapshot": {"body": "Resumo da mensagem", "mediaName": "video.mp4"},
  "media": [
    {
      "id": "media_uuid",
      "kind": "image",
      "name": "equipamento.jpg",
      "mimeType": "image/jpeg",
      "sizeBytes": 124500,
      "durationMs": null
    }
  ],
  "deletedAt": null
}
```

Este contrato é **proposta**, não endpoint implementado. Quando a API for integrada:
- O Core deverá validar organização, canal, conversa, escopo de acesso e referência de resposta.
- O frontend não deverá usar identificadores externos do provider como chave interna primária; mapear de maneira idempotente.
- Arquivos deverão ser recuperados por endpoints autenticados ou URLs temporárias autorizadas pelo Core. Não persistir URLs com credenciais.
- Data e horário deverão ser ISO UTC no transporte e formatados no cliente.
- O Core deverá definir políticas de remoção para o usuário e para todos, retenção, auditoria e citações de mensagens apagadas.

## Homologação
- Abrir Mariana e tocar na citação **Vídeo recebido** sob uma resposta.
- Confirmar que a conversa vai para o vídeo, com foco e destaque temporário.
- Testar com busca ativa e mensagem original escondida pelo filtro.
- Testar desktop/mobile, teclado, Escape e movimento reduzido.
- Excluir/ocultar a mensagem original na demo e confirmar aviso de indisponibilidade.
- Verificar que tocar na citação não ativa seleção múltipla ou menu contextual.
- Validar testes automatizados, build e smoke no GitHub Actions. Não considerar o deploy central confirmado sem resultado do workflow.
