# D4.4 — Organização, usuários, equipes e convites

Implementação exclusivamente demonstrativa, sem envio de e-mails, Core ou APIs.

## Entregas
- Configurações > Organização: editar nome, identificador, idioma e fuso horário.
- Configurações > Usuários e equipes: listar, criar e editar equipes.
- Listar, criar e editar usuários com papéis OWNER, SUPERVISOR e AGENT, com equipe.
- Convidar por e-mail ficticiamente, listar pendências e revogar convites locais.
- Persistir estado no localStorage (`wapphub-demo-admin-v1`). Dados base são fictícios.
- Formulários responsivos em modal com validação básica de e-mail e identificador.

## Modelo futuro
Core controla Organization, Membership, Role, Team e Invitation. Convites reais exigirão emissão de token, expiração, aceite autenticado, escopo de organização, auditoria, revogação e validações server-side. Papéis definidos nesta demo não concedem acesso a recursos reais.

## Homologação
1. Alterar nome e identificador da organização; recarregar a página para validar persistência.
2. Criar equipe; criar usuário vinculado; editar usuário e papel; recarregar.
3. Criar convite e revogá-lo; confirmar status após recarga (nenhum e-mail real é enviado).
4. Verificar diálogos no mobile, navegação por teclado e contraste claro/escuro.
5. Regressão de Atendimento, Contatos, Configurações restantes, seleção de canais e avatar.
6. Não inserir dados reais de pessoas: armazenamento local não é um banco seguro.

## Limites
Sem controle efetivo de permissões; sem integração com perfis ativos no módulo de atendimento; sem persistência em servidor. Essas ligações serão implementadas após consolidação do contrato Core.
