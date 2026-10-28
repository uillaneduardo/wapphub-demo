import test from "node:test";
import assert from "node:assert/strict";
import {providerTypes,demoConnections,legacyConnections} from "../src/data/adapters/mock/provider-fixtures.mjs";
import {CONNECTION_STATES,normalizedConnection,validateConnectionCommand,filteredConnections} from "../src/data/contracts/provider-domain.mjs";
test("D6.1 types are explicit and independent of organization connections",()=>{
 assert.deepEqual(providerTypes.map(t=>t.id),["baileys","cloud-api","native-webchat","custom"]);
 assert.equal(demoConnections.length,4);
 assert.ok(demoConnections.every(c=>c.channelIds.length===0));
 assert.deepEqual(demoConnections.filter(c=>c.typeId==="baileys").map(c=>c.state),["connected","syncing","disconnected"]);
 assert.equal(demoConnections.find(c=>c.typeId==="cloud-api").state,"awaiting_auth");
});
test("D6.1 legacy providers/channels map without duplicating existing channels",()=>{
 const legacy=legacyConnections(
  [{id:"native",name:"WappHub Native",kind:"internal"},{id:"external",name:"WhatsApp (API)",kind:"external"}],
  [{id:"all"},{id:"wa-sales",provider:"external",state:"connected"},{id:"web-support",provider:"native",state:"connected"}]
 );
 assert.deepEqual(legacy.map(x=>x.id),["legacy:native","legacy:external"]);
 assert.deepEqual(legacy.find(x=>x.legacyProviderId==="external").channelIds,["wa-sales"]);
 assert.ok(!legacy.some(x=>x.channelIds.includes("all")));
});
test("D6.1 commands validate duplicate names, types and normalize states",()=>{
 const list=[{id:"a",name:"Comercial"}];
 assert.match(validateConnectionCommand({id:"b",name:"comercial",typeId:"baileys"},list),/Já existe/);
 assert.match(validateConnectionCommand({name:"ab",typeId:"baileys"},[]),/3 a 80/);
 assert.match(validateConnectionCommand({name:"Suporte",typeId:"unknown"},[]),/tipo/);
 assert.equal(validateConnectionCommand({name:"Suporte",typeId:"baileys"},[]),null);
 const item=normalizedConnection({id:"1",name:" Teste ",typeId:"baileys",state:"bogus",channelIds:["a","a","b"]});
 assert.equal(item.state,"not_configured");assert.equal(item.name,"Teste");
 assert.deepEqual(item.channelIds,["a","b"]);
 assert.ok(CONNECTION_STATES.includes("syncing"));
});
test("D6.1 filtering supports state, type, case-insensitive names",()=>{
 assert.equal(filteredConnections(demoConnections,{type:"baileys"}).length,3);
 assert.equal(filteredConnections(demoConnections,{state:"syncing"}).length,1);
 assert.equal(filteredConnections(demoConnections,{search:"financeiro"}).length,1);
});
test("D6.1 mock repository does not overwrite legacy catalog and has typed async methods",async()=>{
 const cache=new Map();
 globalThis.localStorage={getItem:key=>cache.get(key)||null,setItem:(key,value)=>cache.set(key,value)};
 globalThis.window={dispatchEvent(){}};
 const repo=await import("../src/data/adapters/mock/provider-repository.js");
 const adapter=repo.createMockProviderRepository();
 const before=await adapter.listConnections();
 assert.ok(before.items.some(c=>c.id==="legacy:native"));
 assert.ok(before.items.some(c=>c.id==="legacy:external"));
 const item=await adapter.createConnection({name:"Conexão temporária",typeId:"baileys"});
 assert.ok(item.id.startsWith("conn-"));assert.equal(item.state,"not_configured");
 const linked=await adapter.assignChannels(item.id,["wa-sales"]);
 assert.deepEqual(linked.channelIds,["wa-sales"]);
 const after=await adapter.getConnection("legacy:external");
 assert.ok(!after.channelIds.includes("wa-sales"));
 const changed=await adapter.setConnectionState(item.id,"syncing");
 assert.equal(changed.state,"syncing");
 assert.equal((await adapter.getHealth(item.id)).pendingMessages,12);
 assert.ok((await adapter.listEvents(item.id)).length>=2);
 assert.ok(cache.has("wapphub-demo-provider-connections-v1"));
 assert.equal(cache.has("wapphub-demo-channels-v2"),false);
});
