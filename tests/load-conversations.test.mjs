import test from "node:test";
import assert from "node:assert/strict";
import {conversations as fixtures} from "../src/data.js";
import {createLoadConversations,LOAD_CONVERSATION_COUNT} from "../src/data/adapters/mock/fixtures/load-conversations.mjs";
import {seedMediaFixtures} from "../src/media-fixtures.js";
import {normalizeMockConversations} from "../src/data/adapters/mock/message-store.mjs";
import {mediaEntries,filterMedia,mediaTotals} from "../src/media-catalog.mjs";
import {filterInboxConversations,filterAccessibleContacts} from "../src/domain/conversation-query.mjs";
import {conversationMatchesChannels} from "../src/channel-filter.mjs";

test("keeps the original six and adds exactly 50 deterministic conversations",()=>{
 const a=createLoadConversations(),b=createLoadConversations();
 assert.equal(LOAD_CONVERSATION_COUNT,50);
 assert.equal(a.length,50);
 assert.equal(fixtures.length,56);
 assert.deepEqual(fixtures.slice(0,6).map(c=>c.id),["mariana","ricardo","empresa","patricia","lucas","ana"]);
 assert.deepEqual(a,b,"same dataset on every reload");
 assert.equal(new Set(fixtures.map(c=>c.id)).size,56);
 assert.equal(new Set(a.map(c=>c.phone)).size,50);
 assert.ok(a.every(c=>c.id.startsWith("load-")&&c.phone.startsWith("+55 (81) 90000-")));
 assert.ok(a.every(c=>c.messages.length>=18));
 assert.ok(a.some(c=>c.messages.length>120),"at least one long history");
 assert.ok(a.reduce((total,c)=>total+c.messages.length,0)>2800,"large message volume");
 assert.ok(a.every(c=>c.preview===c.messages.at(-1).body));
 assert.ok(a.every(c=>c.messages.every((m,i)=>m.id===c.id+":msg-"+String(i+1).padStart(3,"0"))));
 assert.equal(new Set(a.map(c=>c.channelId)).size,4);
 assert.ok(a.some(c=>c.unread>0)&&a.some(c=>c.unread===0));
 assert.ok(a.some(c=>!c.assigned)&&a.some(c=>c.assigned));
 assert.ok(a.some(c=>c.status==="Finalizado"));
});
test("all 50 conversations have working mock image, file, audio and video references",()=>{
 const data=createLoadConversations();
 seedMediaFixtures(data);
 normalizeMockConversations(data);
 const entries=mediaEntries(data);
 assert.equal(entries.length,200);
 const totals=mediaTotals(entries);
 for(const kind of ["image","document","audio","video"]){
  assert.equal(totals[kind],50);
  assert.equal(filterMedia(entries,{kind}).length,50);
 }
 assert.equal(filterMedia(entries,{conversationId:"load-001"}).length,4);
 for(const c of data){
  const files=c.messages.filter(m=>m.file);
  assert.equal(files.length,4);
  assert.equal(new Set(files.map(m=>m.file.kind)).size,4);
  assert.ok(c.messages.every(m=>m.conversationId===c.id));
  assert.equal(new Set(c.messages.map(m=>m.id)).size,c.messages.length);
  assert.ok(files.some(m=>m.file.kind==="audio"&&m.file.url.startsWith("blob:")));
  assert.ok(files.some(m=>m.file.kind==="document"&&m.file.url.startsWith("blob:")&&m.file.mimeType==="text/plain"));
  assert.ok(files.some(m=>m.file.kind==="video"&&m.file.url.endsWith(".mp4")&&m.file.poster));
  assert.ok(files.some(m=>m.file.kind==="image"&&m.file.url.endsWith(".svg")));
  assert.equal(c.messages.at(-1).body,c.preview);
 }
 seedMediaFixtures(data);
 assert.equal(mediaEntries(data).length,200,"fixtures do not duplicate media on reseeding");
});
test("Inbox and contacts filters still work across dozens of conversations",()=>{
 const all=fixtures;
 const channels=["wa-sales","web-support","wa-help","team"].map(id=>({id,enabled:true}));
 const base={channels,canAccess:c=>c.assigned,nameOf:c=>c.name,conversationMatchesChannels};
 const visible=filterInboxConversations(all,{...base});
 const unread=filterInboxConversations(all,{...base,filter:"unread"});
 const onlySales=filterInboxConversations(all,{...base,selectedChannels:new Set(["wa-sales"])});
 const query=filterInboxConversations(all,{...base,query:"Carolina Mendes"});
 assert.ok(visible.length>=30);
 assert.ok(unread.length>10);
 assert.ok(unread.every(c=>c.unread>0&&c.assigned));
 assert.ok(onlySales.length>5);
 assert.ok(onlySales.every(c=>c.channelId==="wa-sales"&&c.assigned));
 assert.equal(query.length,0,"unassigned chats never appear in assigned-only scope");
 assert.ok(filterAccessibleContacts(all,{...base,query:"Rafael Barbosa"}).some(c=>c.id==="load-002"));
});
