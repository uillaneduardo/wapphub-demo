// Estado administrativo fictício. Nenhuma operação altera o Core.
const KEY="wapphub-demo-admin-v1";
const initial={organization:{name:"WappHub Demonstração",slug:"wapphub-demo",locale:"pt-BR",timezone:"America/Recife"},teams:[{id:"team-support",name:"Suporte",description:"Atendimento técnico"},{id:"team-sales",name:"Comercial",description:"Relacionamento e vendas"}],members:[{id:"member-owner",name:"Usuário Demo",email:"owner@example.test",role:"OWNER",teamId:"team-support",status:"active"},{id:"member-supervisor",name:"Supervisora Demo",email:"supervisor@example.test",role:"SUPERVISOR",teamId:"team-support",status:"active"},{id:"member-agent",name:"Atendente Demo",email:"agent@example.test",role:"AGENT",teamId:"team-sales",status:"active"}],invites:[]};
let state;try{const saved=JSON.parse(localStorage.getItem(KEY)||"null");state=saved&&typeof saved==="object"?{...structuredClone(initial),...saved}:structuredClone(initial)}catch{state=structuredClone(initial)}
export const adminState=()=>state;
export function mutateAdmin(edit){const copy=structuredClone(state);edit(copy);state=copy;try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){console.warn("Não foi possível salvar dados de demonstração",e)}}
export const uid=()=>globalThis.crypto?.randomUUID?.()||"demo-"+Date.now()+"-"+Math.random().toString(36).slice(2);
export const roleLabels={OWNER:"Proprietário",SUPERVISOR:"Supervisor",AGENT:"Atendente"};
