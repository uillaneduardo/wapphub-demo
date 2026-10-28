import test from "node:test";
import assert from "node:assert/strict";
import { createConversationReadService } from "../src/services/conversation-read.mjs";
import { createMockConversationReadRepository } from "../src/data/adapters/mock/conversation-read.mjs";

test("marca como lida somente a conversa solicitada", async () => {
  const items = [{id:"a",unread:3},{id:"b",unread:2}];
  const service = createConversationReadService(createMockConversationReadRepository(items));
  assert.deepEqual(await service.markRead("a"), {id:"a",unread:0});
  assert.equal(items[1].unread,2);
});
test("não expõe a referência mutável no retorno", async () => {
  const items=[{id:"a",unread:1}];
  const service=createConversationReadService(createMockConversationReadRepository(items));
  const result=await service.markRead("a");
  result.unread=999;
  assert.equal(items[0].unread,0);
});
test("IDs inválidos e inexistentes são rejeitados", async () => {
  const service=createConversationReadService(createMockConversationReadRepository([]));
  await assert.rejects(service.markRead(""),/ID/);
  await assert.rejects(service.markRead("ausente"),/não encontrada/);
});
test("aceita implementação futura do contrato assíncrono", async () => {
  const service=createConversationReadService({markRead:async id=>({id,unread:0})});
  assert.deepEqual(await service.markRead("x"),{id:"x",unread:0});
});
