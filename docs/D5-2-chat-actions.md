# D5.2 — Ações de conversa e seleção múltipla

## Problemas e correções
- O menu da conversa oferecia **Selecionar mensagens**, mas a ação apenas abria um aviso. Agora ativa um modo de seleção; mensagens são selecionadas ao tocá-las ou clicar, com barra de ações visível e contador, sem pré-selecionar itens.
- Quando não há itens selecionados, encaminhar e apagar permanecem desabilitados. O botão Cancelar e a tecla Escape encerram o modo de seleção.
- O menu secundário de permissões foi removido da conversa porque a administração está em Configurações > Permissões e atribuições.
- **Encerrar atendimento** / **Reabrir atendimento** atualizam imediatamente o compositor (habilitado/desabilitado) e os detalhes do contato, pelo mesmo callback de atualização já existente.
- **Marcar como não lida** no mobile volta à lista para preservar a indicação de não lida.

## Regressão
1. Desktop/mobile: abrir menu da conversa > Selecionar mensagens; barra com instrução; tocar duas mensagens; cancelar; voltar ao histórico.
2. Testar teclas Tab/Escape e a abertura de um menu contextual por mensagem.
3. Sem seleção, não deve ser possível executar encaminhamento/exclusão; com seleção, executar simulação existente.
4. Encerrar atendimento impede o compositor; Reabrir restabelece.
5. Marcar como não lida devolve à Inbox no mobile.
6. Verificar modos claro/escuro, tela de detalhes aberta e popup de canais sem conflitos.
7. Testes no CI: `node --test tests/*.test.mjs`, build Docker e smoke HTTP.

## Limitações
As mudanças representam apenas o fluxo da demo; o Core será a autoridade das ações, validações de permissão e encerramento/reatribuição de atendimentos.
