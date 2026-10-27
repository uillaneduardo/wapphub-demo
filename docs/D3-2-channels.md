# D3.2 — Canais e navegação multicanal

## Decisão de arquitetura
A interface consome mensagens normalizadas pelo Core. **Provider**, **canal** e **caixa de entrada** são entidades diferentes:
- Provider: serviço independente que transporta mensagens.
- Canal: instância cadastrada em uma organização e vinculada a um provider.
- Caixa de entrada: visão de atendimento associada a um ou mais canais.

O Core decide identidade, autorização, persistência, atribuição, auditoria e distribuição de eventos. Providers autenticados executam o transporte. Não há integração real nesta demonstração.

## Experiência proposta
- Alternador compacto no topo da coluna de conversas.
- Visão Todas as caixas (multicanal) e opções por canal.
- Conversas fictícias ligadas por `channelId` e cabeçalho exibindo a origem.
- Estado conectado/desconectado no seletor. Estado não faz conexão real.
- Busca e filtros já existentes passam a atuar no conjunto visível ao canal.
- RBAC simulado continua limitando a visualização de conversas.

## Catálogo fictício
WhatsApp Comercial; Chat Suporte; WappHub Equipe; WhatsApp Suporte (desconectado). O catálogo reside em `src/channels.js`; conversas de exemplo em `src/data.js`.

## Futuro
Configuração de providers, credenciais e capacidades fica no Core e não no front; a gestão de canais deve ser uma tela própria sob Configurações. A visão Todas as caixas pode futuramente exigir permissão explícita. Na API real, filtrar por canal também será verificado no servidor. Providers não serão acessíveis diretamente pelo navegador.

## Homologação
1. Alternar cada canal e verificar que apenas suas conversas aparecem.
2. Selecionar Todas as caixas e verificar agregação.
3. Verificar nome do canal na conversa e estado do canal no seletor.
4. Filtrar conversas e fazer busca enquanto troca de canal.
5. Alterar para AGENT em Estados da demo e confirmar que restrições continuam.
6. Testar desktop/mobile e temas.

## Publicação
```bash
cd ~/homelab/apps/wapphub-demo
git pull --ff-only origin main
docker compose up -d --build --force-recreate
docker compose ps
```
