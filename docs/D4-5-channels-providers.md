# D4.5 — Canais e Providers

## Objetivo
Demo de administração de providers independentes e canais, com cadastro e edição locais. A API/Core real ainda não está ligada.

## Regras
- Provider representa a implementação de transporte; canal é uma instância dentro da organização; caixa de entrada agrega canais.
- Criar/editar provider por nome e descrição (sem endpoint, token ou senha).
- Criar/editar canal, definir o provider e habilitar/desabilitar canal.
- Estado `connected/disconnected` representa somente fixture estática; habilitar não significa conectar.
- Catálogo persistido em `localStorage`, chave `wapphub-demo-channels-v2`.
- Seletor do Atendimento atualizado com canais habilitados; visão Todas as caixas permanece.
- Não usar API e não armazenar credenciais nesta demo.

## Homologação
1. Criar provider fictício, editar nome e descrição.
2. Criar canal vinculado a ele; conferir estado desabilitado.
3. Habilitar canal e verificar item no seletor do Atendimento.
4. Desabilitar canal e verificar retirada do seletor, mantendo dados de demonstração.
5. Recarregar e verificar persistência.
6. Verificar a exibição e o comportamento no celular.
7. Confirmar continuidade das conversas nos canais já existentes.

## Próxima evolução
Contratos de API e capacidades; RBAC de gerenciamento; credenciais apenas no Core; validação e auditoria no backend. Referência: issue arquitetural no repositório wapphub-core.
