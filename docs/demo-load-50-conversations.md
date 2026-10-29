# Base de carga da WappHub Demo — 50 conversas adicionais

## Objetivo

Permitir a homologação da Inbox com um volume representativo de conversas, mensagens longas e mídias, sem conectar à API real, ao WhatsApp ou a qualquer provider. **Todos os contatos, telefones, mensagens e anexos são fictícios.**

## Dados disponíveis

| Métrica | Carga adicionada |
| --- | ---: |
| Conversas adicionais | 50 |
| Conversas totais na demo (6 anteriores + 50 novas) | 56 |
| Mensagens textuais adicionais | 3.085 |
| Histórico textual por conversa | 19–158 mensagens |
| Imagens | 50 |
| Documentos de texto baixáveis (.txt) | 50 |
| Áudios WAV locais de 5 segundos | 50 |
| Vídeos de amostra | 50 |
| Anexos totais adicionados | 200 |

A carga mantém **IDs estáveis** (`load-001` a `load-050`) e conteúdo determinístico, garantindo comparabilidade entre atualizações. Os contatos estão divididos pelos quatro canais de exemplo, com conversas atribuídas e não atribuídas, não lidas, em atendimento e finalizadas.

- Imagens usam os SVGs já distribuídos com a aplicação.
- Documentos são `Blob` de texto com protocolo `SIM-LOAD-...` e sem dados reais.
- Áudios compartilham um único WAV sintético criado no navegador. Não contêm voz humana real.
- Vídeos reutilizam a amostra CC0 `flower.mp4` do MDN, já presente na demo: **exigem acesso ao endereço externo para reprodução**, e não representam conteúdo de WhatsApp.
- Nada é gravado no `localStorage` para construir a carga. Alterações de nome de contato e atribuições previamente configuradas mantêm suas chaves existentes.

## Homologação sugerida (navegador)

1. **Caixa de entrada:** conferir 56 conversas, abrir `load-001` e `load-014`; rolar a lista e verificar se o navegador permanece responsivo.
2. **Filtros:** selecionar Não lidas, Minhas, canais diferentes e buscar por nomes/telefones.
3. **Histórico:** abrir `/inbox/load-040` (histórico longo), ler mensagens antigas e validar o botão flutuante de retorno ao final, sem deslocamento indevido ao atualizar ou selecionar mensagens.
4. **Mídias:** conferir quatro anexos em cada `load-...`, acessar a galeria global, filtrar Imagens, Documentos, Áudios e Vídeos; abrir e baixar os arquivos.
5. **Leitura e edição:** marcar mensagens como lidas, encaminhar, responder e testar exclusão em diferentes conversas.
6. **Mobile:** testar abertura de conversas, teclado visível, rolagem, prévia de mídia desfocada e botão de retorno ao final.
7. **Desempenho:** usar Chrome DevTools > Performance/Memory para comparar tempos, uso de memória e fluidez de rolagem antes e depois de abrir a galeria e históricos longos.

Esta base é **um teste de carga de interface, não um benchmark de backend, banco de dados, filas ou provider**. A renderização completa de uma conversa pode chegar a mais de 160 mensagens e anexos; a listagem mostra 56 conversas. Não há paginação ou virtualização introduzida nesta etapa.

## Implementação

- `src/data/adapters/mock/fixtures/load-conversations.mjs`: mensagens, perfis, canais e contadores.
- `src/data/adapters/mock/fixtures/conversations.js`: adiciona os novos registros depois dos seis originais.
- `src/media-fixtures.js`: injeta os quatro tipos de mídia em cada nova conversa.
- `tests/load-conversations.test.mjs`: testa quantidades, estabilidade, links, anexos, busca e filtros.

A base é provisionada somente em memória por carregamento, sem duplicação a cada atualização da aplicação. Não utilizar estes IDs nem mídias como dados operacionais reais.
