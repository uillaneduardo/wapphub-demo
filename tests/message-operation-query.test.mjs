import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createMessageOperationQueryService} from "../src/services/message-operation-query.mjs";
import {createMockMessageOperationQueryRepository} from "../src/data/adapters/mock/message-operation-query.mjs";
import {createMessageCommandService} from "../src/services/message-commands.mjs";
import {createMockMessageCommandRepository} from "../src/data/adapters/mock/message-commands.mjs";
import {createMockMessageHistoryRepository} from "../src/data/adapters/mock/message-history.mjs";
import {createMessageHistoryService} from "../src/services/message-history.mjs";
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const build=()=>{
 const conversations=[
  {id:"a",name:"Origem",phone:"81999999999",channelId:"wa",messages:[
   {id:"m1",conversationId:"a",direction:"in",body:"Olá",createdAt:"2026-10-29T12:00:00Z",file:{kind:"image",url:"blob:demo",name:"Foto"}},
   {id:"m2",conversationId:"a",direction:"out",body:"Vou responder",status:"failed",reply:{conversationId:"a",messageId:"m1",body:"Olá"}}
  ]},
  {id:"b",name:"Destino",phone:"81988888888",channelId:"wa",assigned:true,assignedToMemberId:"member-agent",messages:[]},
  {id:"c",name:"Outro",phone:"81977777777",channelId:"web",assigned:false,messages:[]}
 ];
 const service=createMessageOperationQueryService(createMockMessageOperationQueryRepository(conversations));
 const commands=createMessageCommandService(createMockMessageCommandRepository(conversations));
 const history=createMessageHistoryService(createMockMessageHistoryRepository(conversations));
 return {conversations,service,commands,history};
};
test("consultas isolam objetos do catálogo e histórico",async()=>{
 const {conversations,service,history}=build();
 const first=await service.getMessage("a","m1");
 const group=await service.getMessages("a",["m2","m1","m1"]);
 assert.equal(group.length,2);
 assert.equal(group[0].id,"m2");
 assert.equal(group[1].id,"m1");
 assert.equal(await service.getMessage("a","missing"),null);
 first.file.name="Alterado";
 group[0].reply.body="Trocado";
 assert.equal(conversations[0].messages[0].file.name,"Foto");
 assert.equal(conversations[0].messages[1].reply.body,"Olá");
 assert.equal((await history.listMessages("a")).items[0].file.name,"Foto");
});
test("destinatários recebem apenas metadados isolados, sem mensagens",async()=>{
 const {service,conversations}=build();
 const recipients=await service.listRecipients("a");
 assert.deepEqual(recipients.map(c=>c.id),["b","c"]);
 assert.equal(recipients[0].messages,undefined);
 assert.equal(recipients[0].assignedToMemberId,"member-agent");
 recipients[0].phone="alterado";
 assert.equal(conversations[1].phone,"81988888888");
});
test("ações seguem atualizando status, reenvio, encaminhamento e exclusão",async()=>{
 const {service,commands,conversations}=build();
 const sent=await commands.retryDemo("a","m2");
 assert.equal(sent.status,"sent");
 assert.equal((await service.getMessage("a","m2")).status,"sent");
 assert.deepEqual(await commands.forward("a",["m1"],["b"],{time:"10:00"}),{messages:1,destinations:1});
 const forwarded=await service.getMessages("b",conversations[1].messages.map(m=>m.id));
 assert.equal(forwarded[0].forwarded,true);
 await commands.remove("a",["m1"],true);
 const deleted=await service.getMessage("a","m1");
 assert.equal(deleted.deletedAll,true);
 assert.equal(deleted.body,"Mensagem apagada");
 assert.equal(deleted.file,undefined);
 await commands.send("a",{id:"new",conversationId:"a",body:"Mensagem de volta",direction:"out",time:"10:01"});
 assert.equal((await service.getMessage("a","new")).body,"Mensagem de volta");
});
test("falhas de leitura propagam e formatos incorretos são rejeitados",async()=>{
 assert.throws(()=>createMessageOperationQueryService({}),/obrigatório/);
 const failed=createMessageOperationQueryService({
  getMessage:async()=>{throw Error("Core indisponível")},getMessages:async()=>[],listRecipients:async()=>[]
 });
 await assert.rejects(failed.getMessage("a","m1"),/Core indisponível/);
 await assert.rejects(failed.getMessages("a",[]),/inválidos/);
 await assert.rejects(failed.listRecipients(""),/inválido/);
 const malformed=createMessageOperationQueryService({
  getMessage:async()=>({id:"m1",conversationId:"outro"}),
  getMessages:async()=>[{id:"m1",conversationId:"outro"}],
  listRecipients:async()=>[{id:3}]
 });
 await assert.rejects(malformed.getMessage("a","m1"),/inválida/);
 await assert.rejects(malformed.getMessages("a",["m1"]),/inválida/);
 await assert.rejects(malformed.listRecipients("a"),/inválida/);
});
test("D8.6 troca acesso direto no D2 por serviço e mantém comandos",()=>{
 const d2=source("src/d2.js"),main=source("src/main.js");
 assert.doesNotMatch(d2,/const byId=/);
 assert.doesNotMatch(d2,/byId\(/);
 assert.doesNotMatch(d2,/all\(\)/);
 assert.doesNotMatch(d2,/resolveReplyTarget\(/);
 assert.match(d2,/operationQuery\.getMessage/);
 assert.match(d2,/operationQuery\.getMessages/);
 assert.match(d2,/operationQuery\.listRecipients/);
 assert.match(main,/createMessageOperationQueryService\(createMockMessageOperationQueryRepository\(conversations\)\)/);
 assert.match(main,/messageOperationQuery\);/);
 assert.match(d2,/await commands\.send\(c\.id,m\)/);
 assert.match(d2,/await commands\.forward\(source\.id/);
});
