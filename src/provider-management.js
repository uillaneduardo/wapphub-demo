import {providerRepository} from "./data/adapters/mock/provider-repository.js?v=d6-1";
import {STATE_LABELS} from "./data/contracts/provider-domain.mjs";
import {providerPath} from "./router/routes.mjs";
import {adminState} from "./admin-data.js?v=inbox-1";
const E=(tag,cls="",text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
let draft={typeId:"baileys",name:"",description:"",teamId:""},step=0;
function action(label,callback,cls="settings-action"){
 const b=E("button",cls,label);b.type="button";b.onclick=callback;return b;
}
function textField(title,value,onChange,{multiline=false,required=false}={}){
 const label=E("label","provider-form-field");label.append(E("span","",title));
 const input=E(multiline?"textarea":"input","admin-input");
 if(!multiline)input.type="text";
 input.value=value||"";input.required=required;input.maxLength=multiline?240:80;
 input.oninput=()=>onChange(input.value);
 label.append(input);return label;
}
function selectField(title,options,value,onChange){
 const label=E("label","provider-form-field");label.append(E("span","",title));
 const select=E("select","admin-input");
 for(const option of options){const el=E("option","",option.label);el.value=option.value;select.append(el)}
 select.value=value;select.onchange=()=>onChange(select.value);label.append(select);return label;
}
function stateBadge(state){const value=E("span","provider-state",STATE_LABELS[state]||"Indisponível");value.dataset.state=state;return value}
function heading(title,description){
 const section=E("div","provider-page-head");section.append(E("h3","",title),E("p","settings-description",description));return section;
}
async function listing(root,onNavigate,query={}){
 const title=heading("Conexões da organização","Acompanhe serviços de transporte, autenticação e canais. Dados de exemplo, sem comunicação real.");
 const create=action("Nova conexão",()=>{draft={typeId:"baileys",name:"",description:"",teamId:""};step=0;onNavigate(providerPath("new"))},"settings-primary");
 root.append(title,create);
 const controls=E("div","provider-toolbar");
 const search=E("input","admin-input");search.type="search";search.placeholder="Buscar conexão";search.setAttribute("aria-label","Buscar conexão");search.value=query.q||"";
 const type=E("select","admin-input");type.setAttribute("aria-label","Filtrar por tipo");
 const state=E("select","admin-input");state.setAttribute("aria-label","Filtrar por estado");
 const types=await providerRepository.listTypes();
 if(!root.isConnected)return;
 for(const option of [{id:"all",name:"Todos os tipos"},...types]){const el=E("option","",option.name);el.value=option.id;type.append(el)}
 for(const [value,label] of [["all","Todos os estados"],...Object.entries(STATE_LABELS)]){const el=E("option","",label);el.value=value;state.append(el)}
 type.value=types.some(t=>t.id===query.type)?query.type:"all";
 state.value=STATE_LABELS[query.state]?query.state:"all";
 const status=E("p","settings-hint","Carregando conexões…");status.setAttribute("role","status");
 const results=E("div","provider-connection-list");
 const update=async()=>{
  const current={search:search.value,state:state.value,type:type.value};
  const {items}=await providerRepository.listConnections(current);
  if(!results.isConnected)return;
  results.replaceChildren();status.textContent=items.length+" conexão(ões) nesta visualização · valores operacionais fictícios";
  if(!items.length){results.append(E("p","provider-empty","Nenhuma conexão encontrada. Ajuste os filtros ou crie uma conexão."));return}
  for(const item of items){
   const row=E("article","provider-connection-row");
   const main=E("div","provider-connection-copy"),top=E("div","provider-connection-heading");
   top.append(E("strong","",item.name),stateBadge(item.state));
   const typeMeta=types.find(t=>t.id===item.typeId);
   main.append(top,E("span","provider-connection-description",(typeMeta?.name||"Provider não identificado")+" · "+item.channelIds.length+" canal(is) associado(s)"));
   const detail=action("Detalhes",()=>onNavigate(providerPath(item.id)));
   row.append(main,detail);results.append(row);
  }
 };
 const change=()=>{const p=new URLSearchParams();if(search.value)p.set("q",search.value);if(type.value!=="all")p.set("type",type.value);if(state.value!=="all")p.set("state",state.value);
  history.replaceState(null,"",providerPath()+(p.size?"?"+p.toString():""));
  update();
 };
 search.oninput=change;type.onchange=change;state.onchange=change;
 controls.append(search,type,state);root.append(controls,status,results);await update();
}
function renderWizard(root,onNavigate){
 root.replaceChildren();
 root.append(heading("Nova conexão","Assistente demonstrativo. Nenhum token, número de telefone ou QR real será utilizado."));
 const progress=E("div","provider-wizard-progress");progress.setAttribute("aria-label","Etapa do assistente");
 for(let i=0;i<4;i++){const item=E("span",i===step?"is-active":"",String(i+1)+" · "+["Tecnologia","Identificação","Autenticação","Revisão"][i]);item.setAttribute("aria-current",i===step?"step":"false");progress.append(item)}
 root.append(progress);
 const body=E("div","provider-wizard-body");root.append(body);
 const footer=E("div","provider-wizard-footer");root.append(footer);
 const typeInfo=[
  {id:"baileys",label:"QR Code ilustrativo",hint:"Conexão via sessão Web. O Core gerenciará expiração, pareamento e reconexão."},
  {id:"cloud-api",label:"Autorização por API (ilustrativa)",hint:"Tokens e webhooks serão configurados em uma integração real, jamais nesta demo."},
  {id:"native-webchat",label:"Configuração local (ilustrativa)",hint:"Chat do site/interno será habilitado futuramente por configurações do Core."},
  {id:"custom",label:"Configuração manual",hint:"Tipo extensível destinado a futuros adaptadores."}
 ];
 const paint=async()=>{
  body.replaceChildren();footer.replaceChildren();
  const feedback=E("p","provider-form-error");feedback.setAttribute("role","alert");body.append(feedback);
  if(step===0){
   body.append(E("p","settings-description","Escolha a tecnologia antes de configurar a conexão."));
   const types=await providerRepository.listTypes();if(!body.isConnected)return;
   const grid=E("div","provider-type-grid");
   for(const t of types){const tile=action("",()=>{draft.typeId=t.id;paint()},"provider-type-card"+(draft.typeId===t.id?" selected":""));
    tile.append(E("strong","",t.name),E("span","",t.description),E("small","",t.capabilities.join(" · ")));
    tile.setAttribute("aria-pressed",String(draft.typeId===t.id));grid.append(tile)}
   body.append(grid);
  }
  if(step===1){
   body.append(textField("Nome da conexão",draft.name,value=>{draft.name=value},{required:true}));
   body.append(textField("Descrição (opcional)",draft.description,value=>{draft.description=value},{multiline:true}));
   const teams=adminState().teams.map(t=>({value:t.id,label:t.name}));
   body.append(selectField("Equipe responsável",[{value:"",label:"Nenhuma equipe definida"},...teams],draft.teamId,value=>{draft.teamId=value}));
  }
  if(step===2){const auth=typeInfo.find(t=>t.id===draft.typeId);body.append(E("strong","",auth.label),E("p","settings-description",auth.hint));
   const mock=E("div","provider-auth-preview");
   mock.append(E("strong","","Etapa demonstrativa"),E("p","","Nenhuma credencial é solicitada. Ao salvar, a conexão ficará como “Não configurado” para avaliação de UX."));
   body.append(mock);
  }
  if(step===3){
   const selected=typeInfo.find(t=>t.id===draft.typeId);
   body.append(E("h4","","Revisão da conexão"));
   for(const [label,value] of [["Nome",draft.name],["Tecnologia",selected.label],["Equipe",adminState().teams.find(t=>t.id===draft.teamId)?.name||"Não definida"],["Estado inicial","Não configurado"]]){
    const line=E("div","provider-review-line");line.append(E("span","",label),E("strong","",value||"Não informado"));body.append(line);
   }
   body.append(E("p","settings-hint","Salvar cria somente dados fictícios locais. Nenhuma sessão será aberta."));
  }
  footer.append(action(step?"Voltar":"Cancelar",()=>{if(step){step--;paint()}else{draft={typeId:"baileys",name:"",description:"",teamId:""};onNavigate(providerPath())}}));
  footer.append(action(step===3?"Criar conexão":"Continuar",async()=>{
   const error=body.querySelector(".provider-form-error");
   if(step===1&&draft.name.trim().length<3){error.textContent="Informe um nome com pelo menos 3 caracteres.";return}
   if(step<3){step++;paint();return}
   try{const result=await providerRepository.createConnection(draft);
    draft={typeId:"baileys",name:"",description:"",teamId:""};step=0;onNavigate(providerPath(result.id));
   }catch(e){error.textContent=e.message||"Não foi possível salvar."}
  },"settings-primary"));
 };
 paint();
}
export function renderProviderWorkspace(panel,{route={},onNavigate=()=>{}}={}){
 const frame=E("div","provider-workspace");panel.append(frame);
 const view=route.providerView||"list";
 if(view==="new"){renderWizard(frame,onNavigate);return}
 if(view==="detail"){
  frame.append(heading("Detalhes da conexão","Acompanhamento de sessão, canais e diagnóstico na próxima entrega (D6.3)."),
   action("Voltar às conexões",()=>onNavigate(providerPath())));
  return;
 }
 listing(frame,onNavigate,route.query||{}).catch(e=>{frame.append(E("p","provider-form-error",e.message||"Erro ao carregar conexões."))});
}
