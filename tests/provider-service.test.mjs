import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("D6.4 no UI provider imports adapters, local storage or HTTP",()=>{
 for(const file of ["src/provider-management.js","src/provider-details.js"]){
  const content=read(file);
  assert.match(content,/services\/provider-service\.js/);
  assert.doesNotMatch(content,/adapters\/mock|localStorage\.|\bfetch\(|XMLHttpRequest/);
 }
 const service=read("src/services/provider-service.js");
 const factory=read("src/data/create-provider-repository.js");
 assert.match(service,/createProviderRepository\("mock"\)/);
 assert.match(factory,/throw new Error/);
 assert.doesNotMatch(factory,/fetch\(|XMLHttpRequest/);
});
test("D6.4 service accepts any repository implementing the contract",async()=>{
 globalThis.localStorage={getItem:()=>null,setItem(){}};
 globalThis.window={dispatchEvent(){}};
 const {createProviderRepository}=await import("../src/data/create-provider-repository.js");
 const {createProviderService}=await import("../src/services/provider-service.js");
 assert.throws(()=>createProviderRepository("core-api"),/Nenhum fallback/);
 const calls=[];
 const fake={
  listTypes:async()=>[{id:"test"}],
  listConnections:async filter=>{calls.push(filter);return {items:[],nextCursor:null}},
  getConnection:async id=>({id}),
  createConnection:async o=>o,updateConnection:async(id,o)=>({id,...o}),
  setConnectionState:async(id,state)=>({id,state}),
  updateSession:async(id,session)=>({id,session}),
  assignChannels:async(id,channelIds)=>({id,channelIds}),
  getHealth:async()=>({simulated:true}),listEvents:async()=>[],
  subscribe:()=>()=>{}
 };
 const service=createProviderService(fake);
 assert.deepEqual(await service.listTypes(),[{id:"test"}]);
 assert.deepEqual((await service.getConnection("c")).id,"c");
 await service.listConnections({type:"baileys"});
 assert.deepEqual(calls,[{type:"baileys"}]);
 assert.deepEqual((await service.assignChannels("c",["wa"])).channelIds,["wa"]);
 assert.deepEqual((await service.updateSession("c",{state:"qr_pending"})).session,{state:"qr_pending"});
 assert.ok(Object.isFrozen(service));
});
test("D6.4 state & session persist through isolated mock repository refresh",async()=>{
 const memory=new Map();
 globalThis.localStorage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)};
 globalThis.window={dispatchEvent(){}};
 const {createMockProviderRepository}=await import("../src/data/adapters/mock/provider-repository.js?qa-first");
 const first=createMockProviderRepository();
 const created=await first.createConnection({name:"QA Persistência",typeId:"baileys"});
 await first.setConnectionState(created.id,"awaiting_auth");
 const expiresAt="2026-10-28T21:00:00.000Z";
 await first.updateSession(created.id,{state:"qr_pending",expiresAt});
 const again=await import("../src/data/adapters/mock/provider-repository.js?qa-reload");
 const persisted=await again.createMockProviderRepository().getConnection(created.id);
 assert.equal(persisted.session.state,"qr_pending");
 assert.equal(persisted.session.expiresAt,expiresAt);
 assert.equal(persisted.state,"awaiting_auth");
 assert.equal((await again.createMockProviderRepository().listConnections()).items.filter(x=>x.id===created.id).length,1);
});
test("D6.4 CI checks nested scripts, routes and mock-only API boundary",()=>{
 const ci=read(".github/workflows/homelab.yml");
 assert.match(ci,/find src -type f/);
 assert.match(ci,/node --input-type=module --check/);
 assert.match(ci,/src\/services\/provider-service\.js/);
 assert.match(ci,/settings\/providers\/demo-baileys-commercial\/diagnostics/);
});
