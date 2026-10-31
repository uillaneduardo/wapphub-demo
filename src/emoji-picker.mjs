import {
 EMOJI_GROUPS,ALL_EMOJIS,SKIN_TONES,searchEmojis,normalizeEmojiSearch,
 applyEmojiSkinTone,insertEmojiText,addRecentEmoji
} from "./emoji-data.mjs";
import {emojiPreferences} from "./data/adapters/mock/emoji-preferences.mjs";

const make=(tag,cls="",text)=>{
 const element=document.createElement(tag);
 if(cls)element.className=cls;
 if(text!==undefined)element.textContent=text;
 return element;
};
/** Seletor não modal, com escopo no compositor e sem dependência externa. */
export function setupEmojiPicker({trigger,input}){
 if(!trigger||!input)throw new TypeError("Controles do compositor obrigatórios");
 let panel=null,category="rostos",phrase="";
 let saved=emojiPreferences.read();
 let recent=saved.recent,tone=saved.tone;
 const isMobile=()=>window.matchMedia?.("(max-width:760px)")?.matches??false;

 function persist(){
  try{emojiPreferences.save({recent,tone})}
  catch{/* Bloqueio de storage não impede o envio de emoji. */}
 }
 function setExpanded(open){
  trigger.setAttribute("aria-expanded",String(open));
  trigger.setAttribute("aria-haspopup","dialog");
 }
 function close({restoreFocus=false}={}){
  if(!panel)return;
  panel.remove();panel=null;
  setExpanded(false);
  document.removeEventListener("pointerdown",outside);
  document.removeEventListener("keydown",keydown);
  window.removeEventListener("resize",place);
  window.visualViewport?.removeEventListener("resize",place);
  if(restoreFocus)trigger.focus({preventScroll:true});
 }
 function outside(event){
  if(!panel||panel.contains(event.target)||trigger.contains(event.target))return;
  close();
 }
 function keydown(event){
  if(event.key==="Escape"&&panel){
   event.preventDefault();
   close({restoreFocus:true});
  }
 }
 function place(){
  if(!panel)return;
  const rect=trigger.getBoundingClientRect();
  const visual=window.visualViewport;
  const viewportWidth=visual?.width||window.innerWidth;
  const viewportHeight=visual?.height||window.innerHeight;
  const leftOffset=visual?.offsetLeft||0,topOffset=visual?.offsetTop||0;
  const width=Math.min(376,Math.max(240,viewportWidth-16));
  const availableAbove=Math.max(150,rect.top-topOffset-16);
  const height=Math.min(420,availableAbove,viewportHeight-24);
  const left=Math.max(leftOffset+8,Math.min(rect.right-width,leftOffset+viewportWidth-width-8));
  const top=Math.max(topOffset+8,Math.min(rect.top-height-8,topOffset+viewportHeight-height-8));
  panel.style.width=width+"px";
  panel.style.maxHeight=height+"px";
  panel.style.left=left+"px";
  panel.style.top=top+"px";
 }
 function insert(value){
  if(input.disabled||input.readOnly){close();return}
  const {value:next,caret}=insertEmojiText(input.value,input.selectionStart,input.selectionEnd,value);
  input.value=next;
  input.focus({preventScroll:true});
  input.setSelectionRange(caret,caret);
  input.dispatchEvent(new Event("input",{bubbles:true}));
  recent=addRecentEmoji(recent,value);
  persist();
  if(isMobile())close();
  else if(category==="recentes"&&!phrase)renderResults();
 }
 function results(){
  if(phrase)return searchEmojis(phrase);
  if(category!=="recentes")return searchEmojis("",category);
  return recent.map(emoji=>{
   const base=ALL_EMOJIS.find(item=>item.emoji===emoji);
   return {emoji,name:base?.name||"Emoji usado recentemente"};
  });
 }
 function renderResults(){
  if(!panel)return;
  const grid=panel.querySelector(".emoji-picker-grid");
  const status=panel.querySelector(".emoji-picker-status");
  const data=results();
  grid.replaceChildren();
  status.textContent=data.length===1?"1 emoji":data.length+" emojis";
  if(!data.length){
   grid.append(make("p","emoji-picker-empty",phrase?"Nenhum emoji encontrado.":"Os emojis usados recentemente aparecem aqui."));
   return;
  }
  for(let i=0;i<data.length;i++){
   const entry=data[i];
   const value=category==="recentes"&&!phrase?entry.emoji:applyEmojiSkinTone(entry.emoji,tone);
   const button=make("button","emoji-picker-emoji",value);
   button.type="button";
   button.title=entry.name;
   button.setAttribute("aria-label",entry.name+(tone&&value!==entry.emoji?" · "+SKIN_TONES.find(x=>x.code===tone)?.label:""));
   button.tabIndex=i===0?0:-1;
   button.onclick=()=>insert(value);
   grid.append(button);
  }
 }
 function renderTabs(){
  if(!panel)return;
  const tabs=panel.querySelector(".emoji-picker-tabs");
  tabs.replaceChildren();
  for(const group of EMOJI_GROUPS){
   const selected=category===group.id&&!phrase;
   const button=make("button","emoji-picker-tab"+(selected?" selected":""),group.icon);
   button.type="button";
   button.title=group.label;
   button.setAttribute("aria-label",group.label);
   button.setAttribute("aria-pressed",String(selected));
   button.onclick=()=>{
    category=group.id;phrase="";
    panel.querySelector(".emoji-picker-search").value="";
    renderTabs();renderResults();
   };
   tabs.append(button);
  }
 }
 function onGridKey(event){
  const target=event.target.closest(".emoji-picker-emoji");
  if(!target)return;
  const buttons=[...event.currentTarget.querySelectorAll(".emoji-picker-emoji")];
  const position=buttons.indexOf(target);
  const columns=Math.max(1,Math.floor(event.currentTarget.clientWidth/43));
  const next={
   ArrowRight:position+1,ArrowLeft:position-1,
   ArrowUp:position-columns,ArrowDown:position+columns,
   Home:0,End:buttons.length-1
  }[event.key];
  if(next===undefined)return;
  event.preventDefault();
  const selected=buttons[Math.max(0,Math.min(next,buttons.length-1))];
  buttons.forEach(button=>button.tabIndex=button===selected?0:-1);
  selected?.focus();
 }
 function open(){
  if(panel||input.disabled)return;
  panel=make("section","emoji-picker");
  panel.id="emoji-picker";
  panel.setAttribute("role","dialog");
  panel.setAttribute("aria-label","Selecionar emoji");
  panel.setAttribute("aria-modal","false");
  const header=make("header","emoji-picker-head");
  header.append(make("strong","","Emojis"));
  const closeButton=make("button","emoji-picker-close","×");
  closeButton.type="button";
  closeButton.setAttribute("aria-label","Fechar seletor de emojis");
  closeButton.onclick=()=>close({restoreFocus:true});
  header.append(closeButton);
  const toolbar=make("div","emoji-picker-toolbar");
  const search=make("input","emoji-picker-search");
  search.type="search";search.placeholder="Buscar emoji…";
  search.setAttribute("aria-label","Buscar emojis em português");
  search.autocomplete="off";
  search.value=phrase;
  search.oninput=()=>{
   phrase=normalizeEmojiSearch(search.value);
   renderTabs();renderResults();
  };
  const toneSelect=make("select","emoji-picker-tone");
  toneSelect.setAttribute("aria-label","Escolher tom de pele");
  toneSelect.title="Tom de pele";
  for(const item of SKIN_TONES){
   const option=make("option","",(item.code?"✋"+item.code:"✋")+" "+item.label);
   option.value=item.code;toneSelect.append(option);
  }
  toneSelect.value=tone;
  toneSelect.onchange=()=>{tone=toneSelect.value;persist();renderResults()};
  toolbar.append(search,toneSelect);
  const tabs=make("nav","emoji-picker-tabs");
  tabs.setAttribute("aria-label","Categorias de emojis");
  const area=make("div","emoji-picker-scroll");
  const grid=make("div","emoji-picker-grid");
  grid.setAttribute("aria-label","Emojis disponíveis");
  grid.addEventListener("keydown",onGridKey);
  area.append(grid);
  const status=make("span","emoji-picker-status");
  status.setAttribute("role","status");
  status.setAttribute("aria-live","polite");
  panel.append(header,toolbar,tabs,area,status);
  document.body.append(panel);
  setExpanded(true);renderTabs();renderResults();place();
  document.addEventListener("pointerdown",outside);
  document.addEventListener("keydown",keydown);
  window.addEventListener("resize",place);
  window.visualViewport?.addEventListener("resize",place);
  if(isMobile()){panel.tabIndex=-1;panel.focus({preventScroll:true})}
  else search.focus({preventScroll:true});
 }
 trigger.addEventListener("click",()=>panel?close():open());
 setExpanded(false);
 return Object.freeze({open,close,isOpen:()=>Boolean(panel)});
}
