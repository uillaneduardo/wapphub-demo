const el=(tag,className="",text)=>{
 const node=document.createElement(tag);if(className)node.className=className;
 if(text!==undefined)node.textContent=text;return node;
};
/** Janela de edição: camada visual sem acesso ao localStorage ou à API. */
export function openContactEditor({contact,alias="",renderAvatar,save}){
 const previous=document.activeElement;
 const overlay=el("div","contact-editor-overlay");
 const form=el("form","contact-editor-dialog");
 form.setAttribute("role","dialog");form.setAttribute("aria-modal","true");
 form.setAttribute("aria-label","Editar contato");
 const header=el("header","contact-editor-header");
 header.append(el("div","",undefined));
 header.firstChild.append(el("h2","","Editar contato"),el("p","","Personalize a identificação deste contato."));
 const dismiss=el("button","contact-editor-dismiss","×");
 dismiss.type="button";dismiss.setAttribute("aria-label","Fechar");
 header.append(dismiss);form.append(header);
 const body=el("div","contact-editor-body");
 const nameField=el("label","contact-editor-field");
 nameField.append(el("span","contact-editor-label","Nome na plataforma"));
 const nameInput=el("input","contact-editor-input");
 nameInput.type="text";nameInput.maxLength=80;nameInput.value=alias;
 nameInput.placeholder=contact.name||contact.phone||"Nome do contato";
 nameInput.autocomplete="off";
 nameField.append(nameInput);body.append(nameField);
 const photoField=el("div","contact-editor-field");
 photoField.append(el("span","contact-editor-label","Imagem do contato"));
 const photoRow=el("div","contact-editor-photo");
 const avatar=renderAvatar();
 avatar.classList.add("contact-editor-avatar");
 const picker=el("div","contact-editor-photo-actions");
 const photoButton=el("button","settings-action","Escolher imagem");
 photoButton.type="button";
 const hint=el("small","","PNG, JPEG ou WebP · até 150 KB");
 const upload=el("input","contact-editor-file");
 upload.type="file";upload.accept="image/png,image/jpeg,image/webp";upload.setAttribute("aria-label","Selecionar imagem do contato");
 photoButton.onclick=()=>upload.click();
 picker.append(photoButton,hint,upload);
 photoRow.append(avatar,picker);photoField.append(photoRow);body.append(photoField);
 const error=el("p","contact-editor-error");error.hidden=true;
 error.setAttribute("role","alert");body.append(error);
 form.append(body);
 const footer=el("footer","contact-editor-actions");
 const cancel=el("button","settings-action","Cancelar");cancel.type="button";
 const confirm=el("button","settings-primary","Salvar alterações");confirm.type="submit";
 footer.append(cancel,confirm);form.append(footer);overlay.append(form);
 let photoFile=null,previewURL=null;
 const finish=()=>{
  if(previewURL)URL.revokeObjectURL(previewURL);
  overlay.remove();previous?.focus?.();
 };
 const close=()=>finish();
 dismiss.onclick=close;cancel.onclick=close;
 overlay.onclick=e=>{if(e.target===overlay)close()};
 overlay.onkeydown=e=>{
  if(e.key==="Escape"){e.preventDefault();close()}
  if(e.key==="Tab"){
   const focusables=[...form.querySelectorAll('button:not([disabled]),input:not([disabled])')].filter(x=>x.getClientRects().length);
   if(!focusables.length)return;
   const first=focusables[0],last=focusables.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
 };
 upload.onchange=()=>{
  const file=upload.files?.[0];if(!file)return;
  if(file.size>150*1024||!["image/png","image/jpeg","image/webp"].includes(file.type)){
   error.textContent="Escolha uma imagem PNG, JPEG ou WebP com até 150 KB.";
   error.hidden=false;upload.value="";photoFile=null;return;
  }
  error.hidden=true;photoFile=file;
  if(previewURL)URL.revokeObjectURL(previewURL);
  previewURL=URL.createObjectURL(file);
  const img=el("img");
  img.alt="";img.src=previewURL;img.onerror=()=>{img.remove();error.textContent="Não foi possível abrir esta imagem.";error.hidden=false;photoFile=null};
  avatar.querySelector("img")?.remove();avatar.append(img);
 };
 form.onsubmit=async e=>{
  e.preventDefault();confirm.disabled=true;error.hidden=true;
  const fields={alias:nameInput.value.trim()};
  try{
   if(photoFile)fields.photo=await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result);reader.onerror=reject;
    reader.readAsDataURL(photoFile);
   });
   await save(fields);finish();
  }catch(err){error.textContent="Não foi possível salvar as alterações. Tente novamente.";error.hidden=false;confirm.disabled=false}
 };
 document.body.append(overlay);nameInput.focus();
}
