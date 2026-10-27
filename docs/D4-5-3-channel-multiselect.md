# D4.5.3 — Seleção contextual multicanal e modal de contatos

## Decisão visual
- O rótulo **Caixa de entrada** permanece alinhado horizontalmente ao botão de canais (ícone Lucide de camadas), no canto direito do cabeçalho. O título **Conversas** e os filtros continuam logo abaixo.
- O botão abre um menu contextual com **Todos os canais** e checkboxes de múltiplos canais, agrupados por provider. Um contador no ícone indica a quantidade de filtros específicos. Estado selecionado com checkmark visível.
- Apenas canais habilitados aparecem. A seleção é reagida imediatamente na lista de conversas; nome, foto, permissões, pesquisa e filtros existentes continuam respeitados.
- No mobile o menu respeita a viewport, com alvos de toque amplos; desktop mantém dimensões compactas.
- Teclado: Tab alcança o ícone, Enter/Espaço abre, Tab navega os checkboxes, Escape fecha; foco permanece na opção atual após alterações.

## Separação de camadas
- `src/channel-filter.mjs`: regras puras para seleção, normalização de IDs e filtragem de conversas. **Sem DOM ou persistência**.
- `src/channel-picker.js`: componente visual com a API `setupChannelPicker({trigger,popover,list,summary,badge,getChannels,getProviders,onChange})`. Não acessa `localStorage` nem Core, recebe catálogo e publica IDs selecionados via callback.
- `src/main.js`: orquestra a lista e combina filtros de canal com RBAC simulado, busca e filtros de atendimento.
- `src/channels.js`: mantém dados fictícios de providers/canais e persistência antiga apenas para o catálogo da demonstração. No futuro, substituir por adapter Core API sem alterar o seletor.
- Seleção `null` significa todos os canais habilitados. A seleção explícita é `Set<string>` de IDs habilitados; se os IDs deixam de existir/desabilitam, são reconciliados.
- O Core deve impor de forma autoritativa `channelIds` e permissões a cada consulta/evento; a UI **não concede acesso**.
- `src/contact-editor.js`: formulário visual do contato com função `save(fields)` injetada. `src/contact-identity.js` faz a ligação com o armazenamento local.

## Editor de contatos
Campos separados com rótulos, largura consistente, foto ao lado das ações e do formato permitido, rodapé com Cancelar/Salvar. Fotografia PNG/JPEG/WebP até 150 KB com visualização e erro acessível. Mantém fallback por iniciais e número.

## Homologação
1. Desktop Full HD e mobile 320/360/390/430 px: conferir alinhamento entre `Caixa de entrada` e ícone, sem sobreposição.
2. Abrir menu, selecionar dois canais distintos e verificar união de conversas; filtrar mais um; voltar a `Todos os canais`.
3. Verificar etiqueta/badge da quantidade de canais selecionados e estados selecionados.
4. Desabilitar um canal em Configurações, voltar à Inbox e observar atualização sem recarregar.
5. Selecionar um canal sem conversas e validar mensagem vazia/compositor desabilitado, sem erros no console.
6. Em Contatos, editar nome, anexar imagem válida e testar erro de tamanho/formato. Recarregar para verificar preservação.
7. Confirmar teclado/Escape e tema claro/escuro.
8. Executar `node --test tests/*.test.mjs` e testes de build/smoke no CI.

## Limites
Dados persistidos na demonstração local; nenhum provider de produção conectado. A seleção da Inbox não é armazenada e poderá ser inicializada por preferências retornadas pelo Core futuramente.
