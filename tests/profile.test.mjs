import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("perfil editável navega pelo avatar e atualiza sua identidade",()=>{
 const main=src("src/main.js"),pages=src("src/pages.js");
 assert.match(main,/showModule\("perfil"\)/);
 assert.match(main,/demo-profile-updated/);
 assert.match(main,/renderProfileAvatar/);
 assert.match(pages,/renderProfilePage\(root,\{getProfile,saveProfile\}\)/);
});
test("a apresentação não depende da persistência",()=>{
 const panel=src("src/profile-panel.js"),store=src("src/profile-store.js");
 assert.doesNotMatch(panel,/localStorage\.|\bfetch\(/);
 assert.match(panel,/saveProfile\(\{\.\.\.data,photo:chosenPhoto\}\)/);
 assert.match(store,/localStorage\.setItem/);
 assert.match(store,/demo-profile-updated/);
 assert.match(panel,/photoFile|upload\.onchange|reader\.readAsDataURL/);
});
test("versão cacheada da interface reflete a nova tela",()=>{
 assert.match(src("index.html"),/main\.js\?v=swipe-2/);
 assert.match(src("src/main.js"),/pages\.js\?v=media-1/);
});
