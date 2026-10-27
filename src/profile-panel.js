const el=(tag,cls="",value)=>{const node=document.createElement(tag);node.className=cls;if(value!==undefined)node.textContent=value;return node};
const initials=(name)=>name.trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toLocaleUpperCase("pt-BR")||"U";
/** Componente de apresentação: dependências de dados injetadas pelo chamador. */
export function renderProfilePage(root,{getProfile,saveProfile}){
 const profile=getProfile();
 root.replaceChildren();
 const header=el("header","module-head");
 header.append(el("h1","","Meu perfil"),el("p","","Gerencie seus dados pessoais e a identificação exibida na organização."));
 root.append(header);
 const form=el("form","profile-form");
 const section=el("section","profile-section");
 section.append(el("h2","","Informações pessoais"));
 const photoRow=el("div","profile-photo-row");
 const photoAvatar=el("span","avatar profile-avatar");
 let chosenPhoto=profile.photo,preview=null;
 const showAvatar=()=>{
  photoAvatar.replaceChildren();
  const label=profile.displayName||profile.name;
  photoAvatar.textContent=initials(label);
  if(chosenPhoto){
   const image=el("img");image.alt="";image.src=chosenPhoto;
   image.onerror=()=>image.remove();photoAvatar.append(image);
  }
 };
 showAvatar();
 const photoActions=el("div","profile-photo-actions");
 const photoLabel=el("span","contact-editor-label","Foto do perfil");
 const choose=el("button","settings-action","Alterar fotografia");choose.type="button";
 const note=el("small","","PNG, JPEG ou WebP · até 150 KB");
 const upload=el("input","contact-editor-file");upload.type="file";upload.accept="image/png,image/jpeg,image/webp";
 upload.setAttribute("aria-label","Selecionar foto do perfil");
 choose.onclick=()=>upload.click();
 photoActions.append(photoLabel,choose,note,upload);photoRow.append(photoAvatar,photoActions);section.append(photoRow);
 const fields=el("div","profile-fields");
 const controls={};
 for(const [key,label,type,max] of [["name","Nome completo","text",80],["displayName","Nome de exibição na organização","text",80],["email","E-mail","email",120]]){
  const field=el("label","contact-editor-field");
  field.append(el("span","contact-editor-label",label));
  const input=el("input","contact-editor-input");input.type=type;input.value=profile[key]||"";input.required=true;input.maxLength=max;input.autocomplete=key==="name"?"name":key==="email"?"email":"off";
  field.append(input);controls[key]=input;fields.append(field);
 }
 section.append(fields);
 const error=el("p","contact-editor-error");error.hidden=true;error.setAttribute("role","alert");section.append(error);
 const footer=el("div","profile-form-actions");
 const save=el("button","settings-primary","Salvar alterações");save.type="submit";footer.append(save);section.append(footer);
 form.append(section);root.append(form);
 upload.onchange=()=>{
  const file=upload.files?.[0];if(!file)return;
  if(file.size>150*1024||!["image/png","image/jpeg","image/webp"].includes(file.type)){
   error.textContent="Selecione uma imagem PNG, JPEG ou WebP com até 150 KB.";error.hidden=false;upload.value="";return;
  }
  error.hidden=true;const reader=new FileReader();
  reader.onload=()=>{chosenPhoto=reader.result;showAvatar()};
  reader.onerror=()=>{error.textContent="Não foi possível ler a fotografia.";error.hidden=false};
  reader.readAsDataURL(file);
 };
 form.onsubmit=e=>{
  e.preventDefault();error.hidden=true;
  const data=Object.fromEntries(Object.entries(controls).map(([key,input])=>[key,input.value.trim()]));
  if(Object.values(data).some(x=>!x)){error.textContent="Preencha todos os campos.";error.hidden=false;return}
  try{saveProfile({...data,photo:chosenPhoto});const status=el("span","profile-saved","Alterações salvas");footer.querySelector(".profile-saved")?.remove();footer.prepend(status)}
  catch{error.textContent="Não foi possível salvar as alterações.";error.hidden=false}
 };
}
