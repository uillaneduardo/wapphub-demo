import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createMockStorage} from "../src/data/adapters/mock/storage.mjs";

const KEY={
 admin:"wapphub-demo-admin-v1",policy:"wapphub-demo-permissions-v1",
 assign:"wapphub-demo-assignments-v1",channels:"wapphub-demo-channels-v2",
 profile:"wapphub-demo-user-profile-v1"
};
const memory=(seed={})=>{
 const values=new Map(Object.entries(seed));
 let fail=false;
 return {
  values,
  getItem:key=>values.get(key)??null,
  setItem:(key,value)=>{if(fail)throw new Error("quota");values.set(key,value)},
  deny:next=>{fail=next}
 };
};
test("shared JSON storage preserves legacy keys, clones fallbacks and reports failures",()=>{
 const store=memory({"legacy":'{"count":2}',"broken":"{bad"});
 const adapter=createMockStorage(store);
 assert.deepEqual(adapter.read("legacy",{count:0}),{count:2});
 const fallback={list:[]};
 const result=adapter.read("missing",fallback);result.list.push("x");
 assert.deepEqual(fallback,{list:[]});
 assert.deepEqual(adapter.read("broken",{ok:true}),{ok:true});
 assert.deepEqual(adapter.read("missing",null),null);
 assert.equal(adapter.write("legacy",{count:3}),true);
 assert.deepEqual(JSON.parse(store.getItem("legacy")),{count:3});
 store.deny(true);
 assert.throws(()=>adapter.write("legacy",{count:4}),/quota/);
 assert.deepEqual(JSON.parse(store.getItem("legacy")),{count:3});
 assert.throws(()=>createMockStorage(null).write("anything",{}),/indisponível/);
});
test("admin, permissions, assignment, channels and profile retain saved configuration and rollback failures",async()=>{
 const seeded=memory({
  [KEY.admin]:JSON.stringify({organization:{name:"Organização Salva",slug:"org-salva",locale:"pt-BR",timezone:"America/Recife"},teams:[{id:"team-existing",name:"Equipe Salva"}],members:[{id:"member-owner",name:"Admin Salvo",status:"active"}],invites:[]}),
  [KEY.channels]:JSON.stringify({providers:[{id:"custom",name:"Provider Salvo",kind:"external"}],channels:[{id:"c-existing",name:"Canal Salvo",platform:"web",provider:"custom",state:"connected",enabled:true}]}),
  [KEY.policy]:JSON.stringify({SUPERVISOR:{deleteAll:true}}),
  [KEY.assign]:JSON.stringify({mariana:"member-owner"}),
  [KEY.profile]:JSON.stringify({name:"Nome Salvo",displayName:"Exibição Salva"})
 });
 const priorStorage=Object.getOwnPropertyDescriptor(globalThis,"localStorage");
 const priorWindow=globalThis.window;
 const priorEvent=globalThis.Event;
 const events=[];
 try{
  Object.defineProperty(globalThis,"localStorage",{value:seeded,configurable:true});
  globalThis.window={dispatchEvent:event=>events.push(event.type)};
  globalThis.Event=class {constructor(type){this.type=type}};
  const admin=await import("../src/admin-data.js");
  const access=await import("../src/demo-access-store.js");
  const channels=await import("../src/channels.js");
  const profile=await import("../src/profile-store.js");
  assert.equal(admin.adminState().organization.name,"Organização Salva");
  assert.equal(admin.adminState().teams[0].id,"team-existing");
  assert.equal(channels.providers[0].id,"custom");
  assert.equal(channels.channels[1].id,"c-existing");
  assert.equal(access.roleAllows("SUPERVISOR","deleteAll"),true);
  assert.equal(profile.getProfile().displayName,"Exibição Salva");

  const original=channels.channels[1];
  channels.setChannelEnabled("c-existing",false);
  assert.equal(channels.channels[1],original);
  assert.equal(JSON.parse(seeded.getItem(KEY.channels)).channels[0].enabled,false);
  admin.mutateAdmin(data=>{data.organization.name="Nova Organização"});
  assert.equal(JSON.parse(seeded.getItem(KEY.admin)).organization.name,"Nova Organização");
  access.setRoleGrant("SUPERVISOR","deleteAll",false);
  assert.equal(access.roleAllows("SUPERVISOR","deleteAll"),false);
  const conversation={id:"mariana",assigned:true,status:"Em atendimento"};
  access.initializeAssignments([conversation],admin.adminState().members);
  assert.equal(conversation.assignedToMemberId,"member-owner");
  profile.saveProfile({displayName:"Novo nome"});
  assert.equal(profile.getProfile().displayName,"Novo nome");

  const beforeEvents=events.length;
  seeded.deny(true);
  assert.throws(()=>admin.mutateAdmin(data=>{data.organization.name="Perdido"}),/quota/);
  assert.equal(admin.adminState().organization.name,"Nova Organização");
  assert.throws(()=>channels.setChannelEnabled("c-existing",true),/quota/);
  assert.equal(channels.channels[1].enabled,false);
  assert.throws(()=>access.setRoleGrant("SUPERVISOR","deleteAll",true),/quota/);
  assert.equal(access.roleAllows("SUPERVISOR","deleteAll"),false);
  assert.throws(()=>access.assignConversation([conversation],admin.adminState().members,"mariana",null),/quota/);
  assert.equal(conversation.assignedToMemberId,"member-owner");
  assert.throws(()=>profile.saveProfile({displayName:"Não salvo"}),/quota/);
  assert.equal(profile.getProfile().displayName,"Novo nome");
  assert.equal(events.length,beforeEvents,"no change events on failed writes");
 }finally{
  if(priorStorage)Object.defineProperty(globalThis,"localStorage",priorStorage);
  else delete globalThis.localStorage;
  if(priorWindow===undefined)delete globalThis.window;else globalThis.window=priorWindow;
  if(priorEvent===undefined)delete globalThis.Event;else globalThis.Event=priorEvent;
 }
});
test("migrated legacy modules no longer access storage directly",()=>{
 for(const path of ["src/admin-data.js","src/demo-access-store.js","src/channels.js","src/profile-store.js","src/data/adapters/mock/contact-storage.mjs"]){
  const source=readFileSync(new URL("../"+path,import.meta.url),"utf8");
  assert.doesNotMatch(source,/localStorage\.(getItem|setItem)/,path);
  assert.match(source,/mockStorage|createMockStorage/,path);
 }
});
