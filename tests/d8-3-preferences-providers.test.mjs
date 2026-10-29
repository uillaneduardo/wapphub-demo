import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const memory=(seed={})=>{
 const values=new Map(Object.entries(seed));
 let blocked=false;
 return {
  values,
  getItem:key=>values.get(key)??null,
  setItem:(key,value)=>{if(blocked)throw new Error("quota denied");values.set(key,value)},
  deny:value=>{blocked=value}
 };
};

const globals=["localStorage","window","document","Event","CustomEvent"];
async function withGlobals(values,fn){
 const previous=new Map(globals.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
 for(const [key,value] of Object.entries(values))Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
 try{return await fn()}
 finally{
  for(const name of globals){
   const descriptor=previous.get(name);
   if(descriptor)Object.defineProperty(globalThis,name,descriptor);
   else delete globalThis[name];
  }
 }
}

test("D8.3 provider mutations roll back on unavailable storage and emit no success",async()=>{
 const storage=memory();
 const events=[];
 await withGlobals({localStorage:storage,window:{dispatchEvent(){}}},async()=>{
  const {createMockProviderRepository}=await import("../src/data/adapters/mock/provider-repository.js?d8-3-provider");
  const repo=createMockProviderRepository();
  repo.subscribe(event=>events.push(event));
  const added=await repo.createConnection({name:"Conexão para teste",typeId:"baileys"});
  assert.equal(events.length,1);
  const baseline=(await repo.listConnections()).items;
  const eventLog=await repo.listEvents(added.id);
  const saved=storage.getItem("wapphub-demo-provider-connections-v1");
  storage.deny(true);
  await assert.rejects(repo.createConnection({name:"Outra conexão",typeId:"baileys"}),/quota denied/);
  await assert.rejects(repo.updateConnection(added.id,{name:"Novo nome"}),/quota denied/);
  await assert.rejects(repo.setConnectionState(added.id,"failed"),/quota denied/);
  await assert.rejects(repo.updateSession(added.id,{state:"qr_pending"}),/quota denied/);
  await assert.rejects(repo.assignChannels(added.id,["wa-sales"]),/quota denied/);
  assert.deepEqual((await repo.listConnections()).items,baseline);
  assert.deepEqual(await repo.listEvents(added.id),eventLog);
  assert.equal(storage.getItem("wapphub-demo-provider-connections-v1"),saved);
  assert.equal(events.length,1,"nenhum evento de sucesso para gravações rejeitadas");
  storage.deny(false);
  assert.equal((await repo.setConnectionState(added.id,"syncing")).state,"syncing");
  assert.equal(events.length,2);
  const reloaded=await import("../src/data/adapters/mock/provider-repository.js?d8-3-reload");
  assert.equal((await reloaded.createMockProviderRepository().getConnection(added.id)).state,"syncing");
 });
});

test("D8.3 appearance and per-media settings persist first and keep UI state on quota errors",async()=>{
 const appearanceKey="wapphub-demo-appearance-v1";
 const mediaKey="wapphub-demo-media-blur-v1";
 const identity="mariana:media-01";
 const storage=memory({
  [appearanceKey]:JSON.stringify({mode:"dark",accent:"#2563eb",animations:false,blurMedia:true}),
  [mediaKey]:JSON.stringify({[identity]:false})
 });
 const events=[],root={dataset:{},style:{setProperty(){}}};
 await withGlobals({
  localStorage:storage,document:{documentElement:root},
  window:{dispatchEvent:event=>events.push(event.type)},
  Event:class{constructor(type){this.type=type}},
  CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}}
 },async()=>{
  const {appearance,setAppearance}=await import("../src/appearance.js?d8-3-appearance");
  assert.equal(appearance.mode,"dark");
  assert.equal(root.dataset.theme,"dark");
  assert.equal(storage.values.size,2,"initial render must not write defaults");
  setAppearance({mode:"light",animations:true});
  assert.equal(root.dataset.theme,"light");
  assert.equal(JSON.parse(storage.getItem(appearanceKey)).mode,"light");
  const prior={...appearance},notifications=events.length,original=storage.getItem(appearanceKey);
  storage.deny(true);
  assert.throws(()=>setAppearance({mode:"dark",blurMedia:false}),/quota denied/);
  assert.deepEqual(appearance,prior);
  assert.equal(root.dataset.theme,"light");
  assert.equal(storage.getItem(appearanceKey),original);
  assert.equal(events.length,notifications);
  storage.deny(false);

  const visibility=await import("../src/media-visibility-store.js?d8-3-media");
  assert.equal(visibility.isMediaBlurred(identity),false,"saved overrides survive reload");
  visibility.setMediaBlurred(identity,true);
  assert.equal(visibility.isMediaBlurred(identity),true);
  assert.equal(JSON.parse(storage.getItem(mediaKey))[identity],true);
  const emitted=events.filter(type=>type==="wapphub-media-blur-changed").length;
  storage.deny(true);
  assert.throws(()=>visibility.setMediaBlurred(identity,false),/quota denied/);
  assert.equal(visibility.isMediaBlurred(identity),true);
  assert.equal(JSON.parse(storage.getItem(mediaKey))[identity],true);
  assert.equal(events.filter(type=>type==="wapphub-media-blur-changed").length,emitted);
 });
});

test("D8.3 all remaining preference/provider writes are behind mock storage adapter",()=>{
 for(const path of [
  "src/appearance.js","src/media-visibility-store.js",
  "src/data/adapters/mock/provider-repository.js"
 ]){
  const source=readFileSync(new URL("../"+path,import.meta.url),"utf8");
  assert.doesNotMatch(source,/\blocalStorage\s*\./,path);
  assert.match(source,/mockStorage\.(read|write)/,path);
 }
 const settings=readFileSync(new URL("../src/settings.js",import.meta.url),"utf8");
 assert.match(settings,/toggle.checked=Boolean\(appearance\[key\]\)/);
 const media=readFileSync(new URL("../src/media-blur.js",import.meta.url),"utf8");
 assert.match(media,/Não foi possível salvar a preferência desta mídia/);
});
