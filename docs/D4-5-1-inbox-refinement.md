# D4.5.1 — Cabeçalho da caixa de entrada e linguagem da interface

## Objetivo
O WappHub mantém a experiência da aplicação, sem avisos de protótipo no produto visual. **Isso não altera a natureza local/simulada dos dados e operações.**

## Layout
- `Caixa de entrada` à esquerda e seletor de canais à direita, na mesma linha.
- Seletor compacto, nativo e acessível, com a opção `Todas as caixas`.
- Título `Conversas` e contador logo abaixo, mantendo pesquisa, filtros e lista.
- Menu `...` vazio removido apenas do cabeçalho da Inbox. O menu da conversa permanece.
- Nenhum rodapé dedicado aos cenários de protótipo, preservando espaço para o conteúdo.
- Layout compartilhado em desktop e mobile, adaptado a larguras estreitas.

## Linguagem
- Removidos avisos como `Visão unificada`, `Ambiente de demonstração`, `Demonstração local`, `WhatsApp · Simulado` e textos equivalentes dos módulos.
- Ações e labels devem descrever o que fazem, não anunciar o estágio de implementação.
- Observação técnica obrigatória: a UI continua com fixtures em memória/localStorage e **não se comunica com providers ou Core reais**.
- Informações detalhadas de integração/permissões continuam documentadas no repositório.

## Diagnóstico
Para exercitar estados e RBAC de interface sem poluir o uso normal, o controle de cenários técnicos aparece apenas com `?diagnostics=1` na URL. Sem esse parâmetro, não ocupa espaço na Inbox.

## Testes
- Executar `node --test tests/*.test.mjs` e verificar sintaxe de cada script; checagens foram incluídas no CI pré-build.
- Conferir em desktop e em 320/360/390px mobile a linha do seletor, quebra de texto, busca e lista.
- Trocar canais, entrar na conversa, abrir detalhes e Configurações.
- Confirmar ausência do botão inútil de três pontos na Inbox (mas presença das opções da conversa).
- Confirmar que atualizar o canal em Configurações ainda atualiza a seleção.
- Recarregar em modo claro/escuro e validar que dados pessoais previamente editados não foram substituídos por valores padrão.

## Histórico
Issue #39. Decisões de arquitetura provider/canal estão registradas na issue do Core #62.
