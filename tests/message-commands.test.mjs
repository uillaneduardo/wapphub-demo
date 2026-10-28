import test from "node:test";
import assert from "node:assert/strict";
import {createMessageCommandService} from "../src/services/message-commands.mjs";
import {createMockMessageCommandRepository} from "../src/data/adapters/mock/message-commands.mjs";
const build=()=>{
 const conversations=[{id:"a",messages:[],preview:"",time:""},{id:"b",messages:[],preview:"",time:""}];
 return {conversations,commands:createMessageCommandService(createMockMessageCommandRepository(conversations))};
};
test("send atualiza somente conversa destino e mantém IDs",async()=>{
 const {conversations,commands}=build();
 await commands.send("a",{id:"m1",conversationId:"a",body:"Olá",time:"10:00"});
 await commands.send("a",{id:"m1",conversationId:"a",body:"Olá",time:"10:00"});
 assert.equal(conversations[0].messages.length,1);
 assert.equal(conversations[1].messages.length,0);
 assert.equal(conversations[0].preview,"Olá");
});
test("encaminhamento preserva origem e gera novos IDs",async()=>{
 const {conversations,commands}=build();
 await commands.send("a",{id:"m1",conversationId:"a",body:"Texto",time:"10:00"});
 const result=await commands.forward("a",["m1"],["b"],{time:"10:01"});
 assert.deepEqual(result,{messages:1,destinations:1});
 assert.equal(conversations[0].messages[0].forwarded,undefined);
 assert.equal(conversations[1].messages[0].forwarded,true);
 assert.notEqual(conversations[1].messages[0].id,"m1");
});
test("exclusão local e geral possuem comportamentos distintos",async()=>{
 const {conversations,commands}=build();
 await commands.send("a",{id:"m1",conversationId:"a",body:"Um",time:"10:00"});
 await commands.send("a",{id:"m2",conversationId:"a",body:"Dois",time:"10:00",file:{name:"arquivo"}});
 await commands.remove("a",["m1"],false);
 assert.equal(conversations[0].messages[0].hidden,true);
 await commands.remove("a",["m2"],true);
 assert.equal(conversations[0].messages[1].body,"Mensagem apagada");
 assert.equal(conversations[0].messages[1].file,undefined);
});
test("contrato inválido e conversa inexistente falham explicitamente",async()=>{
 assert.throws(()=>createMessageCommandService({}),/obrigatório/);
 const {commands}=build();
 await assert.rejects(commands.send("missing",{conversationId:"missing",body:"Oi"}),/não encontrada/);
 await assert.rejects(commands.forward("a",["x"],["b"],{time:"10:00"}),/Seleção inválida/);
});
