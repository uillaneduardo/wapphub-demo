# D3.3 — Layout móvel e balões de saída

## Decisões
- Mensagens de saída adotam `--brand-accent` e `--brand-text`; mensagem recebida mantém superfície neutra.
- Navegação principal no mobile (< 761px) vira barra fixa inferior com três destinos existentes; mantém desktop sem alterações.
- Lista de conversas é a tela inicial; abrir conversa substitui a lista e mantém compositor.
- Detalhes ocupam 100% da viewport no mobile, sobrepondo navegação inferior; fechar retorna à conversa.
- Respeita `env(safe-area-inset-bottom)` para evolução PWA. Viewport utiliza `viewport-fit=cover`.
- Sem dependências/framework, mantendo HTML/CSS/JS e dados fictícios.

## Homologação
1. Mudar cor em Aparência no desktop e confirmar balões enviados na cor configurada e texto legível.
2. Em celular, verificar barra inferior com Atendimento, Visão geral e Contatos (estes dois últimos ainda são placeholders D4).
3. Abrir conversa e confirmar foco na área de mensagens, compositor e retorno para lista.
4. Abrir Detalhes e confirmar painel ocupando toda a viewport, sem exibir navegação atrás; fechar corretamente.
5. Alternar tema escuro/claro e testar orientação retrato/paisagem e barras do navegador.
6. Recarregar e confirmar persistência da cor pelo localStorage; não há Core envolvido.

## Próxima entrega
D4: implementar as telas reais da Visão geral, Contatos, Perfil, Organização, Equipes, Permissões e Canais/Integrações como interfaces estáticas com configurações simuladas.
