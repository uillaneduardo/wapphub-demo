import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
 EMOJI_GROUPS,ALL_EMOJIS,SKIN_TONES,searchEmojis,
 normalizeEmojiSearch,applyEmojiSkinTone,insertEmojiText,addRecentEmoji
} from "../src/emoji-data.mjs";
import {createMockEmojiPreferences} from "../src/data/adapters/mock/emoji-preferences.mjs";
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("catálogo Unicode inclui emojis comuns de mensageiros em categorias",()=>{
 assert.ok(ALL_EMOJIS.length>600,"catálogo deve ser muito maior que o antigo menu de quatro itens");
 assert.ok(EMOJI_GROUPS.length>=7);
 for(const emoji of ["😂","🥰","🙏","👍","🫶","🎉","❤️","🇧🇷","👨‍🔧"]){
  assert.ok(ALL_EMOJIS.some(item=>item.emoji===emoji),emoji+" ausente");
 }
 assert.equal(new Set(EMOJI_GROUPS.map(group=>group.id)).size,EMOJI_GROUPS.length);
});

test("busca ignora acentos e caixa e respeita categorias",()=>{
 assert.equal(normalizeEmojiSearch("  CORAÇÃO  "),"coracao");
 assert.ok(searchEmojis("coracao").some(x=>x.emoji==="❤️"));
 assert.ok(searchEmojis("lágrimas").some(x=>x.emoji==="😂"));
 assert.ok(searchEmojis("mecanico").some(x=>x.emoji==="👨‍🔧"));
 assert.ok(searchEmojis("bandeira","simbolos").some(x=>x.emoji==="🇧🇷"));
 assert.equal(searchEmojis("futebol","rostos").length,0);
 assert.ok(searchEmojis("futebol","atividades").some(x=>x.emoji==="⚽"));
});

test("tons de pele modificam apenas gestos compatíveis",()=>{
 assert.equal(SKIN_TONES.length,6);
 assert.equal(applyEmojiSkinTone("👍","🏽"),"👍🏽");
 assert.equal(applyEmojiSkinTone("🫶","🏿"),"🫶🏿");
 assert.equal(applyEmojiSkinTone("✌️","🏻"),"✌🏻");
 assert.equal(applyEmojiSkinTone("❤️","🏽"),"❤️","corações não aceitam tom de pele");
 assert.equal(applyEmojiSkinTone("👍",""),"👍");
 assert.equal(applyEmojiSkinTone("👍","x"),"👍");
});

test("inserção usa a seleção/cursor UTF-16 e preserva texto existente",()=>{
 assert.deepEqual(insertEmojiText("Bom dia",4,4,"😊"),{value:"Bom 😊dia",caret:6});
 assert.deepEqual(insertEmojiText("Olá mundo",4,9,"❤️"),{value:"Olá ❤️",caret:6});
 assert.deepEqual(insertEmojiText("Texto",null,null,"🎉"),{value:"Texto🎉",caret:7});
 assert.deepEqual(insertEmojiText("teste",1,1,"👨‍👩‍👧"),{value:"t👨‍👩‍👧este",caret:1+"👨‍👩‍👧".length});
});

test("recentes são únicos e limitados sem interferir no texto da mensagem",()=>{
 assert.deepEqual(addRecentEmoji(["😂","👍","😂"],"👍"),["👍","😂"]);
 assert.equal(addRecentEmoji(Array.from({length:40},(_,i)=>String(i)),"novo").length,28);
});

test("persistência mock sanitiza histórico e tom sem modificar outras preferências",()=>{
 const store={
  saved:null,
  read:()=>({recent:["❤️","❤️",null,21,"👍"],tone:"🏽"}),
  write:(key,value)=>{store.saved={key,value}}
 };
 const adapter=createMockEmojiPreferences(store);
 assert.deepEqual(adapter.read(),{recent:["❤️","👍"],tone:"🏽"});
 adapter.save({recent:["🎉"],tone:"nada"});
 assert.equal(store.saved.key,"wapphub-demo-emoji-preferences-v1");
 assert.deepEqual(store.saved.value,{recent:["🎉"],tone:""});
});

test("compositor integra seletor único, envia eventos input e respeita permissões",()=>{
 const picker=source("src/emoji-picker.mjs");
 const d2=source("src/d2.js"),main=source("src/main.js");
 const d3=source("src/d3.js"),html=source("index.html");
 const css=source("src/styles.css");
 assert.match(picker,/input\.setSelectionRange\(caret,caret\)/);
 assert.match(picker,/input\.dispatchEvent\(new Event\("input",\{bubbles:true\}\)\)/);
 assert.match(picker,/window\.visualViewport/);
 assert.match(picker,/event\.key==="Escape"/);
 assert.match(d2,/setupEmojiPicker\(\{trigger:\$\("#emoji-button"\),input:\$\("#message-input"\)\}\)/);
 assert.doesNotMatch(d2,/openMenu\(\["🙂","👍","❤️","✅"\]/);
 assert.match(main,/closeD2EmojiPicker\(\)/);
 assert.match(d3,/\$\("#emoji-button"\)\.disabled=!canSend\(c\)/);
 assert.match(html,/id="emoji-button"[^>]*aria-expanded="false"/);
 assert.match(css,/\.emoji-picker-grid/);
 assert.match(css,/body\.module-active \.emoji-picker\{display:none!important\}/);
});
