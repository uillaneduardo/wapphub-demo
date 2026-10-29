import {mockStorage} from "./data/adapters/mock/storage.mjs";
// Estado administrativo fictício. Nenhuma operação altera o Core.
const KEY="wapphub-demo-admin-v1";
const initial={organization:{name:"Minha organização",slug:"minha-organizacao",locale:"pt-BR",timezone:"America/Recife"},teams:[{id:"team-support",name:"Suporte",description:"Atendimento técnico"},{id:"team-sales",name:"Comercial",description:"Relacionamento e vendas"}],members:[{id:"member-owner",name:"Administrador",email:"owner@example.test",role:"OWNER",teamId:"team-support",status:"active"},{id:"member-supervisor",name:"Supervisora",email:"supervisor@example.test",role:"SUPERVISOR",teamId:"team-support",status:"active"},{id:"member-agent",name:"Atendente",email:"agent@example.test",role:"AGENT",teamId:"team-sales",status:"active"}],invites:[]};
const saved=mockStorage.read(KEY,null);
let state=saved&&typeof saved==="object"&&!Array.isArray(saved)?{...structuredClone(initial),...saved}:structuredClone(initial);
// Respeita alterações do usuário; atualiza apenas os antigos valores iniciais.
if(state.organization?.name==="WappHub Demonstração")state.organization.name="Minha organização";
if(state.organization?.slug==="wapphub-demo")state.organization.slug="minha-organizacao";
for(const m of state.members||[]){
 const defaults={"Usuário Demo":"Administrador","Supervisora Demo":"Supervisora","Atendente Demo":"Atendente"};
 if(defaults[m.name])m.name=defaults[m.name];
}
try{mockStorage.write(KEY,state)}catch(error){console.warn("Dados de demonstração não persistidos",error)}
export const adminState=()=>state;
export function mutateAdmin(edit){const copy=structuredClone(state);edit(copy);mockStorage.write(KEY,copy);state=copy;return state}
export const uid=()=>globalThis.crypto?.randomUUID?.()||"demo-"+Date.now()+"-"+Math.random().toString(36).slice(2);
export const roleLabels={OWNER:"Proprietário",SUPERVISOR:"Supervisor",AGENT:"Atendente"};
