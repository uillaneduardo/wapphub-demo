import test from "node:test";
import assert from "node:assert/strict";
import {createMockMessageCommandRepository} from "../src/data/adapters/mock/message-commands.mjs";
import {createMessageCommandService} from "../src/services/message-commands.mjs";

function fixture(){
 const message={id:"m1",conversationId:"c1",direction:"out",body:"Texto inicial",time:"10:00",createdAt:"2026-11-03T13:00:00.000Z",status:"sent"};
 const conversation={id:"c1",messages:[message],preview:"Texto inicial",time:"10:00"};
 return {message,conversation,service:createMessageCommandService(createMockMessageCommandRepository([conversation]))};
}
test("editar mantém a identidade e registra versões completas em ordem",async()=>{
 const {message,conversation,service}=fixture();
 await service.edit("c1","m1","Texto corrigido",1);
 assert.equal(message.body,"Texto corrigido");
 assert.equal(message.revision,2);
 assert.equal(message.revisions.length,2);
 assert.deepEqual(message.revisions.map(v=>v.body),["Texto inicial","Texto corrigido"]);
 assert.equal(message.revisions[0].at,"2026-11-03T13:00:00.000Z");
 assert.equal(conversation.preview,"Texto corrigido");
 await service.edit("c1","m1","Terceira versão",2);
 assert.equal(message.revisions.length,3);
 assert.equal(message.revisions[2].revision,3);
});
test("edição concorrente ou sem alteração é rejeitada",async()=>{
 const {message,service}=fixture();
 await service.edit("c1","m1","Corrigido",1);
 await assert.rejects(service.edit("c1","m1","Alteração antiga",1),/alterada/);
 await assert.rejects(service.edit("c1","m1","Corrigido",2),/não foi alterado/);
 assert.equal(message.body,"Corrigido");
});
test("somente texto enviado, visível e não encaminhado pode ser editado",async()=>{
 for(const modifier of [{direction:"in"},{hidden:true},{deletedAll:true},{forwarded:true},{file:{kind:"image"}}]){
  const {message,service}=fixture();
  Object.assign(message,modifier);
  await assert.rejects(service.edit("c1","m1","Novo",1),/não pode ser editada/);
 }
});
test("mensagens vazias ou maiores que o limite são rejeitadas",async()=>{
 const {message,service}=fixture();
 await assert.rejects(service.edit("c1","m1","   ",1),/texto válido/);
 await assert.rejects(service.edit("c1","m1","x".repeat(4097),1),/4096/);
 assert.equal(message.body,"Texto inicial");
});
