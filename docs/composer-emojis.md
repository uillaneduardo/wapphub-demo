# Seletor de emojis Unicode — compositor da demo

## Escopo
Substitui o menu de quatro emojis por um painel nativo em JavaScript Vanilla, sem bibliotecas, imagens de terceiros, CDN, assets protegidos ou integração com WhatsApp/Telegram/Instagram.

O catálogo usa **sequências Unicode** (incluindo corações, bandeiras e sequências com ZWJ). Os mesmos caracteres podem ser copiados, enviados e lidos nos mensageiros compatíveis; **o desenho visual dos emojis muda conforme as fontes e o sistema operacional**, e emojis recentes podem não aparecer em sistemas antigos. Não promete a arte exata de nenhum aplicativo.

## Funcionalidades
- Mais de 600 emojis em português, separados por emoções, gestos/pessoas, animais/natureza, comida, atividades/viagens, objetos, símbolos e bandeiras.
- Busca sem diferenciar maiúsculas e acentos; categorias acessíveis e contagem de resultados.
- Cinco tons de pele e o padrão para gestos compatíveis; emojis não compatíveis não são modificados.
- Lista dos últimos 28 emojis distintos; tom e recentes são armazenados por adaptador mock na chave nova \`wapphub-demo-emoji-preferences-v1\`. Nenhuma chave antiga é modificada; falha de storage não bloqueia o uso.
- Insere no ponto do cursor ou substitui o trecho selecionado, incluindo sequências Unicode compostas; dispara \`input\` para atualizar altura do textarea.
- Painel responsivo (320–430px e desktop) acima do compositor; não abre teclado virtual ao abrir em telas móveis.
- Fecha com Escape, fora do painel, botão X, mudança de conversa/rota, anexo, envio ou início de gravação.
- Abre somente se o campo de mensagem estiver autorizado/habilitado, sem alterar regras de envio. Não modifica o compositor de áudio.

## Contratos
\`src/emoji-data.mjs\` concentra catálogo e funções puras; \`src/emoji-picker.mjs\` trata somente DOM/interação; \`src/data/adapters/mock/emoji-preferences.mjs\` isola o storage.
O conteúdo enviado é texto Unicode normal, não figurinhas, GIF ou mensagens de mídia. Não há API dedicada.

## Homologação
1. Abrir chat no Android e desktop, pressionar o ícone de emoji; conferir painel acima do compositor e navegação em categorias.
2. Buscar "coracao", "lágrimas", "futebol" e "mecanico"; testar busca sem acento.
3. Escolher tom de pele, selecionar 👍 e verificar resultado 👍🏽 (exemplo); coração ❤️ deve manter forma original.
4. Digitar "Bom dia", posicionar cursor no meio e inserir emoji; verificar posição e envio normal.
5. Inserir várias vezes, fechar e abrir; conferir recentes; recarregar e observar persistência conforme permissões do navegador.
6. Fechar com Escape, toque fora, navegação para Visão geral, troca de conversa e abertura da gravação de áudio.
7. Conferir modo claro e escuro, orientação e larguras 320/360/390/430px, navegação por teclado e zoom.
8. Verificar que usuário sem permissão de enviar não consegue abrir o seletor e que nenhuma regra de backend depende da UI.

A homologação visual no navegador continua necessária; os testes Node e a CI não substituem inspeção no homelab.
