import {capabilities} from "./role-rules.mjs";
const el=(tag,cls="",value)=>{
 const node=document.createElement(tag);node.className=cls;if(value!==undefined)node.textContent=value;return node;
};
/** Somente apresentação: estado e comandos são injetados pela aplicação. */
export function renderAccessPanel(panel,{getMembers,getConversations,getChannel,getGrant,setGrant,assign}){
 const policySection=el("section","access-section");
 policySection.append(el("h3","","Permissões por perfil"),el("p","settings-description","Defina as ações disponíveis para cada perfil da organização."));
 const roleField=el("label","access-role-field");
 roleField.append(el("span","","Perfil"));
 const roles=el("select","admin-input");
 for(const [id,name] of [["OWNER","Proprietário"],["SUPERVISOR","Supervisor"],["AGENT","Atendente"]]){
  const option=el("option","",name);option.value=id;roles.append(option);
 }
 roles.value="AGENT";roleField.append(roles);policySection.append(roleField);
 const grid=el("div","access-permission-list");
 function renderPolicy(){
  grid.replaceChildren();
  for(const capability of capabilities){
   const line=el("label","access-permission-row");
   const copy=el("span","settings-item-copy");
   copy.append(el("strong","",capability.label),el("span","",capability.description));
   const toggle=el("input","access-toggle");
   toggle.type="checkbox";toggle.checked=getGrant(roles.value,capability.id);
   toggle.disabled=roles.value==="OWNER"||(roles.value==="AGENT"&&capability.id==="manageAssignments");
   toggle.setAttribute("aria-label",capability.label+" para "+roles.selectedOptions[0].textContent);
   toggle.onchange=()=>setGrant(roles.value,capability.id,toggle.checked);
   line.append(copy,toggle);grid.append(line);
  }
 }
 roles.onchange=renderPolicy;renderPolicy();policySection.append(grid);
 if(!panel.querySelector(".access-section"))panel.append(policySection);
 const assignSection=el("section","access-section");
 assignSection.append(el("h3","","Atribuição de conversas"),el("p","settings-description","Selecione um responsável ou deixe o atendimento sem atribuição."));
 const list=el("div","access-assignment-list");
 for(const conversation of getConversations()){
  const row=el("div","access-assignment-row");
  const copy=el("div","settings-item-copy");
  copy.append(el("strong","",conversation.name||conversation.phone||"Contato"),el("span","",getChannel(conversation.channelId).name+" · "+conversation.status));
  const selectField=el("label","access-assignee-field");
  const visuallyHidden=el("span","sr-only","Responsável por "+(conversation.name||conversation.phone));
  selectField.append(visuallyHidden);
  const assignee=el("select","admin-input");
  const none=el("option","","Não atribuído");none.value="";assignee.append(none);
  for(const member of getMembers().filter(m=>m.status==="active")){
   const option=el("option","",member.name);option.value=member.id;assignee.append(option);
  }
  assignee.value=conversation.assignedToMemberId||"";
  assignee.onchange=()=>{
   if(assign(conversation.id,assignee.value||null))copy.querySelector("span").textContent=getChannel(conversation.channelId).name+" · "+conversation.status;
  };
  selectField.append(assignee);row.append(copy,selectField);list.append(row);
 }
 assignSection.append(list);
 panel.append(assignSection);
 panel.append(el("p","settings-hint","O Core deverá validar autorizações e atribuições antes de permitir qualquer ação ou consulta de conversa."));
}
