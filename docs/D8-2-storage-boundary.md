# D8.2 — Fronteira compartilhada de persistência mock (#61)

## Alterações
- O adaptador `src/data/adapters/mock/storage.mjs` concentra a leitura/gravação JSON via localStorage. Usa fallback isolado na leitura de dados ausentes, inválidos ou inacessíveis; **não apaga nem corrige automaticamente** dados antigos.
- Chaves legadas **mantidas**: `wapphub-demo-admin-v1`, `wapphub-demo-permissions-v1`, `wapphub-demo-assignments-v1`, `wapphub-demo-channels-v2`, `wapphub-demo-user-profile-v1`, `wapphub-demo-contacts-v1`.
- Os módulos legados de administração, permissões/atribuições, canais/providers de catálogo e perfil passam a usar o adaptador comum. O adaptador de contatos D8.1 também passa a reutilizar a infraestrutura.
- Atualizações de configuração escrevem primeiro; em caso de quota, privacidade ou bloqueio, o estado compartilhado não é atualizado e eventos de sucesso não são emitidos. Os diálogos de administração e canal exibem erro e mantêm a edição; switches de permissão/atribuição restauram o valor anterior.
- O bootstrap de administração mantém a migração pontual dos nomes de exemplo, sem substituir dados personalizados.

## Limitações
- Compatibilidade com referências e assinaturas legadas é temporária; os módulos ainda manipulam estado da demo. Este PR não integra Core, autorizações reais ou providers.
- Persistência de aparência e do repositório de conexões D6 ainda possuem lógica própria; migrar em PR separado para minimizar risco de sobrescrita/mescla de dados.
- Não existe armazenamento seguro de credenciais. Não cachear tokens, mensagens reais ou dados privados.
- No modo de navegação privada ou com storage bloqueado, a interface pode operar com valores iniciais, mas gravações falharão de modo explícito.

## Testes / homologação
CI: `node --test tests/*.test.mjs`, sintaxe JS/MJS, build Docker, smoke HTTP.
Manual: editar organização, membro, equipe, atribuição, permissão, canal e perfil; recarregar navegador e verificar persistência; simular quota/acesso negado e conferir que não há sucesso falso; conferir Providers D6 e histórico de mensagens. Android/desktop e deploy homelab continuam pendentes.
