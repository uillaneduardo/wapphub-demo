import {mockStorage} from "./data/adapters/mock/storage.mjs";
const KEY="wapphub-demo-user-profile-v1";
const initial={name:"Usuário WappHub",displayName:"Atendente",email:"usuario@example.test",photo:null};
function read(){const saved=mockStorage.read(KEY,{});return {...initial,...(saved&&typeof saved==="object"&&!Array.isArray(saved)?saved:{})}}
let profile=read();
export const getProfile=()=>({...profile});
export function saveProfile(fields){
 const next={...profile,...fields};
 mockStorage.write(KEY,next);
 profile=next;
 window.dispatchEvent(new Event("demo-profile-updated"));
 return getProfile();
}
export function initials(profile){
 const name=(profile.displayName||profile.name||"U").trim();
 return name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x.charAt(0)).join("").toLocaleUpperCase("pt-BR")||"U";
}
