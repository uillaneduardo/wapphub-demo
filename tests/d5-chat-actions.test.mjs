import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("D5: seleção múltipla pode ser iniciada no menu mesmo sem itens",()=>{
 const chat=src("src/d2.js");
 assert.match(chat,/selectionMode=true;selected\.clear\(\);selectionBar\(\)/);
 assert.match(chat,/if\(!selected\.size&&!selectionMode\)return/);
 assert.match(chat,/\(!selected\.size&&!selectionMode\)/);
 assert.match(chat,/selected\.size\?selected\.size\+" selecionada\(s\)":"Toque para selecionar"/);
 assert.match(chat,/b\.disabled=text!=="Cancelar"&&!selected\.size/);
 assert.match(chat,/role","toolbar"/);
 assert.match(chat,/if\(selectionMode\|\|selected\.size\)choose\(\[\]\)/);
});

test("D5: comandos do menu não são inertes e atualizam estado",()=>{
 const chat=src("src/d2.js");
 assert.doesNotMatch(chat,/Use o menu de uma mensagem para iniciar a seleção/);
 assert.doesNotMatch(chat,/\["Permissões",permissionsDialog\]/);
 assert.match(chat,/c\.status="Finalizado";refresh\(\)/);
 assert.match(chat,/c\.status="Em atendimento";refresh\(\)/);
 assert.match(chat,/if\(innerWidth<=760\)\$\("#app"\)\.classList\.remove\("chat-open"\)/);
});

test("D5: controles visíveis e compositor respeitam estado atual",()=>{
 const main=src("src/main.js");
 assert.match(main,/\$\("#detail-status"\)\.textContent=c\.status/);
 assert.match(main,/updateD3\(\)/);
 assert.match(main,/d2\.js\?v=motion-1/);
 assert.match(src("index.html"),/main\.js\?v=d6-3/);
});
