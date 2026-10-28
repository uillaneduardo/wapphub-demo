import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {parseRoute,providerPath} from "../src/router/routes.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("D6.3 route navigation supports session, channels, diagnostics and events",()=>{
 for(const tab of ["overview","session","channels","diagnostics","events"]){
  const path=providerPath("demo-baileys-commercial",tab);
  assert.equal(parseRoute(path).params.providerTab,tab);
 }
 assert.equal(parseRoute("/settings/providers/unknown/invalid").name,"not-found");
});
test("D6.3 session and QR lifecycle are clearly simulated",()=>{
 const ui=read("src/provider-details.js");
 for(const phrase of ["QR ILUSTRATIVO","Não escaneável","Gerar / renovar QR ilustrativo","Simular reconexão","Simular conexão estabelecida","Simular falha","Desvincular sessão"])
  assert.ok(ui.includes(phrase),phrase);
 assert.match(ui,/window\.confirm/);
 assert.match(ui,/expiresAt/);
 assert.match(ui,/providerRepository\.updateSession/);
 assert.match(ui,/providerRepository\.setConnectionState/);
 assert.doesNotMatch(ui,/localStorage\.|\bfetch\(|XMLHttpRequest|WebSocket\(/);
});
test("D6.3 details use repository for editable identification, channels, metrics and events",()=>{
 const ui=read("src/provider-details.js"),list=read("src/provider-management.js");
 for(const operation of ["getConnection","listTypes","updateConnection","assignChannels","getHealth","listEvents"])
  assert.ok(ui.includes("providerRepository."+operation),operation);
 assert.match(ui,/aria-current/);
 assert.match(ui,/Simulação|simulação|fictíci/);
 assert.match(ui,/connection/);
 assert.match(list,/renderProviderDetails/);
 assert.match(read("src/styles.css"),/\.provider-health-grid/);
 assert.match(read("src/styles.css"),/\.provider-event-list/);
 assert.match(read("index.html"),/main\.js\?v=d6-3/);
});
test("D6.3 repository manages session state separately and bounds history",()=>{
 const repo=read("src/data/adapters/mock/provider-repository.js");
 assert.match(repo,/async updateSession\(id,command\)/);
 assert.match(repo,/CONNECTION_STATES\.includes\(next\)/);
 assert.match(repo,/state\.events\.slice\(-250\)/);
 assert.match(repo,/pendingMessages:status==="syncing"\?12:0/);
 assert.match(repo,/simulated:true/);
});
