import {openContactEditor} from "./contact-editor.js?v=channel-popover-1";
// Identidade local de contatos na demo. Core futuro será autoridade dos nomes e fotos.
const KEY="wapphub-demo-contacts-v1";
let edits={};try{edits=JSON.parse(localStorage.getItem(KEY)||"{}")||{}}catch{edits={}}
export const nameOf=c=>(edits[c.id]?.alias||c.name||c.phone||"Contato sem identificação");
export const photoOf=c=>edits[c.id]?.photo||c.photo||null;
export const initialsOf=c=>{const name=nameOf(c);if(name===c.phone)return "☎";return name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toLocaleUpperCase("pt-BR")||"?"};
export function avatar(c,className="avatar"){const node=document.createElement("span");node.className=className;node.setAttribute("aria-hidden","true");node.textContent=initialsOf(c);const url=photoOf(c);if(url&&/^(https:\/\/|data:image\/(png|jpeg|webp);base64,)/i.test(url)){const img=document.createElement("img");img.alt="";img.loading="lazy";img.referrerPolicy="no-referrer";img.src=url;img.onerror=()=>img.remove();node.append(img)}return node}
export const updateContact=(c,fields)=>{edits[c.id]={...edits[c.id],...fields};localStorage.setItem(KEY,JSON.stringify(edits))};
export function editContact(contact,onSaved){
 return openContactEditor({
  contact,
  alias:edits[contact.id]?.alias||"",
  renderAvatar:()=>avatar(contact,"avatar large"),
  save:fields=>{updateContact(contact,fields);onSaved?.()}
 });
}
