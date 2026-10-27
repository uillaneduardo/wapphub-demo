import {renderAccessPanel} from "./access-panel.js?v=d4-6";
import {adminState} from "./admin-data.js?v=inbox-1";
import {conversations} from "./data.js?v=channels-1";
import {roleAllows,setRoleGrant,assignConversation} from "./demo-access-store.js?v=d4-6";
import {getChannel} from "./channels.js?v=channels-1";
import {renderChannelManagement,renderProviderManagement} from "./channel-management.js?v=d4-6";
import {organizationPanel,teamPanel,bindAdminRender} from "./admin-ui.js?v=mobile-polish-1";
import {channels} from "./channels.js?v=channels-1";
import {openAppearanceSettings} from "./appearance.js?v=d5-1";
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
 const layout=el("div","settings-layout"),menu=el("nav","settings-menu"),panel=el("section","settings-panel");
 menu.setAttribute("aria-label","Seções de configurações");
 panel.setAttribute("aria-live","polite");
 const mobileSwitch=el("label","settings-mobile-switch"),sectionSelect=el("select","settings-mobile-select");
 mobileSwitch.append(el("span","","Seção"));
 sectionSelect.setAttribute("aria-label","Selecionar seção de configurações");
 for(const [id,label] of sections){const option=el("option","",label);option.value=id;sectionSelect.append(option)}
 mobileSwitch.append(sectionSelect);root.append(mobileSwitch);
 sectionSelect.addEventListener("change",()=>show(sectionSelect.value));
 function show(id){sectionSelect.value=id;menu.querySelectorAll("button").forEach(b=>{const active=b.dataset.section===id;b.classList.toggle("active",active);b.setAttribute("aria-current",active?"page":"false")});panel.replaceChildren();const meta=sections.find(s=>s[0]===id);panel.append(el("h2","",meta[1]),el("p","settings-description",meta[2]));
 if(id==="organizacao")organizationPanel(panel)
 if(id==="equipe")teamPanel(panel)
 if(id==="permissoes")renderAccessPanel(panel,{getMembers:()=>adminState().members,getConversations:()=>conversations,getChannel,getGrant:roleAllows,setGrant:setRoleGrant,assign:(conversationId,memberId)=>assignConversation(conversations,adminState().members,conversationId,memberId)});
 if(id==="canais")renderChannelManagement(panel,show)
 if(id==="providers")renderProviderManagement(panel,show)
 if(id==="aparencia"){panel.append(line("Personalização organizacional","Personalize a cor de destaque e o modo claro ou escuro."));const b=el("button","settings-primary","Personalizar aparência");b.type="button";b.onclick=openAppearanceSettings;panel.append(b)}
}
 bindAdminRender(show);
 for(const [id,label] of sections){const b=el("button","settings-menu-item",label);b.type="button";b.dataset.section=id;b.onclick=()=>show(id);menu.append(b)}layout.append(menu,panel);root.append(layout);show("organizacao")}
