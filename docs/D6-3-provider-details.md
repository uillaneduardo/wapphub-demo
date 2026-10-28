# D6.3 — Sessão, canais, diagnóstico e histórico de conexões

## Endereços
`/settings/providers/:id`: geral e edição. `/session`: sessão, QR ilustrativo e ações simuladas. `/channels`: associação local com canais existentes. `/diagnostics`: valores exemplificativos de status, disponibilidade, latência P95, falhas, mensagens pendentes e última sincronização. `/events`: timeline de eventos de ações de usuário no mock.

## Fluxo e estados
- QR **NÃO escaneável** (texto ilustrativo), prazo de dois minutos gravado em `session.expiresAt`, renovação e indicação de expiração ao reabrir. Nenhum pareamento WhatsApp real.
- `Simular reconexão` muda para `connecting`; `Simular conexão estabelecida` muda para `connected`; `Simular falha` muda para `failed`; desvinculação exige confirmação e volta a `awaiting_auth`. Cada ação gera evento de simulação. Não há retries automáticos nem recuperação verdadeira de mensagens.
- Canais podem ser associados à conexão fictícia com unicidade; nenhum canal é duplicado ou tem seu provider de transporte original alterado sem operação explícita no catálogo de canais.
- Snapshot de saúde é **simulated:true**, determinístico e claramente descrito como fictício. Ausência de dado usa “Sem dados” (não inventar latência de serviço inativo).
- Nenhuma credencial é lida ou armazenada. UI usa somente repository Promise; Core permanece responsável por autenticação, health real e RBAC.
- A administração é protegida pelo guard demonstrativo de AGENT nas rotas Settings, não substitui checagem real no backend.

## Homologação
Abrir lista de providers, visitar Geral / Sessão / Canais / Diagnóstico / Eventos, recarregar as URLs e usar Voltar/Avançar; gerar e renovar QR ilustrativo, simular estados, confirmar desvinculação, salvar equipe/nome e associar canais sem duplicatas. Comparar ao reabrir e testar 320/360/390/430px e Full HD, teclado, contraste e movimento reduzido. CI não substitui validação real no navegador.

## Etapa seguinte
D6.4: testes finais de regressão de navegação e integrações da demo, documentação geral e evidências de homologação visual. Em paralelo, implementar #61 fases B/C para desacoplar progressivamente os módulos restantes do estado mock.
