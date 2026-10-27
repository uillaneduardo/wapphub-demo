import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {availableChannels,normalizeSelection,conversationMatchesChannels,selectionLabel} from "../src/channel-filter.mjs";
const channels=[
 {id:"all",enabled:true,name:"Todas"},
 {id:"a",name:"WhatsApp Comercial",enabled:true},
 {id:"b",name:"Chat Suporte",enabled:true},
 {id:"c",name:"Desativado",enabled:false}
];
const conversation=id=>({channelId:id});
test("filtro inicial agrega somente canais habilitados",()=>{
 assert.deepEqual(availableChannels(channels).map(c=>c.id),["a","b"]);
 for(const id of ["a","b"])assert.equal(conversationMatchesChannels(conversation(id),null,channels),true);
 assert.equal(conversationMatchesChannels(conversation("c"),null,channels),false);
});
test("seleção múltipla cruza conversas de cada canal escolhido",()=>{
 const selection=normalizeSelection(["a","b"],channels);
 assert.equal(selectionLabel(selection,channels),"2 canais selecionados");
 for(const id of ["a","b"])assert.equal(conversationMatchesChannels(conversation(id),selection,channels),true);
 assert.equal(conversationMatchesChannels(conversation("c"),selection,channels),false);
});
test("canal único, desabilitado e seleção vazia têm estados consistentes",()=>{
 assert.equal(selectionLabel(normalizeSelection(["a"],channels),channels),"WhatsApp Comercial");
 assert.deepEqual([...normalizeSelection(["b","c"],channels)],["b"]);
 assert.deepEqual([...normalizeSelection(["c"],channels)],[]);
 assert.deepEqual([...normalizeSelection([],channels)],[]);
 assert.equal(selectionLabel(new Set(),channels),"Nenhum canal selecionado");
 assert.equal(conversationMatchesChannels(conversation("a"),new Set(),channels),false);
});
test("interface e editor permanecem desacoplados da persistência",()=>{
 const ui=readFileSync(new URL("../src/channel-picker.js",import.meta.url),"utf8");
 const editor=readFileSync(new URL("../src/contact-editor.js",import.meta.url),"utf8");
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 for(const source of [ui,editor])assert.doesNotMatch(source,/localStorage\.|\bfetch\(|indexedDB\.|new XMLHttpRequest/);
 assert.match(ui,/role|aria-expanded/);
 assert.match(html,/channel-filter-popover/);
 assert.match(html,/i-layers/);
 assert.match(editor,/contact-editor-field/);
});
