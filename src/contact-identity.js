import {openContactEditor} from "./contact-editor.js?v=channel-popover-1";
// A interface recebe o serviço no bootstrap, sem acessar o adaptador ou storage.
let contactService=null;
export function configureContactIdentity(service){
 if(typeof service?.get!=="function" || typeof service?.save!=="function")throw new TypeError("ContactService inválido");
 contactService=service;
}
const identity=c=>contactService?.get(c.id)||{};
export const nameOf=c=>(identity(c).alias||c.name||c.phone||"Contato sem identificação");
export const photoOf=c=>identity(c).photo||c.photo||null;
export const initialsOf=c=>{const name=nameOf(c);if(name===c.phone)return "☎";return name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toLocaleUpperCase("pt-BR")||"?"};
export function avatar(c,className="avatar"){const node=document.createElement("span");node.className=className;node.setAttribute("aria-hidden","true");node.textContent=initialsOf(c);const url=photoOf(c);if(url&&/^(https:\/\/|data:image\/(png|jpeg|webp);base64,)/i.test(url)){const img=document.createElement("img");img.alt="";img.loading="lazy";img.referrerPolicy="no-referrer";img.src=url;img.onerror=()=>img.remove();node.append(img)}return node}
export async function updateContact(c,fields){
 if(!contactService)throw new Error("Serviço de contatos indisponível");
 return contactService.save(c.id,fields);
}
export function editContact(contact,onSaved){
 return openContactEditor({
  contact,
  alias:identity(contact).alias||"",
  renderAvatar:()=>avatar(contact,"avatar large"),
  save:async fields=>{await updateContact(contact,fields);onSaved?.()}
 });
}
