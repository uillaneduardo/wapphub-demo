import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseRoute,conversationPath,contactPath,settingsPath,mediaPath} from "../src/router/routes.mjs";
const source=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("R2: routes for conversation, details, contact and settings",()=>{
 assert.deepEqual(parseRoute("/inbox/mariana").params,{conversationId:"mariana",details:false});
 assert.deepEqual(parseRoute("/inbox/mariana/details").params,{conversationId:"mariana",details:true});
 assert.deepEqual(parseRoute("/contacts/ricardo").params,{contactId:"ricardo"});
 assert.equal(parseRoute("/settings/appearance").params.section,"aparencia");
 assert.equal(parseRoute("/settings/permissions").params.section,"permissoes");
 assert.equal(conversationPath("mariana",{details:true}),"/inbox/mariana/details");
 assert.equal(contactPath("mariana"),"/contacts/mariana");
 assert.equal(settingsPath("aparencia"),"/settings/appearance");
});
test("R2: invalid or unrecognized nested routes return not-found",()=>{
 for(const path of ["/inbox/abc/details/extra","/inbox/%2Fbad","/settings/secret","/contacts/one/two","/inbox/%20"])
  assert.equal(parseRoute(path).name,"not-found",path);
});
test("R2: media URL keeps only intended query values",()=>{
 const url=mediaPath({conversationId:"mariana",type:"video",query:"teste com espaço"});
 const route=parseRoute(url);
 assert.equal(route.name,"midias");
 assert.equal(route.query.conversation,"mariana");
 assert.equal(route.query.type,"video");
 assert.equal(route.query.q,"teste com espaço");
 assert.equal(mediaPath({}),"/media");
});
test("R2: inbox actions and settings select use router while preserving state",()=>{
 const main=source("src/main.js"),settings=source("src/settings.js"),gallery=source("src/media-gallery.js"),pages=source("src/pages.js");
 assert.match(main,/router\.navigate\(conversationPath\(item\.dataset\.id\)\)/);
 assert.match(main,/router\.navigate\(conversationPath\(active\(\)\.id/);
 assert.match(main,/router\.navigate\("\/inbox"\)/);
 assert.match(main,/router\.navigate\(mediaPath\(\{conversationId\}\)\)/);
 assert.match(main,/route\.params\.conversationId/);
 assert.match(main,/showModule\("midias",\{/);
 assert.match(main,/showModule\("configuracoes",\{/);
 assert.match(settings,/onSectionChange\(sectionSelect\.value\)/);
 assert.match(gallery,/onFilterChange\(\{conversationId:select\.value,type:selectedType,query:search\.value\},true\)/);
 assert.match(pages,/contacts\(options\)/);
});
