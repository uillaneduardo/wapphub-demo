import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseRoute,providerPath} from "../src/router/routes.mjs";
import {checkRouteAccess} from "../src/router/guards.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("D6.2 nested provider routes preserve section and detail ID",()=>{
 assert.equal(providerPath(),"/settings/providers");
 assert.equal(providerPath("new"),"/settings/providers/new");
 assert.equal(parseRoute("/settings/providers/new").params.providerView,"new");
 assert.deepEqual(parseRoute("/settings/providers/demo-baileys-commercial").params,{
  section:"providers",providerView:"detail",providerId:"demo-baileys-commercial",providerTab:"overview"
 });
 assert.equal(parseRoute("/settings/providers/demo-baileys-commercial/diagnostics").params.providerTab,"diagnostics");
 assert.equal(parseRoute("/settings/providers/id/invalid").name,"not-found");
 assert.equal(providerPath("id","events"),"/settings/providers/id/events");
 assert.equal(checkRouteAccess(parseRoute("/settings/providers/new"),{role:"AGENT"}).status,"forbidden");
 assert.equal(checkRouteAccess(parseRoute("/settings/providers/new"),{role:"OWNER"}).status,"allowed");
});
test("D6.2 provider UI only consumes async repository; wizard never gathers real credentials",()=>{
 const ui=read("src/provider-management.js");
 assert.match(ui,/providerService\.listTypes\(\)/);
 assert.match(ui,/providerService\.listConnections\(current\)/);
 assert.match(ui,/providerService\.createConnection\(draft\)/);
 assert.match(ui,/Nova conexão/);
 assert.match(ui,/QR Code ilustrativo/);
 assert.match(ui,/Nenhuma credencial é solicitada/);
 assert.match(ui,/history\.replaceState/);
 assert.doesNotMatch(ui,/localStorage\.|\bfetch\(|XMLHttpRequest/);
 assert.doesNotMatch(ui,/type="password"|type='password'/);
});
test("D6.2 settings route passes domain options, UI keeps controls on mobile",()=>{
 const settings=read("src/settings.js"),main=read("src/main.js"),css=read("src/styles.css");
 assert.match(settings,/renderProviderWorkspace\(panel,\{route:providerRoute,onNavigate:onProviderNavigate\}\)/);
 assert.match(main,/providerRoute:\{\.\.\.route\.params,query:route\.query\}/);
 assert.match(main,/onProviderNavigate:path=>router\.navigate\(path\)/);
 assert.match(css,/\.provider-toolbar/);
 assert.match(css,/\.provider-type-grid/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(read("index.html"),/main\.js\?v=d6-4/);
});
