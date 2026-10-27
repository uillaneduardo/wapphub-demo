import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {availableChannels,normalizeSelection,conversationMatchesChannels,selectionLabel} from "../src/channel-filter.mjs";
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const catalog=[
 {id:"all",enabled:true,name:"Todas"},
 {id:"a",enabled:true,name:"Comercial"},
 {id:"b",enabled:true,name:"Suporte"},
 {id:"c",enabled:false,name:"Desabilitado"}
];

test("D5: desmarcar todos é diferente de selecionar todos",()=>{
 const none=normalizeSelection([],catalog);
 assert.ok(none instanceof Set);
 assert.equal(none.size,0);
 assert.equal(selectionLabel(none,catalog),"Nenhum canal selecionado");
 assert.equal(conversationMatchesChannels({channelId:"a"},none,catalog),false);
 assert.equal(conversationMatchesChannels({channelId:"a"},null,catalog),true);
 assert.equal(conversationMatchesChannels({channelId:"c"},null,catalog),false);
});

test("D5: menu desfaz a seleção global sem marcar o item excluído",()=>{
 const picker=source("src/channel-picker.js");
 assert.match(picker,/selection===null\?new Set\(all\.map\(c=>c\.id\)\)/);
 assert.match(picker,/if\(check\.checked\)next\.add\(channel\.id\)/);
 assert.match(picker,/else next\.delete\(channel\.id\)/);
});

test("D5: seleção automática no mobile não zera não lidas",()=>{
 const main=source("src/main.js");
 assert.match(main,/if\(markRead\)c\.unread=0/);
 assert.match(main,/markRead:window\.matchMedia\("\(min-width:761px\)"\)\.matches/);
 assert.match(main,/if\(!candidates\.some\(c=>c\.id===state\.active\)\)clearActive\(\)/);
 assert.match(main,/root\.classList\.remove\("details-open","chat-open"\)/);
 assert.match(main,/setupD3\(active,\(\)=>\{onChannelSelection/);
 assert.match(main,/demo-assignments-updated/);
});

test("D5: módulos compartilham a mesma preferência de aparência",()=>{
 const main=source("src/main.js");
 const settings=source("src/settings.js");
 const appearance=source("src/appearance.js");
 assert.match(main,/appearance\.js\?v=channels-1/);
 assert.match(settings,/appearance\.js\?v=channels-1/);
 assert.match(main,/appearance\.mode==="light"\?"dark":"light"/);
 assert.match(appearance,/try\{localStorage\.setItem\(KEY/);
 assert.doesNotMatch(appearance,/Simulação de personalização pelo OWNER/);
});

test("D5: mobile, teclado e suporte a movimento reduzido continuam presentes",()=>{
 const css=source("src/styles.css"),html=source("index.html");
 assert.match(css,/\.details\{position:fixed!important/);
 assert.match(css,/\.rail\{position:fixed/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/safe-area-inset-bottom/);
 assert.match(html,/viewport-fit=cover/);
 assert.match(html,/id="channel-filter-popover"/);
});
