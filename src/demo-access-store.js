import {mockStorage} from "./data/adapters/mock/storage.mjs";
import {grantFor} from "./role-rules.mjs";
const POLICY_KEY="wapphub-demo-permissions-v1",ASSIGN_KEY="wapphub-demo-assignments-v1";
const read=key=>{const value=mockStorage.read(key,{});return value&&typeof value==="object"&&!Array.isArray(value)?value:{}};
let overrides=read(POLICY_KEY),assignmentMap=read(ASSIGN_KEY);
const save=(key,value)=>mockStorage.write(key,value);
export const roleAllows=(role,key)=>grantFor(role,key,overrides);
export const readRoleGrants=()=>structuredClone(overrides);
export function setRoleGrant(role,key,value){
 if(role==="OWNER"||(role==="AGENT"&&key==="manageAssignments"))return;
 const next={...overrides,[role]:{...overrides[role],[key]:Boolean(value)}};
 save(POLICY_KEY,next);overrides=next;window.dispatchEvent(new Event("demo-permissions-updated"));
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
 const next={...assignmentMap,[conversationId]:memberId};
 save(ASSIGN_KEY,next);assignmentMap=next;apply(conversation,memberId,members);
 window.dispatchEvent(new Event("demo-assignments-updated"));return true;
}
