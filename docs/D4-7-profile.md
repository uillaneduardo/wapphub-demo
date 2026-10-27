# D4.7 — Meu perfil

## Objetivo
Tornar funcional o acesso **Meu perfil** a partir do avatar, substituindo o modal de informações fixas por uma página própria.

## Recursos
- Dados pessoais: nome completo, nome de exibição na organização e e-mail.
- Fotografia do perfil com fallback por iniciais, PNG/JPEG/WebP até 150 KB.
- Botão Salvar alterações, validação básica, feedback de sucesso e atualização imediata do avatar da barra de navegação.
- Layout desktop/mobile conforme design system, sem alterar navegação principal.
- Dados locais persistidos na chave `wapphub-demo-user-profile-v1`. Nenhuma solicitação enviada ao Core.

## Estrutura
- `src/profile-panel.js` exibe formulário e recebe callbacks `getProfile`/`saveProfile`; não conhece mecanismo de persistência.
- `src/profile-store.js` fornece o adaptador local de dados, emite atualização para o shell.
- `src/pages.js` conecta a página ao módulo e `src/main.js` atualiza o avatar.

## Integração futura
Perfil global, identidade de exibição por organização, foto e demais dados deverão ser entidades validadas pelo Core, com autorização, verificação de email e auditoria. Estes controles não fazem login ou logout real.

## Homologação
1. Abrir Meu perfil no menu do avatar, em mobile e desktop.
2. Editar nome, nome de exibição e e-mail; salvar e verificar persistência após recarga.
3. Anexar foto compatível; verificar preview, avatar e fallback.
4. Testar arquivo inválido/acima de 150 KB.
5. Conferir navegação de volta ao Atendimento e Configurações e layout responsivo.
6. Testes de UI/sintaxe, build Docker e smoke test via GitHub Actions.
