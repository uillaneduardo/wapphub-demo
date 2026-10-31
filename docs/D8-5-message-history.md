# D8.5 — Histórico de mensagens paginado (#61)

O histórico da conversa passou a ser consultado pelo contrato `MessageHistoryRepository` por meio do serviço `createMessageHistoryService`. O adapter mock ainda usa as fixtures e comandos existentes, porém retorna **snapshots independentes** e páginas limitadas a 60 mensagens por padrão.

## Comportamento de UI
- A conversa abre mostrando as mensagens mais recentes. Se houver histórico anterior, aparece **Carregar mensagens anteriores** na parte superior.
- O carregamento anterior preserva a posição de leitura; o botão **Ir para a mensagem mais recente**, a data flutuante e as divisões por dia permanecem ativos.
- A busca dentro da conversa consulta todas as páginas do mock antes de filtrar, de forma a não omitir mensagens antigas.
- Ao clicar na citação de uma mensagem que não esteja carregada, o histórico restante é consultado para localizar e destacar a original.
- Envio, exclusão, resposta e encaminhamento continuam usando comandos assíncronos existentes; atualizações do histórico são recarregadas pelo serviço.
- Trocar rapidamente de conversa invalida respostas assíncronas da conversa anterior. Erros exibem **Tentar novamente**, sem fallback silencioso para dados simulados.

## Contrato técnico
`listMessages(conversationId,{before,limit}) -> Promise<{conversationId,items,nextCursor}>`. `before` é um cursor opaco: a UI não depende da sua composição. A implementação mock usa IDs estáveis para buscar páginas anteriores. Em produção, o Core deverá emitir os próprios cursors, autorizar a organização e o usuário, e suportar sincronização incremental.

O `createMessageHistoryWindow` conserva páginas carregadas e expõe `refresh`, `older` e `all`; o `renderD2` recebe um snapshot temporário da conversa com `messages` limitado à janela, sem mutar o catálogo. O adaptador **não** oferece acesso real ao Core, autenticação, banco ou transporte.

## Limitações e próximas etapas
- A busca e o salto para resposta carregam todas as páginas restantes (adequado para a demo de 56 conversas; integrar busca paginada no servidor antes de produção).
- O caminho de operações no `d2.js` ainda usa referências legadas para ações, e as bibliotecas de mídias usam o catálogo mock. Essa separação é a próxima fase D8.6.
- Não há persistência de histórico ao recarregar a página nem substituição de provider.
- O carregamento do histórico está preparado para requisições assíncronas, mas **RBAC e tenant isolation precisam ser validados pelo Core**.

## Homologação
1. Abrir uma das 50 conversas de carga com mais de 60 mensagens e validar o botão **Carregar mensagens anteriores**; não pode duplicar mensagens nem saltar de posição.
2. Buscar texto presente somente em mensagens antigas; voltar e conferir restauração do histórico.
3. Responder a uma mensagem antiga, navegar até a resposta e tocar na citação. Confirmar a localização da mensagem original.
4. Enviar áudio/texto e confirmar atualização dos balões, duração e mensagem mais recente.
5. Trocar rapidamente de conversa e navegar por URLs profundas, com e sem detalhes abertos.
6. Confirmar carimbo de data, rolagem, modo claro/escuro, seleções, menus e layout desktop/Android.
7. Testar erro de consulta (service substituído em teste), mensagem de falha e botão de retry.
8. Revisar as permissões simuladas de AGENT/OWNER/SUPERVISOR. Dados da demo não conferem segurança de produção.
