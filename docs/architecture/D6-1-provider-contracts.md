# D6.1 — ADR: contratos e persistência de Providers

## Ordem de implementação (dependências)
1. **#61/A** — documentar domínios e definir contratos para as novas conexões sem refatoração arriscada em toda a demo.
2. **D6.1** — fixtures e repositório mock assíncrono, sem perda de dados anteriores.
3. **D6.2** — UI: listagem, pesquisa, filtros e assistente configurável (QR apenas demonstrativo).
4. **D6.3** — UI: sessões, status, canais, diagnóstico, métricas simuladas e eventos.
5. **D6.4** — consolidar testes, responsividade e homologação em navegador; somente depois avançar à migração global #61/B-C.

## Modelo
`ProviderType` descreve tecnologia e capacidades (Baileys, Cloud API, Native, custom). `OrganizationConnection` representa a integração configurada pela organização; `Channel` representa a instância utilizável na Inbox. `HealthSnapshot` e `ProviderEvent` representam somente dados mock de diagnóstico, nunca telemetria real.

`src/data/contracts/provider-domain.mjs`: regras, typedefs JSDoc, estados e validação.

`src/data/adapters/mock/provider-fixtures.mjs`: catálogos e dados ilustrativos isolados.

`src/data/adapters/mock/provider-repository.js`: API `Promise` com `listTypes/listConnections/getConnection/createConnection/updateConnection/setConnectionState/assignChannels/getHealth/listEvents/subscribe`.

## Persistência e compatibilidade
A chave nova `wapphub-demo-provider-connections-v1` contém somente conexões e eventos demonstrativos. Os provedores e canais antigos permanecem intocados em `wapphub-demo-channels-v2`; seus IDs são projetados em instâncias `legacy:native` e `legacy:external` no primeiro uso, preservando canais existentes. Baileys demo tem três conexões **sem vinculação automática a canais já existentes**; não criamos números/instâncias duplicadas nem alteramos transporte em histórico real. Vincular canal exige ação explícita e só pode pertencer a uma conexão por vez. Preferências salvas permanecem após recarregar a página e não são repopuladas sem consentimento.

Estados `connected`, `syncing`, `disconnected`, `awaiting_auth` e outros são independentes do estado do canal. Métricas de saúde retornadas pelo mock são determinísticas e rotuladas `simulated:true`, sem falsa disponibilidade real. Sem tokens, endpoints externos, sessões reais nem QR válido.

## Segurança
A demo pode simular papéis, mas todo controle definitivo será realizado no Core por organização, usuário e canal. Nada coleta credenciais verdadeiras. Um futuro adaptador API deverá seguir o contrato e não retornar ao mock automaticamente após erro.

## QA
Teste puro para filtros/validação/migração e teste da API assíncrona do repositório. CIs posteriores incluem integração com as telas; CI verde não significa homologação visual.
