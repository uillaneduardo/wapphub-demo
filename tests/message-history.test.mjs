import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createMockMessageHistoryRepository} from "../src/data/adapters/mock/message-history.mjs";
import {createMessageHistoryService,createMessageHistoryWindow} from "../src/services/message-history.mjs";
const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const build=()=>{
 const messages=Array.from({length:145},(_,i)=>({
  id:"m"+i,conversationId:"a",direction:i%2?"out":"in",
  body:"Mensagem "+i,time:"12:00",createdAt:new Date(2026,9,1+i%20).toISOString(),
  ...(i===0?{file:{kind:"image",url:"blob:illustrative",name:"Imagem"},reply:{conversationId:"a",messageId:"m30"}}:{})
 }));
 const conversations=[{id:"a",messages},{id:"b",messages:[{id:"b1",body:"Outro",conversationId:"b"}]}];
 const repository=createMockMessageHistoryRepository(conversations);
 const service=createMessageHistoryService(repository);
 return {messages,conversations,repository,service};
};
test("páginas recentes e anteriores com cursor estável, sem duplicação",async()=>{
 const {service}=build();
 const newest=await service.listMessages("a",{limit:60});
 assert.deepEqual([newest.items[0].id,newest.items.at(-1).id],["m85","m144"]);
 const previous=await service.listMessages("a",{before:newest.nextCursor,limit:60});
 assert.deepEqual([previous.items[0].id,previous.items.at(-1).id],["m25","m84"]);
 const oldest=await service.listMessages("a",{before:previous.nextCursor,limit:60});
 assert.deepEqual([oldest.items[0].id,oldest.items.at(-1).id],["m0","m24"]);
 assert.equal(oldest.nextCursor,null);
 assert.equal(new Set([...oldest.items,...previous.items,...newest.items].map(m=>m.id)).size,145);
});
test("anexos, respostas e datas preservados em snapshots isolados",async()=>{
 const {service,messages}=build();
 const first=(await service.listMessages("a",{limit:1000})).items[0];
 assert.deepEqual(first.reply,{conversationId:"a",messageId:"m30"});
 assert.equal(first.file.url,"blob:illustrative");
 const expectedDate=messages[0].createdAt;
 first.file.url="alterado";first.reply.messageId="substituído";first.createdAt="";
 assert.equal(messages[0].file.url,"blob:illustrative");
 assert.equal(messages[0].reply.messageId,"m30");
 assert.equal(messages[0].createdAt,expectedDate);
});
test("janelas expandem, atualizam e trocam de conversa sem misturar histórico",async()=>{
 const {service,messages}=build();
 const window=createMessageHistoryWindow(service,{pageSize:60});
 assert.equal((await window.load("a")).items.length,60);
 let page=await window.load("a","older");
 assert.equal(page.items.length,120);
 page=await window.load("a","all");
 assert.equal(page.items.length,145);
 assert.equal(page.nextCursor,null);
 messages.push({id:"m145",conversationId:"a",body:"Nova"});
 page=await window.load("a");
 assert.equal(page.items.at(-1).id,"m145");
 assert.equal(page.items.length,146);
 page=await window.load("b");
 assert.equal(page.items.length,1);
 assert.equal(page.items[0].id,"b1");
});
test("erros de cursor, limite e conversa propagados sem fallback",async()=>{
 const {service}=build();
 await assert.rejects(service.listMessages("a",{before:"outro",limit:60}),/Cursor inválido/);
 await assert.rejects(service.listMessages("a",{before:"before:inexistente"}),/Cursor expirado/);
 await assert.rejects(service.listMessages("a",{limit:0}),/Limite inválido/);
 await assert.rejects(service.listMessages("ausente"),/não encontrada/);
 await assert.rejects(service.listMessages(""),/ID/);
 assert.throws(()=>createMessageHistoryService({}),/obrigatório/);
 const bad=createMessageHistoryService({listMessages:async()=>({items:[],nextCursor:null})});
 await assert.rejects(bad.listMessages("a"),/inválida/);
});
test("consultas obsoletas não sobrepõem o chat após navegação",async()=>{
 const {service}=build();
 let resolvePending;
 const deferred=createMessageHistoryService({
  listMessages: (id,opts)=>id==="a"?new Promise(resolve=>{resolvePending=resolve}):service.listMessages(id,opts)
 });
 const window=createMessageHistoryWindow(deferred);
 const old=window.load("a");
 const current=await window.load("b");
 resolvePending({conversationId:"a",items:[{id:"invasor"}],nextCursor:null});
 assert.equal(await old,null);
 assert.equal(current.items[0].id,"b1");
 assert.equal(window.snapshot().conversationId,"b");
});
test("integração usa consulta assíncrona, sem acessar arrays diretamente ao renderizar",()=>{
 const main=source("src/main.js");
 assert.match(main,/createMessageHistoryWindow/);
 assert.match(main,/await historyWindow\.load/);
 assert.match(main,/renderD2\(\{\.\.\.conversation,messages:history\.items\},messages\)/);
});

test("consulta integral funciona mesmo antes da página inicial",async()=>{
 const {service}=build();
 const window=createMessageHistoryWindow(service,{pageSize:60});
 const page=await window.load("a","all");
 assert.equal(page.items.length,145);
 assert.equal(page.nextCursor,null);
});
test("novo controle de paginação preserva âncora de scroll e não altera compositor",()=>{
 const main=source("src/main.js");
 const styles=source("src/styles.css");
 assert.match(main,/history\.nextCursor&&!isD2Searching\(\)/);
 assert.match(main,/Carregar mensagens anteriores/);
 assert.match(main,/priorTop\+Math\.max\(0,messages\.scrollHeight-priorHeight\)/);
 assert.match(styles,/\.history-load-older/);
});
