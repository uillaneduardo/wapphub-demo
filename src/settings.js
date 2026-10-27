import {renderChannelManagement,renderProviderManagement} from "./channel-management.js?v=inbox-1";
import {organizationPanel,teamPanel,bindAdminRender} from "./admin-ui.js?v=inbox-1";
import {channels} from "./channels.js";
import {openAppearanceSettings} from "./appearance.js";
const sections=[
["organizacao","Organização","Identidade, dados gerais e preferências da organização"],
["equipe","Usuários e equipes","Membros, convites e composição das equipes"],
["permissoes","Permissões e atribuições","Perfis, restrições e distribuição de atendimentos"],
["canais","Canais","Instâncias de mensagens e sua situação operacional"],
["providers","Providers e integrações","Serviços de transporte independentes e capacidades"],
["aparencia","Aparência","Tema e cor de destaque da organização"]
];
const el=(tag,cls="",value)=>{const n=document.createElement(tag);n.className=cls;if(value!==undefined)n.textContent=value;return n};
function line(title,description,extra){const row=el("div","settings-item");const copy=el("div","settings-item-copy");copy.append(el("strong","",title),el("span","",description));row.append(copy);if(extra)row.append(extra);return row}
function pill(t){return el("span","settings-pill",t)}
export function renderSettings(root){root.replaceChildren();const h=el("header","module-head");h.append(el("h1","","Configurações"),el("p","","Gerencie a organização, as integrações e a experiência de atendimento."));root.append(h);
 const layout=el("div","settings-layout"),menu=el("nav","settings-menu"),panel=el("section","settings-panel");menu.setAttribute("aria-label","Seções de configurações");panel.setAttribute("aria-live","polite");
 function show(id){menu.querySelectorAll("button").forEach(b=>{const active=b.dataset.section===id;b.classList.toggle("active",active);b.setAttribute("aria-current",active?"page":"false")});panel.replaceChildren();const meta=sections.find(s=>s[0]===id);panel.append(el("h2","",meta[1]),el("p","settings-description",meta[2]));
 if(id==="organizacao")organizationPanel(panel)
 if(id==="equipe")teamPanel(panel)
 if(id==="permissoes"){panel.append(line("Papéis","OWNER, SUPERVISOR e AGENT"),line("Acesso às conversas","Atendentes visualizam apenas conversas atribuídas"),line("Encaminhamento","Autorização independente e revogável pelo Core"),line("Ações destrutivas","Exigem permissão e confirmação explícita"))}
 if(id==="canais")renderChannelManagement(panel,show)
 if(id==="providers")renderProviderManagement(panel,show)
 if(id==="aparencia"){panel.append(line("Personalização organizacional","Personalize a cor de destaque e o modo claro ou escuro."));const b=el("button","settings-primary","Personalizar aparência");b.type="button";b.onclick=openAppearanceSettings;panel.append(b)}
}
 bindAdminRender(show);
 for(const [id,label] of sections){const b=el("button","settings-menu-item",label);b.type="button";b.dataset.section=id;b.onclick=()=>show(id);menu.append(b)}layout.append(menu,panel);root.append(layout);show("organizacao")}
