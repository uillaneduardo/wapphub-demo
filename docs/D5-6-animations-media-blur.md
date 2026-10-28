# D5.6 — Animações e desfoque opcional de mídias

## Objetivo
Adicionar microinterações discretas sem sacrificar velocidade, legibilidade e acessibilidade da plataforma. Interface em HTML/CSS/JavaScript Vanilla, independente de Core e provider.

## Configurações → Aparência
Dois controles independentes:
- **Animações da interface:** ativadas por padrão. Desabilitar interrompe animações e transições CSS (menus, modais, entrada da mensagem recém-enviada, indicador) e remove a rolagem suave no salto por resposta. Mesmo com a opção ativada, `prefers-reduced-motion: reduce` do sistema sempre prevalece.
- **Desfocar prévias de mídias:** ativado por padrão. Afeta só as imagens e os vídeos nas miniaturas, na conversa e nos detalhes. Botão de olho permite revelar ou desfocar cada mídia individualmente.

As duas propriedades ficam na chave de aparência já existente `wapphub-demo-appearance-v1`, preservando tema e cor salvos. Não se armazena conteúdo da mídia, apenas preferências.

## Funcionamento do blur
- A identidade é gerada pelo par `conversationId/messageId`. A mesma imagem/vídeo aparece com o mesmo estado na conversa, Biblioteca Mídias e Detalhes.
- Botão **Mostrar mídia / Ocultar mídia** usa ícones de olho, foco acessível e `aria-pressed`. O botão é irmão, não filho, do botão que abre a mídia; evita botões aninhados.
- Preferência geral é **padrão**: uma escolha individual continua tendo precedência. Ex.: com padrão OFF, é possível ocultar uma mídia específica; com padrão ON, é possível revelar somente uma.
- Escolhas individuais são persistidas em `wapphub-demo-media-blur-v1`; não são compartilhadas com outras contas/dispositivos na demo.
- O blur é aplicado somente no `<img>` ou `<video>`, jamais na legenda, nome do arquivo, tempo de reprodução, botões ou outros controles.
- O vídeo fica visível automaticamente ao iniciar reprodução (e a preferência individual é atualizada); se o usuário ocultar um vídeo em reprodução, ela é pausada antes de voltar a ficar desfocada. Áudio e documentos não recebem blur.
- O visualizador ampliado da imagem não recebe blur; abri-lo é uma ação explícita de visualização. O player de vídeo ampliado dispõe do mesmo controle de prévia.
- Blur **não constitui proteção de privacidade**: bytes da foto/vídeo podem continuar carregados pelo navegador. Não usar para esconder informações sensíveis na API.

## Microinterações entregues
- Menu contextual de canais: fade e movimento vertical de 5px, ~150ms.
- Modais e visualizador: fade com escala discreta, ~180ms.
- Mensagem **recém-enviada**, somente esta: entrada curta, ~170ms; histórico carregado não é animado.
- Eye toggles, filtros e player: feedback leve ~140–220ms.
- Desligar animações elimina essas transições e animações, sem eliminar indicadores de estado, controles nem gestos.

## Separação de responsabilidades
- `src/media-preferences.mjs`: regra pura de identificação e escolha de blur.
- `src/media-visibility-store.js`: adaptador de persistência local para preferências individuais, facilmente substituível durante a refatoração da issue #61.
- `src/media-blur.js`: componente visual; não contém `localStorage`.
- `src/appearance.js`: preferências globais de tema, animações e padrão de blur.
- `src/settings.js`: controles de configuração.
- `src/media-gallery.js`, `src/media-player.js`, `src/d2.js`: renderização e interação, sem acesso direto ao armazenamento.
- API futura: permitir preferências de usuário/organização validadas no Core, mas não fazer chamadas de rede no protótipo.

## Homologação
1. Em **Configurações → Aparência**, desligar animações, navegar, abrir menus e modais. Confirmar a ausência de transições, mantendo funcionalidades.
2. Habilitar animações e comparar o efeito: apenas mensagens novas animam; antigas permanecem estáveis. Verificar controle do sistema `prefers-reduced-motion`.
3. Desfocar prévias ON: abrir conversa com fotos/vídeos e conferir imagem desfocada, legenda legível e botão de olho visível.
4. Revelar uma mídia na conversa; verificar o mesmo item revelado em Mídias e Detalhes, e vice-versa.
5. Desfocar prévias OFF: confirmar fotos/vídeos claros por padrão; ocultar item individualmente.
6. Testar vídeo com blur ativado: iniciar pelo player; deve revelar e reproduzir com play, progresso, velocidade e tempo legíveis. Ocultar enquanto toca deve pausar.
7. Confirmar que áudio e documentos nunca são desfocados e que as mensagens podem ser respondidas/encaminhadas.
8. Recarregar a página e confirmar persistência de ajustes globais/individuais; navegar e repetir nos dois temas.
9. Validar Android (320/360/390/430px) e desktop, mouse/touch, foco por teclado e ausência de sobreposição nos controles.
10. Executar `node --test tests/*.test.mjs`, validação sintática JS, Docker build e smoke test de arquivos pelo GitHub Actions. Merge somente após aprovação.

## Limitação
A apresentação do blur não retarda o download das imagens nem impede acesso via ferramentas de desenvolvimento. Se for necessário um modo de privacidade real, o Core deverá controlar autorização e entrega de miniaturas/arquivos.
