import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseRoute,pathFor,mainPaths} from "../src/router/routes.mjs";
const source=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("R1: root redirects and primary screens have canonical paths",()=>{
 assert.equal(parseRoute("/").path,"/inbox");
 for(const [name,path] of Object.entries(mainPaths)){
  assert.equal(pathFor(name),path);
  assert.equal(parseRoute(path).name,name);
  assert.equal(parseRoute(path+"/").name,name);
 }
});
test("R1: query parsing, unmatched path and no fragment-based navigation",()=>{
 assert.deepEqual(parseRoute("/media?type=image").query,{type:"image"});
 assert.equal(parseRoute("/does-not-exist").name,"not-found");
 assert.equal(parseRoute("/dashboard").title,"Visão geral");
 assert.equal(parseRoute("/%7Bsecret%7D").name,"not-found");
});
test("R1: browser history events and navigation are bound without external router",()=>{
 const js=source("src/router/router.js"),main=source("src/main.js");
 assert.match(js,/history\[replace\?"replaceState":"pushState"\]/);
 assert.match(js,/window\.addEventListener\("popstate",dispatch\)/);
 assert.match(main,/createRouter\(\{render:route/);
 assert.match(main,/router\.navigate\(pathFor\(b\.dataset\.nav\)\)/);
});
test("R1: nginx serves SPA history routes but not missing assets",()=>{
 const nginx=source("nginx.conf"),html=source("index.html");
 assert.match(nginx,/try_files \$uri \$uri\/ \/index\.html/);
 assert.match(nginx,/try_files \$uri =404/);
 assert.match(html,/<base href="\/"/);
 assert.match(html,/data-route/);
 assert.match(html,/main\.js\?v=d6-4/);
});
