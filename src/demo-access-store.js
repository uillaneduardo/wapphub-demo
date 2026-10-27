import {grantFor} from "./role-rules.mjs";
const POLICY_KEY="wapphub-demo-permissions-v1",ASSIGN_KEY="wapphub-demo-assignments-v1";
function read(key){try{return JSON.parse(localStorage.getItem(key)||"{}")||{}}catch{return {}}}
let overrides=read(POLICY_KEY),assignmentMap=read(ASSIGN_KEY);
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch(e){console.warn("Não foi possível salvar preferências locais",e)}};
export const roleAllows=(role,key)=>grantFor(role,key,overrides);
export const readRoleGrants=()=>structuredClone(overrides);
export function setRoleGrant(role,key,value){
 if(role==="OWNER"||(role==="AGENT"&&key==="manageAssignments"))return;
 overrides={...overrides,[role]:{...overrides[role],[key]:Boolean(value)}};
 save(POLICY_KEY,overrides);window.dispatchEvent(new Event("demo-permissions-updated"));
}
function apply(conversation,memberId,members){
 const member=members.find(m=>m.id===memberId&&m.status==="active");
 conversation.assigned=Boolean(member);
 conversation.assignedToMemberId=member?.id||null;
 conversation.agent=member?.name||"Não atribuído";
 if(!member&&conversation.status!=="Finalizado")conversation.status="Aguardando atribuição";
 if(member&&conversation.status==="Aguardando atribuição")conversation.status="Em atendimento";
}
export function initializeAssignments(conversations,members){
 for(const c of conversations){
  const stored=Object.hasOwn(assignmentMap,c.id);
  const memberId=stored?assignmentMap[c.id]:(c.assigned?"member-owner":null);
  apply(c,memberId,members);
 }
}
export function assignConversation(conversations,members,conversationId,memberId){
 const conversation=conversations.find(c=>c.id===conversationId);
 if(!conversation)return false;
 if(memberId!==null&&!members.some(m=>m.id===memberId&&m.status==="active"))return false;
 assignmentMap={...assignmentMap,[conversationId]:memberId};
 save(ASSIGN_KEY,assignmentMap);apply(conversation,memberId,members);
 window.dispatchEvent(new Event("demo-assignments-updated"));return true;
}
