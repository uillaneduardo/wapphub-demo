# Identidade visual de plataforma, canal e provider — Demo

## Objetivo e distinções
A interface indica de onde veio cada conversa sem confundir a **plataforma** (WhatsApp, Chat Web, Interno, Outro), o **canal/instância** (Comercial, Suporte, Equipe) e o **provider técnico** (p. ex. WhatsApp API, Baileys, WappHub Native). A situação da conexão é uma quarta informação, independente da plataforma.

| Elemento | Apresentação | Contexto |
|---|---|---|
| Inbox | ícone da plataforma + nome curto/completo do canal | terceira linha da conversa, sem ocupar a prévia ou ocultar não lidas |
| Cabeçalho desktop | ícone, canal, provider técnico e estado de exceção | status da conversa permanece independente |
| Cabeçalho mobile | ícone e canal compactos; sem provider extenso | provider disponível no painel de detalhes |
| Detalhes | Plataforma, Canal, Provider e Conexão em linhas distintas | origem e diagnóstico sem exigir abrir Configurações |
| Biblioteca Mídias | ícone e canal junto ao arquivo | mesma identidade da conversa de origem |
| Administração de canais | seletor explícito Plataforma de origem | independente do select Provider de transporte |

Os ícones são SVG locais, do estilo linear atual; o tooltip nativo informa plataforma, canal, provider e conexão. Estado conectado/desconectado/falha é descrito com **texto**, e não apenas por cor. O estado não utiliza animação em loop e respeita a preferência de animações reduzidas.

## Modelo de dados: compatibilidade

A conversa mantém apenas `channelId`. O canal já mantinha `provider` e agora pode opcionalmente possuir `platform` (um de `whatsapp`, `web`, `internal`, `other`). O provider permanece com seu próprio `id/name/kind/description`, sem exigir novo tipo nem credenciais.

```js
const conversation = { id: "mariana", channelId: "wa-sales" };
const channel = {
  id: "wa-sales", name: "WhatsApp · Comercial",
  platform: "whatsapp", provider: "external",
  state: "connected", enabled: true
};
const provider = {id:"external",name:"WhatsApp (API)",kind:"external"};
```

**Importante:** canais persistidos pela versão anterior do mock em `wapphub-demo-channels-v2` continuam carregando normalmente. `src/channel-identity.mjs` reconhece os IDs de fixtures e nomes legados quando `platform` está ausente, mas **não infere WhatsApp apenas porque o provider é externo**. Um novo canal criado no formulário recebe `platform` explícito. Nenhuma migração destrutiva foi feita e nenhuma chave de `localStorage` foi renomeada.

Quando o canal ou provider não for encontrado, a UI mostra **Canal indisponível** / **Provider indisponível**, em vez de apresentar outra instância por engano. Status `disabled`, `disconnected`, `reconnecting`, `syncing`, `failed` e desconhecido são distintos.

## Separação e integração futura
- `src/channel-identity.mjs`: função pura `channelIdentity(channel,providers)` e `inferChannelPlatform(channel)`; sem DOM, rede ou armazenamento.
- `src/channel-identity-ui.js`: componente compartilhado `createOriginBadge(identity)`, recebe DTO sem acessar fixtures ou APIs.
- `src/channels.js`: catálogo simulado, dados e persistência (temporário até a fase B da issue #61).
- `src/channel-management.js`: cadastro/edição com seletor independente Plataforma e Provider.
- `src/main.js`: injeta identidade em Inbox, cabeçalho e detalhes, refresca ao alterar o cadastro de canais.
- `src/media-catalog.mjs`: propaga `channelId` da conversa aos anexos normalizados.
- `src/pages.js`: fornece resolver de identidade à Biblioteca; `src/media-gallery.js` recebe callback e só renderiza.

O Core deverá retornar as mesmas relações explícitas `conversation.channelId` → `channel.platform / providerId` → `provider.name`. A plataforma e o nome do provider não determinam autorização; acessos e visibilidade são responsabilidade do Core.

## Checklist de homologação
1. Atualizar a demo e abrir `/inbox` no desktop: verificar ícone/linha de canal para Mariana (WhatsApp), Oficina Horizonte (Chat Web) e Ana Beatriz (Interno).
2. Abrir conversa e conferir o cabeçalho; em `/inbox/mariana/details`, comparar Plataforma, Canal, Provider e Conexão, inclusive o canal desconectado da Patrícia.
3. Verificar `/media` e `/media?conversation=mariana`: cada item apresenta origem coerente e o filtro, blur e player continuam funcionais.
4. Abrir Configurações → Canais: editar o canal WhatsApp e verificar a seleção de plataforma, independente do provider. Criar canal novo com plataforma diferente sem alterar o provider.
5. Recarregar a página e confirmar que cadastros anteriores permanecem válidos e que o novo campo persiste.
6. Testar canais desconhecidos, provider removido e estado de conexão desconectado; não apresentar ícone errado nem confundir identidade com estado.
7. Validar 320, 360, 390 e 430 px, desktop FHD, teclado/foco e preferências de movimento reduzido; sem overflow ou elementos sobrepostos.
8. GitHub Actions: testes, checagem de sintaxe JS, Docker build e smoke; CI não substitui homologação visual nem prova deploy no homelab.

## Limitação
O estado de conexão exibido é da fixture do canal, não telemetria em tempo real de um provider. A UI não adiciona endpoints nem credenciais.
