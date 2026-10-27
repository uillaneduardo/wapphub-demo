# D4.6 — Permissões e atribuições

## Escopo
Em Configurações > Permissões e atribuições, a organização pode selecionar o perfil OWNER/SUPERVISOR/AGENT para configurar capacidades, e redistribuir atendimentos por membro.

## Regras
- OWNER preserva todas as permissões administrativas no modelo de referência.
- SUPERVISOR possui permissões base de supervisão e pode ter capacidades ajustadas.
- AGENT vê somente conversas atribuídas ao membro AGENT de exemplo no modo de inspeção; nenhuma conversa não atribuída ou de outros membros deve ser exposta.
- A capacidade `manageAssignments` permanece bloqueada para AGENT.
- Em Atribuições, selecionar membro ativo ou Não atribuído altera o responsável e o estado local da conversa.
- Capacidade de encaminhar/excluir da demo respeita as concessões atuais do perfil e as opções pontuais existentes.

## Separação de camadas
- `src/role-rules.mjs`: defaults e avaliação de permissões com funções puras.
- `src/access-panel.js`: UI sem dependências de persistência; recebe contexto e callbacks.
- `src/demo-access-store.js`: adaptador de persistência local, facilmente substituível por cliente HTTP do Core.
- `src/settings.js`: liga a UI aos dados/ações.
- `src/main.js`: inicialização e eventos para atualização da Inbox.
- `src/d3.js`: verificação de visualização por membro para AGENT em cenário local.

Persistência local com chaves `wapphub-demo-permissions-v1` e `wapphub-demo-assignments-v1`.

## Segurança e evolução
**A camada frontend jamais será autoridade de autorização.** Quando conectada ao backend, o Core validará identidade, organização, membership, permissões, canais, usuário responsável, operações, entrega de mensagens, consultas e eventos em tempo real, com auditoria. O adaptador da demo não deve ser utilizado como segurança em produção. A arquitetura real permanece registrada em wapphub-core issue #62.

## Homologação
1. Selecionar SUPERVISOR e AGENT e alternar as permissões disponíveis.
2. Confirmar que OWNER é protegido e AGENT não pode assumir gestão de atribuições.
3. Atribuir uma conversa a Atendente, desatribuir outra e verificar mudança no histórico/indicadores.
4. Visitar `?diagnostics=1`, selecionar perfil AGENT e confirmar que só conversa atribuída ao Atendente aparece.
5. Confirmar que troca de canais, seleção múltipla e pesquisa continuam corretas.
6. Recarregar e validar persistência local.
7. Desktop e mobile: controles, textos, rolagem, modo claro/escuro, sem estouros horizontais.
8. CI: `node --test tests/*.test.mjs`, verificação sintática, build Docker e smoke test.
