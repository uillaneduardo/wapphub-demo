# D4.2 — Navegação e estrutura de Configurações

## Objetivo
Acrescentar Configurações à navegação principal do WappHub Demo, com organização de informação estática e consistente com o design aprovado.

## Seções
- **Organização:** identidade, idioma, região, fuso e dados gerais.
- **Usuários e equipes:** estrutura de membros e perfis fictícios.
- **Permissões e atribuições:** princípios de acesso por papel e ações sensíveis.
- **Canais:** instâncias de canais e estados de conexão simulados.
- **Providers e integrações:** serviços de transporte independentes, sem credenciais nem integrações reais.
- **Aparência:** acesso ao seletor de cor e tema persistido localmente.

## Diretrizes
- HTML, CSS e JavaScript nativos, sem framework.
- Botões, espaçamento e hierarquia visual compactos; sem sombra/barra lateral de acento.
- Desktop: navegação principal lateral e menu de seções.
- Mobile: ícone Configurações na barra inferior, lista de seções horizontal com rolagem e conteúdo adaptado.
- Somente simulação. Operações reais exigirão RBAC validado pelo Core; o OWNER fará alterações organizacionais.

## Homologação
1. Abrir Configurações no menu desktop e no menu inferior mobile.
2. Alternar entre as seis seções, conferir conteúdo e ausência de overflow.
3. Abrir Aparência e alterar cor/tema; recarregar e confirmar persistência.
4. Voltar ao Atendimento, verificar conversas, mensagens e canais.
5. Testar tema claro/escuro, telas estreitas e teclado.

## Deploy
```bash
cd ~/homelab/apps/wapphub-demo
git pull --ff-only origin main
docker compose up -d --build --force-recreate
```

Referência estrutural de API/Core: https://github.com/uillaneduardo/wapphub-core/issues/62.
