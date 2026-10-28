import {providerRepository} from "./data/adapters/mock/provider-repository.js?v=d6-3";
import {STATE_LABELS} from "./data/contracts/provider-domain.mjs";
import {providerPath} from "./router/routes.mjs";
import {channels} from "./channels.js?v=channels-1";
import {adminState} from "./admin-data.js?v=inbox-1";
const E=(tag,cl="",text)=>{const el=document.createElement(tag);if(cl)el.className=cl;if(text!==undefined)el.textContent=text;return el};
const act=(label,fn,cl="settings-action")=>{const b=E("button",cl,label);b.type="button";b.onclick=fn;return b};
const format=value=>{if(!value)return "Não disponível";const d=new Date(value);return Number.isNaN(d.getTime())?"Não disponível":d.toLocaleString("pt-BR")};
const tabs=[["overview","Geral"],["session","Sessão"],["channels","Canais"],["diagnostics","Diagnóstico"],["events","Eventos"]];
function line(key,value){
 const row=E("div","provider-detail-row");row.append(E("span","",key),E("strong","",String(value)));return row;
}
function message(root,text,type="status"){
 const el=E("p","provider-feedback",text);el.setAttribute("role",type);root.append(el);return el;
}
export async function renderProviderDetails(root,{id,tab="overview",onNavigate=()=>{}}={}){
 root.replaceChildren(message(root,"Carregando detalhes…"));
 const [item,types]=await Promise.all([providerRepository.getConnection(id),providerRepository.listTypes()]);
 if(!root.isConnected)return;
 root.replaceChildren();
 if(!item){
  root.append(E("h3","","Conexão não encontrada"),E("p","settings-hint","O registro pode ter sido alterado ou excluído."),
   act("Voltar às conexões",()=>onNavigate(providerPath())));
  return;
 }
 const type=types.find(t=>t.id===item.typeId);
 const header=E("div","provider-detail-header");
 const copy=E("div","provider-detail-heading");
 copy.append(E("h3","",item.name),E("p","settings-description",(type?.name||"Provider")+
  " · Estado demonstrativo: "+(STATE_LABELS[item.state]||"Desconhecido")));
 header.append(copy,act("Todas as conexões",()=>onNavigate(providerPath())));
 root.append(header);
 const nav=E("nav","provider-detail-tabs");nav.setAttribute("aria-label","Seções da conexão");
 for(const [key,label] of tabs){
  const b=act(label,()=>onNavigate(providerPath(id,key)),"provider-detail-tab"+(tab===key?" active":""));
  b.setAttribute("aria-current",tab===key?"page":"false");nav.append(b);
 }
 root.append(nav);
 const section=E("section","provider-detail-body");section.setAttribute("aria-label",tabs.find(x=>x[0]===tab)?.[1]||"Geral");root.append(section);
 const feedback=message(section,"");feedback.setAttribute("aria-live","polite");
 const run=async(fn)=>{
  try{feedback.textContent="Atualizando simulação…";await fn();onNavigate(providerPath(id,tab))}
  catch(e){feedback.textContent=e.message||"Falha ao atualizar conexão."}
 };
 if(tab==="overview"){
  section.append(E("h4","","Informações gerais"),line("Tecnologia",type?.name||item.typeId),
   line("Status do serviço",STATE_LABELS[item.state]||item.state),
   line("Sessão",item.session.state),line("Canais associados",item.channelIds.length),
   line("Equipe responsável",adminState().teams.find(t=>t.id===item.teamId)?.name||"Não atribuída"),
   line("Última sincronização",format(item.session.lastSyncAt)),
   E("p","settings-hint","Todos os estados e indicadores desta tela são fictícios."));
  const edit=E("div","provider-detail-editor");
  const name=E("input","admin-input");name.type="text";name.maxLength=80;name.value=item.name;name.setAttribute("aria-label","Nome da conexão");
  const description=E("textarea","admin-input");description.maxLength=240;description.value=item.description||"";description.setAttribute("aria-label","Descrição da conexão");
  const teams=E("select","admin-input");teams.setAttribute("aria-label","Equipe responsável");
  for(const value of [{id:"",name:"Sem equipe"},...adminState().teams]){const opt=E("option","",value.name);opt.value=value.id;teams.append(opt)}teams.value=item.teamId||"";
  edit.append(E("h4","","Editar identificação"),name,description,teams,
   act("Salvar alterações",()=>run(()=>providerRepository.updateConnection(id,{name:name.value,description:description.value,teamId:teams.value||null})),"settings-primary"));
  section.append(edit);
 }
 if(tab==="session"){
  section.append(E("h4","","Sessão e autenticação"),line("Estado da sessão",item.session.state),
   line("Última alteração",format(item.session.updatedAt)));
  if(type?.authMode==="qr"){
   const expired=item.session.expiresAt&&new Date(item.session.expiresAt).getTime()<=Date.now();
   const qr=E("div","provider-qr-placeholder");
   qr.setAttribute("role","img");qr.setAttribute("aria-label","Representação de QR demonstrativo não escaneável");
   qr.append(E("strong","","QR ILUSTRATIVO"),E("small","","Não escaneável · sem comunicação com WhatsApp"));
   if(item.session.expiresAt)qr.append(E("small","",expired?"QR ilustrativo expirado":"Validade ilustrativa até "+format(item.session.expiresAt)));
   section.append(qr);
   section.append(act("Gerar / renovar QR ilustrativo",()=>run(async()=>{
    await providerRepository.updateSession(id,{state:"qr_pending",expiresAt:new Date(Date.now()+120000).toISOString()});
    await providerRepository.setConnectionState(id,"awaiting_auth");
   })));
  }else{
   section.append(E("p","settings-hint",type?.authMode==="api"?
    "Na operação real, a API deve autorizar a sessão no Core. Nenhum token é solicitado aqui.":
    "O tipo de provider utiliza autenticação/configuração própria do Core."));
  }
  const actions=E("div","provider-action-strip");
  actions.append(
   act("Simular reconexão",()=>run(()=>providerRepository.setConnectionState(id,"connecting"))),
   act("Simular conexão estabelecida",()=>run(async()=>{
    await providerRepository.setConnectionState(id,"connected");
    await providerRepository.updateSession(id,{state:"authenticated",expiresAt:null,lastSyncAt:new Date().toISOString()});
   })),
   act("Simular falha",()=>run(()=>providerRepository.setConnectionState(id,"failed"))),
   act("Desvincular sessão",()=>{if(!window.confirm("Desvincular somente a sessão fictícia desta conexão?"))return;
    run(async()=>{await providerRepository.updateSession(id,{state:"not_authenticated",expiresAt:null});
      await providerRepository.setConnectionState(id,"awaiting_auth")})})
  );
  section.append(actions,E("p","settings-hint","As ações alteram exclusivamente o mock; nenhuma sessão real será reiniciada ou recuperada."));
 }
 if(tab==="channels"){
  section.append(E("h4","","Canais da conexão"),E("p","settings-description",
   "Associações de gestão locais. O provider de transporte já existente de cada canal não é alterado."));
  const form=E("div","provider-channel-list"),selected=new Set(item.channelIds);
  for(const ch of channels.filter(ch=>ch.id!=="all")){
   const label=E("label","provider-channel-choice");const input=E("input");input.type="checkbox";input.checked=selected.has(ch.id);
   input.onchange=()=>input.checked?selected.add(ch.id):selected.delete(ch.id);
   label.append(input,E("span","",ch.name));form.append(label);
  }
  if(!form.childElementCount)form.append(E("p","provider-empty","Nenhum canal cadastrado."));
  section.append(form,act("Salvar associações",()=>run(()=>providerRepository.assignChannels(id,[...selected])),"settings-primary"));
 }
 if(tab==="diagnostics"){
  const health=await providerRepository.getHealth(id);if(!section.isConnected)return;
  section.append(E("h4","","Diagnóstico ilustrativo"),
   E("p","settings-hint","Valores de exemplo determinísticos, NÃO são métricas reais do serviço ou frontend."));
  const grid=E("div","provider-health-grid");
  for(const [label,value] of [
   ["Estado",STATE_LABELS[health?.status]||"Indisponível"],
   ["Disponibilidade",health?.uptimePercent===null?"Sem dados":health.uptimePercent+"%"],
   ["Latência P95",health?.latencyP95Ms===null?"Sem dados":health.latencyP95Ms+" ms"],
   ["Falhas",String(health?.failedEvents||0)],
   ["Mensagens pendentes",String(health?.pendingMessages||0)],
   ["Última sincronização",format(health?.lastSyncAt)]
  ]){const card=E("div","provider-health-card");card.append(E("span","",label),E("strong","",value));grid.append(card)}
  section.append(grid);
 }
 if(tab==="events"){
  const events=await providerRepository.listEvents(id);if(!section.isConnected)return;
  section.append(E("h4","","Eventos da conexão"),E("p","settings-hint","Timeline fictícia sem conteúdo de mensagens ou dados sensíveis."));
  const list=E("ol","provider-event-list");
  for(const event of [...events].reverse()){
   const row=E("li","provider-event");row.append(E("strong","",event.description),
    E("small","",format(event.occurredAt)+" · "+event.severity));list.append(row)}
  if(!events.length)section.append(E("p","provider-empty","Nenhum evento nesta conexão."));
  else section.append(list);
 }
}
