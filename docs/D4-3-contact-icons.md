# D4.3 — Ícones, menu do usuário, interações mobile e identidade dos contatos

## Iconografia
Ícones de navegação e controles-base substituídos pelos símbolos SVG do projeto Lucide (upstream lucide-icons/lucide), mantidos inline para não adicionar dependências de runtime. Recomendação de tamanho: 18 px, stroke ~1.8. O ícone Settings 2 substitui a engrenagem antiga. O símbolo de emoji permanece como fallback desenhado localmente.

## Menu do usuário
O avatar agora concentra **Meu perfil** (informações de demonstração) e **Sair da demonstração** (avisa que não há sessão real). Alternância de tema e customização continuam exclusivamente na seção Configurações → Aparência. O menu não executa logout real.

## Mobile
Ações Responder / Encaminhar / Mais deixam de ficar permanentemente expostas em cada mensagem. Toque longo abre o menu contextual; foco/toque na mensagem pode expor somente Mais. Desktop mantém as ações no hover/foco. A seleção múltipla permanece disponível pelo menu.

## Identidade do contato
- Nome mostrado: nome personalizado na plataforma → nome disponível no canal → telefone → texto padrão.
- Foto: dado URI local ou URL HTTPS confiada dos dados fictícios; imagem indisponível cai para iniciais ou ícone textual de telefone.
- Nome personalizado e foto pequena (até 150 KB) são editáveis em Detalhes → Editar contato e Contatos → Editar.
- Persistência exclusivamente no localStorage, com chave `wapphub-demo-contacts-v1`; não envia arquivos.
- No Core real, esses atributos serão associados ao contato da organização, mantendo nomes de origem e aliases em campos diferentes, com autorização e auditoria.

## Homologação
1. Conferir os ícones Lucide na navegação e nos controles; sem glyphs ausentes.
2. Abrir menu de perfil: Meu perfil e Sair da demonstração, sem tema ali.
3. Em Configurações → Aparência, confirmar personalização e alternância do tema.
4. No mobile, mensagens não exibem três botões repetidos; pressionar e segurar abre o menu.
5. Editar nome em Detalhes e em Contatos, recarregar e confirmar persistência.
6. Testar contato com nome ausente e imagem inválida (fallback por telefone e iniciais).
7. Testar foto local pequena e recarregar. Dados não são sincronizados entre dispositivos.

## Limites
Demonstração estática, sem upload real, acesso ao Core ou sessão autenticada. A proteção de permissões deverá ser aplicada no servidor.
