const KEY="wapphub-demo-user-profile-v1";
const initial={name:"Usuário WappHub",displayName:"Atendente",email:"usuario@example.test",photo:null};
function read(){try{return {...initial,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return {...initial}}}
let profile=read();
export const getProfile=()=>({...profile});
export function saveProfile(fields){
 profile={...profile,...fields};
 localStorage.setItem(KEY,JSON.stringify(profile));
 window.dispatchEvent(new Event("demo-profile-updated"));
 return getProfile();
}
export function initials(profile){
 const name=(profile.displayName||profile.name||"U").trim();
 return name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x.charAt(0)).join("").toLocaleUpperCase("pt-BR")||"U";
}
