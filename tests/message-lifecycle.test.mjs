import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeMockConversations} from "../src/data/adapters/mock/message-store.mjs";
import {createMessageCommandService} from "../src/services/message-commands.mjs";
import {createMockMessageCommandRepository} from "../src/data/adapters/mock/message-commands.mjs";
import {createConversationActionService} from "../src/services/conversation-actions.mjs";
import {createMockConversationActionRepository} from "../src/data/adapters/mock/conversation-actions.mjs";
import {demoDeliveryLabels} from "../src/domain/message-status.mjs";

const fixtures=()=>normalizeMockConversations([
 {id:"a",messages:[["in","Oi","09:00"],["out","Olá","09:01"]],unread:2,status:"Em atendimento"},
 {id:"b",messages:[],unread:0,status:"Em atendimento"}
]);

test("normalização ocorre uma vez, preserva IDs, vínculo e os objetos existentes",()=>{
 const list=fixtures(),ref=list[0],first=list[0].messages[0],id=first.id;
 assert.deepEqual([first.body,first.direction,first.time],["Oi","in","09:00"]);
 assert.equal(first.conversationId,"a");
 normalizeMockConversations(list);
 assert.equal(list[0],ref);
 assert.equal(list[0].messages[0],first);
 assert.equal(list[0].messages[0].id,id);
 assert.equal(list[0].messages[1].id,"demo:a:1");
});

test("status de envio é ilustrativo, somente mensagens de saída",async()=>{
 const conversations=fixtures();
 const commands=createMessageCommandService(createMockMessageCommandRepository(conversations));
 const original=conversations[0].messages[1];
 assert.equal((await commands.cycleDemoStatus("a",original.id)).status,"delivered");
 assert.equal((await commands.cycleDemoStatus("a",original.id)).status,"read");
 assert.equal((await commands.cycleDemoStatus("a",original.id)).status,"failed");
 assert.equal(demoDeliveryLabels[original.status],"Falha (simulação)");
 assert.deepEqual(await commands.retryDemo("a",original.id),{id:original.id,status:"sent",simulated:true});
 await assert.rejects(commands.retryDemo("a",original.id),/Somente mensagens com falha/);
 await assert.rejects(commands.cycleDemoStatus("a",conversations[0].messages[0].id),/enviada não encontrada/);
});

test("exclusão global impede transições e reenvio simulado",async()=>{
 const conversations=fixtures();
 const commands=createMessageCommandService(createMockMessageCommandRepository(conversations));
 const id=conversations[0].messages[1].id;
 await commands.remove("a",[id],true);
 await assert.rejects(commands.cycleDemoStatus("a",id),/enviada não encontrada/);
 await assert.rejects(commands.retryDemo("a",id),/Somente mensagens com falha/);
});

test("marcar como não lida e encerrar/reabrir preservam o escopo da conversa",async()=>{
 const conversations=fixtures(),actions=createConversationActionService(createMockConversationActionRepository(conversations));
 assert.deepEqual(await actions.markUnread("b"),{id:"b",unread:1});
 assert.equal(conversations[0].unread,2);
 assert.deepEqual(await actions.setAttendanceStatus("a","Finalizado"),{id:"a",status:"Finalizado"});
 assert.equal(conversations[1].status,"Em atendimento");
 await actions.setAttendanceStatus("a","Em atendimento");
 assert.equal(conversations[0].status,"Em atendimento");
 await assert.rejects(actions.setAttendanceStatus("a","Indefinido"),/inválido/);
 await assert.rejects(actions.markUnread("ausente"),/não encontrada/);
 assert.throws(()=>createConversationActionService({}),/obrigatório/);
});

test("a UI não normaliza nem muta diretamente comandos de mensagem ou atendimento",()=>{
 const ui=readFileSync(new URL("../src/d2.js",import.meta.url),"utf8");
 assert.doesNotMatch(ui,/const normalize=c=>/);
 assert.doesNotMatch(ui,/\.messages\.push\(/);
 assert.doesNotMatch(ui,/\.status="Finalizado"/);
 assert.doesNotMatch(ui,/\.unread=1/);
 assert.match(ui,/commands\.cycleDemoStatus/);
 assert.match(ui,/commands\.retryDemo/);
 assert.match(ui,/conversationActions\.setAttendanceStatus/);
});
