import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createMockInboxQueryRepository} from "../src/data/adapters/mock/inbox-query.mjs";
import {createInboxQueryService} from "../src/services/inbox-query.mjs";
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const build=()=>{
 const conversations=[
  {id:"a",name:"João",phone:"81999999999",channelId:"wa",unread:2,assigned:true,assignedToMemberId:"agent-1",preview:"Primeira",status:"Em atendimento",messages:[{id:"msg",body:"segredo de teste"}]},
  {id:"b",name:"Maria",phone:"81988888888",channelId:"web",unread:0,assigned:false,preview:"Segunda",messages:[]},
  {id:"c",name:"Sem acesso",phone:"81977777777",channelId:"wa",unread:3,assigned:false,preview:"Terceira",messages:[]}
 ];
 const repository=createMockInboxQueryRepository(conversations);
 const service=createInboxQueryService(repository);
 const base={
  canAccess:c=>c.id!=="c",
  channels:[{id:"wa",enabled:true},{id:"web",enabled:true}],
  selectedChannels:null,filter:"all",query:"",
  nameOf:c=>c.name,
  conversationMatchesChannels:(c,selected,channels)=>channels.some(ch=>ch.id===c.channelId&&ch.enabled!==false&&(selected===null||selected.has(ch.id)))
 };
 return {conversations,repository,service,base};
};
test("repositório retorna metadados sem mensagens nem referências mutáveis",async()=>{
 const {conversations,repository}=build();
 const list=await repository.list();
 assert.equal(list.length,3);
 assert.equal(list[0].messages,undefined);
 assert.equal(list[0].preview,"Primeira");
 list[0].preview="Alterada";
 assert.equal(conversations[0].preview,"Primeira");
 assert.equal((await repository.get("a")).name,"João");
 assert.equal(await repository.get("ausente"),null);
});
test("Inbox aplica busca, canais, não lidas e permissão simulada",async()=>{
 const {service,base}=build();
 assert.deepEqual((await service.list(base)).map(c=>c.id),["a","b"]);
 assert.deepEqual((await service.list({...base,filter:"unread"})).map(c=>c.id),["a"]);
 assert.deepEqual((await service.list({...base,filter:"mine"})).map(c=>c.id),["a"]);
 assert.deepEqual((await service.list({...base,query:"maria"})).map(c=>c.id),["b"]);
 assert.deepEqual((await service.list({...base,selectedChannels:new Set(["web"])})).map(c=>c.id),["b"]);
 assert.deepEqual((await service.list({...base,selectedChannels:new Set()})).map(c=>c.id),[]);
});
test("leituras refletem mensagens, atribuições e canais após mudança no adaptador",async()=>{
 const {service,conversations,base}=build();
 const initial=await service.get("a");
 conversations[0].unread=0;conversations[0].assigned=false;
 assert.equal(initial.unread,2);
 assert.equal((await service.get("a")).unread,0);
 assert.deepEqual((await service.list({...base,filter:"unread"})).map(c=>c.id),[]);
 conversations[1].channelId="wa";
 assert.deepEqual((await service.list({...base,selectedChannels:new Set(["web"])})).map(c=>c.id),[]);
});
test("erros de API ou dados malformados não caem silenciosamente em mock",async()=>{
 assert.throws(()=>createInboxQueryService({}),/inválido/);
 const service=createInboxQueryService({list:async()=>{throw Error("Core indisponível")},get:async()=>null});
 const {base}=build();
 await assert.rejects(service.list(base),/Core indisponível/);
 const malformed=createInboxQueryService({list:async()=>({items:[]}),get:async()=>null});
 await assert.rejects(malformed.list(base),/formato inválido/);
 await assert.rejects(service.get(""),/ID/);
});
test("UI da Inbox usa serviço assíncrono e descarta respostas de consultas obsoletas",()=>{
 const main=source("src/main.js");
 assert.match(main,/createInboxQueryService/);
 assert.match(main,/createMockInboxQueryRepository/);
 assert.match(main,/await inboxQueryService\.list/);
 assert.match(main,/generation!==inboxRenderGeneration/);
 assert.doesNotMatch(main,/filterInboxConversations\(/);
});
